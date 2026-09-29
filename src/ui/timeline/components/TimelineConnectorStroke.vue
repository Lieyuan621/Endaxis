<script setup lang="ts">
/** 仅绘制连线外观；各使用方自行决定路径、箭头、命中区和交互。 */
withDefaults(
  defineProps<{
    path: string;
    stroke: string;
    markerStart?: string;
    markerEnd?: string;
    startColor?: string;
    endColor?: string;
    emphasis?: 'normal' | 'highlighted' | 'selected';
    dash?: string;
    animated?: boolean;
    particle?: boolean;
    shadow?: boolean;
    preview?: boolean;
  }>(),
  {
    emphasis: 'normal',
    animated: true,
    particle: false,
    shadow: true,
    preview: false,
  },
);
</script>

<template>
  <g
    class="timeline-connector-stroke"
    :class="[`is-${emphasis}`, { 'is-animated': animated, 'is-preview': preview }]"
    aria-hidden="true"
  >
    <path v-if="shadow" class="timeline-connector-stroke__shadow" :d="path" />
    <path
      class="timeline-connector-stroke__line"
      :d="path"
      :stroke="stroke"
      :marker-start="markerStart"
      :marker-end="markerEnd"
      :style="dash === undefined ? undefined : { strokeDasharray: dash }"
    />
    <circle
      v-if="particle"
      class="timeline-connector-stroke__particle"
      r="2"
      :style="{
        offsetPath: `path('${path}')`,
        '--start-color': startColor ?? stroke,
        '--end-color': endColor ?? startColor ?? stroke,
      }"
    />
  </g>
</template>

<style scoped>
.timeline-connector-stroke {
  pointer-events: none;
}
.timeline-connector-stroke__line,
.timeline-connector-stroke__shadow {
  fill: none;
  stroke-linecap: round;
}
.timeline-connector-stroke__line {
  stroke-width: 2;
  stroke-dasharray: 10 5;
}
.timeline-connector-stroke__shadow {
  stroke: var(--ea-shadow);
  stroke-width: 3;
  filter: blur(2px);
  transform: translateY(1px);
}
.timeline-connector-stroke.is-highlighted .timeline-connector-stroke__line,
.timeline-connector-stroke.is-selected .timeline-connector-stroke__line {
  stroke-width: 3;
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--ea-fg) 45%, transparent));
}
.timeline-connector-stroke.is-selected .timeline-connector-stroke__line {
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--ea-fg) 75%, transparent));
}
.timeline-connector-stroke.is-preview .timeline-connector-stroke__line {
  opacity: 0.5;
}
.timeline-connector-stroke__particle {
  pointer-events: none;
  fill: var(--start-color);
}
.timeline-connector-stroke.is-animated .timeline-connector-stroke__line {
  animation: connector-dash-flow 0.5s linear infinite;
}
.timeline-connector-stroke.is-animated .timeline-connector-stroke__particle {
  animation:
    connector-move 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite,
    connector-color 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes connector-dash-flow {
  from {
    stroke-dashoffset: 15;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes connector-move {
  from {
    offset-distance: 0%;
  }
  to {
    offset-distance: 100%;
  }
}
@keyframes connector-color {
  from {
    fill: var(--start-color);
  }
  to {
    fill: var(--end-color);
  }
}
@media (prefers-reduced-motion: reduce) {
  .timeline-connector-stroke.is-animated .timeline-connector-stroke__line,
  .timeline-connector-stroke.is-animated .timeline-connector-stroke__particle {
    animation: none;
  }
}
</style>
