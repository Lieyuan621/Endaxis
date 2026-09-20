import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  projectOperatorPassiveUiSnapshotRoot,
  renderOperatorPassiveUiPrefabCatalog,
} from '../src/source/operatorPassiveUiPrefabSnapshots.ts';

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

const snapshotRoot = argumentValue('--snapshot-root');
if (snapshotRoot === undefined) {
  throw new Error(
    'usage: --snapshot-root <VFS object snapshot root> [--output <generated.ts>] [--check]',
  );
}
const output = resolve(
  argumentValue('--output') ??
    'tools/game-data-compiler/src/source/operatorPassiveUiPrefabCatalog.generated.ts',
);
const catalog = projectOperatorPassiveUiSnapshotRoot(resolve(snapshotRoot));
const prettierConfig = await resolveConfig(output);
const content = await format(renderOperatorPassiveUiPrefabCatalog(catalog), {
  ...prettierConfig,
  parser: 'typescript',
});
if (process.argv.includes('--check')) {
  if (!existsSync(output) || readFileSync(output, 'utf8') !== content) {
    throw new Error(`generated operator passive UI prefab catalog is stale: ${output}`);
  }
  console.log(`checked ${Object.keys(catalog).length} passive UI prefab definitions: ${output}`);
  process.exit(0);
}
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, content, 'utf8');
console.log(`generated ${Object.keys(catalog).length} passive UI prefab definitions: ${output}`);
