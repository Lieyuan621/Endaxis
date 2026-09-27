<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaDialogActions } from '@/design-system';
import type { GlobalConfigDocument } from '../../../core/project/schema';
import type { CombatBuffDefinitionAttributeModifier } from '../../../../packages/game-data-contract/src/buffs';
import ScenarioBuffAttributeFields from '../../editor/ScenarioBuffAttributeFields.vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';

export interface GlobalEffectChoice {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly custom: boolean;
}

const props = defineProps<{
  readOnly?: boolean;
  mode?: 'modifiers' | 'presets';
  config: GlobalConfigDocument;
  /** 可选全局效果目录；名称与描述由宿主解析，面板不读取资产库。 */
  effects?: readonly GlobalEffectChoice[];
}>();
const emit = defineEmits<{
  setModifiers: [modifiers: readonly CombatBuffDefinitionAttributeModifier[]];
  setConfig: [config: GlobalConfigDocument];
}>();
const { t } = useI18n({ useScope: 'global' });
const editorVisible = ref(false);
const effects = computed(() => props.effects ?? []);
const effectReferences = computed(() => props.config.effects ?? []);
const unknownReferences = computed(() =>
  effectReferences.value.filter(
    reference => !effects.value.some(effect => effect.id === reference.effectId),
  ),
);
function referenceFor(effectId: string) {
  return effectReferences.value.find(reference => reference.effectId === effectId);
}
function effectEnabled(effectId: string): boolean {
  return referenceFor(effectId)?.enabled ?? false;
}
function toggleEffect(effectId: string) {
  if (props.readOnly) return;
  const references = effectReferences.value;
  emit('setConfig', {
    ...props.config,
    effects: referenceFor(effectId)
      ? references.map(reference =>
          reference.effectId === effectId
            ? { ...reference, enabled: !reference.enabled }
            : reference,
        )
      : [...references, { effectId, enabled: true }],
  });
}
/** 只删除方案中的引用；效果资产本身不受影响。 */
function removeEffectReference(effectId: string) {
  if (props.readOnly) return;
  emit('setConfig', {
    ...props.config,
    effects: effectReferences.value.filter(reference => reference.effectId !== effectId),
  });
}
</script>

<template>
  <section v-if="mode === 'presets'" class="global-config-presets">
    <div class="preset-title">{{ t('globalConfig.effectsTitle') }}</div>
    <p v-if="effects.length === 0" class="empty-hint">{{ t('globalConfig.effectsEmpty') }}</p>
    <div v-else class="preset-grid" role="group" :aria-label="t('globalConfig.effectsTitle')">
      <article v-for="effect in effects" :key="effect.id" class="effect-card">
        <EaButton
          class="preset-tile"
          :pressed="effectEnabled(effect.id)"
          :disabled="readOnly"
          @click="toggleEffect(effect.id)"
        >
          <strong>{{ effect.name }}</strong
          ><small v-if="effect.description">{{ effect.description }}</small>
        </EaButton>
        <div v-if="referenceFor(effect.id)" class="effect-actions">
          <EaButton
            v-if="referenceFor(effect.id)"
            size="sm"
            variant="danger"
            :disabled="readOnly"
            @click="removeEffectReference(effect.id)"
            >{{ t('common.delete') }}</EaButton
          >
        </div>
      </article>
    </div>
    <div v-if="unknownReferences.length" class="unknown-effects">
      <div
        v-for="reference in unknownReferences"
        :key="reference.effectId"
        class="unknown-effect-row"
      >
        <span>{{ t('globalConfig.unknownEffect', { id: reference.effectId }) }}</span>
        <EaButton
          size="sm"
          variant="danger"
          :disabled="readOnly"
          @click="removeEffectReference(reference.effectId)"
          >{{ t('common.delete') }}</EaButton
        >
      </div>
    </div>
  </section>
  <section v-else class="global-config-settings">
    <div class="panel-title">{{ t('globalConfig.customSection') }}</div>
    <div class="stats-summary">
      <ScenarioBuffAttributeFields
        :modifiers="config.customBuff?.attributeModifiers ?? []"
        summary
      />
      <EaButton size="sm" class="stats-edit-btn" @click="editorVisible = true">{{
        t('globalConfig.editCustom')
      }}</EaButton>
    </div>
    <InputRegionBoundary label="global-modifiers" :active="editorVisible" modal>
      <EaDialog
        v-model="editorVisible"
        width="440px"
        append-to-body
        align-center
        class="armory-dialog global-modifiers-dialog"
        :title="t('globalConfig.editCustomTitle')"
      >
        <ScenarioBuffAttributeFields
          :modifiers="config.customBuff?.attributeModifiers ?? []"
          :read-only="readOnly"
          @change="emit('setModifiers', $event)"
        />
        <template #footer>
          <EaDialogActions>
            <EaButton size="sm" @click="editorVisible = false">{{ t('common.close') }}</EaButton>
          </EaDialogActions>
        </template>
      </EaDialog>
    </InputRegionBoundary>
  </section>
</template>
<style scoped>
.global-config-settings,
.global-config-presets {
  height: 100%;
  overflow: auto;
  padding: 12px 12px 16px;
  box-sizing: border-box;
  background: var(--ea-workbench-panel);
  color: var(--ea-fg);
}
.panel-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ea-fg-secondary);
}
.stats-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty-hint {
  margin: 0;
  padding: 4px 0 2px;
  color: var(--ea-fg-faint);
  font-size: 12px;
}
.stats-edit-btn {
  align-self: stretch;
  margin-top: 4px;
}
.global-config-presets {
  padding: 14px 16px 20px;
}
.preset-title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ea-fg-secondary);
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 160px));
  gap: 8px;
  max-width: none;
  align-items: start;
}
.preset-tile {
  height: 64px;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  white-space: normal;
  background: var(--ea-keycap-bg);
  border: 1px solid var(--ea-border-strong);
}
.preset-tile strong {
  font-size: 13px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.preset-tile small {
  color: var(--ea-fg-muted);
  font-size: 11px;
  line-height: 1.3;
}
.preset-tile[aria-pressed='true'] {
  --ea-control-pressed-border-hover: color-mix(in srgb, var(--ea-gold) 55%, transparent);
  --ea-control-pressed-bg-hover: color-mix(in srgb, var(--ea-gold) 12%, var(--ea-keycap-bg));
  border-color: var(--ea-control-pressed-border-hover);
  background: var(--ea-control-pressed-bg-hover);
  box-shadow: none;
}
.effect-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.effect-card .preset-tile {
  width: 100%;
}
.effect-actions {
  display: flex;
  gap: 6px;
  padding-top: 6px;
}
.effect-actions > * {
  flex: 1;
}
.unknown-effects {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}
.unknown-effect-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px;
  background: var(--ea-fill-soft);
  border: 1px solid var(--ea-border-soft);
  font-size: 12px;
  color: var(--ea-fg-secondary);
}
</style>
