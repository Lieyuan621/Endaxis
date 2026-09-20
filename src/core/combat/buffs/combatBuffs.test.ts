import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import {
  createCombatAttributeModifier,
  CombatAttributeSet,
  attributeModifierValues,
} from '../attributes/combatAttributes';
import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  type DamageScaleAttributeSnapshot,
} from '../damage/damageScaleAttributes';
import {
  PlayerDamageContext,
  type PlayerDamageAttributeSnapshots,
} from '../damage/playerDamageContext';
import {
  CombatBuffContainer,
  CombatShield,
  type BuffDuringEnableAction,
  type CombatBuffDefinition,
} from './combatBuffs';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import { SharedSpGainModifierSet } from '../resources/sharedSpGainModifiers';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { StateStepper } from '../runtime/stateStepper';

type Attribute = 'attack';

it('引用在回收回调中仍有效，回收后失效；错误编号和宿主仍拒绝', () => {
  const container = new CombatBuffContainer('owner', new CombatAttributeSet<Attribute>());
  const definition: CombatBuffDefinition<Attribute> = { id: 'same', stackingType: 'unlimited' };
  const buff = requireAddedBuff(container.add(definition, 'source'));
  let callbacks = 0;
  buff.onRecycled(() => {
    callbacks++;
    expect(buff.isRecycled).toBe(false);
    expect(container.resolveHandle(buff.reference)).toBe(buff);
    buff.recycleFinished();
  });
  buff.finish('other', null);
  expect(container.resolveHandle(buff.reference)).toBe(buff);
  container.recycleFinishedBuffs();
  expect(callbacks).toBe(1);
  expect(buff.isRecycled).toBe(true);
  const next = requireAddedBuff(container.add(definition, 'source'));
  expect(container.resolveHandle(buff.reference)).toBeUndefined();
  expect(container.resolveHandle(next.reference)).toBe(next);
  expect(() => container.resolveHandle({ ownerId: 'owner', instanceId: 100 })).toThrow(
    'never allocated',
  );
  expect(() => container.resolveHandle({ ownerId: 'other', instanceId: next.instanceId })).toThrow(
    'does not match',
  );
});

it('恢复护盾保留余额和创建时参数，耗尽只结束新分支的 Buff', () => {
  const oldContainer = new CombatBuffContainer('owner', new CombatAttributeSet<Attribute>());
  const newContainer = new CombatBuffContainer('owner', new CombatAttributeSet<Attribute>());
  const original = requireAddedBuff(
    oldContainer.add(
      {
        id: 'shield',
        stackingType: 'unlimited',
        shields: [
          {
            infinityValue: false,
            value: 100,
            absorbCount: -1,
            absorbAllDamageWhenConsumed: false,
            removeBuffWhenConsumed: true,
            priority: 'normal',
            replaceHitEffect: false,
            damageAbsorptions: [],
          },
        ],
      },
      'owner',
    ),
  );
  const shield = original.shields[0]!;
  shield.absorb('physical', 40);
  const saved = structuredClone(shield.runtimeState);
  const target = requireAddedBuff(
    newContainer.add({ id: 'shield', stackingType: 'unlimited' }, 'owner'),
  );
  const restored = new CombatShield(target, shield.definition, saved);
  expect(restored.remainingValue).toBe(60);
  expect(restored.maxValue).toBe(100);
  expect(restored.runtimeState).toBe(saved);
  expect(restored.absorb('physical', 80)).toBe(20);
  expect(target.isFinished).toBe(true);
  expect(original.isFinished).toBe(false);
  expect(shield.remainingValue).toBe(60);
});

it('正式容器数据图保留 Buff 黑板与属性修正的共享关系', () => {
  const attributes = new CombatAttributeSet<Attribute>();
  attributes.define('attack', 100, {});
  const sharedSp = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
  const container = new CombatBuffContainer('owner', attributes, undefined, sharedSp);
  const buff = requireAddedBuff(
    container.add(
      {
        id: 'data-graph',
        stackingType: 'unlimited',
        sharedSpGainModifiers: [
          {
            attribute: 'gainEfficiency',
            operation: 'addition',
            value: 0.5,
            applyToReturnSpGain: true,
          },
        ],
        damageModifiers: [
          {
            enabledSide: 'attacker',
            processors: [],
            createConditionProgram: () => ({ execute: () => true }),
          },
        ],
        healModifiers: [{ enabledSide: 'healer', processors: [] }],
        poiseModifiers: [{ enabledSide: 'attacker', processors: [] }],
        sustainedProtection: { target: 'owner', superArmor: 20, impactResistance: 40 },
        shields: [
          {
            infinityValue: false,
            value: 100,
            absorbCount: -1,
            absorbAllDamageWhenConsumed: false,
            removeBuffWhenConsumed: true,
            priority: 'normal',
            replaceHitEffect: false,
            damageAbsorptions: [],
          },
        ],
        attributeModifiers: [
          {
            attribute: 'attack',
            timing: 'runtime',
            values: attributeModifierValues('addition', 10),
          },
        ],
      },
      'source',
    ),
  );
  const session = new StateStepper(container.runtimeState, () => undefined);
  const copied = session.read();
  const instance = copied.instances.get(buff.instanceId)!;
  expect(instance.sharedSpGainModifiers[0]).toBe(copied.sharedSpGainModifiers!.modifiers[0]);
  expect(instance.identity).toEqual({
    ownerId: 'owner',
    instanceId: buff.instanceId,
    definitionId: 'data-graph',
    sourceId: 'source',
  });
  expect(instance.sourceActionId).toBe('data-graph');
  expect(instance.definitionOwnerId).toBe('source');
  expect(instance.blackboard.entity).toBe(copied.entityBlackboard);
  expect(instance.attributes.modifiers[0]).toBe(copied.attributes.modifiers[0]);
  expect(instance.damageModifiers[0]).toBe(copied.damageModifiers[0]);
  expect(copied.damageModifiers[0]!.hasConditionProgram).toBe(true);
  expect(copied.damageModifiers[0]!.numberSource!.blackboard).toBe(instance.blackboard);
  expect(instance.healModifiers[0]).toBe(copied.healModifiers[0]);
  expect(instance.poiseModifiers[0]).toBe(copied.poiseModifiers[0]);
  expect(copied.healModifiers[0]!.numberSource.blackboard).toBe(instance.blackboard);
  expect(copied.poiseModifiers[0]!.numberSource.blackboard).toBe(instance.blackboard);
  expect(copied.activeShields[0]).toBe(instance.shields[0]);
  expect(copied.sustainedProtections.get(instance)).toEqual([20, 40]);
  expect(copied.memberIds).toEqual([buff.instanceId]);
  buff.finish('other', null);
  container.recycleFinishedBuffs();
  expect(container.runtimeState.instances.size).toBe(0);
  expect(sharedSp.runtimeState.modifiers).toEqual([]);
  expect(container.runtimeState.damageModifiers).toEqual([]);
  expect(container.runtimeState.healModifiers).toEqual([]);
  expect(container.runtimeState.poiseModifiers).toEqual([]);
  expect(container.runtimeState.activeShields).toEqual([]);
  expect(container.runtimeState.sustainedProtections.size).toBe(0);
  expect(instance.lifecycle.finished).toBe(false);
});

it('容器从复制数据重绑实例、叠层、修正器和护盾且不重放生命周期', () => {
  const definition: CombatBuffDefinition<Attribute> = {
    id: 'restored-container',
    stackingType: 'enhance',
    maxStackCount: 3,
    durationSeconds: 2,
    damageModifiers: [{ enabledSide: 'attacker', processors: [] }],
    attributeModifiers: [
      {
        attribute: 'attack',
        timing: 'runtime',
        values: attributeModifierValues('addition', 15),
      },
    ],
    shields: [
      {
        infinityValue: false,
        value: 100,
        absorbCount: -1,
        absorbAllDamageWhenConsumed: false,
        removeBuffWhenConsumed: true,
        priority: 'normal',
        replaceHitEffect: false,
        damageAbsorptions: [],
      },
    ],
  };
  const childDefinition: CombatBuffDefinition<Attribute> = {
    id: 'restored-child',
    stackingType: 'unlimited',
  };
  const attributes = new CombatAttributeSet<Attribute>();
  attributes.define('attack', 100, {});
  const original = new CombatBuffContainer('owner', attributes);
  const oldBuff = requireAddedBuff(original.add(definition, 'source'));
  original.add(definition, 'source');
  const oldChild = requireAddedBuff(original.add(childDefinition, 'source'));
  oldBuff.attachChildBuff(oldChild);
  oldBuff.shields[0]!.absorb('physical', 40);
  original.tick(0.25);

  const saved = structuredClone(original.runtimeState);
  const restoredAttributes = new CombatAttributeSet(saved.attributes);
  const restoredBlackboard = ActionBlackboard.bindRuntimeState(saved.entityBlackboard);
  const restored = new CombatBuffContainer(
    'owner',
    restoredAttributes,
    undefined,
    null,
    restoredBlackboard,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    saved,
  );
  restored.bindRestoredInstances(state =>
    state.identity.definitionId === definition.id
      ? definition
      : state.identity.definitionId === childDefinition.id
        ? childDefinition
        : undefined,
  );
  restored.bindRestoredRelations(reference =>
    reference.ownerId === restored.ownerId ? restored.getInstance(reference.instanceId) : undefined,
  );

  const newBuff = restored.getInstance(oldBuff.instanceId)!;
  expect(restored.runtimeState).toBe(saved);
  expect(newBuff.runtimeState).toBe(saved.instances.get(oldBuff.instanceId));
  expect(newBuff.enhanceCount).toBe(2);
  expect(newBuff.remainingDuration).toBe(1.75);
  expect(restoredAttributes.get('attack')).toBe(130);
  expect(restored.shields[0]!.remainingValue).toBe(60);
  expect(restored.shields[0]!.runtimeState).toBe(newBuff.runtimeState.shields[0]);

  restored.shields[0]!.absorb('physical', 80);
  expect(newBuff.isFinished).toBe(true);
  expect(restored.getInstance(oldChild.instanceId)!.isFinished).toBe(true);
  expect(oldBuff.isFinished).toBe(false);
  expect(oldChild.isFinished).toBe(false);
  expect(oldBuff.shields[0]!.remainingValue).toBe(60);
});

it('容器实时结束遍历包含结束回调中新发布的成员，回收后目录为空', () => {
  const container = new CombatBuffContainer('owner', new CombatAttributeSet<Attribute>());
  let appended = false;
  const definition: CombatBuffDefinition<Attribute> = {
    id: 'live-members',
    stackingType: 'unlimited',
    actions: {
      finish: () => {
        if (appended) return;
        appended = true;
        container.add(definition, 'source');
      },
    },
  };
  container.add(definition, 'source');
  expect(container.finishByIds([definition.id], 'other')).toBe(2);
  expect(container.buffs.map(buff => buff.instanceId)).toEqual([1, 2]);
  container.recycleFinishedBuffs();
  expect(container.buffs).toEqual([]);
  expect(requireAddedBuff(container.add(definition, 'source')).instanceId).toBe(3);
});

it('结束父 Buff 时继续处理回调中新附着的子实例，释放则仅清理关系', () => {
  const container = new CombatBuffContainer('owner', new CombatAttributeSet<Attribute>());
  const parent = requireAddedBuff(
    container.add({ id: 'parent', stackingType: 'unlimited' }, 'source'),
  );
  const seen: string[] = [];
  const late = requireAddedBuff(
    container.add(
      { id: 'late', stackingType: 'unlimited', actions: { finish: () => seen.push('late') } },
      'source',
    ),
  );
  const first = requireAddedBuff(
    container.add(
      {
        id: 'first',
        stackingType: 'unlimited',
        actions: {
          finish: () => {
            seen.push('first');
            parent.attachChildBuff(late);
          },
        },
      },
      'source',
    ),
  );
  parent.attachChildBuff(first);
  parent.attachChildBuff(first);
  parent.finish('other', null);
  expect(seen).toEqual(['first', 'late']);
  const released = requireAddedBuff(
    container.add({ id: 'released', stackingType: 'unlimited' }, 'source'),
  );
  const survivor = requireAddedBuff(
    container.add({ id: 'survivor', stackingType: 'unlimited' }, 'source'),
  );
  released.attachChildBuff(survivor);
  released.release();
  expect(survivor.isFinished).toBe(false);
});

