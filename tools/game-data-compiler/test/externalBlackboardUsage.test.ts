import { describe, expect, it } from 'vitest';
import { inspectExternalBlackboardUsage } from '../src/compiler/references/externalBlackboardUsage.ts';
import type { DefinitionReferenceSource } from '../src/source/referenceGraph.ts';
import { parseProjectileBlackboardReceiverSource } from '../src/source/projectileRuntime.ts';

const ref = (
  id: string,
  state: DefinitionReferenceSource['state'] = 'active',
): DefinitionReferenceSource => ({
  kind: 'skill',
  id,
  state,
  usage: 'cast',
  blackboardKey: null,
  sourcePath: id,
});

describe('黑板接收资源的读取检查', () => {
  it('Buff 继承名单不执行技能，同一技能若同时有真实回调仍须检查', () => {
    const inheritance = { ...ref('next'), usage: 'buffInheritance' };
    const loaded: string[] = [];
    const load = (reference: DefinitionReferenceSource) => {
      loaded.push(reference.id!);
      return { value: { key: 'angle' }, references: [] };
    };
    expect(inspectExternalBlackboardUsage([inheritance], load).mentionedKeys.size).toBe(0);
    expect(loaded).toEqual([]);
    expect(
      inspectExternalBlackboardUsage([inheritance, ref('next')], load).mentionedKeys.has('angle'),
    ).toBe(true);
    expect(loaded).toEqual(['next']);
  });
  it('动态候选带来的新资源会触发重新证明，失效的结论不留作成功', () => {
    const dynamic = ref('dynamic', 'dynamic');
    let discovered = false;
    const loaded: string[] = [];
    const result = inspectExternalBlackboardUsage(
      [ref('root')],
      reference => {
        loaded.push(reference.id!);
        if (reference.id === 'root') return { value: {}, references: [dynamic] };
        discovered = true;
        return { value: { blackboardKey: 'angle' }, references: [ref('root')] };
      },
      () => (discovered ? undefined : [ref('child')]),
    );
    expect(loaded).toEqual(['root', 'child']);
    expect(result.unresolved).toEqual([dynamic]);
    expect(result.mentionedKeys.has('angle')).toBe(true);
  });
  it('部分模板继续检查已知技能，循环仍只读取一次，且保留模板未闭合状态', () => {
    const loaded: string[] = [];
    const template = { ...ref('template'), kind: 'abilityEntity' as const };
    const usage = inspectExternalBlackboardUsage([template], reference => {
      loaded.push(reference.id!);
      if (reference.id === 'missing') return undefined;
      return reference.kind === 'abilityEntity'
        ? { value: { durationKey: 'duration' }, complete: false, references: [ref('child')] }
        : { value: { blackboardKey: 'angle' }, references: [template, ref('missing')] };
    });
    expect(loaded).toEqual(['template', 'child', 'missing']);
    expect(usage.mentionedKeys.has('angle')).toBe(true);
    expect(usage.mentionedKeys.has('duration')).toBe(true);
    expect(usage.unresolved).toEqual([template, ref('missing')]);
  });
  it('模板内登记的技能和 Buff 也参与检查，不能只看发射动作的显式回调', () => {
    const bundle: Record<string, unknown> = { comboSkillConditions: [] };
    for (const field of [
      'allNormalAttackId',
      'allActiveSkillId',
      'allPassiveSkillId',
      'normalAttackList',
      'enabledBreakingNormalAttacks',
      'enabledPassiveSkills',
    ])
      bundle[field] = [];
    for (const field of [
      'normalSkillId',
      'ultimateSkillId',
      'plungingAttackStartId',
      'plungingAttackEndId',
      'dodgeSkillId',
      'comboSkillId',
    ])
      bundle[field] = '';
    bundle.allPassiveSkillId = ['passive'];
    const value = {
      abilitySystemBoundary: { decodeStatus: 'complete', remainingLength: 0 },
      abilitySystem: {
        modeConfig: { modes: [] },
        skillDataBundle: bundle,
        dashBuff: [],
        buffDuringPoiseExist: [],
        buffDuringZeroPoise: [],
        maxPotentialEffectBuffId: 'buff',
      },
    };
    const receiver = parseProjectileBlackboardReceiverSource(value, 'projectile');
    expect(receiver?.references.map(reference => [reference.kind, reference.id])).toEqual([
      ['skill', 'passive'],
      ['buff', 'buff'],
    ]);
    value.abilitySystemBoundary.decodeStatus = 'partial';
    expect(parseProjectileBlackboardReceiverSource(value, 'projectile')).toBeUndefined();
    value.abilitySystemBoundary.decodeStatus = 'complete';
    bundle.comboSkillConditions = [{ actionData: ['unresolved-rid'] }];
    expect(parseProjectileBlackboardReceiverSource(value, 'projectile')).toBeUndefined();
  });
  it('递归检查后续接收者，循环只加载一次，但仍保留循环中的读取', () => {
    const loaded: string[] = [];
    const usage = inspectExternalBlackboardUsage([ref('a')], reference => {
      loaded.push(reference.id!);
      return reference.id === 'a'
        ? { value: { declaration: 'local' }, references: [ref('b')] }
        : { value: { operand: { blackboardKey: 'angle' } }, references: [ref('a')] };
    });
    expect(loaded).toEqual(['a', 'b']);
    expect(usage.mentionedKeys.has('angle')).toBe(true);
    expect(usage.unresolved).toEqual([]);
  });

  it('不把同名技能和 Buff 当作同一个资源', () => {
    const usage = inspectExternalBlackboardUsage(
      [ref('same'), { ...ref('same'), kind: 'buff' }],
      reference => ({ value: reference.kind === 'buff' ? { angle: 0 } : {}, references: [] }),
    );
    expect(usage.mentionedKeys.has('angle')).toBe(true);
  });

  it('缺失、动态和未完整解析的接收者阻止证明；关闭引用不加载', () => {
    const loaded: string[] = [];
    const usage = inspectExternalBlackboardUsage(
      [ref('missing'), ref('dynamic', 'dynamic'), ref('disabled', 'inactive'), ref('', 'empty')],
      reference => {
        loaded.push(reference.id!);
        return undefined;
      },
    );
    expect(loaded).toEqual(['missing']);
    expect(usage.unresolved.map(reference => reference.id)).toEqual(['missing', 'dynamic']);
  });
});
