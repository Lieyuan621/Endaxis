<script setup lang="ts">
import { useAttrs } from 'vue';
import { ElCollapseTransition } from 'element-plus';

defineOptions({ inheritAttrs: false });
withDefaults(defineProps<{ expanded: boolean; keepMounted?: boolean }>(), { keepMounted: false });
const attrs = useAttrs();
</script>

<template>
  <ElCollapseTransition>
    <div v-if="keepMounted" v-show="expanded" v-bind="attrs" class="ea-collapse"><slot /></div>
    <div v-else-if="expanded" v-bind="attrs" class="ea-collapse"><slot /></div>
  </ElCollapseTransition>
</template>

<style scoped>
/* Keep child margins inside the measured height; feature layouts can still override display. */
:where(.ea-collapse) {
  display: flow-root;
}
.ea-collapse.el-collapse-transition-enter-active,
.ea-collapse.el-collapse-transition-leave-active {
  overflow: hidden;
  transition:
    max-height 180ms ease,
    padding-top 180ms ease,
    padding-bottom 180ms ease,
    opacity 180ms ease;
}
.ea-collapse.el-collapse-transition-enter-from,
.ea-collapse.el-collapse-transition-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .ea-collapse.el-collapse-transition-enter-active,
  .ea-collapse.el-collapse-transition-leave-active {
    transition: none;
  }
}
</style>
