<script setup lang="ts">
import { computed } from 'vue';
import { EaDialog } from '../../../design-system/index';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { useI18n } from 'vue-i18n';

type LoadoutBuildTab = 'operator' | 'weapon' | 'gear';

const props = defineProps<{
  visible: boolean;
  activeTab: LoadoutBuildTab;
  operatorName: string;
  hasWeapon: boolean;
  hasGear: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'update:activeTab': [tab: LoadoutBuildTab];
}>();

const { t } = useI18n({ useScope: 'global' });
const tabs = [
  { key: 'operator', labelKey: 'timeline.operatorTab' },
  { key: 'weapon', labelKey: 'timeline.weaponTab' },
  { key: 'gear', labelKey: 'timeline.gearTab' },
] as const;

function tabDisabled(tab: LoadoutBuildTab): boolean {
  return (tab === 'weapon' && !props.hasWeapon) || (tab === 'gear' && !props.hasGear);
}

const currentTab = computed(() => (tabDisabled(props.activeTab) ? 'operator' : props.activeTab));

function selectTab(tab: LoadoutBuildTab, event: MouseEvent): void {
  if (tabDisabled(tab) || tab === currentTab.value) return;
  (event.currentTarget as HTMLElement).closest('.el-dialog__body')?.scrollTo(0, 0);
  emit('update:activeTab', tab);
}
</script>

<template>
  <InputRegionBoundary label="loadout-build" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="`${t('actionLibrary.section.operatorStatusAdjust')} · ${operatorName}`"
      width="920px"
      class="loadout-build-dialog"
      scroll-mode="body"
      append-to-body
      align-center
      @update:model-value="emit('update:visible', $event)"
    >
      <div class="loadout-build-tabbar">
        <div
          class="loadout-build-tabs"
          role="tablist"
          :aria-label="t('actionLibrary.section.operatorStatusAdjust')"
        >
          <button
            v-for="tab in tabs"
            :id="`loadout-build-tab-${tab.key}`"
            :key="tab.key"
            type="button"
            role="tab"
            :disabled="tabDisabled(tab.key)"
            :aria-selected="currentTab === tab.key"
            :aria-controls="`loadout-build-panel-${tab.key}`"
            :class="{ 'is-active': currentTab === tab.key }"
            @click="selectTab(tab.key, $event)"
          >
            {{ t(tab.labelKey) }}
          </button>
        </div>
      </div>
      <section
        :id="`loadout-build-panel-${currentTab}`"
        :key="currentTab"
        class="loadout-build-content"
        :class="`loadout-build-content--${currentTab}`"
        role="tabpanel"
        :aria-labelledby="`loadout-build-tab-${currentTab}`"
      >
        <slot :name="currentTab" />
      </section>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style>
.loadout-build-dialog {
  max-width: calc(100vw - 24px);
  min-height: min(720px, calc(100dvh - 32px));
}

.loadout-build-dialog .el-dialog__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.loadout-build-content,
.loadout-build-dialog .build-dialog-surface {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
}

.loadout-build-content {
  width: 100%;
  box-sizing: border-box;
}

.loadout-build-dialog .build-dialog-surface {
  gap: 12px;
}

.loadout-build-dialog .build-dialog-surface .build-dialog-surface__footer {
  margin-top: auto;
}

.loadout-build-tabbar {
  position: sticky;
  z-index: 2;
  top: calc(-1 * var(--ea-dialog-padding-y));
  margin: calc(-1 * var(--ea-dialog-padding-y)) 0 12px;
  padding: var(--ea-dialog-padding-y) 0 4px;
  background: var(--ea-dialog-bg);
}

.loadout-build-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
  box-sizing: border-box;
}

.loadout-build-tabs button {
  min-width: 0;
  min-height: 34px;
  padding: 5px 14px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ea-fg-secondary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;
}

.loadout-build-tabs button:hover:not(:disabled) {
  color: var(--ea-fg);
  background: var(--ea-fill-muted);
}

.loadout-build-tabs button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.loadout-build-tabs button.is-active {
  color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 6%, var(--ea-dialog-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ea-gold) 30%, transparent);
}

.loadout-build-tabs button.is-active:hover {
  color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 9%, var(--ea-dialog-bg));
}

.loadout-build-tabs button:focus-visible {
  outline: 1px solid var(--ea-gold);
  outline-offset: -2px;
}

.loadout-build-content--operator,
.loadout-build-content--weapon {
  max-width: 760px;
  margin-inline: auto;
}

.loadout-build-content {
  animation: loadout-build-page-enter 170ms ease-out;
}

@keyframes loadout-build-page-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Compact embedded controls; the shared window supplies the surrounding space. */
.loadout-build-dialog .operator-build-dialog .layout {
  gap: 12px;
}

.loadout-build-dialog .operator-build-dialog .header {
  gap: 14px;
}

.loadout-build-dialog .operator-build-dialog .header-info {
  gap: 6px;
}

.loadout-build-dialog .operator-build-dialog .portrait-frame {
  width: 140px;
  min-width: 140px;
  height: 140px;
}

.loadout-build-dialog .operator-build-dialog .section {
  padding: 12px;
}

.loadout-build-dialog .operator-build-dialog .section-title {
  margin-bottom: 8px;
}

.loadout-build-dialog .operator-build-dialog .talent-row {
  padding-block: 5px;
}

.loadout-build-dialog .operator-build-dialog .skill-icon-frame {
  width: 58px;
  height: 58px;
}

