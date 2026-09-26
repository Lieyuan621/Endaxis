import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer, type CombatBuffDefinition } from '../buffs/combatBuffs';
import type { InflictionElement } from '../../game-data/operatorDefinition';
import { resolveElementalInfliction } from './elementalInfliction';
import {
  createElementalAttachmentLifecycleActions,
  ElementalInflictionBuffAdapter,
  type ElementalInflictionBuffIndex,
} from './elementalInflictionBuffAdapter';

type Attribute = 'attack';

function attachment(element: InflictionElement): CombatBuffDefinition<Attribute> {
  return {
    id: `attachment.${element}`,
    stackingType: 'enhanceAndRefresh',
    stackingKey: `attachment.${element}`,
    maxStackCount: 4,
    durationSeconds: 10,
  };
}

const index: ElementalInflictionBuffIndex<Attribute> = {
  getAttachmentElement: definition =>
    definition.id.startsWith('attachment.')
      ? (definition.id.slice('attachment.'.length) as InflictionElement)
      : null,
  getAttachment: attachment,
  getBurst: element => ({ id: `burst.${element}`, stackingType: 'unlimited' }),
  getCompoundStatus: (consumed, incoming) => ({
    id: `status.${consumed}.${incoming}`,
    stackingType: 'unlimited',
    blackboard: { consumed_type: -1, consumed_layer: 0, count: 0 },
  }),
};

function createAdapter() {
  const attributes = new CombatAttributeSet<Attribute>();
  const target = new CombatBuffContainer('enemy', attributes);
  return {
    target,
    adapter: new ElementalInflictionBuffAdapter(target, 'operator', index),
  };
}

