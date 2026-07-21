import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Mudflow δ',
  gameId: 'eny_0105_wgslime2',
  avatar: '/Icon_Enemy/eny_0105_wgslime2.webp',
  category: '天使',
  tier: 'normal',
  levelHp: {
    1: 291,
    20: 2086,
    40: 13202,
    60: 51976,
    80: 125025,
    90: 192604,
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
  maxStagger: 90,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