.loadout-build-dialog .gear-loadout-dialog .loadout-layout {
  gap: 12px;
}

.loadout-build-dialog .gear-loadout-dialog .gear-slot-card {
  min-height: 0;
  gap: 6px;
  padding: 12px;
}

.loadout-build-dialog .gear-loadout-dialog .gear-slot-card.is-empty {
  min-height: 190px;
}

.loadout-build-dialog .gear-loadout-dialog .stat-list {
  margin-top: 4px;
  gap: 3px;
}

.loadout-build-dialog .gear-loadout-dialog .refine-row {
  min-height: 24px;
}

.loadout-build-dialog .gear-loadout-dialog .gear-set-bonus-panel {
  gap: 6px;
  padding: 10px 12px;
}

@media (min-width: 769px) {
  .loadout-build-content--operator,
  .loadout-build-content--weapon {
    max-width: none;
  }

  .loadout-build-dialog .operator-build-dialog .layout {
    display: grid;
    grid-template-columns: 380px minmax(0, 1fr);
    grid-template-rows: minmax(220px, auto) auto minmax(180px, auto);
    gap: 12px;
    margin-block: auto;
  }

  .loadout-build-dialog .operator-build-dialog .header {
    grid-column: 1;
    grid-row: 1;
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--ea-border-soft);
    background: var(--ea-fill-soft);
  }

  .loadout-build-dialog .operator-build-dialog .portrait-frame {
    width: 150px;
    min-width: 150px;
    height: 150px;
  }

  .loadout-build-dialog .operator-build-dialog .header-info {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-width: 0;
    min-height: 150px;
    gap: 8px;
  }

  .loadout-build-dialog .operator-build-dialog .potential-row {
    margin-top: auto;
    margin-bottom: 4px;
  }

  .loadout-build-dialog .operator-build-dialog .name-row {
    flex-wrap: wrap;
    gap: 2px 6px;
  }

  .loadout-build-dialog .operator-build-dialog .name {
    font-size: 20px;
  }

  .loadout-build-dialog .operator-build-dialog .stars {
    white-space: nowrap;
  }

  .loadout-build-dialog .operator-build-dialog .tags {
    gap: 4px;
  }

  .loadout-build-dialog .operator-build-dialog .tag {
    padding-inline: 6px;
  }

  .loadout-build-dialog .operator-build-dialog .operator-skills-section {
    grid-column: 1 / -1;
    grid-row: 3;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .loadout-build-dialog .operator-build-dialog .skills-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    align-self: center;
    gap: 12px;
  }

  .loadout-build-dialog .operator-build-dialog .skill-card {
    min-width: 0;
  }

  .loadout-build-dialog .operator-build-dialog .build-progression-bar {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .loadout-build-dialog .operator-build-dialog .operator-talents-section {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    flex-direction: column;
  }

  .loadout-build-dialog .operator-build-dialog .operator-talents-section .section-title {
    margin-bottom: 6px;
  }

  .loadout-build-dialog .operator-build-dialog .talent-row {
    min-width: 0;
    min-height: 52px;
    flex: 1 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--ea-border-soft);
  }

  .loadout-build-dialog .operator-build-dialog .talent-row:last-child {
    border-bottom: 0;
  }

  .loadout-build-dialog .operator-build-dialog .talent-nodes {
    max-width: 100%;
    margin-left: auto;
  }

  .loadout-build-dialog .operator-build-dialog .talent-info {
    flex-direction: row;
    align-items: baseline;
    gap: 8px;
  }

  .loadout-build-dialog .operator-build-dialog .talent-chain {
    width: 12px;
  }

  .loadout-build-dialog .weapon-build-dialog .layout {
    gap: 12px;
  }

  .loadout-build-dialog .weapon-build-dialog .header {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    align-items: center;
    gap: 14px;
    padding: 10px;
    border: 1px solid var(--ea-border-soft);
    background: var(--ea-fill-soft);
  }

  .loadout-build-dialog .weapon-build-dialog .header-info {
    display: flex;
    flex-direction: column;
    min-height: 120px;
    gap: 8px;
    min-width: 0;
  }

  .loadout-build-dialog .weapon-build-dialog .name-row {
    flex-wrap: wrap;
  }

  .loadout-build-dialog .weapon-build-dialog .potential-row {
    margin-top: auto;
    margin-bottom: 4px;
  }

  .loadout-build-dialog .weapon-build-dialog .section {
    padding: 12px;
  }

  .loadout-build-dialog .weapon-build-dialog .section-title {
    margin-bottom: 8px;
  }

  .loadout-build-dialog .weapon-build-dialog .skill-row {
    gap: 6px;
    padding-block: 7px;
  }
}

@media (min-width: 769px) and (max-width: 980px) {
  .loadout-build-dialog .operator-build-dialog .layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .loadout-build-dialog .operator-build-dialog .header {
    grid-template-columns: 112px minmax(0, 1fr);
  }

  .loadout-build-dialog .operator-build-dialog .portrait-frame {
    width: 112px;
    min-width: 112px;
    height: 112px;
  }

  .loadout-build-dialog .operator-build-dialog .header-info {
    min-height: 112px;
  }

  .loadout-build-dialog .operator-build-dialog .potential-row {
    gap: 4px;
  }

  .loadout-build-dialog .operator-build-dialog .potential-row .section-label {
    white-space: nowrap;
  }

  .loadout-build-dialog .operator-build-dialog .diamonds {
    gap: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loadout-build-content {
    animation: none;
  }
}
</style>
