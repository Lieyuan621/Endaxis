<script setup>
import { computed, onMounted } from 'vue';
import { useTimelineStore } from './stores/timelineStore.js';
import { useI18n } from 'vue-i18n';
import { getElementPlusLocale } from '@/i18n/elementPlusLocale';
import { markBootReady } from '@/utils/bootLoader';

const store = useTimelineStore();
const { locale } = useI18n({ useScope: 'global' });
const elementLocale = computed(() => getElementPlusLocale(locale.value));

onMounted(async () => {
  try {
    // 1. 先初始化基础游戏数据
    await store.fetchGameData();

    // 2. 尝试读取浏览器缓存
    await store.loadFromBrowser();

    // 3. 无论是否读取成功，都开启监听以进行后续的自动保存
    store.initAutoSave();
  } finally {
    markBootReady('data');
  }
});
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<style>
body,
html,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--ea-bg, #18181c);
  color: var(--ea-fg, #f0f0f0);
  overflow: hidden;
}

html.dark {
  --el-bg-color-overlay: #1e1e1e !important;
  --el-dialog-bg-color: #1e1e1e !important;
  --el-fill-color-blank: #333333 !important;
}

html.dark .el-overlay-dialog .el-dialog {
  background-color: #1e1e1e !important;
  background-image: none !important;
}

html.dark .el-dialog__header,
html.dark .el-dialog__body,
html.dark .el-dialog__footer {
  background-color: #1e1e1e !important;
}

html[data-theme='light'] {
  --el-bg-color-overlay: #ffffff !important;
  --el-dialog-bg-color: #ffffff !important;
  --el-fill-color-blank: var(--ea-surface-soft) !important;
}

