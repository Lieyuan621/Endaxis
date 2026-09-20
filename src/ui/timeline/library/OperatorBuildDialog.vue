<script setup lang="ts">
import { EaTooltip, EaMinusIcon, EaPlusIcon } from '@/design-system';
/**
 * Next 时间轴的干员养成编辑弹窗。
 *
 * 组件沿用旧版干员编辑器的布局与节点交互，但只读取 Next 的 Build 投影；所有修改都通过
 * `change` 事件交给父层持久化。这里不访问旧 Store，也不会为定义尚未提供的详情补造文本。
 */
import { EaButton, EaDialog, EaDialogActions } from '../../../design-system/index';
import { computed } from 'vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import OperatorAvatar from '../../components/OperatorAvatar.vue';
import { useI18n } from 'vue-i18n';
import './armoryDialog.css';
import {
  getGameAttributeName,
  getGameClassName,
  getGameElementName,
  getGameWeaponTypeName,
  getOperatorGameName,
  getOperatorPotentialDescription,
  getOperatorPotentialName,
  getOperatorTalentDescription,
  getOperatorTalentName,
  getOperatorUiLabel,
} from '../../gameText';
import {
  formatOperatorSkillLevel,
  getOperatorSkillMax,
  getOperatorTrustMax,
  type OperatorLevel,
} from '../../progression';
import { GameRichTextRenderer } from '../../presentation';
import OperatorSkillTooltip from './OperatorSkillTooltip.vue';
import './armoryDialogTheme.css';
import {
  DEFAULT_TRUST_ATTRIBUTE_BONUS,
  PLAYER_SKILL_INPUTS,
  type OperatorDefinition,
  type SkillLevelSource,
} from '../../../core/game-data/operatorDefinition';
import { listOperatorSkillDefinitionBindings } from '../../../core/game-data/operatorSkillDefinitions';
import type { OperatorInstanceChanges } from './loadoutBuildCommands';
import type { OperatorInstanceViewModel } from './loadoutBuildViewModel';
import {
  projectMaxOperatorChanges,
  projectOperatorProgressionChange,
} from './loadoutBuildProgression';
import {
  DEFAULT_GAME_ICON_PATH,
  getAttributeIconPath,
  getOperatorAvatarPath,
  getOperatorSkillIconPath,
  getOperatorTalentIconPath,
  getWeaponActionIconPath,
} from '../../gameAssetPaths';
import { elementColors } from '../../gameColors';
import type { OperatorPanelAttributes } from '../../../core/compiler/resolveOperatorPanel';
import { resolveOperatorPresentationFormKey } from './operatorFormPresentation';

const LEVELS = [1, 20, 40, 60, 80, 90] as const satisfies readonly OperatorLevel[];
const SKILL_ORDER = PLAYER_SKILL_INPUTS;

const props = defineProps<{
  visible: boolean;
  operator: OperatorInstanceViewModel | null;
  customDefinition?: OperatorDefinition;
  buildAttributes?: OperatorPanelAttributes | null;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  change: [changes: OperatorInstanceChanges];
  'edit-definition': [];
}>();

