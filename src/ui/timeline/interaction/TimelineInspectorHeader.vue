<template>
  <header class="panel-header">
    <div class="header-main-row">
      <div class="header-icon-bar"></div>
      <h3><slot /></h3>
    </div>
    <div class="header-divider"></div>
  </header>
</template>

<style scoped>
.panel-header {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-1);
}

.header-main-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--ea-space-2);
}

.header-divider {
  height: 2px;
  margin-top: 3px;
  background: linear-gradient(90deg, var(--ea-gold), transparent);
  opacity: 0.3;
}

.header-icon-bar {
  width: 4px;
  height: 18px;
  flex: 0 0 auto;
  background: var(--ea-gold);
}

.panel-header h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ea-fg);
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