html[data-theme='light'] .el-overlay-dialog .el-dialog {
  background-color: var(--ea-dialog-bg, #ffffff) !important;
  background-image: none !important;
  border: 1px solid var(--ea-dialog-border, #d8dbe0);
  box-shadow: 0 18px 48px var(--ea-shadow-strong, rgba(26, 27, 30, 0.18));
}

html[data-theme='light'] .el-dialog__header,
html[data-theme='light'] .el-dialog__body,
html[data-theme='light'] .el-dialog__footer {
  background-color: var(--ea-dialog-bg, #ffffff) !important;
  color: var(--ea-dialog-body, #3a3d44);
}

html[data-theme='light'] .el-dialog__title {
  color: var(--ea-dialog-title, #1a1b1e);
}

.hidden {
  display: none !important;
}

body.is-lib-dragging .action-item-wrapper {
  pointer-events: none !important;
  opacity: 0.5 !important;
  filter: grayscale(0.5);
  transition: opacity 0.2s;
}

.action-item-wrapper.is-moving {
  opacity: 0.9 !important;
  z-index: 999 !important;
  cursor: grabbing !important;
  transition: none !important;
  box-shadow: 0 0 15px color-mix(in srgb, var(--ea-gold) 50%, transparent) !important;
  border-color: var(--ea-gold) !important;
  transform: scale(1);
}

/* 滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--ea-scrollbar-thumb, #9a9a9a) transparent;
}
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--ea-scrollbar-thumb, #9a9a9a);
  border-radius: 10px;
  border: 1px solid transparent;
  background-clip: padding-box;
  transition: background 0.3s ease;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--ea-scrollbar-thumb-hover, #7a7a7a);
}
::-webkit-scrollbar-thumb:active {
  background: var(--ea-scrollbar-thumb-active, #5e5e5e);
}

/* Switch 开关样式 */
.el-switch {
  height: 24px;
}
.el-switch__core {
  border-radius: 0 !important;
  border: 1px solid #444 !important;
  background-color: #1a1a1c !important;
  height: 20px !important;
}
.el-switch.is-checked .el-switch__core {
  background-color: color-mix(in srgb, var(--ea-gold) 20%, transparent) !important;
  border-color: var(--ea-gold) !important;
}
.el-switch__core .el-switch__action {
  border-radius: 0 !important;
  background-color: #888 !important;
  width: 12px !important;
  height: 12px !important;
  left: 3px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.el-switch.is-checked .el-switch__core .el-switch__action {
  background-color: var(--ea-gold) !important;
  left: calc(100% - 15px) !important;
  box-shadow: 0 0 8px color-mix(in srgb, var(--ea-gold) 50%, transparent);
}
.el-switch__label {
  color: #888 !important;
  font-weight: bold !important;
  font-size: 12px !important;
}
.el-switch__label.is-active {
  color: var(--ea-gold) !important;
}

/* 输入框与文本域样式（深色硬编码仅挂 html.dark） */
html.dark .el-input__wrapper,
html.dark .el-textarea__inner {
  background-color: #16161a !important;
  border-radius: 0 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
  border: none !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

html.dark .el-input__wrapper.is-focus,
html.dark .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px var(--ea-gold) inset !important;
  background-color: #1f1f24 !important;
}

html[data-theme='light'] .el-input__wrapper,
html[data-theme='light'] .el-textarea__inner {
  background-color: var(--ea-fill-input, var(--ea-surface-soft)) !important;
  border-radius: 0 !important;
  box-shadow: 0 0 0 1px var(--ea-border, #d8dbe0) inset !important;
  border: none !important;
  color: var(--ea-fg, #1a1b1e) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

html[data-theme='light'] .el-input__wrapper.is-focus,
html[data-theme='light'] .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px var(--ea-gold, #ffd700) inset !important;
  background-color: #ffffff !important;
}

/* Number inputs with up/down controls (el-input-number). */
html[data-theme='light'] .el-input-number {
  --el-fill-color-blank: var(--ea-surface-soft);
  --el-text-color-regular: #1a1b1e;
  --el-border-color: #c9ced6;
  --el-border-color-hover: #aeb4be;
}

html[data-theme='light'] .el-input-number .el-input__wrapper {
  background-color: var(--ea-surface-soft) !important;
  color: #1a1b1e !important;
}

html[data-theme='light'] .el-input-number__increase,
html[data-theme='light'] .el-input-number__decrease {
  background: var(--ea-surface-row) !important;
  color: #4a4e57 !important;
  border-color: #c9ced6 !important;
}

html[data-theme='light'] .el-input-number__increase:hover,
html[data-theme='light'] .el-input-number__decrease:hover {
  color: #1a1b1e !important;
  background: var(--ea-chip-fill-hover) !important;
}

.el-input__count,
.el-input__count-inner {
  background: transparent !important;
  font-family: 'Roboto Mono', 'Consolas', monospace !important;
  font-size: 10px !important;
  color: #666 !important;
  bottom: 5px !important;
  right: 10px !important;
  pointer-events: none;
}
.el-textarea__inner:focus + .el-input__count {
  color: var(--ea-gold) !important;
  opacity: 0.8;
}
.el-textarea__inner::-webkit-scrollbar {
  width: 4px;
}
.el-textarea__inner::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--ea-gold) 20%, transparent);
}
html.dark ::placeholder {
  color: #444 !important;
  font-size: 12px;
}
html[data-theme='light'] ::placeholder {
  color: #9aa0a8 !important;
  font-size: 12px;
}

/* 下拉列表样式（深色硬编码仅挂在 html.dark，浅色走主题 token / Element 默认） */
:root {
  --el-border-radius-base: 0px !important;
}

html.dark .el-select {
  --el-fill-color-blank: #16161a !important;
  --el-border-color: #333 !important;
  --el-border-color-hover: #444 !important;
  --el-color-primary: var(--ea-gold) !important;
  --el-text-color-regular: #ccc !important;
}

html.dark .el-select .el-input__wrapper {
  background-color: #16161a !important;
  box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
  border-radius: 0 !important;
}

html.dark .el-select .el-input.is-focus .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--ea-gold) inset !important;
}

.el-select .el-input__inner {
  font-family: inherit;
  font-size: 13px;
}

html.dark .el-popper.is-light,
html.dark .el-select__popper.el-popper {
  background-color: #1e1e1e !important;
  border: 1px solid #444 !important;
  border-radius: 0 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
}

html.dark .el-select-dropdown__item {
  color: #aaa !important;
  font-size: 13px !important;
  height: 34px !important;
  line-height: 34px !important;
  transition: all 0.2s !important;
}

html.dark .el-select-dropdown__item.hover,
html.dark .el-select-dropdown__item:hover {
  background-color: color-mix(in srgb, var(--ea-gold) 10%, transparent) !important;
  color: var(--ea-gold) !important;
}

html.dark .el-select-dropdown__item.selected {
  color: var(--ea-gold) !important;
  font-weight: bold !important;
  background-color: color-mix(in srgb, var(--ea-gold) 5%, transparent) !important;
}

/* Use real directional triangles instead of Element Plus' exposed rotated squares. */
html body .el-popper.el-popper.el-popper[data-popper-placement] > .el-popper__arrow {
  background: transparent !important;
  overflow: visible;
}

html body
  .el-popper.el-popper.el-popper[data-popper-placement]
  > .el-popper__arrow::before {
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  transform: none !important;
  border: 0 !important;
  border-radius: 0 !important;
}

.el-popper__arrow::before {
  background: var(--ea-popper-arrow-bg, var(--el-bg-color-overlay, #ffffff));
}

html.dark .el-popper.is-dark {
  --ea-popper-arrow-bg: var(--el-text-color-primary, #303133);
}

html.dark .el-popper.is-light {
  --ea-popper-arrow-bg: #1e1e1e;
}

html[data-theme='light'] .el-popper {
  --ea-popper-arrow-bg: var(--ea-popover-bg, #ffffff);
}

html body .el-popper.el-popper.el-popper[data-popper-placement^='top'] > .el-popper__arrow,
html body .el-popper.el-popper.el-popper[data-popper-placement^='bottom'] > .el-popper__arrow {
  width: 12px !important;
  height: 7px !important;
}

html body .el-popper.el-popper.el-popper[data-popper-placement^='top'] > .el-popper__arrow {
  bottom: -7px !important;
}

html body
  .el-popper.el-popper.el-popper[data-popper-placement^='top']
  > .el-popper__arrow::before {
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

html body .el-popper.el-popper.el-popper[data-popper-placement^='bottom'] > .el-popper__arrow {
  top: -7px !important;
}

html body
  .el-popper.el-popper.el-popper[data-popper-placement^='bottom']
  > .el-popper__arrow::before {
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

html body .el-popper.el-popper.el-popper[data-popper-placement^='left'] > .el-popper__arrow,
html body .el-popper.el-popper.el-popper[data-popper-placement^='right'] > .el-popper__arrow {
  width: 7px !important;
  height: 12px !important;
}

html body .el-popper.el-popper.el-popper[data-popper-placement^='left'] > .el-popper__arrow {
  right: -7px !important;
}

html body
  .el-popper.el-popper.el-popper[data-popper-placement^='left']
  > .el-popper__arrow::before {
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

html body .el-popper.el-popper.el-popper[data-popper-placement^='right'] > .el-popper__arrow {
  left: -7px !important;
}

html body
  .el-popper.el-popper.el-popper[data-popper-placement^='right']
  > .el-popper__arrow::before {
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
}

html.dark .el-select .el-input__suffix .el-icon {
  color: #666 !important;
}
</style>
