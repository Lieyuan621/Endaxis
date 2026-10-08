/** 武器、单件装备和套装的正式目录，全部由同批游戏数据生成产物装配。 */
import type { GearDefinition } from '../../core/game-data/equipmentDefinition';
import { generatedGearDefinitions } from './generated/index.generated';
import { generatedGearSetDefinitions } from './generated-gear-sets/index.generated';
import { weaponDefinitions } from './weaponDefinitions';

export { weaponDefinitions };
export const gearDefinitions: readonly GearDefinition[] = Object.freeze([
  ...generatedGearDefinitions,
]);
export const gearSetDefinitions = Object.freeze([...generatedGearSetDefinitions]);
