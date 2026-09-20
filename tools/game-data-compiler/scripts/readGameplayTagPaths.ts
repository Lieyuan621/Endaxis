import fs from 'node:fs';

export function readGameplayTagPaths(file: string, text = fs.readFileSync(file, 'utf8')): string[] {
  const block = /GAMEPLAY_TAG_PATHS = Object\.freeze\(\[([\s\S]*?)\]\s+as const\)/.exec(text)?.[1];
  if (!block) throw new Error(`${file}: GAMEPLAY_TAG_PATHS not found`);
  const paths = [...block.matchAll(/^\s*'((?:\\'|[^'])*)',?\s*$/gm)].map(match =>
    match[1]!.replaceAll("\\'", "'").replaceAll('\\\\', '\\'),
  );
  if (paths.length === 0) throw new Error(`${file}: empty GameplayTag path catalog`);
  return paths;
}
