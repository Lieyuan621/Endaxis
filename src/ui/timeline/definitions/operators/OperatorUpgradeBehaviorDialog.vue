<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { EaButton } from '../../../../design-system/index';
import {
  useDefinitionPageDraft,
  projectDefinitionHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import DefinitionHistoryControls from '../DefinitionHistoryControls.vue';
import { cloneStructureValue } from '../skillStructureEditorCommands';
import {
  SKILL_LEVEL_SOURCES,
  SP_GAIN_KINDS,
  SP_GAIN_SOURCES,
  type ActionSequenceDefinition,
  type CombatStepDefinition,
  type OperatorPassiveSkillDefinition,
  type OperatorUpgradeDefinition,
  type UpgradeEvent,
} from '../../../../core/game-data/operatorDefinition';
import {
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
  type EditableCombatStepKind,
} from '../skills/skillDefinitionEditorViewModel';
import ActionSequenceWorkspace from '../actions/ActionSequenceWorkspace.vue';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';

type UpgradeHandler = NonNullable<OperatorUpgradeDefinition['eventHandlers']>[number];
type Category = 'initialization' | 'eventHandlers' | 'passiveSkills';
const props = defineProps<{
  visible: boolean;
  fillAvailable?: boolean;
  upgrade: OperatorUpgradeDefinition;
  skillLevel: number;
  skillGroupKeys: readonly string[];
  sharedHistory?: DefinitionDraftHistory<OperatorUpgradeDefinition>;
  progressionKind?: 'talents' | 'potentials';
}>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  save: [upgrade: OperatorUpgradeDefinition];
}>();
const {
  draft,
  history,
  reset: resetDraft,
} = useDefinitionPageDraft<OperatorUpgradeDefinition>(
  () => props.upgrade,
  props.sharedHistory,
  () => ({ path: '', section: category.value, objectId: String(selectedIndex.value) }),
);
const editorRoot = ref<HTMLElement | null>(null);
useEditorHistoryShortcuts(editorRoot, history.restore);
const sequenceHistory = projectDefinitionHistory<ActionSequenceDefinition>(
  history,
  updateSequence,
  () => ({ section: category.value, objectId: String(selectedIndex.value) }),
);
watch(
  () => history.restoredLocation?.value,
  location => {
    if (!location || (props.sharedHistory && location.page !== 'upgradeBehavior')) return;
    const categoryName = props.sharedHistory ? location.upgradeCategory : location.section;
    if (categoryName) category.value = categoryName as Category;
    if (location.objectId !== undefined) selectedIndex.value = Number(location.objectId);
  },
  { flush: 'post' },
);
const category = ref<Category>('initialization');
const selectedIndex = ref(0);
const structureRevision = ref(0);
const upgradeLevel = ref(1);
const upgradeLevels = computed(() =>
  props.progressionKind === 'potentials' ? 1 : Math.max(1, props.upgrade.levels ?? 1),
);
const handlers = computed(() => draft.value.eventHandlers ?? []);
const passives = computed(() => draft.value.passiveSkills ?? []);
const selectedHandler = computed(() =>
  category.value === 'eventHandlers' ? handlers.value[selectedIndex.value] : undefined,
);
const selectedPassive = computed(() =>
  category.value === 'passiveSkills' ? passives.value[selectedIndex.value] : undefined,
);
const editingLevel = computed(() =>
  selectedPassive.value?.levelSource === undefined ? upgradeLevel.value : props.skillLevel,
);
const selectedSequence = computed(() =>
  category.value === 'initialization'
    ? draft.value.initializationSequence
    : (selectedHandler.value?.sequence ?? selectedPassive.value?.enableSequence),
);

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    resetDraft(props.upgrade);
    const location = props.sharedHistory?.restoredLocation?.value;
    category.value =
      location?.page === 'upgradeBehavior'
        ? ((location.upgradeCategory as Category) ?? 'initialization')
        : 'initialization';
    selectedIndex.value = location?.page === 'upgradeBehavior' ? Number(location.objectId ?? 0) : 0;
    upgradeLevel.value = 1;
  },
  { immediate: true },
);
function syntheticSkill() {
  return {
    key: 'operator-upgrade-behavior',
    timelineBlockFrames: 0,
    scheduledSequences: [{ startFrame: 0, sequence: selectedSequence.value ?? { steps: [] } }],
  };
}
function createStep(kind: EditableCombatStepKind): CombatStepDefinition {
  return createSkillEditorStep(syntheticSkill(), kind);
}
function duplicateStep(step: CombatStepDefinition): CombatStepDefinition {
  return duplicateSkillEditorDetachedStep(syntheticSkill(), step);
}
function replaceHandlers(value: readonly UpgradeHandler[]): void {
  draft.value = { ...draft.value, eventHandlers: value.length === 0 ? undefined : value };
}
function replacePassives(value: readonly OperatorPassiveSkillDefinition[]): void {
  draft.value = { ...draft.value, passiveSkills: value.length === 0 ? undefined : value };
}
function defaultEvent(kind: UpgradeEvent['kind']): UpgradeEvent {
  if (kind === 'spGained') return { kind, source: 'skill', gainKind: 'gain' };
  if (kind === 'buffConsumed') return { kind, buffIds: [] };
  if (kind === 'skillHit')
    return { kind, skillGroupKey: props.skillGroupKeys[0] ?? '', scope: 'operator' };
  return { kind: 'elementalAttachmentConsumed' };
}
function addItem(): void {
  structureRevision.value++;
  if (category.value === 'initialization') {
    draft.value = { ...draft.value, initializationSequence: { steps: [] } };
    return;
  }
  if (category.value === 'eventHandlers') {
    const next = [...handlers.value, { event: defaultEvent('spGained'), sequence: { steps: [] } }];
    replaceHandlers(next);
    selectedIndex.value = next.length - 1;
    return;
  }
  const keys = new Set(passives.value.map(value => value.key));
  let index = 1;
  while (keys.has(`custom-passive-${index}`)) index += 1;
  const next = [
    ...passives.value,
    { key: `custom-passive-${index}`, enableSequence: { steps: [] } },
  ];
  replacePassives(next);
  selectedIndex.value = next.length - 1;
}
function updateHandler(value: UpgradeHandler): void {
  const next = [...handlers.value];
  next[selectedIndex.value] = value;
  replaceHandlers(next);
}
function updatePassive(value: OperatorPassiveSkillDefinition): void {
  const next = [...passives.value];
  next[selectedIndex.value] = value;
  replacePassives(next);
}
function updateSequence(sequence: ActionSequenceDefinition): void {
  if (category.value === 'initialization')
    draft.value = { ...draft.value, initializationSequence: sequence };
  else if (selectedHandler.value) updateHandler({ ...selectedHandler.value, sequence });
  else if (selectedPassive.value)
    updatePassive({ ...selectedPassive.value, enableSequence: sequence });
}
function updateEventKind(event: Event): void {
  if (!selectedHandler.value) return;
  updateHandler({
    ...selectedHandler.value,
    event: defaultEvent((event.target as HTMLSelectElement).value as UpgradeEvent['kind']),
  });
}
function patchEvent(values: Record<string, unknown>): void {
  if (!selectedHandler.value) return;
  updateHandler({
    ...selectedHandler.value,
    event: { ...selectedHandler.value.event, ...values } as UpgradeEvent,
  });
}
function updateHandlerBlackboard(blackboard: NonNullable<UpgradeHandler['blackboard']>): void {
  if (selectedHandler.value)
    updateHandler({
      ...selectedHandler.value,
      blackboard: Object.keys(blackboard).length ? blackboard : undefined,
    });
}
function updatePassiveBlackboard(
  blackboard: NonNullable<OperatorPassiveSkillDefinition['blackboard']>,
): void {
  if (selectedPassive.value)
    updatePassive({
      ...selectedPassive.value,
      blackboard: Object.keys(blackboard).length ? blackboard : undefined,
    });
}
function updatePassiveKey(event: Event): void {
  if (selectedPassive.value)
    updatePassive({ ...selectedPassive.value, key: (event.target as HTMLInputElement).value });
}
function updatePassiveLevel(event: Event): void {
  if (!selectedPassive.value) return;
  const value = (event.target as HTMLSelectElement).value;
  if (!value) {
    const { levelSource: _removed, ...next } = selectedPassive.value;
    updatePassive(next);
  } else
    updatePassive({
      ...selectedPassive.value,
      levelSource: value as OperatorPassiveSkillDefinition['levelSource'],
    });
}
function moveItem(offset: -1 | 1): void {
  structureRevision.value++;
  const source = category.value === 'eventHandlers' ? [...handlers.value] : [...passives.value];
  const target = selectedIndex.value + offset;
  if (target < 0 || target >= source.length) return;
  [source[selectedIndex.value], source[target]] = [source[target]!, source[selectedIndex.value]!];
  if (category.value === 'eventHandlers') replaceHandlers(source as UpgradeHandler[]);
  else replacePassives(source as OperatorPassiveSkillDefinition[]);
  selectedIndex.value = target;
}
function removeItem(): void {
  structureRevision.value++;
  if (category.value === 'initialization')
    draft.value = (({ initializationSequence: _removed, ...rest }) => rest)(draft.value);
  else if (category.value === 'eventHandlers')
    replaceHandlers(handlers.value.filter((_, index) => index !== selectedIndex.value));
  else replacePassives(passives.value.filter((_, index) => index !== selectedIndex.value));
  selectedIndex.value = Math.max(0, selectedIndex.value - 1);
}
function save(): void {
  emit('save', cloneStructureValue(draft.value));
  emit('update:visible', false);
}
</script>

