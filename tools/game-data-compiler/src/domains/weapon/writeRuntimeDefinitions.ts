import { writeGeneratedDefinitionFiles } from '../../compiler/publication/writeGeneratedDefinitionFiles.ts';
import type { RenderedWeaponDefinitionFileSource } from './renderRuntimeDefinitions.ts';

/** 武器正式定义以完整新目录原子替换，不留下新旧文件混合状态。 */
export function writeWeaponDefinitionFiles(
  outputDirectory: string,
  files: readonly RenderedWeaponDefinitionFileSource[],
): Promise<void> {
  return writeGeneratedDefinitionFiles(outputDirectory, files);
}
