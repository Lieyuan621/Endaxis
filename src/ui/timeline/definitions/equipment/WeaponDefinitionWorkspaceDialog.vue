<script setup lang="ts">
import { EaButton, EaDialog, EaDialogActions } from '../../../../design-system/index';
import '../definitionWorkspaceLayout.css';
import InputRegionBoundary from '../../../keyboard/InputRegionBoundary.vue';
import { editorDefinitionsEqual } from '../../../editorDefinitionsEqual';
import { replaceEquipmentContribution } from './replaceEquipmentContribution';
import { computed, ref, watch } from 'vue';
import { useDefinitionDraft, projectDefinitionHistory } from '../useDefinitionDraftHistory';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import DefinitionHistoryControls from '../DefinitionHistoryControls.vue';
import {
  WEAPON_RARITIES,
  type EquipmentContributionDefinition,
  type WeaponDefinition,
} from '../../../../core/game-data/equipmentDefinition';
import { OPERATOR_WEAPON_TYPES } from '../../../../core/game-data/operatorDefinition';
import { validateWeaponDefinition } from '../../../../core/game-data/equipmentDefinitionValidation';
import EquipmentContributionGraphEditor from './EquipmentContributionGraphEditor.vue';

const LEVEL_NODES = [1, 20, 40, 60, 80, 90] as const;
const props = defineProps<{
  visible: boolean;
  baseDefinition: WeaponDefinition;
  customDefinition: WeaponDefinition;
}>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  save: [definition: WeaponDefinition];
  reset: [];
}>();

const {
  draft,
  history,
  reset: resetDraft,
} = useDefinitionDraft<WeaponDefinition>(props.customDefinition);
const editorRoot = ref<HTMLElement | null>(null);
useEditorHistoryShortcuts(editorRoot, history.restore);
const contributionHistory = projectDefinitionHistory<EquipmentContributionDefinition>(
  history,
  updateTraitContribution,
  () => ({ objectId: String(selectedTraitIndex.value) }),
);
watch(
  () => history.restoredLocation?.value,
  location => {
    if (location?.objectId !== undefined) selectedSection.value = Number(location.objectId);
  },
  { flush: 'sync' },
);
const selectedSection = ref<'base' | number>('base');
const contributionEditorRevision = ref(0);
const issues = computed(() => validateWeaponDefinition(draft.value, '$.weapon'));
const isDirty = computed(() => !editorDefinitionsEqual(draft.value, props.customDefinition));
const selectedTraitIndex = computed(() =>
  typeof selectedSection.value === 'number' ? selectedSection.value : null,
);
const selectedTrait = computed(() =>
  selectedTraitIndex.value === null ? undefined : draft.value.traits[selectedTraitIndex.value],
);

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    resetDraft(props.customDefinition);
    selectedSection.value = 'base';
  },
  { immediate: true },
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function updateIdentity(
  field: 'displayName' | 'assetSlug' | 'iconPath' | 'rarity' | 'weaponType',
  event: Event,
): void {
  const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
  draft.value = {
    ...draft.value,
    [field]: field === 'rarity' ? Number(value) : value === '' ? undefined : value,
  } as WeaponDefinition;
}

function addTrait(): void {
  const keys = new Set(draft.value.traits.map(trait => trait.key));
  let index = 1;
  while (keys.has(`custom-trait-${index}`)) index += 1;
  draft.value = {
    ...draft.value,
    traits: [...draft.value.traits, { key: `custom-trait-${index}`, levelCount: 1 }],
  };
  selectedSection.value = draft.value.traits.length - 1;
}

function removeTrait(): void {
  const index = selectedTraitIndex.value;
  if (index === null) return;
  contributionEditorRevision.value += 1;
  draft.value = { ...draft.value, traits: draft.value.traits.filter((_, i) => i !== index) };
  selectedSection.value =
    draft.value.traits.length === 0 ? 'base' : Math.min(index, draft.value.traits.length - 1);
}

function moveTrait(offset: -1 | 1): void {
  const index = selectedTraitIndex.value;
  if (index === null) return;
  const target = index + offset;
  if (target < 0 || target >= draft.value.traits.length) return;
  const traits = [...draft.value.traits];
  [traits[index], traits[target]] = [traits[target]!, traits[index]!];
  draft.value = { ...draft.value, traits };
  selectedSection.value = target;
}

function updateBaseAttack(index: number, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  const values = [...draft.value.baseAttackAtLevelNodes];
  values[index] = value;
  draft.value = { ...draft.value, baseAttackAtLevelNodes: values };
}

