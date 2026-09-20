import { describe, expect, it } from 'vitest';
import arcaneGeneratedOperatorDefinition from '../../../../data/operators/arcane.generated';
import akekuriGeneratedOperatorDefinition from '../../../../data/operators/akekuri.generated';
import perlicaGeneratedOperatorDefinition from '../../../../data/operators/perlica.generated';
import snowshineGeneratedOperatorDefinition from '../../../../data/operators/snowshine.generated';
import emberGeneratedOperatorDefinition from '../../../../data/operators/ember.generated';
import {
  setBuffDefinitionPresentationField,
  setBuffDefinitionPriority,
  setBuffDefinitionScalar,
  setBuffDefinitionBlackboard,
  setBuffDefinitionAttributeModifiers,
  setBuffDefinitionDamageModifiers,
  setBuffDefinitionPresentation,
  setBuffDefinitionChildPresentations,
  setBuffDefinitionSkillSlotReplacements,
  setBuffDefinitionHealModifiers,
  setBuffDefinitionShields,
  setBuffDefinitionKeywordEnhancements,
  setBuffDefinitionAdvancedProperties,
  setBuffDefinitionPoiseModifiers,
} from './buffDefinitionEditorCommands';

const BUFF_ID = 'buff_chr_0032_lizhiyan_combo_skill_seal';

