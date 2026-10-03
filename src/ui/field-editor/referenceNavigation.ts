import type { InjectionKey } from 'vue';
import type { ReferenceNavigationTarget } from '@/application/editor/referenceResolver';

export type ReferenceNavigator = (target: ReferenceNavigationTarget) => void | Promise<void>;
/** Hosts provide navigation independently of field/target edit permissions. */
export const referenceNavigationKey: InjectionKey<ReferenceNavigator> =
  Symbol('referenceNavigation');