function updateTrait(field: 'key' | 'levelCount', event: Event): void {
  const trait = selectedTrait.value;
  if (trait === undefined) return;
  const raw = (event.target as HTMLInputElement).value;
  const index = selectedTraitIndex.value;
  if (index === null) return;
  const traits = [...draft.value.traits];
  traits[index] = {
    ...trait,
    [field]: field === 'levelCount' ? Number(raw) : raw,
  };
  draft.value = { ...draft.value, traits };
}

function updateTraitContribution(contribution: EquipmentContributionDefinition): void {
  const index = selectedTraitIndex.value;
  const trait = selectedTrait.value;
  if (index === null || trait === undefined) return;
  const traits = [...draft.value.traits];
  traits[index] = replaceEquipmentContribution(trait, contribution);
  draft.value = { ...draft.value, traits };
}

function save(): void {
  if (issues.value.length > 0) return;
  emit('save', clone(draft.value));
  emit('update:visible', false);
}
</script>

<template>
  <InputRegionBoundary label="weapon-definition-workspace" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      width="min(1600px, calc(100vw - 32px))"
      top="16px"
      append-to-body
      destroy-on-close
      class="weapon-definition-dialog definition-workspace-dialog"
      @update:model-value="emit('update:visible', $event)"
    >
      <template #header>
        <div class="workspace-title">
          <div>
            <strong>自定义武器</strong><span>{{ draft.displayName ?? draft.slug }}</span>
          </div>
          <small>完整项目模板；所有引用此模板的武器实例共享定义。</small>
        </div>
      </template>

      <div ref="editorRoot" class="weapon-workspace">
        <aside class="weapon-outliner">
          <EaButton
            variant="ghost"
            @click="selectedSection = 'base'"
            :pressed="selectedSection === 'base'"
          >
            <strong>基础与成长</strong><small>6 个等级节点</small>
          </EaButton>
          <div class="outliner-caption">词条</div>
          <EaButton class="add-entry" variant="ghost" size="sm" type="button" @click="addTrait"
            >＋ 新增词条</EaButton
          >
          <EaButton
            variant="ghost"
            v-for="(trait, index) in draft.traits"
            :key="`${trait.key}:${index}`"
            @click="selectedSection = index"
            :pressed="selectedSection === index"
          >
            <strong>{{ trait.key }}</strong
            ><small>{{ trait.levelCount }} 级</small>
          </EaButton>
        </aside>

        <main class="weapon-inspector" :class="{ 'trait-inspector': selectedTrait !== undefined }">
          <section v-if="selectedSection === 'base'" class="definition-card">
            <header><strong>模板身份</strong><span>物化定义</span></header>
            <div class="field-grid">
              <label title="项目内稳定引用身份。创建模板时确定，修改会使既有实例失去引用。"
                >模板 ID<input :value="draft.slug" disabled
              /></label>
              <label
                >展示名称<input
                  :value="draft.displayName ?? ''"
                  @change="updateIdentity('displayName', $event)"
              /></label>
              <label title="继承内置武器图标和本地化文本时使用的资源身份。"
                >资源来源<input
                  :value="draft.assetSlug ?? ''"
                  @change="updateIdentity('assetSlug', $event)"
              /></label>
              <label title="由资源导出流程生成的 WebP 路径；留空时按资源来源回退。"
                >图标路径<input
                  :value="draft.iconPath ?? ''"
                  @change="updateIdentity('iconPath', $event)"
              /></label>
              <label
                >星级<select :value="draft.rarity" @change="updateIdentity('rarity', $event)">
                  <option v-for="rarity in WEAPON_RARITIES" :key="rarity" :value="rarity">
                    {{ rarity }} ★
                  </option>
                </select></label
              >
              <label
                >武器类型<select
                  :value="draft.weaponType"
                  @change="updateIdentity('weaponType', $event)"
                >
                  <option v-for="type in OPERATOR_WEAPON_TYPES" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select></label
              >
            </div>
          </section>

          <section v-if="selectedSection === 'base'" class="definition-card">
            <header><strong>基础攻击成长</strong><span>严格六节点</span></header>
            <div class="attack-grid">
              <label v-for="(level, index) in LEVEL_NODES" :key="level">
                <span>Lv.{{ level }}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  :value="draft.baseAttackAtLevelNodes[index]"
                  @change="updateBaseAttack(index, $event)"
                />
              </label>
            </div>
          </section>

          <section v-if="selectedTrait" class="definition-card trait-definition-card">
            <header>
              <strong>当前词条</strong><span>第 {{ (selectedTraitIndex ?? 0) + 1 }} 条</span>
            </header>
            <div class="object-actions">
              <EaButton size="sm" :disabled="selectedTraitIndex === 0" @click="moveTrait(-1)"
                >上移</EaButton
              >
              <EaButton
                size="sm"
                :disabled="selectedTraitIndex === draft.traits.length - 1"
                @click="moveTrait(1)"
              >
                下移
              </EaButton>
              <span />
              <EaButton class="danger" variant="danger" size="sm" @click="removeTrait"
                >删除词条</EaButton
              >
            </div>
            <div class="field-grid">
              <label
                >稳定 key<input :value="selectedTrait.key" @change="updateTrait('key', $event)"
              /></label>
              <label
                >等级数量<input
                  type="number"
                  min="1"
                  step="1"
                  :value="selectedTrait.levelCount"
                  @change="updateTrait('levelCount', $event)"
              /></label>
            </div>
            <EquipmentContributionGraphEditor
              :shared-history="contributionHistory"
              fill-available
              :key="`${contributionEditorRevision}:${selectedTraitIndex}`"
              :contribution="selectedTrait"
              :label="selectedTrait.key"
              :level="selectedTrait.levelCount"
              @update="updateTraitContribution"
            />
          </section>
        </main>
      </div>

      <template #footer>
        <EaDialogActions align="start">
          <DefinitionHistoryControls :history="history" />
          <details v-if="issues.length" class="issues">
            <summary>{{ issues.length }} 个结构问题</summary>
            <code v-for="issue in issues" :key="`${issue.path}:${issue.message}`"
              >{{ issue.path }} · {{ issue.message }}</code
            >
          </details>
          <span v-else class="valid">✓ 定义结构有效</span>
          <EaButton size="sm" @click="emit('reset')"> 恢复游戏定义 </EaButton>
          <span class="spacer" />
          <EaButton size="sm" @click="emit('update:visible', false)"> 取消 </EaButton>
          <EaButton
            variant="primary"
            size="sm"
            :disabled="!isDirty || issues.length > 0"
            @click="save"
          >
            保存武器定义
          </EaButton>
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.workspace-title {
  display: grid;
  gap: 4px;
}
.workspace-title div {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.workspace-title strong {
  font-size: 19px;
}
.workspace-title span,
.workspace-title small {
  color: var(--ea-fg-muted);
}
.weapon-workspace {
  display: grid;
  grid-template-columns: var(--definition-outliner-width, clamp(180px, 15vw, 240px)) minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel);
}
.weapon-outliner {
  min-width: 0;
  padding: 12px;
  overflow: auto;
  border-right: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
.weapon-outliner button {
  width: 100%;
  display: grid;
  gap: 3px;
  padding: 10px;
  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
  cursor: pointer;
}
.weapon-outliner button[aria-pressed='true'] {
  border-left-color: var(--ea-gold);
  background: var(--ea-active-fill);
  color: var(--ea-fg);
}
.weapon-outliner small,
.outliner-caption {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.weapon-outliner .add-entry {
  color: var(--ea-gold);
  border: 1px dashed var(--ea-border);
  margin-bottom: 6px;
}
.outliner-caption {
  margin: 18px 10px 7px;
  font-weight: 700;
  text-transform: uppercase;
}
.weapon-inspector {
  min-width: 0;
  padding: 18px;
  overflow: auto;
  container-type: inline-size;
}
.definition-card {
  min-width: 0;
  margin-bottom: 16px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
.definition-card header {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.definition-card header span {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.field-grid,
.attack-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  padding: 14px;
}
.attack-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
label {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(90px, 1fr) minmax(100px, 150px);
  align-items: center;
  gap: 10px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
input,
select {
  width: 100%;
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.object-actions {
  display: flex;
  gap: 6px;
  padding: 10px 14px 0;
}
.object-actions span {
  flex: 1;
}
.object-actions button {
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg-secondary);
  cursor: pointer;
}
.object-actions button:disabled {
  opacity: 0.4;
  cursor: default;
}
.object-actions .danger {
  color: #e69a7a;
}
.spacer {
  flex: 1;
}
.valid {
  color: #80bf93;
}
.issues {
  color: #e69a7a;
}
.issues code {
  display: block;
  max-width: 520px;
  padding: 4px;
  overflow-wrap: anywhere;
}
@container (max-width: 560px) {
  .field-grid,
  .attack-grid {
    grid-template-columns: 1fr;
  }
}
@container (max-width: 360px) {
  label {
    grid-template-columns: 1fr;
    gap: 5px;
  }
}
@media (max-width: 720px) {
  .weapon-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 88px) minmax(0, 1fr);
  }
  .weapon-outliner {
    max-height: 180px;
    border-right: 0;
    border-bottom: 1px solid var(--ea-border-soft);
  }
}
</style>
