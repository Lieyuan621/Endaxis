/** 更新 Buff 的属性修正；新修正全部注册成功后，才移除旧修正并替换归属。 */
import type { CombatAttributeModifier } from '../state/foundationState';
import type { BuffAttributeState } from '../state/instanceState';

export interface BuffAttributeHost<Key extends string> {
  addModifier(modifier: CombatAttributeModifier<Key>): void;
  removeModifier(modifier: CombatAttributeModifier<Key>): boolean;
}

export function removeBuffAttributeModifiers<Key extends string>(
  state: BuffAttributeState<Key>,
  host: BuffAttributeHost<Key>,
): void {
  for (const modifier of state.modifiers) host.removeModifier(modifier);
}

export function replaceBuffAttributeModifiers<Key extends string>(
  state: BuffAttributeState<Key>,
  enabled: boolean,
  replacements: readonly CombatAttributeModifier<Key>[],
  host: BuffAttributeHost<Key>,
): void {
  if (enabled) {
    let registeredCount = 0;
    try {
      for (const modifier of replacements) {
        host.addModifier(modifier);
        registeredCount += 1;
      }
    } catch (error) {
      for (const modifier of replacements.slice(0, registeredCount)) {
        host.removeModifier(modifier);
      }
      throw error;
    }
    removeBuffAttributeModifiers(state, host);
  }
  state.modifiers = replacements;
}