it('子 Buff 独立结束后从仍存续的父 Buff 关系中移除', () => {
  const attributes = new CombatAttributeSet<Attribute>();
  const container = new CombatBuffContainer('owner', attributes);
  const parent = requireAddedBuff(
    container.add({ id: 'parent', stackingType: 'unlimited' }, 'source'),
  );
  const child = requireAddedBuff(
    container.add({ id: 'child', stackingType: 'unlimited' }, 'source'),
  );
  parent.attachChildBuff(child);

  child.finish('lifetime', null);
  container.recycleFinishedBuffs();

  expect(parent.runtimeState.children.members.size).toBe(0);
  expect(parent.isFinished).toBe(false);
});

it('宿主释放清理实例，但不执行普通结束动作或发布结束/减层通知', () => {
  const seen: string[] = [];
  const attributes = new CombatAttributeSet<Attribute>();
  const container = new CombatBuffContainer(
    'owner',
    attributes,
    undefined,
    null,
    undefined,
    () => seen.push('finished'),
    () => seen.push('layers'),
  );
  const buff = requireAddedBuff(
    container.add(
      {
        id: 'release-only',
        stackingType: 'unlimited',
        actions: {
          finish: () => seen.push('finish-action'),
          disable: () => seen.push('disable-action'),
          release: () => seen.push('release-cleanup'),
        },
      },
      'caster',
    ),
  );
  buff.setFinishable(false);
  expect(buff.release()).toBe(true);
  expect(buff.isFinished).toBe(true);
  expect(buff.finishReason).toBeNull();
  expect(buff.release()).toBe(false);
  expect(buff.finish('other')).toBe(false);
  expect(seen).toEqual(['release-cleanup']);
});

it.each(['expiry', 'release', 'replacement', 'shieldValue', 'shieldCount'] as const)(
  '%s 结束传递已知空来源，不继承施加技能',
  path => {
    const observations: unknown[] = [];
    const container = new CombatBuffContainer(
      'owner',
      new CombatAttributeSet<Attribute>(),
      undefined,
      null,
      undefined,
      (_buff, _reason, source) => observations.push(source),
      (_buff, layers, _reason, source) => {
        if (layers < 0) observations.push(source);
      },
    );
    const cast = {
      skillCastId: 12,
      originSkillId: 'original',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 100,
    };
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'native-finish',
      stackingType: 'stack',
      maxStackCount: 1,
      durationSeconds: 1,
      shields: [
        {
          infinityValue: path === 'shieldCount',
          value: 10,
          absorbCount: path === 'shieldCount' ? 1 : -1,
          absorbAllDamageWhenConsumed: false,
          removeBuffWhenConsumed: true,
          priority: 'normal',
          replaceHitEffect: false,
          damageAbsorptions: [],
        },
      ],
    };
    const buff = requireAddedBuff(container.add(definition, 'caster', { skillCastInfo: cast }));
    if (path === 'replacement')
      container.add(definition, 'other', { skillCastInfo: { ...cast, skillCastId: 13 } });
    else if (path === 'shieldValue' || path === 'shieldCount') {
      container.absorbDamage('physical', 10);
      expect(buff.finishReason).toBe('other');
    } else {
      if (path === 'release') buff.setFinishable(false);
      buff.tick(2);
      if (path === 'release') {
        expect(observations).toEqual([]);
        buff.setFinishable(true);
      }
    }
    expect(buff.isFinished).toBe(true);
    expect(observations).toEqual([null, null]);
  },
);

it.each([false, true])('增强内部动作先看新层数旧属性，再刷新；定时=%s', timed => {
  const attributes = new CombatAttributeSet<Attribute>();
  attributes.define('attack', 100, {});
  const observations: string[] = [];
  const container = new CombatBuffContainer('owner', attributes);
  const definition: CombatBuffDefinition<Attribute> = {
    id: 'enhance-order',
    stackingType: timed ? 'timedGrowingEnhance' : 'enhance',
    durationSeconds: 1,
    maxStackCount: 2,
    attributeModifiers: [
      { attribute: 'attack', timing: 'runtime', values: attributeModifierValues('addition', 10) },
    ],
    actions: {
      enhanceChanged: buff =>
        observations.push(`changed:${buff.enhanceCount}:${attributes.get('attack')}`),
      afterEnhance: buff =>
        observations.push(`after:${buff.enhanceCount}:${attributes.get('attack')}`),
    },
  };
  container.add(definition, 'source');
  expect(attributes.get('attack')).toBe(110);
  if (timed) container.tick(1);
  else container.add(definition, 'source');
  expect(observations).toEqual(timed ? ['changed:2:110'] : ['changed:2:110', 'after:2:120']);
  expect(attributes.get('attack')).toBe(120);
});

it.each(['id', 'tag'] as const)('全量 %s 提前消费同步发布来源和原层数，结束/吸收不混用', query => {
  const tag = 'Skill/Fire';
  const container = new CombatBuffContainer(
    'enemy',
    new CombatAttributeSet<Attribute>(),
    new GameplayTagRegistry([tag]),
  );
  const consumed: string[] = [];
  const absorbed: string[] = [];
  container.configureConsumedObserver((buff, source, layers) => {
    expect(buff.isFinished).toBe(true);
    consumed.push(`${source}:${buff.definition.id}:${layers}`);
  });
  container.configureAbsorbedObserver((buff, source, layers) =>
    absorbed.push(`${source}:${buff.definition.id}:${layers}`),
  );
  const add = () => {
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'fire',
      stackingType: 'enhance',
      maxStackCount: 4,
      applyTags: [tag],
    };
    container.add(definition, 'original');
    container.add(definition, 'original');
  };
  const finish = (reason: 'early' | 'other' | 'absorbed', source?: string) =>
    query === 'id'
      ? container.finishByIds(['fire'], reason, source)
      : container.finishByTags([tag], 'hasAny', reason, false, source);
  add();
  expect(finish('early', 'consumer')).toBe(1);
  expect(consumed).toEqual(['consumer:fire:2']);
  expect(finish('early', 'consumer')).toBe(0);
  add();
  finish('other', 'consumer');
  add();
  finish('early');
  expect(consumed).toHaveLength(1);
  add();
  finish('absorbed', 'absorber');
  expect(absorbed).toEqual(['absorber:fire:2']);
  expect(consumed).toHaveLength(1);
});

it.each([-1, -0.00002, -0.00001, -0.000001, 0, 0.5])(
  '有限配置在本次赋值 duration=%s 后按原生负阈值解析寿命',
  duration => {
    const container = new CombatBuffContainer<Attribute>(
      'owner',
      new CombatAttributeSet<Attribute>(),
    );
    const buff = container.add(
      {
        id: 'duration-boundary',
        stackingType: 'unlimited',
        durationSeconds: { blackboardKey: 'duration' },
        blackboard: { duration: 10 },
      },
      'source',
      { blackboardValues: { duration } },
    )!;
    const infinite = Math.fround(duration) < Math.fround(-0.00001);
    expect(buff.remainingDuration).toBe(infinite ? null : duration);
    expect(buff.blackboard.getNumber('duration')).toBe(duration);
    buff.tick(1);
    expect(buff.isFinished).toBe(!infinite);
    if (infinite) {
      buff.rawSetRemainingDuration(5);
      expect(buff.remainingDuration).toBeNull();
    }
  },
);

it('输出黑板收集发生在赋值后、寿命求值前，刷新旧实例不重播', () => {
  let calls = 0;
  const container = new CombatBuffContainer<Attribute>(
    'enemy',
    new CombatAttributeSet<Attribute>(),
    undefined,
    null,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    (_definition, source, blackboard) => {
      expect(source).toBe('source');
      calls++;
      blackboard.assignDynamic('duration', blackboard.getNumber('duration')! + 5);
    },
  );
  const definition: CombatBuffDefinition<Attribute> = {
    id: 'collected',
    stackingType: 'refresh',
    durationSeconds: { blackboardKey: 'duration' },
    blackboard: { duration: 1 },
  };
  const first = container.add(definition, 'source', { blackboardValues: { duration: 10 } })!;
  expect(first.remainingDuration).toBe(15);
  expect(container.add(definition, 'source', { blackboardValues: { duration: 10 } })).toBe(first);
  expect(calls).toBe(1);
  expect(definition.blackboard).toEqual({ duration: 1 });
});

function requireAddedBuff<T>(buff: T | null): T {
  if (buff === null) throw new Error('test fixture buff was unexpectedly rejected');
  return buff;
}

const scaleAttributes = Object.fromEntries(
  DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
) as unknown as DamageScaleAttributeSnapshot;

function createDamageContext(
  attributes: CombatAttributeSet<Attribute>,
  buffs: CombatBuffContainer<Attribute>,
) {
  const snapshots = (): PlayerDamageAttributeSnapshots => ({
    attacker: {
      ...scaleAttributes,
      attack: attributes.get('attack'),
      criticalRate: 0,
      criticalDamageIncrease: 0,
      weaknessDamageMultiplier: 1,
      igniteDamageMultiplier: 1,
      physicalInflictionDamageMultiplier: 1,
    },
    defender: {
      ...scaleAttributes,
      defense: 0,
      shelterDamageMultiplier: 0,
      breakingAttackDamageTakenMultiplier: 1,
      resistances: {
        physical: { percent: 0, damageTakenMultiplier: 1 },
        heat: { percent: 0, damageTakenMultiplier: 1 },
        electric: { percent: 0, damageTakenMultiplier: 1 },
        cryo: { percent: 0, damageTakenMultiplier: 1 },
        nature: { percent: 0, damageTakenMultiplier: 1 },
        ether: { percent: 0, damageTakenMultiplier: 1 },
      },
    },
  });
  return new PlayerDamageContext({
    sourceId: 'operator',
    targetId: 'enemy',
    damageType: 'physical',
    targetHealthType: 'normal',
    ports: {
      captureAttributeSnapshots: snapshots,
      applyModifiers: (timing, side, context) => buffs.applyDamageModifiers(timing, side, context),
      addInstantAttributeModifier: (side, request) => {
        if (side !== 'attacker' || request.attribute !== 'attack') {
          throw new Error('unexpected instant-attribute target');
        }
        attributes.addModifier(
          createCombatAttributeModifier(
            request.attribute,
            request.values,
            ATTRIBUTE_MODIFIER_SOURCES.instant,
            request.timing,
          ),
        );
      },
      clearInstantAttributeModifiers: () => attributes.clearInstantModifiers(),
    },
  });
}

function createDefinition(
  actions?: CombatBuffDefinition<Attribute>['actions'],
): CombatBuffDefinition<Attribute> {
  return {
    id: 'buff.attack',
    stackingType: 'unlimited',
    durationSeconds: 1,
    attributeModifiers: [
      {
        attribute: 'attack',
        values: attributeModifierValues('addition', 25),
        timing: 'runtime',
      },
    ],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        processors: [
          {
            kind: 'multiplyValue',
            timing: 'beforeCalculation',
            targetHealthTypes: ['normal'],
            scale: 2,
          },
        ],
      },
    ],
    actions,
  };
}

