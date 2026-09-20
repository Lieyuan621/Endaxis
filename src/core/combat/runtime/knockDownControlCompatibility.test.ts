import { describe, expect, it } from 'vitest';
import type { CombatOperatorProgram } from './combatRuntimeAssembly';
import { inspectKnockDownControlConsumers } from './knockDownControlCompatibility';

// 本检查不执行程序：用结构夹具覆盖每个静态入口，避免依赖运行时容器。
const root = { kind: 'applyKnockDown', parameters: { targetFilter: 'aliveOnly' } };
const reader = (target = 'enemy', tags = ['Status/Immobilized/Getup']) => ({
  kind: 'entityTagMatch',
  target,
  tags,
});
const entry = (fields: Record<string, unknown>) =>
  ({ operatorId: 'fixture', skills: [], ...fields }) as unknown as CombatOperatorProgram;

describe('普通倒地起身消费者门禁', () => {
  it.each([
    'skills',
    'buffDefinitions',
    'abilityEntityDefinitions',
    'initializationPrograms',
    'passivePrograms',
    'upgradeEventPrograms',
    'comboConditionPrograms',
    'equipmentContributions',
  ])('检查队友 %s 中的嵌套读者', field => {
    const issues = inspectKnockDownControlConsumers([
      entry({ skills: [root] }),
      entry({ [field]: [{ nested: reader() }] }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toContain(`operators[1]('fixture').${field}`);
  });
  it('检查面板修饰器，不读取实例的可变状态', () => {
    const value = entry({ skills: [root], panel: { combatModifiers: [reader()] } });
    Object.defineProperty(value, 'runtimeState', {
      get: () => {
        throw new Error('不应读取');
      },
    });
    expect(inspectKnockDownControlConsumers([value])).toHaveLength(1);
  });
  it.each(['Status', 'Status/Immobilized', 'Status/Immobilized/Getup'])(
    '保守阻断起身及其祖先标签 %s',
    tag => {
      expect(
        inspectKnockDownControlConsumers([entry({ skills: [root, reader('enemy', [tag])] })]),
      ).toHaveLength(1);
    },
  );
  it('未证明归属的 Buff owner 不能被当成干员；明确 caster 与其他标签不阻断', () => {
    expect(
      inspectKnockDownControlConsumers([entry({ skills: [root, reader('buffOwner')] })]),
    ).toHaveLength(1);
    expect(
      inspectKnockDownControlConsumers([
        entry({
          skills: [root, reader('caster'), reader('enemy', ['Status/Immobilized/KnockDown'])],
        }),
      ]),
    ).toEqual([]);
  });
  it('没有根控制或根仅筛选死亡目标时，不扩大其他技能的能力限制', () => {
    expect(inspectKnockDownControlConsumers([entry({ skills: [reader()] })])).toEqual([]);
    expect(
      inspectKnockDownControlConsumers([
        entry({
          skills: [
            reader(),
            {
              ...root,
              parameters: { targetFilter: 'skipAll' },
            },
          ],
        }),
      ]),
    ).toEqual([]);
  });
});
