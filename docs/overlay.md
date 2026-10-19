# 游戏内提示条开发说明

本文说明 Axis HUD 的数据边界、代码入口和验证方式。用户操作步骤、快捷键与实验性屏幕触发说明集中在[中英文使用手册](overlay-user-guide.md)。

## 数据流与职责

编辑器等待当前方案的完整模拟结果后，由 `exportEditorOverlay.ts` 调用 `projectPlan.ts`，从已发布结果和现有只读展示投影提取操作、时间、费用和资源。`snapshot.ts` 将结果保存为独立快照；`/overlay` 路由只加载快照并交给 HUD 播放。HUD 不启动模拟、不编辑项目，也不写入编辑器的自动保存数据。

浏览器 HUD 与 Electron HUD 共用同一套页面、播放和偏好逻辑。桌面外壳位于 `desktop/`，负责启动本地服务、编辑器窗口和透明悬浮窗，并隔离各工作树的用户数据。屏幕触发由桌面主进程采集选定显示器的画面，在内存中裁切并比较用户保存的小块参考图；它不读取游戏进程或倒计时数字，默认关闭，可靠性尚未针对具体游戏标定。

## 修改边界

- Web 接入点限于 HUD 路由、编辑器工具栏导出入口及快照读写；展示和播放实现集中在 `src/ui/overlay/`。
- 桌面平台专属代码、依赖、启动入口和测试集中在 `desktop/`，不增加根目录运行依赖。
- HUD 只消费已完成的模拟结果和现有展示投影，不修改模拟规则、战斗状态、项目格式或自动保存流程。
- 浏览器、桌面壳和 OBS 浏览器源使用各自的本地存储，不假定它们会自动共享快照。

主要入口：

| 位置                                                 | 职责                             |
| ---------------------------------------------------- | -------------------------------- |
| `src/ui/overlay/exportEditorOverlay.ts`              | 校验并导出当前已完成的模拟结果   |
| `src/ui/overlay/projectPlan.ts`、`plan.ts`           | 将发布结果转换成纯展示计划       |
| `src/ui/overlay/snapshot.ts`、`preferences.ts`       | 隔离 HUD 快照和偏好存储          |
| `src/ui/overlay/playback.ts`、`OverlayView.vue`      | 播放状态、计时校正和页面呈现     |
| `desktop/main.cjs`、`launch.cjs`                     | 桌面窗口、全局输入和应用生命周期 |
| `desktop/countdown-trigger.cjs`、`region-picker.cjs` | 参考区域选择与本地画面匹配       |

## 验证

按[开发指南](development/README.md)选择相关检查。HUD 的主要回归命令如下：

```sh
npm run type-check
npx vitest run src/ui/overlay src/router/index.test.ts --maxWorkers=1
npm test --prefix desktop
npm run test:browser -- tests/browser/overlay.spec.ts --project=chromium
npm run build
```

浏览器交互测试覆盖快照导出、播放、快捷键和设置；桌面测试以原生 API mock 验证窗口控制、区域选择、屏幕触发与启动器行为。发布前还需按[使用手册](overlay-user-guide.md)检查真实桌面环境中的全局快捷键、鼠标穿透、屏幕缩放和窗口模式；自动化测试不能证明特定游戏、独占全屏或多显示器组合可靠。
