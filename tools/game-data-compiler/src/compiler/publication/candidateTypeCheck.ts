import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export interface CandidateTypeCheckArguments {
  readonly projectRoot: string;
  readonly candidateRoot: string;
  readonly configFile: string;
  /** 相对项目根目录；文件按单文件覆盖，目录按完整目录替换。 */
  readonly replacementPaths: readonly string[];
}

/**
 * 把隔离候选映射到其未来正式路径后执行 TypeScript 检查。
 * 这里只替换编译器读视图，不复制、不改名、更不覆盖工作树中的正式文件。
 */
export function typeCheckCandidateOverlay(args: CandidateTypeCheckArguments) {
  const projectRoot = fs.realpathSync(args.projectRoot);
  const candidateRoot = fs.realpathSync(args.candidateRoot);
  const configFile = path.resolve(projectRoot, args.configFile);
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  if (config.error) throw new Error(formatDiagnostics([config.error], projectRoot));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configFile));
  if (parsed.errors.length) throw new Error(formatDiagnostics(parsed.errors, projectRoot));

  const overlays = new Map<string, { readonly target: string; readonly source: string }>();
  const replacedDirectories: string[] = [];
  const virtualDirectories = new Map<string, string>();
  for (const relativePath of args.replacementPaths) {
    const candidate = path.resolve(candidateRoot, relativePath);
    if (!isWithin(candidateRoot, candidate))
      throw new Error(`candidate replacement escapes candidate root: ${relativePath}`);
    if (!fs.existsSync(candidate))
      throw new Error(`candidate replacement is missing: ${relativePath}`);
    const target = path.resolve(projectRoot, relativePath);
    if (!isWithin(projectRoot, target))
      throw new Error(`candidate target escapes project: ${relativePath}`);
    const stat = fs.statSync(candidate);
    if (stat.isDirectory()) {
      replacedDirectories.push(target);
      for (const file of walkFiles(candidate)) {
        const targetFile = path.join(target, path.relative(candidate, file));
        overlays.set(normalize(targetFile), { target: targetFile, source: file });
        for (let directory = path.dirname(targetFile); isWithin(target, directory);) {
          virtualDirectories.set(normalize(directory), directory);
          if (normalize(directory) === normalize(target)) break;
          directory = path.dirname(directory);
        }
      }
    } else if (stat.isFile()) {
      overlays.set(normalize(target), { target, source: candidate });
    } else {
      throw new Error(`candidate replacement is neither file nor directory: ${candidate}`);
    }
  }
  if (overlays.size === 0) throw new Error('candidate overlay has no generated files');

  const dataRoot = path.join(projectRoot, 'src/data');
  const rootNames = parsed.fileNames
    .filter(file => isWithin(dataRoot, file) && isTypeScript(file))
    .filter(file => !isMasked(file, replacedDirectories, overlays));
  for (const overlay of overlays.values()) {
    if (isTypeScript(overlay.target)) rootNames.push(overlay.target);
  }

  const original = ts.createCompilerHost(parsed.options);
  const originalFileExists = original.fileExists.bind(original);
  const originalReadFile = original.readFile.bind(original);
  const originalDirectoryExists = original.directoryExists?.bind(original);
  const originalGetDirectories = original.getDirectories?.bind(original);
  original.fileExists = file => {
    const key = normalize(file);
    if (overlays.has(key)) return true;
    if (isMasked(file, replacedDirectories, overlays)) return false;
    return originalFileExists(file);
  };
  original.readFile = file => {
    const key = normalize(file);
    const overlay = overlays.get(key);
    if (overlay) return fs.readFileSync(overlay.source, 'utf8');
    if (isMasked(file, replacedDirectories, overlays)) return undefined;
    return originalReadFile(file);
  };
  original.directoryExists = directory => {
    if (virtualDirectories.has(normalize(directory))) return true;
    if (replacedDirectories.some(root => isWithin(root, directory))) return false;
    return originalDirectoryExists?.(directory) ?? fs.existsSync(directory);
  };
  original.getDirectories = directory => {
    if (replacedDirectories.some(root => isWithin(root, directory))) {
      const children = new Set<string>();
      for (const resolved of virtualDirectories.values()) {
        if (normalize(path.dirname(resolved)) === normalize(directory)) children.add(resolved);
      }
      return [...children];
    }
    return originalGetDirectories?.(directory) ?? [];
  };
  original.getSourceFile = (fileName, languageVersionOrOptions, onError) => {
    const text = original.readFile(fileName);
    if (text === undefined) {
      onError?.(`file not found: ${fileName}`);
      return undefined;
    }
    return ts.createSourceFile(fileName, text, languageVersionOrOptions, true);
  };

  const program = ts.createProgram(
    [...new Set(rootNames.map(file => path.resolve(file)))],
    parsed.options,
    original,
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(formatDiagnostics(diagnostics, projectRoot));
  return {
    rootFileCount: program.getRootFileNames().length,
    overlayFileCount: overlays.size,
    replacedDirectories: replacedDirectories.map(directory =>
      path.relative(projectRoot, directory).split(path.sep).join('/'),
    ),
  };
}

function walkFiles(root: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`candidate directory contains a link: ${file}`);
    if (entry.isDirectory()) result.push(...walkFiles(file));
    else if (entry.isFile()) result.push(file);
  }
  return result;
}

function isMasked(
  file: string,
  directories: readonly string[],
  overlays: ReadonlyMap<string, unknown>,
) {
  return directories.some(directory => isWithin(directory, file)) && !overlays.has(normalize(file));
}

function isWithin(root: string, value: string): boolean {
  const relative = path.relative(root, path.resolve(value));
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

function isTypeScript(file: string): boolean {
  return /\.(?:[cm]?ts|tsx)$/.test(file) && !file.endsWith('.d.ts');
}

function normalize(file: string): string {
  const resolved = path.resolve(file);
  return ts.sys.useCaseSensitiveFileNames ? resolved : resolved.toLowerCase();
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[], root: string): string {
  return ts.formatDiagnostics(diagnostics.slice(0, 50), {
    getCanonicalFileName: file => path.relative(root, file) || file,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  });
}
