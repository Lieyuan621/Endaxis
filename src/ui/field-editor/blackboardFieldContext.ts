import { computed, inject, type ComputedRef, type InjectionKey } from 'vue';
import {
  unknownBlackboardContext,
  type BlackboardFieldContext,
} from '../../application/editor/blackboardFieldContext';

export const blackboardFieldContextKey: InjectionKey<ComputedRef<BlackboardFieldContext>> =
  Symbol('blackboardFieldContext');
export function useBlackboardFieldContext() {
  return inject(
    blackboardFieldContextKey,
    computed(() => unknownBlackboardContext()),
  );
}
export type BlackboardNavigator = (target: { owner: 'action' | 'data'; id: string }) => void;
export const blackboardNavigationKey: InjectionKey<BlackboardNavigator> =
  Symbol('blackboardNavigation');
