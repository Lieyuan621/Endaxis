<script setup>
import { computed, onMounted } from 'vue'
import { useTimelineStore } from './stores/timelineStore.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getElementPlusLocale } from '@/i18n/elementPlusLocale.js'

const store = useTimelineStore()
const { t, locale } = useI18n({ useScope: 'global' })
const elementLocale = computed(() => getElementPlusLocale(locale.value))

onMounted(async () => {
  // 1. 先加载基础游戏数据 (gamedata.json)
  await store.fetchGameData()

  // 2. 尝试读取浏览器缓存
  const hasAutoSave = store.loadFromBrowser()
  if (hasAutoSave) {
    ElMessage.success(t('app.restoreProgress'))
  }

  // 3. 无论是否读取成功，都开启监听以进行后续的自动保存
  store.initAutoSave()
})
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view/>
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
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #18181c;
  color: #f0f0f0;
  overflow: hidden;
}

html.dark {
  --el-bg-color-overlay: #1e1e1e !important;
  --el-dialog-bg-color: #1e1e1e !important;
  --el-fill-color-blank: #333333 !important;
}

.el-overlay-dialog .el-dialog {
  background-color: #1e1e1e !important;
  background-image: none !important;
}

.el-dialog__header,
.el-dialog__body,
.el-dialog__footer {
  background-color: #1e1e1e !important;
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
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5) !important;
  border-color: #ffd700 !important;
  transform: scale(1);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  border: 1px solid transparent;
  background-clip: padding-box;
  transition: background 0.3s ease;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.4);
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
  background-color: rgba(255, 215, 0, 0.2) !important;
  border-color: #ffd700 !important;
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
  background-color: #ffd700 !important;
  left: calc(100% - 15px) !important;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}
.el-switch__label {
  color: #888 !important;
  font-weight: bold !important;
  font-size: 12px !important;
}
.el-switch__label.is-active {
  color: #ffd700 !important;
}

/* 输入框与文本域样式 */
.el-input__wrapper,
.el-textarea__inner {
  background-color: #16161a !important;
  border-radius: 0 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
  border: none !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.el-input__wrapper.is-focus,
.el-textarea__inner:focus {
  box-shadow: 0 0 0 1px #ffd700 inset !important;
  background-color: #1f1f24 !important;
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
  color: #ffd700 !important;
  opacity: 0.8;
}
.el-textarea__inner::-webkit-scrollbar {
  width: 4px;
}
.el-textarea__inner::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.2);
}
::placeholder {
  color: #444 !important;
  font-size: 12px;
}

/* 下拉列表样式 */
:root {
  --el-border-radius-base: 0px !important;
}

.el-select {
  --el-fill-color-blank: #16161a !important;
  --el-border-color: #333 !important;
  --el-border-color-hover: #444 !important;
  --el-color-primary: #ffd700 !important;
  --el-text-color-regular: #ccc !important;
}

.el-select .el-input__wrapper {
  background-color: #16161a !important;
  box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
  border-radius: 0 !important;
}

.el-select .el-input.is-focus .el-input__wrapper {
  box-shadow: 0 0 0 1px #ffd700 inset !important;
}

.el-select .el-input__inner {
  font-family: inherit;
  font-size: 13px;
}

.el-popper.is-light,
.el-select__popper.el-popper {
  background-color: #1e1e1e !important;
  border: 1px solid #444 !important;
  border-radius: 0 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
}

.el-select-dropdown__item {
  color: #aaa !important;
  font-size: 13px !important;
  height: 34px !important;
  line-height: 34px !important;
  transition: all 0.2s !important;
}

.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background-color: rgba(255, 215, 0, 0.1) !important;
  color: #ffd700 !important;
}

.el-select-dropdown__item.selected {
  color: #ffd700 !important;
  font-weight: bold !important;
  background-color: rgba(255, 215, 0, 0.05) !important;
}

.el-popper.is-light .el-popper__arrow::before {
  background: #1e1e1e !important;
  border: 1px solid #444 !important;
}

.el-select .el-input__suffix .el-icon {
  color: #666 !important;
}
</style>