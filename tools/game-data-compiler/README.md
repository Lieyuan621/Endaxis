# 游戏数据编译器

本工具把游戏表格和 Unity 资源转换成 Endaxis 使用的定义、本地化文本和 WebP 图片。先生成隔离候选并验证，再发布到正式目录。普通网页开发不需要运行它。

## 前提与输入

在仓库根目录安装开发依赖，使用 Node.js 22.12 或更高版本。完整资源更新还需要可用的 Unity worker 及对应游戏资源；文本导出使用 Python，依赖见 `scripts/akedata-export-requirements.txt`。

确认表格快照、客户端资源和原生行为依据的版本。来源优先使用 AKEDB，缺件可由 VFS 补齐。文件哈希只能证明取到哪些内容，不能证明不同来源属于同一版本。

冻结来源目录必须包含下载器生成的 `source-provenance.json`。实际路径与服务地址由操作者提供，不从其他机器的交接复制。

## 更新一个游戏版本

### 1. 生成候选

检查并保留工作树修改后，在仓库根目录执行：

```sh
npm run rebuild:game-data -- --version '<版本>' --unity-worker '<worker路径>' --workers 2
```

结果写入 `tmp/game-data-rebuild/run-*`，包括来源、候选、审计和 `report.json`，不直接覆盖正式产物。已有冻结来源可这样重跑：

```sh
npm run rebuild:game-data -- --source-root '<冻结来源目录>' --version '<版本>' --unity-worker '<worker路径>' --workers 2
```

`--tables-only` 仅检查表格和单件装备，不能完成版本更新，也不能与发布组合使用。

### 2. 审阅范围与配置

先看报告中的 `sources`、`source-coverage`、`content-inventory`、`operator-refresh-review` 及各领域 `comparison`。逐项核对新增、修改、删除与阻塞项；非玩家记录、表现变体和未知技能不能自动当作可用内容加入。

| 配置                                             | 何时修改                                         |
| ------------------------------------------------ | ------------------------------------------------ |
| `game-data-sources.json`                         | 新增所需表、集合或单文件                         |
| `config/operators.json`                          | 新干员、技能组、变体、养成关联或对象展示信息变化 |
| `config/gearSetIdentities.json`                  | 新增产品支持的套装身份                           |
| `config/gearSetIcons.json`                       | 指定套装中一件装备 ID 作为图标来源               |
| `config/equipmentAssets.json`                    | 对象资源有歧义，需要明确别名                     |
| `config/systemBuffRoots.json`                    | 自动引用范围之外还需要的系统根 Buff              |
| `config/globalBuffIdentities.json`               | 新增全局 Buff 身份                               |
| `config/commonBuffPresentationNames.json`        | 公共 Buff 需要明确本地化名称                     |
| `config/contingencyContractSimulationScope.json` | 确认合约效果的模拟范围                           |
| `config/enemies/runtime-defaults.json`           | 有依据的敌人运行默认值变化                       |
| `config/enemies/selection-categories.json`       | 新敌人的选择分类、未分类或隐藏状态               |

普通技能、天赋和潜能不逐项配置编译器，编译路径从原始动作推断。路由关系和递归技能组等确需人工确认的配置保留在对象定义中。递归放置策略必须校验起止技能、段数预算和回退序列，不按干员名称分派。

`config/operators.json` 的技能项可声明 `timelineBlockFollowUpSkillId`，以同干员另一技能
可接续的时刻作为块宽边界，覆盖默认接续目标。此项专用于显示，不要求目标是结束技能，
不改变释放规则或技能寿命。转换器校验原生接续窗口与可放置引用，运行时检查当前路由；
未配置时使用默认规则，不配置固定结束帧。

游戏文本优先来自本轮表格；表格没有的产品术语维护在应用语言文件的 `enumTerms`。所有配置引用必须在本轮来源中有效。

### 3. 修复并验证

缺失动作、未知字段、引用或时间语义应先核对原生行为，再补转换与运行支持。不能填零、跳过对象或复制旧正式产物放行。

修改后用同一冻结来源重跑，检查联合战斗定义、敌人、物品、文本、图标、格式、类型、资源引用、技能与装备模拟、生成后来源核验均通过。候选独立重编译检查确定性，不拿首轮编译对象代替第二轮。

还要以受影响的技能、配装和真实轴检查数值、时序、名称、图标和富文本。自动检查不能证明新游戏机制已全部支持。

### 4. 发布与复核

```sh
npm run rebuild:game-data -- --source-root '<冻结来源目录>' --version '<版本>' --publish --unity-worker '<worker路径>' --workers 2
```

发布会重新生成并验证，不直接复制上次候选。成功后检查报告中 `fullRebuild`、`published` 为 `true`，`remaining` 为空，再审阅正式产物差异和相关回归。

| 退出码 | 含义                   |
| ------ | ---------------------- |
| `0`    | 完整发布成功           |
| `1`    | 有阶段失败             |
| `2`    | 候选有效但尚未完整发布 |

发布只替换登记的派生文件，混合目录保留手写成员。安装失败尝试回滚，回滚不完整时保留备份；这是可恢复文件事务，不是所有目录瞬间原子切换。

## 输出与边界

完整干员生成到 `src/data/operators/<slug>.generated.ts`。武器、装备、套装、系统机制、Buff、敌人及物品写入各自登记的正式目录；本地化与图片随候选一起验证。生成流程统一格式化 TypeScript，数字数组保持紧凑。

所有游戏图片输出 WebP；时间轴导出 PNG 不属于本工具。套装最终定义保存图标路径，配置只选择装备 ID，不覆盖原生 Buff 图标。

中间模板、原始 JSON、审计、暂存和备份位于 `tmp/`，不提交。正式目录不能反向提供候选缺失的内容。

完整重建只覆盖登记领域。新增物品、敌人行为或 HUD 不会仅因下载成功就得到模拟支持；需按明确范围补齐生成与消费。

## 定向检查与优化

```sh
npm run type-check:game-data
npx vitest run tools/game-data-compiler --maxWorkers=1
npm run audit:game-data:candidate-operator-skills -- --candidate-root '<候选目录>' --potential 0 --end-frame 3600
npm run audit:game-data:candidate-equipment -- --candidate-root '<候选目录>' --end-frame 300
```

生成优化的内部模式为 `off`、`report`、`apply`，默认 `apply`。比较同批冻结来源的两个候选可使用：

```sh
node --max-old-space-size=2048 --experimental-strip-types tools/game-data-compiler/scripts/auditDefinitionOptimizationCandidates.ts --before-root '<优化前候选>' --after-root '<优化后候选>'
```

检查串行加载两路，比较完整模拟事实而不持有整批回执。优化规则和公共类型归属见[游戏数据架构](../../docs/architecture/game-data.md)。
