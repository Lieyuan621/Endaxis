import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';

import ts from 'typescript';

interface Arguments {
  readonly file: string;
  readonly top: number;
}

interface SubtreeOccurrence {
  count: number;
  readonly bytes: number;
  readonly call: string;
  readonly sampleLine: number;
}

function parseArguments(argv: readonly string[]): Arguments {
  let file: string | undefined;
  let top = 20;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--file') file = argv[++index];
    else if (argument === '--top') top = Number(argv[++index]);
    else throw new Error(`unknown argument '${argument}'`);
  }
  if (file === undefined || file.length === 0) throw new Error('--file is required');
  if (!Number.isInteger(top) || top <= 0) throw new Error('--top must be a positive integer');
  return { file: path.resolve(file), top };
}

function exportedVariableName(statement: ts.Statement): string | undefined {
  if (!ts.isVariableStatement(statement)) return undefined;
  if (!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
    return undefined;
  }
  const declaration = statement.declarationList.declarations[0];
  return declaration !== undefined && ts.isIdentifier(declaration.name)
    ? declaration.name.text
    : undefined;
}

function callName(node: ts.CallExpression, source: ts.SourceFile): string {
  return node.expression.getText(source);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isGeneratedIdentity(value: string): boolean {
  return (
    value.startsWith('SkillData.') ||
    value.includes(':/scheduledSequences/') ||
    value.includes(':/eventListeners/') ||
    value.includes(':/lifecycleSequences/')
  );
}

/**
 * 只在审计指纹中抹掉生成位置身份。它不会参与生成，也不能作为可合并证明；用途是区分
 * “真正完全相同”与“结构相同但稳定 step/source key 不同”的重复子树。
 */
function identityNormalizedText(node: ts.Node, source: ts.SourceFile): string {
  const text = node.getText(source);
  const replacements: { readonly start: number; readonly end: number }[] = [];
  const visit = (child: ts.Node) => {
    if (ts.isStringLiteral(child) && isGeneratedIdentity(child.text)) {
      replacements.push({
        start: child.getStart(source) - node.getStart(source),
        end: child.end - node.getStart(source),
      });
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  let normalized = text;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    normalized = `${normalized.slice(0, replacement.start)}'__generated_identity__'${normalized.slice(replacement.end)}`;
  }
  return normalized.replace(/\s+/g, '');
}

function recordSubtree(
  map: Map<string, SubtreeOccurrence>,
  fingerprint: string,
  node: ts.CallExpression,
  source: ts.SourceFile,
) {
  const existing = map.get(fingerprint);
  if (existing !== undefined) {
    existing.count += 1;
    return;
  }
  const text = node.getText(source);
  map.set(fingerprint, {
    count: 1,
    bytes: Buffer.byteLength(text),
    call: callName(node, source),
    sampleLine: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
  });
}

function duplicateReport(entries: ReadonlyMap<string, SubtreeOccurrence>, top: number) {
  return [...entries.values()]
    .filter(entry => entry.count > 1)
    .map(entry => ({
      ...entry,
      duplicateBytes: entry.bytes * (entry.count - 1),
    }))
    .sort((left, right) => right.duplicateBytes - left.duplicateBytes)
    .slice(0, top);
}

const args = parseArguments(process.argv.slice(2));
const text = fs.readFileSync(args.file, 'utf8');
const source = ts.createSourceFile(args.file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const exportedStatements = source.statements
  .map(statement => ({ statement, name: exportedVariableName(statement) }))
  .filter((entry): entry is { statement: ts.Statement; name: string } => entry.name !== undefined);
const callCounts = new Map<string, number>();
const exactSubtrees = new Map<string, SubtreeOccurrence>();
const normalizedSubtrees = new Map<string, SubtreeOccurrence>();

const exports = exportedStatements.map(({ statement, name }, index) => {
  const next = exportedStatements[index + 1]?.statement.getStart(source) ?? source.end;
  let nodeCount = 0;
  let callCount = 0;
  const localCalls = new Map<string, number>();
  const visit = (node: ts.Node) => {
    nodeCount += 1;
    if (ts.isCallExpression(node)) {
      callCount += 1;
      const name = callName(node, source);
      callCounts.set(name, (callCounts.get(name) ?? 0) + 1);
      localCalls.set(name, (localCalls.get(name) ?? 0) + 1);
      recordSubtree(exactSubtrees, hash(node.getText(source).replace(/\s+/g, '')), node, source);
      recordSubtree(normalizedSubtrees, hash(identityNormalizedText(node, source)), node, source);
    }
    ts.forEachChild(node, visit);
  };
  visit(statement);
  const startLine = source.getLineAndCharacterOfPosition(statement.getStart(source)).line + 1;
  const endLine = source.getLineAndCharacterOfPosition(next).line + 1;
  return {
    name,
    startLine,
    lines: endLine - startLine,
    bytes: Buffer.byteLength(text.slice(statement.getStart(source), next)),
    nodeCount,
    callCount,
    calls: Object.fromEntries([...localCalls].sort((left, right) => right[1] - left[1])),
  };
});

process.stdout.write(
  `${JSON.stringify(
    {
      file: args.file,
      bytes: Buffer.byteLength(text),
      lines: source.getLineAndCharacterOfPosition(source.end).line + 1,
      exports,
      callCounts: Object.fromEntries([...callCounts].sort((left, right) => right[1] - left[1])),
      exactDuplicateSubtrees: duplicateReport(exactSubtrees, args.top),
      identityNormalizedDuplicateSubtrees: duplicateReport(normalizedSubtrees, args.top),
    },
    null,
    2,
  )}\n`,
);
