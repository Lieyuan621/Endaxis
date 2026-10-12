import type { SkillType } from '../../../../../packages/game-data-contract/src/primitives.ts';

/** 发布时省略默认名称；生成器不参与运行时资源 URL 的解析。 */
export function defaultOperatorSkillIconName(skillType: SkillType): string | undefined {
  switch (skillType) {
    case 'battleSkill':
      return 'battle 01';
    case 'comboSkill':
      return 'combo 01';
    case 'ultimate':
      return 'ultimate 01';
    default:
      return undefined;
  }
}

/** 公共武器图标由显示层按武器类型选择，只有专属图标文件名进入定义。 */
export function operatorSkillIconName(iconId: string): string | undefined {
  if (!/^[A-Za-z0-9_-]+$/.test(iconId)) throw new Error(`invalid operator skill icon: ${iconId}`);
  if (iconId === 's' || iconId.startsWith('icon_attack_')) return undefined;
  const native = /^icon_(?:(combo|ultimate)_)?skill_.+_(\d+)$/.exec(iconId);
  if (!native) return iconId;
  return `${native[1] ?? 'battle'} ${native[2]!.padStart(2, '0')}`;
}