const { t, locale } = useI18n({ useScope: 'global' });
const definition = computed(() => props.customDefinition ?? props.operator?.definition ?? null);
const rarityColor = computed(() => {
  const rarity = definition.value?.rarity ?? 0;
  if (rarity === 6) return 'var(--ea-gold)';
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  return '#888';
});
const elementColor = computed(() => elementColors[definition.value?.element ?? ''] ?? '#888');
const potentialColor = computed(() => {
  const rarity = definition.value?.rarity ?? 0;
  if (rarity === 6) return '#ff4500';
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  return '#888';
});
const skillMax = computed(() => {
  const operator = props.operator;
  return operator ? getOperatorSkillMax(operator.level as OperatorLevel, operator.promoted) : 1;
});
const canPromote = computed(() => {
  const level = props.operator?.level;
  return level !== undefined && [20, 40, 60, 80].includes(level);
});
const maxTrust = computed(() => {
  const operator = props.operator;
  return operator ? getOperatorTrustMax(operator.level as OperatorLevel, operator.promoted) : 0;
});
const potentialCount = computed(() =>
  (definition.value?.potentials ?? []).reduce((sum, potential) => sum + potential.levels, 0),
);
const availableSkillSources = computed(() => {
  const sources = new Set(
    definition.value === null
      ? []
      : listOperatorSkillDefinitionBindings(definition.value).flatMap(({ skill }) =>
          skill.levelSource === undefined ? [] : [skill.levelSource],
        ),
  );
  return SKILL_ORDER.filter(source => sources.has(source));
});
const activeFormKey = computed(() => {
  const attributes = props.buildAttributes;
  if (attributes === null || attributes === undefined || definition.value === null) return null;
  return resolveOperatorPresentationFormKey(definition.value, attributes);
});
const trustAttributeKeys = computed(() => {
  const currentDefinition = definition.value;
  if (!currentDefinition) return [];
  const trust = currentDefinition.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS;
  return [
    ...new Set(
      trust.attributes.map(attribute => {
        if (attribute === 'main') return currentDefinition.mainAttribute;
        if (attribute === 'secondary') return currentDefinition.secondaryAttribute;
        return attribute;
      }),
    ),
  ];
});
const trustAttributeLabel = computed(() =>
  trustAttributeKeys.value
    .map(attribute => getGameAttributeName(attribute, locale.value))
    .join(String(locale.value).startsWith('zh') ? '、' : ' / '),
);

function update(changes: OperatorInstanceChanges): void {
  if (props.operator !== null) emit('change', changes);
}

function handleLevelChange(level: OperatorLevel): void {
  const operator = props.operator;
  if (!operator) return;
  update(projectOperatorProgressionChange(operator, level, operator.promoted));
}

function togglePromotion(): void {
  const operator = props.operator;
  if (!operator || !canPromote.value) return;
  update(
    projectOperatorProgressionChange(operator, operator.level as OperatorLevel, !operator.promoted),
  );
}

function skillTypeName(source: SkillLevelSource): string {
  if (source === 'basicAttack') return t('skillType.attack');
  if (source === 'battleSkill') return t('skillType.skill');
  if (source === 'comboSkill') return t('skillType.link');
  return t('skillType.ultimate');
}

function skillIcon(source: SkillLevelSource): string {
  const operator = props.operator;
  if (!operator) return DEFAULT_GAME_ICON_PATH;
  if (source === 'basicAttack') {
    return getWeaponActionIconPath(operator.definition.weaponType);
  }
  return (
    getOperatorSkillIconPath(operator.definition.assetSlug ?? operator.operatorSlug, source) ??
    DEFAULT_GAME_ICON_PATH
  );
}

function setSkillLevel(source: SkillLevelSource, level: number): void {
  const operator = props.operator;
  if (!operator) return;
  update({ skillLevels: { ...operator.skillLevels, [source]: level } });
}

function togglePotential(level: number): void {
  const operator = props.operator;
  if (operator) update({ potential: operator.potential === level ? level - 1 : level });
}

function setTrustLevel(level: number): void {
  const operator = props.operator;
  if (operator) update({ trustLevel: operator.trustLevel === level ? level - 1 : level });
}

function trustDescription(level: number): string {
  const currentDefinition = definition.value;
  if (!currentDefinition) return '';
  const trust = currentDefinition.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS;
  const bonus = trust.values[level - 1] ?? 0;
  return trustAttributeLabel.value ? `+${bonus} ${trustAttributeLabel.value}` : `+${bonus}`;
}

function setTalentState(index: number, level: number): void {
  const operator = props.operator;
  if (!operator) return;
  const key = String(index);
  const current = operator.talentStates[key] ?? 0;
  update({
    talentStates: { ...operator.talentStates, [key]: current === level ? level - 1 : level },
  });
}

function talentFlatIndex(groupIndex: number): number {
  return (definition.value?.talents ?? [])
    .slice(0, groupIndex)
    .reduce((sum, talent) => sum + talent.levels, 0);
}

function talentName(groupIndex: number): string {
  const operator = props.operator;
  if (!operator) return '';
  return getOperatorTalentName(
    operator.definition.assetSlug ?? operator.operatorSlug,
    talentFlatIndex(groupIndex),
    0,
    locale.value,
  );
}