<template>
  <section
    v-if="visible"
    ref="editorRoot"
    class="embedded-editor"
    :class="{ 'fill-available': fillAvailable }"
  >
    <div class="embedded-header">
      <EaButton class="definition-focused-back" size="sm" @click="emit('update:visible', false)">
        {{ progressionKind === 'potentials' ? '← 返回潜能' : '← 返回天赋' }}
      </EaButton>
      <div class="title">
        <strong>{{ progressionKind === 'potentials' ? '潜能行为' : '天赋行为' }}</strong
        ><small>初始化、事件监听与附属被动具有不同安装和执行时机。</small>
      </div>
      <label v-if="progressionKind !== 'potentials' && selectedPassive?.levelSource === undefined">
        编辑养成等级
        <select v-model.number="upgradeLevel">
          <option v-for="level in upgradeLevels" :key="level" :value="level">{{ level }}</option>
        </select>
      </label>
    </div>
    <div class="workspace">
      <aside>
        <button
          :class="{ active: category === 'initialization' }"
          @click="
            category = 'initialization';
            selectedIndex = 0;
          "
        >
          <strong>初始化序列</strong><small>{{ draft.initializationSequence ? 1 : 0 }}</small>
        </button>
        <button
          :class="{ active: category === 'eventHandlers' }"
          @click="
            category = 'eventHandlers';
            selectedIndex = 0;
          "
        >
          <strong>事件响应</strong><small>{{ handlers.length }}</small>
        </button>
        <button
          :class="{ active: category === 'passiveSkills' }"
          @click="
            category = 'passiveSkills';
            selectedIndex = 0;
          "
        >
          <strong>附属被动</strong><small>{{ passives.length }}</small>
        </button>
        <button class="add" @click="addItem">
          ＋ {{ category === 'initialization' ? '创建序列' : '新增当前类型' }}
        </button>
        <template v-if="category === 'eventHandlers'"
          ><button
            v-for="(handler, index) in handlers"
            :key="index"
            :class="{ active: selectedIndex === index }"
            @click="selectedIndex = index"
          >
            {{ index + 1 }} · {{ handler.event.kind }}
          </button></template
        >
        <template v-if="category === 'passiveSkills'"
          ><button
            v-for="(passive, index) in passives"
            :key="`${passive.key}:${index}`"
            :class="{ active: selectedIndex === index }"
            @click="selectedIndex = index"
          >
            {{ passive.key }}
          </button></template
        >
      </aside>
      <main v-if="selectedSequence" class="graph-main">
        <div class="behavior-metadata">
          <header>
            <div>
              <strong>{{
                category === 'initialization'
                  ? '启用养成时执行一次'
                  : category === 'eventHandlers'
                    ? '事件条件命中后执行'
                    : '附属被动启用时执行'
              }}</strong
              ><small>不是时间轴可释放技能</small>
            </div>
            <div class="actions">
              <button
                v-if="category !== 'initialization'"
                :disabled="selectedIndex === 0"
                @click="moveItem(-1)"
              >
                上移</button
              ><button
                v-if="category !== 'initialization'"
                :disabled="
                  selectedIndex ===
                  (category === 'eventHandlers' ? handlers.length : passives.length) - 1
                "
                @click="moveItem(1)"
              >
                下移</button
              ><button class="danger" @click="removeItem">删除</button>
            </div>
          </header>
          <section v-if="selectedHandler" class="fields">
            <label
              >事件类型<select :value="selectedHandler.event.kind" @change="updateEventKind">
                <option value="spGained">获得技力</option>
                <option value="elementalAttachmentConsumed">元素附着被消耗</option>
                <option value="buffConsumed">消费 Buff</option>
                <option value="skillHit">技能命中</option>
              </select></label
            >
            <template v-if="selectedHandler.event.kind === 'spGained'"
              ><label
                >技力来源<select
                  :value="selectedHandler.event.source ?? ''"
                  @change="
                    patchEvent({ source: ($event.target as HTMLSelectElement).value || undefined })
                  "
                >
                  <option value="">任意</option>
                  <option v-for="value in SP_GAIN_SOURCES" :key="value" :value="value">
                    {{ value }}
                  </option>
                </select></label
              ><label
                >获得方式<select
                  :value="selectedHandler.event.gainKind ?? ''"
                  @change="
                    patchEvent({
                      gainKind: ($event.target as HTMLSelectElement).value || undefined,
                    })
                  "
                >
                  <option value="">任意</option>
                  <option v-for="value in SP_GAIN_KINDS" :key="value" :value="value">
                    {{ value }}
                  </option>
                </select></label
              ></template
            >
            <label v-if="selectedHandler.event.kind === 'buffConsumed'"
              >Buff ID<input
                :value="selectedHandler.event.buffIds.join(', ')"
                @change="
                  patchEvent({
                    buffIds: ($event.target as HTMLInputElement).value
                      .split(',')
                      .map(value => value.trim())
                      .filter(Boolean),
                  })
                "
              /><small>匹配被当前干员作为来源消费的明确 Buff 身份。</small></label
            >
            <template v-if="selectedHandler.event.kind === 'skillHit'"
              ><label
                >技能组<select
                  :value="selectedHandler.event.skillGroupKey"
                  @change="
                    patchEvent({ skillGroupKey: ($event.target as HTMLSelectElement).value })
                  "
                >
                  <option v-for="key in skillGroupKeys" :key="key" :value="key">{{ key }}</option>
                </select></label
              ><label
                >来源范围<select
                  :value="selectedHandler.event.scope"
                  @change="patchEvent({ scope: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="operator">当前干员</option>
                  <option value="team">全队</option>
                </select></label
              ></template
            >
          </section>
          <section v-if="selectedPassive" class="fields">
            <label>稳定 key<input :value="selectedPassive.key" @change="updatePassiveKey" /></label
            ><label
              >等级来源<select
                :value="selectedPassive.levelSource ?? ''"
                @change="updatePassiveLevel"
              >
                <option value="">使用当前养成等级</option>
                <option v-for="value in SKILL_LEVEL_SOURCES" :key="value" :value="value">
                  {{ value }}
                </option>
              </select></label
            >
          </section>
          <SkillBlackboardEditor
            v-if="selectedHandler"
            :blackboard="selectedHandler.blackboard ?? {}"
            :skill-level="editingLevel"
            @update="updateHandlerBlackboard"
          />
          <SkillBlackboardEditor
            v-if="selectedPassive"
            :blackboard="selectedPassive.blackboard ?? {}"
            :skill-level="editingLevel"
            @update="updatePassiveBlackboard"
          />
        </div>
        <ActionSequenceWorkspace
          :key="`${category}:${selectedIndex}:${structureRevision}`"
          :sequence="selectedSequence"
          :shared-history="sequenceHistory"
          :skill-level="editingLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          @update="updateSequence"
        />
      </main>
      <main v-else class="empty">当前分类没有行为定义。</main>
    </div>
    <div v-if="!sharedHistory" class="embedded-footer">
      <DefinitionHistoryControls :history="history" />
      <EaButton size="sm" @click="emit('update:visible', false)"> 取消</EaButton
      ><EaButton variant="primary" size="sm" @click="save"> 保存养成行为 </EaButton>
    </div>
  </section>
