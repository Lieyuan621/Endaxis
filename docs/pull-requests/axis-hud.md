# Axis HUD PR 记录 / Pull Request Record

> 本页为早期 PR 的历史记录，不代表当前交付状态。提示条现为桌面专有功能；当前入口与验证命令见[使用说明](../overlay-user-guide.md)。/ This is a historical PR record. The HUD is now desktop-only; see the [current guide](../overlay-user-guide.md) for supported entry points and validation commands.

## PR 标题 / Title

**中文：** 为已模拟轴增加可交互的游戏内提示条与独立桌面悬浮窗

**English:** Add an in-game axis HUD and standalone desktop overlay

## 中文说明

### 概述

将编辑器已经完成的模拟轴导出为只读快照，在浏览器或独立桌面悬浮窗中播放，显示下一操作、干员、技能、计时和模拟资源，便于玩家跟随练习。

### 主要改动

- 增加 HUD 路由、编辑器导出入口、独立快照与设置存储，以及可配置的开始前等待和计时校正。
- 桌面版提供透明置顶窗口、全局快捷键、鼠标穿透、独立用户数据与静默启动器。
- 增加可选的框选参考图案触发。此功能标记为实验：不做 OCR，未针对具体游戏标定，可能漏检或误检。
- 增加中英文使用手册，覆盖启动、操作、快捷键、设置与自动监测限制。

### 快捷键

| 平台   | 快捷键                                     | 操作                                  |
| ------ | ------------------------------------------ | ------------------------------------- |
| 浏览器 | `Space` / `R`                              | 开始或暂停 / 回到起点并暂停           |
| 浏览器 | `← / →`，`Shift+← / →`                     | 跳转 2 秒 / 校正 0.25 秒              |
| 浏览器 | `S` / `I` / `H` / `Esc`                    | 设置 / 图标切换 / 控件显隐 / 关闭设置 |
| 桌面   | `Ctrl+Alt+Space` / `Ctrl+Alt+Home`         | 开始或暂停 / 回到起点并暂停           |
| 桌面   | `Ctrl+Alt+← / →`                           | 校正 0.25 秒                          |
| 桌面   | `Ctrl+Alt+O` / `Ctrl+Alt+R` / `Ctrl+Alt+Q` | 鼠标穿透 / 重载 HUD / 退出            |

### 边界与兼容性

HUD 只消费已完成的模拟结果，不重跑模拟；不读取、注入或控制游戏进程。屏幕监测默认关闭，仅在用户启动时采样，并在本机内存中匹配所选区域；仅保存裁剪后的参考图和位置数据。模拟内核和根依赖清单未修改。桌面悬浮窗需在窗口或无边框窗口模式验收，无法保证覆盖独占全屏。

### 文档

- [中英文使用手册](../overlay-user-guide.md)
- [桌面功能与开发说明](../architecture/desktop.md)

### 验证记录

- 应用测试：4,150 项通过。
- 桌面测试：44 项通过；浏览器交互测试：5 项通过。
- 类型检查与生产构建通过。
- GitHub Actions： [CI（Windows/Linux）](https://github.com/tensor4627/Endaxis/actions/runs/39118846023)；[Overlay desktop（Windows/Linux）](https://github.com/tensor4627/Endaxis/actions/runs/39118845978)。

## English description

### Summary

Export a completed editor simulation as a read-only snapshot and play it in the browser or a standalone desktop overlay. The HUD shows the next action, operator, skill, timing, and simulated resources for practice.

### Changes

- Add a HUD route, editor export entry point, isolated snapshot and preference storage, configurable start delay, and timing correction.
- Add a transparent always-on-top desktop window, global shortcuts, click-through, isolated user data, and a silent launcher.
- Add an optional user-selected screen-pattern trigger. It is experimental: there is no OCR or per-game reliability calibration, and false or missed matches are possible.
- Add a Chinese and English user guide covering launch, playback, shortcuts, settings, and trigger limitations.

### Shortcuts

| Platform | Shortcut                                   | Action                                                     |
| -------- | ------------------------------------------ | ---------------------------------------------------------- |
| Browser  | `Space` / `R`                              | Play or pause / reset to start and pause                   |
| Browser  | `← / →`, `Shift+← / →`                     | Seek 2 seconds / adjust timing by 0.25 seconds             |
| Browser  | `S` / `I` / `H` / `Esc`                    | Settings / toggle icons / toggle controls / close settings |
| Desktop  | `Ctrl+Alt+Space` / `Ctrl+Alt+Home`         | Play or pause / reset to start and pause                   |
| Desktop  | `Ctrl+Alt+← / →`                           | Adjust timing by 0.25 seconds                              |
| Desktop  | `Ctrl+Alt+O` / `Ctrl+Alt+R` / `Ctrl+Alt+Q` | Click-through / reload HUD / quit                          |

### Boundaries and compatibility

The HUD consumes a completed simulation result; it does not rerun the simulator or read, inject into, or control the game process. Screen monitoring is off by default and only samples after the user starts it. Matching runs locally in memory; only the selected reference crop and its region are stored locally. The simulation core and root dependency manifests are unchanged. The desktop overlay should be validated in windowed or borderless-windowed mode; exclusive fullscreen is not guaranteed.

### Documentation

- [Bilingual user guide](../overlay-user-guide.md)
- [Desktop implementation and development notes](../architecture/desktop.md)

### Validation record

- Application tests: 4,150 passed.
- Desktop tests: 44 passed; browser interaction tests: 5 passed.
- Type checks and production build passed.
- GitHub Actions: [CI (Windows/Linux)](https://github.com/tensor4627/Endaxis/actions/runs/39118846023); [Overlay desktop (Windows/Linux)](https://github.com/tensor4627/Endaxis/actions/runs/39118845978).