describe('ElementalInflictionBuffAdapter', () => {
  it('反向附着只交换反应选表顺序，消耗元素和层数保持原值', () => {
    const { target, adapter } = createAdapter();
    adapter.apply({ kind: 'addAttachment', element: 'cryo' });
    for (const operation of resolveElementalInfliction(
      'nature',
      adapter.getExistingAttachment(),
      true,
    ))
      adapter.apply(operation);
    const status = target.findFirst(buff => buff.definition.id === 'status.nature.cryo');
    expect(status?.blackboard.snapshot()).toMatchObject({
      consumed_type: 2,
      consumed_layer: 1,
      count: 1,
    });
    expect(target.findFirst(buff => buff.definition.id === 'attachment.cryo')).toBeUndefined();
  });
  it('附着消费走公共实例结束入口，消费来源不是原始施加者，通知发生在结束之后', () => {
    const { target } = createAdapter();
    const producer = new ElementalInflictionBuffAdapter(target, 'producer', index);
    const consumer = new ElementalInflictionBuffAdapter(target, 'consumer', index);
    const identity = producer.apply({ kind: 'addAttachment', element: 'heat' });
    producer.apply({ kind: 'addAttachment', element: 'heat' });
    const observed: unknown[] = [];
    target.configureConsumedObserver((buff, sourceId, layers) => {
      expect(buff.isFinished).toBe(true);
      expect(buff.isEnabled).toBe(false);
      observed.push({
        instanceId: buff.instanceId,
        sourceId,
        layers,
        originalSource: buff.sourceId,
      });
    });
    const existing = consumer.getExistingAttachment()!;
    consumer.apply({ kind: 'consumeAttachment', attachment: existing });
    expect(observed).toEqual([
      {
        instanceId: identity!.instanceId,
        sourceId: 'consumer',
        layers: 2,
        originalSource: 'producer',
      },
    ]);
    expect(() => consumer.apply({ kind: 'consumeAttachment', attachment: existing })).toThrow();
    expect(observed).toHaveLength(1);
  });

  it('returns the actual consumed and created identities without looking them up after callbacks', () => {
    const { adapter } = createAdapter();
    const applied = adapter.apply({ kind: 'addAttachment', element: 'heat' });
    expect(applied?.buffId).toBe('attachment.heat');
    const existing = adapter.getExistingAttachment()!;
    const consumed = adapter.apply({ kind: 'consumeAttachment', attachment: existing });
    expect(consumed).toEqual(applied);
    const output = adapter.apply({
      kind: 'createCompoundStatus',
      consumedElement: 'heat',
      incomingElement: 'electric',
      consumedLayers: existing.layers,
    });
    expect(output?.buffId).toBe('status.heat.electric');
    expect(output?.instanceId).not.toBe(applied?.instanceId);
  });

  it('inverseReaction 交换复合状态的选表顺序，黑板仍记录真实消耗元素', () => {
    const { adapter } = createAdapter();
    const applied = adapter.apply({ kind: 'addAttachment', element: 'heat' });
    const existing = adapter.getExistingAttachment()!;
    adapter.apply({ kind: 'consumeAttachment', attachment: existing });
    const output = adapter.apply({
      kind: 'createCompoundStatus',
      inverseReaction: true,
      consumedElement: 'heat',
      incomingElement: 'electric',
      consumedLayers: existing.layers,
    });
    expect(output?.buffId).toBe('status.electric.heat');
    expect(output?.instanceId).not.toBe(applied?.instanceId);
  });
  it.each([
    { kind: 'addAttachment', element: 'cryo' },
    { kind: 'triggerBurst', element: 'heat' },
    {
      kind: 'createCompoundStatus',
      consumedElement: 'electric',
      incomingElement: 'nature',
      consumedLayers: 1,
    },
  ] as const)('$kind 的两侧前置事件早于创建，添加失败不发布成功事件', operation => {
    const target = new CombatBuffContainer<Attribute>('enemy', new CombatAttributeSet<Attribute>());
    const calls: string[] = [];
    const add = vi.spyOn(target, 'add').mockImplementationOnce(() => {
      calls.push('create');
      return null;
    });
    const adapter = new ElementalInflictionBuffAdapter(
      target,
      'operator',
      index,
      undefined,
      () => calls.push('added'),
      undefined,
      () => calls.push('before-output'),
      () => calls.push('output'),
      event => {
        expect(event.sourceId).toBe('operator');
        expect(event.targetId).toBe('enemy');
        calls.push('before-added');
      },
    );
    adapter.apply(operation);
    expect(calls).toEqual(['before-output', 'before-added', 'create']);
    add.mockRestore();
    calls.length = 0;
    adapter.apply(operation);
    expect(calls).toEqual(['before-output', 'before-added', 'added', 'output']);
  });

  it('copies each incoming cast into burst/status Buffs and preserves event ordering', () => {
    const target = new CombatBuffContainer<Attribute>('enemy', new CombatAttributeSet<Attribute>());
    const calls: string[] = [];
    const first = {
      skillCastId: 1,
      originSkillId: 'battle',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 100,
    };
    const next = {
      ...first,
      skillCastId: 2,
      originSkillId: 'combo',
      originSkillType: 'comboSkill' as const,
    };
    const adapter = new ElementalInflictionBuffAdapter(
      target,
      'operator',
      index,
      undefined,
      event => calls.push(`added:${event.buffId}:${event.skillCastInfo?.skillCastId}`),
      undefined,
      event => calls.push(`before:${event.buffId}:${event.skillCastInfo?.skillCastId}`),
      event => calls.push(`output:${event.buffId}:${event.skillCastInfo?.skillCastId}`),
      event => calls.push(`receiving:${event.buffId}:${event.skillCastInfo?.skillCastId}`),
    );
    adapter.apply({ kind: 'addAttachment', element: 'heat' }, { skillCastInfo: first });
    for (const operation of resolveElementalInfliction('heat', adapter.getExistingAttachment())) {
      adapter.apply(operation, { skillCastInfo: next });
    }
    expect(target.findFirst(buff => buff.definition.id === 'burst.heat')?.skillCastInfo).toEqual(
      next,
    );
    for (const operation of resolveElementalInfliction(
      'electric',
      adapter.getExistingAttachment(),
    )) {
      adapter.apply(operation, { skillCastInfo: first });
    }
    expect(
      target.findFirst(buff => buff.definition.id === 'status.heat.electric')?.skillCastInfo,
    ).toEqual(first);
    expect(calls.slice(4, 8)).toEqual([
      'before:burst.heat:2',
      'receiving:burst.heat:2',
      'added:burst.heat:2',
      'output:burst.heat:2',
    ]);
    adapter.apply({ kind: 'triggerBurst', element: 'heat' });
    expect(
      target.buffs.filter(buff => buff.definition.id === 'burst.heat').at(-1)?.skillCastInfo,
    ).toBeNull();
  });

  it('attributes consumed attachments to the incoming skill cast', () => {
    const target = new CombatBuffContainer<Attribute>('enemy', new CombatAttributeSet<Attribute>());
    const consumed: unknown[] = [];
    target.configureConsumedObserver((_buff, _sourceId, _layers, skillCastInfo) => {
      consumed.push(skillCastInfo);
    });
    const cast = {
      skillCastId: 7,
      originSkillId: 'battle',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 100,
    };
    const adapter = new ElementalInflictionBuffAdapter(target, 'operator', index);
    adapter.apply({ kind: 'addAttachment', element: 'heat' });

    for (const operation of resolveElementalInfliction(
      'electric',
      adapter.getExistingAttachment(),
    )) {
      adapter.apply(operation, { skillCastInfo: cast });
    }

    expect(consumed).toEqual([cast]);
  });

  it('adds and enhances same-type attachments after creating the burst', () => {
    const { target, adapter } = createAdapter();
    for (const operation of resolveElementalInfliction('heat', null)) adapter.apply(operation);
    const existing = adapter.getExistingAttachment();
    expect(existing).toEqual({ element: 'heat', layers: 1 });

    for (const operation of resolveElementalInfliction('heat', existing)) {
      adapter.apply(operation);
    }
    expect(adapter.getExistingAttachment()).toEqual({ element: 'heat', layers: 2 });
    expect(target.getCountById('burst.heat')).toBe(1);
  });

  it('consumes a different attachment and assigns native compound-status values', () => {
    const { target, adapter } = createAdapter();
    target.add(attachment('cryo'), 'operator');
    target.add(attachment('cryo'), 'operator');
    target.add(attachment('cryo'), 'operator');
    const existing = adapter.getExistingAttachment();

    for (const operation of resolveElementalInfliction('nature', existing)) {
      adapter.apply(operation);
    }

    expect(adapter.getExistingAttachment()).toBeNull();
    const status = target.findFirst(buff => buff.definition.id === 'status.cryo.nature');
    expect(status?.blackboard.snapshot()).toEqual({
      consumed_type: 2,
      consumed_layer: 3,
      count: 3,
    });
  });

  it('publishes attachment-start data on initial application and subsequent enhancement', () => {
    const attributes = new CombatAttributeSet<Attribute>();
    const target = new CombatBuffContainer('enemy', attributes);
    const events: string[] = [];
    const definition: CombatBuffDefinition<Attribute> = {
      ...attachment('electric'),
      actions: createElementalAttachmentLifecycleActions('electric', (payload, buff) => {
        events.push(`${payload.element}:${payload.layers}:${buff.owner.ownerId}`);
      }),
    };

    target.add(definition, 'operator');
    expect(events).toEqual(['electric:1:enemy']);
    target.add(definition, 'operator');
    expect(events).toEqual(['electric:1:enemy', 'electric:2:enemy']);
  });

  it('publishes every successful elemental Buff application with native tags', () => {
    const target = new CombatBuffContainer<Attribute>('enemy', new CombatAttributeSet<Attribute>());
    const onBuffApplied = vi.fn();
    const taggedIndex: ElementalInflictionBuffIndex<Attribute> = {
      ...index,
      getAttachment: element => ({
        ...attachment(element),
        applyTags: ['Skill/Character/Common/SpellStatus/Frozen' as never],
      }),
    };
    const adapter = new ElementalInflictionBuffAdapter(
      target,
      'operator',
      taggedIndex,
      undefined,
      onBuffApplied,
    );

    adapter.apply({ kind: 'addAttachment', element: 'cryo' });

    expect(onBuffApplied).toHaveBeenCalledWith(
      {
        targetId: 'enemy',
        buffId: 'attachment.cryo',
        sourceId: 'operator',
        buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
        skillCastInfo: null,
      },
      target.getInstance(1),
    );
  });
});
