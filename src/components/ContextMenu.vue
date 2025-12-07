<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { ElMessage } from 'element-plus'

const store = useTimelineStore()

const menuStyle = computed(() => ({
  left: `${store.contextMenu.x}px`,
  top: `${store.contextMenu.y}px`
}))

const targetAction = computed(() => {
  if (!store.contextMenu.targetId) return null
  const info = store.getActionPositionInfo(store.contextMenu.targetId)
  return info ? info.action : null
})

function close() {
  store.closeContextMenu()
}

// 点击外部关闭
function onGlobalClick(e) {
  if (!e.target.closest('.custom-context-menu')) {
    close()
  }
}

onMounted(() => window.addEventListener('click', onGlobalClick))
onUnmounted(() => window.removeEventListener('click', onGlobalClick))

// ===================================================================================
// 操作逻辑
// ===================================================================================

function handleCopy() {
  if (!store.isActionSelected(store.contextMenu.targetId)) {
    store.selectAction(store.contextMenu.targetId)
  }
  store.copySelection()
  ElMessage.success({ message: '已复制', duration: 800 })
  close()
}

function handlePaste() {
  store.pasteSelection(store.contextMenu.time)
  ElMessage.success({ message: '已粘贴', duration: 800 })
  close()
}

function handleDelete() {
  if (!store.isActionSelected(store.contextMenu.targetId)) {
    store.selectAction(store.contextMenu.targetId)
  }
  const result = store.removeCurrentSelection()
  if (result && result.total > 0) {
    ElMessage.success({ message: '已删除', duration: 800 })
  }
  close()
}

function handleLock() {
  store.toggleActionLock(store.contextMenu.targetId)
  close()
}

function handleMute() {
  store.toggleActionDisable(store.contextMenu.targetId)
  close()
}

const PRESET_COLORS = computed(() => [
  { val: null, label: '默认' },
  { val: store.ELEMENT_COLORS.physical, label: '物理' },
  { val: store.ELEMENT_COLORS.blaze, label: '灼热' },
  { val: store.ELEMENT_COLORS.cold,  label: '寒冷' },
  { val: store.ELEMENT_COLORS.emag,  label: '电磁' },
  { val: store.ELEMENT_COLORS.nature, label: '自然' },
])

function handleColor(color) {
  store.setActionColor(store.contextMenu.targetId, color)
  close()
}
</script>

<template>
  <div v-if="store.contextMenu.visible"
       class="custom-context-menu"
       :style="menuStyle"
       @click.stop
       @contextmenu.prevent
       @mousedown.stop>

    <template v-if="targetAction">
      <div class="menu-header">{{ targetAction.name }}</div>

      <div class="menu-item" @click="handleCopy">
        <span class="icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </span>
        <span class="label">复制</span>
        <span class="shortcut-hint">Ctrl+C</span>
      </div>

      <div class="menu-item" @click="handlePaste" :class="{ disabled: !store.clipboard }">
        <span class="icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
        </span>
        <span class="label">粘贴</span>
        <span class="shortcut-hint">Ctrl+V</span>
      </div>

      <div class="menu-item delete-item" @click="handleDelete">
        <span class="icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </span>
        <span class="label">删除</span>
        <span class="shortcut-hint">Delete</span>
      </div>

      <div class="divider"></div>

      <div class="menu-item" @click="handleLock">
        <span class="icon">
          <svg v-if="targetAction.isLocked" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
        </span>
        <span class="label">{{ targetAction.isLocked ? '解锁位置' : '锁定位置' }}</span>
      </div>

      <div class="menu-item" @click="handleMute">
        <span class="icon">
          <svg v-if="targetAction.isDisabled" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>

          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9 12l2 2 4-4"></path> </svg>
        </span>
        <span class="label">{{ targetAction.isDisabled ? '启用计算' : '禁用 (不计算)' }}</span>
      </div>

      <div class="divider"></div>
      <div class="menu-label">颜色</div>
      <div class="color-grid">
        <div v-for="c in PRESET_COLORS" :key="c.val || 'def'"
             class="color-dot"
             :style="{ background: c.val || '#555' }"
             :class="{ 'is-active': targetAction.customColor === c.val }"
             :title="c.label"
             @click="handleColor(c.val)">
          <svg v-if="targetAction.customColor === c.val || (c.val === null && !targetAction.customColor)"
               viewBox="0 0 24 24" width="12" height="12"
               stroke="currentColor" stroke-width="3" fill="none">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="menu-header">全局操作</div>
      <div class="menu-item" @click="handlePaste" :class="{ disabled: !store.clipboard }">
        <span class="icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
        </span>
        <span class="label">在此处粘贴</span>
        <span class="shortcut-hint">Ctrl+V</span>
      </div>
    </template>

  </div>
</template>

<style scoped>
.custom-context-menu {
  position: fixed;
  z-index: 10000;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
  min-width: 180px;
  padding: 6px 0;
  font-family: 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #e0e0e0;
  user-select: none;
  animation: fadeIn 0.1s ease-out;
}

.menu-header {
  padding: 6px 12px;
  font-size: 12px;
  color: #777;
  font-weight: 600;
  border-bottom: 1px solid #3a3a3a;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.menu-item {
  height: 32px;
  padding: 0 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.1s;
  color: #ccc;
}

.menu-item:hover {
  background: #007fd4;
  color: #fff;
}

.menu-item.delete-item:hover {
  background: #ff7875;
}

.menu-item .icon {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 14px;
  flex-shrink: 0;
}

.menu-item .label {
  flex-grow: 1;
  white-space: nowrap;
  text-align: left;
}

.shortcut-hint {
  font-size: 11px;
  color: #666;
  margin-left: 10px;
  font-family: 'Consolas', monospace;
}

.menu-item:hover .shortcut-hint {
  color: rgba(255, 255, 255, 0.7);
}

.menu-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.divider {
  height: 1px;
  background: #3a3a3a;
  margin: 4px 0;
}

.menu-label {
  padding: 4px 12px;
  font-size: 11px;
  color: #777;
}

.color-grid {
  display: flex;
  padding: 4px 12px 8px;
  gap: 8px;
  justify-content: flex-start;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, border-color 0.1s;
  color: #fff;
}

.color-dot:hover {
  transform: scale(1.1);
  border-color: #fff;
  z-index: 1;
}

.color-dot.is-active {
  border-color: #fff;
  box-shadow: 0 0 4px rgba(255,255,255,0.5);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>