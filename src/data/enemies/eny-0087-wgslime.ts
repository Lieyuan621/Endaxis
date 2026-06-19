import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
    name: 'Wgslime',
    gameId: 'eny_0087_wgslime',
    avatar: '/Icon_Enemy/eny_0087_wgslime.webp',
    category: '天使',
    tier: 'normal',

    levelHp: {
        1: 180,
        20: 1292,
        40: 8173,
        60: 32175,
        80: 77396,
        90: 119231,
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
