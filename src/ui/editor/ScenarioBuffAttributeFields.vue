<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaNumberInput } from '@/design-system';
import type { CombatBuffDefinitionAttributeModifier } from '../../../packages/game-data-contract/src/buffs';
const props = defineProps<{
  modifiers: readonly CombatBuffDefinitionAttributeModifier[];
  readOnly?: boolean;
  summary?: boolean;
}>();
const emit = defineEmits<{
  change: [modifiers: readonly CombatBuffDefinitionAttributeModifier[]];
}>();
const { t } = useI18n({ useScope: 'global' });
interface ModifierChoice {
  attribute: string;
  slot: CombatBuffDefinitionAttributeModifier['slot'];
  nameKey: string;
  percentage: boolean;
  reduction?: boolean;
}
const choices: readonly ModifierChoice[] = [
  {
    attribute: 'ComboSkillCooldownScalar',
    slot: 'finalMultiplier',
    nameKey: 'statDetail.comboCdReduction',
    percentage: true,
    reduction: true,
  },
  {
    attribute: 'UltimateSpGainScalar',
    slot: 'baseAddition',
    nameKey: 'effects.name.ultimateGainEfficiency',
    percentage: true,
  },
  {
    attribute: 'PhysicalAndSpellInflictionEnhance',
    slot: 'baseAddition',
    nameKey: 'effects.name.artsIntensity',
    percentage: false,
  },
  {
    attribute: 'Atk',
    slot: 'baseMultiplier',
    nameKey: 'effects.name.atkPercent',
    percentage: true,
  },
  {
    attribute: 'criticalRate',
    slot: 'baseAddition',
    nameKey: 'effects.name.critRate',
    percentage: true,
  },
  {
    attribute: 'criticalDamageIncrease',
    slot: 'baseAddition',
    nameKey: 'effects.name.critDmg',
    percentage: true,
  },
];
const groups = computed(() =>
  choices.map(choice => ({
    ...choice,
    entries: props.modifiers.filter(
      item => item.attribute === choice.attribute && item.slot === choice.slot,
    ),
  })),
);
const modifiers = computed(() => props.modifiers);
const otherModifiers = computed(() => props.modifiers.filter(item => !choiceFor(item)));
function choiceFor(modifier: CombatBuffDefinitionAttributeModifier) {
  return choices.find(
    choice => choice.attribute === modifier.attribute && choice.slot === modifier.slot,
  );
}
function displayValue(modifier: CombatBuffDefinitionAttributeModifier): number | undefined {
  const choice = choiceFor(modifier);
  if (typeof modifier.value !== 'number') return undefined;
  const value = modifier.value;
  if (!choice) return value;
  return (choice.reduction ? 1 - value : value) * (choice.percentage ? 100 : 1);
}
function formatValue(modifier: CombatBuffDefinitionAttributeModifier) {
  const choice = choiceFor(modifier);
  const display = displayValue(modifier);
  if (display === undefined) return t('globalConfig.expressionValue');
  const value = Number(display.toFixed(3));
  return `${value > 0 && !choice?.reduction ? '+' : ''}${value}${choice?.percentage ? '%' : ''}`;
}
function addModifier(choice: ModifierChoice) {
  if (props.readOnly) return;
  emit('change', [
    ...props.modifiers,
    { attribute: choice.attribute, slot: choice.slot, value: choice.reduction ? 1 : 0 },
  ]);
}
function updateModifierValue(
  modifier: CombatBuffDefinitionAttributeModifier,
  value: number | undefined,
) {
  if (props.readOnly || value === undefined || !Number.isFinite(value)) return;
  const choice = choiceFor(modifier);
  if (!choice || typeof modifier.value !== 'number') return;
  if (choice.reduction && value >= 100) return;
  const scaled = value / (choice.percentage ? 100 : 1);
  emit(
    'change',
    props.modifiers.map(item =>
      item === modifier ? { ...item, value: choice.reduction ? 1 - scaled : scaled } : item,
    ),
  );
}
function removeModifier(modifier: CombatBuffDefinitionAttributeModifier) {
  if (!props.readOnly)
    emit(
      'change',
      props.modifiers.filter(item => item !== modifier),
    );
}
</script>
<template>
  <div v-if="summary" class="modifier-summary">
    <p v-if="modifiers.length === 0" class="empty-hint">{{ t('globalConfig.customEmpty') }}</p>
    <div v-for="(modifier, index) in modifiers" :key="index" class="summary-row">
      <span>{{
        choiceFor(modifier)
          ? t(choiceFor(modifier)!.nameKey)
          : `${modifier.attribute} · ${modifier.slot}`
      }}</span
      ><strong>{{ formatValue(modifier) }}</strong>
    </div>
  </div>
  <template v-else>
    <div class="stat-blocks">
      <section
        v-for="group in groups"
        :key="group.attribute"
        class="stat-block"
        :class="{ 'has-entries': group.entries.length }"
      >
        <div class="stat-block-head">
          <span>{{ t(group.nameKey) }}</span>
          <EaButton size="sm" :disabled="readOnly" @click="addModifier(group)">{{
            t('globalConfig.addEntry')
          }}</EaButton>
        </div>
        <div v-if="group.entries.length" class="stat-block-body">
          <div v-for="(modifier, index) in group.entries" :key="index" class="stat-entry">
            <span class="affix">{{ group.percentage && !group.reduction ? '+' : '' }}</span>
            <EaNumberInput
              v-if="typeof modifier.value === 'number'"
              size="sm"
              controls-position="right"
              :aria-label="`${t(group.nameKey)} ${index + 1}`"
              :disabled="readOnly"
              :max="group.reduction ? 99.999 : undefined"
              :step="group.percentage ? 0.1 : 1"
              :model-value="displayValue(modifier)"
              @update:model-value="updateModifierValue(modifier, $event)"
            />
            <span v-else>{{ t('globalConfig.expressionValue') }}</span>
            <span class="affix">{{ group.percentage ? '%' : '' }}</span>
            <EaButton
              variant="danger"
              size="sm"
              :disabled="readOnly"
              @click="removeModifier(modifier)"
              >{{ t('common.delete') }}</EaButton
            >
          </div>
        </div>
      </section>
      <div v-for="(modifier, index) in otherModifiers" :key="index" class="summary-row">
        <span>{{ modifier.attribute }} · {{ modifier.slot }}</span>
        <strong>{{ formatValue(modifier) }}</strong>
        <EaButton
          variant="danger"
          size="sm"
          :disabled="readOnly"
          @click="removeModifier(modifier)"
          >{{ t('common.delete') }}</EaButton
        >
      </div>
    </div>
  </template>
