import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { CompiledSkillProgram } from '../../compiler/combatProgram';
import type { ComboCastParameters } from '../state/environmentState';
import type { SkillCastStartPreparation } from '../state/foundationState';

/**
 * 简化选敌投影：由场景传入当前可用主目标，不模拟镜头、锁定菜单或坐标。
 * 敌人与队伍干员均保留实际目标身份。原生 FindSmartTarget 检查 alive、IsUnmarkable 和距离，
 * 不按敌我阵营直接拒绝干员。
 * 本投影沿用固定有效实体、零距离的前提；能力实体与空间点的可选中语义仍需单独支持。
 */
export function prepareComboCast(
  program: Pick<CompiledSkillProgram, 'smartTarget'>,
  pending: ComboCastParameters | undefined,
  mainTarget: RuntimeTargetRef | undefined,
  canSelect: (target: RuntimeTargetRef) => boolean,
): SkillCastStartPreparation {
  const trigger =
    pending?.triggerTargets == null
      ? undefined
      : pending.triggerTargets.map(target => ({ ...target }));
  const assignPairs = pending?.assignPairs == null ? null : { ...pending.assignPairs };
  const selected =
    program.smartTarget === undefined
      ? undefined
      : program.smartTarget === 'enemy'
        ? mainTarget
        : pending === undefined
          ? mainTarget // 无候选的手工排轴沿用当前可用目标。
          : program.smartTarget === 'input'
            ? pending.inputTargets.find(canSelect)
            : pending.triggerTargets?.find(canSelect);
  if (selected !== undefined && selected.kind !== 'enemy' && selected.kind !== 'operator')
    throw new Error(
      `combo smart target requires an audited ${selected.kind} target selection projection`,
    );
  const smartTarget = selected === undefined ? undefined : { ...selected };
  return {
    ...(trigger === undefined ? {} : { trigger }),
    ...(smartTarget === undefined ? {} : { smartTarget }),
    assignPairs,
  };
}
