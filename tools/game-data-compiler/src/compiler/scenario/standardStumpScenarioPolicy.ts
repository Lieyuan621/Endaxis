/**
 * 固定木桩场景允许省略的 Buff 事件。
 * 这里只描述场景中可证明不会发生的事实；公共 Buff 解析和投影仍保持严格，不全局吞掉事件。
 * 击倒前后事件会触发干员天赋，不属于敌人主动动作，不能在这里省略。
 * 起身动画/恢复行动不是根击倒的前置条件；标签计时是否保留须按具体读者及目标归属审计。
 */
const OMITTED_CASTER_BUFF_ABILITY_EVENT_REASONS: Readonly<Record<string, string>> = {
  OnCharBeforeTakeSpellInfliction:
    'the fixed passive-enemy scenario has no incoming operator spell-infliction source or external marker',
  OnOwnerHpZero:
    'operator HP cannot reach zero without player damage in the fixed passive-enemy scenario',
  OnOwnerDead:
    'operator death cannot occur without player damage in the fixed passive-enemy scenario',
  OnAfterKillEntity:
    'the unique fixed target has no post-defeat damage window, so kill responses cannot affect the simulation result',
  OnAfterCharacterTakeBlowOff:
    'the passive-enemy scenario cannot apply blow-off to an operator without an explicit external event marker',
};

const OMITTED_ENEMY_BUFF_ABILITY_EVENT_REASONS: Readonly<Record<string, string>> = {
  OnOutputBuff:
    'the fixed passive enemy cannot output a Buff without enemy active behavior or an explicit external event marker',
  OnOwnerHpZero:
    'the unique fixed target reaching zero HP ends the simulation before post-defeat behavior matters',
  OnOwnerDead:
    'the unique fixed target dying ends the simulation before post-defeat behavior matters',
};

export function standardStumpBuffAbilityEventOmissionReason(
  event: string | number,
  owner?: 'caster' | 'enemy' | 'currentAbilityEntity',
): string | null {
  if (event === 'OnTrulyExitFight')
    return 'fixed timeline does not leave combat before the simulation ends';
  if (typeof event !== 'string') return null;
  if (owner === 'caster') return OMITTED_CASTER_BUFF_ABILITY_EVENT_REASONS[event] ?? null;
  if (owner === 'enemy') return OMITTED_ENEMY_BUFF_ABILITY_EVENT_REASONS[event] ?? null;
  return null;
}

/** 固定木桩初始满血时严格求值原生生命比例比较。 */
export function evaluateStandardStumpFullHealthComparison(
  comparison: string,
  value: number,
): boolean {
  switch (comparison) {
    case 'GE':
      return 1 >= value;
    case 'GT':
      return 1 > value;
    case 'LE':
      return 1 <= value;
    case 'LT':
      return 1 < value;
    case 'EQ':
      return 1 === value;
    case 'NE':
      return 1 !== value;
    default:
      throw new Error(`unsupported current HP ratio comparison ${JSON.stringify(comparison)}`);
  }
}
