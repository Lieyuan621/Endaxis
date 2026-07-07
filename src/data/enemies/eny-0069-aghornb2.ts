import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
    name: 'Aghornb2',
    gameId: 'eny_0069_aghornb2',
    avatar: '/Icon_Enemy/eny_0069_aghornb2.webp',
    category: '天使',
    tier: 'advanced',

    levelHp: {
        1: 1246,
        20: 8942,
        40: 56582,
        60: 222753,
        80: 535821,
        90: 825447,
    },

    def: 100,

    resistance: {
        physical: 20,
        heat: 20,
        cryo: 0,
        electric: 0,
        nature: 20,
    },
    superArmor: 30,

    maxStagger: 200,
    staggerNodeCount: 0,
    staggerNodeDuration: 2,
    staggerBreakDuration: 7.5,
    finisherRecovery: 35,
};

export default sheet;
