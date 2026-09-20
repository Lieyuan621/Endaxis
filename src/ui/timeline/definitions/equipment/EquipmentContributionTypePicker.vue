<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, type CSSProperties } from 'vue';
import { useInteractionSession } from '../../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../../interaction/usePopoverInteractionBoundary';
import {
  EQUIPMENT_ABILITY_EVENTS,
  EQUIPMENT_DAMAGE_SCALE_TARGETS,
  EQUIPMENT_PANEL_STATS,
  type EquipmentAttribute,
  type EquipmentEventHandlerDefinition,
  type EquipmentModifierDefinition,
} from '../../../../core/game-data/equipmentDefinition';
import {
  DAMAGE_TYPES,
  OPERATOR_ATTRIBUTES,
  SKILL_TYPES,
  type SkillType,
} from '../../../../core/game-data/operatorDefinition';
import {
  createCombatEventTriggerDraft,
  EDITABLE_COMBAT_EVENT_TRIGGER_KINDS,
  type EditableCombatEventTriggerKind,
} from '../actions/combatEventTriggerCatalog';

const props = defineProps<{
  mode: 'modifier' | 'handler';
  anchor: { readonly x: number; readonly y: number };
  levelCount: number;
  handlerKeys: readonly string[];
}>();
const emit = defineEmits<{
  modifier: [modifier: EquipmentModifierDefinition];
  handler: [handler: EquipmentEventHandlerDefinition];
  close: [];
}>();
const popover = ref<HTMLElement>();
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => true,
  () => emit('close'),
);
const style = ref<CSSProperties>({});
const attributes = [
  ...OPERATOR_ATTRIBUTES,
  'main',
  'secondary',
] as const satisfies readonly EquipmentAttribute[];

function values(): number[] {
  return Array.from({ length: Math.max(1, props.levelCount) }, () => 0);
}

function chooseAttribute(attribute: EquipmentAttribute, operation: 'flat' | 'percent'): void {
  emit('modifier', { kind: 'attribute', attribute, operation, value: values() });
}

function choosePanelStat(stat: (typeof EQUIPMENT_PANEL_STATS)[number]): void {
  emit('modifier', { kind: 'panelStat', stat, value: values() });
}

function chooseDamageBonus(damageType: (typeof DAMAGE_TYPES)[number]): void {
  emit('modifier', { kind: 'damageBonus', damageTypes: damageType, value: values() });
}

function chooseDamageScale(target: (typeof EQUIPMENT_DAMAGE_SCALE_TARGETS)[number]): void {
  emit('modifier', { kind: 'damageScale', target, slot: 'baseAddition', value: values() });
}

function chooseStaticHealingIncrease(target: 'output' | 'taken'): void {
  emit('modifier', { kind: 'staticHealingIncrease', target, value: values() });
}

function chooseSkillCooldownMultiplier(skillType: SkillType): void {
  emit('modifier', { kind: 'skillCooldownMultiplier', skillTypes: skillType, value: values() });
}

function chooseHandler(kind: EditableCombatEventTriggerKind): void {
  const prefix = `event-${kind}`;
  let key = prefix;
  let suffix = 2;
  while (props.handlerKeys.includes(key)) key = `${prefix}-${suffix++}`;
  emit('handler', { key, event: createCombatEventTriggerDraft(kind), sequence: { steps: [] } });
}

function chooseAbilityHandler(abilityEvent: (typeof EQUIPMENT_ABILITY_EVENTS)[number]): void {
  const prefix = `ability-${abilityEvent}`;
  let key = prefix;
  let suffix = 2;
  while (props.handlerKeys.includes(key)) key = `${prefix}-${suffix++}`;
  emit('handler', { key, abilityEvent, sequence: { steps: [] } });
}