</template>

<style scoped>
.title {
  display: grid;
  gap: 4px;
}
main.graph-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.graph-main > .behavior-metadata {
  flex: 0 1 auto;
  max-height: 35%;
  overflow: auto;
}
.behavior-metadata > header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.behavior-metadata > header > div:first-child {
  display: grid;
  gap: 3px;
}
.embedded-editor {
  min-width: 0;
}
.embedded-header,
.embedded-footer {
  padding: 12px 0;
}
.embedded-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.title small,
header small,
label small {
  color: var(--ea-fg-muted);
}
.workspace {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: min(700px, calc(100vh - 195px));
  border: 1px solid var(--ea-border-soft);
}
aside {
  padding: 12px;
  border-right: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
  overflow: auto;
}
aside button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 6px;
  padding: 9px;
  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
  cursor: pointer;
}
aside button.active {
  border-left-color: var(--ea-gold);
  background: var(--ea-active-fill);
  color: var(--ea-gold);
}
aside .add {
  margin: 10px 0;
  border: 1px dashed var(--ea-border);
}
main {
  min-width: 0;
  padding: 16px;
  overflow: auto;
}
main > header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
main > header div:first-child {
  display: grid;
  gap: 3px;
}
.actions {
  display: flex;
  gap: 5px;
}
.actions button {
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg-secondary);
}
.actions .danger {
  color: #e69a7a;
}
.actions button:disabled {
  opacity: 0.4;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
label {
  display: grid;
  gap: 6px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
input,
select {
  min-width: 0;
  height: 32px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.empty {
  display: grid;
  place-items: center;
  color: var(--ea-fg-muted);
}
@media (max-width: 800px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  aside {
    max-height: 180px;
    border-right: 0;
    border-bottom: 1px solid var(--ea-border-soft);
  }
}
</style>
<style scoped src="../behaviorDefinitionWorkspace.css"></style>
