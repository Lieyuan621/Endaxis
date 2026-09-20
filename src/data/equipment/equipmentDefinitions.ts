/** 武器、单件装备和套装的正式目录，全部由同批游戏数据生成产物装配。 */
import type { GearDefinition, GearSetDefinition } from '../../core/game-data/equipmentDefinition';
import { generatedGearDefinitions } from './generated/index.generated';
import { generatedGearSetDefinitions } from './generated-gear-sets/index.generated';
import { weaponDefinitions } from './weaponDefinitions';

export interface EquipmentSupport {
  readonly sourceKind: 'weapon' | 'gear' | 'gearSet';
  readonly slug: string;
  readonly completeness: 'complete' | 'partial';
  readonly issues: readonly {
    readonly sourceKind: string;
    readonly path: string;
    readonly message: string;
  }[];
}

export { weaponDefinitions };
export const gearDefinitions: readonly GearDefinition[] = Object.freeze([
  ...generatedGearDefinitions,
]);
export const gearSetDefinitions: readonly GearSetDefinition[] = Object.freeze([
  ...generatedGearSetDefinitions,
]);

/** 当前生成目录不存在旧模板适配诊断；生成器自己的证据诊断在重建报告中审计。 */
export const equipmentAdaptationIssues = Object.freeze([]) as readonly never[];

const supportByIdentity = new Map<string, EquipmentSupport>(
  [
    ...weaponDefinitions.map(definition => ({ sourceKind: 'weapon' as const, definition })),
    ...generatedGearDefinitions.map(definition => ({ sourceKind: 'gear' as const, definition })),
    ...generatedGearSetDefinitions.map(definition => ({
      sourceKind: 'gearSet' as const,
      definition,
    })),
  ].map(({ sourceKind, definition }) => [
    `${sourceKind}:${definition.slug}`,
    Object.freeze({
      sourceKind,
      slug: definition.slug,
      completeness: 'complete' as const,
      issues: Object.freeze([]),
    }),
  ]),
);

export function getEquipmentSupport(
  sourceKind: EquipmentSupport['sourceKind'],
  slug: string,
): EquipmentSupport | null {
  return supportByIdentity.get(`${sourceKind}:${slug}`) ?? null;
}
