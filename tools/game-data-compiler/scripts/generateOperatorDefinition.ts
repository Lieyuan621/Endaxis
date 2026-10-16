/**
 * 正式单干员生成入口。只编译目标干员及其引用的公共资源，
 * 不改公共目录或其他干员，也不要求其他领域编译成功。
 */
import fs from 'node:fs';
import path from 'node:path';
import type { planOperatorDefinition } from './planOperatorDefinition.ts';
import { renderOperatorDefinitionBatch } from './generateOperatorDefinitionCandidates.ts';
import {
  writeGeneratedDefinitionFile,
  writeGeneratedDefinitionFiles,
} from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';

export async function generateOperatorDefinition(
  args: Parameters<typeof planOperatorDefinition>[0] & {
    readonly check: boolean;
  },
) {
  for (const [directory, expected] of [
    [args.output, path.resolve('src/data/operators')],
    [args.auditOutput, path.resolve('tmp/game-data-audit/operator-definitions', args.slug)],
  ]) {
    if (path.resolve(directory!) !== expected)
      throw new Error(`complete operator output must be ${expected}`);
  }
  const rendered = await renderOperatorDefinitionBatch({
    ...args,
    outputRoot: args.output,
    auditRoot: path.dirname(args.auditOutput),
    includeCommonBuffs: true,
    selectedSlug: args.slug,
  });
  const file = rendered.files[0]!;
  if (args.check) {
    const target = path.join(args.output, file.relativePath);
    if (
      !fs.existsSync(target) ||
      fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n') !== file.content
    )
      throw new Error(`complete operator definition is stale: ${target}`);
  } else {
    await writeGeneratedDefinitionFiles(args.auditOutput, [
      { ...rendered.auditFiles[0]!, relativePath: 'operator.audit.json' },
    ]);
    await writeGeneratedDefinitionFile(args.output, file);
  }
  return rendered.summary.operators.find(operator => operator.slug === args.slug)!;
}