function position(): void {
  const width = Math.min(420, window.innerWidth - 24);
  const left = Math.max(12, Math.min(props.anchor.x, window.innerWidth - width - 12));
  const below = window.innerHeight - props.anchor.y > 360;
  style.value = {
    left: `${left}px`,
    width: `${width}px`,
    top: below ? `${props.anchor.y + 6}px` : undefined,
    bottom: below ? undefined : `${window.innerHeight - props.anchor.y + 6}px`,
  };
}

function outside(event: PointerEvent): void {
  if (!popover.value?.contains(event.target as Node)) emit('close');
}

onMounted(async () => {
  await nextTick();
  position();
  document.addEventListener('pointerdown', outside);
  window.addEventListener('resize', position);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside);
  window.removeEventListener('resize', position);
});
</script>

<template>
  <Teleport to="body">
    <div ref="popover" class="equipment-type-picker" :style="style">
      <header>
        <strong>{{ mode === 'modifier' ? '选择属性修正类型' : '选择事件响应类型' }}</strong>
        <span>先明确结构类型，再进入节点 Inspector</span>
      </header>
      <div v-if="mode === 'modifier'" class="options">
        <section>
          <h5>属性 · 固定值</h5>
          <button
            v-for="attribute in attributes"
            :key="`flat:${attribute}`"
            @click="chooseAttribute(attribute, 'flat')"
          >
            {{ attribute }}
          </button>
        </section>
        <section>
          <h5>属性 · 百分比</h5>
          <button
            v-for="attribute in attributes"
            :key="`percent:${attribute}`"
            @click="chooseAttribute(attribute, 'percent')"
          >
            {{ attribute }}
          </button>
        </section>
        <section>
          <h5>面板属性</h5>
          <button v-for="stat in EQUIPMENT_PANEL_STATS" :key="stat" @click="choosePanelStat(stat)">
            {{ stat }}
          </button>
        </section>
        <section>
          <h5>伤害加成</h5>
          <button
            v-for="damageType in DAMAGE_TYPES"
            :key="damageType"
            @click="chooseDamageBonus(damageType)"
          >
            {{ damageType }}
          </button>
        </section>
        <section>
          <h5>原生伤害倍率</h5>
          <button
            v-for="target in EQUIPMENT_DAMAGE_SCALE_TARGETS"
            :key="target"
            @click="chooseDamageScale(target)"
          >
            {{ target }}
          </button>
        </section>
        <section>
          <h5>治疗增幅</h5>
          <button @click="chooseStaticHealingIncrease('output')">output</button>
          <button @click="chooseStaticHealingIncrease('taken')">taken</button>
        </section>
        <section>
          <h5>技能冷却倍率</h5>
          <button
            v-for="skillType in SKILL_TYPES"
            :key="skillType"
            @click="chooseSkillCooldownMultiplier(skillType)"
          >
            {{ skillType }}
          </button>
        </section>
      </div>
      <div v-else class="options">
        <section>
          <h5>战斗事件</h5>
          <button
            v-for="kind in EDITABLE_COMBAT_EVENT_TRIGGER_KINDS"
            :key="kind"
            @click="chooseHandler(kind)"
          >
            {{ kind }}
          </button>
        </section>
        <section>
          <h5>AbilitySystem 事件</h5>
          <button
            v-for="event in EQUIPMENT_ABILITY_EVENTS"
            :key="event"
            @click="chooseAbilityHandler(event)"
          >
            {{ event }}
          </button>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.equipment-type-picker {
  position: fixed;
  z-index: 4100;
  border: 1px solid var(--ea-border);
  background: var(--ea-workbench-panel);
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
}
header {
  display: grid;
  gap: 3px;
  padding: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
header strong {
  font-size: 12px;
}
header span,
h5 {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.options {
  max-height: min(430px, calc(100vh - 150px));
  padding: 10px;
  overflow: auto;
}
section {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
section + section {
  margin-top: 12px;
}
h5 {
  width: 100%;
  margin: 0 0 2px;
}
button {
  min-height: 28px;
  padding: 4px 8px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
  cursor: pointer;
}
button:hover {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}
</style>
