# Inspector 元数据工具

本工具从 `packages/game-data-contract` 提取字段结构，让定义编辑器使用公共控件编辑参数。它负责类型结构，不推测游戏规则，也不向契约写入 Vue 或显示标签。

## 自动运行

开发、构建和 Vitest 通过 Vite 插件准备元数据，`npm run type-check` 通过前置脚本准备。通常不需要单独生成。

```sh
npm run type-check
npx tsc -p tools/inspector-schema/tsconfig.json
```

直接运行 `vue-tsc` 不会触发 npm 的前置脚本，缓存缺失时应回到正常入口。

## 输入与输出

`contractSchema.ts` 读取 TypeScript 契约，`sync.ts` 生成结构缓存，`vitePlugin.ts` 处理准备和监听。开发监听整个契约目录，构建登记依赖；相同内容不重复写入。

输出为定义编辑目录下的 `conditionStructure`、`stepStructure`、`modifierStructure`、`contributionStructure` 和 `eventStructure.generated.ts`。这些是被 Git 忽略的可重建缓存，不手改、不提交。

## 与界面的边界

数据流为：契约 → 字段结构 → 显示注解 → 公共控件 → 属性句柄 → 宿主草稿与历史。

显示注解只补标签、帮助、分组和控件选择，不重列字段和默认值。联动写入属于显式编辑规则，不能伪装成标签注解。

控件不拥有独立草稿或撤销栈。属性句柄读取最新根并一次提交，路径按段保存，带点的字典键不拆分。删除最后一项是否省略整个字段由父规则决定；失效句柄不能重建已删除容器。

结构递归由节点图编辑，参数由 Inspector 编辑，导航只改变视图。只有能唯一定位当前对象时才跳转，不按过期对象或同名节点猜目标。

## 验证与错误

检查类型提取、可选字段、联合切换、数组、字典、等级值与引用。未知结构必须明确保留错误或受支持的编辑入口，不能静默丢字段。

表单回归检查最新值读取、联动一次提交、撤销重做、完整字段定位和删除后的失效句柄。浏览器再检查展开、焦点及键盘历史操作。架构说明见[编辑器](../../docs/architecture/editor.md#定义编辑器)。
