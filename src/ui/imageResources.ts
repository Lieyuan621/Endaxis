import { publicAssetUrl } from '../utils/publicAssetUrl';
import { imageCatalog as sourceImageCatalog } from '../imageCatalog.generated';
import { isImageRef } from '../core/game-data/definitionGuards';

const imageCatalog = sourceImageCatalog.map(entry => ({
  ...entry,
  path: publicAssetUrl(entry.path),
}));

const paths = new Map(imageCatalog.map(entry => [entry.ref, entry.path]));
export function resolveImage(ref: unknown): string | undefined {
  return isImageRef(ref) ? paths.get(ref) : undefined;
}
export { imageCatalog, isImageRef };
