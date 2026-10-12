import { imageCatalog } from '../imageCatalog.generated';
import { isImageRef } from '../core/game-data/definitionGuards';

const paths = new Map(imageCatalog.map(entry => [entry.ref, entry.path]));
export function resolveImage(ref: unknown): string | undefined {
  return isImageRef(ref) ? paths.get(ref) : undefined;
}
export { imageCatalog, isImageRef };