function talentDescription(groupIndex: number, level: number): string {
  const operator = props.operator;
  if (!operator) return '';
  return (
    getOperatorTalentDescription(
      operator.definition.assetSlug ?? operator.operatorSlug,
      talentFlatIndex(groupIndex),
      level - 1,
      locale.value,
    ) ?? ''
  );
}

function potentialName(level: number): string {
  const operator = props.operator;
  return operator
    ? getOperatorPotentialName(
        operator.definition.assetSlug ?? operator.operatorSlug,
        level - 1,
        locale.value,
      )
    : '';
}

function potentialDescription(level: number): string {
  const operator = props.operator;
  return operator
    ? (getOperatorPotentialDescription(
        operator.definition.assetSlug ?? operator.operatorSlug,
        level - 1,
        locale.value,
      ) ?? '')
    : '';
}

function promotionLabel(): string {
  const operator = props.operator;
  if (!operator) return '';
  if (!canPromote.value) {
    return getOperatorUiLabel(
      operator.level >= 90 ? 'fullyPromoted' : 'promotionUnavailable',
      locale.value,
    );
  }
  return getOperatorUiLabel(operator.promoted ? 'promoted' : 'promote', locale.value);
}

function maxOut(): void {
  const operator = props.operator;
  const currentDefinition = definition.value;
  if (!operator || !currentDefinition) return;
  update(projectMaxOperatorChanges(operator, currentDefinition));
}
</script>

