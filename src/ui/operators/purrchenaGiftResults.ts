/** 噗切娜专属展示：从实际执行的礼盒回调读取奖励，不重新抽签，也不从伤害量猜结果。 */
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';

import type { OperatorSkillOutcome } from './skillOutcomeRegistry';

// 对应原生礼盒各分支启动的技能。持续伤害后续 Tick 不算再次开奖。
const rewardBadges = { bomb: 1, handicraft: 2, dessert: 3, special: 4 } as const;
const rewards: Readonly<
  Record<string, { skill: 'combo' | 'ultimate'; reward: keyof typeof rewardBadges }>
> = {
  chr_0038_purrche_combo_skill_projhit_1: { skill: 'combo', reward: 'handicraft' },
  chr_0038_purrche_combo_skill_projhit_3: { skill: 'combo', reward: 'bomb' },
  chr_0038_purrche_combo_skill_projhit_4: { skill: 'combo', reward: 'dessert' },
  chr_0038_purrche_ult_skill_normal_bomb_projhit: { skill: 'ultimate', reward: 'bomb' },
  chr_0038_purrche_ult_skill_normal_blackhole_projhit: { skill: 'ultimate', reward: 'handicraft' },
  chr_0038_purrche_ult_skill_projhit: { skill: 'ultimate', reward: 'special' },
};

export function projectPurrchenaGiftResults(
  entries: readonly CombatReceiptEntry[],
): OperatorSkillOutcome[] {
  const origins = new Map<string, { operatorId: string; castId: string }>();
  const results: OperatorSkillOutcome[] = [];
  for (const entry of entries) {
    if (
      (entry.event === 'ProjectileLaunched' || entry.event === 'AbilityEntitySpawned') &&
      entry.subject?.kind === 'abilityEntity'
    ) {
      const inherited = origins.get(entry.sourceId ?? '');
      const castId = typeof entry.data?.castId === 'string' ? entry.data.castId : inherited?.castId;
      const operatorId = inherited?.operatorId ?? entry.sourceId;
      if (castId && operatorId)
        origins.set(`ability-entity:${entry.subject.instanceId}`, { operatorId, castId });
    }
    if (entry.event !== 'SkillStarted' || typeof entry.data?.skillId !== 'string') continue;
    const reward = rewards[entry.data.skillId];
    const origin = origins.get(entry.sourceId ?? '');
    if (!reward || !origin) continue;
    results.push({
      ...origin,
      frame: entry.frame,
      receiptSequence: entry.sequence,
      iconPath: `/operators/purrchena/${reward.skill}.webp`,
      nameKey: `timeline.passiveUi.giftResults.${reward.reward}`,
      titleKey: `timeline.passiveUi.giftResults.${reward.skill}`,
      badge: rewardBadges[reward.reward],
    });
  }
  return results;
}
