import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Wgthorns',
  gameId: 'eny_0088_wgthorns',
  avatar: '/Icon_Enemy/eny_0088_wgthorns.webp',
  category: '天使',
  tier: 'normal',

  levelHp: {
    1: 152,
    20: 1093,
    40: 6916,
    60: 27225,
    80: 65489,
    90: 100888,
  },

  def: 100,

  resistance: {
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 20,
    nature: 0,
  },
  superArmor: 0,

  maxStagger: 60,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