describe('Buff definition editor commands', () => {
  it('真实复杂 Buff 修改动态时长时不改写其余证据', () => {
    const original = arcaneGeneratedOperatorDefinition.buffDefinitions![BUFF_ID]!;
    const changed = setBuffDefinitionScalar(original, 'durationSeconds', {
      blackboardKey: 'custom_duration',
    });

    expect(changed.durationSeconds).toEqual({ blackboardKey: 'custom_duration' });
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.blackboard).toBe(original.blackboard);
    expect(changed.triggerIntervalSeconds).toBe(original.triggerIntervalSeconds);
    expect(changed).toEqual({ ...original, durationSeconds: { blackboardKey: 'custom_duration' } });
  });

  it('常量优先级转动态优先级不会带入不存在的取反语义', () => {
    const original = arcaneGeneratedOperatorDefinition.buffDefinitions![BUFF_ID]!;
    expect(setBuffDefinitionPriority(original, { blackboardKey: 'rate' }).priority).toEqual({
      blackboardKey: 'rate',
    });
  });

  it('显示身份按字段修改并保留其他原生显示规则', () => {
    const original = {
      stackingType: 'refresh' as const,
      presentation: { iconId: 'icon_native', visible: false, showInSquadIcon: true },
    };
    const changed = setBuffDefinitionPresentationField(original, 'iconPath', '/icons/test.webp');

    expect(changed.presentation).toEqual({
      iconId: 'icon_native',
      visible: false,
      showInSquadIcon: true,
      iconPath: '/icons/test.webp',
    });
  });

  it('完整父展示与子 Buff 展示保持两个独立端口', () => {
    const original = arcaneGeneratedOperatorDefinition.buffDefinitions![BUFF_ID]!;
    const presentation = {
      iconId: 'icon_test',
      visible: true,
      showInSquadIcon: false,
      orderPriority: { useDirectoryValue: true, value: 7, category: 'Native' },
    } as const;
    const children = [
      { buffId: 'child-a', presentation: { iconId: 'icon_a', showInHeadBarAttached: true } },
    ] as const;
    const withPresentation = setBuffDefinitionPresentation(original, presentation);
    const changed = setBuffDefinitionChildPresentations(withPresentation, children);

    expect(changed.presentation).toBe(presentation);
    expect(changed.childPresentations).toBe(children);
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.blackboard).toBe(original.blackboard);
  });

  it('实例黑板保留字符串、数字和 null，不重建行为结构', () => {
    const original = arcaneGeneratedOperatorDefinition.buffDefinitions![BUFF_ID]!;
    const blackboard = { number: 3, text: 'native', empty: null } as const;
    const changed = setBuffDefinitionBlackboard(original, blackboard);

    expect(changed.blackboard).toEqual(blackboard);
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.durationSeconds).toBe(original.durationSeconds);
  });

  it('真实秋栗 Buff 修改八槽属性修正时保留完整显示身份和实例黑板', () => {
    const original =
      akekuriGeneratedOperatorDefinition.buffDefinitions!.buff_chr_0019_karin_potential_1_1!;
    const modifiers = [
      ...original.attributeModifiers!,
      { attribute: 'Def', slot: 'addition' as const, value: -12 },
    ];
    const changed = setBuffDefinitionAttributeModifiers(original, modifiers);

    expect(changed.attributeModifiers).toEqual(modifiers);
    expect(changed.presentation).toBe(original.presentation);
    expect(changed.blackboard).toBe(original.blackboard);
    expect(changed.durationSeconds).toBe(original.durationSeconds);
  });

  it('真实佩丽卡 Buff 修改处理器时保留专用条件树', () => {
    const original =
      perlicaGeneratedOperatorDefinition.buffDefinitions!.buff_chr_0004_pelica_talent_0!;
    const modifier = original.damageModifiers![0]!;
    const changedModifier = {
      ...modifier,
      processors: [
        ...modifier.processors,
        {
          kind: 'damageScale' as const,
          side: 'attacker' as const,
          zone: 'combo' as const,
          addition: 0.2,
        },
      ],
    };
    const changed = setBuffDefinitionDamageModifiers(original, [changedModifier]);

    expect(changed.damageModifiers![0]!.condition).toBe(modifier.condition);
    expect(changed.damageModifiers![0]!.processors).toHaveLength(2);
    expect(changed.blackboard).toBe(original.blackboard);
  });

  it('真实弧光终结技 Buff 修改槽替换时保留生命周期', () => {
    const original =
      arcaneGeneratedOperatorDefinition.buffDefinitions!
        .buff_chr_0032_lizhiyan_ultimate_skill_listener!;
    const replacements = original.skillSlotReplacements!.map(item => ({
      ...item,
      targetSkillKey: 'custom-arcana',
    }));
    const changed = setBuffDefinitionSkillSlotReplacements(original, replacements);

    expect(changed.skillSlotReplacements).toEqual(replacements);
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.blackboard).toBe(original.blackboard);
  });

  it('真实雪绒治疗修正保留条件和实例黑板', () => {
    const original =
      snowshineGeneratedOperatorDefinition.buffDefinitions!.buff_chr_0014_aurora_talent_0!;
    const modifier = original.healModifiers![0]!;
    const modifiers = [{ ...modifier, enabledSide: 'receiver' as const }];
    const changed = setBuffDefinitionHealModifiers(original, modifiers);

    expect(changed.healModifiers).toEqual(modifiers);
    expect(changed.healModifiers![0]!.condition).toBe(modifier.condition);
    expect(changed.blackboard).toBe(original.blackboard);
  });

  it('真实余烬护盾修改吸收规则时保留生命周期与展示身份', () => {
    const original =
      emberGeneratedOperatorDefinition.buffDefinitions!.buff_chr_0009_azrila_ultimateshield!;
    const shield = original.shields![0]!;
    const shields = [{ ...shield, priority: 'prioritizeConsume' as const }];
    const changed = setBuffDefinitionShields(original, shields);

    expect(changed.shields).toEqual(shields);
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.presentation).toBe(original.presentation);
    expect(changed.blackboard).toBe(original.blackboard);
  });

  it('关键词强化保持触发身份、操作和两个动态值', () => {
    const original = arcaneGeneratedOperatorDefinition.buffDefinitions![BUFF_ID]!;
    const enhancements = [
      {
        triggerBuffIds: ['buff-a', 'buff-b'],
        operation: 'multiply' as const,
        targetKey: 'rate',
        initialValue: { blackboardKey: 'initial' },
        value: { blackboardKey: 'factor' },
      },
    ] as const;
    const changed = setBuffDefinitionKeywordEnhancements(original, enhancements);

    expect(changed.keywordEnhancements).toBe(enhancements);
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.blackboard).toBe(original.blackboard);
  });

  it('高级原生语义逐字段替换，不重建其余 Buff 证据', () => {
    const original = arcaneGeneratedOperatorDefinition.buffDefinitions![BUFF_ID]!;
    const role = {
      kind: 'compoundStatus',
      consumedElement: 'heat',
      incomingElement: 'electric',
    } as const;
    const spellBurst = {
      burstType: 'Pulse',
      damageType: 'electric',
      skillSettingDataKey: 'spell_native',
      skillSettingColumn: 2,
      atkScaleBase: 1.25,
    } as const;
    const changed = setBuffDefinitionAdvancedProperties(original, {
      sustainedProtection: {
        target: 'owner',
        superArmor: { blackboardKey: 'armor' },
        impactResistance: 0,
      },
      role,
      spellBurst,
    });

    expect(changed.sustainedProtection).toEqual({
      target: 'owner',
      superArmor: { blackboardKey: 'armor' },
      impactResistance: 0,
    });
    expect(changed.role).toBe(role);
    expect(changed.spellBurst).toBe(spellBurst);
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.blackboard).toBe(original.blackboard);
  });

  it('韧性修正保留递归条件与动态加算值', () => {
    const original = arcaneGeneratedOperatorDefinition.buffDefinitions![BUFF_ID]!;
    const modifiers = [
      {
        enabledSide: 'defender',
        condition: {
          kind: 'all',
          conditions: [
            { kind: 'casterControlled' },
            { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttack'] },
          ],
        },
        processors: [
          {
            kind: 'modifyPoiseScalar',
            timing: 'beforeCalculation',
            side: 'attacker',
            addition: { blackboardKey: 'poise_scale' },
          },
        ],
      },
    ] as const;
    const changed = setBuffDefinitionPoiseModifiers(original, modifiers);

    expect(changed.poiseModifiers).toBe(modifiers);
    expect(changed.lifecycleSequences).toBe(original.lifecycleSequences);
    expect(changed.blackboard).toBe(original.blackboard);
  });
});
