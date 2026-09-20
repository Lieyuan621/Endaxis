<script setup lang="ts">
/**
 * Next 武器选择器的只读预览。它复刻旧选择器的 tooltip 内容，但只从 WeaponDefinition
 * 和按需加载的游戏文本推导显示值，不读取旧武器定义或 Build 状态。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getWeaponSkillDescription, getWeaponSkillName } from '../../gameText';
import { GameRichTextRenderer } from '../../presentation';
import type {
  WeaponDefinition,
  WeaponTraitDefinition,
} from '../../../core/game-data/equipmentDefinition';
import { resolveMaxWeaponTraitLevels } from '../../../application/editor/loadoutBuildFactory';

const props = defineProps<{
  weapon: WeaponDefinition;
  name: string;
  fullPotential: boolean;
}>();

const { t, locale } = useI18n({ useScope: 'global' });
const textSlug = computed(() => props.weapon.assetSlug ?? props.weapon.slug);
function traitLevel(trait: WeaponTraitDefinition): number {
  const index = props.weapon.traits.indexOf(trait);
  return resolveMaxWeaponTraitLevels(props.weapon, props.fullPotential ? 5 : 0)[index] ?? 1;
}

function isWeaponSkillKey(value: string): value is 'skill1' | 'skill2' | 'skill3' {
  return value === 'skill1' || value === 'skill2' || value === 'skill3';
}

const preview = computed(() => ({
  baseAttack: props.weapon.baseAttackAtLevelNodes.at(-1) ?? 0,
  skills: props.weapon.traits.flatMap(trait => {
    if (!isWeaponSkillKey(trait.key)) return [];
    const level = traitLevel(trait);
    return [
      {
        key: trait.key,
        level,
        name: getWeaponSkillName(textSlug.value, trait.key, locale.value),
        description: getWeaponSkillDescription(textSlug.value, trait.key, locale.value, level),
      },
    ];
  }),
}));
</script>

<template>
  <div class="weapon-selection-preview">
    <div class="weapon-selection-preview__name">{{ name }}</div>
    <div class="weapon-selection-preview__meta">
      Lv90 · {{ t('armory.common.baseAtk') }}
      <strong>{{ preview.baseAttack }}</strong>
    </div>
    <div
      v-for="skill in preview.skills"
      :key="`${weapon.slug}_${skill.key}`"
      class="weapon-selection-preview__skill"
    >
      <div class="weapon-selection-preview__skill-heading">
        <strong>{{ skill.name }}</strong>
        <span>Lv{{ skill.level }}</span>
      </div>
      <GameRichTextRenderer v-if="skill.description" :text="skill.description" :locale="locale" />
    </div>
    <div class="weapon-selection-preview__potential-hint">
      {{
        t(
          fullPotential
            ? 'timelineGrid.weaponDialog.fullPotentialActive'
            : 'timelineGrid.weaponDialog.fullPotentialHint',
        )
      }}
    </div>
  </div>
</template>

<style scoped>
:global(.weapon-selection-preview-popper) {
  max-width: min(440px, calc(100vw - 32px));
}

:global(html[data-theme='light'] .weapon-selection-preview__name) {
  border-bottom-color: rgba(26, 27, 30, 0.12);
  color: #1a1b1e;
}

:global(html[data-theme='light'] .weapon-selection-preview__meta),
:global(html[data-theme='light'] .weapon-selection-preview__skill-heading span) {
  color: rgba(26, 27, 30, 0.55);
}

:global(html[data-theme='light'] .weapon-selection-preview__skill) {
  color: rgba(26, 27, 30, 0.84);
}

:global(.weapon-selection-preview) {
  width: min(400px, calc(100vw - 64px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  line-height: 1.5;
}

:global(.weapon-selection-preview__name) {
  padding: 2px 0 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.96);
  font-size: 14px;
  font-weight: 700;
}

:global(.weapon-selection-preview__meta),
:global(.weapon-selection-preview__skill-heading span) {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

:global(.weapon-selection-preview__meta strong),
:global(.weapon-selection-preview__skill-heading span) {
  color: #facc15;
}

:global(.weapon-selection-preview__skill) {
  color: rgba(255, 255, 255, 0.88);
}

:global(.weapon-selection-preview__skill-heading) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 3px;
}

:global(.weapon-selection-preview__potential-hint) {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
  text-align: center;
}
</style>
