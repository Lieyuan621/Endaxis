import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  extractInspectorStructures,
  formatConditionSchema,
  formatStepSchema,
  formatModifierSchema,
  formatContributionSchema,
  formatEventSchema,
} from './contractSchema.ts';

/** 所有结构共享一次提取，全部成功后才写入；内容未变时不触发无意义的热更新。 */
export function syncInspectorSchema(root: string): string[] {
  const structures = extractInspectorStructures(root);
  const outputs = [
    ['conditionStructure.generated.ts', formatConditionSchema(root, structures)],
    ['stepStructure.generated.ts', formatStepSchema(root, structures)],
    ['modifierStructure.generated.ts', formatModifierSchema(root, structures)],
    ['contributionStructure.generated.ts', formatContributionSchema(root, structures)],
    ['eventStructure.generated.ts', formatEventSchema(root, structures)],
  ] as const;
  const changed: string[] = [];
  const outputDirectory = resolve(root, 'src/ui/timeline/definitions/inspector');
  mkdirSync(outputDirectory, { recursive: true });
  for (const [name, content] of outputs) {
    const path = resolve(outputDirectory, name);
    if (existsSync(path) && readFileSync(path, 'utf8').replace(/\r\n/g, '\n') === content) continue;
    writeFileSync(path, content);
    changed.push(path);
  }
  return changed;
}
