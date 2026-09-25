import { describe, expect, it } from 'vitest';

import type { WeaponDefinition } from '../../../core/game-data/equipmentDefinition';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument } from '../../../core/project/schema';
import { skillSettings } from '../../../data/combat/skillSettings';
import { generatedWeaponDefinitions } from '../../../data/equipment/generated-weapons/index.generated';
import { createGameDataRepository, gameDataRepository } from '../../../data/gameDataRepository';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { staticEquipmentContribution } from '../testSupport/staticEquipmentContribution';

// 候选定义必须实际经过生产编译/战斗环境；不借用旧武器行为，也不依赖本地原始资源。
const candidates: readonly WeaponDefinition[] = generatedWeaponDefinitions;
const repository = createGameDataRepository({
  revision: 'generated-weapon-production-audit',
  operators: gameDataRepository.getOperators(),
  weapons: candidates,
  commonBuffDefinitions: gameDataRepository.getCommonBuffDefinitions?.(),
  commonAbilityEntityDefinitions: gameDataRepository.getCommonAbilityEntityDefinitions?.(),
});

describe('生成武器的正式模拟门禁', () => {
  it.each([
    { slug: 'wpn_funnel_0016', tier: 4, buffId: 'buff_wpn_funnel_0016_will_atk', bonus: 0.096 },
    { slug: 'wpn_funnel_0016', tier: 9, buffId: 'buff_wpn_funnel_0016_will_atk', bonus: 0.168 },
    {
      slug: 'wpn_funnel_0008',
      tier: 6,
      buffId: 'buff_wpn_funnel_0008_magic_damage_taken_up',
      bonus: 0.18,
    },
    {
      slug: 'wpn_funnel_0008',
      tier: 9,
      buffId: 'buff_wpn_funnel_0008_magic_damage_taken_up',
      bonus: 0.252,
    },
  ])('$slug 词条$tier的爆发前增益作用于同次爆发', async ({ slug, tier, buffId, bonus }) => {
    const weapon = candidates.find(item => item.slug === slug)!;
    const source = repository.getOperator('xaihi')!;
    // 受控意志构筑，用于选择武器分支；技能、武器和爆发仍使用生产定义。
    const operator = {
      ...source,
      attributes: { ...source.attributes, will: source.attributes.will.map(() => 1000) },
    };
    const levels = weapon.traits.map(() => tier);
    const active = await simulateWeapon(weapon, operator, ['comboSkill', 'comboSkill'], levels);
    const baseline = await simulateWeapon(
      { ...weapon, traits: weapon.traits.map(staticEquipmentContribution) },
      operator,
      ['comboSkill', 'comboSkill'],
      levels,
    );
    const burst = (run: typeof active) =>
      run.receiptEntries.find(
        e => e.event === 'DamageApplied' && e.data?.spellBurstType === 'Cryst',
      );
    const hit = burst(active);
    expect(hit).toBeDefined();
    const buff = active.receiptEntries.find(
      e => e.event === 'BuffApplied' && e.data?.buffId === buffId,
    );
    expect(buff).toBeDefined();
    expect(buff!.frame).toBe(hit!.frame);
    expect(active.receiptEntries.indexOf(buff!)).toBeLessThan(active.receiptEntries.indexOf(hit!));
    expect(active.executionDiagnostics).toEqual([]);
    expect(hit!.data?.damageScaleMultiplier).toBeCloseTo(1 + bonus);
    expect(burst(baseline)?.data?.damageScaleMultiplier).toBeCloseTo(1);
    expect(burst(baseline)?.data?.attack).toBe(hit!.data?.attack);
    expect(
      baseline.receiptEntries.some(
        e => e.event === 'BuffApplied' && String(e.data?.buffId).startsWith(`buff_${slug}`),
      ),
    ).toBe(false);
    expect(baseline.executionDiagnostics).toEqual([]);
  });
  it.each([1, 9])('艾维文娜连续排轴 %i：三把连携枪由战技回收并执行正式回调伤害', async tier => {
    const weapon = candidates.find(item => item.slug === 'wpn_lance_0006')!;
    const result = await simulateWeapon(
      weapon,
      repository.getOperator('avywenna')!,
      ['comboSkill', 'comboSkill', 'comboSkill', 'battleSkill', 'basicAttack'],
      weapon.traits.map(() => tier),
      [],
      { ownerStartFrames: [1, 151, 301, 451, 701] },
    );
    const returnHits = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        entry.sourceId === 'track:weapon-owner' &&
        // 发射后的下一次投射物 Tick 执行回收回调，不在发射动作内同步展开。
        entry.frame === 459,
    );
    expect(returnHits).toHaveLength(3);
    expect(returnHits.every(entry => entry.data?.damageType === 'electric')).toBe(true);
  });
  it.each([
    { trigger: 'owner', tier: 1, damage: 0.07, critical: 0.04 },
    { trigger: 'owner', tier: 9, damage: 0.196, critical: 0.112 },
    { trigger: 'teammate', tier: 1, damage: 0.035, critical: 0.02 },
    { trigger: 'teammate', tier: 9, damage: 0.098, critical: 0.056 },
  ])(
    '冻结/腐蚀光环 $trigger/$tier：增益归持有者，精确倍率与寿命进入 hit',
    async ({ trigger, tier, damage, critical }) => {
      const weapon = candidates.find(item => item.slug === 'wpn_pistol_0005')!;
      const owner = repository.getOperator('tangtang')!;
      const groups =
        trigger === 'owner'
          ? ['basicAttack', 'battleSkill', 'basicAttack', 'basicAttack']
          : ['battleSkill', 'basicAttack', 'basicAttack', 'basicAttack'];
      const teammate = repository.getOperator(trigger === 'owner' ? 'perlica' : 'arcane')!;
      const options = {
        teammateSkillGroup: 'battleSkill',
        teammateStartFrame: trigger === 'owner' ? 1 : 300,
        ownerStartFrames: [1, 301, 601, 1001],
      };
      const levels = weapon.traits.map(() => tier);
      const disabled = {
        ...weapon,
        traits: weapon.traits.map(staticEquipmentContribution),
      };
      const result = await simulateWeapon(weapon, owner, groups, levels, [teammate], options);
      const baseline = await simulateWeapon(disabled, owner, groups, levels, [teammate], options);
      const activations = result.receiptEntries.filter(
        entry =>
          entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_pistol_0005_valid',
      );
      expect(activations).toHaveLength(1);
      expect(activations[0]).toMatchObject({
        sourceId: 'track:weapon-owner',
        targetId: 'track:weapon-owner',
        data: {
          visible: true,
          iconId: 'icon_battle_buff_atk_up',
          sourceActionId: expect.stringContaining('weapon-trait:'),
        },
      });
      const end = result.receiptEntries.find(
        entry =>
          entry.event === 'BuffFinished' && entry.data?.buffId === 'buff_wpn_pistol_0005_valid',
      )!;
      expect(end.time - activations[0]!.time).toBeCloseTo(15, 1);
      const hits = result.receiptEntries.filter(
        entry =>
          entry.event === 'DamageApplied' &&
          entry.sourceId === 'track:weapon-owner' &&
          entry.data?.skillType === 'basicAttack' &&
          entry.frame >= 601,
      );
      expect(hits.some(hit => hit.frame < 1001)).toBe(true);
      expect(hits.some(hit => hit.frame >= 1001)).toBe(true);
      for (const hit of hits) {
        const reference = baseline.receiptEntries.find(
          entry => entry.event === 'DamageApplied' && entry.data?.hitId === hit.data?.hitId,
        )!;
        expect(reference).toBeDefined();
        const active = hit.frame < 1001;
        expect(
          Number(hit.data?.damageScaleMultiplier) - Number(reference.data?.damageScaleMultiplier),
        ).toBeCloseTo(active ? damage : 0, 6);
        expect(Number(hit.data?.criticalRate) - Number(reference.data?.criticalRate)).toBeCloseTo(
          active ? critical : 0,
          6,
        );
        if (active)
          expect(Number(hit.data?.nonCriticalDamage)).toBeGreaterThan(
            Number(reference.data?.nonCriticalDamage),
          );
        else expect(hit.data?.nonCriticalDamage).toBe(reference.data?.nonCriticalDamage);
      }
      // 队友只负责触发，不能错误取得武器增益。
      const otherHits = result.receiptEntries.filter(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:teammate:0',
      );
      for (const hit of otherHits) {
        const reference = baseline.receiptEntries.find(
          entry => entry.event === 'DamageApplied' && entry.data?.hitId === hit.data?.hitId,
        )!;
        expect(hit.data?.damageScaleMultiplier).toBe(reference.data?.damageScaleMultiplier);
        expect(hit.data?.criticalRate).toBe(reference.data?.criticalRate);
      }
    },
  );

  it('仅寒冷附着不冒充冻结，不能触发反应武器光环', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_pistol_0005')!;
    const result = await simulateWeapon(weapon, repository.getOperator('tangtang')!, [
      'battleSkill',
      'basicAttack',
    ]);
    expect(result.receiptEntries.some(entry => entry.event === 'ElementalInflictionApplied')).toBe(
      true,
    );
    expect(
      result.receiptEntries.filter(
        entry =>
          entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_pistol_0005_valid',
      ),
    ).toHaveLength(0);
  });

  it.each([
    { tier: 1, damage: 0.08 },
    { tier: 9, damage: 0.224 },
  ])('灼热/腐蚀光环 $tier：队友反应给剑持有者加伤，不给队友加伤', async ({ tier, damage }) => {
    const weapon = candidates.find(item => item.slug === 'wpn_sword_0010')!;
    const owner = repository.getOperator('laevatain')!;
    const teammate = repository.getOperator('arcane')!;
    const groups = ['basicAttack', 'basicAttack', 'battleSkill'];
    const levels = weapon.traits.map(() => tier);
    const options = { teammateSkillGroup: 'battleSkill', teammateStartFrames: [1, 300] };
    const disabled = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    const teammates = [repository.getOperator('perlica')!, teammate];
    const result = await simulateWeapon(weapon, owner, groups, levels, teammates, options);
    const baseline = await simulateWeapon(disabled, owner, groups, levels, teammates, options);
    const applied = result.receiptEntries.filter(
      entry => entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_sword_0010_valid',
    );
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatchObject({
      sourceId: 'track:weapon-owner',
      targetId: 'track:weapon-owner',
      data: { visible: true },
    });
    const end = result.receiptEntries.find(
      entry => entry.event === 'BuffFinished' && entry.data?.buffId === 'buff_wpn_sword_0010_valid',
    )!;
    expect(end.time - applied[0]!.time).toBeCloseTo(20, 1);
    const hits = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        entry.sourceId === 'track:weapon-owner' &&
        entry.frame >= 601 &&
        entry.data?.damageType === 'heat',
    );
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      const reference = baseline.receiptEntries.find(
        entry => entry.event === 'DamageApplied' && entry.data?.hitId === hit.data?.hitId,
      )!;
      expect(
        Number(hit.data?.damageScaleMultiplier) - Number(reference.data?.damageScaleMultiplier),
      ).toBeCloseTo(damage, 6);
      expect(Number(hit.data?.nonCriticalDamage)).toBeGreaterThan(
        Number(reference.data?.nonCriticalDamage),
      );
    }
  });

  it('武器物理异常追加伤害使用独立来源，不伪装为触发技能命中', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_lance_0010')!;
    const operator = repository.getOperator('lifeng')!;
    const disabled = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    // 正式物理控制先破防、再次命中才形成倒地；第二次战技才会触发物理异常武器事件。
    const skillGroups = ['battleSkill', 'battleSkill'];
    const options = { ownerStartFrames: [1, 400] };
    const active = await simulateWeapon(weapon, operator, skillGroups, undefined, [], options);
    const baseline = await simulateWeapon(disabled, operator, skillGroups, undefined, [], options);
    const extra = active.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        typeof entry.data?.sourceActionId === 'string' &&
        entry.data.sourceActionId.includes(weapon.slug),
    );
    expect(extra.length).toBeGreaterThan(0);
    for (const hit of extra) {
      expect(hit.sourceId).toBe('track:weapon-owner');
      expect(hit.data?.skillType).toBeUndefined();
      expect(hit.data?.castId).toBeUndefined();
      expect(Number(hit.data?.value)).toBeGreaterThan(0);
    }
    expect(baseline.finalEnemyHealth - active.finalEnemyHealth).toBeCloseTo(
      extra.reduce((sum, hit) => sum + Number(hit.data?.value), 0),
      4,
    );
  });

  it('入战武器 Buff 结束后即使满血仍治疗，并保留来源与数值', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_sword_0026')!;
    const operator = repository.getOperators().find(item => item.weaponType === weapon.weaponType)!;
    const result = await simulateWeapon(weapon, operator, []);
    const heals = result.receiptEntries.filter(entry => entry.event === 'HealingApplied');
    expect(heals).toHaveLength(1);
    expect(heals[0]).toMatchObject({
      sourceId: 'track:weapon-owner',
      targetId: 'track:weapon-owner',
      data: { attribute: 'definite', addition: 122, actualHealing: 0 },
    });
    // 实际治疗还会应用该干员的治疗增幅，不把配置基础值误作最终值。
    expect(Number(heals[0]!.data?.requestedHealing)).toBeGreaterThanOrEqual(122);
    expect(heals[0]!.data?.overhealing).toBe(heals[0]!.data?.requestedHealing);
    expect(heals[0]!.time).toBeCloseTo(20, 1);
  });

  it('Stack 武器战技可叠层并实际提高物理伤害，无需伪造 lv', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_claym_0016')!;
    const operator = repository.getOperator('da-pan')!;
    const disabled = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    const active = await simulateWeapon(weapon, operator, [
      'battleSkill',
      'comboSkill',
      'battleSkill',
    ]);
    const baseline = await simulateWeapon(disabled, operator, [
      'battleSkill',
      'comboSkill',
      'battleSkill',
    ]);
    expect(active.finalEnemyHealth).toBeLessThan(baseline.finalEnemyHealth);
    expect(
      active.receiptEntries.filter(
        entry =>
          entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_claym_0016_dmgup',
      ),
    ).toHaveLength(3);
  });

  it.each([
    ['perlica', 'buff_wpn_funnel_0016_wisd', 'buff_wpn_funnel_0016_will'],
    ['xaihi', 'buff_wpn_funnel_0016_will', 'buff_wpn_funnel_0016_wisd'],
  ])(
    '配装初始化按 %s 的 Deck 属性选择真实分支，子 Buff 不随初始化结束',
    async (slug, chosen, rejected) => {
      const weapon = candidates.find(item => item.slug === 'wpn_funnel_0016')!;
      const operator = repository.getOperator(slug)!;
      // 满级武器的智识加成会使赛希也进入智识分支；仅降低第一词条等级来覆盖另一侧。
      const traitLevels = weapon.traits.map((trait, index) =>
        slug === 'xaihi' && index === 0 ? 1 : trait.levelCount,
      );
      const result = await simulateWeapon(weapon, operator, ['basicAttack'], traitLevels);
      const attributes = result.operatorPanels[0]!.attributes;
      expect(attributes.intellect >= attributes.will).toBe(slug === 'perlica');
      const applied = result.receiptEntries.filter(entry => entry.event === 'BuffApplied');
      expect(applied.some(entry => entry.data?.buffId === chosen && entry.frame === 0)).toBe(true);
      expect(applied.some(entry => entry.data?.buffId === rejected)).toBe(false);
      expect(
        result.receiptEntries.some(
          entry => entry.event === 'BuffFinished' && entry.data?.buffId === chosen,
        ),
      ).toBe(false);
    },
  );

  it('武器候选非空、身份唯一且均有可装配的干员', () => {
    expect(candidates.length).toBeGreaterThan(0);
    expect(new Set(candidates.map(weapon => weapon.slug)).size).toBe(candidates.length);
    for (const weapon of candidates) {
      expect(
        repository.getOperators().some(operator => operator.weaponType === weapon.weaponType),
        weapon.slug,
      ).toBe(true);
    }
  });

  it.each(candidates)('$slug 四类技能生产模拟全部成功，不设置失败豁免', async weapon => {
    const operator = repository
      .getOperators()
      .find(
        candidate =>
          candidate.weaponType === weapon.weaponType &&
          ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate'].every(key =>
            candidate.skillGroups.some(group => group.key === key),
          ),
      );
    if (!operator) throw new Error(`no compatible operator for ${weapon.slug}`);
    const result = await simulateWeapon(weapon, operator);
    expect(result.finalEnemyHealth).toBeLessThan(result.enemyVitals.initialHealth);
  });

  it.each(candidates)('$slug 全兼容干员/词条两端审计：不得出现未知失败', async weapon => {
    const operators = repository
      .getOperators()
      .filter(operator => operator.weaponType === weapon.weaponType);
    expect(operators.length).toBeGreaterThan(0);
    const failures: string[] = [];
    for (const operator of operators) {
      for (const tier of ['minimum', 'maximum'] as const) {
        try {
          const result = await simulateWeapon(
            weapon,
            operator,
            undefined,
            weapon.traits.map(trait => (tier === 'minimum' ? 1 : trait.levelCount)),
          );
          expect(result.finalEnemyHealth).toBeLessThan(result.enemyVitals.initialHealth);
        } catch (error) {
          failures.push(
            `${operator.slug}/${tier}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
    // 正式诀已安装模板初值与动态条件；966 场全部必须成功，不再保留失败豁免。
    expect(failures).toEqual([]);
  });

  it('诀单放连携也能从角色模板读取初值，不依赖武器事件补值', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_funnel_0003')!;
    const disabled = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    const result = await simulateWeapon(disabled, repository.getOperator('arcane')!, [
      'comboSkill',
    ]);
    expect(result.finalEnemyHealth).toBeLessThan(result.enemyVitals.initialHealth);
    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'ElementalInflictionApplied')
        .map(entry => entry.data?.requestedElement),
    ).toEqual(['heat']);
  });

  it('诀战技动态写入元素后连携读到新值，而不是一直使用模板零值', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_funnel_0003')!;
    const disabled = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    const result = await simulateWeapon(disabled, repository.getOperator('arcane')!, [
      'battleSkill',
      'comboSkill',
    ]);
    const combo = result.receiptEntries.find(
      entry =>
        entry.event === 'SkillStarted' && entry.data?.skillId === 'chr_0032_lizhiyan_combo_skill',
    )!;
    const inflictions = result.receiptEntries.filter(
      entry =>
        entry.event === 'ElementalInflictionApplied' && entry.data?.castId === combo.data?.castId,
    );
    expect(inflictions.map(entry => entry.data?.requestedElement)).toEqual(['nature']);
    expect(result.receiptEntries.some(entry => entry.event === 'ComboWindowOpened')).toBe(true);
    expect(result.finalEnemyHealth).toBeLessThan(result.enemyVitals.initialHealth);
    // 仅移除动态条件作反事实对照，面板/动作/模板初值不变：应回退到初始火元素并改变伤害结果。
    const baseline = await simulateWeapon(
      disabled,
      { ...repository.getOperator('arcane')!, comboSkillConditions: [] },
      ['battleSkill', 'comboSkill'],
    );
    const baselineCombo = baseline.receiptEntries.find(
      entry =>
        entry.event === 'SkillStarted' && entry.data?.skillId === 'chr_0032_lizhiyan_combo_skill',
    )!;
    expect(
      baseline.receiptEntries
        .filter(
          entry =>
            entry.event === 'ElementalInflictionApplied' &&
            entry.data?.castId === baselineCombo.data?.castId,
        )
        .map(entry => entry.data?.requestedElement),
    ).toEqual(['heat']);
    expect(result.finalEnemyHealth).not.toBe(baseline.finalEnemyHealth);
  });

  it('终结技武器加攻只覆盖异属性队友，并实际提高队友命中伤害', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_funnel_0005')!;
    const owner = repository.getOperator('perlica')!;
    const teammates = ['antal', 'wulfgard', 'xaihi'].map(slug => repository.getOperator(slug)!);
    const disabled = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    const active = await simulateWeapon(weapon, owner, ['ultimate'], undefined, teammates);
    const baseline = await simulateWeapon(disabled, owner, ['ultimate'], undefined, teammates);
    const recipients = active.receiptEntries.filter(
      entry =>
        entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_funnel_0005_atk_up',
    );
    expect(recipients.map(entry => entry.targetId).sort()).toEqual([
      'track:teammate:1',
      'track:teammate:2',
    ]);
    const damageBy = (result: typeof active, sourceId: string) =>
      result.receiptEntries
        .filter(entry => entry.event === 'DamageApplied' && entry.sourceId === sourceId)
        .reduce((sum, entry) => sum + Number(entry.data?.value), 0);
    for (const trackId of ['track:weapon-owner', 'track:teammate:0']) {
      expect(damageBy(active, trackId)).toBeGreaterThan(0);
      expect(damageBy(active, trackId)).toBeCloseTo(damageBy(baseline, trackId), 6);
    }
    for (const trackId of ['track:teammate:1', 'track:teammate:2']) {
      expect(damageBy(active, trackId)).toBeGreaterThan(damageBy(baseline, trackId));
    }
  });

  it('真实战技触发武器加攻，后续技能伤害提高，图标 Buff 在 20 秒后结束', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_claym_0003')!;
    const operator =
      repository.getOperator('da-pan') ??
      repository.getOperators().find(item => item.weaponType === 'greatsword')!;
    const disabled: WeaponDefinition = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    const active = await simulateWeapon(weapon, operator, ['battleSkill', 'basicAttack']);
    const baseline = await simulateWeapon(disabled, operator, ['battleSkill', 'basicAttack']);
    expect(active.operatorPanels[0]!.attack).toBe(baseline.operatorPanels[0]!.attack);
    expect(active.finalEnemyHealth).toBeLessThan(baseline.finalEnemyHealth);
    const applied = active.receiptEntries
      .filter(
        entry => entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_claym_0003',
      )
      .at(-1);
    const ended = active.receiptEntries.find(
      entry => entry.event === 'BuffFinished' && entry.data?.buffId === 'buff_wpn_claym_0003',
    );
    expect(applied).toBeDefined();
    expect(ended?.data?.reason).toBe('lifetime');
    expect(ended!.time - applied!.time).toBeCloseTo(20, 1);
  });

  it('战技开始创建的武器 Buff 随本次技能结束，不残留到下一次战技', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_lance_0006')!;
    const operator = repository.getOperators().find(item => item.weaponType === weapon.weaponType)!;
    const result = await simulateWeapon(weapon, operator, ['battleSkill', 'battleSkill']);
    const applied = result.receiptEntries.filter(
      entry =>
        entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_lance_0006_skill_pulse01',
    );
    const finished = result.receiptEntries.filter(
      entry =>
        entry.event === 'BuffFinished' &&
        entry.data?.buffId === 'buff_wpn_lance_0006_skill_pulse01',
    );
    const skillEnds = result.receiptEntries.filter(entry => entry.event === 'SkillEnded');
    expect(applied).toHaveLength(2);
    expect(finished).toHaveLength(2);
    expect(skillEnds).toHaveLength(2);
    for (const [index, entry] of finished.entries()) {
      expect(entry.data?.reason).toBe('other');
      expect(entry.frame).toBe(skillEnds[index]!.frame);
      expect(result.receiptEntries.indexOf(entry)).toBeLessThan(
        result.receiptEntries.indexOf(skillEnds[index]!),
      );
      expect(entry.time).toBeGreaterThan(applied[index]!.time);
    }
    expect(finished[0]!.time).toBeLessThan(applied[1]!.time);
  });

  it('连携伤害来源能触发武器 Buff，单放战技不能冒充连携', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_lance_0016')!;
    const operator = repository.getOperator('avywenna')!;
    const combo = await simulateWeapon(weapon, operator, ['comboSkill']);
    const battle = await simulateWeapon(weapon, operator, ['battleSkill']);
    const activations = (result: typeof combo) =>
      result.receiptEntries.filter(
        entry => entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_lance_0016_heal',
      );
    expect(activations(combo).length).toBeGreaterThan(0);
    expect(activations(battle)).toHaveLength(0);
  });

  it('狼卫连携引发的法术爆发触发武器加攻并提高伤害，战技来源不触发', async () => {
    const weapon = candidates.find(item => item.slug === 'wpn_pistol_0004')!;
    const operator = repository.getOperator('wulfgard')!;
    const disabled: WeaponDefinition = {
      ...weapon,
      traits: weapon.traits.map(staticEquipmentContribution),
    };
    const groups = ['battleSkill', 'comboSkill', 'basicAttack'];
    const active = await simulateWeapon(weapon, operator, groups);
    const baseline = await simulateWeapon(disabled, operator, groups);
    const battleOnly = await simulateWeapon(weapon, operator, ['battleSkill', 'battleSkill']);
    const activations = (result: typeof active) =>
      result.receiptEntries.filter(
        entry =>
          entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_pistol_0004_atk_up',
      );
    expect(
      active.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && typeof entry.data?.spellBurstType === 'string',
      ),
    ).toBe(true);
    expect(activations(active).length).toBeGreaterThan(0);
    expect(activations(baseline)).toHaveLength(0);
    expect(activations(battleOnly)).toHaveLength(0);
    expect(active.finalEnemyHealth).toBeLessThan(baseline.finalEnemyHealth);
  });
});

async function simulateWeapon(
  weapon: WeaponDefinition,
  operator: OperatorDefinition,
  skillGroups: readonly string[] = ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate'],
  traitLevels?: readonly number[],
  teammates: readonly OperatorDefinition[] = [],
  options: {
    teammateSkillGroup?: string;
    teammateStartFrame?: number;
    teammateStartFrames?: readonly number[];
    ownerStartFrames?: readonly number[];
  } = {},
) {
  const teammateTrackIndices = [1, 2, 3] as const;
  if (teammates.length > teammateTrackIndices.length) throw new Error('at most three teammates');
  let scenario = createEmptyScenario(`audit:generated:${weapon.slug}`, '生成武器生产验证');
  scenario.battle.durationFrames = 1800;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.battle.resourceRules = {
    maxSp: 1000,
    initialSp: 1000,
    spRecoveryPerSecond: 100,
    defaultSkillSpCost: 100,
  };
  const track: TrackDocument = {
    id: 'track:weapon-owner',
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: Object.fromEntries(operator.skillGroups.map(group => [group.key, 12])),
      talentStates: Object.fromEntries(operator.talents.map((_, index) => [index, 0])),
    },
    weapon: {
      weaponSlug: weapon.slug,
      level: 90,
      tuned: true,
      potential: 5,
      traitLevels:
        traitLevels === undefined ? weapon.traits.map(trait => trait.levelCount) : [...traitLevels],
    },
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
    skillCasts: [],
  };
  scenario.tracks[0] = track;
  for (const [index, teammate] of teammates.entries()) {
    scenario.tracks[teammateTrackIndices[index]!] = {
      ...structuredClone(track),
      id: `track:teammate:${index}`,
      operator: {
        ...track.operator!,
        operatorSlug: teammate.slug,
        skillLevels: Object.fromEntries(teammate.skillGroups.map(group => [group.key, 12])),
        talentStates: Object.fromEntries(
          teammate.talents.map((_, talentIndex) => [talentIndex, 0]),
        ),
      },
      weapon: null,
    };
  }
  let id = 0;
  for (const [index, skillGroupKey] of skillGroups.entries()) {
    scenario = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator,
      skillGroupKey,
      startFrame: options.ownerStartFrames?.[index] ?? 1 + index * 300,
      ids: { allocate: kind => `${kind}:generated-audit:${id++}` },
    }).scenario;
  }
  for (const [index, teammate] of teammates.entries()) {
    scenario = placeSkillGroup({
      scenario,
      trackIndex: teammateTrackIndices[index]!,
      operator: teammate,
      skillGroupKey: options.teammateSkillGroup ?? 'basicAttack',
      startFrame: options.teammateStartFrames?.[index] ?? options.teammateStartFrame ?? 300,
      ids: { allocate: kind => `${kind}:generated-audit:${id++}` },
    }).scenario;
  }
  return new ScenarioSimulationService({
    index: {
      ...repository,
      getWeapon: slug => (slug === weapon.slug ? weapon : repository.getWeapon(slug)),
      getOperator: slug => (slug === operator.slug ? operator : repository.getOperator(slug)),
    },
    repositoryRevision: repository.revision,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
    spellInflictionSettings: skillSettings,
  }).simulate(scenario, 1800);
}
