import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { renameWithRetry } from '../../io.ts';

export interface PublishGameDataCandidateArguments {
  readonly projectRoot: string;
  readonly candidateRoot: string;
  readonly directoryOutputs: readonly string[];
  readonly fileOutputs: readonly string[];
}

interface PreparedOutput {
  readonly relative: string;
  readonly target: string;
  readonly staged: string;
  readonly backup: string;
  readonly kind: 'directory' | 'file';
  previousKind: 'directory' | 'file' | undefined;
  mutationStarted: boolean;
}

interface TreeEntry {
  readonly relative: string;
  readonly kind: 'directory' | 'file';
}

function resolveContained(root: string, relative: string, context: string) {
  if (!relative || path.isAbsolute(relative)) throw new Error(`${context}: expected relative path`);
  const normalized = relative.replaceAll('\\', '/');
  if (normalized.split('/').some(segment => !segment || segment === '.' || segment === '..'))
    throw new Error(`${context}: unsafe path ${relative}`);
  const resolved = path.resolve(root, ...normalized.split('/'));
  if (resolved === root || !resolved.startsWith(root + path.sep))
    throw new Error(`${context}: path escapes root: ${relative}`);
  return resolved;
}

async function pathKind(value: string): Promise<'directory' | 'file' | undefined> {
  try {
    const stat = await fs.lstat(value);
    if (stat.isSymbolicLink()) throw new Error(`link is not allowed: ${value}`);
    if (stat.isDirectory()) return 'directory';
    if (stat.isFile()) return 'file';
    throw new Error(`unsupported filesystem entry: ${value}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function assertNoLinks(root: string, context: string) {
  const stat = await fs.lstat(root);
  if (stat.isSymbolicLink()) throw new Error(`${context}: link is not allowed: ${root}`);
  if (!stat.isDirectory()) return;
  for (const entry of await fs.readdir(root, { withFileTypes: true }))
    await assertNoLinks(path.join(root, entry.name), context);
}

function assertNonOverlapping(outputs: readonly string[]) {
  const normalized = outputs.map(value => value.replaceAll('\\', '/'));
  if (new Set(normalized).size !== normalized.length)
    throw new Error('publication outputs contain duplicates');
  for (const left of normalized) {
    for (const right of normalized) {
      if (left !== right && right.startsWith(left + '/'))
        throw new Error(`publication outputs overlap: ${left} and ${right}`);
    }
  }
}

async function readTree(root: string): Promise<TreeEntry[]> {
  const result: TreeEntry[] = [];
  async function visit(current: string, relative: string) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const childRelative = relative ? path.join(relative, entry.name) : entry.name;
      const child = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`link is not allowed: ${child}`);
      if (entry.isDirectory()) {
        result.push({ relative: childRelative, kind: 'directory' });
        await visit(child, childRelative);
      } else if (entry.isFile()) {
        result.push({ relative: childRelative, kind: 'file' });
      } else throw new Error(`unsupported filesystem entry: ${child}`);
    }
  }
  await visit(root, '');
  return result;
}

async function installFile(source: string, target: string) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.rm(target, { force: true });
  await renameWithRetry(source, target);
}

/** Synchronize one already-validated directory without renaming its watched root. */
async function installDirectory(source: string, target: string) {
  const sourceEntries = await readTree(source);
  const targetKind = await pathKind(target);
  if (targetKind === 'file') await fs.rm(target, { force: true });
  await fs.mkdir(target, { recursive: true });
  const targetEntries = await readTree(target);
  const sourceByRelative = new Map(sourceEntries.map(entry => [entry.relative, entry.kind]));

  for (const entry of [...targetEntries].sort(
    (left, right) => right.relative.length - left.relative.length,
  )) {
    const wanted = sourceByRelative.get(entry.relative);
    if (wanted && wanted !== entry.kind)
      await fs.rm(path.join(target, entry.relative), { recursive: true, force: true });
  }
  for (const entry of sourceEntries.filter(entry => entry.kind === 'directory'))
    await fs.mkdir(path.join(target, entry.relative), { recursive: true });
  for (const entry of sourceEntries.filter(entry => entry.kind === 'file'))
    await installFile(path.join(source, entry.relative), path.join(target, entry.relative));

  for (const entry of targetEntries.filter(entry => entry.kind === 'file')) {
    if (!sourceByRelative.has(entry.relative))
      await fs.rm(path.join(target, entry.relative), { force: true });
  }
  for (const entry of targetEntries
    .filter(entry => entry.kind === 'directory')
    .sort((left, right) => right.relative.length - left.relative.length)) {
    if (!sourceByRelative.has(entry.relative))
      await fs.rm(path.join(target, entry.relative), { recursive: true, force: true });
  }
}

async function installPath(kind: 'directory' | 'file', source: string, target: string) {
  if (kind === 'directory') await installDirectory(source, target);
  else {
    const targetKind = await pathKind(target);
    if (targetKind === 'directory') await fs.rm(target, { recursive: true, force: true });
    await installFile(source, target);
  }
}

/**
 * Publish a fully validated candidate as one recoverable file transaction.
 *
 * Every existing output is copied to a private backup before the first formal target is touched.
 * Files are replaced individually and directory contents are reconciled exactly. This avoids
 * renaming watched source directories, which Windows rejects while the development server is
 * running. A later failure restores every mutated output from the backups in reverse order.
 * Callers must run all semantic/type/simulation/source-freeze gates before invoking this.
 */
export async function publishGameDataCandidate(args: PublishGameDataCandidateArguments) {
  const projectRoot = await fs.realpath(args.projectRoot);
  const candidateRoot = await fs.realpath(args.candidateRoot);
  if (candidateRoot === projectRoot || !candidateRoot.startsWith(projectRoot + path.sep))
    throw new Error('candidate root must be contained by the project root');

  const specifications = [
    ...args.directoryOutputs.map(relative => ({ relative, kind: 'directory' as const })),
    ...args.fileOutputs.map(relative => ({ relative, kind: 'file' as const })),
  ];
  assertNonOverlapping(specifications.map(item => item.relative));
  if (specifications.length === 0) throw new Error('publication output set is empty');

  const transactionRoot = path.join(
    projectRoot,
    'tmp',
    `game-data-publish-${process.pid}-${randomBytes(6).toString('hex')}`,
  );
  const stagedRoot = path.join(transactionRoot, 's');
  const backupRoot = path.join(transactionRoot, 'b');
  await fs.mkdir(stagedRoot, { recursive: true });
  await fs.mkdir(backupRoot, { recursive: true });

  const prepared: PreparedOutput[] = [];
  try {
    // Finish all source and target validation and backup I/O before formal mutation begins.
    for (const [index, specification] of specifications.entries()) {
      const source = resolveContained(candidateRoot, specification.relative, 'candidate output');
      const sourceKind = await pathKind(source);
      if (sourceKind !== specification.kind)
        throw new Error(
          `candidate output has wrong kind (${specification.kind} expected): ${specification.relative}`,
        );
      await assertNoLinks(source, `candidate output ${specification.relative}`);

      const target = resolveContained(projectRoot, specification.relative, 'publication target');
      const parent = path.dirname(target);
      await fs.mkdir(parent, { recursive: true });
      const resolvedParent = await fs.realpath(parent);
      if (path.resolve(resolvedParent) !== path.resolve(parent))
        throw new Error(`publication target parent is a link: ${parent}`);
      const targetKind = await pathKind(target);
      if (targetKind) await assertNoLinks(target, `publication target ${specification.relative}`);

      const staged = path.join(stagedRoot, String(index));
      const backup = path.join(backupRoot, String(index));
      if (specification.kind === 'directory') await fs.cp(source, staged, { recursive: true });
      else await fs.copyFile(source, staged);
      if (targetKind === 'directory') await fs.cp(target, backup, { recursive: true });
      else if (targetKind === 'file') await fs.copyFile(target, backup);
      prepared.push({
        ...specification,
        target,
        staged,
        backup,
        previousKind: targetKind,
        mutationStarted: false,
      });
    }

    for (const output of prepared) {
      output.mutationStarted = true;
      await installPath(output.kind, output.staged, output.target);
    }

    await fs.rm(transactionRoot, { recursive: true, force: true });
    return {
      directoryCount: args.directoryOutputs.length,
      fileCount: args.fileOutputs.length,
      outputs: specifications.map(item => item.relative),
    };
  } catch (error) {
    const rollbackErrors: string[] = [];
    for (const output of [...prepared].reverse()) {
      if (!output.mutationStarted) continue;
      try {
        if (output.previousKind)
          await installPath(output.previousKind, output.backup, output.target);
        else await fs.rm(output.target, { recursive: true, force: true });
      } catch (rollbackError) {
        rollbackErrors.push(
          `${output.relative}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        );
      }
    }
    if (rollbackErrors.length)
      throw new AggregateError(
        [error, ...rollbackErrors.map(message => new Error(message))],
        `game-data publication failed and rollback was incomplete; backups retained at ${transactionRoot}`,
      );
    await fs.rm(transactionRoot, { recursive: true, force: true });
    throw error;
  }
}
