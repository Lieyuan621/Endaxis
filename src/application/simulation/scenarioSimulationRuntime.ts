/** 标准战斗模拟共用的装配、帧推进和不可变结果收集。 */
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import type { CombatReceiptView } from '../../core/combat/receipt/combatReceiptHistory';
import {
  CombatResources,
  type CombatResourceSnapshot,
} from '../../core/combat/resources/combatResources';
import {
  CombatRuntimeAssembly,
  type CombatEnemyProgram,
} from '../../core/combat/runtime/combatRuntimeAssembly';
import {
  projectResourceCurvesFromReceipt,
  type CombatResourceCurves,
} from '../../core/projection/resourceCurves';
import type { ResolvedOperatorPanel } from '../../core/compiler/resolveOperatorPanel';
import type { CombatRuntimeAssemblyOptions } from '../../core/combat/runtime/combatRuntimeAssembly';
import type { CombatStateGraph } from '../../core/combat/state/combatState';

export interface ScenarioSimulationResult {
  readonly frame: number;
  /** 本次模拟实际交给操作执行器的敌人静态输入。 */
  readonly enemy: CombatEnemyProgram;
  /** 与本次战斗输入完全一致的静态面板，不写回存档。 */
  readonly operatorPanels: readonly ResolvedOperatorPanel[];
  /** 模拟推进前的资源基线，供曲线、诊断和 UI 使用同一初始状态。 */
  readonly initialResources: CombatResourceSnapshot;
  /** 本次发布对应的固定回执历史；查询和详情应优先使用该视图。 */
  readonly receiptHistory: CombatReceiptView;
  /** 尚未迁移的数组消费者使用的缓存适配；新代码不要据此再建序号索引。 */
  readonly receiptEntries: readonly CombatReceiptEntry[];
  /** 由正式回执投影端口生成的稀疏资源曲线，应用层不重复解释事件。 */
  readonly resourceCurves: CombatResourceCurves;
  readonly finalResources: CombatResourceSnapshot;
}

function freezeResourceCurves(curves: CombatResourceCurves): CombatResourceCurves {
  return Object.freeze({
    sp: Object.freeze({
      ...curves.sp,
      points: Object.freeze(curves.sp.points.map(point => Object.freeze({ ...point }))),
    }),
    ultimateEnergy: Object.freeze(
      curves.ultimateEnergy.map(curve =>
        Object.freeze({
          ...curve,
          points: Object.freeze(curve.points.map(point => Object.freeze({ ...point }))),
        }),
      ),
    ),
  });
}

/** 为一次性执行与检查点会话创建同一种正式装配。 */
export function createCompiledScenarioRuntime(
  compiled: CombatRuntimeAssemblyOptions,
): CombatRuntimeAssembly {
  return new CombatRuntimeAssembly(compiled);
}

/** 推进到实际战斗帧；恢复分支也必须通过同一完整帧入口继续。 */
export function advanceCombatRuntimeToFrame(
  assembly: CombatRuntimeAssembly,
  endFrame: number,
): void {
  if (!Number.isInteger(endFrame) || endFrame < assembly.clock.frame) {
    throw new RangeError('endFrame must be an integer at or after the current combat frame');
  }
  while (assembly.clock.frame < endFrame) assembly.advanceFrame();
}

/** 直接从会话复制出的纯数据图投影结果，结果收集无需取得活动装配对象。 */
export function collectCombatStateGraphResult(
  graph: CombatStateGraph,
  compiled: CombatRuntimeAssemblyOptions,
  history: CombatReceiptView,
): ScenarioSimulationResult {
  const operatorPanels = compiled.operators.flatMap(operator =>
    operator.panel === undefined ? [] : [operator.panel],
  );
  // 装配构造时会立即执行 initialFrame 上的输入。曲线基线必须取编译结果中的
  // 战斗初始资源，而不能取已经可能被准备期技能修改过的运行时快照。
  const initialResources = new CombatResources(compiled.resources).snapshot();
  const receiptEntries = history.toArray();
  const finalResources = new CombatResources(
    compiled.resources,
    {},
    graph.shared.resources,
  ).snapshot();

  return Object.freeze({
    frame: graph.shared.clock.frame,
    enemy: compiled.enemy,
    operatorPanels,
    initialResources,
    finalResources,
    receiptHistory: history,
    // 脱离收集器并冻结，避免调用方改写本次模拟已经发生的事实。
    receiptEntries,
    resourceCurves: freezeResourceCurves(
      projectResourceCurvesFromReceipt(
        initialResources,
        receiptEntries,
        compiled.initialFrame ?? 0,
      ),
    ),
  });
}
