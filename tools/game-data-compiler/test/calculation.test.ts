import { describe, expect, it } from 'vitest';

import { parseNativeCalculationSource } from '../src/index.ts';
import { scalarFixture } from './sourceFixtures.ts';

describe('公共数值计算结构', () => {
  it.each([
    {
      name: '攻击倍率',
      value: {
        $type: 'Example.AtkScaleCalculation, Example',
        atkScale: scalarFixture(0, 'atk_scale'),
      },
      expected: { kind: 'attackScale', attackScale: { blackboardKey: 'atk_scale' } },
    },
    {
      name: '破防攻击',
      value: {
        $type: 'Example.BreakingAttackCalculation, Example',
        atkScale: scalarFixture(1),
        multiplier: scalarFixture(0, 'break_multiplier'),
      },
      expected: {
        kind: 'breakingAttack',
        multiplier: { blackboardKey: 'break_multiplier' },
      },
    },
    {
      name: '属性乘加',
      value: {
        $type: 'Example.MultiplyAttributeCalculation, Example',
        valueSource: 'Target',
        attributeType: 'MaxHp',
        multiplier: scalarFixture(0.1),
        addition: scalarFixture(5),
      },
      expected: { kind: 'attribute', valueSource: 'Target', attributeType: 'MaxHp' },
    },
    {
      name: '定值及缩放',
      value: {
        $type: 'Example.DefiniteValueCalculation, Example',
        value: scalarFixture(100),
        applyScale: true,
        valueScale: scalarFixture(0, 'value_scale'),
      },
      expected: {
        kind: 'definite',
        applyScale: true,
        valueScale: { blackboardKey: 'value_scale' },
      },
    },
  ])('$name', ({ value, expected }) => {
    expect(
      parseNativeCalculationSource(value, 'fixture.calculation', {
        atk_scale: [1, 2],
        break_multiplier: [0.5],
        value_scale: [1.5],
      }),
    ).toMatchObject(expected);
  });
});
