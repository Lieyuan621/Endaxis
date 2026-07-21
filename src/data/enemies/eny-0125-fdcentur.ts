import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Alleikhreos, Chiliarch',
  gameId: 'eny_0125_fdcentur',
  avatar: '/Icon_Enemy/eny_0125_fdcentur.webp',
  category: '造裔',
  tier: 'leader',
  levelHp: {
    1: 3738,
    20: 26826,
    40: 169745,
    60: 668260,
    80: 1607463,
    90: 2476341,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 20,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 320,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 11,
  finisherRecovery: 100,
};

export default sheet;
