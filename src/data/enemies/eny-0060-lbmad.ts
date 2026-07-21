import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Hazefyre Claw',
  gameId: 'eny_0060_lbmad',
  avatar: '/Icon_Enemy/eny_0060_lbmad.webp',
  category: '裂地者',
  tier: 'normal',
  levelHp: {
    1: 249,
    20: 1788,
    40: 11316,
    60: 44551,
    80: 107164,
    90: 165089,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 20,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 0,
  maxStagger: 100,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
