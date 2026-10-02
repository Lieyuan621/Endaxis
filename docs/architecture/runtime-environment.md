# 运行环境与布局

运行环境入口位于 `src/platform/runtimeEnvironment.ts`。页面不再各自用 UA、平台字符串或触摸能力拼出一个含义不清的“移动设备”标志。

## 四类独立信息

- 原生壳：只认浏览器 UA 中的 `EndaxisApp/` 标记。它选择原生交互策略，不构成安全认证，也不能保证某个桥接方法存在；调用桥接时仍检查方法。
- 浏览器声明身份：组合 UA 与低熵 UA-CH 的 `mobile` 提示，记录浏览器所声明的平台和移动/桌面身份。它不是硬件识别。桌面 UA 的 iPad 沿用 `MacIntel` 与多点触摸的兼容判断，单独标记。
- 输入能力：触摸支持、主指针精度和悬停能力分别记录。触屏桌面仍有触摸能力；连接鼠标不代表变成另一种设备。
- 视口：使用 `innerWidth` / `innerHeight` 的 CSS 像素，描述当前布局可用尺寸，不读取物理屏幕或高熵设备信息。

`detectRuntimeEnvironment` 是可注入信号的纯分类函数；`readRuntimeEnvironment` 是应用模块读取浏览器环境的统一入口。`observeRuntimeEnvironment` 立即发布快照，再响应窗口调整、旋转和输入媒体查询变化，并返回完整的取消订阅函数。Vue 页面使用 `useRuntimeEnvironment`，由自己的作用域释放监听。

`index.html` 保留一个模块加载前的同步首绘适配：仅检查同一 `EndaxisApp/` 标记来隐藏原生壳下的网页加载面板，防止首帧闪现。它不选择工作台、不推断输入能力；标记契约须与运行环境入口一致。为这一首绘适配改用异步模块或构建时代码注入都会引入额外的启动依赖。

原生桥接保留 `isNativeApp` 便捷入口，但身份判断复用上述快照。语言、剪贴板可用性、具体指针事件的 `pointerType` 和 CSS 媒体查询各有能力语义，不改写成设备分类。

## 时间轴布局策略

`src/ui/timeline/timelineLayoutPolicy.ts` 只负责时间轴工作台选择，按以下顺序处理：

1. Endaxis 原生壳始终使用移动工作台。
2. 浏览器布局宽度超过 1366px 时使用桌面工作台。
3. 没有 Android/iOS UA 标记、声明 X11/Linux 或 X11/CrOS 且 UA-CH `mobile` 不为 true 时，使用桌面工作台，即使主指针粗糙或支持触摸。
4. 其他移动声明、桌面 UA 的 iPad 或粗指针使用移动工作台；剩余情况使用桌面工作台。

第三条尊重 Android Chrome 桌面网站模式的浏览器声明，也适用于真正的 Linux/ChromeOS 触屏桌面。Windows 触屏与 iPad 保留既有策略。浏览器没有跨平台通用的桌面网站开关读取 API，因此这里不承诺识别所有浏览器的菜单设置。

不能把 UA-CH `mobile=false` 单独解释为桌面：普通 Android 平板也可能返回 false。也不能只依赖 UA-CH `platform=Linux`：Chromium 的桌面覆盖可以使用 Linux、Chrome OS 或 Android 提示。依据见 [Chromium 桌面 UA 覆盖实现](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/android/content/content_utils.cc)和 [Chrome 桌面模式说明](https://developer.chrome.com/blog/desktop-mode)。

## 布局与输入继续独立

选择桌面工作台不要求视口能放下所有面板。工作台保留侧栏和时间轴最小尺寸，窄屏时由工作台自身横向滚动；短屏保留三段监视器所需的最小内容高度，通过纵向滚动到达。折叠和尺寸偏好不因视口变小而被重写。

桌面工具栏保留全部操作并允许横向滚动，不用视口断点隐藏唯一入口。时间轴内容与整个工作台分别滚动，空白轨道可使用原生触摸横移，独立滚动槽通过同一滚动事件保持同步。可编辑对象和边界手柄保留独立拖动，布局切换时取消旧工作台的未完成手势。编辑手势仍由各自交互模块负责，不用工作台类型代替指针事件或能力判断。
