import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
    name: 'Agmelee',
    gameId: 'eny_0021_agmelee',
    avatar: '/Icon_Enemy/eny_0021_agmelee.webp',
    category: '天使',
    tier: 'normal',
    levelHp: {
        1: 138,
        20: 994,
        40: 6287,
        60: 24750,
        80: 59536,
        90: 91716,
    },
    def: 100,
    resistance: {
        physical: 0,
        heat: 0,
        cryo: 0,
        electric: 0,
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
