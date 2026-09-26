import { collectNativeActionNodes, type NativeSequenceSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../actions/combatActionProjectionTypes.ts';
import type { ActionGraphBuilder } from '../actions/actionGraphBuilder.ts';

/**
 * 在末端行为和空分支过滤后检查剩余程序，而不是要求已删除分支的条件先有运行模型。
 * Next 保证攻击命中，方向/范围可以省略；角度一旦仍参与倍率、Buff 或有效守卫，就必须报错。
 * 调用方可传整份 SkillData，避免只检查一条调度序列而漏掉其他帧对中间值的读取。
 */
export function assertPresentationCalculationIsolation(
  sources: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
  programs: readonly CompiledBuffSequenceSource[],
  graph: ActionGraphBuilder<CompiledBuffStepSource>,
): void {
  const retained = JSON.stringify(
    programs.flatMap(program => graph.reachableActions(program)),
    (_property, value: unknown) => {
      if (value === null || typeof value !== 'object') return value;
      const row = value as Record<string, unknown>;
      if (row.kind !== 'modifyActionValue') return value;
      const parameters = row.parameters as Record<string, unknown>;
      if (parameters.operation !== 'assign') return value;
      // Assign 的目的键不是读取；保留赋值本身，仅在引用检查视图中排除目的键。
      // Add/Multiply 等仍读取原值，不能享受此豁免。右侧操作数继续递归检查。
      const { key: _destination, ...inputs } = parameters;
      return { ...row, parameters: inputs };
    },
  );
  for (const node of sources.flatMap(collectNativeActionNodes)) {
    if (
      !node.metadata.enabled ||
      node.body.kind !== 'leaf' ||
      node.body.value.family !== 'presentationCalculation'
    )
      continue;
    const keys =
      node.body.value.action.kind === 'saveCameraAngle'
        ? node.body.value.action.outputKeys
        : [node.body.value.action.outputKey];
    for (const key of keys) {
      // 完整字符串匹配是保守引用检查：未知嵌套载荷也不能绕过，不做跨作用域同名消歧。
      if (retained.includes(JSON.stringify(key))) {
        throw new Error(
          `${node.sourcePath}: presentation output ${key} reaches retained combat program`,
        );
      }
    }
  }
}
