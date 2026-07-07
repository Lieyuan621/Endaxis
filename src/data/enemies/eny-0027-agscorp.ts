import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
    name: 'Agscorp',
    gameId: 'eny_0027_agscorp',
    avatar: '/Icon_Enemy/eny_0027_agscorp.webp',
    category: '天使',
    tier: 'advanced',

    levelHp: {
        1: 734,
        20: 5266,
        40: 33320,
        60: 131177,
        80: 315539,
        90: 486097,
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

    maxStagger: 140,
    staggerNodeCount: 0,
    staggerNodeDuration: 2,
    staggerBreakDuration: 7,
    finisherRecovery: 35,
};

export default sheet;
