# 节点描述生成工具

本工具从公共契约生成动作图编辑器使用的字段描述。修改动作、条件或数值表达式类型后，用它同步编辑器元数据；不需要游戏原始资源或资源服务。

## 输入与输出

输入是 `packages/game-data-contract/src` 中的动作、条件和数值表达式类型。工具用 TypeScript TypeChecker 读取字段类型、可选性、枚举及注释，输出 `src/ui/action-graph/actionNodeSchemas.generated.ts`。

浏览器只加载生成描述，不加载 TypeScript 编译器。不要手改输出文件。用户可见的名称与说明维护在 `src/i18n/locales/`，不另建语言资源目录。节点样式和交互见[编辑器架构](../../docs/architecture/editor.md)。

## 执行

先按[开发指南](../../docs/development/README.md)安装依赖，再在仓库根目录运行：

```sh
npm run generate:editor-nodes
npm run check:editor-nodes
npm run test:editor-schema
npm run generate:definition-fields
npm run check:definition-fields
```

前三条分别生成、检查和测试动作节点描述。后两条生成和检查资产属性描述，输出到 `src/ui/definition-editor/definitionSchemas.generated.ts`，供各类资产表单共用。提交契约变更时一并提交对应生成差异。

## 失败处理

检查提示过期时，重新生成并审查差异。字段无法正确表达时，先检查契约的判别类型和生成器的类型处理，不在生成文件中手补字段。字段描述完整不代表每种节点都能无参数创建：需要资源或变量身份的节点仍由相应选择器提供，独立资源不能退化成任意 JSON 输入框。

## 字段语义与能力门禁

两套描述保留共享的 `semantics`、`source` 与 `fallback` 元数据。类型别名沿契约声明解析；普通文本不会因为字段名包含 `Id` 或 `Key` 自动成为引用。图、资源和无可取值字段分别保留原因，tuple 不再取第一槽冒充同质数组。

```sh
npm run check:field-capabilities
npm run check:field-capabilities -- --report
```

默认输出汇总；`--report` 输出每个位置的来源声明、语义、查看/编辑与连接资格，供复查。位置键为 `入口/根/字段路径`。定义侧展开联合分支 `<n>`、数组 `[]` 和 record `{}`；根对象不计入字段分母。动作/数据侧沿已有扁平注册表统计字段槽，容器及联合语义保留在该行 `semantics`，不把内部每个表达式分支另加到节点分母。声明去重用 `source` 中的仓库相对声明定位，节点聚合字段包括联合中的 `never` 禁用声明。字符串原始 schema 计数和排除两个已有作用域选择器后的旧审计口径分别报告。报告不加载游戏实例，不声称每个潜在字段都已在界面显示；权限、候选目录和当前值过滤仍属于宿主上下文。

`fieldCapabilityBaseline.json` 是经过分类的待办/边界清单，而非生成快照。每条后备都有原因、责任阶段与精确位置；历史 57 个已观察位置必须仍在待办中，或明确移入 `resolvedObservedJsonPositions` 并通过无后备检查；新增位置、理由变动、重复豁免和失效旧位置都会失败。修复控件后删除对应豁免；新出现的后备应先审查再明确写入，不能只刷新总数。CI 同时检查两套生成描述、此门禁和代表夹具。

历史审计的 57 个有值 JSON 位置标记为 `observedJsonAtAudit`，分类用于排期，不能当成当前运行实例数量。其它未赋值的操作数字段、可选字段和定义联合分支也在门禁范围；例如 `LevelValues | ActionValueOperand` 即使保留等级数值控件，也仍记录切换运行时输入的 P3 待办。普通开放字符串仍是有效基础控件；识别出的 GameplayTag 等语义即使仍可输入文字，也明确记录专用控件待接入。共享元数据不代表共享 UI 分派、候选解析和控件已经完成，验收状态见[分阶段计划](../../docs/development/field-components-plan.md)。

## 结构值描述与边界

`describeDefinitionType.ts` 是两个生成器共用的纯 helper，调用方传入 TypeChecker 与仓库根路径；导入它不会创建生产 TypeScript Program。节点 `valueSchema` 直接使用定义表单的 schema 语言，聚合字段必须合并全部声明变体，并保留嵌套必填性、来源和语义角色。`true`/`false` 字面量不能扩宽为任意 boolean。节点字段根部遇到 owned actionGraph 仍是资源边界，不能沿用资产根对象可展开的例外。

固定 tuple 现在展开为独立槽，因此定义侧分母新增相应位置；optional/rest tuple 仍保留明确后备。节点结构内部不另加到扁平字段分母。能力分派只认可所有叶子都有实际控件的结构，不能仅因存在 valueSchema 就关闭后备。资源/图/运行时操作数和条件不通过通用结构表单绕过其原规则。正式 `TimeScaleCurveDefinition` 通过来源认证的 semantic alias 生成独立 `timeScaleCurve` UI kind，复用专用共享控件；外部同名类型仍按其实际结构处理。该 seam 不扩大 opaque 字段的写权限，也不增加运行时领域别名。

## 有限递归描述

`describeDefinitionType` 在下探前登记带声明/泛型/所有权上下文的复合描述，递归返回字符串 `ref`；每个生成根携带显式 `references`。共享 `core/editor` resolver 检查缺失或纯引用循环，真实值匹配与审计使用相同解析规则。生成器预算耗尽报错，不重新制造静默 depth fallback。

能力 census 按 inline 位置、每根可达 ref body 一次及 ref 边计数，避免无限展开。P4.4a 定义非根位置为 3,736（54 ref 边），动作/数据仍为 452/152；原 131 depth 与 8 recursive 路径逐项保留在基线账本，门禁强制核对每项已解析且无后备，不能删除历史责任。原 owned/graph/no-present 50/34/11 条边界仍保留。分母变化不表示运行实例数量。
