import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { ScenarioDocument } from '../../core/project/schema';
import type { SkillAvailabilityDiagnostic } from '../../core/projection/skillAvailabilityDiagnostics';
import { seasonTwoPreviewBuffIds } from '../../data/contingencyContract/previewSeasonTwo';
import { contingencyContractMechanicId } from '../../data/contingencyContract/contingencyContractCatalog';

// 二期前瞻的临时解释，正式数据接入后整块删除，不写入干员定义或运行时门禁。
// 依据技能描述：弭弗追形/开天，祀起墨/收笔，以及梨诺的姿态中止属于后续操作。
// 卡缪追猎实际视为连携技，按执行技能类型检查连携锁，不按按钮位置判断。
const battleFollowUps = new Set([
  'chr_0031_mifu_normalskill_2',
  'chr_0031_mifu_normalskill_3',
  'chr_0036_jsspsi_normal_skill_1',
  'chr_0036_jsspsi_normal_skill_2',
  'chr_0035_liino_normal_skill_end',
]);

const lockMechanics = new Set([200001, 200002].map(contingencyContractMechanicId));

/** 按有序回执还原释放当时的锁；同帧施加/解除也按实际先后处理。 */
export function projectPreviewSeasonTwoDiagnostics(
  entries: readonly CombatReceiptEntry[],
  scenario: ScenarioDocument,
  index: Pick<GameDataRepository, 'getOperator'>,
): readonly SkillAvailabilityDiagnostic[] {
  if (
    !scenario.mechanics.selections.some(
      selection => selection.enabled && lockMechanics.has(selection.mechanicId),
    )
  )
    return [];
  const lockIds = new Set([seasonTwoPreviewBuffIds.lock, seasonTwoPreviewBuffIds.battleLock]);
  if (
    !entries.some(entry => entry.event === 'BuffApplied' && lockIds.has(String(entry.data?.buffId)))
  )
    return [];
  const operators = new Map(
    scenario.tracks.flatMap(track =>
      track?.operator ? [[track.id, index.getOperator(track.operator.operatorSlug)] as const] : [],
    ),
  );
  const active = new Map<string, Map<string, Set<number>>>();
  const result: SkillAvailabilityDiagnostic[] = [];
  const seenCasts = new Set<string>();
  for (const entry of entries) {
    const buffId = String(entry.data?.buffId);
    if (lockIds.has(buffId) && entry.targetId && typeof entry.data?.instanceId === 'number') {
      const locks = active.get(entry.targetId) ?? new Map<string, Set<number>>();
      const instances = locks.get(buffId) ?? new Set<number>();
      if (entry.event === 'BuffApplied' && entry.data.enabled !== false)
        instances.add(entry.data.instanceId);
      if (entry.event === 'BuffFinished' || entry.event === 'BuffReleased')
        instances.delete(entry.data.instanceId);
      locks.set(buffId, instances);
      active.set(entry.targetId, locks);
    }
    // 施法转 Buff 的旁路不产生 SkillStarted；扣费回执早于 afterSkillApplyCost 挂锁。
    if (
      (entry.event !== 'SkillStarted' && entry.event !== 'SkillCostApplied') ||
      !entry.sourceId ||
      typeof entry.data?.castId !== 'string'
    )
      continue;
    if (seenCasts.has(entry.data.castId)) continue;
    seenCasts.add(entry.data.castId);
    const skillId = entry.data.skillId;
    if (typeof skillId !== 'string') continue;
    const operator = operators.get(entry.sourceId);
    const routedId =
      operator?.routedReplacementSkills?.find(route => route.skillId === skillId)
        ?.executionSkillKey ?? skillId;
    const skill = operator?.skills.find(skill => skill.key === routedId);
    const lock =
      skill?.skillType === 'comboSkill'
        ? seasonTwoPreviewBuffIds.lock
        : skill?.skillType === 'battleSkill' && !battleFollowUps.has(skillId)
          ? seasonTwoPreviewBuffIds.battleLock
          : undefined;
    if (lock && active.get(entry.sourceId)?.get(lock)?.size)
      result.push({
        frame: entry.frame,
        sourceId: entry.sourceId,
        skillId,
        reasons: ['skillLocked'],
        receiptSequences: [entry.sequence],
      });
  }
  return result;
}
