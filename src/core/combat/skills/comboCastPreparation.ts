import type { CompiledSkillProgram } from '../../compiler/combatProgram';
import type { ComboCastParameters } from '../state/environmentState';
import type { SkillCastStartPreparation } from '../state/foundationState';

/**
 * 固定木桩投影：普通选敌设置、唯一有效敌人、距离为零；不模拟镜头、锁定菜单或 dummy 坐标。
 * 敌人与队伍干员均保留实际目标身份。原生 FindSmartTarget 检查 alive、IsUnmarkable 和距离，
 * 不按敌我阵营直接拒绝干员。
 * 本投影沿用固定有效实体、零距离的前提；能力实体与空间点的可选中语义仍需单独支持。
 */
export function prepareComboCast(
  program: Pick<CompiledSkillProgram, 'smartTarget'>,
  pending?: ComboCastParameters,
): SkillCastStartPreparation {
  const trigger = pending?.triggerTarget == null ? undefined : { ...pending.triggerTarget };
  const assignPairs = pending?.assignPairs == null ? null : { ...pending.assignPairs };
  const selected =
    program.smartTarget === undefined
      ? undefined
      : program.smartTarget === 'enemy'
        ? { kind: 'enemy' as const }
        : pending === undefined
          ? { kind: 'enemy' as const } // 无候选的手工排轴：固定有效主目标。
          : program.smartTarget === 'input'
            ? pending.inputTarget
            : (pending.triggerTarget ?? undefined);
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
