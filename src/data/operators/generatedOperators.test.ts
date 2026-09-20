import { describe, expect, it } from 'vitest';
import { compileOperatorDefinitionSkills } from '../../core/compiler/compileScenarioTimeline';
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import type { OperatorInstanceDocument } from '../../core/project/schema';
import { getSkill } from './testUtils';
import { rossiChr_0028_wulfa_combo_3_skill } from './rossi.generated';
import {
  alesh,
  antal,
  akekuri,
  arcane,
  arclight,
  ardelia,
  avywenna,
  catcher,
  camille,
  chenQianyu,
  daPan,
  ember,
  endministrator,
  estella,
  fluorite,
  gilberta,
  lastRite,
  laevatain,
  lifeng,
  liino,
  mifu,
  pogranichnik,
  rossi,
  snowshine,
  tangtang,
  wulfgard,
  xaihi,
  yvonne,
  zhuangFangyi,
} from './index';

const gilbertaBattleSkill = getSkill(gilberta, 'chr_0013_aglina_normal_skill');
const fluoriteBattleSkill = getSkill(fluorite, 'chr_0022_bounda_normal_skill');
const lifengComboSkill = getSkill(lifeng, 'chr_0015_lifeng_combo_skill');
const lifengUltimate = getSkill(lifeng, 'chr_0015_lifeng_ultimate_skill');
const rossiBattleSkill = getSkill(rossi, 'chr_0028_wulfa_normal_skill');
const rossiComboSkill2 = getSkill(rossi, 'chr_0028_wulfa_combo_2_skill');
const rossiComboSkill3 = rossiChr_0028_wulfa_combo_3_skill;
const rossiUltimate = getSkill(rossi, 'chr_0028_wulfa_ultimate_skill');

const generatedOperators: readonly [OperatorDefinition, number][] = [
  [gilberta, 9],
  [lifeng, 9],
  [estella, 9],
  [daPan, 9],
  [ember, 9],
  [akekuri, 9],
  [fluorite, 10],
  [arclight, 10],
  [endministrator, 10],
  [lastRite, 9],
  [chenQianyu, 10],
  [rossi, 11],
  [camille, 11],
  [tangtang, 10],
  [laevatain, 15],
  [mifu, 11],
  [yvonne, 16],
  [zhuangFangyi, 15],
  [pogranichnik, 10],
  [snowshine, 8],
  [wulfgard, 9],
  [antal, 9],
  [alesh, 10],
  [xaihi, 10],
  [avywenna, 10],
  [catcher, 9],
  [ardelia, 9],
  [liino, 11],
];

function hasUpgradeBehavior(
  upgrade: OperatorDefinition['talents'][number] | OperatorDefinition['potentials'][number],
): boolean {
  return (
    (upgrade.modifiers?.length ?? 0) > 0 ||
    (upgrade.eventHandlers?.length ?? 0) > 0 ||
    (upgrade.passiveSkills?.length ?? 0) > 0 ||
    upgrade.initializationSequence !== undefined ||
    upgrade.simulationNoEffect !== undefined
  );
}

