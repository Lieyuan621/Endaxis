import { expect, it } from 'vitest';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

it.each(['single', 'context', 'points'] as const)('%s 发射保持一个动作及原生顺序', mode => {
  const meta = {
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 1,
  };
  const zero = { x: 0, y: 0, z: 0 };
  const launch = {
    ...meta,
    $type: 'Beyond.Gameplay.Core.LaunchProjectile+Data, Gameplay.Beyond',
    projectileId: 'projectile_fixture',
    projectileSkillId: '',
    projectileSource: targetFixture('Source'),
    syncTimeScale: true,
    assignEntityBlackboard: false,
    assignPairs: [],
    assignBlackboard: false,
    emitPos: targetFixture('Source'),
    emitMountPoint: 0,
    useWeaponMp: false,
    weaponIndex: 0,
    weaponMp: 100,
    overrideEmitBone: false,
    emitPosFixedOffset: zero,
    emitPosOffsetForward: 0,
    emitPosRandomOffset: zero,
    targetSettings:
      mode === 'single' ? targetFixture('Target') : targetFixture('Context', undefined, 'selected'),
    overrideHitBone: false,
    hitMountPoint: 0,
    hitBoneFixedOffset: zero,
    hitBoneOffsetForward: 1,
    hitBoneRandomOffset: zero,
    presetPoints: [],
    castSkillOnBlock: false,
    skillIdOnBlock: '',
    castSkillOnFinish: false,
    skillIdOnFinish: '',
    castSkillOnHit: false,
    castSkillOnReach: false,
    skillIdOnReach: '',
  };
  const source = parseKnownNativeActionSequenceSource(
    {
      actionData: [
        launch,
        {
          ...meta,
          $type: 'Beyond.Gameplay.Core.SimpleCalcBBAction+Data, Gameplay.Beyond',
          key: 'damage_scale',
          operation: 'Add',
          value1: scalarFixture(1),
          value2: scalarFixture(2),
        },
        launch,
      ],
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
    },
    'sequence',
    {},
  );
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(
    source,
    {
      graph,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
      ...(mode === 'context' ? { singleEnemyTargetGroupKeys: new Set(['selected']) } : {}),
      ...(mode === 'points'
        ? {
            randomPointTargetGroupKeys: new Set(['selected']),
          }
        : {}),
    },
    new Set(),
    {
      compileProjectileLaunch: () => [
        {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: false,
            finish: { reachAfterTicks: 1, maxDurationSeconds: 1 },
            recycleDelaySeconds: 0,
            source: 'actionSource',
          },
          callbacks: [],
        },
      ],
    },
  );
  expect(readActionGraphChain(graph.finish(), entry).map(action => action.kind)).toEqual([
    'launchProjectile',
    'calculateActionValue',
    'launchProjectile',
  ]);
  const first = readActionGraphChain(graph.finish(), entry)[0]!;
  if (first.kind !== 'launchProjectile') throw new Error('expected launch');
  expect(first.parameters.targets).toEqual(
    mode === 'single' ? undefined : { kind: 'context', contextKey: 'selected' },
  );
});
