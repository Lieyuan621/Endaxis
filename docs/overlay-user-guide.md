# 桌面版与游戏内提示条

桌面版提供与网页相同的排轴编辑器，并可在游戏上方显示提示条。提示条播放已经导出的模拟结果，显示计划中的技能与模拟资源；它不读取游戏战斗状态，也不控制游戏操作。

## 启动便携版

1. 解压 Windows x64 ZIP 包，保留目录内的所有运行文件。
2. 双击 `Endaxis.exe` 打开编辑器，无需安装 Node.js。
3. 第一次从网页版转用时，分别导出并导入项目、干员预设。桌面版与浏览器不共享本地存档。
4. 选好方案，等待模拟完成，点击工具栏的「游戏内提示」。

项目、预设、偏好与窗口配置保存在 EXE 同级的 `data/`。移动应用时一起移动该目录。更新前退出应用，将新版本程序文件覆盖到原目录并保留 `data/`；也可解压到新目录后转移 `data/`。请把应用放在可写目录中。

关闭提示条会结束播放、销毁设置和框选窗口，并停止监测。再次点击「游戏内提示」创建新的提示条，读取最新导出的方案和已保存偏好。关闭设置窗口不会关闭提示条。编辑器和提示条均关闭后，应用退出。

## 播放与调整

提示条默认在开始前等待 2 秒，可在独立设置窗口中调整到 0–10 秒。轴中的负时间准备动作另行保留。暂停后继续会保留剩余等待时间；回到起点会重置并暂停。

| 全局快捷键       | 操作                |
| ---------------- | ------------------- |
| `Ctrl+Alt+Space` | 开始或暂停          |
| `Ctrl+Alt+Home`  | 回到起点并暂停      |
| `Ctrl+Alt+← / →` | 延后 / 提前 0.25 秒 |
| `Ctrl+Alt+O`     | 开关鼠标穿透        |
| `Ctrl+Alt+R`     | 重新载入提示条      |
| `Ctrl+Alt+Q`     | 退出桌面应用        |

提示条关闭后，其专用快捷键释放。恢复操作的快捷键被其它程序占用时，会禁用鼠标穿透，避免无法操作窗口。

拖动主体移动提示条，拖动左右边缘调整宽度，拖动下方两角调整缩放。设置按钮打开独立窗口，可调整显示范围、不透明度和开始前等待。设置即时生效。

修改方案后重新导出。正在播放的提示条保持当前快照，暂停后载入新快照。资源条是模拟预测，不是游戏实时读数；实战偏离计划时需要手动校时。

## 屏幕触发（实验功能）

此功能匹配用户框选的参考图案，不读取倒计时数字，也不持续同步战斗。默认不监测，每次仅触发一次。

1. 暂停提示条，让待监测画面出现在提示条所在的显示器上。
2. 在设置中选择「框选并保存参考」，圈选稳定的画面结构并确认。
3. 点击「开始监测」。如果图案已经存在，会先等待它消失，再等待重新出现；连续两次匹配后启动一次并停止监测。
4. 自动开始从轴起点播放，跳过手动开始前等待。手动播放、回到起点、重载或关闭提示条会取消监测。

图案出现时机不一定等于战斗开始。遮挡、菜单、HDR、分辨率及缩放变化可能影响结果；识别延迟也不等于精确的游戏帧时间。请自行核对实战效果，不稳定时使用手动快捷键。参考图仅保存在本机，完整屏幕帧只在内存中处理。

## 开发与打包

开发环境使用仓库声明的 Node.js 版本，在根目录执行：

```sh
npm ci
npm ci --prefix desktop
npm --prefix desktop start
```

检查与打包：

```sh
npm run type-check
npm run type-check:desktop
npm --prefix desktop test
npm run test:desktop
npm run build
npm run package:desktop
npm run test:desktop:windows
```

ZIP 输出到 `desktop/release/`。最后一项测试运行打包后的 Windows 程序，验证提示条与设置窗口及便携存储。它不要求安装 Playwright 浏览器。网页构建仍输出到根目录 `dist/`，不包含提示条功能。

[Desktop application 工作流](../.github/workflows/desktop.yml)在 Linux 和 Windows 的 Node.js 22.12.0 环境检查原生测试、桌面类型和界面测试。独立 Windows 任务先构建并打包 ZIP，再运行实际 EXE 的验收；ZIP 和失败时的 `test-results/desktop/` 作为构建附件保留 14 天。

结构与数据边界见[桌面应用架构](architecture/desktop.md)。

## English

Extract the Windows x64 ZIP and run `Endaxis.exe`. Node.js is not required. Keep all runtime files together. The app stores projects, presets and preferences in the adjacent `data/` folder. Exit before updating, replace program files and keep `data/`; move that folder with the application. Import projects and presets separately from your browser on first use.

The desktop editor shares the web editor's simulation. Select a plan, wait for it to finish simulating, and select **In-game HUD**. The overlay plays an exported snapshot, not live game state. Export again after editing; a playing overlay accepts the new snapshot when paused.

Closing the overlay destroys it, its settings window and any active screen monitoring. Opening it again creates a new playback session with saved preferences. Closing Settings alone keeps the overlay running. The application exits when both the editor and overlay are closed.

Use `Ctrl+Alt+Space` to play or pause, `Ctrl+Alt+Home` to reset, `Ctrl+Alt+Left/Right` to adjust timing by 0.25 seconds, `Ctrl+Alt+O` for click-through, `Ctrl+Alt+R` to reload the overlay, and `Ctrl+Alt+Q` to quit. Overlay shortcuts are released when it closes. Drag the body to move, the sides to resize, and the lower corners to scale. Settings opens in a separate window and applies changes immediately.

Screen-triggered playback remains experimental. Select a reference pattern, then arm monitoring for one attempt. An already visible pattern must disappear and return; two matches trigger playback from the plan's start, skipping the manual delay. This is not OCR or continuous game synchronization. Occlusion, menus, display settings and capture latency may affect timing or cause false matches. Use manual controls if unreliable. Full-screen frames are processed only in memory; only the reference crop is saved locally.

## 按键时机反馈

按键时机反馈始终开启，不需要在设置中启用。仅 Windows 桌面端可用，点击开始后读取键盘及首个已连接的 XInput 手柄，无需游戏处于前台。暂停、播放结束或关闭提示条会停止监听；无需管理员权限或安装额外运行环境。

沿用默认键位：键盘 1～4 为战技，长按为终结技，E 为连携，F1～F4 为切人；手柄 LB＋X/Y/B/A 为战技，同组合长按为终结技，RB 为连携，LB＋左/上/右/下为切人。目前长按识别阈值为 0.2 秒，达到阈值立即触发，无需松开；自定义键位和非 XInput 模式暂不支持。

播放时，输入与对应计划动作相差不超过设置的匹配窗口（默认前后 0.25 秒，可调为 0.05～1 秒），图标外圈会短暂亮起。战技在松开后按按下时刻匹配；终结技在达到长按阈值时匹配，不重复确认战技。连携按时间窗内的计划顺序逐个确认，一次按键只确认一个。切人对应方案中的手动切人标记。鼠标左键或手柄 X 按住期间，每个播放帧按顺序匹配窗口内最早的未确认普攻、重击、下落攻击或处决；一次只确认一个，匹配不到就忽略。LB＋X 属于战技组合，不作为攻击输入。

亮圈只表示按键时机匹配，不代表游戏实际施放成功。反馈不会更改轴时间、模拟结果或方案。暂停期间不判定；重新开始、手动校时或切换方案会清空确认记录。
