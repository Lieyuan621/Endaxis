/** 可编辑动作图。节点共享定义，不共享执行实例或黑板；next 仅表示同步顺序。 */
import type { CombatStepForKind, CombatStepKind } from './actions.ts';
import type { ActionValueOperand, CombatCondition } from './conditions.ts';

export interface ActionGraphReference {
  /** null 表示空序列；不得省略一个显式存在的空分支。 */
  readonly $sequence: string | null;
}

/** 子程序显式使用图引用；作用域省略身份时由调用位置绑定。 */
export type ActionGraphStepForKind<K extends CombatStepKind> = {
  [Kind in K]: Kind extends 'once' | 'withActionBlackboardScope'
    ? Omit<CombatStepForKind<Kind>, 'parameters'> & {
        readonly parameters: Omit<CombatStepForKind<Kind>['parameters'], 'scopeKey'> & {
          readonly scopeKey?: string;
        };
      }
    : CombatStepForKind<Kind>;
}[K];

/** 调用同一定义内的宏。内部节点由宏图保存，调用点仍有独立执行状态。 */
export interface ActionGraphMacroCall {
  readonly kind: 'callMacro';
  readonly macroId: string;
  readonly key?: never;
  /** 调用点实参；键集合必须与目标宏声明的 parameters 完全一致，值不允许再含 parameter 操作数。 */
  readonly arguments?: Readonly<Record<string, ActionValueOperand>>;
  /**
   * 提取中间段时保留原节点身份：键为宏内节点 ID，值为调用方图中的原节点 ID。
   * 必须覆盖宏的全部节点且值不能重复；原节点已移入宏，不要求仍在调用方图中。
   * 这类调用按原顺序直接执行宏内步骤，不增加动作层级或改变伤害、随机与生命周期身份。
   */
  readonly nodeBindings?: Readonly<Record<string, string>>;
}

/** 调用另一个完整资源的入口；它不是本资源的宏，也不共享节点命名空间。 */
export interface ActionGraphResourceCall {
  readonly kind: 'callResource';
  readonly key?: never;
  readonly resource: {
    /** 被调用的原生资源 ID。 */
    readonly id: string;
    readonly actionGraph: ActionGraphResourceDefinition;
    readonly entry: ActionGraphReference;
  };
}

export type ActionGraphStep =
  ActionGraphStepForKind<CombatStepKind> | ActionGraphMacroCall | ActionGraphResourceCall;

export interface ActionGraphNode {
  readonly action: ActionGraphStep;
  readonly next: string | null;
}
export interface ActionGraphDefinition {
  readonly nodes: Readonly<Record<string, ActionGraphNode>>;
  /** 数据节点与动作节点各自登记；引用只能指向本图，表达式共享不等于结果共享。 */
  readonly dataNodes?: Readonly<Record<string, ActionGraphDataNode>>;
}

export type ActionGraphDataNode =
  | { readonly type: 'number'; readonly expression: ActionValueOperand }
  | { readonly type: 'boolean'; readonly expression: CombatCondition };

/** 宏接口和内部节点只保存在这里；主图中的调用节点只保存 macroId。 */
export interface ActionGraphMacroDefinition {
  /** 确定性顺序的形参名；省略表示无参数宏，体内禁止 parameter 操作数。 */
  readonly parameters?: readonly string[];
  readonly entry: ActionGraphReference;
  readonly graph: ActionGraphDefinition;
}

/** 一个技能、Buff 或能力实体的完整程序，不包含其他定义的节点。 */
export interface ActionGraphResourceDefinition {
  readonly main: ActionGraphDefinition;
  readonly macros: Readonly<Record<string, ActionGraphMacroDefinition>>;
}
