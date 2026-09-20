import { generatedWeaponDefinitions } from './generated-weapons/index.generated';

/** 武器以游戏原生 wpn_* ID 为 slug；展示名和资源身份不能改写定义身份。 */
export const weaponDefinitions = Object.freeze([...generatedWeaponDefinitions]);
