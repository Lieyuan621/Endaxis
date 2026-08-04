# 敌人数据生成器

`generate_enemies.py` 根据一份很小的导出清单，从 AKEDB CDN 完整生成
`src/data/enemies/*.ts`，并为缺少头像的敌人下载 PNG 原图、使用 Pillow 转换为 WebP。
脚本不读取旧敌人 TS，因此删除输出目录后仍可重新生成。

## 配置清单

`enemies.json` 只保存 AKEDB 无法替 Endaxis 决定的内容：

- `enemies[].gameId`：选择需要导出的敌人；输出文件名由它自动转换；
- `enemies[].category`：Endaxis 自定义的阵营分组，AKEDB 当前没有对应字段；
- `defaults.staggerNodeDuration`：Endaxis 使用的统一踉跄时长，AKEDB 当前没有对应字段。

名称、强度等级、头像路径和全部战斗数值均不得写入清单。脚本遇到未知字段、重复 ID、
AKEDB 缺失记录或输出目录中的额外 TS 时会直接报错。

## 数据来源

| Endaxis 字段 | AKEDB 来源 |
| --- | --- |
| `name` | `EnemyTemplateDisplayInfoTable.name` + `I18nTextTable_EN` |
| `gameId` | 清单选择的 `EnemyTemplateDisplayInfoTable` 键 |
| `avatar` | 根据 `gameId` 生成 `/Icon_Enemy/{gameId}.webp` |
| `tier` | `EnemyTemplateDisplayInfoTable.displayType` |
| `levelHp` | `EnemyAttributeTemplateTable` 等级属性 `attrType = 1` |
| `def` | 等级属性 `attrType = 3`；若随等级变化则报错 |
| 五类抗性 | `physicalResistance`、`fireResistance`、`crystResistance`、`pulseResistance`、`naturalResistance` |
| `superArmor` | `initialSuperArmor` |
| `maxStagger` | 固定属性 `attrType = 20` |
| `staggerNodeCount` | `poiseKnotPctList` 的长度 |
| `staggerBreakDuration` | 固定属性 `attrType = 21` |
| `finisherRecovery` | `breakingAttackedAtbObtain` |
| `finisherMultiplier` | 固定属性 `attrType = 27`（`BreakingAttackDamageTakenScalar`） |

`displayType` 的原生映射为：`0 normal`、`1 elite`、`2 leader`、`3 advanced`、
`4 boss`。未知值不会猜测，而是终止生成。

## 头像

若 `public/Icon_Enemy/{gameId}.webp` 不存在，脚本从以下 AKEDB 资源路径下载 PNG：

```text
public/images/assets/beyond/dynamicassets/gameplay/ui/sprites/monstericonbig/{gameId}.png
```

转换使用 Pillow 的 RGBA WebP 编码，不调用 ffmpeg。`--check` 模式不会写入文件，缺少头像时
会直接失败。需要安装依赖时执行：

```powershell
python -m pip install Pillow
```

## 使用

```powershell
python scripts/generate_enemies/generate_enemies.py
python scripts/generate_enemies/generate_enemies.py --check
python scripts/generate_enemies/generate_enemies.py --version 1.4.4@8764515-7
```

默认使用 `manifest.json` 中的最新版本。下载会显示表加载阶段，生成过程中每十个敌人输出
一次进度；网络读取失败会自动重试三次。
