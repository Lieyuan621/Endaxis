import { parseSkillBuffInstallSources } from '../../src/source/skillBuffInstall.ts';
import { resolvePassiveSkillDefinitionBlackboard } from '../../src/compiler/skills/passiveSkillInstallation.ts';
import { describe, expect, it } from 'vitest';

import {
  materializePassiveSkillInstallation,
  materializePassiveBuffInstallation,
  type CompiledPassiveSkillDefinitionSource,
  type PassiveSkillCompileRequestSource,
} from '../../src/index.ts';

describe('被动技能安装实例化', () => {
  it('套装选择表内等级，再由请求黑板覆盖补丁值', () => {
    const request = fixtureRequest({ kind: 'equipmentSuitThreshold', level: 2, requiredCount: 3 });
    expect(materializePassiveSkillInstallation(request, fixtureDefinition())).toMatchObject({
      level: 2,
      patchApplied: true,
      blackboard: { damage_up: 0.8, patch_only: 4 },
    });
  });

  it('原生默认等级不套补丁，武器则必须显式传入已解析等级', () => {
    const native = fixtureRequest({ kind: 'nativeDefault' });
    expect(materializePassiveSkillInstallation(native, fixtureDefinition())).toMatchObject({
      level: 1,
      patchApplied: false,
      blackboard: { damage_up: 0.8 },
    });

    const weapon = fixtureRequest({
      kind: 'weaponProgression',
      slotIndex: 0,
      breakthroughTemplateId: 'breakthrough_fixture',
      talentTemplateId: 'talent_fixture',
    });
    expect(() => materializePassiveSkillInstallation(weapon, fixtureDefinition())).toThrow(
      'Fixture.passive_fixture: resolved weapon skill level is required',
    );
    expect(materializePassiveSkillInstallation(weapon, fixtureDefinition(), 2)).toMatchObject({
      level: 2,
      patchApplied: true,
    });
  });

  it('定义编译保留武器原列和非连续等级身份，输入覆盖仍在补丁之后', () => {
    const request = fixtureRequest({
      kind: 'weaponProgression',
      slotIndex: 0,
      breakthroughTemplateId: 'breakthrough_fixture',
      talentTemplateId: 'talent_fixture',
    });
    const compiled = fixtureDefinition();
    const blackboard = resolvePassiveSkillDefinitionBlackboard(request, compiled);
    expect(blackboard).toEqual({ damage_up: 0.8, patch_only: [4] });
    expect(blackboard.patch_only).toBe(compiled.definition.blackboard.values.patch_only);
    expect(compiled.definition.blackboard.levels).toEqual([2]);
    expect(compiled.definition.blackboard.values.damage_up).toEqual([0.3]);
  });

  it('角色基础被动保留所属项目技能组的补丁列，等待构筑等级解析', () => {
    const request = fixtureRequest({
      kind: 'operatorSkillGroup',
      levelSource: 'battleSkill',
    });
    const compiled = fixtureDefinition();
    const blackboard = resolvePassiveSkillDefinitionBlackboard(request, compiled);

    expect(blackboard).toEqual({ damage_up: 0.8, patch_only: [4] });
    expect(blackboard.patch_only).toBe(compiled.definition.blackboard.values.patch_only);
    expect(() => materializePassiveSkillInstallation(request, compiled)).toThrow(
      'operator skill-group passive must preserve its level column',
    );
  });

  it.each([
    { kind: 'nativeDefault' } as const,
    { kind: 'equipmentSuitThreshold', level: 3, requiredCount: 3 } as const,
    { kind: 'equipmentSuitThreshold', level: 2, requiredCount: 3 } as const,
  ])('固定等级定义复用安装器的默认回退和输入覆盖：%j', levelSource => {
    const request = fixtureRequest(levelSource);
    const compiled = fixtureDefinition();
    expect(resolvePassiveSkillDefinitionBlackboard(request, compiled)).toEqual(
      materializePassiveSkillInstallation(request, compiled).blackboard,
    );
  });

  it('定义编译同样拒绝不匹配的 SkillData 身份', () => {
    expect(() =>
      resolvePassiveSkillDefinitionBlackboard(
        { ...fixtureRequest({ kind: 'nativeDefault' }), skillId: 'other' },
        fixtureDefinition(),
      ),
    ).toThrow('does not match compiled definition');
  });

  it('同一 Buff 绑定器支持整列、零值、字符串和未解析输入，且不修改来源', () => {
    const [source] = parseSkillBuffInstallSources(
      [
        {
          buffId: 'buff_fixture',
          assignBlackboard: true,
          assignItems: [
            {
              targetKey: 'duration',
              inputValueKey: 'duration',
              useDirectValue: false,
              directValueType: 'Numeric',
              numericValue: 0,
              stringValue: '',
            },
            {
              targetKey: 'zero',
              inputValueKey: '',
              useDirectValue: true,
              directValueType: 'Numeric',
              numericValue: 0,
              stringValue: '',
            },
            {
              targetKey: 'label',
              inputValueKey: '',
              useDirectValue: true,
              directValueType: 'String',
              numericValue: 0,
              stringValue: 'label',
            },
            {
              targetKey: 'server',
              inputValueKey: 'server_value',
              useDirectValue: false,
              directValueType: 'Numeric',
              numericValue: 0,
              stringValue: '',
            },
          ],
        },
      ],
      'fixture.buffs',
    );
    const duration = Object.freeze([10, 20]);
    const bound = materializePassiveBuffInstallation(source!, { duration });
    expect(bound.blackboardAssignments.duration).toBe(duration);
    expect(bound.blackboardAssignments).toEqual({
      duration: [10, 20],
      zero: 0,
      label: 'label',
      server: { kind: 'unresolvedSkillBlackboard', key: 'server_value' },
    });
    expect(
      materializePassiveBuffInstallation(source!, { duration: 10 }).blackboardAssignments.duration,
    ).toBe(10);
    expect(
      materializePassiveBuffInstallation({ ...source!, assignBlackboard: false }, { duration }),
    ).toEqual({
      buffId: 'buff_fixture',
      blackboardAssignments: {},
    });
    expect(source!.assignments[0]?.inputValueKey).toBe('duration');
  });

  it('条件养成被动在实例化后继续保留原生条件 ID', () => {
    const request = {
      ...fixtureRequest({ kind: 'nativeDefault' }),
      activeConditionIds: ['condition_left', 'condition_right'],
    };
    expect(materializePassiveSkillInstallation(request, fixtureDefinition())).toMatchObject({
      activeConditionIds: ['condition_left', 'condition_right'],
    });
  });
});

function fixtureRequest(
  levelSource: PassiveSkillCompileRequestSource['levelSource'],
): PassiveSkillCompileRequestSource {
  return {
    originKind:
      levelSource.kind === 'weaponProgression'
        ? 'weapon'
        : levelSource.kind === 'equipmentSuitThreshold'
          ? 'equipmentSuit'
          : 'operatorProgression',
    originId: 'origin_fixture',
    sourcePath: 'Fixture.passive_fixture',
    skillId: 'passive_fixture',
    levelSource,
    inputBlackboard: { damage_up: 0.8 },
  };
}

function fixtureDefinition(): CompiledPassiveSkillDefinitionSource {
  return {
    skillId: 'passive_fixture',
    sourcePath: 'SkillData.passive_fixture',
    definition: {
      blackboard: {
        definitionLevel: 1,
        declaredDefaults: { damage_up: 0.1 },
        levels: [2],
        values: { damage_up: [0.3], patch_only: [4] },
      },
      hasCardAttributeModifiers: false,
      skill: {} as CompiledPassiveSkillDefinitionSource['definition']['skill'],
    },
  };
}
