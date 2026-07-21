# 游戏文本导出脚本

本文档说明如何使用 `export_game_locales.py` 从 AKEDB CDN 导出 Endaxis 使用的游戏内容文本。脚本用于更新干员名称、技能说明、天赋说明、潜能说明和战斗术语富文本。

## 快速使用

在 Endaxis 仓库根目录执行：

```bash
python3 scripts/export_game_locales/export_game_locales.py
```

默认输出到：

```text
src/i18n/game-locales/zh/operators.json
src/i18n/game-locales/zh/terms.json
src/i18n/game-locales/en/operators.json
src/i18n/game-locales/en/terms.json
```

常用参数：

```bash
# 强制重新拉取 CDN 文件，覆盖本地缓存
python3 scripts/export_game_locales/export_game_locales.py --refresh-cache

# 导出到临时目录，便于 diff 后再决定是否覆盖正式数据
python3 scripts/export_game_locales/export_game_locales.py --output /tmp/endaxis-game-locales

# 指定 AKEDB manifest 版本；默认 latest
python3 scripts/export_game_locales/export_game_locales.py --version latest
```

完整参数可查看：

```bash
python3 scripts/export_game_locales/export_game_locales.py --help
```

## 数据来源

脚本默认读取：

```text
https://data.akedata.wiki/manifest.json
```

再根据 manifest 中的 `latest` 或 `--version` 指定版本定位 `tableCfgPath`，并从 CDN 下载所需表文件。

当前用到的 AKEDB 表：

| 文件                                              | 用途                                     |
| ------------------------------------------------- | ---------------------------------------- |
| `I18nTextTable_CN.json` / `I18nTextTable_EN.json` | 中英文文本表                             |
| `CharacterTable.json`                             | 干员基础入口、名称                       |
| `CharGrowthTable.json`                            | 技能组、技能说明、天赋节点               |
| `CharacterPotentialTable.json`                    | 潜能名称和潜能效果入口                   |
| `PotentialTalentEffectTable.json`                 | 天赋/潜能效果说明和 blackboard           |
| `SkillPatchTable.json`                            | 技能 blackboard 和补丁 blackboard        |
| `HyperlinkTextTable.json`                         | `<#ba.*>` 战斗术语名称、说明、样式和图标 |

下载缓存位于：

```text
~/.cache/endaxis-export-game-locales
```

默认使用缓存；需要刷新时使用 `--refresh-cache`。临时禁用缓存可使用 `--no-cache`。

## 输出结构

`operators.json` 的主要结构：

```json
{
  "arcane": {
    "name": "诀",
    "forms": {
      "int": "阵诀·智",
      "will": "阵诀·意"
    },
    "talents": [],
    "potentials": [],
    "combatSkills": {
      "battleSkill": {
        "name": "摧玉网格",
        "description": "...",
        "forms": {
          "int": {
            "description": "..."
          }
        }
      }
    }
  }
}
```

`terms.json` 的主要结构：

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

## 保留旧文件字段

导出时会读取正式输出目录中已有的 `operators.json`：

- 保留旧文件的干员顺序，减少无意义 diff。
- 保留旧文件中的 `subSkills`，因为当前脚本尚未从 AKEDB 生成子技能名称。
- 保留旧文件中的 `forms` 作为兜底；如果 AKEDB 本次导出了新的 form 标签，以新导出内容为准。

注意：即便使用 `--output /tmp/...` 指定临时目录，旧文件也始终从仓库默认目录 `src/i18n/game-locales` 读取。这可以保证临时导出和正式导出使用同一份排序及手工字段基线。

## 富文本规则

脚本保留并规范化三类富文本标签：

| 标签               | 示例                                             | 输出行为                                                                   |
| ------------------ | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `<@styleId>...</>` | `<@ba.fire>灼热伤害</>`                          | 保留样式标签，运行时由 `src/data/gameRichText.ts` 上色并可显示样式前置图标 |
| `<#termId>...</>`  | `<#ba.burning>燃烧</>`                           | 保留术语标签，运行时可显示术语 tooltip                                     |
| `<image="path">`   | `<image="bufficon/icon_energy_fusion_fire.png">` | 转换为 Endaxis 内部 `/icons/*.webp` 路径                                   |

图标映射集中维护在：

```text
scripts/export_game_locales/export_game_locales.py
```

也就是脚本内的 `ENDAXIS_ICON_PATH_MAP`。如果 AKEDB 新增图片路径，必须先补映射或添加对应资源；脚本不会静默丢弃未知图片。

## 双形态技能说明

诀（Arcane）这类双形态干员的数据来自 AKEDB 技能组里的 `conditionDesc*` 字段。脚本会：

- 读取 `conditionId`，映射到 Endaxis 内部 form key。
- 读取 `conditionName`，汇总到干员级 `forms` 作为形态显示名。
- 将通用技能说明和对应形态的 `conditionPostDesc` 合并为该形态说明。
- 校验但不导出 `conditionDesc` / `conditionDescInactive` 中的“生效/未生效”句子；UI 层负责根据当前实际形态显示 `生效中` 标记。

当前 form key 映射：

| AKEDB suffix | Endaxis form key |
| ------------ | ---------------- |
| `str`        | `strength`       |
| `agi`        | `agility`        |
| `wisd`       | `int`            |
| `will`       | `will`           |

## 严格校验策略

导出脚本的原则是“遇到未知结构直接失败”，避免生成语义缺失但看似正常的 JSON。

会导致导出失败的情况包括：

- 出现未支持的富文本标签。
- `<@...>` / `<#...>` 标签未正确闭合。
- `<image>` 使用未映射图片路径或未知属性。
- 文本引用存在但无法从 `I18nTextTable` 解析。
- blackboard 容器不是列表。
- blackboard 项出现未知字段。
- blackboard 数值不是数字，或字符串字段非空。
- `skillBbModifier` / `attrModifier` / `skillParamModifier` 出现未建模字段类型。
- 占位符变量不存在。
- 占位符表达式不是数字、变量、括号或四则运算。
- 占位符 format 不是已支持格式。

## 更新后检查

推荐流程：

```bash
python3 scripts/export_game_locales/export_game_locales.py --refresh-cache
npm run test -- src/data/gameText.test.ts src/data/gameRichText.test.ts
npm run build
```

如果导出的 JSON diff 很大，先确认 manifest 版本、AKEDB 热更版本和新增干员/术语是否符合预期，再提交。
