import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OperatorPassiveUiPrefabComponentEvidence } from './operatorPassiveUiPrefabEvidence.ts';

interface SnapshotHeader {
  readonly name?: unknown;
}

interface UnityObjectSnapshot {
  readonly $animestudio?: SnapshotHeader;
  readonly m_Name?: unknown;
  readonly m_Transform?: {
    readonly m_Father?: { readonly m_PathID?: unknown };
  };
  readonly fullCount?: unknown;
  readonly activeCount?: unknown;
  readonly layerImages?: unknown;
  readonly states?: unknown;
  readonly normalBuffId?: unknown;
  readonly ultimateBuffId?: unknown;
  readonly arrowBuffId?: unknown;
  readonly arrowBuffIdBattle?: unknown;
  readonly pointBuffId?: unknown;
  readonly arrows?: unknown;
  readonly points?: unknown;
}

const SUPPORTED_COMPONENTS = new Set([
  'UICharPassiveMultiStates',
  'UICharPassiveCounter',
  'UICharPassiveZhuangfy',
  'UICharPassiveLizhiyan',
  'UICharPassiveLiino',
  'UICharPassiveTyphoea',
]);

function readSnapshotFiles(directory: string): UnityObjectSnapshot[] {
  const result: UnityObjectSnapshot[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...readSnapshotFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      result.push(JSON.parse(readFileSync(path, 'utf8')) as UnityObjectSnapshot);
    }
  }
  return result;
}

function requireNumber(value: unknown, sourcePath: string): number {
  if (typeof value !== 'number') throw new Error(`${sourcePath}: expected number`);
  return value;
}

function requireString(value: unknown, sourcePath: string): string {
  if (typeof value !== 'string' || value === '') throw new Error(`${sourcePath}: expected string`);
  return value;
}

function stateCounts(value: unknown, sourcePath: string): number[] {
  if (!Array.isArray(value)) throw new Error(`${sourcePath}: expected state array`);
  return value.map((state, index) => {
    if (typeof state !== 'object' || state === null || !('count' in state)) {
      throw new Error(`${sourcePath}[${index}]: expected count`);
    }
    return requireNumber(state.count, `${sourcePath}[${index}].count`);
  });
}

/** 从一个 prefab 的对象快照中只提取专用 UICharPassive 组件的窄语义字段。 */
export function projectOperatorPassiveUiPrefabSnapshots(
  prefabDirectory: string,
): readonly [string, OperatorPassiveUiPrefabComponentEvidence] {
  const gameObjects = readSnapshotFiles(join(prefabDirectory, 'GameObject'));
  const roots = gameObjects.filter(
    value => value.m_Transform?.m_Father?.m_PathID === 0 && typeof value.m_Name === 'string',
  );
  if (roots.length !== 1) {
    throw new Error(`${prefabDirectory}: expected one root GameObject, received ${roots.length}`);
  }
  const prefabName = roots[0]!.m_Name as string;

  const components = readSnapshotFiles(join(prefabDirectory, 'MonoBehaviour')).filter(value =>
    SUPPORTED_COMPONENTS.has(String(value.$animestudio?.name ?? '')),
  );
  if (components.length !== 1) {
    throw new Error(`${prefabDirectory}: expected one supported UICharPassive component`);
  }
  const component = components[0]!;
  const componentType = String(component.$animestudio?.name ?? '');
  const sourcePath = `${prefabDirectory}.${componentType}`;

  switch (componentType) {
    case 'UICharPassiveMultiStates':
      return [
        prefabName,
        {
          componentType,
          fullCount: requireNumber(component.fullCount, `${sourcePath}.fullCount`),
          stateCounts: stateCounts(component.states, `${sourcePath}.states`),
        },
      ];
    case 'UICharPassiveCounter':
      if (!Array.isArray(component.layerImages)) {
        throw new Error(`${sourcePath}.layerImages: expected array`);
      }
      return [
        prefabName,
        {
          componentType,
          layerCount: component.layerImages.length,
          activeCount: requireNumber(component.activeCount, `${sourcePath}.activeCount`),
        },
      ];
    case 'UICharPassiveZhuangfy':
    case 'UICharPassiveLizhiyan':
      return [
        prefabName,
        {
          componentType,
          fullCount: requireNumber(component.fullCount, `${sourcePath}.fullCount`),
          stateCounts: stateCounts(component.states, `${sourcePath}.states`),
        },
      ];
    case 'UICharPassiveLiino':
      return [
        prefabName,
        {
          componentType,
          normalBuffId: requireString(component.normalBuffId, `${sourcePath}.normalBuffId`),
          ultimateBuffId: requireString(component.ultimateBuffId, `${sourcePath}.ultimateBuffId`),
        },
      ];
    case 'UICharPassiveTyphoea':
      if (!Array.isArray(component.arrows) || !Array.isArray(component.points)) {
        throw new Error(`${sourcePath}: expected arrows and points arrays`);
      }
      return [
        prefabName,
        {
          componentType,
          arrowBuffId: requireString(component.arrowBuffId, `${sourcePath}.arrowBuffId`),
          battleArrowBuffId: requireString(
            component.arrowBuffIdBattle,
            `${sourcePath}.arrowBuffIdBattle`,
          ),
          pointBuffId: requireString(component.pointBuffId, `${sourcePath}.pointBuffId`),
          arrowCount: component.arrows.length,
          pointCount: component.points.length,
        },
      ];
    default:
      throw new Error(`${sourcePath}: unsupported passive UI component`);
  }
}

export function projectOperatorPassiveUiSnapshotRoot(
  snapshotRoot: string,
): Readonly<Record<string, OperatorPassiveUiPrefabComponentEvidence>> {
  return Object.fromEntries(
    readdirSync(snapshotRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => projectOperatorPassiveUiPrefabSnapshots(join(snapshotRoot, entry.name)))
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function renderOperatorPassiveUiPrefabCatalog(
  catalog: Readonly<Record<string, OperatorPassiveUiPrefabComponentEvidence>>,
): string {
  return `// 此文件由 generateOperatorPassiveUiPrefabCatalog.ts 从原生 prefab 对象快照生成，请勿手改。\n\nimport type { OperatorPassiveUiPrefabComponentEvidence } from './operatorPassiveUiPrefabEvidence.ts';\n\nexport const OPERATOR_PASSIVE_UI_COMPONENT_BY_PREFAB = ${JSON.stringify(catalog, null, 2)} as const satisfies Readonly<Record<string, OperatorPassiveUiPrefabComponentEvidence>>;\n`;
}
