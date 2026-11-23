<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaCollapse, EaTooltip } from '@/design-system';
import type { OperatorBuildPreset } from '../../../application/editor/operatorBuildPreset';
import type { GameDataRepository } from '../../../core/game-data/gameDataRepository';
import {
  getGearSetGameName,
  getGearPieceGameName,
  getWeaponGameName,
  getOperatorGameName,
} from '../../gameText';
import { formatOperatorSkillLevel } from '../../progression';
import { resolveImage } from '../../imageResources';
import OperatorAvatar from '../../components/OperatorAvatar.vue';
import { projectActiveGearSetLabels } from './activeGearSetHint';
import SelectionIconFrame from './SelectionIconFrame.vue';
import { getOperatorAvatarPath, DEFAULT_GAME_ICON_PATH } from '../../gameAssetPaths';

const props = defineProps<{
  build: OperatorBuildPreset['build'];
  gameData: GameDataRepository;
  expanded?: boolean;
  detailsId?: string;
}>();
const { t, locale } = useI18n();
const operatorDetails = computed(() => {
  const build = props.build.operator;
  const definition = props.gameData.getOperator(build.operatorSlug);
  const rows = [
    {
      label: t('operatorPresets.level'),
      value: `${t('operatorPresets.levelValue', { level: build.level })} ${t(build.level >= 90 ? 'operatorPresets.fullyElite' : build.promoted ? 'operatorPresets.elite' : 'operatorPresets.notElite')}`,
    },
    { label: t('armory.common.potential'), value: String(build.potential) },
    {
      label: t('operatorPresets.skills'),
      value: ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate']
        .map(source => formatOperatorSkillLevel(build.skillLevels[source] ?? 1))
        .join(' / '),
    },
    { label: t('armory.common.trust'), value: String(build.trustLevel) },
  ];
  for (const [index, talent] of (definition?.talents ?? []).entries()) {
    rows.push({
      label: t('armory.operator.talent', { index: index + 1 }),
      value: `${build.talentStates[String(index)] ?? 0} / ${talent.levels}`,
    });
  }
  return rows;
});
const activeSets = computed(() => {
  const gears = Object.fromEntries(
    Object.entries(props.build.gears).map(([slot, gear]) => {
      const definition = gear && props.gameData.getGear(gear.gearSlug);
      return [slot, definition ? { definition } : null];
    }),
  );
  const names = Object.fromEntries(
    Object.values(gears).flatMap(gear => {
      const slug = gear?.definition.gearSetSlug;
      const set = slug ? props.gameData.getGearSet(slug) : null;
      return set ? [[set.slug, set.displayName ?? getGearSetGameName(set.slug, locale.value)]] : [];
    }),
  );
  return projectActiveGearSetLabels({ gears }, names);
});
const equipment = computed(() => {
  const weapon = props.build.weapon;
  const definition = weapon && props.gameData.getWeapon(weapon.weaponSlug);
  const operator = props.gameData.getOperator(props.build.operator.operatorSlug);
  return [
    {
      key: 'operator',
      rarity: operator?.rarity,
      equipmentLevel: undefined,
      name: getOperatorGameName(props.build.operator.operatorSlug, locale.value),
      icon: getOperatorAvatarPath(operator?.assetSlug ?? props.build.operator.operatorSlug),
      brief: '',
      details: operatorDetails.value,
    },
    {
      key: 'weapon',
      rarity: definition?.rarity,
      equipmentLevel: undefined,
      name: weapon
        ? getWeaponGameName(weapon.weaponSlug, locale.value)
        : t('operatorPresets.emptyWeapon'),
      icon: definition?.icon,
      brief: '',
      details: weapon
        ? [
            {
              label: t('operatorPresets.weaponLevel'),
              value: `${t('operatorPresets.levelValue', { level: weapon.level })} ${t(weapon.level >= 90 ? 'operatorPresets.fullyTuned' : weapon.tuned ? 'operatorPresets.promoted' : 'operatorPresets.notPromoted')}`,
            },
            { label: t('armory.common.potential'), value: String(weapon.potential) },
            { label: t('operatorPresets.skills'), value: weapon.traitLevels.join(' / ') },
          ]
        : [],
    },
    ...Object.entries(props.build.gears).map(([key, gear]) => ({
      key,
      rarity: undefined,
      equipmentLevel: gear ? props.gameData.getGear(gear.gearSlug)?.levelRequirement : undefined,
      name: gear ? getGearPieceGameName(gear.gearSlug, locale.value) : t(`operatorPresets.${key}`),
      icon: gear && props.gameData.getGear(gear.gearSlug)?.icon,
      details: [],
      brief: gear ? gear.artificingLevels.join(' / ') : '',
    })),
  ];
});
const equipmentGroups = computed(() => [
  {
    key: 'identity',
    label: t('operatorPresets.operatorAndWeapon'),
    items: equipment.value.slice(0, 2),
  },
  { key: 'gears', label: t('operatorPresets.gear'), items: equipment.value.slice(2) },
]);
const detailItems = computed(() => equipment.value.filter(item => item.details.length));
</script>
<template>
  <div class="preset-build">
    <div class="preset-build__equipment">
      <section
        v-for="group in equipmentGroups"
        :key="group.key"
        class="preset-build__group"
        :class="`preset-build__group--${group.key}`"
        :aria-label="group.label"
      >
        <header class="preset-build__group-heading">
          <span>{{ group.label }}</span>
          <div v-if="group.key === 'gears'" class="preset-build__sets">
            <template v-if="activeSets.length">
              <span v-for="name in activeSets" :key="name" class="preset-build__active-set"
                >{{ name }} · {{ t('operatorPresets.setActive') }}</span
              >
            </template>
            <span v-else>{{ t('operatorPresets.noActiveSet') }}</span>
          </div>
        </header>
        <div class="preset-build__items">
          <div v-for="item in group.items" :key="item.key" class="preset-build__item">
            <EaTooltip
              placement="top"
              :show-after="160"
              :disabled="!!expanded || !item.details.length"
            >
              <template #content>
                <div class="preset-build__details">
                  <strong>{{ item.name }}</strong>
                  <div
                    v-for="row in item.details"
                    :key="row.label"
                    class="preset-build__detail-row"
                  >
                    <span>{{ row.label }}</span
                    ><span>{{ row.value }}</span>
                  </div>
                </div>
              </template>
              <SelectionIconFrame :rarity="item.rarity" :equipment-level="item.equipmentLevel">
                <OperatorAvatar v-if="item.key === 'operator' && item.icon" :src="item.icon" />
                <img
                  v-else-if="item.icon"
                  :src="resolveImage(item.icon) || DEFAULT_GAME_ICON_PATH"
                  alt=""
                />
                <span v-else class="preset-build__empty">—</span>
              </SelectionIconFrame>
            </EaTooltip>
            <span class="preset-build__name">{{ item.name }}</span>
            <span v-if="item.key === 'operator'" class="preset-build__brief"
              >{{ t('operatorPresets.levelValue', { level: build.operator.level }) }} ·
              {{ t('armory.common.potential') }} {{ build.operator.potential }}</span
            >
            <span v-else-if="item.key === 'weapon' && build.weapon" class="preset-build__brief"
              >{{ t('operatorPresets.levelValue', { level: build.weapon.level }) }} ·
              {{ t('armory.common.potential') }} {{ build.weapon.potential }}</span
            >
            <span v-else-if="item.brief" class="preset-build__brief">{{ item.brief }}</span>
          </div>
        </div>
      </section>
    </div>
    <EaCollapse :id="detailsId" :expanded="!!expanded">
      <div class="preset-build__expanded">
        <section v-for="item in detailItems" :key="item.key">
          <header class="preset-build__detail-heading">
            <strong>{{ item.name }}</strong>
          </header>
          <div v-for="row in item.details" :key="row.label" class="preset-build__detail-row">
            <span>{{ row.label }}</span
            ><span>{{ row.value }}</span>
          </div>
        </section>
        <section v-if="build.operator.baseStatOverrides">
          <strong>{{ t('operatorPresets.baseOverrides') }}</strong>
          <div
            v-for="(value, key) in build.operator.baseStatOverrides"
            :key="key"
            class="preset-build__detail-row"
          >
            <span>{{ key }}</span
            ><span>{{ value }}</span>
          </div>
        </section>
      </div>
      <slot name="details-footer" />
    </EaCollapse>
  </div>