describe('CombatBuffContainer', () => {
  it('records explicit SkillAffix identity from source cast without changing provenance', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    expect(() =>
      container.add(
        { id: 'affix', stackingType: 'unique', affixSkillCastIdentity: 'sourceSkillCast' },
        'operator',
      ),
    ).toThrow('requires source skill cast');
    const cast = {
      skillCastId: 42,
      originSkillId: 'skill',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    };
    const buff = container.add(
      { id: 'affix', stackingType: 'unique', affixSkillCastIdentity: 'sourceSkillCast' },
      'operator',
      { skillCastInfo: cast },
    )!;
    expect(buff.affixSkillCastId).toBe(42);
    expect(buff.skillCastInfo).toEqual(cast);
  });

  it('applies keyword enhancements on the matching Buff add edge without merging sibling rates', () => {
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());
    const vulnerable = requireAddedBuff(
      container.add(
        {
          id: 'vulnerable',
          stackingType: 'stack',
          blackboard: { rate: 0.2, potentialRate: 0.05 },
          keywordEnhancements: [
            {
              triggerBuffIds: ['potential-trigger'],
              operation: 'add',
              targetKey: '__heat_rate',
              initialValue: { blackboardKey: 'rate' },
              value: { blackboardKey: 'potentialRate' },
            },
            {
              triggerBuffIds: ['potential-trigger'],
              operation: 'add',
              targetKey: '__electric_rate',
              initialValue: { blackboardKey: 'rate' },
              value: { blackboardKey: 'potentialRate' },
            },
          ],
        },
        'operator',
      ),
    );

    const trigger = requireAddedBuff(
      container.add(
        { id: 'potential-trigger', stackingType: 'stack', durationSeconds: 0.1 },
        'operator',
      ),
    );
    expect(vulnerable.blackboard.getNumber('__heat_rate')).toBeCloseTo(0.25);
    expect(vulnerable.blackboard.getNumber('__electric_rate')).toBeCloseTo(0.25);

    trigger.finish('lifetime');
    expect(vulnerable.blackboard.getNumber('__heat_rate')).toBeCloseTo(0.25);
  });

  it('refreshes source-targeted attribute modifiers after a keyword add edge', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const carrier = requireAddedBuff(
      container.add(
        {
          id: 'source-enhance',
          stackingType: 'unique',
          blackboard: { rate: 0.2, enhanceRate: 0.05 },
          keywordEnhancements: [
            {
              triggerBuffIds: ['mark'],
              operation: 'add',
              targetKey: '__rate',
              initialValue: { blackboardKey: 'rate' },
              value: { blackboardKey: 'enhanceRate' },
            },
          ],
          attributeModifiers: [
            {
              attribute: 'attack',
              values: { slot: 'baseMultiplier', blackboardKey: '__rate' },
              timing: 'runtime',
              target: 'buffSource',
            },
          ],
        },
        'operator',
      ),
    );

    expect(attributes.get('attack')).toBeCloseTo(120);
    requireAddedBuff(container.add({ id: 'mark', stackingType: 'stack' }, 'operator'));
    expect(carrier.blackboard.getNumber('__rate')).toBeCloseTo(0.25);
    expect(attributes.get('attack')).toBeCloseTo(125);

    carrier.finish('lifetime');
    expect(attributes.get('attack')).toBeCloseTo(100);
  });

  it('rejects a distinct buff source instead of treating it as the owner', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('owner', attributes);

    expect(() =>
      container.add(
        {
          id: 'distinct-source-enhance',
          stackingType: 'unique',
          attributeModifiers: [
            {
              attribute: 'attack',
              values: attributeModifierValues('baseMultiplier', 0.2),
              timing: 'runtime',
              target: 'buffSource',
            },
          ],
        },
        'source',
      ),
    ).toThrow("targets distinct buff source 'source'");
  });

  it('有限配置的负时长转为无限，仍允许显式结束', () => {
    const events: string[] = [];
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'negative-lifetime',
          stackingType: 'unique',
          durationSeconds: -1,
          actions: {
            start: () => events.push('start'),
            finish: () => events.push('finish'),
          },
        },
        'operator',
      ),
    );

    expect(buff.isFinished).toBe(false);
    expect(buff.remainingDuration).toBeNull();
    expect(events).toEqual(['start']);

    buff.tick(0);

    expect(buff.isFinished).toBe(false);
    expect(events).toEqual(['start']);
    buff.finish('other');
    expect(buff.isFinished).toBe(true);
    expect(events).toEqual(['start', 'finish']);
  });

  it('PauseBuffTime 只冻结当前 Buff 的计时与周期行为，恢复后从剩余时长继续', () => {
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const buff = requireAddedBuff(
      container.add({ id: 'timer', stackingType: 'unique', durationSeconds: 1 }, 'operator'),
    );

    buff.tick(0.25);
    buff.setTimePaused(true);
    buff.tick(2);
    expect(buff.isTimePaused).toBe(true);
    expect(buff.remainingDuration).toBeCloseTo(0.75);
    expect(buff.passedTime).toBeCloseTo(0.25);
    expect(buff.isFinished).toBe(false);

    buff.setTimePaused(false);
    buff.tick(0.75);
    expect(buff.isFinished).toBe(true);
  });

  it('按 applyTags 的原生层级语义查询 Buff', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const registry = new GameplayTagRegistry(['Combat/Buff/Pulse/Triggered']);
    const container = new CombatBuffContainer('operator', attributes, registry);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'pulse-triggered',
      applyTags: ['Combat/Buff/Pulse/Triggered'],
      stackingType: 'enhance',
    };

    requireAddedBuff(container.add(definition, 'skill'));
    requireAddedBuff(container.add(definition, 'skill'));

    expect(container.getCountByTags(['Combat/Buff/Pulse'])).toBe(2);
    expect(container.getInstanceCountByTags(['Combat/Buff/Pulse'])).toBe(1);
    expect(container.findFirstByTags(['Combat/Buff/Pulse'])?.definition.id).toBe('pulse-triggered');
    expect(container.getCountByTags(['Combat/Buff/Pulse'], 'hasAny', true)).toBe(0);
  });

  it('按原生 m_tagHandle 生命周期将启用 Buff 的 applyTags 注册到实体', () => {
    const tag = 'Skill/Character/Common/SpellInflict/FireInflict';
    const container = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([tag]),
    );
    const definition = { id: 'heat', applyTags: [tag], stackingType: 'unlimited' as const };

    const first = requireAddedBuff(container.add(definition, 'operator'));
    const second = requireAddedBuff(container.add(definition, 'operator'));
    expect(container.matchesEntityTags([tag], 'hasAll')).toBe(true);

    first.disable();
    expect(container.matchesEntityTags([tag], 'hasAll')).toBe(true);

    first.enable();
    first.enable();
    first.finish();
    expect(container.matchesEntityTags([tag], 'hasAll')).toBe(true);

    second.finish();
    expect(container.matchesEntityTags([tag], 'hasAll')).toBe(false);
  });

  it('separates matching Buff instance count from accumulated enhance layers', () => {
    const path = 'Combat/Buff/Poise';
    const container = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    const tag = path;
    const enhanced = { id: 'enhanced', applyTags: [tag], stackingType: 'enhance' as const };
    const unlimited = { id: 'unlimited', applyTags: [tag], stackingType: 'unlimited' as const };

    requireAddedBuff(container.add(enhanced, 'operator'));
    requireAddedBuff(container.add(enhanced, 'operator'));
    requireAddedBuff(container.add(unlimited, 'operator'));

    expect(container.getCountByTags([tag])).toBe(3);
    expect(container.getInstanceCountByTags([tag])).toBe(2);
    expect(container.getInstanceCountByIds(['enhanced', 'unlimited'])).toBe(2);
    expect(container.getInstanceCountByIds(['enhanced', 'enhanced'])).toBe(2);
    container.finishByIds(['unlimited'], 'other');
    expect(container.getInstanceCountByIds(['enhanced', 'unlimited'])).toBe(1);
  });

  it('registers independent modifiers and follows enable-disable-finish lifecycle', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const buff = requireAddedBuff(
      container.add(
        createDefinition({
          start: () => order.push('start'),
          enable: () => order.push('enable'),
          disable: () => order.push('disable'),
          finish: () => order.push('finish'),
        }),
        'operator',
      ),
    );

    expect(attributes.get('attack')).toBe(125);
    const firstHit = createDamageContext(attributes, container);
    firstHit.applyModifiers('beforeCalculation');
    firstHit.setCalculationResult(firstHit.attackerAttributes.attack);
    expect(firstHit.value).toBe(250);

    buff.disable();
    expect(attributes.get('attack')).toBe(100);
    const disabledHit = createDamageContext(attributes, container);
    disabledHit.applyModifiers('beforeCalculation');
    disabledHit.setCalculationResult(disabledHit.attackerAttributes.attack);
    expect(disabledHit.value).toBe(100);

    buff.enable();
    expect(buff.finish('dispelled')).toBe(true);
    expect(buff.finish()).toBe(false);
    expect(attributes.get('attack')).toBe(100);
    expect(order).toEqual(['start', 'enable', 'disable', 'enable', 'finish']);
  });

  it('runs during-enable actions only while enabled and restarts them after re-enable', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const duringEnable: BuffDuringEnableAction<Attribute> = {
      createRuntimeInstance: () => duringEnable,
      tryExecute: () => {
        order.push(`during-execute:${attributes.get('attack')}`);
        return true;
      },
      tick: deltaTime => order.push(`during-tick:${deltaTime}`),
      end: () => order.push(`during-end:${attributes.get('attack')}`),
      reset: () => order.push(`during-reset:${attributes.get('attack')}`),
    };
    const buff = requireAddedBuff(
      container.add(
        createDefinition({
          enable: () => order.push('enable'),
          disable: () => order.push('disable'),
          finish: () => order.push('finish'),
          duringEnable,
        }),
        'operator',
      ),
    );

    container.tick(0.25);
    buff.disable();
    container.tick(0.5);
    buff.enable();
    container.tick(0.75);
    buff.finish();

    expect(order).toEqual([
      'enable',
      'during-execute:125',
      'during-tick:0.25',
      'disable',
      'during-end:125',
      'during-reset:125',
      'enable',
      'during-execute:125',
      'during-tick:0.75',
      'finish',
      'during-end:125',
      'during-reset:125',
    ]);
  });

  it('creates independent during-enable action state for every buff instance', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const runtimeTicks: number[][] = [];
    const blueprint: BuffDuringEnableAction<Attribute> = {
      createRuntimeInstance: () => {
        const ticks: number[] = [];
        runtimeTicks.push(ticks);
        return {
          createRuntimeInstance: () => {
            throw new Error('a runtime action must not be cloned again');
          },
          tryExecute: () => true,
          tick: deltaTime => ticks.push(deltaTime),
          end: () => undefined,
          reset: () => undefined,
        };
      },
      tryExecute: () => {
        throw new Error('the configured action blueprint must not execute');
      },
      tick: () => undefined,
      end: () => undefined,
      reset: () => undefined,
    };
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.during-enable.independent',
      stackingType: 'unlimited',
      actions: { duringEnable: blueprint },
    };
    const first = requireAddedBuff(container.add(definition, 'operator'));
    requireAddedBuff(container.add(definition, 'operator'));

    first.disable();
    container.tick(0.5);

    expect(runtimeTicks).toEqual([[], [0.5]]);
  });

  it('expires finite buffs in insertion order while infinite buffs remain', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const first = requireAddedBuff(container.add(createDefinition(), 'operator'));
    const infinite = requireAddedBuff(
      container.add(
        { ...createDefinition(), id: 'buff.infinite', durationSeconds: undefined },
        'operator',
      ),
    );

    expect(container.getCountById('buff.attack')).toBe(1);
    container.tick(1);
    expect(first.finishReason).toBe('lifetime');
    expect(infinite.isFinished).toBe(false);
    expect(container.getCountById('buff.attack')).toBe(0);
  });

  it('publishes layered Buff changes after finish state refresh with the native signed count', () => {
    const order: string[] = [];
    const container = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet<Attribute>(),
      undefined,
      null,
      undefined,
      buff =>
        order.push(`finished:${buff.isFinished}:${container.getCountById(buff.definition.id)}`),
      (buff, layerCount, reason) =>
        order.push(`changed:${buff.definition.stackingType}:${layerCount}:${reason ?? 'enhance'}`),
    );
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.layered-expiry',
      stackingType: 'highPriorityWithMaxStack',
      maxStackCount: 4,
      durationSeconds: 1,
    };
    requireAddedBuff(container.add(definition, 'operator'));

    container.tick(1);

    expect(order).toEqual(['finished:true:0', 'changed:highPriorityWithMaxStack:-1:lifetime']);
  });

  it('keeps the instant stage snapshot for the final hit and clears the live modifier', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    container.add(
      {
        id: 'buff.instant-attack',
        stackingType: 'unlimited',
        damageModifiers: [
          {
            enabledSide: 'attacker',
            processors: [
              {
                kind: 'instantAttribute',
                targetSide: 'attacker',
                attribute: 'attack',
                values: attributeModifierValues('addition', 50),
                attributeTiming: 'runtime',
              },
            ],
          },
        ],
      },
      'operator',
    );

    const context = createDamageContext(attributes, container);
    context.applyModifiers('beforeCalculation');
    expect(context.attackerAttributes.attack).toBe(150);
    expect(attributes.get('attack')).toBe(100);
    context.setCalculationResult(150);
    context.resolveFinalAttackValue();
    expect(context.attackerAttributes.attack).toBe(150);
    expect(attributes.get('attack')).toBe(100);

    const nextHit = createDamageContext(attributes, container);
    expect(nextHit.attackerAttributes.attack).toBe(100);
  });

  it('rolls back damage modifiers when attribute registration fails', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    expect(() => container.add(createDefinition(), 'operator')).toThrow('explicit native bounds');
    // 启用未成功返回，实例尚未进入容器；修正器仍必须全部回滚。
    expect(container.buffs).toHaveLength(0);

    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const context = createDamageContext(attributes, container);
    context.applyModifiers('beforeCalculation');
    context.setCalculationResult(100);
    expect(context.value).toBe(100);
  });

  it('启动和启用先于容器登记，嵌套创建的子实例先发布，刷新不重复登记', () => {
    const container = new CombatBuffContainer('owner', new CombatAttributeSet<Attribute>());
    const observations: number[] = [];
    const child: CombatBuffDefinition<Attribute> = { id: 'child', stackingType: 'unique' };
    const parent: CombatBuffDefinition<Attribute> = {
      id: 'parent',
      stackingType: 'refresh',
      durationSeconds: 2,
      actions: {
        start: () => {
          observations.push(container.getCountById('parent'));
          container.add(child, 'source');
        },
        enable: () => observations.push(container.getCountById('parent')),
      },
    };
    const first = container.add(parent, 'source');
    expect(observations).toEqual([0, 0]);
    expect(container.buffs.map(buff => buff.definition.id)).toEqual(['child', 'parent']);
    expect(container.add(parent, 'source')).toBe(first);
    expect(container.getCountById('parent')).toBe(1);
    expect(observations).toEqual([0, 0]);
  });

  it('rejects a repeated unique buff until the existing instance finishes', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition = {
      id: 'buff.unique',
      stackingType: 'unique',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 10, value: 1 },
      actions: {
        start: () => order.push('start'),
        enable: () => order.push('enable'),
        finish: () => order.push('finish'),
      },
    } as const satisfies CombatBuffDefinition<Attribute>;

    const first = requireAddedBuff(container.add(definition, 'first-source'));
    container.tick(4);

    const rejected = container.add(definition, 'second-source', {
      blackboardValues: { duration: 20, value: 2 },
    });
    expect(rejected).toBeNull();
    expect(container.buffs).toHaveLength(1);
    expect(first.remainingDuration).toBe(6);
    expect(first.sourceId).toBe('first-source');
    expect(first.blackboard.getNumber('value')).toBe(1);
    expect(order).toEqual(['start', 'enable']);

    first.finish('other');
    const replacement = requireAddedBuff(
      container.add(definition, 'third-source', {
        blackboardValues: { duration: 8 },
      }),
    );
    expect(replacement).not.toBe(first);
    expect(replacement.remainingDuration).toBe(8);
    expect(container.buffs).toHaveLength(2);
    expect(order).toEqual(['start', 'enable', 'finish', 'start', 'enable']);
  });

  it('refreshes the existing instance without restarting or enhancing it', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.refresh',
      stackingType: 'refresh',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 8 },
      actions: {
        start: () => order.push('start'),
        enable: () => order.push('enable'),
        beforeEnhance: () => order.push('beforeEnhance'),
        enhanceChanged: () => order.push('enhanceChanged'),
        afterEnhance: () => order.push('afterEnhance'),
      },
    };

    const first = requireAddedBuff(
      container.add(definition, 'first-source', {
        blackboardValues: { duration: 10 },
      }),
    );
    container.tick(4);
    const refreshed = requireAddedBuff(
      container.add(definition, 'second-source', {
        blackboardValues: { duration: 12 },
      }),
    );

    expect(refreshed).toBe(first);
    expect(container.buffs).toHaveLength(1);
    expect(first.remainingDuration).toBe(12);
    expect(first.enhanceCount).toBe(1);
    expect(first.sourceId).toBe('first-source');
    expect(first.blackboard.getNumber('duration')).toBe(10);
    expect(order).toEqual(['start', 'enable']);

    container.tick(3);
    container.add(definition, 'third-source', {
      blackboardValues: { duration: 8 },
    });
    expect(first.remainingDuration).toBe(9);

    container.add({ ...definition, durationSeconds: undefined }, 'infinite-source');
    expect(first.remainingDuration).toBeNull();
  });

  it('extends only the existing lifetime without replacing runtime identity or inputs', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.extend',
      stackingType: 'extend',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 8, value: 1 },
      actions: {
        start: () => order.push('start'),
        enable: () => order.push('enable'),
      },
    };

    const first = requireAddedBuff(
      container.add(definition, 'first-source', {
        blackboardValues: { duration: 10, value: 1 },
      }),
    );
    container.tick(4);
    const extended = requireAddedBuff(
      container.add(definition, 'second-source', {
        blackboardValues: { duration: 3, value: 2 },
      }),
    );

    expect(extended).toBe(first);
    expect(container.buffs).toHaveLength(1);
    expect(first.remainingDuration).toBe(9);
    expect(first.passedTime).toBe(4);
    expect(first.sourceId).toBe('first-source');
    expect(first.blackboard.getNumber('duration')).toBe(10);
    expect(first.blackboard.getNumber('value')).toBe(1);
    expect(order).toEqual(['start', 'enable']);

    container.add(definition, 'large-duration-source', {
      blackboardValues: { duration: 1_000_000 },
    });
    expect(first.remainingDuration).toBe(1_000_009);
    expect(order).toEqual(['start', 'enable']);
  });

  it('makes an extended lifetime infinite when either side is infinite', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const finiteContainer = new CombatBuffContainer('operator', attributes);
    const finiteDefinition: CombatBuffDefinition<Attribute> = {
      id: 'buff.extend.finite',
      stackingType: 'extend',
      durationSeconds: 8,
    };
    const finite = requireAddedBuff(finiteContainer.add(finiteDefinition, 'source'));

    finiteContainer.add({ ...finiteDefinition, durationSeconds: undefined }, 'infinite-source');
    expect(finite.remainingDuration).toBeNull();

    const infiniteContainer = new CombatBuffContainer('operator', attributes);
    const infiniteDefinition: CombatBuffDefinition<Attribute> = {
      id: 'buff.extend.infinite',
      stackingType: 'extend',
    };
    const infinite = requireAddedBuff(infiniteContainer.add(infiniteDefinition, 'source'));

    infiniteContainer.add({ ...infiniteDefinition, durationSeconds: 8 }, 'finite-source');
    expect(infinite.remainingDuration).toBeNull();
  });

  it('Extend 的本次负时长初始化为无限，旧实例随之成为无限', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.extend.negative',
      stackingType: 'extend',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 10 },
    };
    const existing = requireAddedBuff(container.add(definition, 'first-source'));

    container.add(definition, 'second-source', {
      blackboardValues: { duration: -3 },
    });
    expect(existing.remainingDuration).toBeNull();
    expect(container.buffs).toEqual([existing]);
  });

  it('enhances one instance without refreshing its lifetime and runs attempt hooks at the cap', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.enhance',
      stackingType: 'enhance',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 10, value: 1 },
      maxStackCount: 2,
      actions: {
        start: () => order.push('start'),
        enable: () => order.push('enable'),
        beforeEnhance: buff => order.push(`before:${buff.enhanceCount}`),
        enhanceChanged: buff => order.push(`changed:${buff.enhanceCount}`),
        afterEnhance: buff => order.push(`after:${buff.enhanceCount}`),
        finish: () => order.push('finish'),
      },
    };

    const first = requireAddedBuff(
      container.add(definition, 'first-source', {
        blackboardValues: { duration: 10, value: 1 },
      }),
    );
    container.tick(4);

    const enhanced = requireAddedBuff(
      container.add(definition, 'second-source', {
        blackboardValues: { duration: 20, value: 2 },
      }),
    );
    expect(enhanced).toBe(first);
    expect(first.enhanceCount).toBe(2);
    expect(first.remainingDuration).toBe(6);
    expect(first.sourceId).toBe('first-source');
    expect(first.blackboard.getNumber('value')).toBe(1);

    const capped = requireAddedBuff(container.add(definition, 'third-source'));
    expect(capped).toBe(first);
    expect(first.enhanceCount).toBe(2);
    expect(container.buffs).toHaveLength(1);
    expect(order).toEqual([
      'start',
      'enable',
      'before:1',
      'changed:2',
      'after:2',
      'before:2',
      'after:2',
    ]);

    first.finish('other');
    const replacement = requireAddedBuff(container.add(definition, 'fourth-source'));
    expect(replacement).not.toBe(first);
    expect(replacement.enhanceCount).toBe(1);
    expect(container.buffs).toHaveLength(2);
    expect(order.slice(-3)).toEqual(['finish', 'start', 'enable']);
  });

  it('locks a dynamic Enhance limit from the first instance blackboard', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.enhance.dynamic-limit',
      stackingType: 'enhance',
      maxStackCount: { blackboardKey: 'limit' },
      blackboard: { limit: 4 },
      actions: {
        beforeEnhance: () => order.push('before'),
        enhanceChanged: () => order.push('changed'),
        afterEnhance: () => order.push('after'),
      },
    };

    const first = requireAddedBuff(
      container.add(definition, 'first-source', {
        blackboardValues: { limit: 2 },
      }),
    );
    container.add(definition, 'second-source', {
      blackboardValues: { limit: 4 },
    });
    container.add(definition, 'third-source', {
      blackboardValues: { limit: 4 },
    });

    expect(first.enhanceCount).toBe(2);
    expect(first.blackboard.getNumber('limit')).toBe(2);
    expect(order).toEqual(['before', 'changed', 'after', 'before', 'after']);

    first.finish('other');
    const replacement = requireAddedBuff(
      container.add(definition, 'replacement-source', {
        blackboardValues: { limit: 3 },
      }),
    );
    container.add(definition, 'replacement-source');
    container.add(definition, 'replacement-source');
    expect(replacement.enhanceCount).toBe(3);
  });

  it('overwrites the existing duration without replacing or restarting the instance', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.overwrite-duration',
      stackingType: 'overwriteDuration',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 8, value: 1 },
      actions: {
        start: () => order.push('start'),
        enable: () => order.push('enable'),
      },
    };

    const first = requireAddedBuff(
      container.add(definition, 'first-source', {
        blackboardValues: { duration: 10, value: 1 },
      }),
    );
    container.tick(4);

    const shortened = requireAddedBuff(
      container.add(definition, 'second-source', {
        blackboardValues: { duration: 3, value: 2 },
      }),
    );
    expect(shortened).toBe(first);
    expect(first.remainingDuration).toBe(3);
    expect(first.sourceId).toBe('first-source');
    expect(first.blackboard.getNumber('value')).toBe(1);
    expect(order).toEqual(['start', 'enable']);

    const infinite = requireAddedBuff(
      container.add({ ...definition, durationSeconds: undefined }, 'infinite-source'),
    );
    expect(infinite).toBe(first);
    expect(first.remainingDuration).toBeNull();

    const finiteAgain = requireAddedBuff(
      container.add(definition, 'finite-source', {
        blackboardValues: { duration: 7 },
      }),
    );
    expect(finiteAgain).toBe(first);
    expect(first.remainingDuration).toBe(7);
    expect(container.buffs).toHaveLength(1);
    expect(order).toEqual(['start', 'enable']);
  });

  it('enables a new HighPriority winner before disabling the previous one', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const prioritized = (
      id: string,
      priority: number,
      addition: number,
    ): CombatBuffDefinition<Attribute> => ({
      id,
      stackingKey: 'buff.high-priority',
      stackingType: 'highPriority',
      priority,
      attributeModifiers: [
        {
          attribute: 'attack',
          values: attributeModifierValues('addition', addition),
          timing: 'runtime',
        },
      ],
      actions: {
        start: () => order.push(`start:${id}`),
        enable: () => order.push(`enable:${id}:${attributes.get('attack')}`),
        disable: () => order.push(`disable:${id}:${attributes.get('attack')}`),
        finish: () => order.push(`finish:${id}:${attributes.get('attack')}`),
      },
    });

    const low = requireAddedBuff(container.add(prioritized('low', 1, 25), 'operator'));
    const high = requireAddedBuff(container.add(prioritized('high', 2, 50), 'operator'));

    expect(low.isEnabled).toBe(false);
    expect(high.isEnabled).toBe(true);
    expect(attributes.get('attack')).toBe(150);
    expect(order).toEqual([
      'start:low',
      'enable:low:125',
      'start:high',
      'enable:high:175',
      'disable:low:175',
    ]);

    high.finish('other');
    expect(low.isEnabled).toBe(true);
    expect(attributes.get('attack')).toBe(125);
    expect(order.slice(-2)).toEqual(['finish:high:150', 'enable:low:175']);
  });

  it('keeps losing HighPriority instances dormant and uses duration then uid as tie-breakers', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const starts: string[] = [];
    const prioritized = (id: string, durationSeconds: number): CombatBuffDefinition<Attribute> => ({
      id,
      stackingKey: 'buff.high-priority.tie',
      stackingType: 'highPriority',
      priority: 1,
      durationSeconds,
      actions: { start: () => starts.push(id) },
    });

    const short = requireAddedBuff(container.add(prioritized('short', 10), 'operator'));
    const firstLong = requireAddedBuff(container.add(prioritized('first-long', 20), 'operator'));
    const secondLong = requireAddedBuff(container.add(prioritized('second-long', 20), 'operator'));

    expect(short.isEnabled).toBe(false);
    expect(firstLong.isEnabled).toBe(true);
    expect(secondLong.isEnabled).toBe(false);
    expect(secondLong.isStarted).toBe(false);
    expect(starts).toEqual(['short', 'first-long']);

    firstLong.finish('other');
    expect(secondLong.isEnabled).toBe(true);
    expect(starts).toEqual(['short', 'first-long', 'second-long']);
  });

  it('enables the leading HighPriorityWithMaxStack instances and restores a dormant candidate', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const prioritized = (
      id: string,
      priority: number,
      addition: number,
    ): CombatBuffDefinition<Attribute> => ({
      id,
      stackingKey: 'buff.high-priority-with-limit',
      stackingType: 'highPriorityWithMaxStack',
      maxStackCount: { blackboardKey: 'limit' },
      priority,
      attributeModifiers: [
        {
          attribute: 'attack',
          values: attributeModifierValues('addition', addition),
          timing: 'runtime',
        },
      ],
    });

    const low = requireAddedBuff(
      container.add(prioritized('low', 1, 10), 'low-source', {
        blackboardValues: { limit: 2 },
      }),
    );
    const high = requireAddedBuff(
      container.add(prioritized('high', 3, 30), 'high-source', {
        blackboardValues: { limit: 1 },
      }),
    );
    const middle = requireAddedBuff(
      container.add(prioritized('middle', 2, 20), 'middle-source', {
        blackboardValues: { limit: 4 },
      }),
    );

    expect(low.isFinished).toBe(false);
    expect(low.isEnabled).toBe(false);
    expect(high.isEnabled).toBe(true);
    expect(middle.isEnabled).toBe(true);
    expect(attributes.get('attack')).toBe(150);
    expect(container.buffs).toHaveLength(3);

    high.finish('other');
    expect(high.isFinished).toBe(true);
    expect(low.isEnabled).toBe(true);
    expect(middle.isEnabled).toBe(true);
    expect(attributes.get('attack')).toBe(130);
    expect(container.buffs.filter(buff => !buff.isFinished)).toEqual([low, middle]);
  });

  it('uses duration and instance id as stable HighPriorityWithMaxStack tie-breakers', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const prioritized = (id: string, durationSeconds: number): CombatBuffDefinition<Attribute> => ({
      id,
      stackingKey: 'buff.high-priority-with-limit.tie',
      stackingType: 'highPriorityWithMaxStack',
      maxStackCount: 2,
      priority: 1,
      durationSeconds,
    });

    const short = requireAddedBuff(container.add(prioritized('short', 5), 'operator'));
    const firstLong = requireAddedBuff(container.add(prioritized('first-long', 10), 'operator'));
    const secondLong = requireAddedBuff(container.add(prioritized('second-long', 10), 'operator'));
    const thirdLong = requireAddedBuff(container.add(prioritized('third-long', 10), 'operator'));

    expect(short.isEnabled).toBe(false);
    expect(firstLong.isEnabled).toBe(true);
    expect(secondLong.isEnabled).toBe(true);
    expect(thirdLong.isEnabled).toBe(false);
    expect(thirdLong.isStarted).toBe(false);

    firstLong.finish('other');
    expect(short.isEnabled).toBe(false);
    expect(secondLong.isEnabled).toBe(true);
    expect(thirdLong.isEnabled).toBe(true);
    expect(thirdLong.isStarted).toBe(true);
  });

  it('keeps HighPriorityWithMaxStack instances dormant when the configured limit is zero', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.high-priority-with-zero-limit',
      stackingType: 'highPriorityWithMaxStack',
      maxStackCount: 0,
    };

    const first = requireAddedBuff(container.add(definition, 'first-source'));
    const second = requireAddedBuff(container.add(definition, 'second-source'));

    expect(first.isFinished).toBe(false);
    expect(second.isFinished).toBe(false);
    expect(first.isEnabled).toBe(false);
    expect(second.isEnabled).toBe(false);
    expect(first.isStarted).toBe(false);
    expect(second.isStarted).toBe(false);
  });

  it('ignores Stack configuration priority and replaces the last tied instance before enabling the incoming one', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const stack = (id: string, priority: number): CombatBuffDefinition<Attribute> => ({
      id,
      stackingKey: 'buff.stack',
      stackingType: 'stack',
      maxStackCount: 2,
      priority,
      actions: {
        start: () => order.push(`start:${id}`),
        finish: () => order.push(`finish:${id}`),
      },
    });

    const low = requireAddedBuff(container.add(stack('buff.low', 1), 'operator'));
    const middle = requireAddedBuff(container.add(stack('buff.middle', 2), 'operator'));
    const incoming = requireAddedBuff(container.add(stack('buff.incoming', 0), 'operator'));

    expect(low.isFinished).toBe(false);
    expect(middle.finishReason).toBe('other');
    expect(middle.isFinished).toBe(true);
    expect(incoming.isEnabled).toBe(true);
    expect(container.buffs.filter(buff => !buff.isFinished)).toEqual([low, incoming]);
    expect(order.slice(-2)).toEqual(['finish:buff.middle', 'start:buff.incoming']);
  });

  it('locks a dynamic Stack limit from the first instance blackboard', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.stack.dynamic-limit',
      stackingType: 'stack',
      maxStackCount: { blackboardKey: 'limit' },
      blackboard: { limit: 2 },
    };

    const first = requireAddedBuff(
      container.add(definition, 'first-source', {
        blackboardValues: { limit: 2 },
      }),
    );
    const second = requireAddedBuff(
      container.add(definition, 'second-source', {
        blackboardValues: { limit: 1 },
      }),
    );
    expect(first.isFinished).toBe(false);
    expect(second.isFinished).toBe(false);

    const third = requireAddedBuff(
      container.add(definition, 'third-source', {
        blackboardValues: { limit: 4 },
      }),
    );
    expect(first.isFinished).toBe(false);
    expect(second.isFinished).toBe(true);
    expect(third.isFinished).toBe(false);
    expect(container.buffs.filter(buff => !buff.isFinished)).toEqual([first, third]);
  });

  it.each([-1, 1.5, Number.POSITIVE_INFINITY])(
    'rejects invalid dynamic max stack count %s before allocating an instance',
    invalidLimit => {
      const attributes = new CombatAttributeSet<Attribute>();
      const container = new CombatBuffContainer('operator', attributes);

      expect(() =>
        container.add(
          {
            id: 'buff.stack.invalid-limit',
            stackingType: 'stack',
            maxStackCount: { blackboardKey: 'limit' },
            blackboard: { limit: 2 },
          },
          'source',
          { blackboardValues: { limit: invalidLimit } },
        ),
      ).toThrow('buff max stack count must resolve to a non-negative safe integer');
      expect(container.buffs).toEqual([]);
    },
  );

  it('breaks equal Stack priorities by remaining duration and then instance id', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const stack = (id: string, durationSeconds: number): CombatBuffDefinition<Attribute> => ({
      id,
      stackingKey: 'buff.stack.duration',
      stackingType: 'stack',
      maxStackCount: 2,
      priority: 1,
      durationSeconds,
    });

    const long = requireAddedBuff(container.add(stack('buff.long', 20), 'operator'));
    const short = requireAddedBuff(container.add(stack('buff.short', 10), 'operator'));
    container.add(stack('buff.incoming', 30), 'operator');
    expect(long.isFinished).toBe(false);
    expect(short.isFinished).toBe(true);

    const lifetimeContainer = new CombatBuffContainer('operator', attributes);
    const infinite = requireAddedBuff(
      lifetimeContainer.add(
        {
          ...stack('buff.infinite', 10),
          stackingKey: 'buff.stack.lifetime',
          durationSeconds: undefined,
        },
        'operator',
      ),
    );
    const finite = requireAddedBuff(
      lifetimeContainer.add(
        { ...stack('buff.finite', 10), stackingKey: 'buff.stack.lifetime' },
        'operator',
      ),
    );
    lifetimeContainer.add(
      { ...stack('buff.next', 10), stackingKey: 'buff.stack.lifetime' },
      'operator',
    );
    expect(infinite.isFinished).toBe(false);
    expect(finite.isFinished).toBe(true);

    const tieContainer = new CombatBuffContainer('operator', attributes);
    const tied = (id: string): CombatBuffDefinition<Attribute> => ({
      ...stack(id, 10),
      stackingKey: 'buff.stack.uid',
    });
    const first = requireAddedBuff(tieContainer.add(tied('buff.first'), 'operator'));
    const second = requireAddedBuff(tieContainer.add(tied('buff.second'), 'operator'));
    tieContainer.add(tied('buff.third'), 'operator');
    expect(first.isFinished).toBe(false);
    expect(second.isFinished).toBe(true);
  });

  it('resolves priority-type instance blackboards and supports negation', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const dynamic = (id: string, negate = false): CombatBuffDefinition<Attribute> => ({
      id,
      stackingKey: 'buff.stack.dynamic-priority',
      stackingType: 'highPriorityWithMaxStack',
      maxStackCount: 2,
      priority: { blackboardKey: 'priority', negate },
    });

    const high = requireAddedBuff(
      container.add(dynamic('buff.high'), 'operator', {
        blackboardValues: { priority: 4 },
      }),
    );
    const low = requireAddedBuff(
      container.add(dynamic('buff.low', true), 'operator', {
        blackboardValues: { priority: -2 },
      }),
    );
    container.add(dynamic('buff.incoming'), 'operator', {
      blackboardValues: { priority: 3 },
    });

    expect(high.priority).toBe(4);
    expect(low.priority).toBe(2);
    expect(high.isFinished).toBe(false);
    expect(low.isFinished).toBe(false);
    expect(high.isEnabled).toBe(true);
    expect(low.isEnabled).toBe(false);
    expect(() => container.add(dynamic('buff.missing'), 'operator')).toThrow(
      "priority blackboard key 'priority' is missing or not numeric",
    );
  });

  it.each(['stack', 'unlimited', 'unique', 'refresh'] as const)(
    '%s ignores residual priority configuration without reading missing keys',
    stackingType => {
      const container = new CombatBuffContainer('operator', new CombatAttributeSet<Attribute>());
      const buff = requireAddedBuff(
        container.add(
          {
            id: 'unused-priority',
            stackingType,
            priority: { blackboardKey: 'missing', negate: true },
          },
          'operator',
        ),
      );
      expect(buff.priority).toBe(0);
    },
  );

  it('enhances one instance, refreshes its lifetime, and still runs callbacks at the cap', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.attachment',
      stackingType: 'enhanceAndRefresh',
      durationSeconds: 8,
      maxStackCount: 2,
      actions: {
        beforeEnhance: buff => order.push(`before:${buff.enhanceCount}`),
        enhanceChanged: buff => order.push(`changed:${buff.enhanceCount}`),
        afterEnhance: buff => order.push(`after:${buff.enhanceCount}`),
      },
    };

    const first = requireAddedBuff(container.add(definition, 'operator'));
    const second = requireAddedBuff(container.add(definition, 'operator'));
    expect(second).toBe(first);
    expect(first.enhanceCount).toBe(2);
    expect(order).toEqual(['before:1', 'changed:2', 'after:2']);

    container.tick(3);
    const capped = requireAddedBuff(
      container.add({ ...definition, durationSeconds: 12 }, 'operator'),
    );
    expect(capped).toBe(first);
    expect(first.enhanceCount).toBe(2);
    expect(first.remainingDuration).toBe(12);
    expect(order).toEqual(['before:1', 'changed:2', 'after:2', 'before:2', 'after:2']);
  });

  it('enhances before overwriting duration and keeps the existing instance inputs', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const order: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.enhance-overwrite',
      stackingType: 'enhanceAndOverwriteDuration',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 8, value: 1 },
      maxStackCount: 2,
      actions: {
        start: () => order.push('start'),
        enable: () => order.push('enable'),
        beforeEnhance: (buff, sourceId) =>
          order.push(`before:${sourceId}:${buff.enhanceCount}:${buff.remainingDuration}`),
        enhanceChanged: (buff, sourceId) =>
          order.push(`changed:${sourceId}:${buff.enhanceCount}:${buff.remainingDuration}`),
        afterEnhance: (buff, sourceId) =>
          order.push(`after:${sourceId}:${buff.enhanceCount}:${buff.remainingDuration}`),
      },
    };

    const first = requireAddedBuff(
      container.add(definition, 'first-source', {
        blackboardValues: { duration: 10, value: 1 },
      }),
    );
    container.tick(4);
    const enhanced = requireAddedBuff(
      container.add(definition, 'second-source', {
        blackboardValues: { duration: 3, value: 2 },
      }),
    );

    expect(enhanced).toBe(first);
    expect(first.enhanceCount).toBe(2);
    expect(first.remainingDuration).toBe(3);
    expect(first.passedTime).toBe(4);
    expect(first.sourceId).toBe('first-source');
    expect(first.blackboard.getNumber('duration')).toBe(10);
    expect(first.blackboard.getNumber('value')).toBe(1);
    expect(container.buffs).toEqual([first]);
    expect(order).toEqual([
      'start',
      'enable',
      'before:second-source:1:6',
      'changed:second-source:2:6',
      'after:second-source:2:3',
    ]);

    container.tick(1);
    const capped = requireAddedBuff(
      container.add(definition, 'third-source', {
        blackboardValues: { duration: 12 },
      }),
    );
    expect(capped).toBe(first);
    expect(first.enhanceCount).toBe(2);
    expect(first.remainingDuration).toBe(12);
    expect(order.slice(-2)).toEqual(['before:third-source:2:2', 'after:third-source:2:12']);
    expect(order.filter(event => event === 'start')).toHaveLength(1);
    expect(order.filter(event => event === 'enable')).toHaveLength(1);
  });

  it('overwrites finite and infinite lifetimes in both directions while enhancing', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.enhance-overwrite.infinite',
      stackingType: 'enhanceAndOverwriteDuration',
      durationSeconds: 10,
      maxStackCount: 2,
    };
    const first = requireAddedBuff(container.add(definition, 'first-source'));

    container.add({ ...definition, durationSeconds: undefined }, 'infinite-source');
    expect(first.enhanceCount).toBe(2);
    expect(first.remainingDuration).toBeNull();

    container.add({ ...definition, durationSeconds: 7 }, 'finite-source');
    expect(first.enhanceCount).toBe(2);
    expect(first.remainingDuration).toBe(7);
  });

  it.each([Number.POSITIVE_INFINITY, Number.NaN])(
    'rejects non-finite enhance-and-overwrite duration %s without partial mutation',
    invalidDuration => {
      const attributes = new CombatAttributeSet<Attribute>();
      const container = new CombatBuffContainer('operator', attributes);
      const order: string[] = [];
      const definition: CombatBuffDefinition<Attribute> = {
        id: 'buff.enhance-overwrite.invalid',
        stackingType: 'enhanceAndOverwriteDuration',
        durationSeconds: { blackboardKey: 'duration' },
        blackboard: { duration: 10 },
        maxStackCount: 3,
        actions: {
          beforeEnhance: () => order.push('before'),
          enhanceChanged: () => order.push('changed'),
          afterEnhance: () => order.push('after'),
        },
      };
      const existing = requireAddedBuff(container.add(definition, 'first-source'));

      expect(() =>
        container.add(definition, 'invalid-source', {
          blackboardValues: { duration: invalidDuration },
        }),
      ).toThrow('buff duration must resolve to a finite number');
      expect(existing.enhanceCount).toBe(1);
      expect(existing.remainingDuration).toBe(10);
      expect(container.buffs).toEqual([existing]);
      expect(order).toEqual([]);
    },
  );

  it('uses native duration refresh and infinite-lifetime semantics', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const finite = requireAddedBuff(
      container.add(
        {
          id: 'buff.finite',
          stackingType: 'enhanceAndRefresh',
          durationSeconds: 8,
        },
        'operator',
      ),
    );

    container.add(
      {
        id: 'buff.finite',
        stackingType: 'enhanceAndRefresh',
        durationSeconds: 8.000005,
      },
      'operator',
    );
    expect(finite.remainingDuration).toBe(8);

    container.add(
      {
        id: 'buff.finite',
        stackingType: 'enhanceAndRefresh',
      },
      'operator',
    );
    expect(finite.remainingDuration).toBeNull();
  });

  it('keeps a stacking key type stable and starts a new instance after finish', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.first-id',
      stackingKey: 'shared-key',
      stackingType: 'enhanceAndRefresh',
      maxStackCount: 3,
    };
    const first = requireAddedBuff(container.add(definition, 'operator'));
    container.add(definition, 'operator');
    expect(first.enhanceCount).toBe(2);

    expect(() =>
      container.add(
        {
          id: 'buff.second-id',
          stackingKey: 'shared-key',
          stackingType: 'unlimited',
        },
        'operator',
      ),
    ).toThrow("stacking key 'shared-key' changed type");

    first.finish('other');
    const replacement = requireAddedBuff(container.add(definition, 'operator'));
    expect(replacement).not.toBe(first);
    expect(replacement.enhanceCount).toBe(1);
  });

  it('builds each buff blackboard from defaults and add options', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'buff.status',
          stackingType: 'unlimited',
          blackboard: { count: 0, label: 'default' },
        },
        'operator',
        { blackboardValues: { count: 3 } },
      ),
    );

    expect(buff.blackboard.getNumber('count')).toBe(3);
    expect(buff.blackboard.getString('label')).toBe('default');
  });

  it('routes EntityBB writes from a buff to its owner entity blackboard', () => {
    const entityBlackboard = new ActionBlackboard({ EntityBB_SwordNum: 0 });
    const container = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet<Attribute>(),
      undefined,
      null,
      entityBlackboard,
    );
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'buff.entity-blackboard-writer',
          stackingType: 'unique',
          triggerIntervalSeconds: 0.03,
          waitFirstTriggerInterval: false,
          maxTriggerCount: -1,
          blackboard: { swordsNum: 2 },
          actions: {
            trigger: current => {
              current.blackboard.assignDynamic(
                'EntityBB_SwordNum',
                current.blackboard.getNumber('swordsNum')!,
              );
            },
          },
        },
        'operator',
      ),
    );

    expect(buff.blackboard.snapshot()).toEqual({ swordsNum: 2 });
    expect(buff.blackboard.getNumber('EntityBB_SwordNum')).toBe(2);
    expect(entityBlackboard.getNumber('EntityBB_SwordNum')).toBe(2);
  });

  it('resolves dynamic duration after add options and refreshes from the incoming values', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.dynamic-duration',
      stackingType: 'enhanceAndRefresh',
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: { duration: 8 },
    };

    const buff = requireAddedBuff(
      container.add(definition, 'operator', {
        blackboardValues: { duration: 10 },
      }),
    );
    expect(buff.remainingDuration).toBe(10);
    container.tick(4);
    container.add(definition, 'operator', {
      blackboardValues: { duration: 12 },
    });

    expect(buff.remainingDuration).toBe(12);
    expect(buff.blackboard.getNumber('duration')).toBe(10);
  });

  it('rejects missing or invalid dynamic duration values', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    expect(() =>
      container.add(
        {
          id: 'buff.missing-duration',
          stackingType: 'unlimited',
          durationSeconds: { blackboardKey: 'duration' },
        },
        'operator',
      ),
    ).toThrow("duration blackboard key 'duration' is missing or not numeric");
  });

  it('triggers immediately and catches up every elapsed interval', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    const triggerTimes: number[] = [];
    container.add(
      {
        id: 'buff.periodic',
        stackingType: 'unlimited',
        triggerIntervalSeconds: 2,
        waitFirstTriggerInterval: false,
        maxTriggerCount: 3,
        actions: { trigger: buff => triggerTimes.push(buff.passedTime) },
      },
      'operator',
    );

    expect(triggerTimes).toEqual([0]);
    container.tick(5);
    expect(triggerTimes).toEqual([0, 5, 5]);
  });

  it('waits for the first interval and treats negative trigger count as unlimited', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    let triggerCount = 0;
    container.add(
      {
        id: 'buff.periodic-wait',
        stackingType: 'unlimited',
        triggerIntervalSeconds: 2,
        waitFirstTriggerInterval: true,
        maxTriggerCount: -1,
        actions: { trigger: () => (triggerCount += 1) },
      },
      'operator',
    );

    expect(triggerCount).toBe(0);
    container.tick(5);
    expect(triggerCount).toBe(2);
    container.tick(2);
    expect(triggerCount).toBe(3);
  });

  it('pauses periodic time while disabled but keeps advancing lifetime', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const container = new CombatBuffContainer('operator', attributes);
    let triggerCount = 0;
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'buff.periodic-disabled',
          stackingType: 'unlimited',
          durationSeconds: 10,
          triggerIntervalSeconds: 2,
          waitFirstTriggerInterval: true,
          maxTriggerCount: 1,
          actions: { trigger: () => (triggerCount += 1) },
        },
        'operator',
      ),
    );

    buff.disable();
    container.tick(3);
    expect(triggerCount).toBe(0);
    expect(buff.remainingDuration).toBe(7);
    buff.enable();
    container.tick(2);
    expect(triggerCount).toBe(1);
  });

  it('modifies the original instance blackboard and registered attribute modifiers in place', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const lifecycle: string[] = [];
    const triggeredValues: number[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.modify.original',
      stackingKey: 'buff.modify',
      stackingType: 'modify',
      durationSeconds: 10,
      triggerIntervalSeconds: 2,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      blackboard: { bonus: 5, retained: 'original' },
      attributeModifiers: [
        {
          attribute: 'attack',
          values: { slot: 'addition', blackboardKey: 'bonus' },
          timing: 'runtime',
        },
      ],
      actions: {
        start: () => lifecycle.push('original-start'),
        enable: () => lifecycle.push('original-enable'),
        trigger: buff => triggeredValues.push(buff.blackboard.getNumber('bonus') ?? -1),
      },
    };
    const buff = requireAddedBuff(
      container.add(definition, 'original-source', {
        blackboardValues: { bonus: 10 },
      }),
    );
    container.tick(1);

    const modified = container.add(
      {
        ...definition,
        id: 'buff.modify.incoming',
        durationSeconds: 30,
        attributeModifiers: [
          {
            attribute: 'attack',
            values: attributeModifierValues('addition', 500),
            timing: 'runtime',
          },
        ],
        actions: {
          start: () => lifecycle.push('incoming-start'),
          enable: () => lifecycle.push('incoming-enable'),
        },
      },
      'incoming-source',
      { blackboardValues: { bonus: 25, added: 3 } },
    );

    expect(modified).toBe(buff);
    expect(buff.definition).toBe(definition);
    expect(buff.sourceId).toBe('original-source');
    expect(buff.passedTime).toBe(1);
    expect(buff.remainingDuration).toBe(9);
    expect(buff.blackboard.snapshot()).toEqual({
      bonus: 25,
      retained: 'original',
      added: 3,
    });
    expect(attributes.get('attack')).toBe(125);
    expect(attributes.modifierCount).toBe(1);
    expect(lifecycle).toEqual(['original-start', 'original-enable']);

    container.tick(1);
    expect(triggeredValues).toEqual([25]);
    buff.finish('other');
    expect(attributes.get('attack')).toBe(100);
  });

  it('rolls back the blackboard and keeps old modifiers when modify cannot resolve a value', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.modify.rollback',
      stackingType: 'modify',
      blackboard: { bonus: 10, retained: 1 },
      attributeModifiers: [
        {
          attribute: 'attack',
          values: { slot: 'addition', blackboardKey: 'bonus' },
          timing: 'runtime',
        },
      ],
    };
    const buff = requireAddedBuff(container.add(definition, 'operator'));

    expect(() =>
      container.add(definition, 'operator', {
        blackboardValues: { bonus: 'invalid', added: 2 },
      }),
    ).toThrow("attribute modifier blackboard key 'bonus' is missing or not numeric");

    expect(buff.blackboard.snapshot()).toEqual({ bonus: 10, retained: 1 });
    expect(attributes.get('attack')).toBe(110);
    expect(attributes.modifierCount).toBe(1);
    expect(buff.attributeModifiers).toHaveLength(1);
  });

  it('refreshes registered attribute modifier values from the current buff blackboard', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const lifecycle: string[] = [];
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'buff.attribute.refresh',
          stackingType: 'unlimited',
          blackboard: { bonus: 10 },
          attributeModifiers: [
            {
              attribute: 'attack',
              values: { slot: 'addition', blackboardKey: 'bonus' },
              timing: 'runtime',
            },
          ],
          actions: {
            start: () => lifecycle.push('start'),
            enable: () => lifecycle.push('enable'),
            disable: () => lifecycle.push('disable'),
          },
        },
        'operator',
      ),
    );

    const initialModifier = buff.attributeModifiers[0];
    buff.blackboard.assignDynamic('bonus', 35);
    expect(attributes.get('attack')).toBe(110);

    buff.refreshAttributeModifierValues();
    expect(attributes.get('attack')).toBe(135);
    expect(attributes.modifierCount).toBe(1);
    expect(buff.attributeModifiers[0]).not.toBe(initialModifier);
    expect(lifecycle).toEqual(['start', 'enable']);

    buff.disable();
    buff.blackboard.assignDynamic('bonus', 45);
    buff.refreshAttributeModifierValues();
    expect(attributes.get('attack')).toBe(100);
    buff.enable();
    expect(attributes.get('attack')).toBe(145);
    expect(lifecycle).toEqual(['start', 'enable', 'disable', 'enable']);
  });

  it('registers one copy of each attribute modifier per enhance layer', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.attribute.enhance',
      stackingType: 'enhanceAndRefresh',
      maxStackCount: 2,
      durationSeconds: 5,
      attributeModifiers: [
        {
          attribute: 'attack',
          values: attributeModifierValues('baseMultiplier', 0.2),
          timing: 'runtime',
        },
      ],
    };

    const buff = requireAddedBuff(container.add(definition, 'operator'));
    expect(attributes.get('attack')).toBe(120);
    expect(buff.attributeModifiers).toHaveLength(1);

    expect(container.add(definition, 'operator')).toBe(buff);
    expect(buff.enhanceCount).toBe(2);
    expect(buff.attributeModifiers).toHaveLength(2);
    expect(attributes.get('attack')).toBe(140);

    // 达到上限后只刷新持续时间，不再重复注册修正。
    expect(container.add(definition, 'operator')).toBe(buff);
    expect(buff.enhanceCount).toBe(2);
    expect(attributes.modifierCount).toBe(2);
    expect(attributes.get('attack')).toBe(140);
  });

  it('keeps the previous modifier registered when refreshing an invalid blackboard value', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'buff.attribute.refresh.invalid',
          stackingType: 'unlimited',
          blackboard: { bonus: 10 },
          attributeModifiers: [
            {
              attribute: 'attack',
              values: { slot: 'addition', blackboardKey: 'bonus' },
              timing: 'runtime',
            },
          ],
        },
        'operator',
      ),
    );
    const previousModifier = buff.attributeModifiers[0];
    buff.blackboard.assign({ bonus: 'invalid' });

    expect(() => buff.refreshAttributeModifierValues()).toThrow(
      "attribute modifier blackboard key 'bonus' is missing or not numeric",
    );
    expect(buff.attributeModifiers[0]).toBe(previousModifier);
    expect(attributes.modifierCount).toBe(1);
    expect(attributes.get('attack')).toBe(110);
    expect(buff.blackboard.getNumber('bonus')).toBeUndefined();
  });

  it('registers and unregisters shared SP gain modifiers with the buff lifecycle', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const sharedSpGainModifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
    const container = new CombatBuffContainer(
      'operator',
      attributes,
      new GameplayTagRegistry([]),
      sharedSpGainModifiers,
    );
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'buff.shared-sp.lifecycle',
          stackingType: 'unlimited',
          sharedSpGainModifiers: [
            {
              attribute: 'powerAttackEfficiency',
              operation: 'addition',
              value: 0.5,
              applyToReturnSpGain: false,
            },
          ],
        },
        'operator',
      ),
    );

    expect(sharedSpGainModifiers.modifierCount).toBe(1);
    expect(sharedSpGainModifiers.resolve('powerAttack', 'gain').totalEfficiency).toBe(1.5);

    buff.enable();
    expect(sharedSpGainModifiers.modifierCount).toBe(1);

    buff.disable();
    expect(sharedSpGainModifiers.modifierCount).toBe(0);
    expect(sharedSpGainModifiers.resolve('powerAttack', 'gain').totalEfficiency).toBe(1);

    buff.enable();
    expect(sharedSpGainModifiers.modifierCount).toBe(1);
    buff.finish('other');
    expect(sharedSpGainModifiers.modifierCount).toBe(0);
  });

  it('keeps equal shared SP modifiers isolated by buff instance identity', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const sharedSpGainModifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
    const container = new CombatBuffContainer(
      'operator',
      attributes,
      new GameplayTagRegistry([]),
      sharedSpGainModifiers,
    );
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.shared-sp.instances',
      stackingType: 'unlimited',
      sharedSpGainModifiers: [
        {
          attribute: 'gainEfficiency',
          operation: 'addition',
          value: 0.25,
          applyToReturnSpGain: true,
        },
      ],
    };
    const first = requireAddedBuff(container.add(definition, 'first'));
    requireAddedBuff(container.add(definition, 'second'));

    expect(sharedSpGainModifiers.modifierCount).toBe(2);
    expect(sharedSpGainModifiers.resolve('skill', 'gain').totalEfficiency).toBe(1.5);

    first.disable();
    expect(sharedSpGainModifiers.modifierCount).toBe(1);
    expect(sharedSpGainModifiers.resolve('skill', 'gain').totalEfficiency).toBe(1.25);
  });

  it('rejects a shared SP modifier buff when its container has no battle registry', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<Attribute>());

    expect(() =>
      container.add(
        {
          id: 'buff.shared-sp.missing-registry',
          stackingType: 'unlimited',
          sharedSpGainModifiers: [
            {
              attribute: 'gainEfficiency',
              operation: 'addition',
              value: 0.25,
              applyToReturnSpGain: true,
            },
          ],
        },
        'operator',
      ),
    ).toThrow(
      "buff 'buff.shared-sp.missing-registry' requires a shared SP gain modifier set on its owner",
    );
  });

  it('holds only the Buff instances matched at start and follows native delayed-finish semantics', () => {
    const extendTagPath = 'buff/operator/ultimate/extended';
    const extendTag = extendTagPath;
    const container = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet<Attribute>(),
      new GameplayTagRegistry([extendTagPath]),
    );
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.ultimate.base',
      stackingType: 'unlimited',
      durationSeconds: 1,
      extendTags: [extendTag],
    };
    const held = requireAddedBuff(container.add(definition, 'operator'));
    const hold = container.holdByIds([definition.id]);
    const addedAfterHold = requireAddedBuff(container.add(definition, 'operator'));

    container.tick(1);

    expect(held.isFinished).toBe(false);
    expect(held.isFinishable).toBe(false);
    expect(addedAfterHold.isFinished).toBe(true);
    expect(container.hasEntityTag(extendTag)).toBe(true);

    hold.release();
    // 原生 SetFinishable(true) 只在剩余时长严格小于 0 时立即结束。
    expect(held.isFinished).toBe(false);
    container.tick(1 / 30);
    expect(held.finishReason).toBe('lifetime');
    expect(container.hasEntityTag(extendTag)).toBe(false);
  });

  it('advances each Buff with the time domain selected by its definition', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<Attribute>());
    const add = (id: string, timeClock?: 'default' | 'global' | 'self') =>
      requireAddedBuff(
        container.add(
          {
            id,
            ...(timeClock === undefined ? {} : { timeClock }),
            stackingType: 'unlimited',
            durationSeconds: 10,
          },
          'operator',
        ),
      );
    const defaultBuff = add('buff.default');
    const globalBuff = add('buff.global', 'global');
    const selfBuff = add('buff.self', 'self');

    container.tick({
      defaultDeltaSeconds: 1,
      globalScaledDeltaSeconds: 0.5,
      selfScaledDeltaSeconds: 0.25,
    });

    expect(defaultBuff.passedTime).toBe(1);
    expect(globalBuff.passedTime).toBe(0.5);
    expect(selfBuff.passedTime).toBe(0.25);
  });

  it('finishes a limited number of matching Buff instances in insertion order', () => {
    const finished: number[] = [];
    const container = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet<Attribute>(),
      undefined,
      null,
      undefined,
      buff => finished.push(buff.instanceId),
    );
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'buff.stack',
      stackingType: 'stack',
      maxStackCount: 3,
    };
    const first = requireAddedBuff(container.add(definition, 'operator'));
    requireAddedBuff(container.add(definition, 'operator'));
    requireAddedBuff(container.add(definition, 'operator'));

    expect(container.finishCountByIds([definition.id], 1, 'other')).toBe(1);
    expect(finished).toEqual([first.instanceId]);
    expect(container.getCountById(definition.id)).toBe(2);
  });

  it('decreases one enhance layer through a limited tag finish', () => {
    const tagPath = 'buff/status/fire';
    const tag = tagPath;
    const container = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet<Attribute>(),
      new GameplayTagRegistry([tagPath]),
    );
    const definition: CombatBuffDefinition<Attribute> = {
      id: 'fire-infliction',
      stackingType: 'enhance',
      maxStackCount: 4,
      applyTags: [tag],
    };
    container.add(definition, 'operator');
    container.add(definition, 'operator');
    container.add(definition, 'operator');

    expect(container.getCountById(definition.id)).toBe(3);
    expect(container.finishCountByTags([tag], 'hasAny', 1, 'early')).toBe(1);
    expect(container.getCountById(definition.id)).toBe(2);
  });

  it('publishes absorbed Buff identity with absorber and owner kept separate', () => {
    const observed: string[] = [];
    const tag = 'Skill/Character/Common/SpellInflict/FireInflict';
    const container = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet<Attribute>(),
      new GameplayTagRegistry([tag]),
    );
    container.configureAbsorbedObserver((buff, sourceId, layers) => {
      observed.push(`${sourceId}:${container.ownerId}:${buff.definition.id}:${layers}`);
    });
    container.add(
      {
        id: 'fire-infliction',
        stackingType: 'enhance',
        maxStackCount: 4,
        applyTags: [tag],
      },
      'original-source',
    );
    container.add(
      {
        id: 'fire-infliction',
        stackingType: 'enhance',
        maxStackCount: 4,
        applyTags: [tag],
      },
      'original-source',
    );

    expect(container.finishByTags([tag], 'hasAny', 'absorbed', false, 'camille')).toBe(1);
    expect(observed).toEqual(['camille:enemy:fire-infliction:2']);
  });

  it('dispatches typed ignite events only to active matching Buff definitions', () => {
    const reached: string[] = [];
    const consumed: string[] = [];
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());
    container.configureConsumedObserver((buff, sourceId, layers) => {
      consumed.push(
        `${buff.definition.id}:${sourceId}:${layers}:${buff.blackboard.getNumber('count')}`,
      );
    });
    const matching = requireAddedBuff(
      container.add(
        {
          id: 'frozen',
          stackingType: 'unlimited',
          blackboard: { count: 3 },
          actions: {
            ignite: (buff, igniteType, sourceId) => {
              if (igniteType !== 'EndminUlt') return false;
              reached.push(`${buff.instanceId}:${sourceId}`);
              buff.finish('other');
              return true;
            },
          },
        },
        'original-source',
      ),
    );
    container.add({ id: 'other', stackingType: 'unlimited' }, 'original-source');

    expect(container.ignite('PhysicalStatus', 'operator')).toBe(0);
    expect(container.ignite('EndminUlt', 'operator')).toBe(1);
    expect(container.ignite('EndminUlt', 'operator')).toBe(0);
    expect(reached).toEqual([`${matching.instanceId}:operator`]);
    // 点燃映射中的普通结束不是消费；遍历器不能根据 isFinished 补造事件。
    expect(consumed).toEqual([]);
  });

  it('absorbs damage with native shield ratio, scale, priority, and depletion semantics', () => {
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());
    const addShield = (id: string, value: number, priority: 'normal' | 'prioritizeConsume') =>
      requireAddedBuff(
        container.add(
          {
            id,
            stackingType: 'unlimited',
            shields: [
              {
                infinityValue: false,
                value,
                absorbCount: -1,
                absorbAllDamageWhenConsumed: false,
                removeBuffWhenConsumed: true,
                priority,
                replaceHitEffect: false,
                damageAbsorptions:
                  id === 'ratio' ? [{ damageType: 'heat', ratio: 0.5, scale: 2 }] : [],
              },
            ],
          },
          'enemy',
        ),
      );
    const normal = addShield('ratio', 100, 'normal');
    const prioritized = addShield('priority', 40, 'prioritizeConsume');

    expect(container.absorbDamage('heat', 100)).toBe(30);
    expect(prioritized.isFinished).toBe(true);
    expect(normal.shields[0]?.remainingValue).toBe(85);

    expect(container.absorbDamage('physical', 100)).toBe(15);
    expect(normal.isFinished).toBe(true);
    expect(container.shields).toEqual([]);
  });

  it('reports each added shield group after registration with gained and current finite values', () => {
    const added: Array<readonly [number, number]> = [];
    const container = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet<Attribute>(),
      undefined,
      null,
      undefined,
      undefined,
      undefined,
      undefined,
      (gained, current) => added.push([gained, current]),
    );
    const shield = (id: string, value: number) =>
      container.add(
        {
          id,
          stackingType: 'unlimited',
          shields: [
            {
              infinityValue: false,
              value,
              absorbCount: -1,
              absorbAllDamageWhenConsumed: false,
              removeBuffWhenConsumed: false,
              priority: 'normal',
              replaceHitEffect: false,
              damageAbsorptions: [],
            },
          ],
        },
        'operator',
      );
    shield('first', 100);
    shield('second', 50);
    expect(added).toEqual([
      [100, 100],
      [50, 150],
    ]);
  });

  it('freezes an attribute-scaled shield value when its Buff instance is created', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 200, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'attribute-shield',
          stackingType: 'unlimited',
          blackboard: { multiplier: 0.5, addition: 100 },
          shields: [
            {
              infinityValue: false,
              value: {
                attribute: 'attack',
                multiplier: { blackboardKey: 'multiplier' },
                addition: { blackboardKey: 'addition' },
              },
              absorbCount: -1,
              absorbAllDamageWhenConsumed: false,
              removeBuffWhenConsumed: true,
              priority: 'normal',
              replaceHitEffect: false,
              damageAbsorptions: [],
            },
          ],
        },
        'operator',
      ),
    );

    expect(buff.shields[0]?.maxValue).toBe(200);
    attributes.setRawValue('attack', 500);
    expect(buff.shields[0]?.maxValue).toBe(200);
  });

  it('freezes a cross-entity attribute shield from the Buff source rather than its owner', () => {
    const ownerAttributes = new CombatAttributeSet<Attribute>();
    ownerAttributes.define('attack', 200, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('protected-ally', ownerAttributes);
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'source-attribute-shield',
          stackingType: 'unlimited',
          blackboard: { multiplier: 0.5, addition: 100 },
          shields: [
            {
              infinityValue: false,
              value: {
                attributeSource: 'buffSource',
                attribute: 'attack',
                multiplier: { blackboardKey: 'multiplier' },
                addition: { blackboardKey: 'addition' },
              },
              absorbCount: -1,
              absorbAllDamageWhenConsumed: false,
              removeBuffWhenConsumed: true,
              priority: 'normal',
              replaceHitEffect: false,
              damageAbsorptions: [],
            },
          ],
        },
        'catcher',
        { getSourceAttributeValue: attribute => (attribute === 'attack' ? 400 : 0) },
      ),
    );

    expect(buff.shields[0]?.maxValue).toBe(300);
  });

  it('registers sustained protection only while the owning Buff is enabled', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<Attribute>());
    const low = requireAddedBuff(
      container.add(
        {
          id: 'low',
          stackingType: 'unlimited',
          sustainedProtection: { target: 'owner', superArmor: 20, impactResistance: 40 },
        },
        'operator',
      ),
    );
    const high = requireAddedBuff(
      container.add(
        {
          id: 'high',
          stackingType: 'unlimited',
          sustainedProtection: { target: 'buffSource', superArmor: 35, impactResistance: 100 },
        },
        'operator',
      ),
    );

    expect(container.superArmor).toBe(35);
    expect(container.impactResistance).toBe(100);
    high.finish();
    expect(container.superArmor).toBe(20);
    expect(container.impactResistance).toBe(40);
    low.finish();
    expect(container.superArmor).toBe(0);
  });

  it('TimedGrowingEnhance 按周期补层、跨大步长追赶并在满层保持', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const definition = {
      id: 'arrow-recovery',
      stackingType: 'timedGrowingEnhance',
      durationSeconds: 3,
      maxStackCount: 4,
    } as const;
    const buff = requireAddedBuff(container.add(definition, 'operator'));

    expect(buff.enhanceCount).toBe(1);
    buff.tick(2.9);
    expect(buff.enhanceCount).toBe(1);
    buff.tick(0.2);
    expect(buff.enhanceCount).toBe(2);
    buff.tick(6.1);
    expect(buff.enhanceCount).toBe(4);
    buff.tick(30);
    expect(buff.enhanceCount).toBe(4);

    expect(buff.decreaseEnhanceCount(2, 'other')).toBe(true);
    buff.tick(3);
    expect(buff.enhanceCount).toBe(3);
  });

  it('TimedGrowingEnhance 未满层的外部增强不重置当前成长计时', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const definition = {
      id: 'arrow-recovery',
      stackingType: 'timedGrowingEnhance',
      durationSeconds: 3,
      maxStackCount: 4,
    } as const;
    const buff = requireAddedBuff(container.add(definition, 'operator'));
    buff.tick(2);
    expect(container.add(definition, 'operator')).toBe(buff);
    expect(buff.enhanceCount).toBe(2);
    buff.tick(1.1);
    expect(buff.enhanceCount).toBe(3);
  });

  it('Buff 添加冷却在接收者上拒绝同 ID 重复添加并按普通时间到期', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const definition = {
      id: 'arrow-buffer',
      stackingType: 'unlimited',
      durationSeconds: 3,
      addingCooldownSeconds: 0.2,
    } as const;

    expect(container.add(definition, 'operator')).not.toBeNull();
    expect(container.add(definition, 'operator')).toBeNull();
    container.tick(0.19);
    expect(container.add(definition, 'operator')).toBeNull();
    container.tick(0.02);
    expect(container.add(definition, 'operator')).not.toBeNull();
  });

  it('ignoreAddingCooldown 只跳过检查，成功添加仍创建新的冷却标记', () => {
    const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const bypass = {
      id: 'arrow-buffer',
      stackingType: 'unlimited',
      addingCooldownSeconds: 0.2,
      ignoreAddingCooldown: true,
    } as const;
    expect(container.add(bypass, 'operator')).not.toBeNull();
    expect(container.add(bypass, 'operator')).not.toBeNull();
    expect(container.add({ ...bypass, ignoreAddingCooldown: false }, 'operator')).toBeNull();
  });

  it('Main 属性修正在 Buff 安装时由所属干员身份延迟解析', () => {
    type Primary = 'strength' | 'agility';
    const attributes = new CombatAttributeSet<Primary>();
    attributes.define('strength', 100, { minimum: 0, maximum: 1000 });
    attributes.define('agility', 80, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer(
      'operator',
      attributes,
      undefined,
      null,
      undefined,
      undefined,
      undefined,
      selector => (selector.kind === 'main' ? ['agility'] : ['strength', 'agility']),
    );
    const buff = requireAddedBuff(
      container.add(
        {
          id: 'main-attribute-down',
          stackingType: 'unlimited',
          attributeModifiers: [
            {
              attribute: { kind: 'main' },
              values: attributeModifierValues('finalMultiplier', 0.9),
              timing: 'runtime',
            },
          ],
        },
        'operator',
      ),
    );

    expect(attributes.get('strength')).toBe(100);
    expect(attributes.get('agility')).toBe(72);
    buff.finish('other');
    expect(attributes.get('agility')).toBe(80);
  });
});