</template>
<style scoped>
.modifier-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: var(--ea-fill-soft);
  border: 1px solid var(--ea-border-soft);
  font-size: 12px;
}
.summary-row span {
  min-width: 0;
  flex: 1;
  color: var(--ea-fg-secondary);
}
.summary-row strong {
  flex: none;
  font-weight: normal;
  font-variant-numeric: tabular-nums;
}
.empty-hint {
  margin: 0;
  padding: 4px 0 2px;
  color: var(--ea-fg-faint);
  font-size: 12px;
}

.stat-blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-block {
  background: var(--ea-fill-soft);
  border: 1px solid transparent;
}
.stat-block.has-entries {
  border-color: var(--ea-border-soft);
}
.stat-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
}
.stat-block-head > span {
  min-width: 0;
  flex: 1;
  font-size: 13px;
  color: var(--ea-fg-secondary);
}
.stat-block-head .ea-button {
  flex: none;
  min-width: 52px;
}
.stat-block-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 10px 8px;
  border-top: 1px solid var(--ea-border-soft);
}
.stat-entry {
  display: grid;
  grid-template-columns: 14px 96px 14px 52px;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.affix {
  text-align: center;
  font-size: 12px;
  color: var(--ea-fg-muted);
}
.stat-entry :deep(.ea-number-input) {
  width: 96px;
  min-width: 0;
}
.stat-entry .ea-button {
  padding: 0;
}
</style>
