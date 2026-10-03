import type { InjectionKey } from 'vue';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';

export interface OwnedActionResourceRequest {
  readonly nodeId: string;
  readonly graph: ActionGraphDefinition | undefined;
  readonly scope: string | undefined;
  readonly path: readonly (string | number)[];
  readonly resource: unknown;
}
export interface OwnedResourceLink {
  readonly open: () => void | Promise<void>;
}
/** A workspace resolves actual owner paths; standalone inspectors explicitly lack navigation. */
export const ownedActionResourceNavigationKey: InjectionKey<
  (request: OwnedActionResourceRequest) => OwnedResourceLink | undefined
> = Symbol('ownedActionResourceNavigation');
export const ownedResourceNavigationKey: InjectionKey<
  (path: readonly (string | number)[], resource: unknown) => OwnedResourceLink | undefined
> = Symbol('ownedResourceNavigation');