<template>
  <InputRegionBoundary label="operator-build" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      width="760px"
      append-to-body
      class="armory-dialog next-armory-dialog"
      @update:model-value="emit('update:visible', $event)"
    >
      <template v-if="operator && definition">
        <div class="layout">
          <div class="header">
            <div
              class="portrait-frame"
              :class="`rarity-${definition.rarity}-style`"
              :style="definition.rarity === 6 ? {} : { borderColor: rarityColor }"
            >
              <OperatorAvatar
                :src="getOperatorAvatarPath(operator.definition.assetSlug ?? operator.operatorSlug)"
                class="portrait"
              />
            </div>
            <div class="header-info">
              <div class="name-row">
                <span class="name">{{
                  operator.definition.displayName ??
                  getOperatorGameName(
                    operator.definition.assetSlug ?? operator.operatorSlug,
                    locale,
                  )
                }}</span>
                <span
                  class="stars"
                  :class="`header-rarity-${definition.rarity}`"
                  :style="{ color: rarityColor }"
                  >{{ '★'.repeat(definition.rarity) }}</span
                >
              </div>
              <div class="tags">
                <span class="tag" :style="{ color: elementColor, borderColor: elementColor }">{{
                  getGameElementName(definition.element, locale)
                }}</span>
                <span class="tag">{{ getGameClassName(definition.role, locale) }}</span>
                <span class="tag">{{ getGameWeaponTypeName(definition.weaponType, locale) }}</span>
              </div>
              <div class="level-display">
                <span class="level-num">{{ operator.level }}</span>
                <span class="level-text">{{ t('armory.common.level') }}</span>
              </div>
              <div class="row row-actions">
                <EaButton
                  size="sm"
                  type="button"
                  :disabled="!canPromote"
                  :style="operator.promoted ? { borderColor: rarityColor, color: rarityColor } : {}"
                  @click="togglePromotion"
                >
                  {{ promotionLabel() }}
                </EaButton>
                <EaButton size="sm" type="button" @click="emit('edit-definition')">
                  {{
                    customDefinition === undefined
                      ? t('timeline.customDefinition.customizeOperator')
                      : t('timeline.customDefinition.editOperator')
                  }}
                </EaButton>
              </div>
              <div v-if="potentialCount > 0" class="row">
                <span class="section-label">{{ t('armory.common.potential') }}</span>
                <div class="diamonds">
                  <EaTooltip
                    v-for="level in potentialCount"
                    :key="level"
                    effect="dark"
                    placement="top"
                    :show-after="120"
                    popper-class="operator-edit-tooltip-popper"
                  >
                    <template #content>
                      <div class="operator-edit-tooltip">
                        <div class="operator-edit-tooltip-title">{{ potentialName(level) }}</div>
                        <GameRichTextRenderer
                          v-if="potentialDescription(level)"
                          class="operator-edit-tooltip-desc"
                          :text="potentialDescription(level)"
                          :locale="locale"
                        />
                      </div>
                    </template>
                    <EaButton
                      type="button"
                      class="diamond"
                      :style="operator.potential >= level ? { background: potentialColor } : {}"
                      @click="togglePotential(level)"
                      :pressed="operator.potential >= level"
                    />
                  </EaTooltip>
                </div>
              </div>
            </div>
          </div>

          <div class="level-selector">
            <EaButton
              size="sm"
              v-for="level in LEVELS"
              :key="level"
              type="button"
              class="level-btn"
              :style="
                operator.level === level
                  ? {
                      borderColor: rarityColor,
                      color: rarityColor,
                      background: `color-mix(in srgb, ${rarityColor} 18%, var(--ea-dialog-bg, #fff))`,
                    }
                  : {}
              "
              @click="handleLevelChange(level)"
            >
              Lv{{ level }}
            </EaButton>
          </div>

          <div class="section">
            <div class="section-title">{{ t('armory.common.skills') }}</div>
            <div class="skills-row">
              <div v-for="source in availableSkillSources" :key="source" class="skill-card">
                <EaTooltip
                  placement="top"
                  effect="dark"
                  :show-after="120"
                  :enterable="true"
                  popper-class="operator-edit-tooltip-popper"
                >
                  <template #content>
                    <OperatorSkillTooltip
                      :operator="definition"
                      :operator-slug="operator.definition.assetSlug ?? operator.operatorSlug"
                      :skill-key="source"
                      :skill-level="operator.skillLevels[source] ?? 1"
                      :skill-type-name="skillTypeName(source)"
                      :active-form-key="activeFormKey"
                    />
                  </template>
                  <div class="skill-icon-frame" :style="{ borderColor: elementColor }">
                    <img :src="skillIcon(source)" alt="" class="skill-icon" />
                  </div>
                </EaTooltip>
                <div class="skill-name">{{ skillTypeName(source) }}</div>
                <div class="skill-controls">
                  <EaButton
                    size="sm"
                    type="button"
                    :disabled="(operator.skillLevels[source] ?? 1) <= 1"
                    icon-only
                    :title="t('common.decrease')"
                    :aria-label="t('common.decrease')"
                    @click="setSkillLevel(source, (operator.skillLevels[source] ?? 1) - 1)"
                  >
                    <EaMinusIcon />
                  </EaButton>
                  <span class="skill-rank">{{
                    formatOperatorSkillLevel(operator.skillLevels[source] ?? 1)
                  }}</span>
                  <EaButton
                    size="sm"
                    type="button"
                    :disabled="(operator.skillLevels[source] ?? 1) >= skillMax"
                    icon-only
                    :title="t('common.increase')"
                    :aria-label="t('common.increase')"
                    @click="setSkillLevel(source, (operator.skillLevels[source] ?? 1) + 1)"
                  >
                    <EaPlusIcon />
                  </EaButton>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">{{ t('armory.common.talents') }}</div>
            <div class="talent-row">
              <div class="talent-info">
                <span class="talent-name">{{ t('armory.common.trust') }}</span>
                <span v-if="trustAttributeLabel" class="talent-sub">{{ trustAttributeLabel }}</span>
              </div>
              <div class="talent-nodes">
                <template v-for="level in 4" :key="level">
                  <div
                    v-if="level > 1"
                    class="talent-chain"
                    :class="{ active: operator.trustLevel >= level }"
                  />
                  <EaTooltip
                    effect="dark"
                    placement="top"
                    :show-after="120"
                    popper-class="operator-edit-tooltip-popper"
                  >
                    <template #content>
                      <div class="operator-edit-tooltip">
                        <div class="operator-edit-tooltip-desc">{{ trustDescription(level) }}</div>
                      </div>
                    </template>
                    <span class="talent-node-tooltip-anchor">
                      <EaButton
                        type="button"
                        class="talent-node"
                        :class="{
                          disabled: level > maxTrust,
                          'is-multi-attr': trustAttributeKeys.length > 1,
                        }"
                        :style="operator.trustLevel >= level ? { borderColor: elementColor } : {}"
                        :disabled="level > maxTrust"
                        @click="setTrustLevel(level)"
                        :pressed="operator.trustLevel >= level"
                      >
                        <img
                          v-for="attribute in trustAttributeKeys"
                          :key="attribute"
                          :src="getAttributeIconPath(attribute)"
                          alt=""
                          class="talent-icon"
                        />
                      </EaButton>
                    </span>
                  </EaTooltip>
                </template>
              </div>
            </div>

            <div
              v-for="(talent, groupIndex) in definition.talents"
              :key="groupIndex"
              class="talent-row"
            >
              <div class="talent-info">
                <span class="talent-name">{{ talentName(groupIndex) }}</span>
              </div>
              <div class="talent-nodes">
                <template v-for="level in talent.levels" :key="level">
                  <div
                    v-if="level > 1"
                    class="talent-chain"
                    :class="{ active: (operator.talentStates[String(groupIndex)] ?? 0) >= level }"
                  />
                  <EaTooltip
                    effect="dark"
                    placement="top"
                    :show-after="120"
                    :disabled="!talentDescription(groupIndex, level)"
                    popper-class="operator-edit-tooltip-popper"
                  >
                    <template #content>
                      <div class="operator-edit-tooltip">
                        <GameRichTextRenderer
                          class="operator-edit-tooltip-desc"
                          :text="talentDescription(groupIndex, level)"
                          :locale="locale"
                        />
                      </div>
                    </template>
                    <span class="talent-node-tooltip-anchor">
                      <EaButton
                        type="button"
                        class="talent-node"
                        :style="
                          (operator.talentStates[String(groupIndex)] ?? 0) >= level
                            ? { borderColor: elementColor }
                            : {}
                        "
                        @click="setTalentState(groupIndex, level)"
                        :pressed="(operator.talentStates[String(groupIndex)] ?? 0) >= level"
                      >
                        <img
                          :src="
                            getOperatorTalentIconPath(
                              operator.definition.assetSlug ?? operator.operatorSlug,
                              groupIndex + 1,
                            )
                          "
                          alt=""
                          class="talent-icon"
                        />
                      </EaButton>
                    </span>
                  </EaTooltip>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <EaDialogActions>
          <EaButton
            variant="primary"
            size="sm"
            type="button"
            :disabled="operator === null"
            @click="maxOut"
          >
            {{ t('common.max') }}
          </EaButton>
          <EaButton size="sm" type="button" @click="emit('update:visible', false)">
            {{ t('common.close') }}
          </EaButton>
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.row-actions {
  flex-wrap: wrap;
}
.portrait-frame {
  --armory-pad: var(--ea-keycap-bg, #1a1a1e);
  width: 160px;
  min-width: 160px;
  height: 160px;
  border: 2px solid var(--ea-border-strong, #555);
  border-radius: 8px;
  overflow: hidden;
  background: var(--armory-pad);
}
.portrait {
  width: 100%;
  height: 100%;
}
.rarity-6-style.portrait-frame {
  border: 2px solid transparent;
  background:
    linear-gradient(var(--armory-pad), var(--armory-pad)) padding-box,
    linear-gradient(135deg, var(--ea-gold), #ff8c00, #ff4500) border-box;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.2);
}
.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.name-row,
.row,
.level-display,
.skill-controls,
.talent-nodes {
  display: flex;
  align-items: center;
}
.name-row {
  align-items: baseline;
  gap: 10px;
}
.name {
  color: var(--ea-fg, #f0f0f0);
  font-size: 22px;
  font-weight: 700;
}
.stars {
  font-size: 14px;
  letter-spacing: 1px;
}
.header-rarity-6.stars {
  background: linear-gradient(45deg, var(--ea-gold), #ff8c00, #ff4500);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent !important;
}
.diamonds,
.level-selector,
.skills-row,
.footer {
  display: flex;
  gap: 8px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border: 1px solid var(--ea-border-strong, #555);
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.04));
  color: var(--ea-fg-secondary, #bbb);
  font-size: 11px;
}
.level-display {
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
}
.level-num {
  color: var(--ea-fg, #f0f0f0);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}
.level-text {
  color: var(--ea-dialog-hint, #888);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.section-label {
  color: var(--ea-dialog-hint, #888);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.section-title,
.talent-sub {
  color: var(--ea-dialog-hint, #888);
  font-size: 11px;
}
.row {
  gap: 10px;
}
.diamond {
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1.5px solid var(--ea-border-strong, #555);
  background: transparent;
  cursor: pointer;
  transform: rotate(45deg);
}
.diamond[aria-pressed='true'] {
  border-color: transparent;
  box-shadow: none;
}
.level-btn {
  flex: 1;
  justify-content: center;
}
.level-selector {
  gap: 6px;
}
.section {
  padding: 16px;
  border: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.06));
  border-radius: 6px;
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.02));
}
.section-title {
  margin-bottom: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.skills-row {
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
}
.skill-card {
  display: flex;
  min-width: 120px;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.skill-icon-frame {
  display: flex;
  width: 64px;
  height: 64px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--ea-border-strong, #555);
  border-radius: 50%;
  background: var(--ea-fill-muted, #222228);
  cursor: pointer;
}
.skill-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
.skill-name {
  display: flex;
  min-height: 2.6em;
  align-items: center;
  color: var(--ea-fg-secondary, #ccc);
  font-size: 12px;
  text-align: center;
}
.skill-controls {
  gap: 6px;
}
.skill-rank {
  min-width: 28px;
  color: var(--ea-fg, #f0f0f0);
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}
.talent-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.04));
}
.talent-row:last-child {
  border-bottom: none;
}
.talent-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.talent-name {
  color: var(--ea-fg, #e0e0e0);
  font-size: 13px;
  font-weight: 600;
}
.talent-nodes {
  margin-left: auto;
  flex-shrink: 0;
}
.talent-chain {
  width: 24px;
  height: 2px;
  background: var(--ea-border, #444);
}
.talent-chain.active {
  background: var(--ea-border-strong, #777);
}
.talent-node {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: 2px solid var(--ea-border-strong, #555);
  border-radius: 50%;
  background: var(--ea-panel-elevated, #2a2a2e);
  cursor: pointer;
}
.talent-node[aria-pressed='true'] {
  background: var(--ea-panel-elevated, #2a2a2e);
  box-shadow: none;
}
.talent-node:not([aria-pressed='true']) {
  opacity: 0.35;
  filter: grayscale(1);
}
.talent-node.disabled {
  cursor: not-allowed;
  opacity: 0.2;
}
.talent-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.talent-node.is-multi-attr {
  gap: 1px;
  padding: 0 3px;
}
.talent-node.is-multi-attr .talent-icon {
  width: 16px;
  height: 16px;
}
.talent-node-tooltip-anchor {
  display: inline-flex;
  flex-shrink: 0;
}
.footer {
  width: 100%;
  justify-content: flex-end;
}
:global(.operator-edit-tooltip-popper) {
  max-width: min(440px, calc(100vw - 48px));
}
:global(.operator-edit-tooltip-popper.el-popper.is-dark) {
  padding: 0 !important;
  background: #202126;
  color: #f1f1f1;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
}
:global(.operator-edit-tooltip-popper.el-popper.is-dark .el-popper__arrow::before) {
  background: #202126;
  border-color: rgba(255, 255, 255, 0.16);
}
:global(.operator-edit-tooltip) {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px 10px;
  color: #f1f1f1;
}
:global(.operator-edit-tooltip-title) {
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}
:global(.operator-edit-tooltip-desc) {
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .layout,
  .header {
    gap: 12px;
  }

  .portrait-frame {
    width: 92px;
    min-width: 92px;
    height: 92px;
  }

  .name {
    font-size: 18px;
  }

  .level-num {
    font-size: 22px;
  }

  .level-selector,
  .talent-nodes {
    overflow-x: auto;
  }

  .level-btn {
    min-width: 42px;
    flex: 0 0 auto;
  }

  .section {
    padding: 12px;
  }

  .skills-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 8px;
  }

  .skill-card {
    min-width: 0;
  }

  .talent-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .talent-nodes {
    max-width: 100%;
    margin-left: 0;
  }
}
@media (hover: hover) and (pointer: fine) {
  .diamond[aria-pressed='true']:hover:not(:disabled) {
    border-color: transparent;
    box-shadow: none;
  }
  .talent-node[aria-pressed='true']:hover:not(:disabled) {
    background: var(--ea-panel-elevated, #2a2a2e);
    box-shadow: none;
  }
}
</style>
