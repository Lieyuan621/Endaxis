/**
 * 提示条自带的文案字典。
 *
 * 不往 v3 的 i18n 资源里塞：这个功能是自包含的叠加页，进入时把 `overlay`
 * 命名空间合并进当前语言即可，避免和上游的文案加载策略耦合。
 */
import { i18n } from '../../i18n';

const ZH_CN = {
  title: '游戏内提示',
  open: '游戏内提示',
  openHint: '打开可叠加在游戏画面上的输出轴提示条',
  popupBlocked: '弹窗被拦截：请允许本站弹窗，或手动打开 /overlay',
  loading: '正在加载方案…',
  loadFailed: '读取浏览器方案失败',
  noProject: '浏览器里还没有保存的排轴方案',
  demo: '预览示例',
  close: '关闭',
  emptyTitle: '当前方案还没有动作',
  emptyHint: '回到排轴工具添加动作，或用「智能排轴」生成一条轴；本窗口会自动同步。',
  secondsSuffix: '秒后',
  simulating: '正在计算技力/连携…',
  capHint: '点击开始 / 暂停',
  readyHint: '按空格开始 · 拖住提示条可移动位置',
  desktopHint: '拖动可移动窗口 · Ctrl+Alt+O 鼠标穿透 · Ctrl+Alt+Q 退出',
  desktopLocked: '鼠标穿透中 · Ctrl+Alt+O 解除',
  typeIdle: '准备',
  typeDone: '完成',
  typeStandby: '待命',
  type: {
    battleSkill: '战技',
    comboSkill: '连携技',
    ultimate: '终结技',
    basicAttack: '普攻',
    dive: '下落攻击',
    finisher: '处决',
    other: '技能',
  },
  sp: '技力',
  spNext: '下个 {cost}',
  comboIdle: '连携窗口',
  comboOpen: '连携窗口 {seconds}s',
  controls: {
    play: '开始',
    pause: '暂停',
    reset: '重播',
    settings: '设置',
    reload: '重新载入方案',
    lock: '开启鼠标穿透（不挡游戏点击）',
    unlock: '关闭鼠标穿透（可拖动/操作）',
    quit: '退出提示条',
  },
  settings: {
    title: '提示条设置',
    icon: '图标',
    iconSkill: '技能图标',
    iconPortrait: '干员头像',
    range: '显示范围',
    scale: '缩放',
    width: '宽度',
    showBasic: '显示普攻',
    showBasicHint: '在传送带上同时显示普攻 / 下落攻击 / 处决',
    showResources: '资源条',
    transparent: '透明背景',
    transparentHint: '关闭后显示调试底色；OBS 叠加请保持开启',
    autoStart: '自动开始',
    resetPosition: '重置位置',
    reset: '恢复默认',
    hint: '拖住提示条可移动位置；OBS 可用「浏览器源」加载本页。',
  },
};

const EN = {
  title: 'In-game overlay',
  open: 'Overlay',
  openHint: 'Open an output-axis prompt that can be overlaid on the game',
  popupBlocked: 'Popup blocked: allow popups for this site, or open /overlay manually',
  loading: 'Loading rotation…',
  loadFailed: 'Failed to read the saved project',
  noProject: 'No saved rotation in this browser yet',
  demo: 'Preview demo',
  close: 'Close',
  emptyTitle: 'This rotation has no actions yet',
  emptyHint: 'Add actions in the timeline editor. This window reloads the saved project.',
  secondsSuffix: 's',
  simulating: 'Computing resources…',
  capHint: 'Click to start / pause',
  readyHint: 'Press Space to start · drag the strip to reposition',
  desktopHint: 'Drag to move the window · Ctrl+Alt+O click-through · Ctrl+Alt+Q quit',
  desktopLocked: 'Click-through on · Ctrl+Alt+O to unlock',
  typeIdle: 'READY',
  typeDone: 'DONE',
  typeStandby: 'STANDBY',
  type: {
    battleSkill: 'BATTLE',
    comboSkill: 'COMBO',
    ultimate: 'ULT',
    basicAttack: 'BASIC',
    dive: 'DIVE',
    finisher: 'FINISH',
    other: 'SKILL',
  },
  sp: 'SP',
  spNext: 'next {cost}',
  comboIdle: 'Combo window',
  comboOpen: 'Combo window {seconds}s',
  controls: {
    play: 'Start',
    pause: 'Pause',
    reset: 'Restart',
    settings: 'Settings',
    reload: 'Reload rotation',
    lock: 'Click-through on (won’t block the game)',
    unlock: 'Click-through off (draggable / interactive)',
    quit: 'Quit overlay',
  },
  settings: {
    title: 'Overlay settings',
    icon: 'Icons',
    iconSkill: 'Skill icons',
    iconPortrait: 'Portraits',
    range: 'Range',
    scale: 'Scale',
    width: 'Width',
    showBasic: 'Basic skills',
    showBasicHint: 'Also show basic attacks / dive / finisher on the belt',
    showResources: 'Resource rail',
    transparent: 'Transparent',
    transparentHint: 'Turn off to see a debug backdrop; keep on for OBS overlays',
    autoStart: 'Auto start',
    resetPosition: 'Reset position',
    reset: 'Restore defaults',
    hint: 'Drag the strip to reposition it; in OBS, add this page as a Browser Source.',
  },
};

const MESSAGES: Record<string, typeof ZH_CN> = {
  'zh-CN': ZH_CN,
  zh: ZH_CN,
  en: EN,
};

/** 把 `overlay` 文案合并进当前语言（重复调用安全）。 */
export function ensureOverlayMessages(): void {
  const locale = String(i18n.global.locale.value ?? 'zh-CN');
  const messages = MESSAGES[locale] ?? EN;
  i18n.global.mergeLocaleMessage(locale, { overlay: messages });
}
