import { expect, it } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { ActionEntityTagsState } from '../state/actionState';
import { EntityTagOperationExecutor } from './entityTagOperationExecutor';

const tag = 'Status/DisableCastComboSkill';
const target = { kind: 'operator' as const, operatorId: 'operator' };
const step = {
  kind: 'addEntityTags' as const,
  parameters: { targets: { kind: 'owner' as const }, tags: [tag] },
};
const context = () => ({
  blackboard: new ActionBlackboard(),
  actionEntityTagsState: { references: [] } as ActionEntityTagsState,
});

it('按命中的实体结束各自的计数，恢复和重复结束不影响其他来源', () => {
  const entity = new CombatBuffContainer('operator', new CombatAttributeSet());
  let selected = [target];
  const executor = new EntityTagOperationExecutor(
    () => selected,
    () => entity,
    { execute: () => false, evaluate: () => false },
  );
  entity.addEntityTags([tag]);
  const first = context();
  const second = context();
  executor.execute(step, first);
  executor.execute(step, second);
  const restored = {
    ...first,
    actionEntityTagsState: structuredClone(first.actionEntityTagsState),
  };
  selected = [];
  executor.end(step, restored);
  executor.end(step, restored);
  executor.end(step, second);
  expect(entity.hasEntityTag(tag)).toBe(true);
  entity.removeEntityTags([tag]);
  expect(entity.hasEntityTag(tag)).toBe(false);
});

it('同步标签监听结束动作时，不继续添加其余标签或误删其他来源', () => {
  const entity = new CombatBuffContainer('operator', new CombatAttributeSet());
  const next = 'Status/Silence';
  const multiple = { ...step, parameters: { ...step.parameters, tags: [tag, next] } };
  const state = context();
  const executor = new EntityTagOperationExecutor(
    () => [target],
    () => entity,
    { execute: () => false, evaluate: () => false },
  );
  entity.addEntityTags([next]);
  entity.configureEntityTagAdded(() => executor.end(multiple, state));
  expect(executor.execute(multiple, state)).toBe(false);
  expect(entity.hasEntityTag(tag)).toBe(false);
  expect(entity.hasEntityTag(next)).toBe(true);
  entity.removeEntityTags([next]);
  expect(entity.hasEntityTag(next)).toBe(false);
});
