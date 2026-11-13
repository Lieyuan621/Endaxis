# 游戏数据编译器

将游戏数据转换为 Endaxis 使用的干员、武器、装备、敌人、关卡、合约等定义，以及本地化文本和 WebP 图片。更新游戏资源或修改转换规则时使用；普通网页开发直接使用仓库已有产物即可。

## 游戏资源生成

### 准备环境

需要 Windows x64、Node.js ≥22.12、Python ≥3.11，以及本机已安装的游戏和两个工具仓库：

- [AKE Data Tool](https://github.com/NagiYume/AKEDatabase/tree/main/tools/ake-data-tool)：导出 TableCfg、Json 和图片。
- [endaxis-data-tool](https://github.com/SQwatermark/endaxis-data-tool)：导出编译器需要的补充数据，并提供本地来源服务。

运行前，按照本仓库及两个工具仓库的说明准备运行环境。脚本不代为安装依赖或初始化子模块。默认使用两个工具目录各自的 `.venv/Scripts/python.exe`；其他环境可通过 `--ake-python` 和 `--python` 指定。

### 执行

在 Endaxis 仓库根目录运行，替换下面三个路径：

```powershell
npm run rebuild:game-data:local -- --game-root "<游戏安装目录>" --ake-tool-root "<AKEDatabase目录>/tools/ake-data-tool" --data-tool-root "<endaxis-data-tool目录>" --publish
```

脚本复制并缓存 VFS，调用两个工具导出数据，自动启动来源服务，生成候选并验证，最后将结果写入本地工作树。游戏安装目录只读。`--publish` 表示写入仓库的正式资源目录，不会提交 Git 或部署网站。

去掉 `--publish` 可只生成候选；将其换成 `--check-inputs` 可只检查环境。完整参数、缓存和执行说明见[入口脚本注释](scripts/rebuildFromInstalledGame.ts)，也可运行 `npm run rebuild:game-data:local -- --help`。

危机合约的服务端效果配置仍可能需要从 AKEDATA 下载，因此本机导出流程不保证完全离线。已有这些补充文件时，可通过 `--contract-values-root` 指定目录。

### 确认结果

编译阶段的输出位于 `tmp/game-data-rebuild/run-*`，终端会打印本次报告路径：

| 内容          | 用途                                     |
| ------------- | ---------------------------------------- |
| `report.json` | 查看各阶段状态、来源、候选路径和发布结果 |
| `candidate/`  | 查看生成的定义、文本和图片               |
| `audit/`      | 查看内容变化、引用及模拟检查结果         |
| `sources/`    | 保存本次使用的来源，供排查和重跑         |

完整生成并写入成功时，报告中所有阶段为 `passed`，`fullRebuild` 和 `published` 为 `true`，`remaining` 为空。仅生成候选时，`published` 为 `false`。

| 退出码 | 完整生成入口的含义                   |
| ------ | ------------------------------------ |
| `0`    | 已通过验证并写入正式目录             |
| `1`    | 执行失败，查看终端错误及对应阶段报告 |
| `2`    | 候选通过验证，尚未写入正式目录       |

生成后审阅 Git 差异，并用受影响的技能、配装和时间轴检查数值、时序及展示。自动验收通过不代表新机制已全部得到模拟支持。提交正式产物和必要的代码、配置；原始导出、缓存、审计及备份不提交。

### 失败时从哪里查

- **环境或导出失败**：查看终端错误和本次导出目录。核对工具环境及游戏是否更新完成；此时可能尚未生成编译报告。
- **编译或验证受阻**：从 `report.json` 中第一个 `failed` 或 `blocked` 阶段开始，查看其错误与审计文件，区分输入缺失、待审阅配置、转换未支持和产物验证失败。
- **新增内容未出现**：检查内容清单及干员更新审计，确认来源已包含该内容、配置已关联到正确身份，以及该内容是否在产品支持范围内。

缺失动作、引用或未知字段需要核实后补齐解析、转换及必要的运行支持。不要填零或复制旧产物来绕过检查。修复转换规则后，优先用同一份来源重跑，便于区分代码变化和游戏数据变化。

## 游戏更新：接入新增内容

完整生成会更新已有配置覆盖的内容，但不会替维护者决定哪些新身份应该进入产品，也不会自动补齐新机制。更新应按下面的流程完成。

### 1. 导出新版来源并盘点变化

先更新本机游戏和两个工具仓库，按各仓库说明更新环境，再运行上面的完整生成命令，**暂时不带 `--publish`**。这轮用于获取新版来源、生成候选和暴露缺口；遇到未配置身份或新动作导致阻塞是需要处理的结果。

查看 `report.json` 的以下阶段，而不只看命令是否成功：

| 阶段或报告                    | 需要检查什么                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `sources`、`source-coverage`  | 新版所需表格、集合和补充文件是否已取到                                                                            |
| `content-inventory`           | `characters`、`gearSets` 的 `unconfiguredSourceIds` 和 `configuredIdsMissingFromSource`；武器、单件装备的来源数量 |
| `audit/operator-refresh.json` | 新的角色模板、已有模板变化、技能库缺口及关联失效                                                                  |
| 各领域阶段的 `comparison`     | 候选相对正式产物新增、修改和删除了哪些文件                                                                        |

`unconfiguredSourceIds` 是“来源有而清单未登记”，不等于“新增可玩内容”。需要区分别名、表现变体和非玩家记录。武器与单件装备的数量也不能代替身份差异检查；应结合来源表和候选差异确认具体新增项。

### 2. 确认新增资源已经被导出和读取

同一类资源中的新增文件通常会自动进入导出；新增资源类别、目录或数据结构则可能需要扩展读取范围。按下面顺序定位，避免在编译器里配置一个根本没有导出的身份：

| 层次与位置                                                                                                     | 自动覆盖范围                                                                 | 什么时候需要修改                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AKE Data Tool 的 `ake_tool/json_host/schemas.py`                                                               | 已知 Json 数据集中的新文件；TableCfg 由 AKE 表格导出器读取                   | 新 Json 数据集或游戏格式变化，先检查 AKE 是否已支持，再更新工具或补其解析                                                                |
| endaxis-data-tool 的 `src/endaxis_data_tool/prepare.py`（`wanted`、`CONFIGS`），以及 `extract.py`、`decoders/` | 已选择目录内的新角色、实体、投射物和敌人模板，以及已登记的全局配置           | 需要新的补充资源类别或字段时，补资源选择、提取和解码；普通新增干员不需要逐个登记资源路径                                                 |
| [game-data-sources.json](game-data-sources.json)                                                               | 所列 TableCfg、Json 集合的全部条目，以及明确列出的单文件                     | 新功能需要额外表、集合或单文件时添加；它控制编译器取哪些来源，不控制游戏最初导出了什么                                                   |
| [exportInstalledGame.py](scripts/exportInstalledGame.py) 的图片目录选择                                        | AKE `ake_tool/image_paths.py` 的 `IMAGE_SOURCE_ROOTS` 加脚本补充目录中的图片 | 新图标位于未覆盖目录时扩展导出范围；随后在 [exportReferencedGameIcons.ts](scripts/exportReferencedGameIcons.ts) 核对引用到来源的定位规则 |

如果修改了导出范围，需要重新导出来源；如果只修改下节的身份或转换配置，可以复用本轮来源。外部工具的路径相对于各自仓库，不要求把它们放在特定本地目录。

### 3. 按新增内容补配置与支持

以下路径均相对于本编译器目录。已有内容的数值变化通常直接重编译；新增身份和机制按对应行处理。

| 新增或变化内容              | 配置及处理方式                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 检查结果                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **干员、技能形态**          | 在 [operators.json](config/operators.json) 登记 `slug`、`gameId`、`charId`、`exportName`，关联 `skills` 的来源与等级轴、`skillGroups`、天赋、潜能及 `runtimeTemplate`。多段、路由和替换技能按实际来源补关联，不按现有干员照抄技能数量。已有模板摘要变化时，核对差异后再更新 `sourceSha256`；明确不接入的模板才列入 `ignoredRuntimeTemplateSourceFiles`。                                                                                                                                                          | `operator-refresh` 无未处理模板、摘要变化或技能库阻塞；候选包含完整养成和技能。发布后在应用的 [干员装配入口](../../src/data/operators/index.ts) 登记通过验收的新干员。 |
| **武器、单件装备**          | 从 `WeaponBasicTable`、`EquipTable` 自动枚举，通常不需要逐个加白名单。标准武器排除 `_ink` 场景变体。资源歧义在 [equipmentAssets.json](config/equipmentAssets.json) 补别名；新动作或词条类型需要补转换和运行支持。                                                                                                                                                                                                                                                                                                 | 候选新增身份与来源一致，装备模拟通过，名称与图标可显示。                                                                                                               |
| **套装**                    | 从 `EquipSuitTable` 自动编译。在 [gearSetIdentities.json](config/gearSetIdentities.json) 更新已审阅身份清单，并在 [gearSetIcons.json](config/gearSetIcons.json) 为套装选择一件所属装备作为图标来源。身份清单用于内容盘点，不是编译白名单。                                                                                                                                                                                                                                                                        | 无未审阅套装；图标关联的装备确属该套装，套装效果模拟通过。                                                                                                             |
| **敌人、关卡变种**          | 基础数据和出生配置从敌人表、模板及 SpawnerConfig 读取。检查 [enemies/hidden-enemies.json](config/enemies/hidden-enemies.json) 的隐藏范围；[runtime-defaults.json](config/enemies/runtime-defaults.json) 只补有依据的运行默认值。新增出生 Buff 先核对作用，在 [birthBuffExclusions.ts](config/enemies/birthBuffExclusions.ts) 明确排除模拟范围外内容，其余补齐转换与执行支持。                                                                                                                                     | 基础敌人与关卡变种的等级、属性、出生 Buff、数量和名称符合来源，未支持机制有明确诊断。                                                                                  |
| **关卡系列、合约关卡**      | 已支持类别由 [generateEnemyStageCatalog.ts](scripts/generateEnemyStageCatalog.ts) 按 DungeonTable 和刷怪器生成。新类别需要补筛选、分组和输出分类逻辑；[enemyStageNames.ts](config/enemyStageNames.ts) 为原生关卡名不足以区分的情况补文本 ID。                                                                                                                                                                                                                                                                     | 关卡选择器中能找到新关卡；系列、难度、敌人名单和出生配置正确。                                                                                                         |
| **合约新词条、新一期**      | [contingencyContractBindings.json](config/contingencyContractBindings.json) 按合约 ID、词条 ID 关联 Buff、宿主和参数；[contingencyContractSimulationScope.json](config/contingencyContractSimulationScope.json) 声明支持、阻塞和裁剪范围。先核对词条描述、补充文件和实际 Buff，不能只凭名称猜。新一期还需核对 [compileEntityValueConsumers.ts](scripts/compileEntityValueConsumers.ts) 的分期编译、图标目录，以及应用的 [合约目录](../../src/data/contingencyContract/contingencyContractCatalog.ts) 等分期入口。 | 每个词条的效果及参数有对应依据；选择、图标、初始化、分享布局和模拟均覆盖该期。客户端缺少效果配置时，确认 AKEDATA 的补充文件已更新。                                    |
| **系统 Buff、特殊状态展示** | 引用闭包外的系统根在 [systemBuffRoots.json](config/systemBuffRoots.json) 登记；全局身份在 [globalBuffIdentities.json](config/globalBuffIdentities.json) 登记。名称和图标补充分别见 [buffPresentationNames.ts](config/buffPresentationNames.ts)、[abilityEntityPresentations.ts](config/abilityEntityPresentations.ts)。                                                                                                                                                                                           | 效果可编译、可触发，状态展示符合配置；展示配置不代替效果实现。                                                                                                         |
| **投射物**                  | 在 [projectileSchedulePresets.ts](config/projectileSchedulePresets.ts) 配置默认回调时序，具体发射入口的覆盖在 [projectileSchedules.ts](config/projectileSchedules.ts)。核对来源技能、回调种类、次数及端点模型；保留的发射必须有显式时间表，缺失配置会阻止生成；无需保留的无回调入口应明确配置裁剪。                                                                                                                                                                                                               | 命中、到达、结束等回调及伤害次数符合配置，相关时间轴时序已检查。                                                                                                       |
| **文本、图标**              | 本地化随候选身份从输入表生成；游戏名称和描述使用来源文本。新图片目录先补导出范围，再核对资源映射；产品术语维护在应用语言文件中。                                                                                                                                                                                                                                                                                                                                                                                  | 中英文身份一致，新增内容没有缺失文本或图标引用。                                                                                                                       |

实体标签动作 `AddTagAction` 的审查配置在 [entityTagPolicies.ts](config/entityTagPolicies.ts)。每个标签必须显式声明保留或过滤并说明依据；目录中已知但未审查的标签也会阻止生成，不继承父标签的处理结论。审查时需追踪原生代码和数据查询的消费者，判断是否影响模拟范围内的行为；保留标签后还需确认对应运行时消费者已实现。该配置不用于裁剪技能事件的 `skillTags`。

普通技能、天赋和潜能按原始动作结构选择编译路径。配置负责提供身份和关联；遇到未知动作、条件或属性类型，要在解析、公共定义及运行时的相应层补支持，不能通过配置伪装为已实现。

### 4. 验证并写入正式产物

配置和代码改好后，先跑相关测试，再用同一批来源重跑候选。确认新增清单中每项都有处理结论：已接入、明确不在模拟范围，或仍然阻塞；仅检查已有对象生成成功会漏掉新内容。

候选验收通过后，使用下面“使用已有来源重跑”的命令加 `--publish`，或重新执行完整本机生成命令。确认报告满足前面的完整成功条件，审阅 Git 差异，并在应用里验证新对象可选、属性与技能正确、图标文本完整。新增应用注册或加载入口也要随生成产物一并检查；文件生成成功不等于界面已接入。

最后提交必要的配置、转换或运行时代码、应用入口及正式生成产物。缓存和研究过程的中间文件不进入提交。

## 修改转换规则

### 代码入口

| 位置                           | 职责                                       |
| ------------------------------ | ------------------------------------------ |
| [scripts/](scripts/)           | 完整流程、领域生成及审计的命令入口         |
| [src/source/](src/source/)     | 读取和校验原生来源格式                     |
| [src/compiler/](src/compiler/) | 转换公共动作、分析依赖、优化和输出代码     |
| [src/domains/](src/domains/)   | 组装干员、装备、敌人、合约、文本等领域产物 |
| [config/](config/)             | 身份关联、模拟范围及展示等人工配置         |
| [test/](test/)                 | 转换及生成流程测试                         |

公共定义类型位于 [packages/game-data-contract](../../packages/game-data-contract/)。原生输入、公共定义与应用运行时的职责，以及优化和资源约定，见[游戏数据架构](../../docs/architecture/game-data.md)。

### 验证修改

在仓库根目录运行类型检查和相关测试：

```sh
npm run type-check:game-data
npm run test:game-data
```

开发时先运行与修改有关的测试。需要验收完整更新时再执行全量生成；它包含格式、类型、资源引用、干员技能和装备模拟等检查。单独调用领域生成脚本不等于完成全量验收。

正式产物由生成器维护，不直接手改生成文件。格式化统一使用 `npm run format:game-data`；加 `-- --check` 只检查格式。

## 使用已有来源重跑

已有来源服务或冻结来源、只需调试编译器时，可以使用较底层的 `rebuild:game-data`，避免重复导出游戏资源：

```sh
npm run rebuild:game-data -- --source-root "<上次运行的sources目录>" --version "<来源版本标识>" --local-base "<来源服务的/api/data地址>" --source-mode local-only
```

来源目录必须包含 `source-provenance.json`；来源服务仍需提供图片。目录、版本标识和服务应对应同一批数据。加 `--publish` 会重新生成并验证后写入正式目录，不直接复制上次候选。

更多底层选项见 [rebuildGameData.ts](scripts/rebuildGameData.ts)。其中 `--tables-only` 仅检查部分表格和装备，`--skip-contingency-contract` 保留现有合约产物、只更新其他领域；两者都不能作为完整版本更新的验收结果。
