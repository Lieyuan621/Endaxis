import { expect, it } from 'vitest';
import type { CompiledSkillProgram } from '../../../compiler/combatProgram';
import { CombatAttributeSet } from '../../attributes/combatAttributes';
import { CombatBuffContainer } from '../../buffs/combatBuffs';
import { CombatReceiptCollector } from '../../receipt/combatReceipt';
import { CombatStatusContainer } from '../../status/combatStatuses';
import { CombatStatusRuntime } from '../../status/combatStatusRuntime';
import { AbilitySystemRuntime } from '../../abilities/abilitySystemRuntime';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { BuffDefinitionOperationTarget } from '../../buffs/buffDefinitionOperationTarget';
import { CombatClock } from '../../time/combatClock';
import { bindRestoredCombatOperatorCore } from './combatOperatorCoreRestoration';
import { createCombatOperationHostState } from '../../state/actionState';
import { CombatOperationPrograms } from '../../actions/combatOperationPrograms';
import { CombatSkillPrograms } from '../../skills/combatSkillPrograms';
import { SkillCooldown } from '../../skills/skillCooldown';
import { SkillRuntime, type CombatOperationExecutor } from '../../skills/skillRuntime';
import { TimedMarkerContainer } from '../../status/timedMarkers';
import { createOperatorCenterState } from '../../state/abilityState';

const program: CompiledSkillProgram = {
  operatorId: 'operator',
  skillGroupKey: 'battleSkill',
  skillId: 'skill',
  skillType: 'battleSkill',
  skillLevel: 1,
  timelineBlockFrames: 30,
  costs: [],
  initialBlackboard: {},
  timelineActions: [],
  cooldownFrames: 30,
  costFrame: 0,
};

function operations(state: ReturnType<typeof createCombatOperationHostState>) {
  const executor: CombatOperationExecutor = {
    operationHost: { state, programs: new CombatOperationPrograms() },
    execute: () => true,
    evaluate: () => true,
  };
  return executor;
}

it('单个干员核心恢复保持黑板、状态、标记、冷却、技能和能力系统的数据关系', () => {
  const clock = new CombatClock();
  const receipt = new CombatReceiptCollector();
  const blackboard = new ActionBlackboard({ phase: 2 });
  const buffs = new CombatBuffContainer(
    'operator',
    new CombatAttributeSet<string>(),
    undefined,
    null,
    blackboard,
  );
  const statusTemplate = new CombatStatusContainer('operator', [
    {
      statusKey: 'charge',
      applyStacks: 1,
      maxStacks: 3,
      durationFrames: 10,
      durationStacking: 'refresh',
      consumeStacks: 1,
    },
  ]);
  statusTemplate.apply({ statusKey: 'charge', sourceId: 'operator', skillId: 'skill' });
  const markers = new TimedMarkerContainer('operator', clock);
  markers.add('window', 1);
  const scaledClock = { time: 0 };
  markers.add('scaled-window', 1, scaledClock, 'globalScaled');
  const cooldown = new SkillCooldown(30, 0);
  const operationState = createCombatOperationHostState();
  const fixed = new CombatSkillPrograms().register(program);
  const skill = new SkillRuntime(program, {
    clock,
    receipt,
    operations: operations(operationState),
    resources: null,
    allocateSkillCastId: () => 1,
    entityBlackboard: blackboard,
    cooldown,
    advancesCooldown: false,
    damageSnapshotProgram: fixed.damageSnapshots,
    operationState,
  });
  const ability = new AbilitySystemRuntime({ skills: [skill] });
  const saved = structuredClone({
    blackboard: blackboard.runtimeState,
    ability: ability.runtimeState,
    center: createOperatorCenterState(),
    skills: new Map([['skill\u0000', skill.runtimeState]]),
    passives: new Map(),
    equipment: null,
    initializations: new Map(),
    upgradeEvents: null,
    comboConditions: new Map(),
    cooldowns: new Map([['skill', cooldown.runtimeState]]),
    statuses: statusTemplate.runtimeState,
    timedMarkers: markers.runtimeState,
    buffs: buffs.runtimeState,
  });
  const restoredBuffs = new CombatBuffContainer(
    'operator',
    new CombatAttributeSet<string>(saved.buffs.attributes),
    undefined,
    null,
    ActionBlackboard.bindRuntimeState(saved.blackboard),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    saved.buffs,
  );
  const operator = {
    operatorId: 'operator',
    skills: [program],
    buffRuntime: new BuffDefinitionOperationTarget(restoredBuffs, { get: () => undefined }),
    statusContainer: statusTemplate,
  };
  const restoredClock = new CombatClock(structuredClone(clock.runtimeState));
  const restoredReceipt = new CombatReceiptCollector(receipt.history.snapshot());
  const preboundStatus = new CombatStatusRuntime(
    statusTemplate.bindRuntimeState(saved.statuses),
    restoredClock,
    restoredReceipt,
  );

  const restored = bindRestoredCombatOperatorCore({
    operator,
    state: saved,
    skills: [{ program, fixed, state: saved.skills.get('skill\u0000')! }],
    clock: restoredClock,
    receipt: restoredReceipt,
    preboundStatusRuntime: preboundStatus,
    globalScaledClock: scaledClock,
    createSkillDependencies: (binding, context) => ({
      clock: restoredClock,
      receipt: restoredReceipt,
      operations: operations(binding.state.operations),
      resources: null,
      allocateSkillCastId: () => 2,
      entityBlackboard: context.blackboard,
    }),
    resolveAttachedBuff: () => undefined,
    abilityRuntime: {},
  });

  expect(restored.blackboard.runtimeState).toBe(saved.blackboard);
  expect(restored.statuses!.container.runtimeState).toBe(saved.statuses);
  expect(restored.statuses).toBe(preboundStatus);
  expect(restored.timedMarkers.runtimeState).toBe(saved.timedMarkers);
  expect(restored.timedMarkers.has('scaled-window')).toBe(true);
  scaledClock.time = 2;
  expect(restored.timedMarkers.has('scaled-window')).toBe(false);
  expect(restored.timedMarkers.has('window')).toBe(true);
  expect(restored.cooldowns.get('skill')!.cooldown.runtimeState).toBe(saved.cooldowns.get('skill'));
  expect(restored.skills.get('skill\u0000')!.runtimeState).toBe(saved.skills.get('skill\u0000'));
  expect(restored.ability.runtimeState).toBe(saved.ability);
  expect(restored.skills.get('skill\u0000')!.runtimeState.blackboard.entity).toBe(saved.blackboard);
});
