# 游戏内提示条使用手册 / In-Game Axis HUD User Guide

## 中文

游戏内提示条（Axis HUD）把编辑器**已经完成的模拟结果**导出为只读快照，在练习时显示下一位干员、技能、时间和模拟资源。它不会在 HUD 里重新运行模拟，也不会读取或控制游戏。

### 首次启动

Windows 需要 Node.js 22.12 或更新版本。若依赖尚未安装，在项目根目录运行 `npm ci`，再运行 `npm ci --prefix desktop`。之后双击 `desktop/start-desktop.cmd`。启动器在后台打开编辑器和透明置顶 HUD，CMD 窗口会退出；错误和运行输出记录在 `%LOCALAPPDATA%\EndaxisOverlay\launcher\`。

桌面版与浏览器使用不同的本地存档。第一次使用桌面版时，先在原浏览器导出项目 JSON，再在桌面编辑器导入。选好角色与方案，等待模拟完成并检查输入告警，然后点击「游戏内提示」导出快照。修改方案后再次导出；正在播放的 HUD 保留当前快照，暂停后载入新快照。

### 开战与计时

1. 在设置中按怪物实际出现的延迟调整「开始前等待」，默认 2 秒，可设为 0–10 秒；设为 0 会关闭额外等待。
2. 在游戏中按 `F` 开战后，立即按 `Ctrl+Alt+Space` 开始计时。HUD 不捕获 `F`，也不会自动响应这个游戏按键。
3. 左侧先显示等待倒计时，之后开始播放轴。暂停再继续会保留剩余等待时间；回到起点会重置并暂停，再开始时重新等待完整时长。
4. 轴自身的负时间准备动作会保留；等待结束后再进入轴时间。时间校正快捷键在等待阶段也有效。

### 快捷键对照表

| 环境                           | 快捷键           | 中文操作                               | English                                       |
| ------------------------------ | ---------------- | -------------------------------------- | --------------------------------------------- |
| 浏览器 / Browser               | `Space`          | 开始或暂停                             | Play or pause                                 |
| 浏览器 / Browser               | `R`              | 回到起点并暂停                         | Reset to start and pause                      |
| 浏览器 / Browser               | `← / →`          | 前后跳转 2 秒                          | Seek by 2 seconds                             |
| 浏览器 / Browser               | `Shift+← / →`    | 延后 / 提前 0.25 秒                    | Delay / advance by 0.25 seconds               |
| 浏览器 / Browser               | `S`              | 打开设置                               | Open settings                                 |
| 浏览器 / Browser               | `I`              | 切换技能图标与头像                     | Toggle skill icons and portraits              |
| 浏览器 / Browser               | `H`              | 显示或隐藏控制栏                       | Show or hide controls                         |
| 浏览器 / Browser               | `Esc`            | 关闭设置                               | Close settings                                |
| Windows 桌面 / Windows desktop | `Ctrl+Alt+Space` | 开始或暂停                             | Play or pause                                 |
| Windows 桌面 / Windows desktop | `Ctrl+Alt+Home`  | 回到起点并暂停                         | Reset to start and pause                      |
| Windows 桌面 / Windows desktop | `Ctrl+Alt+← / →` | 延后 / 提前 0.25 秒                    | Delay / advance by 0.25 seconds               |
| Windows 桌面 / Windows desktop | `Ctrl+Alt+O`     | 切换鼠标穿透；穿透时再次按下可恢复操作 | Toggle click-through; press again to interact |
| Windows 桌面 / Windows desktop | `Ctrl+Alt+R`     | 重载 HUD；按设置决定是否自动播放       | Reload HUD; auto-play follows settings        |
| Windows 桌面 / Windows desktop | `Ctrl+Alt+Q`     | 退出桌面版                             | Quit the desktop app                          |

桌面全局快捷键不需要把游戏切到后台。`← / →` 校正方向是以提示为准：左键延后，右键提前。若快捷键被游戏或其他程序占用，请检查启动日志；鼠标穿透解锁键不可用时，程序会禁用穿透以保留恢复入口。

### 显示与鼠标

在设置中调整显示范围、宽度、缩放、不透明度、技能图标或头像、普攻和资源条。HUD 窗口可拖动；设置面板和按钮可直接点击。开启鼠标穿透后，HUD 不会挡住游戏点击，按 `Ctrl+Alt+O` 解除后再操作控件。

桌面悬浮窗适用于无边框或窗口模式，不能保证覆盖独占全屏。请在实际显示器和游戏窗口中确认置顶、缩放及快捷键行为。

### 屏幕倒计时自动启动（实验功能）

此功能只对用户框选区域的参考图案做画面相似度匹配，**不识别倒计时数字，也没有针对具体游戏完成可靠性标定**。

1. 让游戏倒计时出现在 HUD 所在的显示器，将 HUD 与设置面板移出要监测的位置，并暂停 HUD。
2. 打开设置，选择「框选并保存参考」。框选界面会暂时隐藏 HUD 并冻结一帧；圈住尽量固定的边框、冒号或标识，按 Enter 或点击「确认」，按 Esc 取消。
3. 监测默认关闭。保存参考后，点击「开始监测」才会启动一次监测；每次重试都要重新点击。若参考图案此刻仍在画面中，监测会先等它消失，再等它重新出现。连续两帧匹配后触发一次并停止。
4. 自动触发会从轴起点播放、跳过手动「开始前等待」，并把确认期间经过的时间计入播放位置。手动开始、回到起点、重新载入 HUD 或退出会取消监测；重试时需重新开始监测。

画面移动、数字变化、遮挡、HDR、UI 缩放、独占全屏或显示器分辨率/缩放/旋转改变都可能造成漏检或误检。显示器变化会停止监测，需重新框选。监测约每 200 毫秒取样，实际触发还受截图和连续两帧确认延迟影响。先在窗口或无边框模式练习；不稳定时使用手动快捷键。捕获的屏幕帧只在内存中处理，应用只在本机保存小块参考图和区域信息，不保存整屏或上传图像。需要重新框选时，可先点击「清除参考」。

### 快速排查

- HUD 没有正确的轴：在桌面编辑器导入方案，等模拟完成后重新点击「游戏内提示」。
- 开始时机不合适：先用手动「开始前等待」；自动监测不稳定时关闭它。
- HUD 挡住操作：按 `Ctrl+Alt+O` 切换鼠标穿透；需要调设置时先解除穿透。
- 控件不能点击：确认鼠标穿透已关闭，再检查游戏是否处于独占全屏。
- 启动或快捷键异常：查看 `%LOCALAPPDATA%\EndaxisOverlay\launcher\` 中最新的 `launcher`、`stdout` 和 `stderr` 日志。

## English

Axis HUD displays a **read-only snapshot of a completed simulation**: the next operator, skill, timing, and simulated resources. It does not run the simulator again, read the game process, or control the game.

### First launch

Windows requires Node.js 22.12 or later. If dependencies are not installed, run `npm ci` at the repository root, then `npm ci --prefix desktop`. Double-click `desktop/start-desktop.cmd` to start the editor and transparent always-on-top HUD. The CMD window closes; startup and runtime logs are written to `%LOCALAPPDATA%\EndaxisOverlay\launcher\`.

Desktop and browser saves are separate. Export your project as JSON from the browser and import it into the desktop editor. Select the team and plan, wait for the simulation to finish, review input warnings, then click **In-game HUD** to export a snapshot. Export again after changing the plan. A playing HUD keeps its current snapshot and loads the new one when paused.

### Starting and timing

1. In Settings, adjust **Start delay** to match the time until the enemy appears. It defaults to 2 seconds and accepts 0–10 seconds; 0 disables the extra delay.
2. Press `F` in the game, then immediately press `Ctrl+Alt+Space` to start the HUD timer. The HUD does not capture or respond to `F`.
3. The left timer shows the delay countdown before the axis starts. Pausing preserves the remaining delay. Reset returns to the start and pauses; the next play waits the full delay again.
4. Negative-time preparation actions in the axis remain intact. Time adjustment shortcuts also work during the delay.

### Shortcut reference

| Environment     | Shortcut         | 中文操作                               | English                                       |
| --------------- | ---------------- | -------------------------------------- | --------------------------------------------- |
| Browser         | `Space`          | 开始或暂停                             | Play or pause                                 |
| Browser         | `R`              | 回到起点并暂停                         | Reset to start and pause                      |
| Browser         | `← / →`          | 前后跳转 2 秒                          | Seek by 2 seconds                             |
| Browser         | `Shift+← / →`    | 延后 / 提前 0.25 秒                    | Delay / advance by 0.25 seconds               |
| Browser         | `S`              | 打开设置                               | Open settings                                 |
| Browser         | `I`              | 切换技能图标与头像                     | Toggle skill icons and portraits              |
| Browser         | `H`              | 显示或隐藏控制栏                       | Show or hide controls                         |
| Browser         | `Esc`            | 关闭设置                               | Close settings                                |
| Windows desktop | `Ctrl+Alt+Space` | 开始或暂停                             | Play or pause                                 |
| Windows desktop | `Ctrl+Alt+Home`  | 回到起点并暂停                         | Reset to start and pause                      |
| Windows desktop | `Ctrl+Alt+← / →` | 延后 / 提前 0.25 秒                    | Delay / advance by 0.25 seconds               |
| Windows desktop | `Ctrl+Alt+O`     | 切换鼠标穿透；穿透时再次按下可恢复操作 | Toggle click-through; press again to interact |
| Windows desktop | `Ctrl+Alt+R`     | 重载 HUD；按设置决定是否自动播放       | Reload HUD; auto-play follows settings        |
| Windows desktop | `Ctrl+Alt+Q`     | 退出桌面版                             | Quit the desktop app                          |

Global desktop shortcuts work while the game stays in the foreground. For timing correction, left delays the HUD and right advances it. If another app owns a shortcut, check the latest startup logs. Click-through is disabled when its recovery shortcut is unavailable.

### Display and mouse

Settings include display range, width, scale, opacity, skill icons or portraits, basic attacks, and resource bars. Drag the HUD to move it; settings and controls remain clickable. Turn click-through on to avoid blocking game input, then press `Ctrl+Alt+O` again before using HUD controls.

The desktop overlay is intended for borderless-windowed or windowed play. Exclusive fullscreen, always-on-top behavior, display scaling, and shortcut conflicts must be checked on your setup.

### Screen-triggered start (experimental)

This feature compares a user-selected reference pattern with the selected screen region. It **does not read countdown digits, and has not been calibrated for reliability in a specific game**.

1. Show the game timer on the HUD's display, move the HUD and Settings away from the target area, and pause the HUD.
2. In Settings, select **Select and save reference**. The picker temporarily hides the HUD and freezes a frame. Select a stable border, colon, or marker; press Enter or click Confirm, or press Esc to cancel.
3. Monitoring is off by default. Click **Start monitoring** to arm one attempt; manually start it again for every retry. If the pattern is already visible, monitoring first waits for it to disappear, then waits for it to reappear. Two consecutive matching frames trigger playback once and stop monitoring.
4. Automatic playback starts at the axis origin, skips the manual Start delay, and accounts for time elapsed during confirmation. Manual play, reset, HUD reload, or exit cancels monitoring. Start monitoring again for another attempt.

Motion, changing digits, occlusion, HDR, game UI scaling, exclusive fullscreen, and display resolution, scaling, or rotation changes can cause missed or false matches. A display change stops monitoring and requires a new selection. Sampling is about every 200 ms, plus screen-capture and two-frame confirmation latency. Test in windowed or borderless mode first; use manual shortcuts if matching is unreliable. Captured frames are processed in memory. Only the small reference crop and region data are stored locally; full-screen images are not saved or uploaded. Select **Clear reference** to remove the saved reference.

### Troubleshooting

- Wrong or missing axis: import the plan into the desktop editor, wait for simulation to finish, and click **In-game HUD** again.
- Start time feels wrong: use the manual Start delay first; disable screen monitoring if it is unreliable.
- HUD blocks game input: toggle click-through with `Ctrl+Alt+O`; turn it off before changing settings.
- Controls do not respond: confirm click-through is off and check whether the game is using exclusive fullscreen.
- Startup or shortcut issue: inspect the latest `launcher`, `stdout`, and `stderr` files under `%LOCALAPPDATA%\EndaxisOverlay\launcher\`.
