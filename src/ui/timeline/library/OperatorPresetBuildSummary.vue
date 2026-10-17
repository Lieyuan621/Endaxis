<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaTooltip } from '@/design-system';
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

const props = defineProps<{ build: OperatorBuildPreset['build']; gameData: GameDataRepository }>();
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
      details: gear
        ? [
            {
              label: t('operatorPresets.refinementLevels'),
              value: gear.artificingLevels.join(' / '),
            },
          ]
        : [],
    })),
  ];
});
</script>
<template>
  <div class="preset-build">
    <div class="preset-build__equipment">
      <div v-for="item in equipment" :key="item.key" class="preset-build__item">
        <EaTooltip placement="top" :show-after="160">
          <template #content>
            <div class="preset-build__details">
              <strong>{{ item.name }}</strong>
              <span v-if="!item.details.length">{{ t('operatorPresets.empty') }}</span>
              <div v-for="row in item.details" :key="row.label" class="preset-build__detail-row">
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
        <span class="card-name">{{ item.name }}</span>
      </div>
    </div>
    <div class="preset-build__sets">
      <template v-if="activeSets.length">
        <strong v-for="name in activeSets" :key="name">{{ name }}</strong>
        <span>{{ t('operatorPresets.setActive') }}</span>
      </template>
      <span v-else>{{ t('operatorPresets.noActiveSet') }}</span>
    </div>
  </div>
</template>
<style scoped>
.preset-build__details {
  min-width: 180px;
}
.preset-build__details > strong {
  display: block;
  margin-bottom: 6px;
}
.preset-build__detail-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  line-height: 1.8;
}

.preset-build {
  display: grid;
  grid-template-columns: minmax(0, 456px) minmax(90px, 1fr);
  align-items: center;
  min-width: 0;
  gap: var(--ea-space-3);
}
.preset-build__equipment {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--ea-space-1);
}
.preset-build__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  align-items: center;
}
.preset-build__item .card-avatar-wrapper {
  width: 68px;
  height: 68px;
  max-width: 100%;
}
.preset-build__empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--ea-fg-faint);
}
.preset-build__sets {
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-2);
  font-size: 12px;
  color: var(--ea-fg-secondary);
}
.preset-build__sets strong {
  color: var(--ea-fg);
}
@media (max-width: 600px) {
  .preset-build {
    grid-template-columns: minmax(0, 1fr);
  }
  .preset-build__equipment {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
