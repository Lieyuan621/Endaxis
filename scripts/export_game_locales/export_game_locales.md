# 游戏文本导出流程

本文档记录如何从 AKEDatabase 导出干员技能、天赋、潜能说明，并保留富文本语义。后续数据更新或新增干员时，可按本文流程重新生成游戏内容文本。

首次导出基于AKEDatabase修订号：04140ece8f14327fc6ca26a57f62a2364253f086

## 导出流程

执行：

```bash
python3 /path/to/export_game_locales.py \
  /path/to/AKEDatabase/public/TableCfg \
  /path/to/Endaxis/src/i18n/game-locales
```

导出完成后应检查导出结果是否符合预期。

## 目标

导出流程产出四个文件：

```text
src/i18n/game-locales/zh/operators.json
src/i18n/game-locales/zh/terms.json
src/i18n/game-locales/en/operators.json
src/i18n/game-locales/en/terms.json
```

`operators.json` 保存干员名、技能名、技能描述、天赋描述、潜能描述。导出时参考旧文件的干员顺序，并保留旧文件中的 `subSkills` 信息。

`terms.json` 保存战斗相关的术语。

其他游戏文本相关文件暂不支持导出。

描述字段保留 `<@...>`、`<#...>`、`<image...>` 富文本标签。并用 blackboard 解析结果替换占位符。

## 数据源

| AKEDB 文件                                          | 用途                                                 |
|---------------------------------------------------|----------------------------------------------------|
| `CharacterTable.json`                             | 干员名称、干员基础入口                                        |
| `CharGrowthTable.json`                            | 技能组、天赋节点、技能描述                                      |
| `CharacterPotentialTable.json`                    | 潜能名称与潜能效果入口                                        |
| `PotentialTalentEffectTable.json`                 | 天赋/潜能效果说明与 blackboard                              |
| `SkillPatchTable.json`                            | 技能/效果 blackboard，用于替换 `{value:format}` 占位符         |
| `I18nTextTable_CN.json` / `I18nTextTable_EN.json` | 中英文文本解析                                            |
| `HyperlinkTextTable.json`                         | `<#ba.*>` 战斗术语的名称、说明、图标、样式 ID                      |
| `RichTextStyleTable.json`                         | 当前 Endaxis 已将颜色和样式前置图标固化到 `gameRichText.ts`，不通过它转换 |
| `public/images/TermIcon/icon_term_ba_*.png`       | 术语相关富文本所用的图标，转换为webp后放在public/icons目录下             |

## 废案管理员过滤

AKEDB 中保留了废案管理员 `chr_0002_endminm` 和 `chr_0003_endminf`，当前实际使用的管理员是 `chr_9000_endmin`。导出脚本会显式排除这两个废案角色，避免废案天赋文本和 blackboard 进入转换流程。

## terms.json 结构

```json
{
  "ba.burning": {
    "name": "法术异常 - 燃烧",
    "description": "...",
    "styleId": "ba.fire",
    "iconPath": "/icons/icon_term_ba_burning.webp"
  }
}
```

字段语义：

| 字段 | 含义 |
| --- | --- |
| `name` | 术语显示名，可继续包含富文本标签 |
| `description` | 术语解释，可继续包含富文本标签和内联图标 |
| `styleId` | 文本样式 ID；Endaxis 用它查固定样式表，得到颜色和可选前置图标 |
| `iconPath` | Endaxis 内部图标路径，必须是 `/icons/*.webp` 形式 |

## 标签规则

当前保留三类标签：

| 标签 | 示例 | Endaxis 行为                                             |
| --- | --- |--------------------------------------------------------|
| `<@styleId>...</>` | `<@ba.fire>灼热伤害</>` | 按 `gameRichText.ts` 中固定样式表上色；若 AKEDB 样式带 image，则显示前置图标 |
| `<#termId>...</>` | `<#ba.burning>燃烧</>` | 按术语 `styleId` 上色；若术语有解释，则显示下划线、前置图标和 tooltip           |
| `<image="path">` | `<image="/icons/icon_energy_fusion_fire.webp">` | 渲染为行内图标；导出阶段转成 Endaxis 的icon路径                         |

## 图标映射

图标映射集中在 `scripts/export/export_operators_json.py` 的 `ENDAXIS_ICON_PATH_MAP` 中维护。

导出时会做两件事：

1. 把 `HyperlinkTextTable.json` 里的 `iconPath` 转成 Endaxis 内部路径，写入术语 `iconPath`。
2. 把描述文本里的 `<image="...">` 标签同步改写成 Endaxis 内部路径。

如果 AKEDB 后续新增术语或新增内联图标，必须先给 `ENDAXIS_ICON_PATH_MAP` 增加明确映射，或补充对应的内部图标资源。无法映射的术语图标或 `<image>` 标签会让导出直接失败，避免静默丢失数据或在运行时出现坏图。

## styleId 与 iconPath 的关系

目前用iconPath的图标覆盖styleId的图标，但不知道为什么要存在这样的覆盖关系，数据源就这样。

## 严格校验

导出脚本会在写入 JSON 前严格扫描富文本和占位符数据：

- 只接受 `<@styleId>...</>`、`<#termId>...</>`、`</>` 和 `<image="...">`。
- AKEDB 源数据里的 `<image>` 可以带已知属性，但输出统一写成 `<image="/icons/xxx">`。
- 图片路径必须能映射到 Endaxis 内部 `/icons/...` 路径。
- 标签必须正确闭合，不能出现未匹配的 `</>` 或未闭合的 `<@...>` / `<#...>`。
- `blackboard` 必须是列表，每项只能包含 `key`、`value`、`valueStr`。
- `blackboard.key` 必须是非空字符串，`blackboard.value` 必须是数值，`blackboard.valueStr` 只能为空。
- `skillBbModifier.floatValue` 必须是数值，`skillBbModifier.stringValue` 只能为空；如果后续 AKEDB 开始使用字符串型黑板值，需要先显式建模。
- 描述里的 `{expr:format}` 占位符必须能从已建模的 blackboard 或 modifier 数值解析，且 format 必须是已支持的数字格式。

任何未预料的标签、未映射图片、闭合错误、未知 blackboard 数据类型、未知占位符变量或未支持的占位符格式都会抛出异常并中止导出。这样做的目的是让数据结构变化在导出阶段暴露，而不是生成看似成功但语义缺失的 JSON。

TODO 后续应校验未在RICH_TEXT_STYLES里配置的ba.*样式标签
