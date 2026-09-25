/** 从原生技能包和能力系统配置提取外部技能、Buff 引用，供黑板读取检查使用。 */
import { requireArray, requireRecord, requireString } from './primitives.ts';
import type { DefinitionReferenceSource } from './referenceGraph.ts';

function reference(
  kind: 'skill' | 'buff',
  value: unknown,
  sourcePath: string,
): DefinitionReferenceSource[] {
  const id = requireString(value, sourcePath);
  return id
    ? [{ kind, id, sourcePath, usage: 'blackboardReceiver', state: 'active', blackboardKey: null }]
    : [];
}

export function parseSkillBundleReferences(value: unknown, path: string) {
  const bundle = requireRecord(value, path);
  const references: DefinitionReferenceSource[] = [];
  for (const field of [
    'allNormalAttackId',
    'allActiveSkillId',
    'allPassiveSkillId',
    'normalAttackList',
    'enabledBreakingNormalAttacks',
    'enabledPassiveSkills',
  ]) {
    requireArray(bundle[field], `${path}.${field}`).forEach((id, index) => {
      references.push(...reference('skill', id, `${path}.${field}[${index}]`));
    });
  }
  for (const field of [
    'normalSkillId',
    'ultimateSkillId',
    'plungingAttackStartId',
    'plungingAttackEndId',
    'dodgeSkillId',
    'comboSkillId',
  ]) {
    references.push(...reference('skill', bundle[field], `${path}.${field}`));
  }
  // 条件内部的托管动作引用尚未展开，但已知技能仍继续检查。
  const complete =
    requireArray(bundle.comboSkillConditions, `${path}.comboSkillConditions`).length === 0;
  return { references, complete };
}

export function parseAbilitySystemReferences(value: unknown, path: string) {
  const ability = requireRecord(value, path);
  const result = parseSkillBundleReferences(ability.skillDataBundle, `${path}.skillDataBundle`);
  const modes = requireRecord(ability.modeConfig, `${path}.modeConfig`);
  result.complete &&= requireArray(modes.modes, `${path}.modeConfig.modes`).length === 0;
  for (const field of ['dashBuff', 'buffDuringPoiseExist', 'buffDuringZeroPoise']) {
    requireArray(ability[field], `${path}.${field}`).forEach((buff, index) => {
      const buffPath = `${path}.${field}[${index}]`;
      result.references.push(
        ...reference('buff', requireRecord(buff, buffPath).buffId, `${buffPath}.buffId`),
      );
    });
  }
  result.references.push(
    ...reference('buff', ability.maxPotentialEffectBuffId, `${path}.maxPotentialEffectBuffId`),
  );
  return result;
}
