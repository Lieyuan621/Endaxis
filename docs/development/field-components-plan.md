# 字段查看与编辑组件推进计划

> 状态：P0/P1/P3 与 P2 静态引用目录已完成非浏览器验收；P4 可编辑范围已收束，全部 structured 后备及历史 57 个 JSON 位置均有实际控件，保留 95 个真实图/资源/不可取值边界与 4 处有意只读条件。P2 无法证明 owner 的动态上下文仍显式未知；37 项实际浏览器断言未运行，发布/CI 状态须另行确认。P5 已完成正式字符串操作数的数据引脚闭环与非浏览器验收，范围和兼容策略见末尾记录。本文区分计划、历史记录与末尾最终收束，不把全部类型或运行时能力宣称为完成。稳定职责见[编辑器架构](../architecture/editor.md)。

## 目标与推进顺序

以 Unreal Engine 的 Blueprint + Details/Property Editor 为主要交互与架构参照：同一个有类型的值，既能在属性面板查看/编辑，也能在运行时契约允许时通过数据引脚输入。让相同语义的字段在资产定义、动作节点、数据节点、创建表单中保持一致，同时保持普通常量编辑简洁。

先修复“契约语义在生成和分派中丢失”，再补共享控件与引用解析，随后扩展运行时能力。不要按文本框数量逐个替换，也不要为了复用控件给所有字段接线。

建议的交付顺序：

1. P0：固定分类与可验收基线
2. P1：生成器保留语义，共享查看/编辑分派
3. P2：引用解析及选择器贯通两套表单
4. P3：复用数值/条件引脚，完成字符串操作数与黑板读写表单
5. P4：结构化复合字段、深层字段与条件入口
6. P5：按真实复用需求扩展字符串数据引脚

P2、P3 均依赖 P1；P4 中不涉及字符串数据流的工作可与 P3 并行；P5 依赖 P3 的字段能力和完整运行时设计，不阻塞前四阶段交付。各阶段单独形成可审查、可撤销的修改，不虚设工期。

## Unreal 参照与本项目的取舍

以下 UE 能力依据 Epic 官方文档；“Endaxis 落点”是本计划的设计判断，不代表项目已经实现，也不照搬引擎对象系统。

