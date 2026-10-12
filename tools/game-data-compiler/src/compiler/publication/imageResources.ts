import type { ImageRef } from '../../../../../packages/game-data-contract/src/primitives.ts';

/** 导出阶段建立图片身份；消费端通过资源目录解析，不自行反推路径。 */
export function imageRefFromPath(publicPath: string): ImageRef {
  if (
    !/^\/(?:operators|icons|weapons|equipment|enemies|consumables|contingency_contract)\/[a-zA-Z0-9_ /-]+\.webp$/.test(
      publicPath,
    )
  )
    throw new Error(`Unsupported game image path: ${publicPath}`);
  return 'endaxis:' + publicPath.slice(1, -5).replaceAll(' ', '_');
}
/** 当前导出布局；仅生成与资源闭包工具使用，浏览器查询生成目录。 */
export function imagePathForExport(ref: ImageRef): string {
  if (!/^endaxis:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(ref))
    throw new Error(`Unknown image resource: ${ref}`);
  let relative = ref.slice('endaxis:'.length);
  relative = relative.replace(
    /^(operators\/[^/]+\/)(battle|combo|ultimate|talent)_(\d+)$/,
    '$1$2 $3',
  );
  return '/' + relative + '.webp';
}
