<template>
  <span class="anomaly-stacks"><slot /></span>
</template>
<style scoped>
.anomaly-stacks {
  position: absolute;
  right: -3px;
  bottom: -3px;
  z-index: 3;
  min-width: 9px;
  box-sizing: border-box;
  padding: 0 2px;
  border-radius: 2px;
  background: rgb(19 20 22 / 92%);
  color: var(--ea-gold);
  font:
    700 8px/10px 'Roboto Mono',
    Consolas,
    monospace;
  text-align: center;
}
</style>
