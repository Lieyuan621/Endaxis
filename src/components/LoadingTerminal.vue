<template>
  <div
    class="endaxis-loading"
    :class="{ 'is-fullscreen': fullScreen }"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="panel">
      <div v-if="scanner" class="scanner" aria-hidden="true"></div>
      <div class="spinner" aria-hidden="true"></div>
      <div class="message">{{ message }}</div>
      <div v-if="subMessage" class="sub-message">{{ subMessage }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '正在加载...' },
  subMessage: { type: String, default: '' },
  fullScreen: { type: Boolean, default: false },
  scanner: { type: Boolean, default: false },
});
</script>

<style scoped>
.endaxis-loading {
  padding: 48px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #00e5ff;
  font-family:
    'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: 1px;
}

.endaxis-loading.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  padding: 0;
  background: rgba(24, 24, 28, 0.92);
}

.panel {
  position: relative;
  min-width: 280px;
  max-width: 520px;
  padding: 22px 26px;
  border: 1px solid rgba(255, 215, 0, 0.22);
  background: rgba(0, 0, 0, 0.25);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  gap: 14px;
  overflow: hidden;
}

.scanner {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.8), transparent);
  animation: scan 1.4s ease-in-out infinite;
  opacity: 0.85;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 229, 255, 0.25);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  flex: 0 0 auto;
}

.message {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.3;
  color: #00e5ff;
}

.sub-message {
  margin-left: auto;
  color: #888;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-align: right;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes scan {
  0% {
    transform: translateX(-35%);
  }
  50% {
    transform: translateX(35%);
  }
  100% {
    transform: translateX(-35%);
  }
}
</style>