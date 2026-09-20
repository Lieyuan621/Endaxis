import type { OperatorPassiveUiDefinition } from '../../../../../packages/game-data-contract/src/operators.ts';
import type { OperatorDefinition } from '../../../../../packages/game-data-contract/src/operators.ts';
import {
  compileOperatorPassiveUiPrefabComponent,
  type OperatorPassiveUiPrefabComponentEvidence,
} from './passiveUiPrefab.ts';
import { OPERATOR_PASSIVE_UI_COMPONENT_BY_PREFAB } from '../../source/operatorPassiveUiPrefabCatalog.generated.ts';

/**
 * 1.4.4 原生 prefab 中专用 UICharPassive 组件的窄字段投影。几何和动画不混入这里；
 * 后续资源导出入口会从同一 prefab 快照重新生成这份证据。
 * 未知非空 prefab 必须阻断生成，避免把遗留资源或视觉命名猜成行为。
 */
export function compileOperatorPassiveUiDefinition(
  prefabName: string,
  sourcePath: string,
): OperatorPassiveUiDefinition | undefined {
  if (prefabName === '') return undefined;
  const evidence = (
    OPERATOR_PASSIVE_UI_COMPONENT_BY_PREFAB as Readonly<
      Record<string, OperatorPassiveUiPrefabComponentEvidence>
    >
  )[prefabName];
  if (evidence === undefined) {
    throw new Error(`${sourcePath}: unsupported character passive UI prefab '${prefabName}'`);
  }
  return compileOperatorPassiveUiPrefabComponent(evidence, sourcePath);
}

/** 产品补充的实体数量指示器，经同一干员生成流程发布。 */
export function compileOperatorProductPassiveUi(
  source: unknown,
  entities: NonNullable<OperatorDefinition['abilityEntityDefinitions']>,
): OperatorPassiveUiDefinition | undefined {
  if (source === undefined) return undefined;
  if (source === null || typeof source !== 'object' || Array.isArray(source))
    throw new Error('passiveUi: expected a component configuration');
  const value = source as Record<string, unknown>;
  if (value.kind !== 'abilityEntityCount') throw new Error('passiveUi: unknown product component');
  const keys = ['kind', 'abilityEntityId', 'icon', 'nameKey'];
  if (Object.keys(value).some(key => !keys.includes(key)))
    throw new Error('passiveUi: unknown component field');
  const read = (key: string) => {
    const id = value[key];
    if (typeof id !== 'string' || !id.trim())
      throw new Error(`passiveUi.${key}: expected a non-empty string`);
    return id;
  };
  const abilityEntityId = read('abilityEntityId');
  if (!entities[abilityEntityId]) throw new Error('passiveUi: unknown ability entity');
  return {
    kind: 'abilityEntityCount',
    abilityEntityId,
    icon: read('icon'),
    nameKey: read('nameKey'),
  };
}
