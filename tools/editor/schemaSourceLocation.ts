/** 声明定位不受检出路径、依赖软链或换行符影响；虚拟夹具允许文件尚未落盘。 */
import { realpathSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const physicalPaths = new Map<string, string>();
export function physicalPath(path: string): string {
  const absolute = resolve(path);
  const known = physicalPaths.get(absolute);
  if (known) return known;
  let physical: string;
  try {
    physical = realpathSync.native(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = dirname(absolute);
    physical = parent === absolute ? absolute : resolve(physicalPath(parent), basename(absolute));
  }
  physicalPaths.set(absolute, physical);
  return physical;
}

export function schemaSourceLocation(root: string) {
  const physicalRoot = physicalPath(root);
  const libraryRoot = physicalPath(dirname(ts.getDefaultLibFilePath({})));
  function filePath(file: string): string {
    const physical = physicalPath(file);
    // TypeScript 的内置 Array/Record 声明也参与递归身份，不能带入依赖的安装绝对路径。
    return dirname(physical) === libraryRoot && /^lib\..*\.d\.ts$/.test(basename(physical))
      ? `node_modules/typescript/lib/${basename(physical)}`
      : relative(physicalRoot, physical).replaceAll('\\', '/');
  }
  function location(node: ts.Node) {
    const source = node.getSourceFile();
    return {
      file: filePath(source.fileName),
      position: source.getLineAndCharacterOfPosition(node.pos),
      end: source.getLineAndCharacterOfPosition(node.end),
    };
  }
  return { filePath, location };
}

export function isSchemaGeneratorMain(moduleUrl: string): boolean {
  return (
    !!process.argv[1] && physicalPath(process.argv[1]) === physicalPath(fileURLToPath(moduleUrl))
  );
}
