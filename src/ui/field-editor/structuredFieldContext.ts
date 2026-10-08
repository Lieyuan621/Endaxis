import type { SpawnResourceSlot } from './spawnDefinitionSchema';
import type { GraphContainerBoundaries } from './graphSequenceContainerSchema';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { GlobalBuffDraftContext } from '../../application/editor/globalBuffFieldContext';
import type { ComputedRef, InjectionKey } from 'vue';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';

/** The node host supplies exact contract paths for nested blackboard declarations. */
export const structuredFieldContextKey: InjectionKey<
  ComputedRef<{
    readonly ownedNavigationBlocked?: boolean;
    readonly spawnDefinition?: unknown;
    readonly ownedResources?: ReadonlyMap<DefinitionFieldSchema, SpawnResourceSlot>;
    readonly graphBoundaries?: GraphContainerBoundaries;
    readonly graphOperands?: ReadonlySet<DefinitionFieldSchema>;
    readonly items?: unknown;
    readonly globalBuff?: GlobalBuffDraftContext;
    readonly graph?: ActionGraphDefinition;
    /** 区分不同资产内的同名资源，防止字段草稿跨资源复用。 */
    readonly identity?: string;
    readonly kind: string;
    readonly path: readonly (string | number)[];
  }>
> = Symbol('structuredFieldContext');
