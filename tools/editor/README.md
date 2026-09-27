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