describe('新增的完整技能转换干员', () => {
  it('卡缪的普通连携与终结技后追猎保持不同输入身份', () => {
    const combo = camille.skillGroups.find(group => group.key === 'comboSkill');
    const battle = camille.skillGroups.find(group => group.key === 'battleSkill');
    expect(combo?.skills).toMatchObject({ key: 'chr_0033_camille_combo_skill' });
    expect(combo?.replacementSkillPlacements).toEqual({
      chr_0033_camille_combo_skill_2: 'internal',
    });
    expect(battle?.routedReplacementSkills).toEqual([
      expect.objectContaining({
        skill: expect.objectContaining({ key: 'chr_0033_camille_normal_skill_2' }),
        executionSkillKey: 'chr_0033_camille_combo_skill_2',
      }),
    ]);
    expect(camille.skillDisplayNameKeys?.chr_0033_camille_normal_skill_2).toBe(
      'skillNames.pursuit',
    );
  });

  it('梨诺终结技同时保留对敌声波与友方治疗分支', () => {
    expect(liino.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    const ultimate = liino.skillGroups.find(group => group.key === 'ultimate');
    const serialized = JSON.stringify(ultimate);
    expect(serialized).toContain('buff_chr_0035_liino_ultskill_music_damage');
    expect(serialized).toContain('buff_chr_0035_liino_ultskill_music_heal');
    expect(serialized).toContain('dealDamage');
    expect(serialized).toContain('heal');
    expect(liino.comboSkillConditions).toMatchObject([
      { event: 'addedBuff', skillKey: 'chr_0035_liino_combo_skill', immediately: false },
      { event: 'buffEndsEarly', skillKey: 'chr_0035_liino_combo_skill', immediately: false },
    ]);
    expect(JSON.stringify(liino.comboSkillConditions)).toContain(
      'Skill/Character/chr_0035_liino/NormalSkillMusic',
    );
  });

  it('Ardelia 保留战技易伤、潜能一黑板增幅与潜能五连携改写', () => {
    expect(ardelia.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    expect(ardelia.buffDefinitions?.buff_chr_0025_ardelia_normal_skill_vulnerable).toBeDefined();
    expect(ardelia.potentials[0]?.modifiers).toContainEqual(
      expect.objectContaining({
        kind: 'patchSkillBlackboard',
        skillGroupKey: 'battleSkill',
        blackboardKey: 'rate_vul_base',
        operation: 'add',
        value: 0.08,
      }),
    );
    expect(ardelia.potentials[4]?.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'addSkillCooldownFrames', frames: -60 }),
        expect.objectContaining({ blackboardKey: 'potential5_dmg_rate', value: 1.2 }),
      ]),
    );
  });

  it('Catcher 保留意志换防御、属性护盾与防御倍率追加伤害', () => {
    expect(catcher.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    expect(catcher.buffDefinitions?.buff_chr_0020_meurs_talent_0).toBeDefined();
    expect(
      catcher.buffDefinitions?.buff_chr_0020_meurs_combo_skill_shield?.shields?.[0]?.value,
    ).toEqual({
      attributeSource: 'buffSource',
      attribute: 'Def',
      multiplier: { blackboardKey: 'shield_def_rate' },
      addition: { blackboardKey: 'shield_base' },
    });
    expect(JSON.stringify(catcher.buffDefinitions?.buff_chr_0020_meurs_potential_1)).toContain(
      'calculationAttribute',
    );
  });

  it('Avywenna 长枪回收保留脉冲附着检查，天赋一同时保留技能补丁与常驻 Buff', () => {
    expect(avywenna.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    expect(avywenna.buffDefinitions?.buff_chr_0012_avywen_lance_pulse_check).toBeDefined();
    expect(JSON.stringify(avywenna)).toContain('buff_chr_0012_avywen_lance_pulse_check');
    expect(avywenna.talents[0]?.modifiers).toHaveLength(3);
    expect(avywenna.talents[0]?.initializationSequence?.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        buffId: 'buff_chr_0012_avywen_talent_0',
        target: 'caster',
        inheritSourceSkillCastInfo: false,
      },
    });
    expect(avywenna.talents[0]?.passiveSkills).toBeUndefined();
  });

  it('Avywenna 处决保留三段破防倍率，并在首段伤害后读取敌人处决技力', () => {
    const finisher = avywenna.skillGroups
      .flatMap(group => (Array.isArray(group.skills) ? group.skills : [group.skills]))
      .find(skill => skill.key === 'chr_0012_avywen_power_attack') as SkillDefinition | undefined;
    expect(finisher).toBeDefined();
    const damageSteps = finisher!.scheduledSequences.flatMap(item =>
      item.sequence.steps.filter(step => step.kind === 'dealDamage'),
    );
    expect(damageSteps.map(step => step.parameters.calculationMultiplier)).toEqual([0.3, 0.2, 0.5]);
    const firstSequence = finisher!.scheduledSequences.find(item => item.startFrame === 27);
    expect(firstSequence?.sequence.steps).toMatchObject([
      { kind: 'dealDamage', parameters: { calculation: 'breakingAttack' } },
      {
        kind: 'conditional',
        whenTrue: {
          steps: [{ kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } }],
        },
      },
    ]);
  });

  it('管理员只暴露一套以女管理员数据生成的规范技能入口', () => {
    expect(endministrator.skillGroups.map(group => group.key)).toEqual([
      'basicAttack',
      'finisher',
      'plungingAttack',
      'battleSkill',
      'ultimate',
      'comboSkill',
    ]);
    expect(
      endministrator.skillGroups.flatMap(group =>
        (Array.isArray(group.skills) ? group.skills : [group.skills]).map(skill => skill.key),
      ),
    ).toEqual([
      'chr_0003_endminf_attack1',
      'chr_0003_endminf_attack2',
      'chr_0003_endminf_attack3',
      'chr_0003_endminf_attack4',
      'chr_0003_endminf_attack5',
      'chr_0003_endminf_power_attack2',
      'chr_0003_endminf_plunging_attack_end',
      'chr_0003_endminf_normal_skill',
      'chr_0003_endminf_ultimate_skill',
      'chr_0003_endminf_combo_skill',
    ]);
  });

  it('三个新样本只把真实转换缺口计入 skillBehavior', () => {
    const skillBehaviorGaps = (operator: OperatorDefinition) =>
      operator.conversionSupport?.missingCapabilities.find(
        item => item.capability === 'skillBehavior',
      )?.skillGroupKeys ?? [];

    expect(skillBehaviorGaps(chenQianyu)).toEqual([]);
    expect(skillBehaviorGaps(rossi)).toEqual([]);
    expect(skillBehaviorGaps(camille)).toEqual([]);
  });

  it('Gilberta 战技把来源死亡监视 Buff 留在能力实体局部时间轴', () => {
    const serialized = JSON.stringify([
      gilbertaBattleSkill,
      gilberta.buffDefinitions?.buff_chr_0013_aglina_normal_skill_monitor,
      gilberta.abilityEntityDefinitions,
    ]);

    expect(serialized).toContain('buff_chr_0013_aglina_normal_skill_monitor');
    expect(serialized).toContain('currentAbilityEntity');
    expect(serialized).toContain('healthCompare');
    expect(serialized).toContain('finishCurrentAbilityEntity');
  });

  it('Fluorite 战技把已证明的根级跳转迁入能力实体局部时间轴', () => {
    const serialized = JSON.stringify([fluoriteBattleSkill, fluorite.abilityEntityDefinitions]);
    const frames = fluoriteBattleSkill.scheduledSequences.map(sequence => sequence.startFrame);

    expect(serialized).toContain('abilityentity_chr_0022_bounda_normal_skill');
    expect(serialized).toContain('jumpTimeline');
    expect(serialized).toContain('"destinationFrame":89');
    expect(serialized).toContain('"destinationFrame":149');
    expect(frames).not.toEqual(expect.arrayContaining([99, 159]));
    expect(fluorite.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
  });

  it('Lifeng 连携状态跨能力实体传入终结技第三段', () => {
    const serialized = JSON.stringify([lifengUltimate, lifeng.abilityEntityDefinitions]);
    const frames = lifengUltimate.scheduledSequences.map(sequence => sequence.startFrame);
    const ultimateStart = JSON.stringify(lifengUltimate.scheduledSequences);
    const combo = JSON.stringify(lifengComboSkill);

    expect(serialized).toContain('"childSkill":');
    expect(serialized).toContain('"destinationFrame":150');
    expect(serialized).toContain('"key":"EntityBB_isCombo"');
    expect(ultimateStart).toContain('"key":"isCombo","operation":"assign"');
    expect(combo).toContain('"globalBuffId":"global_buff_combo_trigger"');
    expect(lifengComboSkill.blackboard).toHaveProperty('duration', 20);
    const jumpIndex = serialized.indexOf('"destinationFrame":150');
    expect(jumpIndex).toBeLessThan(serialized.indexOf('"key":"EntityBB_isCombo"', jumpIndex));
    expect(frames).not.toEqual(expect.arrayContaining([64, 124, 179]));
  });

  it('Rossi 爪印 Buff 同时保留固定周期伤害与无条件防守侧减伤', () => {
    const serialized = JSON.stringify([
      rossiBattleSkill,
      rossi.buffDefinitions?.buff_chr_0028_wulfa_normal_defup,
    ]);

    expect(serialized).toContain('buff_chr_0028_wulfa_normal_defup');
    expect(serialized).toContain('repeatEachTick');
    expect(serialized).toContain('"enabledSide":"defender"');
    expect(serialized).toContain('"zone":"product"');
    expect(serialized).toContain('"blackboardKey":"defup"');
    expect(rossi.buffDefinitions?.buff_chr_0028_wulfa_normal_bleed).toMatchObject({
      triggerIntervalSeconds: { blackboardKey: 'damage_interval' },
      blackboard: { damage_interval: 1 },
      maxTriggerCount: -1,
      lifecycleSequences: {
        trigger: {
          steps: expect.arrayContaining([expect.objectContaining({ kind: 'dealDamage' })]),
        },
      },
    });
  });

  it('Rossi ultimate preserves its ultimate-only critical-damage modifier', () => {
    const serialized = JSON.stringify([
      rossiUltimate,
      rossi.buffDefinitions?.buff_chr_0028_wulfa_ult_crit_damage_up_to_bleed,
    ]);

    expect(serialized).toContain('buff_chr_0028_wulfa_ult_crit_damage_up_to_bleed');
    expect(serialized).toContain('"tags":["ultimateSkill"]');
    expect(serialized).toContain('"kind":"instantAttribute"');
    expect(serialized).toContain('"attribute":"criticalDamageIncrease"');
    expect(serialized).toContain('"blackboardKey":"critical_damage_up_to_bleed"');
  });

  it('Rossi third combo keeps the invisible infliction counter read by its damage formula', () => {
    expect(rossi.buffDefinitions?.buff_chr_0028_wulfa_combo_inflictnum).toMatchObject({
      stackingType: 'stack',
      maxStackCount: 4,
    });
    expect(JSON.stringify(rossi.skillGroups.find(group => group.key === 'comboSkill'))).toContain(
      'buff_chr_0028_wulfa_combo_inflictnum',
    );
  });

  it('Rossi 二段连携在等待 Buff 到期后把动态触发次数传给伤害 Buff', () => {
    const serialized = JSON.stringify([
      rossiComboSkill2,
      rossi.buffDefinitions?.buff_chr_0028_wulfa_combo_2_damagewait,
      rossi.buffDefinitions?.buff_chr_0028_wulfa_combo_2_damage,
    ]);

    expect(serialized).toContain('buff_chr_0028_wulfa_combo_2_damagewait');
    expect(serialized).toContain('buff_chr_0028_wulfa_combo_2_damage');
    expect(serialized).toContain('"maxTriggerCount":{"blackboardKey":"trigger_times"}');
    expect(serialized).toContain('"target":"enemy"');
    expect(serialized).toContain('"lifecycleSequences":{"trigger"');
    expect(rossi.buffDefinitions?.buff_chr_0028_wulfa_combo_2_damage).toMatchObject({
      triggerIntervalSeconds: { blackboardKey: 'damage_interval' },
      blackboard: { damage_interval: 0.1 },
      maxTriggerCount: { blackboardKey: 'trigger_times' },
      waitFirstTriggerInterval: false,
    });
  });

  it('Rossi 二段连携按原生 QTE 窗口执行完整成功动作', () => {
    const serialized = JSON.stringify([
      rossiComboSkill2,
      rossi.buffDefinitions?.buff_chr_0028_wulfa_combo_2_qte_timerlistening,
      rossi.buffDefinitions?.buff_chr_0028_wulfa_combo_2_qte_timer,
    ]);

    expect(serialized).toContain('buff_chr_0028_wulfa_combo_2_qte_timerlistening');
    expect(serialized).toContain('"kind":"showComboRingQte"');
    expect(serialized).toContain(
      '"earlyDurationSeconds":{"kind":"blackboard","key":"time_warning"}',
    );
    expect(serialized).toContain(
      '"activeDurationSeconds":{"kind":"blackboard","key":"time_succeed"}',
    );
    expect(serialized).toContain('"event":"beforeCastSkill"');
    expect(serialized).toContain('"kind":"eventSkillTypeIn","skillTypes":["comboSkill"]');
    expect(serialized).toContain('"kind":"eventComboRingQteSucceeded"');
    expect(serialized).toContain('"key":"EntityBB_Combo_QTE_Trigger"');
    expect(serialized).not.toContain(
      '"kind":"buffIdStackCompare","target":"caster","buffIds":["buff_chr_0028_wulfa_combo_2_qte_timer"]',
    );
  });

  it('Rossi 三段连携保留 timing_success 成功条件和专用成功 Buff', () => {
    const serialized = JSON.stringify(rossiComboSkill3);
    const successCondition =
      '"left":{"kind":"blackboard","key":"timing_success","fallback":0},"operator":"equal","right":{"kind":"constant","value":1}';
    const successBuff = '"buffId":"buff_chr_0028_wulfa_tut_comboskill_success"';
    const conditionIndex = serialized.indexOf(successCondition);
    const buffIndex = serialized.indexOf(successBuff, conditionIndex);

    expect(conditionIndex).toBeGreaterThanOrEqual(0);
    expect(buffIndex).toBeGreaterThan(conditionIndex);
    expect(rossi.buffDefinitions?.buff_chr_0028_wulfa_tut_comboskill_success).toBeDefined();
  });

  it.each(generatedOperators)('每个可放置技能都被分配到技能组', (operator, count) => {
    const skills = operator.skillGroups.flatMap(group => [
      ...(Array.isArray(group.skills) ? group.skills : [group.skills]),
      ...(group.variants ?? []).flatMap(variant =>
        Array.isArray(variant.skills) ? variant.skills : [variant.skills],
      ),
      ...(group.replacementSkills ?? []).filter(
        skill => group.replacementSkillPlacements?.[skill.key] !== 'internal',
      ),
      ...(group.routedReplacementSkills ?? [])
        .map(replacement => replacement.skill)
        .filter(skill => group.replacementSkillPlacements?.[skill.key] !== 'internal'),
    ]);

    expect(skills).toHaveLength(count);
    expect(new Set(skills.map(skill => skill.key)).size).toBe(count);
    expect(
      skills
        .filter(
          skill => skill.scheduledSequences.length === 0 && skill.switchToBuffCast === undefined,
        )
        .map(skill => skill.key),
    ).toEqual([]);
  });

  it.each([
    [laevatain, 4],
    [yvonne, 6],
  ] as const)('%s 的终结技开场与强化普攻形态链严格分层', (operator, variantLength) => {
    const ultimate = operator.skillGroups.find(group => group.key === 'ultimate');
    const basicAttack = operator.skillGroups.find(group => group.key === 'basicAttack');
    expect(ultimate).toBeDefined();
    expect(Array.isArray(ultimate!.skills) ? ultimate!.skills : [ultimate!.skills]).toHaveLength(1);
    expect(basicAttack?.variants).toHaveLength(1);
    expect(basicAttack?.variants?.[0]?.key).toBe('enhancedBasicAttack');
    expect(basicAttack?.variants?.[0]?.levelSource).toBe('ultimate');
    expect(
      Array.isArray(basicAttack!.variants![0]!.skills)
        ? basicAttack!.variants![0]!.skills
        : [basicAttack!.variants![0]!.skills],
    ).toHaveLength(variantLength);
  });

  it.each([
    [zhuangFangyi, 'buff_chr_0030_zhuangfy_ult_base'],
    [arcane, 'buff_chr_0032_lizhiyan_ultimate_skill_listener_owner'],
    [laevatain, 'buff_chr_0016_laevat_show_weapon'],
    [yvonne, 'buff_chr_0017_yvonne_ultimate_skill'],
  ] as const)('%s 的强化条使用显式原生 Buff 身份', (operator, buffId) => {
    const ultimate = operator.skillGroups.find(group => group.key === 'ultimate');
    const definition = Array.isArray(ultimate?.skills) ? ultimate.skills[0] : ultimate?.skills;
    expect(definition?.enhancementStateBuffId).toBe(buffId);
  });

  it('诀的三类主动技能保留两种构筑形态及原生属性条件', () => {
    for (const key of ['battleSkill', 'comboSkill', 'ultimate']) {
      expect(arcane.skillGroups.find(group => group.key === key)?.presentationVariants).toEqual([
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ]);
    }
  });

  it('汤汤终结技 Aura 的两个可见 Buff 共用实体 TimedMarker 展示时钟', () => {
    const source = JSON.stringify(
      tangtang.abilityEntityDefinitions?.abilityentity_chr_0027_tangtang_ultskill?.childSkill,
    );
    expect(source).toContain('"kind":"createAbilityEntityTimedMarker"');
    expect(source.match(/"kind":"actionOwnerTimedMarker","markerId":"tangtang_ult"/g)).toHaveLength(
      2,
    );
  });

  it.each(generatedOperators)('尚无可执行行为的养成定义必须保留对应缺口', operator => {
    const capabilities = new Set(
      operator.conversionSupport?.missingCapabilities.map(item => item.capability),
    );

    expect(operator.conversionSupport?.completeness).toBe(
      capabilities.size === 0 ? 'complete' : 'partial',
    );

    if (operator.talents.some(talent => !hasUpgradeBehavior(talent))) {
      expect(capabilities.has('talentEffects')).toBe(true);
    }
    if (operator.potentials.some(potential => !hasUpgradeBehavior(potential))) {
      expect(capabilities.has('potentialEffects')).toBe(true);
    }
  });

  it.each(generatedOperators)('所有技能等级都能编译为运行时程序', operator => {
    for (let level = 1; level <= 12; level += 1) {
      const build: OperatorInstanceDocument = {
        operatorSlug: operator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: {
          basicAttack: level,
          battleSkill: level,
          comboSkill: level,
          ultimate: level,
        },
        talentStates: {},
      };

      expect(() => compileOperatorDefinitionSkills('operator', build, operator)).not.toThrow();
    }
  });
});