| UE 参照                                                                                                                                                                                                                                                                                                                                                     | Endaxis 落点与边界                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blueprint 区分执行引脚和带类型的数据引脚，连接需要兼容类型；从引脚拉出可筛选兼容节点。[Nodes](https://dev.epicgames.com/documentation/en-us/unreal-engine/nodes-in-unreal-engine)                                                                                                                                                                           | 控制流继续用 ActionGraphReference，数值/条件用现有数据图。新输入不能因为外形像引用便跨类型连接；本计划不自动引入 UE 的自动类型转换                                                                                                                 |
| K2 schema 单独提供引脚默认值编辑、验证以及 asset picker 判断。[K2 schema](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Editor/BlueprintGraph/UEdGraphSchema_K2)                                                                                                                                                                          | 对支持常量的未连接输入，提供内联 literal/picker；连接后展示来源，停止把内联值当活动输入。属性面板与引脚共享值控件和校验，不复制两份业务状态；没有合法缺省值时保持未完成，不凭空补零                                                                |
| Blueprint 有多种值与引用类型，包括 Object、Actor、Class，且可创建数组。[Blueprint Variables](https://dev.epicgames.com/documentation/unreal-engine/blueprint-variables-in-unreal-engine?lang=en-US)；asset/class picker 有类别过滤元数据。[Metadata Specifiers](https://dev.epicgames.com/documentation/unreal-engine/metadata-specifiers-in-unreal-engine) | 对象实例引用、资源资产身份、类型/类身份不能统称任意字符串。Endaxis 的 Skill/Buff 定义 ID 对应其自己的资源域，不冒充 UObject；只借鉴类型受限 picker、来源展示和跳转。静态 ID 本期默认用字段控件，是当前契约的范围选择，不是声称 UE 的引用不能走引脚 |
| Blueprint struct 可整体传值，也可 Split/Recombine，或用 Make/Break 操作。[Struct Variables](https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-struct-variables-in-unreal-engine)                                                                                                                                                        | 先保留 struct/tuple/array/record 的真实结构，Details 中递归编辑并允许收展；可连接叶子可按需暴露，不能把“展开表单”误当“拆分运行时 struct pin”。容器整体数据流与 Make/Break 需新的运行时支持，不纳入本次默认范围                                     |
| Details 区分类型级 customization 与对象/类级布局 customization，并允许未定制部分继续用默认编辑器。[Details Panel Customizations](https://dev.epicgames.com/documentation/en-us/unreal-engine/details-panel-customizations-in-unreal-engine)                                                                                                                 | 可复用的引用、LevelValues、TagQuery、曲线属于语义类型控件；资源面板只负责布局/分组/上下文。默认递归编辑器承担其余字段，不每个动作节点复制一套定制表单。复用既有 path、草稿、校验和命令作为属性访问边界，不照搬 Slate/PropertyHandle 类体系         |
| UE 的编辑器 metadata 不应成为游戏逻辑的数据来源。[Metadata Specifiers](https://dev.epicgames.com/documentation/unreal-engine/metadata-specifiers-in-unreal-engine)                                                                                                                                                                                          | 真正的值类型、引用目标与求值规则来自契约和运行时；标签、帮助、单位呈现、picker 过滤和面板布局属于编辑描述/上下文。metadata 可解释类型，不能把 plain string 变成可运行的动态表达式                                                                  |
| BlueprintReadOnly 与属性窗口的 Visible/Edit 系列规则分别约束不同访问途径。[Property Specifiers API](https://dev.epicgames.com/documentation/unreal-engine/API/Runtime/CoreUObject/UP)；局部变量具有自己的可见范围。[Blueprint Best Practices](https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-best-practices-in-unreal-engine)        | 分别建模可查看、可修改、可读取、可写入及作用域，而非一个 readonly 布尔包办。内置资产不能修改但应能跳转查看；黑板可读不等于可写。保持 Endaxis 的调用点/局部作用域分析，不套用 UE 的类实例或函数生命周期                                             |

由此确定三条验收原则：

1. 属性面板和图是同一类型系统的两种入口；类型控件负责值，宿主面板负责布局，应用层负责上下文和事务。
2. “允许连接”与“当前使用连线”分开。内联常量是常态，只有表达依赖或共享读取才需要拉线；复杂结构先有结构化属性编辑，不强迫生成一片线。
3. UE 的字符串、对象、struct 和容器引脚不能被当作 Endaxis 的现有能力。P3 复用原有 number/boolean 数据节点；P5 已为正式 ActionStringOperand 补充 string 全链路，普通字符串与资源身份仍不自动接线。未通过契约/编译/运行时验收的类型不开放引脚。

## 已知基线与限制

代码核对基线为 `9d838ee166949b3080acc74fa19cf751fa1fb4dc`。下列计数来自此前 `6da5a59f24ca9dadcd3b75f09db9d7ed648f0928` 的完整审计，作为排序依据；实施 P0 时重新确认差异，不将历史计数当作当前实时覆盖率。

- 429 个字符串编辑位置，来自 231 个去重源声明：定义 240、动作 160、数据 29。355 直接分派文本，74 按是否有候选选择引用控件；其中有合理的人类文字、身份声明及本地化键，并非全部待替换。
- 当前内置数据经过引脚、资源和图引用过滤后，57 个有值位置实际落入 JSON 编辑：18 个复合查询/联合、13 个资源列表、11 个标签集合、6 个动态操作数、5 个黑板映射、3 个时间结构、1 个曲线。频繁出现的 `applyBuff.buffId`、黑板映射和曲线优先，但实例次数不等于组件数量。
- 定义侧 233 个 opaque 分别为 139 个深度截止、50 个资源边界、34 个图边界、10 个无可取值字段；另有 11 个 condition 只读。不能把这些都变成 JSON 输入。
- 当前 `ActionGraphDataNode` 仅有 number/boolean；`valueNode`、`conditionNode` 已是正式图引用。`ActionStringOperand` 只有字符串字面量或 `{ blackboardKey }`，并无现成字符串数据节点。宏实参是 `ActionValueOperand`，不是任意类型的参数系统。
- 现有 object/array/record/union 递归表单、等级值组件、变量清单、图数据连接、命令和历史均应复用。`ReferenceResolver` 与共享语义分派是本计划拟增加的职责，不是已经存在的完整系统。

## 一、先分清字段语义与引脚资格

是否可连接由契约和运行时决定，是否显示为引脚由编辑上下文决定。不能通过字段名后缀、当前值的外形或控件偏好扩大领域模型。

| 类别                             | 查看态                                                    | 编辑态与引脚策略                                                                                                                         |
| -------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 普通文字、显示配置、原生开放编码 | 原值、必要的说明/预览；未知编码保留                       | 默认字段控件。没有封闭值域证据，不发明枚举；普通 string 不自动成为字符串引脚                                                             |
| 数字、布尔、等级值等静态常量     | 值、单位、等级/范围语义                                   | 默认内联。只有契约允许 `ActionValueOperand` / `CombatCondition` 的槽才显示相应连接能力，纯 number 不自动升格                             |
| 数值运行时输入                   | 常量，或读取来源/作用域与数据节点跳转                     | 使用现有 `ActionValueOperand` / `valueNode`；内联常量和连线是同一个输入的两种表达，不重复存两份活动值                                    |
| 条件运行时输入                   | 条件摘要、来源节点及图入口                                | 复用 `CombatCondition` / `conditionNode`；保留短路、顺序及副作用限制。`BuildCondition` 不能直接当作战斗条件引脚                          |
| 字符串运行时输入                 | 字面引用/文字，或“从动作黑板读取”的键与作用域             | P3 使用 `ActionStringOperand` 的现有两分支编辑；P5 才评估可持久化字符串数据连接。不能把 `{ blackboardKey }` 伪装成 number 的 `valueNode` |
| 编译/资源身份引用                | 名称 + 原始 ID + 资源族/拥有者/来源 + 跳转 + 失效状态     | 资源选择器/列表。静态 Skill/Buff/Entity 等身份不因可复用就升格成运行时值；允许动态 ID 的动作仅在已声明的 operand 槽中提供动态分支        |
| 身份声明                         | 唯一身份及只读/归属标识                                   | 创建时校验唯一性；已有受保护身份保持只读。声明与引用不共用“改名”的写入语义，不作为输入引脚                                               |
| 黑板数值读取                     | key、number、调用上下文/局部作用域、fallback 是否明确存在 | 复用 `kind: 'blackboard'` 和已有数值读取节点；显示作用域和遮蔽，支持在兼容数值输入创建读取并接线                                         |
| 黑板字符串读取                   | key、string、作用域；无法静态确定时提示                   | P3 使用 `ActionStringOperand.blackboardKey`；与数值读取共用目录和状态展示，不合并两种契约形状                                            |
| 黑板写目标、输出键、变量声明     | 写入/声明标识、键、类型、目标作用域                       | 语义选择器或创建变量流程；写目标不是读取所得的值，不能把读取节点接到 outputKey 等位置。动态寻址需单独需求与契约支持，本计划不引入        |
| 宏参数                           | 参数声明/读取/调用实参三者分清，定位宏接口                | 声明和 `macroId` 用字段控件；数值实参/读取复用现有参数及数值输入规则。调用点实参仍不得包含 parameter 操作数，不扩展字符串/布尔宏参数     |
| 执行图引用、独立资源边界         | 图入口、所属资源、空分支语义                              | `ActionGraphReference` 走控制流及导航，保持 `$sequence: null` 与缺省区别；不能接到普通数据输入，不能跨资源平铺节点命名空间               |
| 容器、查询、曲线、映射           | 结构摘要 + 可展开的类型化内容                             | 默认结构化容器，叶子按语义分派。只有契约声明的叶子可接线；不增加“任意对象/数组”万能引脚                                                  |

重要例子：`applyBuff.buffId` 的字面量用 Buff 选择器，动态分支选择字符串黑板键；黑板映射左侧是写目标，右侧按各自契约分别为字面量、读取源或数值操作数，不能共享一个无模式的 KeyPicker。

## 二、共享结构与边界

### 契约 → 生成描述 → 上下文 → 展示/编辑

- 领域身份和值约束归 `packages/game-data-contract`。优先复用已有 `GameplayTag`、操作数、条件与图引用；仅在确有跨边界语义时引入领域身份类型，不另造 GenericRef、另一套 ValueOperand 或图引用模型。
- 两个生成器保留同一份字段语义：引用族、值类型、读/写/声明用途、容器子槽与联合分支、可选性、说明、单位等已被证据支持的信息。先检查现有别名/符号/声明信息能否可靠保留；普通 `type X = string` 可能被 TypeChecker 展开，必须用代表性测试证明识别有效。
- 类型不足的旧 string 位置可保留明确的编辑配置，但以契约声明/精确路径及用途为依据，收束 `REFERENCE_FIELD_KIND` 的字段名猜测。UI 展示配置不复制运行时模型；资源候选、当前语言、只读权限归上下文，不写死在生成产物。
- 在现有 `DefinitionFieldSchema`、`NodeFieldSchema` 上共享必要的语义片段与分派逻辑；不强行把两套不同结构的 schema 全部合并。`resolveFieldEditor(schema, context)` 是拟议纯函数入口，同时给出查看呈现、编辑能力和明确的后备原因。
- 定义表单、节点检查器、`DefinitionValueCreator` 以及 optional/union/array/record 新建入口使用同一分派。保留现有递归容器，提取或复用叶子与复合控件；不在两个面板各写一份条件链。
- 查看态也消费语义：内置只读资产仍应有名称、原始值、来源与跳转。组件不能因不可编辑便只显示原始 JSON，也不能假装未求值的黑板读取已有当前运行值。

### ReferenceResolver 的应用层职责

输入至少包含资源族、owner、当前资源图/宏、调用点/黑板作用域、期望值类型、读写模式、项目及内置目录。图上下文缺失时明确报告，而不是按全项目候选猜测。

输出应区分：候选与稳定身份、显示名称/原始键、来源资产/owner、匹配状态（有效、失效、歧义、不可见、上下文未知），以及可用导航目标。候选状态与当前值状态分开，不能用 `choices.length` 判断字段是否仍为引用。

- 空目录：保持引用控件，说明暂无候选；只有契约允许声明/外部开放值时才提供明确的新建/外部输入路径。
- 失效旧值：原样显示并允许修复，不自动置空、不自动选择第一项；保存仍遵守领域校验，不能为了兼容静默接受非法值。
- 局部与公共同名：显示来源，使用真实查找优先级；无法证明唯一性时标注歧义。
- 动态黑板：复用 `graphBlackboard.ts` 的分析，区分已知越界与可能由外部调用提供的未知上下文；共享节点不假定唯一作用域。
- UI 不直接遍历全库，不自行复制解析规则。应用层使用现有资源目录和导航能力；编译/运行时保持自己的严格身份解析，共享可复用规则而非依赖 Vue。

### 编辑事务

控件产出类型化草稿/修改意图，由 `definitionDraftSession`、`skillGraphCommands`、`immutableGraphDocument` 等已有入口整体校验、应用与撤销。取消、失焦、切换节点或卸载不得留下半次修改。

连线替换与切回常量形成单次事务；拖线失败保留旧线。断线不凭空填零，也不缓存运行时读取结果为常量：可恢复明确保留的编辑草稿，或要求选择合法内联表达式。删除共享来源不能误删其他消费者；自动清理孤立节点应另有明确规则。

## 三、分阶段交付与验收

### P0：覆盖基线与分类决策（已验收，见首阶段记录）

**交付**：可维护的字段能力清单和小型代表性夹具。键按入口 + 路径 + 联合分支区分，记录源声明、语义类别、查看/编辑/连接能力、后备原因和负责阶段。源声明去重统计与展开位置统计分开。

**落点**：`tools/editor/` 生成器检查；现有审计结果作为输入，必要的稳定分类结论进入测试/能力清单，原始一次性报告不搬入仓库。核对最近提交相对审计基线的变化后再刷新分母。

**验收**：可说明每个 JSON/opaque/readonly 属于缺口还是刻意边界；57 个已观察 JSON 位置有去向，355 个文本位置无需一概处理。当前无值但可能暴露的 operand/optional 分支也有代表样本。

**不做**：重新全库“统计文本框”后直接认领全部为缺陷；仅根据字段名推断封闭枚举。

### P1：保留类型语义和统一分派（共享分派已实现；浏览器验收待补，依赖 P0）

**交付**：按 Details 的类型级控件/宿主布局分工，提供生成描述的公共语义部分、共享查看/编辑分派、两套表单适配层；首次接入保留原控件行为。

**落点**：`tools/editor/generateDefinitionSchemas.ts`、`generateActionNodeSchema.ts`；`src/ui/definition-editor/fieldSchema.ts`、`definitionFieldRuntime.ts`；`src/ui/action-graph/nodeSchema.ts`、`NodeInspectorFields.vue`。生成产物仅由正式命令生成。

**重点**：数组与 record 值槽保留语义；union 分支切换不丢 referenceKind；tuple 保留每槽类型与固定长度，不能继续取第一槽当同质数组；LevelValues 在定义侧也可被识别；description 进入既有帮助入口，不堆叠冗余文案。

**验收**：用少量包含 alias、union、tuple、optional、array/record 的契约夹具检验语义不丢失；相同语义在两套适配器分派一致；两个 schema 一致性检查通过，生成可重复且无手改产物。

**不做**：一口气添加所有领域控件；新建与既有契约平行的描述语言；为每个实例生成快照测试。

### P2：引用查看、选择与候选上下文（静态 owner 目录闭环已实现；剩余边界/浏览器待验，依赖 P1）

**交付**：应用层 ReferenceResolver，资源/身份/属性等引用控件及列表；资产定义和动作/数据检查器使用一致的来源展示与跳转。

**落点**：`src/ui/asset-workspace/AssetWorkspace.vue` 的候选组装，`fieldInputConfig.ts`、`DefinitionField.vue`、`DefinitionValueCreator.vue`、`ActionNodeInspector.vue`、`DataNodeInspector.vue` 与相关图面板的上下文供应。

**优先修复**：动作面板未传 choices；skillGroup 候选供应缺失；skillKeys 等静态引用分类遗漏；record 新建值未走引用控件；union 分支丢语义；空候选退文本。skillGroup 供应链问题不额外伪计为已观察到的编辑位置。

**验收**：局部/公共同名、空目录、失效旧值、删除后的悬空引用、跨 owner 候选、只读跳转；创建/optional 恢复/union 切换/数组与 record 增删均保持同一语义。候选更新不覆盖未提交草稿；非法引用提交失败并保留用户输入。

**不做**：把静态资源 ID 变成运行时引脚；自动修复歧义；新增非用户请求的资源改名级联操作。

### P3：操作数、黑板与已有引脚（核心入口与非浏览器验收已完成；浏览器待验）

**交付**：按 Blueprint typed pin + default literal 交互，提供数值/条件输入的统一查看与内联/连线编辑；`ActionStringOperand` 两分支控件；黑板读键、写目标、初值/复制映射组件；宏参数的类型化入口。

**落点**：`src/core/action-graph/actionGraphDataNodes.ts` 的输入投影、`graphBlackboard.ts`、`useGraphVariables.ts`、`BlackboardPanel.vue`、`graphCanvasView.ts`、两种节点检查器与既有图编辑命令。映射组件复用容器与叶子，不重新实现 JSON 编辑器。

**重点**：输入能力按 schema 与运行时支持明确暴露，不能只在已有实际值碰巧符合 expressionType 时才出现。可选输入未赋值时先选择合法表达式，再创建/接线，不创建虚构变量。`initialValues`、`entityInitialValues`、`copiedBlackboardAssignments`、`stringBlackboardAssignments` 按各自契约区分左右两侧。

**验收**：数值常量 ↔ 黑板读取/连线；布尔条件内联/连线；共享读取在不同上下文分别求值；明确 fallback 与缺省严格错误区分；宏参数只在合法位置出现。黑板读值与写目标不得接错，string 不能接 number/boolean。连接、断开、取消、撤销重做、保存重开都保留语义。

**不做**：字符串数据节点、任意类型宏参数、动态黑板写地址；变更执行时机、短路或求值缓存策略。

### P4：结构化复合字段与深层入口（P4.1 列表、P4.2 复合值已实现，其余推进中；引用叶子依赖 P2）

**交付**：将已分类 JSON 后备分批替换，按语义族验收后关闭条目。

1. 资源引用列表、GameplayTag 集合：复用 P2 与标签层级/搜索，保留空值、顺序和允许的重复语义，不盲目去重。
2. 时间曲线和周期参数：复用 `NodeLevelValues.vue` 能力并适配定义侧；曲线用 named/inline 分支、关键点表与预览，保留切线、权重、单位及排序约束，不把曲线简化成线性插值。
3. 判别联合/查询：如 Buff 查询、目标选择、相对/绝对属性、投射物 hit/finish。字段按分支结构组合；嵌套图入口导航到所属图，不能整体 JSON 写入绕过图规则。
4. 深层字段：对 131 个 depth 截止位置及 8 个递归边界按真实类型递归/延迟展开，并设置防递归与性能边界；50 个资源边界、34 个图边界保留导航；10 个不可取值位置不创建编辑器。
5. 条件：区分 BuildCondition 与 CombatCondition。前者保持定义期属性比较语义（当前契约仅含 deckAttributeCompare），后者按合法图上下文提供条件编辑/图入口，不能为了复用把两者转换成同一运行时模型。

**落点**：递归 DefinitionField/ValueCreator、共享复合控件、`NodeInspectorFields.vue`、生成器的深度/边界处理和相关领域校验。

**验收**：57 个历史位置逐项记录替代或保留理由，新增字段不得无说明退 JSON；复合值导入 → 修改一个叶子 → 保存重开不丢未知但被契约允许的其他内容；只读资产能查看结构而不误写。大型容器和递归类型不会无限展开。

**不做**：跨资源内嵌编辑、通用对象引脚、所有资产的自定义持久化支持。尚无保存通道的资产仍受现有只读边界约束，此类持久化工作单独推进。

### P5：字符串黑板读取的可复用数据引脚（已完成非浏览器验收，依赖 P3）

**首个验证场景**：同图中两个明确接受 `ActionStringOperand` 的动作共享一次“字符串黑板读取”的表达式定义，但在各自使用点读取各自当前上下文；常量 Buff/Skill 仍以内联选择为默认。

**设计选择**：本期采用 `stringNode` 判别与 `type: 'string'` 数据节点，表达式直接复用原 `string` / `{ blackboardKey }` 并支持同类型引用链；下列关口已按末尾记录验证。原设计要求是在现有 `ActionStringOperand` 和 `ActionGraphDataNode` 上选择最小的类型化扩展，并明确字符串节点引用判别。不得把 string 挤入 `ActionValueOperand`，不得用现有 number `valueNode` 欺骗类型，也不得建立第二套独立的数据图存储。具体判别命名随契约设计确定，UI 原型不先写入无法执行的存档。

**必须同批覆盖**：

- 契约表达、生成器、编辑输入与数据节点类型
- `actionGraphData.ts` 绑定/循环/类型校验，`actionGraphDataNodes.ts` 提取、输入发现、复制及连接规则
- `src/core/game-data/validation/definitionValues.ts`、`actionPrograms.ts`、`combatConditions.ts` 等操作数验证，以及编译/动态字符串读取消费路径
- 资源隔离、主图/宏可见性、黑板来源分析、撤销命令、节点删除与保存/加载
- 源数据生成流程与现有定义序列化；新格式若需要重生成，走正式生成流程，不手补生成文件

**兼容策略**：先列明当前项目存档、内置生成定义和明确支持的旧版导入范围。尽量让已有 string / `{ blackboardKey }` 原样可读，未编辑值不批量改写；没有跨发布兼容要求的开发中格式不增加永久兼容层。确需升级时使用现有项目版本/导入边界显式迁移，提供失败诊断并确保迁移幂等。不能让新格式被旧读取器静默当成普通对象忽略。

**验收**：旧内联数据 round-trip、混合新旧输入、缺失节点、跨图引用、循环、类型不匹配、当前作用域变化、运行中动态 ID 解析；内联与图引用求值等价，共享的是表达式而不是先算出的字符串。校验、编译与运行时未全部通过前，UI 不开放此连接类型。

**不做**：动态执行图身份、资源目录对象引脚、任意对象/容器引脚、字符串宏参数和动态写目标。未来只有具体需求和运行时契约证明必要时再扩展。

## 四、门禁与完成定义

### 覆盖门禁

采用“能力覆盖”，不以文本框降至零或测试行覆盖率为目标：

- 每个生成字段必须有查看结果、编辑能力或明确只读/导航/不适用原因；有语义的引用不能静默退成普通文本。
- 每个新出现的 JSON/opaque 后备都要求原因与负责阶段。基线允许项可以逐步减少，不能通过改统计过滤器掩盖退化。
- 分开报告 schema 位置、去重声明及运行实例；当前数据未出现的分支也须由代表夹具覆盖。全量枚举用作生成覆盖检查，不在常规单测重复导出全部原始资源。
- 不依赖 `combat-spec`、私有数据、原始资源服务或联网才能运行核心回归。契约/编辑器使用最小自包含夹具；需真实数据语义的检查使用仓库已提交定义及正式导出验收。

### 每阶段检查

按变更选择现有命令，不宣称仅有类型检查便完成交互：

- 元数据变更：`check:editor-nodes`、`check:definition-fields`、`test:editor-schema` 与针对性生成器回归
- 类型边界：`type-check`、`type-check:game-data-contract`、`type-check:tools`；触及生产转换器再加对应 production 检查
- 行为：已有 definitionFieldRuntime、nodeFieldValues、graphBlackboard、actionGraphDataNodes、图编辑命令与历史测试，补充能暴露上述故障的少量场景
- 图/运行时变更：绑定与校验、编译和执行回归，验证短路、副作用限制与调用点求值不变
- 界面：`test:browser` 中适用的用例和实际浏览器验收，覆盖两套表单、只读/可写、空候选、失效引用、创建与取消、连线、撤销重做和保存重开；涉及浏览器测试源码时运行 `type-check:browser`
- 交付前：格式、`git diff --check`、适用的测试/类型检查及 `build`；具体记录通过、失败、未运行和剩余边界

### 阶段验收记录模板

每阶段保留：范围与依赖、修改入口、已关闭的能力缺口、仍有理由保留的后备、验证命令及浏览器场景结果、序列化影响、未解决问题和下一阶段入口。没有运行时支持的 UI、只有控件没有候选上下文、只能编辑不能保存/撤销，都不能标记完整能力已交付。

当前建议按上述 Unreal 参照从 P0/P1 开始，第一条端到端竖切选“定义侧和动作侧的静态 Buff 引用 + `applyBuff.buffId` 字符串黑板分支”。它能同时验证生成语义、上下文、只读查看、动态/静态区别以及创建/编辑复用；字符串输入引脚留到 P5 关口后开放。

## 首阶段记录：覆盖门禁与生成语义基础

范围为 P0 与 P1 的生成基础，不包含 P1 全部共享控件接入。新增 `tools/editor/fieldCapabilities.ts`、显式后备清单及 `check:field-capabilities`；两套 schema 从同一个提取器保留既有类型别名、声明来源、容器/联合和 tuple 槽信息。完整原因、分类、责任阶段可用 `npm run check:field-capabilities -- --report` 复查。

- 与旧审计相比，`9d838ee` 只更新字段说明，控件结构未变。此次动作/数据控件种类保持不变；只有定义侧三个 tuple 不再伪装同质数组：`operator.skillAliases[].from/to` 与 `enemy.levelHp`。槽类型和长度已保留，在逐槽控件接入前明确只读；这不是三个编辑缺口已完成
- 同口径计数：定义非根位置 2,116 → 2,113，减少的是上述 tuple 原先错误生成的三个同质元素槽；定义 opaque 233 → 236，仍含原有边界而不是新增三种组件。原先 139 个深度截止进一步准确区分为 131 个深度截止 + 8 个递归边界；其余 50 个资源、34 个图引用、10 个无可取值位置及 11 个条件保持不变
- 原审计“文本或旧引用分派”口径 429 → 427 个字符串位置、231 → 229 个去重声明，减少仅来自别名 tuple 的两个错误同质槽。全部 string schema 另含两个已接作用域选择的数值黑板/宏参数字段，因此当前原始 string schema 是 429 个位置 / 231 个声明；两种口径不混算。动作 452、数据 152 字段槽和 85 个 JSON control 位置保持不变
- 历史有值 JSON 的 57 个位置全部保留排期：复合结构 18、引用列表 13、标签集合 11、字符串操作数 6、黑板映射 5、时间结构 3、曲线 1。尚未关闭这些控件缺口；未赋值及混合 `LevelValues | ActionValueOperand` 的输入能力也纳入门禁
- 后备清单区分结构缺口与图/资源/无可取值边界。普通开放字符串仍用基础控件，已有身份保护由表单、命令和能力清单共用；不会把每个文本位置都认领成错误
- 代表夹具覆盖别名展开、导入、泛型包装、optional、联合、array/record、tuple、递归与未知类型，并包含同名非契约类型和普通字符串负例。生成一致性与能力检查加入 CI，不依赖原始资源或联网
- 序列化：未修改领域契约、已提交游戏定义、项目存档或运行时求值。仅生成编辑元数据；未开放 string 数据引脚
- 下一阶段：完成 P1 的共享查看/编辑分派、帮助与上下文适配，保持 union/optional/array/record/创建入口的引用语义；再按 P2 接 Buff 引用与候选解析、P3 接动态字符串黑板分支。元数据存在不代表这些 UI 已接入

验收：独立审查无剩余阻塞。`check:editor-nodes`、`check:definition-fields`、`check:field-capabilities`、`test:editor-schema`（13 项）、`type-check:game-data-contract`、`type-check:tools`、应用 `type-check`、`npm test -- --maxWorkers=1`（455 文件、3,832 通过、1 跳过）、`build`、修改文件 Prettier 与 `git diff --check` 通过。应用类型检查在默认约 2 GB 堆上遇到环境既有的 OOM，使用 `NODE_OPTIONS=--max-old-space-size=4096` 复跑通过；跳过项是未开启 `globalThis.gc` 的堆释放审计。构建仍有大 chunk 提示，本阶段未做加载性能基准。

本阶段未运行浏览器交互验收、生产转换器导出或联网原始数据验收，不以静态/单元检查声称共享 UI 已交付。下一阶段共享分派与控件接入必须补浏览器验证。新增声明来源和语义使两个生成文件合计从约 384 KB 增至 792 KB；已限制原子类型展开并复用生成对象，仍需在后续 UI 接入时关注加载体积。

## 第二阶段记录：共享分派与引用入口接通

范围是 P1 UI 接入及避免回退所需的最小候选供应，不将完整 P2 ReferenceResolver 认领为完成。

- `resolveFieldEditor` 为定义/节点两套 schema 给出相同的语义类别、控件、查看/编辑能力与明确后备；普通文本与受保护身份不误用资源选择器。旧字符串引用配置由纯字段名猜测收紧到已审核的正式契约声明文件；黑板读、写目标没有混入资源族
- `DefinitionField`、`DefinitionValueCreator`、`NodeInspectorFields` 消费共享分派；生成 description 使用既有帮助入口。LevelValues 等父级 union 别名在分支选择后保留，tuple 仍按固定槽描述明确只读，没有伪装为同质数组或认领 P4 完成
- 引用查看与编辑共用 `ReferenceField`，显示候选标签及原始 ID，区分未选、目录空、上下文缺失与当前候选中未找到。这里的“未找到”不是严格失效判定。空候选不退文本；旧值原样保留，不自动修复或选择首项
- 修复 union/optional/array/record/creator 的引用族传递，record 新增值走同一选择器；union 待创建分支统一复用 Creator，取消不改父值，换 schema 清理旧草稿。对象子字段不继承父级引用族，因此动态 blackboardKey 保持自身语义
- 节点检查器候选通过图面板和两个实际宿主供应；技能块宿主使用所选轨道的确切干员定义，技能候选复用现有绑定遍历，包含变体/替换并排除实体子技能命名空间。工作区补 skillGroup 候选。候选刷新不重置节点未提交草稿，拒绝提交仍保留输入，最终写入继续通过原命令/领域校验
- 没有修改契约、生成 schema、游戏定义、存档格式、求值、数据引脚、撤销或保存机制。number/boolean 数据图照旧，未开放 string 数据引脚。静态资源选择不等于运行时连接
- 同口径覆盖分母保持定义非根 2,113、动作 452、数据 152、string schema 429 / 去重声明 231；412 个明确后备及历史 57 个有值 JSON 责任项没有减少。此阶段关闭的是分派/创建传递缺陷，不能把它们算成 57 个结构化控件已补齐。两个生成文件保持 792,465 字节，未扩大生成元数据

验收：独立审查无剩余代码阻塞。`check:editor-nodes`、`check:definition-fields`、`check:field-capabilities`、`test:editor-schema`（13 项）、`type-check:game-data-contract`、`type-check:tools`、应用 `type-check`（4 GB 堆）、`type-check:browser`、最终完整 `npm test -- --maxWorkers=1`（459 文件、3,862 通过、1 跳过）、`build`、修改文件 Prettier 与 `git diff --check` 通过。新增 30 项包括共享分派 9 项、真实模板 SSR 12 项、生产 setup/watchers 交互 6 项、候选上下文 3 项。初次完整运行读到了修改中的测试夹具/模块缓存并失败，修正装备来源 `skillId` 的误分派及夹具必填值后，冻结最终代码完整重跑通过；不将早期失败结果当作通过。

构建仍有既有大 chunk 警告：本次 `TimelineEditor` 约 1,898.94 kB / gzip 460.67 kB，`AssetWorkspace` 414.46 kB / gzip 73.89 kB，`SkillGraphPanels` 336.22 kB / gzip 71.31 kB。未进行加载性能基准，也未声称体积优化。

真实浏览器未通过验收：普通及审批启动 Chromium 都在 `socket()` 报 `Operation not permitted`；受支持云浏览器访问本地测试入口报 `ERR_BLOCKED_BY_CLIENT`，已停止该路径，未绕过限制。新增独立 `test:browser:fields` 的 8 个测试，测试发现、浏览器 TypeScript 和 harness 构建通过，**8 项实际浏览器断言尚未运行**。harness 覆盖三套真实组件的选择、空/缺候选、旧值保留、创建取消、optional 恢复和拒绝后的草稿；其中宿主撤销只是 fixture 不可变状态恢复，不冒充生产历史、保存重开或完整 E2E 验证。既有命令/历史/序列化回归包含在全套单测中，浏览器验收仍需在许可环境补跑。

剩余边界与下一阶段：P2 仍需统一带 owner、来源、导航目标和严格匹配状态的 ReferenceResolver，完善局部/公共同名、歧义、跨 owner 和不可见诊断以及只读跳转；候选存在仅是 UI 状态，不能代替运行时身份校验。P3 才接 `ActionStringOperand` 黑板分支与读写模式；`applyBuff.buffId` 节点 JSON 后备仍保留，未声称 Buff 动态分支闭环完成。P4 的列表/查询/曲线/深层字段及 tuple 控件均保持原排期。

## 第三阶段记录：严格静态引用目录与导航

范围是 P2 中有明确干员 owner 的静态引用闭环，以及当前资产/共享来源/项目目录的边界；不把 P2 所有运行上下文与浏览器验收认领为完成。

- 应用层 `referenceResolver` 保留资源族、owner、来源、目录完整性、稳定候选身份、目标可写性与可选导航地址。候选类型/可见性过滤和当前值状态独立，覆盖未选、有效、失效、歧义、不可见与上下文未知；空目录不退文本，旧失效值不清空
- 两真实宿主接入同一目录模型。干员技能只包含正式技能绑定/闪避，实体子技能不混入该命名空间；Buff/实体保留公共来源，不再按原始 ID 去重掩盖冲突。局部/公共重复与正式编译的拒绝规则一致，不虚设遮蔽优先级。其他 owner 仅用于不可见诊断，不能选择或误跳
- 工作区当前文档与未保存副本按资产文档 ID 隔离。独立审查发现装备套装副本仍持原 slug 会造成假重名，已修复为未发布副本不进入全局候选，发布后使用会话 targetId；导航仍指向真实文档。公共 Buff 资产 ID 含公共来源，跨来源同 ID 不再共用浏览文档
- `ReferenceField` 显示来源/owner/目标只读性；选择、修改目标与查看分别处理。有效唯一目标通过宿主跳转至确切资产和资源路径；组/槽使用既有干员技能页。工作区只记录最终目的地，返回恢复原视图；技能块图从上层工作区关闭后回到原图草稿，不替换技能图编辑会话
- 新建值递归检查引用叶子，节点提交再次检查已改动引用。候选更新不清输入；新选值失效或歧义时拒绝创建/应用并保留草稿，取消仍无父值写入。创建、替换、删除以及撤销/重做继续使用既有不可变命令和会话，未增加资产管理、持久化或运行时模型
- 非干员独立资产缺少确切运行时调用 owner 时明确为上下文未知，不把全项目当合法目录。共享实体在确切 owner 中可解析，但当前没有独立实体资产视图，故不虚构跳转。P3 黑板/动态字符串分支、P4 引用列表/复合字段仍依原排期；后续需补这些上下文能力，不能据此阶段宣称完整 P2 已结束
- 契约、生成 schema、游戏定义、项目存档及运行时求值无变化，未开放字符串数据引脚。覆盖分母与 412 个后备、历史 57 个有值 JSON 责任项保持不变；这些结构控件不因解析器接通而减计

验收：独立审查发现的派生装备套装假重名问题已修复并复审通过。冻结最终代码后，`check:editor-nodes`、`check:definition-fields`、`check:field-capabilities`、`test:editor-schema`（13 项）、`type-check:game-data-contract`、`type-check:tools`、应用 `type-check`（4 GB 堆）、`type-check:browser`、完整 `npm test -- --maxWorkers=1`（460 文件、3,878 通过、1 跳过）、应用 `build`、修改文件 Prettier 与 `git diff --check` 全部通过。相对上阶段新增 16 项单测，覆盖严格来源/类型/owner 解析、无候选/旧失效值、碰撞、只读导航、创建/提交再校验，以及真实 `WorkspaceAssetSession` 的增删替换/拒绝/撤销重做和真实 `WorkspaceNavigation` 的返回前进；未将模板中的状态恢复当作生产历史验收。早期类型检查发现测试夹具可空推断，已修正，在最终冻结代码重新完整验收。

浏览器仍受上一阶段已确认的 socket 权限/云访问限制，本阶段未再次尝试被拒路径。`test:browser:fields -- --list` 发现 10 项（新增 2 项），浏览器 TypeScript 与独立 harness 生产构建通过，**10 项实际浏览器断言仍未运行**。因此跨弹窗层级、真实点击/返回与完整保存重开的浏览器验收仍待许可环境补跑，不以单元与构建代替实际交互。

构建保留既有大 chunk 提示：`TimelineEditor` 约 1,915.41 kB / gzip 465.83 kB，`AssetWorkspace` 404.78 kB / gzip 70.85 kB，`SkillGraphPanels` 335.97 kB / gzip 71.33 kB。没有进行加载性能基准，也不据此声称性能优化。下一接点是 P2 缺 owner/共享实体导航等明确上下文边界，以及 P3 的 `ActionStringOperand` 静态 Buff/动态黑板分支；P4 结构化列表等继续保持责任清单。

## 第四阶段记录（P3.1）：操作数、作用域黑板与既有类型引脚

范围为 P3 的首个完整闭环：既有 number/boolean 数据图、字符串操作数两分支与映射编辑；不新增 string 数据节点，不将没有可证明 owner 的 Buff/实体上下文认领为精确目录。

- `applyBuff.buffId` 复用已有 `ActionStringOperand` 别名，正式重新生成两套 schema。运行时形状仍为 string / `{ blackboardKey }`；其余字符串操作数、定义递归表单和创建入口共用 `StringOperandField`。字面资源选择复用 P2 目录，动态读取复用黑板键控件，分支切换/取消不发布半次修改，提交重新检查最新上下文
- 生成语义驱动数值/条件输入投影，可选槽在未赋值时已能连接。普通 number、BuildCondition、字符串和写目标即使旧值形似表达式也不获准引脚；深层尚未完整描述的对象只保留已有合法图表达式发现。画布与检查器共用内联控件，显示来源和导航，兼容节点类型过滤，连接与常量替换经过同一不可变命令
- 断开不自动写入 0/false，而是要求明确提交合法常量；取消仍保留连接。来源被多个消费者使用时不删除来源，也不缓存运行结果作为缺省。LevelValues 混合槽从连接切回常量后仍能恢复等级数组编辑。调用点求值、短路、副作用策略未变
- 黑板目录区分声明/赋值证据与仅观察到的读取，区分局部、继承、实体层及共享节点多个使用环境。数字/字符串相容检查不把未知外部键冒充越界；数值显式 fallback 允许缺失或非数字来源，缺省保持严格读取。写目标可创建或覆盖当前目的地键，不能套用读候选的旧类型；宏参数身份只读，宏调用参数值不得含 parameter 操作数
- 十类正式映射入口使用明确的声明、路径和 record 值语义：作用域 direct/entity 初值、entity 赋值，Buff 数值/字符串/复制，实体数值/字符串，全局 Buff 数值，宏调用实参。左侧写目的地与右侧读取/常量分开；整张表本地编辑后一次提交，拒绝保留、取消无写入；optional 缺省不等同空对象。原有 valueNode 可保留，连接修改仍使用同一图事务
- 动态 Buff 黑板正确 owner 属于 P2 上下文解析、在 P3 读写入口必须遵守的边界，不依赖 P5。其他 Buff 的 desiredKey 与 Buff/实体赋值目的地没有当前实例的可靠静态 owner 时明确为未知，绝不使用主技能黑板冒充。静态字段仍不强行引脚化
- 覆盖门禁按实际控件更新，不改分母：定义非根 2,113、动作 452、数据 152；已接通 72 个数值/条件输入、6 个字符串操作数、10 个映射位置。后备项从 412 减至 324；历史 57 个有值 JSON 中 11 个关闭（6 字符串操作数、5 映射），46 个继续明确留给 P4/边界。容器整体不因此成为数据引脚
- 独立审查发现并修复：映射拒绝后误丢草稿、把写目标套用读取规则、显式 fallback 被误拒、连接切回常量后失去等级值入口、已知非引脚 schema 被形状后备绕过，以及子控件取消后父层隐藏草稿仍可能提交。补充回归后执行最终冻结门禁，结果见下

最终验收：独立最终审查无剩余阻塞。冻结应用代码后，生成检查 `check:editor-nodes` / `check:definition-fields`、覆盖门禁、schema 测试（13 项）、契约/tools/浏览器类型检查、应用类型检查（4 GB 堆）、完整应用测试（467 文件、3,942 通过、1 既有跳过）、应用 build、修改文件 Prettier 与 `git diff --check` 全部通过。相对前阶段新增 64 项回归，含生产 Vue setup、真实不可变资源会话撤销/重做/序列化、数据图循环/宏参数拒绝、共享读取保留、作用域/字符串/映射重校验。首轮工具类型检查曾因元数据依赖进入战斗运行层失败，已拆出纯 `blackboardMappingSchema` 并完整复跑通过；早期在修改期间执行的结果不作为最终验收。浏览器测试发现 12 项、浏览器 TypeScript 和独立 harness 生产构建通过，**12 项实际浏览器断言未运行**。真实浏览器仍受已确认的 socket 权限/云访问限制，本阶段不重试被拒路径；新增可重跑的字符串切换/取消和候选刷新断言，实际浏览器断言仍未运行。不会以 SSR、Vue setup 或测试发现冒充真实交互。

P3.1 交付时能力门禁仍有 `data/boolean:all/conditions` 与 `data/boolean:any/conditions` 两个条目：已有每项输入可连接/切常量，但容器增删与重排仍是旧 JSON 后备。这两项在下节 P3.2 的类型化条件列表与输入重排/副作用顺序回归中关闭，没有提前挪入 P4。随后进入 P4 结构化列表、查询、曲线、tuple 和深层字段，保持图/资源边界导航。P5 字符串引脚需要契约/校验/编译/运行时全链路设计后再实施。

构建保留既有大 chunk 警告；本阶段未做加载性能基准，不声称性能改善。

## 第五阶段记录（P3.2）：有序条件列表与输入草稿身份

范围仅为 P3 门禁剩余的 `boolean:all/any.conditions` 两项，不提前扩展 P4 容器或 P5 字符串引脚。

- `ConditionListField` 通过共享分派接入两种条件节点，空和非空数组都不退 JSON；容器只负责有序列表结构，原有逐项 `GraphDataInputs` 继续负责表达式与连线。追加需要显式 true/false，移除/上下移动保留其他表达式和引用身份，不去重、不提取/删除共享来源
- 编辑整张列表先形成本地草稿，一次 Apply 通过原数据表达式/资源命令提交；拒绝保留，修正或 Cancel/Escape 清除父层对应暂存，避免被后续导航偷偷提交。readonly 与外部更新不能复活旧草稿
- 画布和检查器的按索引引脚草稿带有所属表达式身份；重复/相同引用项重排也会使旧输入失效。图/节点切换使用明确身份隔离，不因表达式对象恰好相同而复用旧草稿
- 复用现有运行时契约，保留 `all([])` / `any([])`、短路、顺序和副作用单消费者规则。列表追加/删除不重排其余项，只有用户明确移动才改变求值顺序；真实 `DefinitionDraftSession` 历史、序列化与执行回归验证这些边界
- 覆盖基线移除恰好两条 P3 后备，分母不变；后备总数 324 → 322，历史 57 个有值 JSON 仍为已关闭 11 / 待交付 46。BuildCondition、普通数组和字符串不因此获得布尔引脚

最终验收：独立最终代码审查无剩余阻塞。冻结代码后，生成检查、覆盖门禁、schema 测试（14 项）、契约/tools/浏览器类型检查、应用类型检查（4 GB 堆）、完整应用测试（469 文件、3,961 通过、1 既有跳过）、应用 build、修改文件 Prettier 与 `git diff --check` 全部通过。相对 P3.1 新增 19 项应用回归，覆盖真实资源会话的撤销/重做/序列化、共享引用保留与编译后求值顺序，以及 Vue setup 的拒绝/取消、异步 Apply 会话、readonly 和索引草稿失效。浏览器测试发现 18 项（新增 6 项），浏览器 TypeScript 与独立 harness 生产构建通过；**18 项实际浏览器断言仍未运行**。新增 fixture 使用真实 `DefinitionDraftSession` / `updateResourceGraph` 及实际 DataNodeInspector，但不冒充完整应用持久化 E2E。新增条件列表浏览器断言仅在授权环境可重跑；本环境仍不重试之前被拒的浏览器路径，也不会将发现/类型/构建当作浏览器通过。

下一入口为 P4 的引用列表、标签集合、曲线、查询/tuple 和深层字段，P5 保持字符串运行时设计关口。P2 无法证明 owner 的动态上下文和全部实际浏览器验收继续明确标注，不因 P3 核心入口完成而消失。

P3.2 构建仍保留既有大 chunk 提示；未进行性能基准，不声称加载优化。

## 第六阶段记录（P4.1）：资源与 GameplayTag 集合

范围为高频同质字符串容器和标签叶子。正式数组语义及等价参数联合通过共享 descriptor 分派到 `StringCollectionField`；并未给任意 JSON 或复合对象换一个空壳控件。

- 12 个资源列表复用资源目录、来源/owner 状态与只读导航；13 个标签列表复用标签路径控件，其中 `heal.tags` 的等价参数联合也有真实入口。标签文本的 13 个叶子共享目录搜索、层级路径显示和合法自定义路径；节点、定义及新建入口不再分别维护标签规则
- 资源字符串继续序列化原始 ID。核对契约与编译后确认 `SkillDefinition.key` 已是原生 SkillData ID，因此直接复用原有 skill 目录，不增加同义领域类型。原生 `globalBuffIds` 没有已发布运行时目录，保留后备；不把普通 Buff 或构建种子列表当作其合法目录
- 查看保留空值、顺序、重复项、旧失效 ID 及其诊断。局部增删改排在 Apply 时形成一次历史；拒绝保留，取消/Escape 不写，readonly 与外部替换使旧草稿失效。新增项重验最新目录，旧失效项按出现次数可保留/移动/删除，不能借保留逻辑额外复制无效值
- `findOwnerSpawnedAbilityEntities` 的已保存或待提交 `ownerContextKey` 有值时明确失去当前 owner 目录，不能把当前干员模板冒认为目标干员。上下文未知仍可查看/移除旧项，但不选择新资源。必填与非空分离，空列表合法性继续由原领域校验决定
- 标签目录约 6,960 个路径，搜索全目录但每个输入最多渲染 50 个匹配项及当前值；只读态不实例化候选。自定义路径使用既有校验，目录不存在不等于无效。可选节点标签显式清除，取消/readonly 后不复活自定义输入
- 分母保持定义非根 2,113、动作 452、数据 152。明确后备 322 → 284；历史 57 个有值 JSON 已关闭 11 → 34、剩余 23。新增接通的两个标签列表原分类为未观察 structured-value，不混入历史 57 个计数。生成 schema、运行时契约、数据引脚和存档格式未变

独立审查提出的标签可选清除、重置后旧草稿、非法导入项渲染和定义字段可见标签/help 已修复。实际浏览器仍受已确认的 socket 权限/云访问限制，不重试被拒路径；新增的 browser fixture 和断言只进行发现、类型和生产构建，不冒充实际浏览器验收。最终冻结后，生成一致性、覆盖门禁、schema 测试（15 项）、契约/tools/浏览器类型检查、应用类型检查（4 GB 堆）、完整应用测试（471 文件、3,978 通过、1 既有跳过）、应用 build、修改文件 Prettier 与 `git diff --check` 全部通过。新增 17 项应用回归涵盖全部 25 个生成列表的真实模板、创建语义校验、拒绝/取消/只读/重复 Apply、最新 owner/目录再校验，以及真实资源图事务的撤销、重做和导出重开。浏览器发现 20 项（新增 2 项），浏览器 TypeScript 与独立 harness 生产构建通过，**20 项实际浏览器断言仍未运行**。早期测试暴露候选全量渲染过重，已改为有界候选并在最终冻结全套重跑；不把早期失败或默认堆限制当作通过。

构建仍有既有大 chunk 提示：`TimelineEditor` 约 1,916.98 kB / gzip 466.38 kB，`AssetWorkspace` 406.86 kB / gzip 71.23 kB，`SkillGraphPanels` 385.55 kB / gzip 83.51 kB。未作加载性能基准，不声称性能改善。

下一块是生成复合值描述、查询/时间周期/等级值/tuple 和合理深层入口，随后曲线与条件边界。P2 未知 owner、原生全局 Buff 目录与全部实际浏览器验收保留明确边界；本记录不表示 P4 整体完成。

## 第七阶段记录（P4.2）：生成结构值、查询与时间参数

范围是 18 个历史复合/查询位置、3 个原生周期参数、固定 tuple 与定义侧 LevelValues。没有扩展递归深度、运行时类型或字符串引脚；曲线与条件语义保留下一块。

- 纯 `describeDefinitionType` helper 由两套生成器共用，节点通过 `valueSchema` 保留真实结构与全部属性变体，正式重新生成两套描述。相同结构的声明合并来源，但别名、引用角色、字面布尔和嵌套必填性不被抹平；根字段的 owned-resource 仍是边界
- 查询/判别联合/列表/对象通过真实 `DefinitionField` 与 Creator 递归编辑。普通查询 `key` 和引用 `skillId` 在值上下文中可以修改，资产身份仍受原命令保护。新增 Buff/技能/实体叶子复用目录、标签复用 P4.1，circularOrder 的 `indexBlackboardKey` 复用数值写目标规则
- `StructuredValueField` 先 Stage field，宿主再 Apply 整个节点；`nativeChanneling`、`nativeTickInterval`、`nativeExecuteInterval` 可在同一事务中替换互斥模式，不逐字段提交中间无效状态。已有列表/映射/操作数在此期间共用暂存确认，重复 Stage/Apply 不丢已接受草稿；拒绝保留、显式取消/只读/节点变更丢弃对应暂存
- 结构草稿保持 typed value，不初始化或往返 JSON 文本，原有允许的未知扩展及 Infinity 值不被静默改成 null。分支切换保留真正未知扩展、移除旧分支专有字段；新增未知属性、修改未知子树与跨边界删除拒绝。数组/optional 的图与资源保护按身份及次数保留，新旧引用验证防止额外复制失效旧项
- 固定 tuple 分槽查看/编辑，不提供同质数组排序/删槽；`skillAliases` 兼容映射与敌人 `levelHp` 只读约束继承到所有子槽。optional/rest tuple 明确保留未支持。LevelValues 在定义侧复用既有控件，保持未设、单值、等级数组以及混合操作数原有图入口
- 不让含图/资源/未实现操作数或条件叶子的整容器进入通用表单；既有 GraphDataInputs/引用导航保持原规则。当前 BuildCondition 实际只含 deckAttributeCompare；历史 8 个递归边界是 Buff 局部 DamageModifierCondition/PoiseModifierCondition，不是 CombatCondition，不会改造成同一模型
- 覆盖后备 284 → 256；历史 57 个有值 JSON 已解决 34 → 55，保留曲线与原生 globalBuffIds 两项。共享结构还覆盖 5 个未观察普通结构槽，不混入历史计数。动作 452、数据 152 不变；固定 tuple 展开新增 10 个定义位置，定义非根 2,113 → 2,123。两生成文件合计 1,315,839 字节，未声称加载优化

独立复审已通过。首轮完整测试发现既有 LevelValues 输入恢复和工作区 Buff 分支匹配回归：已恢复有旧数值时的无效输入显示；生成器现在将 static Buff 的 `actionGraph?: never` 保留为真实 no-present-type，而不是错误的 graph。这新增一个正确分类的不可取值边界（10 → 11），不增加编辑缺口，历史计数不变。修复及新增可见 label/help 的 focused/SSR 验证通过，随后重新冻结完整验收。最终重新冻结后，生成一致性、能力门禁、schema 测试（17 项）、契约/tools/浏览器类型检查、应用类型检查（4 GB 堆）、完整应用测试（472 文件、3,992 通过、1 既有跳过）、应用 build、修改文件 Prettier 和 `git diff --check` 全部通过。初轮完整验收的 3 个失败不计为通过，最终结果来自修复后的全新完整运行。相对 P4.1 新增 14 项应用回归，覆盖生成结构、完整事务及边界保护。浏览器发现 22 项（新增 2 项），独立 harness 生产构建与浏览器类型检查通过；**22 项实际浏览器断言仍未执行**，不重试已确认被拒的路径。

构建保留大 chunk 提示：`TimelineEditor` 约 1,924.36 kB / gzip 468.22 kB，`AssetWorkspace` 385.84 kB / gzip 66.31 kB，`SkillGraphPanels` 695.12 kB / gzip 109.14 kB。新的完整结构描述扩大了图面板元数据体积；没有进行加载性能基准，不声称性能改善。

下一块 P4.3 单独交付 named/inline 加权曲线（含合法正负无限切线）；P4.4 再交付有限 schema 引用/合理递归展开，以及分别遵守定义期、Buff 局部与图绑定规则的条件入口。原生全局 Buff 缺少已发布目录仍是明确外部上下文边界。

## 第八阶段记录（P4.3）：命名与内联加权曲线

本块只交付正式 `TimeScaleCurveDefinition` 编辑，不扩展递归深度、条件能力、字符串引脚或原生 globalBuff 目录。

- 正式声明经共享语义提取器生成专用 `timeScaleCurve` UI schema；外部同名别名和名为 curve 的普通结构不被误认。两套 schema 均按正式生成流程运行；当前变化仅出现在动作生成描述，定义表单直接消费相同描述语言
- 节点、定义与新建入口共用 `TimeScaleCurveField`。named/inline 分支本地切换、可取消且不默认选择第一条；命名目录复用现有 time-dilation 与 hit-stop 的权威合并及重复键保护。未知旧名称保持并诊断，新选择提交时重验最新目录
- 内联关键帧完整编辑 time、value、inTangent、outTangent、weightedMode、inWeight、outWeight。有限值与正负 Infinity 切线明确切换；未启用的权重仍完整保留。空 keys、重复/逆序时间、非有限普通数值及非法加权模式保留草稿并报错，不自动排序、去重、截断权重或限制 key time 为 [0,1]
- 节点以 typedDrafts 暂存，Stage field 后与其他字段一次 Apply。初始显示、比较和提交均不将曲线往返 JSON；取消、拒绝、重复提交、无改动重开、readonly 和外部替换遵守已有事务边界。曲线 named.key 是普通领域值，资产 key 身份保护未放宽
- SVG 预览使用真实运行时编译/求值，每个绘制样本与运行时对应；加权 Bézier 与正负无限切线阶跃不退化成线性插值。X 是 elapsed / duration 的归一化进度，Y 是无量纲时间倍率；保留运行时内部阶跃 key 精确时刻的原有语义。关键帧分页、预览数量有界；合法极端数值绘制不了时仅诊断预览，不拒绝数据
- 纯曲线结构校验从已有动作校验小范围提取并复用；运行时求值与存档格式未修改。回归使用真实 `DefinitionDraftSession`、资源图更新、`editSkillCastGraph` 命令与项目 serializer 验证原子拒绝、撤销/重做、正负 Infinity 保存重开及未知扩展保留
- 分母仍为定义非根 2,123、动作 452、数据 152。仅关闭 `action/startTimeDilation/parameters/curve`，后备 256 → 255，历史有值 JSON 已解决 55 → 56 / 57；globalBuffIds 和真实图/资源/条件/递归边界保持待交付或上下文边界

开发 focused、schema 与 editor tools 类型检查已通过。独立审查提出的扩展内图边界、删除后新增同数量关键帧、只读大曲线预览开销及定义能力视图问题已修复并补充回归；最终冻结后，生成一致性、能力门禁、schema 测试（20 项）、契约/tools/浏览器类型检查、应用类型检查（4 GB 堆）、完整应用测试（474 文件、4,020 通过、1 既有跳过）、应用 build、修改文件 Prettier 及 `git diff --check` 全部通过。相对 P4.2 新增 28 项应用回归。浏览器发现 24 项（新增 2 项），独立 harness 生产构建通过；**24 项实际浏览器断言仍未运行**，不重试已确认被拒的路径。发现、类型和 harness 构建不等于浏览器通过。

构建仍有大 chunk 提示：`TimelineEditor` 约 1,926.48 kB / gzip 468.77 kB，`AssetWorkspace` 385.84 kB / gzip 66.32 kB，`SkillGraphPanels` 708.40 kB / gzip 112.64 kB。未进行加载性能基准，不声称性能改善。

P4.4 将按新核实的真实契约校正此前 globalBuffIds 的目录分类：它是开放原生 ID 匹配查询，未知非空 ID 合法且仅无匹配，不应伪造资产引用约束。createGlobalBuff.definition 也不是 owned graph resource，需按新实例局部黑板上下文编辑；spawnAbilityEntity.definition 才包含独立子资源。这些修正不改变运行时合法性，保留至 P4.4 实施并更新责任清单。

## 第九阶段检查点（P4.4a）：有限 schema 引用与深层字段基础

此检查点收束到有限描述、消费边界及深层表单，不宣称 P4.4 整体完成。BuildCondition/CombatCondition 专用入口、剩余操作数/执行序列混合容器、GlobalBuff 局部黑板和开放原生 ID 查询继续由后续检查点交付。

- 沿用 `DefinitionFieldSchema`，只增加 JSON-shaped `ref` 变体和各生成根携带的 `references`。生成器在下探前按真实 checker type、声明来源、泛型替换语义及 root/owned 模式建立上下文；递归边返回字符串引用，不生成循环 JS 对象。泛型来源替换归一化后再作身份比较，避免 `Link<T>` 因替换链增长而无法收敛
- 既有描述类型搬到无 Vue 依赖的 `core/editor`，原 UI 路径重导出。共享 resolver/union selection 供表单、创建、默认值、路径写入、引用校验、结构校验、静态图输入投影和能力审计使用；应用只传当前表单的 refs，不加载全局跨面板目录。静态图输入通过真实 valueSchema 下探，保留 CombatCondition 原有布尔输入与主图/宏规则；不把 BuildCondition 或 Buff-local `{blackboardKey}` 转成图引脚
- 值遍历最多 16,384 个位置、192 层，并检测祖先循环；结构匹配/编辑扫描另有 131,072 步工作预算。预算耗尽直接拒绝，不能用部分扫描结果批准。判别值先于递归子值匹配，避免对象属性顺序导致指数遍历。required 递归默认值保持未选择，optional、空 array/record 自然终止
- DefinitionField/Creator 在同一根上下文解析 ref，缺失引用、ref-only 环和非法/超预算值显示不可编辑错误。每个展开视窗最多 8 层、每页 50 行；更深子树可聚焦并保留原路径、引用语义和只读权限，Back 返回，分支或目标消失关闭旧焦点。没有改为 JSON 编辑
- 图引用的身份、出现次数和路径继续受保护，包括删除/复制 list 行及直接下探 nodeId；未接上专用上下文的数值操作数不通过普通结构表单开放。graph/owned/no-present 原有 34/50/11 条边界逐项保持，static Buff 的 `actionGraph?: never` 仍为不可取值槽
- 新分母按“inline 位置 + 每个根可达 ref body 一次 + ref 边位置”计数，不无限展开递归路径。定义非根 2,123 → 3,736（含 54 个 ref 边），动作 452、数据 152 不变；后备 255 → 116。原 131 个 depth 和 8 个 recursive 位置完整逐项保存在能力账本，并强制检查没有缺项/重复/新后备；所有可达 schema body/ref 同时审计。历史 57 个有值 JSON 仍为 56/57，不借本检查点关闭 globalBuffIds

Focused 回归覆盖真实生成的递归 Buff 条件、真实 WorkspaceAssetSession 叶子编辑/非法拒绝/撤销重做/项目 JSON roundtrip，及递归泛型、互递归、缺失 refs、ref-only 环、创建终止、未知扩展、readonly 错误、视窗/分页/聚焦路径和专用图边界。开发 focused 通过 93 项；独立审查另行核验 12 项有限引用/真实会话回归、能力门禁与历史账本。首次冻结全测暴露一项旧 dispatcher 断言仍期望 contextless ActionValueOperand 走普通 union；已按审查确认更新为只读专用边界，未放宽源码，随后重新冻结全套运行。最终生成一致性、能力门禁、schema 测试（21 项）、契约/tools/浏览器类型检查、应用类型检查（4 GB 堆）、完整应用测试（475 文件、4,030 通过、1 既有跳过）、应用 build、修改文件 Prettier 与 `git diff --check` 全部通过。相对 P4.3 新增 10 项应用回归。浏览器发现 25 项（新增 1 项），独立 harness 生产构建通过；不以生成/typecheck/SSR 代替浏览器交互。新增浏览器场景仅作为待运行断言，**实际浏览器仍 UNRUN**，不重试已确认被拒绝的浏览器路径。领域契约、运行时求值和持久化格式未变。

构建仍有既有大 chunk 提示：`TimelineEditor` 约 1,930.50 kB / gzip 470.03 kB，`AssetWorkspace` 379.83 kB / gzip 65.27 kB，`SkillGraphPanels` 714.78 kB / gzip 114.46 kB。未进行加载性能基准，不声称性能改善。

## 第十阶段检查点（P4.4b1）：开放原生 GlobalBuff ID 查询

只收束 `finishGlobalBuffsById.parameters.globalBuffIds`。此前把它列作等待资产目录的引用列表是分类错误：正式契约 `actions.ts` 要求 `readonly string[]`，校验要求非空列表且每项字符串长度大于零；运行时通过 `groups.get(id) ?? []` 匹配活动实例，未知 ID 合法且无匹配。删除该字段错误的资产引用类别，保留真正资产引用的目录约束，不改领域模型、校验或运行时。

- 共享 StringCollection descriptor 仅接纳正式 actions 声明、精确属性/节点路径及同质 string 类型。复用列表原子草稿，提供逐项原生 ID 文本控件和“无匹配不产生效果”的说明，无目录依赖、导航或字符串图引脚。原始空白（含 tab/CR/LF）、顺序、重复项均保留；额外只读转义显示让不可见字符可辨识，不 trim 或按目录修复
- 空列表/空字符串在创建、已有值 Apply 和 readonly 错误显示中有真实校验，旧非法项不能借 stale-reference 保留规则通过。未知非空 ID 可正常输入；取消、快速重复 Apply、reopen/no-op、readonly 转换及与已接受同节点草稿的重复 staging 继续遵循原子提交规则
- 测试包括包含生成字段的 DefinitionValueCreator、真实 addResourceNode/replaceResourceNodeAction、DefinitionDraftSession 撤销/重做和 JSON roundtrip，非法 ID 或整个 action 校验失败均不写历史。覆盖的是字段/包含值创建及已有节点编辑；**没有新增完整节点创建向导**，`listNodeCreations` 仍不能用非法空列表默认值直接实例化该节点
- 分母仍为定义非根 3,736、动作 452、数据 152；仅此 1 条后备 116 → 115，历史有值 JSON 57/57 全部逐项记账。condition-editor-pending 11 条、其余操作数混合容器与 GlobalBuff 局部上下文继续待交付；原 139 深层责任 ledger 和 50/34/11 硬边界不变，不声称 P4.4 整体完成

新增浏览器断言检查精确 ID、空列表拒绝、取消/重开、readonly 和命令历史；**实际浏览器仍 UNRUN**。开发 focused 5 文件 81 项通过，独立审查另行复跑 3 文件 23 项通过。最终冻结后，双生成一致性、能力门禁、schema 测试（21 项）、契约/tools/浏览器类型检查、应用类型检查（4 GB 堆）、完整应用测试（475 文件、4,037 通过、1 既有跳过）、应用 build、修改文件 Prettier 及 `git diff --check` 全部通过。相对 P4.4a 新增 7 项应用回归；浏览器发现 26 项（新增 1 项），独立 harness 生产构建通过。发现/类型/harness 构建不能当作交互通过。

构建仍有既有大 chunk 提示：`TimelineEditor` 约 1,928.32 kB / gzip 469.54 kB，`AssetWorkspace` 379.83 kB / gzip 65.26 kB，`SkillGraphPanels` 718.36 kB / gzip 115.38 kB。未进行加载性能基准。

## 第十一阶段检查点（P4.4b2）：七个定义内联条件宿主

本检查点按实际执行路径关闭原 11 个 `condition-editor-pending` 入口中的 7 个：gearSet 和 weaponTrait 各两种 eventHandler 分支、两种 SkillDefinition 的 switchToBuffCast.condition，以及 operatorUpgrade.addConditionalDamage.condition。7 个原路径逐项保存在 `resolvedDefinitionConditionPositions`，与仍待交付的 4 个路径合计固定 11 项；不是把整个条件领域一次标为完成。

- 正式定义生成器在来源可核对的宿主语境下，沿用现有 union/object/ref 描述内联条件。一个纯编辑器 `inlineCondition` 标记携带 equipment/skillSwitch/enemyStaggered 语境，并进入引用身份与组合等价判断；动作/数据节点的生成描述不改变。没有新增领域条件类型、运行时模型或字符串引脚
- 独立 `InlineCombatConditionField` 只负责原子草稿，复用 DefinitionField/Creator、有限深层视窗、标签/引用/StringOperand 控件，以及 BlackboardMappingValueField 的 constant/blackboard 数值控件。内层数值黑板 key 只在明确条件草稿中使用 value 编辑语境，普通定义 key 仍受身份保护。命令层拒绝越过整条件边界直接修改子路径；合法分支切换先保留图边界，再把复用名称的新类型字段当作新槽处理
- 整条件提交复用 `validateCombatCondition`，再用同一有限 schema/resolver 校验全部已声明子树；所有候选均排除 conditionNode、valueNode、宏 parameter 和 forEachContextTarget 专属条件。all/any 非空、数值有限、标签语法及实际资产引用目录仍在提交时校验。图 CombatCondition 继续沿用 GraphDataInputs/TypedDataInput 与原主图/宏环境；拥有 actionGraph 不给外层条件提供绑定能力
- 装备条件只提供所属 contribution.blackboard 的初始声明；switch 条件只提供候选技能初始黑板声明。运行时注入/实体回退/prepared-start 键是外部上下文，不假装已有完整目录；不投影任意图写入或宏形参。目标 Buff 的 desiredKey 使用已有 externalBuff 语境，outputKey 保留写入角色。未知宿主显式 unknown，不继承偶然存在的图黑板 provider
- addConditionalDamage 更窄：编译器只接受 targetStaggered/enemy，因此该生成入口只提供这一种完整值，不开放 all/any/数值树。BuildCondition 仍是独立的 deckAttributeCompare 普通结构；Damage/PoiseModifierCondition 的 8 个 Buff-local 递归位置和 `{blackboardKey}` 保持原类型及编辑规则
- 另外 4 处保留后备和说明：两种 skill.availability 尚未找到此版本的运行时消费者；两种 skill.eventHandlers 的非空列表被 compileSkillProgram 明确按旧式无监听区间定义拒绝。保留类型化编辑责任，不借其 actionGraph 声称可执行，也不新增监听语义

有限描述扩展使定义非根分母 3,736 → 35,197（+31,461，含 207 个 ref 边），其中 70 个 inlineCondition、1,104 个 inlineOperand 是各来源语境下可达条件结构的位置，不是新增宿主或同时挂载控件的数量。生成源码由 456,527 → 876,454 字节；现有 8 层/50 行视窗与有限值/工作预算保持。动作 452、数据 152、历史有值 JSON 57/57 不变；后备 115 → 108，剩余 condition 4、structured 9、graph 34、owned 50、no-present 11。原 139 深层责任和 95 个硬边界逐项保持，没有删除目录或泛化条件模型。

Focused 测试逐项覆盖 7 个真实生成入口的创建、已有/readonly/非法条件、整值编辑边界，以及真实 WorkspaceAssetSession 历史、saveProjectTemplateDefinition → serializeProjectDocument → parseProjectDocument 正式导入闭环；另覆盖递归条件、未绑定宏参数拒绝、目录刷新草稿保留、分支 creator 局部路径、readonly 数值事件、分支切换和深度预算。新增浏览器场景仅编写/发现，**实际浏览器仍 UNRUN**；开发 focused 5 文件 110 项通过（其中新增条件专项 37 项）；独立审查通过并复核能力门禁与责任账本。首次冻结 tools 类型检查发现生成器条件展开的判别联合推断问题，已改为同义的显式类型分支并重冻结全套；随后完整应用测试 476 文件、4,074 通过、1 既有跳过，双生成、能力门禁、schema 21 项、契约/tools/浏览器类型、应用 4 GB 类型检查及 build 全部通过。最终 harness 构建又发现新 Vue fixture 漏闭括号；仅修复该测试文件并重新通过浏览器类型、27 项发现和独立 harness 生产构建，全部 tracked/untracked 修改文件 Prettier 与 `git diff --check` 通过。相对 P4.4b1 新增 37 项应用回归，不以 SSR 或发现代替交互验收。剩余操作数容器、GlobalBuff 局部作用域与执行序列容器不在此检查点范围。

构建仍有大 chunk 提示：`TimelineEditor` 约 1,930.56 kB / gzip 470.18 kB，`AssetWorkspace` 663.13 kB / gzip 87.05 kB，`SkillGraphPanels` 723.17 kB / gzip 116.63 kB。新增条件描述使 AssetWorkspace 源码 chunk 增大；未作加载性能基准，不声称性能改善。

### P4.4b2 窄修：非法条件草稿原位纠错及四处有意只读

- 修复真实 gearSet 条件中 `right.value` 清空后，严格整树选型返回 opaque、数字控件随之消失的问题。仅在正在编辑的内联条件事务内，且正式生成 union 存在唯一、单值 `kind` 判别匹配时，保留该分支的渲染形状。未编辑的损坏导入值、未知/歧义 kind 不做推测；提交、Creator 完整性、命令验证继续使用原严格 resolver/validator。取消或 readonly 转换撤销这项仅渲染能力
- 同一生产组件实例及原样 client 模板测试覆盖直接条件和 all/not 内层的清空 → 非法 Apply → 同一数字控件修正 → 正式 WorkspaceAssetSession 提交/撤销，另覆盖取消、readonly、旧输入事件与坏导入。测试仅替换设计系统视觉原语的事件接口，不声称实际浏览器执行通过
- 四处技能条件按明确范围选择保持只读：`definition/skill/<0>/availability`、`definition/skill/<1>/availability` 未建立此版本运行时消费；`definition/skill/<0>/eventHandlers/[]/condition`、`definition/skill/<1>/eventHandlers/[]/condition` 所属非空旧列表被编译器拒绝。UI 在缺省/有值状态均显示只读原因；这不是待接入作者模式的交付承诺，不增添执行语义。保留四个原 `condition-editor-pending` 审计键及诊断分类以维持责任追踪，不通过删后备宣称新覆盖
- 不改生成schema、分母、7个已开宿主、139深层责任、95硬边界或57个历史JSON位置；剩余9个结构容器另按有限checkpoint实现。浏览器场景补充同字段原位修正后 Apply，实际浏览器仍 UNRUN。开发 focused 101 项、独立新增 repair 5 项通过；最终冻结双生成/能力门禁、schema 21 项、契约/tools/browser/app 4 GB 类型、完整应用测试（477 文件、4,080 通过、1 既有跳过）、应用 build、27 项浏览器发现与独立 harness 生产构建、全部 tracked/untracked 修改文件格式和 diff 检查均通过。源码/生成字节和能力数量保持；构建仍有大 chunk 警告，未测加载时延

## 第十二阶段检查点（P4.4c1）：两个伤害动作操作数容器

本检查点只关闭 `action/dealDamage/parameters/instantAttributeModifiers` 与 `action/dealDamage/parameters/instantDamageScaleModifiers`，两个原路径逐项进入 `resolvedGraphOperandPositions` 并受能力门禁检查。另 7 个结构容器、4 个有意只读条件和所有真实图/资源边界继续保留责任；不扩展 GlobalBuff 局部上下文或执行序列编辑。

- 沿用现有完整 `valueSchema`，不改生成器或生成文件。精确 action kind、完整字段路径及正式 source 声明共同限定授权，再把该容器中唯一正式 ActionValueOperand schema 的只读集合显式传给结构控件和提交验证。普通定义、伪同名导入声明及其余操作数容器不会因此开放
- 两容器复用 StructuredValueField、DefinitionField/Creator 和 BlackboardMappingValueField；允许 finite constant、当前动作黑板 number read/fallback，以及当前宏已声明 parameter。`attributeTiming` 只改变属性读取时机，不给 value 分配另一个黑板。attribute 仍是正式开放字符串，不虚构属性目录、默认中性值或运行时限制
- 已连接 valueNode 保持原对象身份，数值控件只读，现有 GraphDataInputs 继续提供来源定位及类型化连/断操作。容器内可以修改元数据、增加未连接 row 或保持原引用重排；移除带连接 row、取消整个带连接容器、复制引用或普通字段改 nodeId 仍拒绝，必须先显式断连。断连与删除 row 都不删除其他消费者共用的数据节点。操作数分支切换保留未知扩展
- Creator 继承同一 graph leaf 授权及实际黑板/宏候选；新建未完成值留在本地，不能创建裸 nodeId。Stage 及最终整 node Apply 重验数值源语境，旧非法导入不被隐式修复；取消、readonly、no-op、重复 Stage 继续使用既有原子草稿规则
- 修复编辑器命令接缝：replaceResourceNodeAction 使用精确 main/macro 图绑定后的 proposal 调用既有动作 validator，写回仍是原始引用对象，再执行既有 owner 图校验。领域 validator、运行时求值与序列化语义未变；缺失/错误类型/环路数据引用与主图参数、未声明宏参数继续拒绝
- 两个图宿主在 connectData 执行既有字段 flush 后比较 owner 身份；若已提交字段导致 owner 更换，保留这次成功的字段历史并中止旧 indexed 连接事件，提示用户重新选择刷新后的输入，避免把旧索引应用到重排行

新增 targeted 测试覆盖两套真实生成字段的创建、已有/readonly/错误、已连接元数据编辑、当前黑板及宏参数、扩展保留、引用次数与原有路径边界；真实 Yvonne/Estella owner 图经 WorkspaceAssetSession 修改和 undo/redo，再通过 saveProjectTemplateDefinition → serializeProjectDocument → parseProjectDocument 正式闭环。另验证同名 main/macro data ID 隔离、共享节点显式断连保留、非法 sibling 拒绝，以及两个真实 graph host 的 stale indexed event 中止与仅一次已提交结构历史。

分母保持定义非根 35,197、动作 452、数据 152，139 深层 ledger、95 硬边界、57/57 历史 JSON 责任不变；后备仅 108 → 106，其中 structured 9 → 7，condition 4、graph 34、owned 50、no-present 11 不变。新增两项浏览器场景与实际图宿主 harness，但**实际浏览器仍 UNRUN**；开发 focused 11 文件 154 项通过，独立审查无剩余阻断。最终冻结双生成/能力门禁、schema 21 项、契约/tools/browser/app 4 GB 类型、完整应用测试（479 文件、4,100 通过、1 既有跳过）、应用 build、29 项浏览器发现及独立 harness 生产构建、全部 tracked/untracked 修改文件格式和 diff 检查均通过。相对前次新增 20 项应用回归，不以单元/类型/发现或 harness 构建代替浏览器交互。

构建仍有既有大 chunk 提示：`TimelineEditor` 约 1,930.65 kB / gzip 470.26 kB，`AssetWorkspace` 663.33 kB / gzip 87.08 kB，`SkillGraphPanels` 725.50 kB / gzip 117.26 kB；未测加载时延，不声称性能改善。

## 第十三阶段检查点（P4.4c2）：三个普通操作数列表

本检查点只关闭 `action/applyBuff/parameters/keywordEnhancements`、`action/applyBuff/parameters/onActionEndBuffs`、`action/readSkillSettingData/parameters/items`。三个原路径逐项加入 `resolvedGraphOperandPositions`，合计五个已交付 graph operand 容器。沿用 c1 的精确 kind/path/source 声明准入、显式 operand schema 集合、原子 Stage/整节点 Apply、精确主图/宏命令绑定以及 stale indexed connection 中止；未改领域声明、validator、编译或运行时。

- keywordEnhancements 提供正式 Buff 引用列表、operation 和操作数控件。triggerBuffIds 使用当前真实 Buff 目录，保留顺序、重复值和引用诊断，不退回普通字符串；value 在创建边沿读取当前 creator 动作黑板，随后监听使用已求出的数值。没有借用 spawnAbilityEntity 分支的同名校验块为 applyBuff 增加运行时限制
- onActionEndBuffs 提供余效 Buff 引用、target/source、数字及字符串 assignments、继承标记。数字映射严格是正式 ActionValueOperand，不因旧 validator 同时接受 LevelValues 而扩大控件。独立 exitBuff 提示明确：数值在动作 END 读取当时的当前动作黑板，目标键属于余效 Buff，目标类型未知。finishByAction=true 和非空列表仍由既有整动作 validator 校验；先 Stage 列表再修改 sibling 可作为一个事务 Apply，拒绝时保留已接受草稿
- 嵌套映射复用 BlackboardMappingField，浅层持有 row/value，保留 valueNode 对象身份。已连接项禁止普通控件改值、改目标键或删除；先通过现有图输入显式断连。改另一映射行、分支切换和重复/拒绝提交保留原连接与未知扩展；等待接受及 readonly 阶段拒绝过期输入事件
- items 使用现有 EaNumberInput 组成固定四列控件，无新增领域同义类型。损坏导入显示原始非法值和错误，字段/Creator/Stage 均要求恰好四个 finite 数字。column 复用 graph operand；storeKey 仅精确 `parameters.items.<数字索引>.storeKey` 提供 number write 角色，覆盖旧 string 键或新增键不受 number read 类型约束。Creator 继承实际完整路径，避免重置局部路径后把写入误作普通字符串
- items 按原顺序执行；列号 round-to-even 后从 1 开始，越界跳过。有限静态证据只在前项四列有效、无 enhance、inline constant 舍入后位于 1..4 时，为后续行提供确定数字覆盖。动态/连接列、越界列、带 enhance 项不抹掉原 string/mixed 类型证据；当前行不能读取自己的未来写入。enhance 的 caster/buffOwner/buffSource 与公式沿用正式 schema，Buff 上下文运行时要求保持原样，不虚构宿主能力

新增回归包括三个生成字段的创建/已有/readonly/错误/取消、目录刷新、同节点 sibling 原子提交、映射连接身份和次数、宏形参/主图隔离及共享节点显式断连。真实 Purrchena/Liino/Antal owner 图经 WorkspaceAssetSession 创建/修改、undo/redo，再走 saveProjectTemplateDefinition → serializeProjectDocument → parseProjectDocument 官方闭环。新浏览器场景复用真实 graph host harness；**实际浏览器仍 UNRUN**，类型/发现/构建不代表交互通过。

分母仍为定义非根 35,197、动作 452、数据 152；后备仅 106 → 103，其中 structured 7 → 4，condition 4、graph 34、owned 50、no-present 11 保持。原 139 深层 ledger、95 硬边界、七个已开放条件宿主和 57/57 历史 JSON 责任均保持。剩余 createGlobalBuff.definition、两个执行序列容器与 spawnAbilityEntity.definition，以及四处有意只读条件不在本检查点范围。开发 focused 7 文件 115 项通过，独立审查及最后 indexed 路径窄修复核无阻断。最终冻结双生成/能力门禁、schema 21 项、契约/tools/browser/app 4 GB 类型、完整应用测试（481 文件、4,121 通过、1 既有跳过）、应用 build、32 项浏览器发现及独立 harness 生产构建、全部 tracked/untracked 修改文件格式和 diff 检查均通过。相对前次新增 21 项应用回归；实际浏览器依旧 UNRUN。

构建仍有既有大 chunk 提示：`TimelineEditor` 约 1,930.65 kB / gzip 470.25 kB，`AssetWorkspace` 663.33 kB / gzip 87.08 kB，`SkillGraphPanels` 730.60 kB / gzip 118.70 kB；未测加载时延。

## 第十四阶段检查点（P4.4c3）：GlobalBuff 定义与独立局部黑板

仅关闭 `action/createGlobalBuff/parameters/definition`。此前 `independent-resource-value-filter` 将此字段与 spawnAbilityEntity 一并过滤，是分类错误：正式 SkillGlobalBuffDefinition 没有 actionGraph，其 valueNode 由所属 action graph 递归绑定。这里只移除此一个错误分类；spawn 的真实独立子技能资源、50 owned、34 graph、11 no-present 边界原键保持。精确 kind/path/source 配置开放现有完整 schema 的两个 ActionValueOperand 叶：sharedSpModifiers.value 与 children.blackboardAssignments 值；没有给 durationSeconds.blackboardKey 或任意相似对象授予图引脚。

- 复用现有结构事务、数字/宏操作数、Buff 引用和映射控件。定义字段包含 stacking、duration、blackboard、shared SP、children 等全部正式槽。子映射明确写入 child Buff，读取源则是新 GlobalBuff 板；子 Buff 目标键不被误当作父板声明。局部读保持 constant、blackboard/fallback、当前宏声明 parameter，以及同图 number valueNode；已连接值保留身份/次数/路径，普通控件不能改 nodeId 或删除连接
- 新板仅由 definition.blackboard 与数值 creation override 的目标键构成，override 优先，值不在编辑器求值。没有 creator/entity 继承；closed 只是现有编辑器 context 的显式读边界，缺失键和已知 string/null 数字读拒绝，显式 fallback 仍合法，write 目标与宏参数 namespace 不受此限制。普通开放/unknown 板行为不变。null 在 closed 证据中保持独立类型，避免共享节点的 number/null 合并错误地变成 number
- graphBlackboard 按每个 (creator scope, create node) 建独立板；inline duration/操作数和 data-node 消费均按真实 field path 记账。同一数据节点内外使用保留多个 dataContexts，并逐消费环境核对；outer count/blackboardAssignments 仍读 creator，不能因为 owning node 相同而混板。未接根 GlobalBuff 的 inner 板仍可由声明确定，连接验证直接使用同一局部证据；不伪造其外侧调用环境
- useGraphVariables 的数值读创建与连接都依目标 field path 选择板；local/creator 同名变量不能伪装跨板读取。GraphDataInputs 保留合法 number 节点选项，提交时验证 closed target 的实际表达式；未接根普通动作继续保持原开放行为。局部 GlobalBuff 变量只允许创建读取，变量面板不再提供会误写 creator 的 modifyActionValue 操作。两个图宿主在字段 flush 更改 owner 后中止旧 indexed variable-drop，与既有 connectData 保护一致
- 表单先完整组装所有 staged sibling proposal，再校验；即使只删除外 override，未修改的 definition 也重新验证其 duration/inline/已连接数字源。打开的内层草稿随最新 overrides 更新语境而不重置输入；Creator 使用自己的完整新定义板或实际父定义板，继续保留宏参数。引用目录、cancel、readonly、no-op、拒绝后修正和最终整节点领域验证沿用原流程

真实 Lifeng/Akekuri 生成图经 WorkspaceAssetSession 修改/新增 child、undo/redo，再走 saveProjectTemplateDefinition → serializeProjectDocument → parseProjectDocument。静态和 UI 回归覆盖冲突 creator/local 键、override 优先、null、fallback、多消费板、主/宏同名 data ID、孤立节点、同名跨板拖放、最新 sibling override、未知扩展及引用保护。新增 runtime 测试实际经过 createActionGraphCompilation → CombatActionSequenceRuntime → GlobalBuffOperationExecutor：宏参数替换为表达式而非 creator 数值快照，count 读 creator，shared SP/children/duration 读 local，创建同步求值，恢复动作状态不重复创建/重求值；运行时源码和领域模型未改。

分母仍为定义非根 35,197、动作 452、数据 152；后备仅 103 → 102，structured 4 → 3，其余4有意只读条件、139深层ledger、95硬边界、七个已开放条件宿主和57/57历史JSON责任保持。剩余两个序列混合容器和 spawn 独立子资源另行收束，不进入本检查点。新 GlobalBuff browser harness/scenario 使用真实 graph host，**实际浏览器仍 UNRUN**；类型、发现和 harness 构建不等于交互通过。开发 focused 10 文件 103 项通过，独立审查无剩余阻断。最终冻结双生成/能力门禁、schema 21 项、契约/tools/browser/app 4 GB 类型、完整应用测试（483 文件、4,139 通过、1 既有跳过）、应用 build、33 项浏览器发现及独立 harness 生产构建、全部 tracked/untracked 修改文件格式和 diff 检查均通过。相对前次新增 18 项应用回归；实际浏览器依旧 UNRUN。

构建仍有既有大 chunk 提示：`TimelineEditor` 约 1,930.65 kB / gzip 470.25 kB，`AssetWorkspace` 663.58 kB / gzip 87.14 kB，`SkillGraphPanels` 737.07 kB / gzip 120.50 kB；未测加载时延。

### 14. P4.4c4：图内分支与监听响应混合容器

本检查点仅关闭 `action/switch/options` 和 `action/listenForCombatEvents/parameters/responses`。正式 source + kind + 分段 path 限定其 sequence/condition 叶子权限，生成 schema 不变；新增行通过 Creator 显式建立无扩展的 `{$sequence:null}`。已有非空执行引用、valueNode/conditionNode 及未知扩展中的图边界继续按对象身份、次数与行内路径保护。未连空行可以增删，移动保留原引用；删除带连接行前先通过原图命令显式断开，结构操作不删除共享目标或数据节点。空引用参与临时原行配对但不成为禁止删除的连接，新增前置行不会抢占旧行并丢失扩展。

switch 的 value 复用当前动作黑板、当前宏参数和受保护 number source 控件；重复值、顺序及空匹配分支不归一化，实际执行仍由原 float32 首匹配算法决定。listener 的 key/event/phase/priority 复用 typed 控件，其非空、唯一 key、事件规则、priority 整数且仅 dataAction 及有效 endFrame 上下文仍由完整动作/owner validator 决定。condition 在行内只摘要/定位，通过原 GraphDataInputs/TypedDataInput 的 boolean 常量/条件节点路线修改，包含缺省 optional 槽；不展开定义内联条件，不授予其他定义宿主 graph/macro 权限。

两数组沿既有 Stage field → 整节点 Apply 原子事务提交，raw JSON 的 graph guard 不放宽。执行连接/断开继续使用 listGraphPorts、connectResourceNode / setGraphConnection，导航沿现有 graph host。调查发现 canvas 会先于 host flush，旧 data guard 同样可能被绕过；因此渲染时的 port/input/edge 保留纯 UI `{graph value, document identity + main/macro scope}` 快照，执行与数据事件、字面替换及定向变量拖放传给 host 在 flush 后核对。旧行索引、被替换目标、共享同一图对象的跨资源/宏事件都须重新选择；selected-wire Delete 使用原 pin，不通过旧 path ID 重新寻找新边。已接受字段 flush 可以保留一次历史步骤，但拒绝的旧接线不另建历史。输入端“断全部入线”仍实时枚举当前来源，与单源端口断线分开。

责任分母仍为定义非根 35,197、动作 452、数据 152；仅两条 structured 后备移入 `resolvedGraphSequencePositions`，后备 102 → 100，structured 3 → 1。139 深层责任、95 个硬边界、七个开放条件宿主、四处有意只读条件、六个已交付 graph operand 容器与历史 57/57 均保持。最后 spawnAbilityEntity.definition 独立资源另行收束，未进入 P5。

验收覆盖真实 Mifu switch / Ember listener 的 WorkspaceAssetSession、命令 undo/redo、正式 serializeProjectDocument/parseProjectDocument；两图宿主原样组件模板的新增、纠错、取消、条件定位和 canvas 预先 flush 的执行/data 键盘连接、Alt/菜单/Delete 断线、主宏/资源/目标替换，另有真实 edited switch 图编译执行顺序回归。两个 browser 场景仍 **UNRUN**；开发 focused 9 文件 94 项通过（本轮新增 34 项），app 4 GB 类型、能力门禁、schema 21 项、browser 类型及 35 项发现、新 harness 原样脚本/模板编译、全部 tracked/untracked 格式及 diff 检查均通过；独立源码审查无阻断。最终冻结双生成/能力门禁、schema 21 项、契约/tools/browser/app 4 GB 类型、完整应用测试（486 文件、4,173 通过、1 既有跳过）、应用 build、35 项浏览器发现及独立 harness 生产构建、全部 tracked/untracked 修改文件格式和 diff 检查均通过。实际浏览器仍 UNRUN。

构建仍有大 chunk 提示，分块归属发生变化：`TimelineEditor` 约 2,439.27 kB / gzip 526.43 kB，`AssetWorkspace` 664.08 kB / gzip 87.27 kB，`SkillGraphPanels` 234.51 kB / gzip 66.46 kB。三块未压缩合计约 3,337.86 kB，前次约 3,331.30 kB；TimelineEditor 增量不能单独解释为同量新代码，但更早加载的具体影响尚未测量，不声称性能改善。生成 schema 字节未变。

## 第十五阶段检查点（P4.4c5）：Spawn 外层值与真实独立子资源

仅收束 `action/spawnAbilityEntity/parameters/definition`。正式声明内的 bornTags、blackboard、lifetime、deathReleaseDelaySeconds、maxStackingCount 复用标签、记录、联合与数值控件；childSkill、childSkills、passiveSkills 三个完整槽继续是独立资源边界，不在外层创建、删除、替换或重排。Stage 和整节点 Apply 都保持三个槽的对象身份，包含空集合与未连接图；普通扩展数据仍原样保留。没有把整份定义统一显示为 JSON，也没有把资源图展开到字段表。

模板数值仍是 `number | { blackboardKey, fallback }`，绝非 ActionValueOperand。`abilityEntityOperationExecutor` 在实体黑板创建前读取本次赋值：可选继承动作 direct snapshot，再应用数值赋值，最后应用字符串赋值；没有数字时用必填 fallback。这里不读取 definition.blackboard 默认值，也不复制共享 entity 层。现有静态 layer 证据为候选补充 direct snapshot 类型，未知来源不冒充继承值；不提供宏参数或图引脚，不改变运行时求值。

既有资源路径与工作区会话已经可以编辑任意真实 owner；本次只补主图/宏的 spawn 子资源发现，并继续有限扫描新发现的独立 owner。发现以路径为身份，允许同一对象在不同位置出现；拒绝祖先循环、超过 64 层和 16,384 次工作预算，资源显示边界在主文档和 footer 报告错误，失败时不渲染图面板，Undo/Close 保持可恢复。没有增加 inline entity 目录，子资源不污染全局技能/实体 ID 候选。新 inline 布局键对路径分段作无歧义编码，旧资源布局键保持。

字段直接显示真实子技能身份和打开按钮；工作区按所属资产、owner、主图/宏、节点及资源原对象核验目标，在 flush 后再次检查，再打开原有独立图编辑器；目标过期或提交失败显示诊断。Standalone host 无导航时明确显示原因。尚未 Stage/Cancel 的结构草稿禁止跳转，避免新按钮丢失输入；只读查看仍能导航。独立图编辑、布局、外层字段共用 WorkspaceAssetSession 历史，Back 使用原 WorkspaceNavigation 恢复资源视图。

责任清单只将最后一条 structured 后备移入 `resolvedOwnedContainerPositions`，后备 100 → 99；余下 50 owned、34 graph、11 no-present 和四处有意只读条件原键不变。分母仍为定义非根 35,197、动作 452、数据 152；139 深层责任、七条件宿主、六 graph operand 容器、两执行序列容器与历史 57/57 明细不变。生成 schema 与领域/存档模型均未改。本轮没有新子资源创建向导或子技能时间线向导，P5 不在范围内。

开发相关 focused 10 文件 73 项通过，随后新增预算失败恢复回归单文件 8 项通过（本轮合计新增 20 项），包含真实 Arclight 生成资源、主图/宏同名对象隔离、数组路径和嵌套发现、三槽身份保护、正式 serializeProjectDocument/parseProjectDocument 与布局保留、原样组件字段创建/纠错/取消/只读，以及真实工作区资源导航、独立编辑、历史和 Back。新增 browser fixture/断言仅作为待运行场景，**实际浏览器仍 UNRUN**。独立最终复跑三个新增文件 20 项全部通过，源码审查无剩余阻断。应用 4 GB 类型、能力门禁 99、schema 21 项、browser 类型和 36 项发现，以及 SpawnResourceHarness/Harness/AssetWorkspace 原样脚本与模板编译、全部 tracked/untracked 格式和 diff 检查通过。最终冻结双生成/能力门禁、schema 21 项、契约/tools/browser/app 4 GB 类型、完整应用测试（489 文件、4,193 通过、1 既有跳过）、应用 build、36 项浏览器发现及独立 harness 生产构建、全部 tracked/untracked 修改文件格式和 diff 检查均通过。不以 focused 或模板编译代替浏览器执行。

## P4 最终收束与 P5 接点

P4 的可编辑范围已完成非浏览器验收并在本地分阶段提交；不在本记录中声称远端已发布或 CI 已通过。相对 P3.2，完整应用回归由 469 文件 / 3,961 通过提升到 489 文件 / 4,193 通过（净新增 232 项），1 项既有 skip 保持。各检查点均独立审查、冻结验证；早期失败与修正记录保留在对应阶段，不以开发中结果代替最终门禁。

- 后备净数 322 → 99；structured/depth/recursive 缺口均已关闭。历史有值 JSON 57/57 全部逐项交付，139 个原深层截断位置、7 个实际条件宿主、6 个 graph operand 容器、2 个 sequence 容器及 1 个 owned 外层容器都有可审计账本，不靠移除统计位置降数
- 剩余 50 owned-resource：独立资源完整槽由专属资源/图入口处理，外层不直接替换。34 graph-reference：真实执行/数据引用沿既有类型化连接、断开和导航命令处理，不作普通 JSON 写入。11 no-present-type：正式契约没有可取值，包含 static Buff 的 actionGraph?: never，不创建编辑器
- 剩余 4 condition-editor-pending 原键按明确范围选择有意只读：两种 skill.availability 无当前模拟消费者，两种 skill.eventHandlers 旧非空列表被编译器拒绝。UI 显示原因，原键继续追踪；它们不是本阶段未兑现的作者模式承诺，也不能为了清零改变运行时
- 定义非根分母 35,197、动作 452、数据 152。定义分母包含有限引用体/边和多来源语境展开，不能解释为同时挂载的控件数或同比文件膨胀。最终生成文件实际为定义 876,454 字节、动作 853,312 字节，总 1,729,766 字节；表单仍有 8 层/50 行视窗，真实值和资源发现有明确预算/错误恢复
- 最终 build 的 TimelineEditor 为 2,441.75 kB / gzip 527.30 kB，AssetWorkspace 为 665.90 kB / gzip 87.91 kB，SkillGraphPanels 为 240.18 kB / gzip 68.06 kB。此前存在分块归属移动，不能用单块增量代表总新增代码；实际加载时延/内存未测，不宣称性能改善
- 36 项浏览器测试仅完成发现、TypeScript 与独立生产 harness 构建，实际执行全部 UNRUN。已确认的环境访问限制没有重试或绕过；Vue 原样模板/SSR/命令/runtime 证据均分别标注。P2 动态 owner 未知、未提供新子资源创建向导、以及尚无独立保存通道的资产保持原限制

P5 只接续上文已列的字符串读取数据引脚设计：两个正式 ActionStringOperand 输入共享表达式定义，但在各使用点按当前上下文求值。契约/生成/绑定/验证/编译/运行时/历史/序列化必须同批闭环，不借用 number valueNode，也不为现有普通字符串或静态引用一律加线。本阶段没有建立 string 数据节点、字符串宏参数、动态写目标、对象/容器引脚或第二套图存储。

后续代码接点是共享 fieldEditorDispatch 与 DefinitionField/Creator、graphOperandContainerSchema、typedGraphInputs/actionGraphDataNodes、已有 graphBlackboard/blackboardFieldContext 和两套 graph editor 命令。必须保留本阶段的调用点作用域、GlobalBuff 独立板、spawn direct snapshot 证据、源/目标完整图与 owner/main-macro 快照、旧 indexed event 拒绝、引用出现次数及 owned 槽身份保护、Stage/Apply 原子事务与官方序列化回归。P5 另行安排，本阶段到此停止新增类型。

## P5 最终收束：类型化字符串输入

本阶段基于 P4 最终提交 `666ee1bcd284c5bf92fd69edd5a884698446ea1b` 实施，以上 P4 的“尚未新增类型”描述保留为当时的历史边界。P5 采用一个最小 string 表达式节点族：原 `ActionStringOperand` 增加 `{ kind: 'stringNode', nodeId }`，`ActionGraphDataNode` 增加 `{ type: 'string', expression: ActionStringOperand }`。只有四个已有动作消费位（applyBuff.buffId、castSkillDuringAction.skillId、两种创建标记的 markerId）、两个已有标记条件消费位，以及 string 数据节点根输入开放该类型；生成 schema 与绑定允许列表有对应覆盖测试。没有拼接、类型转换、字符串宏参数、动态写目标、对象/容器引脚或新图存储。

- 绑定器仅共享表达式定义，缓存不包含求值结果；每个动作/条件仍按当时黑板读取。严格拒绝错类型、未知类型、缺失节点、非法/额外字段、引用环和静态身份/写目标中的 stringNode，独立资源及主图/宏命名空间保持隔离。未绑定引用进入执行器时明确失败，不通过 undefined 键或隐式字符串转换继续执行。原数值/条件短路、随机及副作用多消费者限制保持
- 未连接的详情输入继续只由原 StringOperandField 编辑 literal/read，Buff/Skill 默认引用选择不变；图详情只负责选源，连接后显式原值替换才断开。string 数据节点的根输入始终存在，可断开到精确字面量后重连；字符串变量拖放创建正式 string 读取。已知类型/局部范围不符拒绝，未知运行时来源按正式目标类型创建但不伪造类型证据。只读导航、陈旧主图/宏/文档快照、Stage/Apply、引用保护与共享来源删除保护沿用原事务入口
- 全局 Buff 独立局部板、spawn direct snapshot、宏 owner/事件身份与既有四处只读条件范围不变。字符串没有新写入动作；将字符串来源拖到数值写操作或数值宏参数仍拒绝。类型化字段、递归结构、独立条件与曲线扩展不能用 raw JSON 或过期控件事件改写图引用
- 编译器来源优化器对未绑定 stringNode 按既有 valueNode 规则报告 unknownAccess/mayThrow，保留可能被读取的初始值和先前写入，不误把 nodeId/undefined 当黑板键。完整转换器测试发现 P4 已存在的有限 schema 传递依赖未列入共享白名单；仅补入经独立审查的五个纯文件，不扩大目录许可或引入应用/UI/资源库依赖

### 兼容与数据基准

当前项目 `schemaVersion: 1`、仓库已有生成定义与现有旧轴导入路径（scenarioList / version 1.0.0 的 legacy 分类及其原转换器）仍沿原边界。旧内联 string 与 `{ blackboardKey }` 不迁移、不自动抽取、不批量重写；新类型只存在原 dataNodes 字段内。开发中的图格式没有新增永久迁移层；旧实现对未知 string 数据节点已有显式类型拒绝，不宣称旧二进制可以加载新图。

正式回归经过 WorkspaceAssetSession 修改、撤销重做、saveProjectTemplateDefinition、serializeProjectDocument/parseProjectDocument，再编译重开定义；主图/宏同名来源、旧 literal/黑板读取和新引用混存均保留。错误类型来源重开后不能静默变成普通对象。动态 Buff 多次创建逐次查当前 ID，动作/标记 checkpoint 恢复不重放已消费输入或重复创建实例；原有真实轴、恢复与旧数值/条件回归均纳入完整应用测试。

能力分母为定义非根 **35,611**（原 35,197，正式新联合分支按来源语境展开增加 414）、动作 **452**、数据 **153**（新增一个 string 表达式字段）。string schema 位置 **5,108**、去重源声明 **254**；这是全部字符串描述的位置/来源分母，不是新增 pin 数量。新增实际直接类型化入口为上述 **4 动作 + 2 条件 + 1 数据根槽**。后备保持 **99 = 50 owned + 34 graph + 11 no-present + 4 有意只读条件**，历史 57/57、139 深层、七个条件宿主及 P4 容器账本均未删除或换口径。

生成文件定义 **877,868 字节**、动作 **859,577 字节**，合计 **1,737,445 字节**；相对 P4 增加 **7,679 字节**。没有重生成内置战斗定义，不以展开 schema 位置数推断文件体积、控件同时挂载数或实际加载性能。

### 验收与剩余限制

独立代码审查和最终增量审查无剩余阻断；审查过程中修复了未连字符串双编辑入口、根槽断开后消失、未知来源无法按目标类型创建读取及已知混合调用板接线绕过字段校验。开发中测试/类型错误均已修正，不以早期局部结果替代最终门禁。

最终双生成检查、能力门禁、**22 项 schema 测试**，contract、tools、production compiler、全 compiler、browser TypeScript 与 **4 GB 串行应用类型检查**通过。完整应用 **492 文件 / 4,249 通过 / 1 既有跳过**（相对 P4 净增 56 项）；完整转换器 **178 通过文件 + 1 跳过文件 / 1,539 通过 / 3 跳过**；legacy-tools **1 文件 / 6 通过**。应用 build、独立 fields harness 生产构建、全部修改与新增文件的格式检查及 diff 检查通过。

浏览器测试由 36 增至 **37 项**，只完成 TypeScript、发现与 harness 编译，**实际执行全部 UNRUN**；没有重试或绕过已确认的 socket EPERM / cloud ERR_BLOCKED_BY_CLIENT 限制。新增场景覆盖真实 graph host 的类型过滤、选源/定位、精确字面替换/取消、共享来源删除拒绝、撤销重做与只读，仍待授权的可运行浏览器环境执行。SSR/事件单测/源代码不能替代实际拖线、取消与切节点验收。构建的大 chunk 提示继续存在；实际加载时延、内存未测，不宣称性能改善。本记录仅证明本地实现与验收，不证明远端已发布或 CI 已通过。
