import { describe, expect, it } from 'vitest';

import {
  ABILITY_EVENTS,
  type AbilityEvent,
} from '../../../../packages/game-data-contract/src/abilityEvents';
import { hasAbilityEventActionContextBinding } from '../../../core/combat/events/abilityEventActionContext';
import { gameDataRepository } from '../../../data/gameDataRepository';

const abilityEvents = new Set<string>(ABILITY_EVENTS);

describe('正式数据 AbilityEvent 动作环境覆盖', () => {
  it('读取 InputTarget 或命名 trigger 的事件动作树必须登记公共方向', () => {
    const failures: string[] = [];
    const roots: readonly [string, unknown][] = [
      ['commonBuffDefinitions', gameDataRepository.getCommonBuffDefinitions?.()],
      ['commonAbilityEntityDefinitions', gameDataRepository.getCommonAbilityEntityDefinitions?.()],
      ['operators', gameDataRepository.getOperators()],
      ['weapons', gameDataRepository.getWeapons()],
      ['gears', gameDataRepository.getGears()],
      ['gearSets', gameDataRepository.getGearSets()],
    ];

    for (const [path, value] of roots) collectMissingBindings(value, path, failures, new WeakSet());
    expect(failures).toEqual([]);
  });
});

function collectMissingBindings(
  value: unknown,
  path: string,
  failures: string[],
  visited: WeakSet<object>,
): void {
  if (typeof value !== 'object' || value === null) return;
  if (visited.has(value)) return;
  visited.add(value);

  if (!Array.isArray(value)) {
    const record = value as Readonly<Record<string, unknown>>;
    const event =
      typeof record.abilityEvent === 'string'
        ? record.abilityEvent
        : typeof record.event === 'string'
          ? record.event
          : undefined;
    if (event !== undefined && abilityEvents.has(event) && record.sequence !== undefined) {
      const readsInputTarget = containsLiteral(record.sequence, 'actionInputTarget', new WeakSet());
      const readsTrigger = containsNamedTargetGroup(record.sequence, 'trigger', new WeakSet());
      if (
        (readsInputTarget || readsTrigger) &&
        !hasAbilityEventActionContextBinding(event as AbilityEvent)
      ) {
        failures.push(
          `${path}: event '${event}' reads ${[
            ...(readsInputTarget ? ['actionInputTarget'] : []),
            ...(readsTrigger ? ["context group 'trigger'"] : []),
          ].join(' and ')} without a binding`,
        );
      }
    }
  }

  for (const [key, child] of Object.entries(value)) {
    collectMissingBindings(child, `${path}.${key}`, failures, visited);
  }
}

function containsNamedTargetGroup(
  value: unknown,
  group: string,
  visited: WeakSet<object>,
): boolean {
  if (typeof value !== 'object' || value === null || visited.has(value)) return false;
  visited.add(value);
  if (!Array.isArray(value)) {
    const record = value as Readonly<Record<string, unknown>>;
    if (record.contextKey === group || record.targetGroupKey === group) return true;
  }
  return Object.values(value).some(child => containsNamedTargetGroup(child, group, visited));
}

function containsLiteral(value: unknown, literal: string, visited: WeakSet<object>): boolean {
  if (value === literal) return true;
  if (typeof value !== 'object' || value === null || visited.has(value)) return false;
  visited.add(value);
  return Object.values(value).some(child => containsLiteral(child, literal, visited));
}
