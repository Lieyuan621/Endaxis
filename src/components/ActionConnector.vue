<script setup>
import { computed } from 'vue'

const props = defineProps({
  connection: { type: Object, required: true },
  containerRef: { type: Object, required: true },
  renderKey: { type: Number }
})

const TIME_BLOCK_WIDTH = 50

const pathData = computed(() => {
  // 依赖 renderKey 强制更新
  const key = props.renderKey;

  if (!props.containerRef) return ''

  const fromEl = document.getElementById(`action-${props.connection.from}`)
  const toEl = document.getElementById(`action-${props.connection.to}`)

  let actualFromEl = fromEl;
  if (props.connection.fromEffectIndex !== undefined && props.connection.fromEffectIndex !== null) {
    const iconEl = document.getElementById(`anomaly-${props.connection.from}-${props.connection.fromEffectIndex}`);
    if (iconEl) {
      actualFromEl = iconEl;
    }
  }

  if (!fromEl || !toEl) return ''

  // 1. 获取坐标和容器信息
  const containerRect = props.containerRef.getBoundingClientRect()
  const fromRect = actualFromEl.getBoundingClientRect()
  const toRect = toEl.getBoundingClientRect()

  // 2. 计算起点和终点 (相对于容器)
  const x1 = fromRect.right - containerRect.left
  const y1 = fromRect.top - containerRect.top + (fromRect.height / 2)

  const x2 = toRect.left - containerRect.left
  const y2 = toRect.top - containerRect.top + (toRect.height / 2)

  // 3. 核心算法：固定底部长度为 0.5s
  const fixedWidth = 0.5 * TIME_BLOCK_WIDTH

  const x_vertical = x2 - fixedWidth

  // M x1 y1 L x_vertical y1 L x_vertical y2 L x2 y2
  return `M ${x1} ${y1} L ${x_vertical} ${y1} L ${x_vertical} ${y2} L ${x2} ${y2}`
})
</script>

<template>
  <g>
    <path
        :d="pathData"
        fill="none"
        stroke="#ffd700"
        stroke-width="2"
    />
  </g>
</template>