import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { describe, expect, it, vi } from 'vitest';

import type {
  ElementalInflictionOperation,
  ExistingElementalAttachment,
} from './elementalInfliction';
import type { CombatReceiptEntry, CombatReceiptSink } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { ElementalInflictionOperationExecutor } from './elementalInflictionOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';

const STEP: ResolvedCombatStepForKind<'applyElementalInfliction'> = {
  kind: 'applyElementalInfliction',
  parameters: { element: 'electric', isExtra: false },
};

describe('ElementalInflictionOperationExecutor', () => {
  it.each([true, false])(
    'records exact conversion identities only when the output was added: %s',
    succeeds => {
      const record = vi.fn();
      const executor = new ElementalInflictionOperationExecutor({
        sourceOperatorId: 'operator',
        targetId: 'enemy',
        skillId: 'skill',
        clock: new CombatClock(),
        receipt: { record },
        getExistingAttachment: () => ({ element: 'heat', layers: 2 }),
        applyOperation: operation =>
          operation.kind === 'consumeAttachment'
            ? { buffId: 'old', instanceId: 7 }
            : succeeds
              ? { buffId: 'new', instanceId: 9 }
              : undefined,
        emitSourceEvent: vi.fn(),
        emitTargetEvent: vi.fn(),
        delegate: { execute: () => true, evaluate: () => false },
      });
      executor.execute(STEP);
      const conversions = record.mock.calls
        .map(([entry]) => entry)
        .filter(entry => entry.event === 'ElementalAttachmentConverted');
      expect(conversions).toHaveLength(succeeds ? 1 : 0);
      if (succeeds)
        expect(conversions[0]).toMatchObject({
          targetId: 'enemy',
          data: {
            consumedBuffId: 'old',
            consumedInstanceId: 7,
            outputBuffId: 'new',
            outputInstanceId: 9,
          },
        });
    },
  );
  it('把 Buff 触发的法术爆发保留来源与施放身份交给统一爆发运行时', () => {
    const triggerSpellBurst = vi.fn();
    const skillCastInfo = {
      skillCastId: 9,
      originSkillId: 'ultimate',
      originSkillType: 'ultimate' as const,
      nonReturnedSpCost: 0,
    };
    const executor = new ElementalInflictionOperationExecutor({
      sourceOperatorId: 'operator',
      targetId: 'enemy',
      skillId: 'skill',
      clock: new CombatClock(),
      receipt: { record: vi.fn() },
      getExistingAttachment: () => null,
      applyOperation: vi.fn(),
      emitSourceEvent: vi.fn(),
      emitTargetEvent: vi.fn(),
      triggerSpellBurst,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    expect(
      executor.execute(
        { kind: 'triggerSpellBurst', parameters: { burstType: 'Cryst' } },
        {
          blackboard: new ActionBlackboard(),
          buffSourceId: 'operator:buff-source',
          skillCastInfo,
        },
      ),
    ).toBe(true);
    expect(triggerSpellBurst).toHaveBeenCalledWith({
      burstType: 'Cryst',
      sourceId: 'operator:buff-source',
      skillCastInfo,
    });
  });

  it.each([undefined, 'operator', 'ability:1', 'enemy'])(
    'Buff 宿主 %s 必须匹配绑定敌人且在事件前校验',
    ownerId => {
      const applyOperation = vi.fn();
      const emitSourceEvent = vi.fn();
      const emitTargetEvent = vi.fn();
      const record = vi.fn();
      const executor = new ElementalInflictionOperationExecutor({
        sourceOperatorId: 'operator',
        targetId: 'enemy',
        skillId: 'skill',
        clock: new CombatClock(),
        receipt: { record },
        getExistingAttachment: () => null,
        applyOperation,
        emitSourceEvent,
        emitTargetEvent,
        delegate: { execute: () => true, evaluate: () => false },
      });
      const execute = () =>
        executor.execute(
          { ...STEP, parameters: { ...STEP.parameters, target: 'buffOwner' } },
          {
            blackboard: new ActionBlackboard(),
            ...(ownerId === undefined ? {} : { buffOwnerId: ownerId }),
          },
        );
      if (ownerId === 'enemy') {
        expect(execute()).toBe(true);
        expect(applyOperation).toHaveBeenCalledOnce();
        expect(record).toHaveBeenCalledWith(
          expect.objectContaining({ targetId: 'enemy', sourceId: 'operator' }),
        );
      } else {
        expect(execute).toThrow(
          ownerId === undefined ? 'requires a Buff lifecycle owner' : 'not the bound enemy',
        );
        expect(applyOperation).not.toHaveBeenCalled();
        expect(emitSourceEvent).not.toHaveBeenCalled();
        expect(emitTargetEvent).not.toHaveBeenCalled();
        expect(record).not.toHaveBeenCalled();
      }
    },
  );

  it('queries attachment after before-events and applies operations before after-events', () => {
    const order: string[] = [];
    let attachment: ExistingElementalAttachment | null = null;
    const applied: ElementalInflictionOperation[] = [];
    const skillCastInfo = {
      skillCastId: 8,
      originSkillId: 'combo',
      originSkillType: 'comboSkill' as const,
      nonReturnedSpCost: 0,
    };
    let recorded: Omit<CombatReceiptEntry, 'sequence'> | undefined;
    const receipt: CombatReceiptSink = {
      record: entry => {
        recorded = entry;
        order.push(`receipt:${entry.event}`);
      },
    };
    const executor = new ElementalInflictionOperationExecutor({
      sourceOperatorId: 'operator',
      targetId: 'enemy',
      skillId: 'skill',
      clock: new CombatClock(),
      receipt,
      getExistingAttachment: () => {
        order.push('query');
        return attachment;
      },
      applyOperation: (operation, source, producedBy) => {
        expect(source).toEqual(skillCastInfo);
        expect(producedBy).toEqual({ kind: 'action', ownerId: 'operator', actionId: 'skill' });
        order.push(`apply:${operation.kind}`);
        applied.push(operation);
        if (operation.kind === 'consumeAttachment') attachment = null;
      },
      emitSourceEvent: event => order.push(`source:${event}`),
      emitTargetEvent: event => {
        order.push(`target:${event}`);
        if (event === 'beforeTakeInfliction') attachment = { element: 'heat', layers: 2 };
      },
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    expect(executor.execute(STEP, { blackboard: new ActionBlackboard(), skillCastInfo })).toBe(
      true,
    );
    expect(applied.map(operation => operation.kind)).toEqual([
      'consumeAttachment',
      'createCompoundStatus',
    ]);
    expect(order).toEqual([
      'source:beforeOutputInfliction',
      'target:beforeTakeInfliction',
      'query',
      'apply:consumeAttachment',
      'apply:createCompoundStatus',
      'source:afterOutputInfliction',
      'target:afterTakeInfliction',
      'query',
      'receipt:ElementalInflictionApplied',
    ]);
    expect(recorded).toMatchObject({
      event: 'ElementalInflictionApplied',
      sourceId: 'operator',
      targetId: 'enemy',
      data: {
        skillId: 'skill',
        requestedElement: 'electric',
        isExtra: false,
        previousElement: 'heat',
        previousLayers: 2,
        currentElement: null,
        currentLayers: 0,
        outcomeKind: 'compoundStatus',
        consumedElement: 'heat',
        consumedLayers: 2,
        operationKinds: 'consumeAttachment,createCompoundStatus',
      },
    });
  });
});
