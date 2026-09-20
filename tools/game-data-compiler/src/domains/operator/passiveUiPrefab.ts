import type { OperatorPassiveUiDefinition } from '../../../../../packages/game-data-contract/src/operators.ts';
import type { OperatorPassiveUiPrefabComponentEvidence } from '../../source/operatorPassiveUiPrefabEvidence.ts';

export type { OperatorPassiveUiPrefabComponentEvidence } from '../../source/operatorPassiveUiPrefabEvidence.ts';

function requirePositiveInteger(value: number, sourcePath: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${sourcePath}: expected a positive integer, received ${String(value)}`);
  }
  return value;
}

function requireStateBounds(
  stateCounts: readonly number[],
  maximum: number,
  sourcePath: string,
): void {
  if (
    stateCounts.length < 2 ||
    stateCounts[0] !== 0 ||
    stateCounts.at(-1) !== maximum ||
    stateCounts.some(
      (value, index) =>
        !Number.isInteger(value) ||
        value < 0 ||
        value > maximum ||
        (index > 0 && value <= stateCounts[index - 1]!),
    )
  ) {
    throw new Error(
      `${sourcePath}: passive UI state counts must be strictly increasing from 0 to ${maximum}`,
    );
  }
}

function requireBuffId(value: string, sourcePath: string): string {
  if (!value.startsWith('buff_')) {
    throw new Error(`${sourcePath}: expected a readable Buff ID, received '${value}'`);
  }
  return value;
}

/**
 * 将专属 HUD prefab 的窄组件配置投影成模拟契约。
 *
 * 这里故意不读取 RectTransform、UIImage、动画或材质：这些字段属于展示配方；只有专用
 * UICharPassive 组件中明确声明的计数边界、状态阈值和 Buff 身份能进入模拟数据。未知组件
 * 必须阻断转换，不能按 prefab 名称相似度猜测。
 */
export function compileOperatorPassiveUiPrefabComponent(
  evidence: OperatorPassiveUiPrefabComponentEvidence,
  sourcePath: string,
): OperatorPassiveUiDefinition {
  switch (evidence.componentType) {
    case 'UICharPassiveMultiStates': {
      const maximum = requirePositiveInteger(evidence.fullCount, `${sourcePath}.fullCount`);
      requireStateBounds(evidence.stateCounts, maximum, `${sourcePath}.states`);
      return { kind: 'numeric', appearance: 'tangtangDroplets', maximum };
    }
    case 'UICharPassiveCounter': {
      const maximum = requirePositiveInteger(evidence.layerCount, `${sourcePath}.layerImages`);
      const activeAt = requirePositiveInteger(evidence.activeCount, `${sourcePath}.activeCount`);
      if (activeAt > maximum) {
        throw new Error(`${sourcePath}.activeCount: ${activeAt} exceeds layer count ${maximum}`);
      }
      return { kind: 'numeric', appearance: 'laevatainCounter', maximum, activeAt };
    }
    case 'UICharPassiveZhuangfy': {
      const maximum = requirePositiveInteger(evidence.fullCount, `${sourcePath}.fullCount`);
      requireStateBounds(evidence.stateCounts, maximum, `${sourcePath}.states`);
      return {
        kind: 'numeric',
        appearance: 'zhuangFangyiThunder',
        maximum,
        activeAt: maximum,
      };
    }
    case 'UICharPassiveLizhiyan': {
      const maximum = requirePositiveInteger(evidence.fullCount, `${sourcePath}.fullCount`);
      requireStateBounds(evidence.stateCounts, maximum, `${sourcePath}.states`);
      return { kind: 'numeric', appearance: 'arcaneSigils', maximum };
    }
    case 'UICharPassiveLiino':
      return {
        kind: 'buffProgress',
        appearance: 'liinoMusic',
        normalBuffId: requireBuffId(evidence.normalBuffId, `${sourcePath}.normalBuffId`),
        ultimateBuffId: requireBuffId(evidence.ultimateBuffId, `${sourcePath}.ultimateBuffId`),
      };
    case 'UICharPassiveTyphoea':
      return {
        kind: 'buffCounters',
        appearance: 'typhoeaArrows',
        reserveArrowBuffId: requireBuffId(evidence.arrowBuffId, `${sourcePath}.arrowBuffId`),
        battleArrowBuffId: requireBuffId(
          evidence.battleArrowBuffId,
          `${sourcePath}.arrowBuffIdBattle`,
        ),
        pointBuffId: requireBuffId(evidence.pointBuffId, `${sourcePath}.pointBuffId`),
        maximumArrows: requirePositiveInteger(evidence.arrowCount, `${sourcePath}.arrows`),
        maximumPoints: requirePositiveInteger(evidence.pointCount, `${sourcePath}.points`),
      };
  }
}
