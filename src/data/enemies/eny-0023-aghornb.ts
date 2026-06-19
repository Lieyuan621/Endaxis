import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
    name: 'Aghornb',
    gameId: 'eny_0023_aghornb',
    avatar: '/Icon_Enemy/eny_0023_aghornb.webp',
    category: '天使',
    tier: 'advanced',

    levelHp: {
        1: 831,
        20: 5961,
        40: 37721,
        60: 148502,
        80: 357214,
        90: 550298,
    },

    def: 100,

    resistance: {
        physical: 20,
        heat: 20,
        cryo: 0,
        electric: 0,
        nature: 20,
    },
    superArmor: 20,

    maxStagger: 160,
    staggerNodeCount: 0,
    staggerNodeDuration: 2,
    staggerBreakDuration: 7,
    finisherRecovery: 35,
};

export default sheet;
