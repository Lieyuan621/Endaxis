import type { ActionGraphAddress } from '../../application/editor/actionGraphResourceEditing';
import { toRaw } from 'vue';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type {
  OwnedActionResourceRequest,
  OwnedResourceLink,
} from '../field-editor/ownedResourceNavigation';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';

export interface OwnedActionResourceHost {
  identity(): string;
  scope(): string;
  ownerPath(): readonly (string | number)[];
  address(): ActionGraphAddress;
  graph(): ActionGraphDefinition;
  definition(): unknown;
  hasResource(path: readonly (string | number)[]): boolean;
  flush(): boolean;
  reject?(): void;
  open(path: readonly (string | number)[]): void | Promise<void>;
}
/** Capture the original exact location. Flushing must never turn a stale button into
 * navigation to a different spawn or owner, even when node IDs are reused. */
export function ownedActionResourceLink(
  host: OwnedActionResourceHost,
  request: OwnedActionResourceRequest,
): OwnedResourceLink | undefined {
  const { path } = request;
  if (
    path[0] !== 'parameters' ||
    path[1] !== 'definition' ||
    !(
      (path.length === 3 && path[2] === 'childSkill') ||
      (path.length === 4 && path[2] === 'childSkills' && typeof path[3] === 'string') ||
      (path.length === 4 &&
        path[2] === 'passiveSkills' &&
        typeof path[3] === 'number' &&
        Number.isInteger(path[3]) &&
        path[3] >= 0)
    )
  )
    return;
  if (
    request.scope !== host.scope() ||
    request.graph !== toRaw(host.graph()) ||
    host.graph().nodes[request.nodeId]?.action.kind !== 'spawnAbilityEntity'
  )
    return;
  const address = host.address();
  const absolute = [
    ...host.ownerPath(),
    'actionGraph',
    ...(address.kind === 'main' ? ['main'] : ['macros', address.macroId, 'graph']),
    'nodes',
    request.nodeId,
    'action',
    ...path,
  ];
  const identity = host.identity();
  const scope = host.scope();
  const exists = () =>
    host.hasResource(absolute) &&
    toRaw(fieldValueAt(host.definition(), absolute)) === request.resource;
  if (!exists()) return;
  return {
    open: async () => {
      if (!host.flush() || identity !== host.identity() || scope !== host.scope() || !exists()) {
        host.reject?.();
        return;
      }
      await host.open(absolute);
    },
  };
}
