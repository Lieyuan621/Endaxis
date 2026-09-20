import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formatConditionSchema } from '../../../../../tools/inspector-schema/contractSchema';
import { COMBAT_CONDITION_KINDS } from '../../../../../packages/game-data-contract/src/conditions';
import { conditionStructure } from './conditionStructure.generated';
import { conditionInspectorFields } from './conditionInspectorSchema';
import { validateComparisonInspector } from './combatInspectorFields';
import { initialInspectorValue, matchesInspectorValue } from './inspectorFields';

describe('契约驱动条件 Inspector', () => {
  it.each(['contextTargetObjectTypeMatch', 'actionInputTargetObjectTypeMatch'] as const)(
    '%s 从契约生成可读类型集合与全部对象选项',
    kind => {
      const field = conditionInspectorFields(kind)!.find(field => field.key === 'objectTypes')!;
      expect(field.editor).toBe('union');
      const variants = field.variants!;
      expect(
        variants.find(shape => matchesInspectorValue(shape, ['projectile', 'abilityEntity']))?.type,
      ).toBe('enumList');
      expect(variants.find(shape => matchesInspectorValue(shape, 'all'))?.type).toBe('enum');
      for (const value of [64, 512, '64', ['512']]) {
        expect(variants.some(shape => matchesInspectorValue(shape, value))).toBe(false);
      }
    },
  );
  it('原生混合联合保留值形式，显示不把字符串、数值和布尔值互转', () => {
    const field = conditionInspectorFields('contextFlagEquals')!.find(
      field => field.key === 'value',
    )!;
    expect(field.editor).toBe('union');
    for (const value of ['', '0', 0, false]) {
      const original = { kind: 'contextFlagEquals' as const, flag: 'test', value };
      expect(field.read(original)).toBe(value);
      expect(field.variants!.filter(shape => matchesInspectorValue(shape, value))).toHaveLength(1);
      expect(field.write(original, value)).toEqual(original);
      expect(field.write(original, [])).toBe(original);
    }
  });

  it('数值和操作数、单个枚举和枚举数组保留为不同联合分支', () => {
    const buff = conditionInspectorFields('buffIdStackCompare')!.find(
      field => field.key === 'value',
    )!;
    expect(buff.variants?.map(shape => shape.type)).toEqual(['number', 'actionValue']);
    const original = {
      kind: 'buffIdStackCompare' as const,
      target: 'enemy' as const,
      buffIds: ['test'],
      operator: 'greater' as const,
      value: 1,
    };
    const operand = { kind: 'blackboard' as const, key: 'count', fallback: 0 };
    expect(buff.write(original, operand).value).toEqual(operand);
    expect(original.value).toBe(1);
    const elements = conditionInspectorFields('elementalInflictionPresent')!.find(
      field => field.key === 'elements',
    )!;
    const shapes = elements.variants!;
    expect(shapes.find(shape => matchesInspectorValue(shape, 'heat'))?.type).toBe('enum');
    expect(shapes.find(shape => matchesInspectorValue(shape, ['heat']))?.type).toBe('enumList');
    expect(initialInspectorValue(shapes.find(shape => shape.type === 'enumList')!)).toEqual([]);
  });

  it('动态标记身份使用公共字符串引用，不伪造字面回退值', () => {
    const field = conditionInspectorFields('timedMarkerPresent')!.find(
      field => field.key === 'markerId',
    )!;
    expect(field.editor).toBe('stringReference');
    const original = {
      kind: 'timedMarkerPresent' as const,
      target: 'enemy' as const,
      markerId: 'test',
    };
    expect(field.write(original, { blackboardKey: 'marker' })).toEqual({
      ...original,
      markerId: { blackboardKey: 'marker' },
    });
    expect(original.markerId).toBe('test');
  });
  it('数组元素枚举来自契约，写入保留顺序和重复项且不修改原对象', () => {
    const original = {
      kind: 'currentSkillTypeIn' as const,
      target: 'caster' as const,
      skillTypes: ['battleSkill' as const],
    };
    const field = conditionInspectorFields(original.kind)!.find(
      field => field.key === 'skillTypes',
    )!;
    expect(field.editor).toBe('enumList');
    expect(field.options).toContain('battleSkill');
    const next = field.write(original, ['battleSkill', 'battleSkill']);
    expect(next.skillTypes).toEqual(['battleSkill', 'battleSkill']);
    expect(original.skillTypes).toEqual(['battleSkill']);
    expect(field.write(original, ['invalid'])).toBe(original);
    expect(field.write(original, 'battleSkill')).toBe(original);
    expect(validateComparisonInspector(field.write(original, [])).length).toBeGreaterThan(0);
  });

  it('可选文本列表区分未定义和空列表，不把标签转为数字或拆分字符', () => {
    const original = { kind: 'ownerSpawnedAbilityEntityPresent' as const };
    const field = conditionInspectorFields(original.kind)!.find(
      field => field.key === 'abilityEntityIds',
    )!;
    expect(field.toggle(original, true).abilityEntityIds).toEqual([]);
    const next = field.write(original, ['entity/a', 'entity/b']);
    expect(next.abilityEntityIds).toEqual(['entity/a', 'entity/b']);
    expect(field.toggle(next, false)).toEqual(original);
    expect(field.write(original, [12])).toBe(original);
    expect(
      conditionInspectorFields('entityTagMatch')!.find(field => field.key === 'tags')!.editor,
    ).toBe('textList');
  });
  it('生成物和权威 TS 契约完全一致，契约更新不能遗忘生成', () => {
    expect(
      readFileSync(
        resolve('src/ui/timeline/definitions/inspector/conditionStructure.generated.ts'),
        'utf8',
      ).replace(/\r\n/g, '\n'),
    ).toBe(formatConditionSchema(process.cwd()));
    expect(Object.keys(conditionStructure).sort()).toEqual([...COMBAT_CONDITION_KINDS].sort());
  });

  it('自动编辑器覆盖全部字段，不支持的结构整体交给专用编辑器', () => {
    for (const kind of COMBAT_CONDITION_KINDS) {
      const structure = conditionStructure[kind];
      const fields = conditionInspectorFields(kind);
      if (Object.values(structure).some(field => field.type === 'unsupported'))
        expect(fields).toBeUndefined();
      else
        expect(fields?.map(field => field.key)).toEqual(
          Object.entries(structure)
            .filter(
              ([, field]) => field.type !== 'conditionNode' && field.type !== 'conditionNodes',
            )
            .map(([key]) => key),
        );
    }
    expect(conditionInspectorFields('all')).toEqual([]);
    expect(conditionInspectorFields('any')).toEqual([]);
    expect(conditionInspectorFields('not')).toEqual([]);
    expect(conditionInspectorFields('healthCompare')?.map(field => field.key)).toContain(
      'contextKey',
    );
    expect(conditionInspectorFields('combatActive')).toEqual([]);
  });

  it('联合类型精确枚举来自契约，不再人工截断目标范围', () => {
    const target = conditionInspectorFields('healthCompare')!.find(
      field => field.key === 'target',
    )!;
    expect(target.options).toContain('contextTarget');
    const original = {
      kind: 'healthCompare' as const,
      target: 'enemy' as const,
      valueType: 'ratio' as const,
      operator: 'less' as const,
      value: { kind: 'constant' as const, value: 0.5 },
    };
    expect(target.write(original, 'contextTarget')).toEqual({
      ...original,
      target: 'contextTarget',
    });
    expect(target.write(original, 'invalid')).toBe(original);
  });
});
