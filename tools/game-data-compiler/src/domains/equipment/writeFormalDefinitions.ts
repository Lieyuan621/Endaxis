import {
  checkGeneratedDefinitionFiles,
  writeGeneratedDefinitionFiles,
} from '../../compiler/publication/writeGeneratedDefinitionFiles.ts';
import type { RenderedEquipmentDefinitionFileSource } from './renderFormalDefinitions.ts';

/** 装备领域保留稳定入口，原子写盘语义由公共生成器实现。 */
export function writeEquipmentDefinitionFiles(
  outputDirectory: string,
  files: readonly RenderedEquipmentDefinitionFileSource[],
): Promise<void> {
  return writeGeneratedDefinitionFiles(outputDirectory, files);
}

/** 只读核对正式装备目录，供单件与套装生成入口的 `--check` 共用。 */
export function checkEquipmentDefinitionFiles(
  outputDirectory: string,
  files: readonly RenderedEquipmentDefinitionFileSource[],
): void {
  checkGeneratedDefinitionFiles(outputDirectory, files);
}
