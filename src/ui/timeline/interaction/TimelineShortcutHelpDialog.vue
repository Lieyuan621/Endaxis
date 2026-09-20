<script setup lang="ts">
import { EaDialog } from '../../../design-system/index';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{ visible: boolean }>();
defineEmits<{ 'update:visible': [visible: boolean] }>();
const { t } = useI18n({ useScope: 'global' });

const sections = computed(() => [
  {
    title: t('timeline.shortcuts.sections.tracksSkills'),
    items: [
      ['F1 – F4', t('timeline.shortcuts.items.selectTrack')],
      ['Tab / Shift + Tab', t('timeline.shortcuts.items.cycleOperatorTrack')],
      [
        '1',
        t('timeline.shortcuts.items.placeSkill', { skill: t('hitEditor.skillTypes.basicAttack') }),
      ],
      [
        '2',
        t('timeline.shortcuts.items.placeSkill', { skill: t('hitEditor.skillTypes.battleSkill') }),
      ],
      [
        '3',
        t('timeline.shortcuts.items.placeSkill', { skill: t('hitEditor.skillTypes.comboSkill') }),
      ],
      [
        '4',
        t('timeline.shortcuts.items.placeSkill', { skill: t('hitEditor.skillTypes.ultimate') }),
      ],
      ['5', t('timeline.shortcuts.items.placeSkill', { skill: t('hitEditor.skillTypes.dive') })],
      [
        '6',
        t('timeline.shortcuts.items.placeSkill', { skill: t('hitEditor.skillTypes.finisher') }),
      ],
      [t('timeline.shortcuts.keys.cancelPlace'), t('timeline.shortcuts.items.cancelPlace')],
    ],
  },
  {
    title: t('timeline.shortcuts.sections.edit'),
    items: [
      [t('timeline.shortcuts.keys.undo'), t('timeline.shortcuts.items.undo')],
      [t('timeline.shortcuts.keys.redo'), t('timeline.shortcuts.items.redo')],
      [t('timeline.shortcuts.keys.copy'), t('timeline.shortcuts.items.copy')],
      [t('timeline.shortcuts.keys.paste'), t('timeline.shortcuts.items.paste')],
      [t('timeline.shortcuts.keys.delete'), t('timeline.shortcuts.items.delete')],
      [t('timeline.shortcuts.keys.nudgeLeft'), t('timeline.shortcuts.items.nudgeLeft')],
      [t('timeline.shortcuts.keys.nudgeRight'), t('timeline.shortcuts.items.nudgeRight')],
    ],
  },
  {
    title: t('timeline.shortcuts.sections.tools'),
    items: [
      [t('timeline.shortcuts.keys.cursorGuide'), t('timeline.shortcuts.items.cursorGuide')],
      [t('timeline.shortcuts.keys.boxSelect'), t('timeline.shortcuts.items.boxSelect')],
      [t('timeline.shortcuts.keys.multiSelect'), t('timeline.shortcuts.items.multiSelect')],
      [t('timeline.shortcuts.keys.panTimeline'), t('timeline.shortcuts.items.panTimeline')],
      [t('timeline.shortcuts.keys.snapPrecision'), t('timeline.shortcuts.items.snapPrecision')],
      [t('timeline.shortcuts.keys.connectionTool'), t('timeline.shortcuts.items.connectionTool')],
      [t('timeline.shortcuts.keys.snapToAction'), t('timeline.shortcuts.items.snapToAction')],
      [t('timeline.shortcuts.keys.alignToAction'), t('timeline.shortcuts.items.alignToAction')],
    ],
  },
]);
</script>

<template>
  <InputRegionBoundary label="TimelineShortcutHelpDialog" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="t('timeline.shortcuts.dialogTitle')"
      width="min(720px, 90vw)"
      append-to-body
      class="timeline-shortcuts-dialog"
      @update:model-value="$emit('update:visible', $event)"
    >
      <div class="shortcut-sections">
        <section v-for="section in sections" :key="section.title">
          <h3>{{ section.title }}</h3>
          <div v-for="item in section.items" :key="item[0]" class="shortcut-row">
            <kbd>{{ item[0] }}</kbd
            ><span>{{ item[1] }}</span>
          </div>
        </section>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.shortcut-sections {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.shortcut-sections section {
  padding: 12px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
.shortcut-sections h3 {
  margin: 0 0 12px;
  color: var(--ea-fg);
  font-size: 13px;
}
.shortcut-row {
  display: grid;
  grid-template-columns: minmax(70px, auto) 1fr;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  color: var(--ea-fg-secondary);
  font-size: 12px;
}
kbd {
  justify-self: start;
  padding: 2px 5px;
  border: 1px solid var(--ea-border);
  border-bottom-width: 2px;
  background: var(--ea-fill-input, #111);
  color: var(--ea-gold);
  font-family: 'Roboto Mono', Consolas, monospace;
}
@media (max-width: 720px) {
  .shortcut-sections {
    grid-template-columns: 1fr;
  }
}
</style>
