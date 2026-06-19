import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Rhodagn the Bonekrushing Fist',
  gameId: 'eny_0051_rodin',
  avatar: '/Icon_Enemy/eny_0051_rodin.webp',
  category: '裂地者',
  tier: 'boss',
  levelHp: {
    1: 3461,
    20: 24839,
    40: 157171,
    60: 618759,
    80: 1488392,
    90: 2292909,
  },
  def: 100,
  resistance: { physical: 0, cryo: 0, electric: 0, nature: 0, heat: 0 },
  maxStagger: 280,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 10,
  finisherRecovery: 100,
};

export default sheet;
