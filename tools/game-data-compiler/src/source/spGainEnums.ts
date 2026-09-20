import type {
  SpGainKind,
  SpGainSource,
} from '../../../../packages/game-data-contract/src/primitives.ts';

/** GainAtb 的生产参数与 CheckObtainAtbType 的条件参数必须使用同一映射。 */
export function projectSpGainSource(value: unknown, path: string): SpGainSource {
  switch (value) {
    case 'Default':
      return 'default';
    case 'NormalAttack':
      return 'normalAttack';
    case 'PowerAttack':
      return 'powerAttack';
    case 'Skill':
      return 'skill';
    default:
      throw new Error(`${path}: unsupported GainAtbType ${JSON.stringify(value)}`);
  }
}

export function projectSpGainKind(value: unknown, path: string): SpGainKind {
  switch (value) {
    case 'Gain':
      return 'gain';
    case 'Return':
      return 'refund';
    default:
      throw new Error(`${path}: unsupported GainAtbMethod ${JSON.stringify(value)}`);
  }
}