</template>
<style scoped>
.preset-build__brief {
  font-size: 11px;
  color: var(--ea-fg-secondary);
  text-align: center;
  overflow-wrap: anywhere;
}
.preset-build__expanded {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--ea-space-5);
  row-gap: var(--ea-space-3);
  padding-top: var(--ea-space-3);
  border-top: 1px solid var(--ea-border-soft);
  font-size: 12px;
}
.preset-build__expanded > section {
  min-width: 0;
  overflow-wrap: anywhere;
}
.preset-build__detail-heading,
.preset-build__expanded > section > strong {
  display: block;
  margin-bottom: var(--ea-space-1);
  color: var(--ea-fg);
}
@media (max-width: 600px) {
  .preset-build__expanded {
    grid-template-columns: minmax(0, 1fr);
  }
}

.preset-build__details {
  min-width: 180px;
}
.preset-build__details > strong {
  display: block;
  margin-bottom: var(--ea-space-2);
}
.preset-build__detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  gap: var(--ea-space-3);
  line-height: 1.8;
}
.preset-build__detail-row > :first-child {
  color: var(--ea-fg-secondary);
}
.preset-build__detail-row > :last-child {
  text-align: right;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.preset-build {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: var(--ea-space-3);
}
.preset-build__equipment {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 4fr);
  gap: var(--ea-space-4);
  width: 100%;
}
.preset-build__group {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 0;
  gap: var(--ea-space-2);
}
.preset-build__group-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ea-space-1) var(--ea-space-2);
  min-height: 20px;
  font-size: 11px;
  color: var(--ea-fg-muted);
}
.preset-build__items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ea-space-2);
  align-content: start;
}
.preset-build__group--gears .preset-build__items {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.preset-build__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  align-items: center;
  gap: var(--ea-space-1);
}
.preset-build__item .card-avatar-wrapper {
  width: 72px;
  height: 72px;
  max-width: 100%;
}
.preset-build__name {
  max-width: 100%;
  color: var(--ea-fg-secondary);
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preset-build__empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--ea-fg-faint);
}
.preset-build__sets {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--ea-space-1) var(--ea-space-2);
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 11px;
  text-align: right;
  color: var(--ea-fg-secondary);
}
.preset-build__active-set {
  color: var(--ea-gear-accent-fg);
  font-weight: 600;
}
@media (max-width: 600px) {
  .preset-build__equipment {
    grid-template-columns: minmax(0, 1fr);
  }
  .preset-build__group--gears .preset-build__items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
