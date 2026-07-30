<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getWeapon } from '@/data/index.js';
import { getWeaponSkillDescription, getWeaponSkillName } from '@/data/gameText.js';
import { getSkillBounds } from '@/utils/weaponBounds.js';
import GameRichTextRenderer from '@/components/GameRichTextRenderer.vue';

const props = defineProps({
  weapon: { type: Object, required: true },
  fullPotential: { type: Boolean, default: false },
});

const { t, locale } = useI18n();

const preview = computed(() => {
  const slug = props.weapon?.canonicalId || props.weapon?.canonicalSlug || props.weapon?.id;
  const sheet = slug ? getWeapon(slug) : null;
  if (!sheet) return null;

  const rarity = Number(sheet.rarity) || Number(props.weapon?.rarity) || 0;
  const potential = props.fullPotential ? 5 : 0;
  const bounds = getSkillBounds(90, true, potential);
  const skills = ['skill1', 'skill2', 'skill3']
    .filter(skillKey => sheet[skillKey] && !(rarity === 3 && skillKey === 'skill2'))
    .map(skillKey => ({
      key: skillKey,
      level: bounds[skillKey].max,
      name: getWeaponSkillName(slug, skillKey, locale.value),
      description: getWeaponSkillDescription(slug, skillKey, locale.value, bounds[skillKey].max),
    }));

  return {
    baseAtk: sheet.baseAtk.at(-1) ?? 0,
    skills,
  };
});
</script>

<template>
  <div v-if="preview" class="weapon-selection-preview">
    <div class="weapon-selection-preview__name">{{ weapon.name }}</div>
    <div class="weapon-selection-preview__meta">
      Lv90 · {{ t('armory.common.baseAtk') }}
      <strong>{{ preview.baseAtk }}</strong>
    </div>
    <div
      v-for="skill in preview.skills"
      :key="`${weapon.id}_${skill.key}`"
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

:global(.weapon-selection-preview-popper.el-popper.is-dark) {
  background: #050505;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72);
}

:global(.weapon-selection-preview-popper.el-popper.is-dark .el-popper__arrow::before) {
  background: #050505;
  border-color: rgba(255, 255, 255, 0.18);
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
