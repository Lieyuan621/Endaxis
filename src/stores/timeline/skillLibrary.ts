// ─── Timeline skill-library composable ──────────────────────────────────────
// Builds the `activeSkillLibrary` — the list of placeable skill/action models
// for the currently-selected track's operator. It patches the operator's combat
// skills with the instance's levels/potentials, resolves per-segment hit
// payloads, applies user overrides, and emits standard + variant + hidden-child
// entries. Pure derivation over injected store state; the skill-building
// helpers are local to the computed.

import { computed } from 'vue';
import type { Ref } from 'vue';
import { i18n } from '@/i18n';
import { getOperator as getOperatorSheet } from '@/data';
import { patchCombatSkills } from '@/data/collect';
import { getOperatorSubSkillName } from '@/data/gameText';
import { buildResolvedSegmentPayload } from '@/stores/timeline/resolveHits';
import {
  findOperatorInstance,
  resolveEffectiveOperatorForTrack,
} from '@/stores/timeline/instanceLookup';
import type { Track, RosterEntry, EnemyConfigState } from './types';

// ─── Dependencies ────────────────────────────────────────────────────────────

interface SkillLibraryDeps {
  activeTrackIndex: Ref<number | null>;
  activeTrackId: Ref<string | null>;
  tracks: Ref<Track[]>;
  characterRoster: Ref<RosterEntry[]>;
  systemConstants: Ref<EnemyConfigState>;
  characterOverrides: Ref<Record<string, unknown>>;
  createMaxOperatorInstanceData: (operatorSlug: string) => any;
  buildOperatorEffectById: (operatorSlug: string, operatorInstance: any) => any;
  cloneJsonData: <T>(value: T) => T;
  resolveLevelNumber: (
    value: number | number[] | null | undefined,
    levelIndex?: number,
    fallback?: number,
  ) => number;
  humanizeIdentifier: (value: unknown) => string;
  getOperatorSkillIcon: (
    slug: string,
    optimizerSkillType: string,
    skill: Record<string, unknown> | null | undefined,
  ) => string;
  getI18nSkillType: (type: string) => string;
  getBasicAttackSegmentName: (groupName: string, index: number, total: number) => string;
  DEFAULT_BATTLE_SKILL_UE: number;
  DEFAULT_COMBO_SKILL_UE: number;
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useSkillLibrary(deps: SkillLibraryDeps) {
  const {
    activeTrackIndex,
    activeTrackId,
    tracks,
    characterRoster,
    systemConstants,
    characterOverrides,
    createMaxOperatorInstanceData,
    buildOperatorEffectById,
    cloneJsonData,
    resolveLevelNumber,
    humanizeIdentifier,
    getOperatorSkillIcon,
    getI18nSkillType,
    getBasicAttackSegmentName,
    DEFAULT_BATTLE_SKILL_UE,
    DEFAULT_COMBO_SKILL_UE,
  } = deps;

  const activeSkillLibrary = computed(() => {
    i18n.global.locale.value;
    const activeTrack =
      activeTrackIndex.value !== null ? tracks.value[activeTrackIndex.value] || null : null;
    const activeChar = activeTrack?.id
      ? characterRoster.value.find(c => c.id === activeTrack.id)
      : characterRoster.value.find(c => c.id === activeTrackId.value);
    if (!activeChar) return [];
    const baseOperator = getOperatorSheet(activeChar.id);
    if (!baseOperator?.combatSkills) return [];

    // Form operators keep empty base skill slots (real skills live in the forms). Resolve the active
    // form's effective sheet so the library shows the right skills. With no track instances (library
    // preview / synthetic max), default to the first form.
    const operator = resolveEffectiveOperatorForTrack(
      activeTrack || { id: activeChar.id },
      baseOperator,
    );

    const activeOpInstance = activeTrack?.operatorInstanceId
      ? findOperatorInstance(activeTrack.operatorInstanceId)
      : null;
    const displayInstance = activeOpInstance || createMaxOperatorInstanceData(activeChar.id);
    const flatSkills = patchCombatSkills(
      operator,
      displayInstance,
      buildOperatorEffectById(activeChar.id, displayInstance),
    );
    const TYPE_ORDER: Record<string, number> = {
      basicAttack: 1,
      dive: 2,
      finisher: 3,
      battleSkill: 4,
      comboSkill: 5,
      ultimate: 6,
    };

    const getLevelIndex = (skill: Record<string, any>) => {
      const rawLevel = Number(displayInstance?.skillLevels?.[skill?.levelKey] ?? 1);
      return Math.max(0, Math.min((Number.isFinite(rawLevel) ? rawLevel : 1) - 1, 11));
    };

    const buildSegmentModels = (
      skillIdBase: string,
      skill: Record<string, unknown>,
      levelIndex: number,
    ) => {
      const resolved = buildResolvedSegmentPayload(skillIdBase, skill, levelIndex);
      return {
        ...resolved,
        element: resolved.element || activeChar.element || 'physical',
        segmentPayloads: (resolved.segmentPayloads || []).map(
          (segment): Record<string, unknown> => ({
            ...segment,
            element: segment.element || activeChar.element || 'physical',
          }),
        ),
      };
    };

    interface BuildBaseActionInput {
      id: string;
      type: string;
      name: string;
      skillId: string;
      // element/payload/numeric fields flow from loosely-typed sheet data.
      element?: any;
      icon?: any;
      duration?: any;
      cooldown?: any;
      spCost?: any;
      gaugeCost?: any;
      gaugeGain?: any;
      teamGaugeGain?: any;
      enhancementTime?: any;
      animationTime?: any;
      payload?: any;
      override?: Record<string, unknown>;
      extra?: Record<string, unknown>;
      sourceSkillKey?: string;
    }

    const buildBaseAction = ({
      id,
      type,
      name,
      skillId,
      element,
      icon,
      duration,
      cooldown = 0,
      spCost = 0,
      gaugeCost = 0,
      gaugeGain = 0,
      teamGaugeGain = 0,
      enhancementTime = 0,
      animationTime = 0,
      payload,
      override = {},
      extra = {},
      sourceSkillKey = skillId,
    }: BuildBaseActionInput): Record<string, unknown> => {
      const safePayload = payload || { hits: [] };
      return {
        id,
        type,
        skillId,
        name,
        librarySource: 'character',
        element: (element as string) || activeChar.element || 'physical',
        icon: (icon as string) || '',
        duration,
        cooldown,
        spCost,
        gaugeCost,
        gaugeGain,
        teamGaugeGain,
        enhancementTime,
        animationTime,
        hits: cloneJsonData(safePayload.hits) || [],
        sourceSkillKey,
        ...(override && typeof override === 'object' ? override : {}),
        ...(extra && typeof extra === 'object' ? extra : {}),
      };
    };

    const buildSkillDisplayName = (skill: Record<string, any>, isStandard: boolean) => {
      if (isStandard) {
        return getI18nSkillType(skill.type || 'unknown');
      }
      if (!isStandard && skill?.skillKey) {
        return getOperatorSubSkillName(activeChar.id, skill.skillKey, undefined, skill?.name);
      }
      const fallback = skill?.name || skill?.skillKey || '';
      return humanizeIdentifier(fallback) || getI18nSkillType(skill.type || 'unknown');
    };

    const buildStandardOrVariantSkill = (
      skill: Record<string, any> | null | undefined,
      { isStandard = false }: { isStandard?: boolean } = {},
    ) => {
      if (!skill?.type) return null;

      const skillIdBase = isStandard
        ? `${activeChar.id}_${skill.type}`
        : `${activeChar.id}_variant_${skill.skillKey}`;
      const levelIndex = getLevelIndex(skill);
      const displayName = buildSkillDisplayName(skill, isStandard);
      const icon = getOperatorSkillIcon(activeChar.id, skill.type, skill);
      const actionType = skill.type;
      const skillId = isStandard ? skill.skillKey || skill.type : skill.skillKey || skill.type;
      const cooldown = resolveLevelNumber(skill?.cooldown, levelIndex, 0);
      const segmentData = buildSegmentModels(skillIdBase, skill, levelIndex);
      const gaugeGainDefault =
        skill.type === 'battleSkill'
          ? Number(skill?.ultimateEnergyGain ?? DEFAULT_BATTLE_SKILL_UE) || 0
          : skill.type === 'comboSkill'
            ? Number(skill?.ultimateEnergyGain ?? DEFAULT_COMBO_SKILL_UE) || 0
            : Number(skill?.ultimateEnergyGain) || 0;
      const baseDefaults = {
        spCost: skill.type === 'battleSkill' ? systemConstants.value.skillSpCostDefault : 0,
        gaugeCost: skill.type === 'ultimate' ? Number(skill?.ultimateEnergyCost) || 100 : 0,
        gaugeGain: gaugeGainDefault,
        teamGaugeGain: skill.type === 'battleSkill' ? gaugeGainDefault : 0,
        enhancementTime: Number(skill?.enhancementTime) || 0,
        animationTime:
          skill.type === 'ultimate'
            ? Number(skill?.animationTime) || 0.5
            : Number(skill?.animationTime) || 0,
      };
      const globalOverride = (characterOverrides.value[skillIdBase] || {}) as Record<
        string,
        unknown
      >;

      if (skill.type === 'basicAttack') {
        const groupOverrideRaw = (characterOverrides.value[skillIdBase] || {}) as Record<
          string,
          unknown
        >;
        const { duration: _ignoredDuration, ...groupOverride } = groupOverrideRaw;
        const attackGroupName = displayName;

        const segmentTotal = segmentData.segmentPayloads.length;
        const segmentSkills = segmentData.segmentPayloads.map((segmentInfo, idx) => {
          const segmentId = segmentInfo.id as string;
          const segOverride = (characterOverrides.value[segmentId] || {}) as Record<
            string,
            unknown
          >;
          const mergedOverride = {
            ...groupOverride,
            ...segOverride,
          };
          return buildBaseAction({
            id: segmentId,
            type: 'basicAttack',
            skillId,
            name: getBasicAttackSegmentName(attackGroupName, idx + 1, segmentTotal),
            element: segmentInfo.element,
            icon,
            duration: segmentInfo.duration,
            payload: segmentInfo.payload,
            override: mergedOverride,
            extra: {
              kind: 'attack_segment',
              attackSegmentIndex: idx + 1,
              segmentIndex: idx + 1,
              hiddenInLibraryGrid: true,
            },
          });
        });

        const enabledSegments = segmentSkills
          .filter(segment => (Number(segment.duration) || 0) > 0)
          .map((segment, idx, list): Record<string, unknown> => ({
            ...segment,
            attackSequenceIndex: idx + 1,
            attackSequenceTotal: list.length,
            attackGroupName,
          }));

        return buildBaseAction({
          id: skillIdBase,
          type: 'basicAttack',
          skillId,
          name: attackGroupName,
          element: segmentData.element,
          icon,
          duration: enabledSegments.reduce(
            (sum, segment) => sum + (Number(segment.duration) || 0),
            0,
          ),
          payload: segmentData.aggregatePayload,
          override: groupOverrideRaw,
          extra: {
            kind: 'attack_group',
            attackSegments: enabledSegments,
          },
        });
      }

      const multiSegmentTypes = new Set(['battleSkill', 'comboSkill', 'ultimate']);
      if (multiSegmentTypes.has(skill.type) && segmentData.segmentPayloads.length >= 2) {
        const segments = segmentData.segmentPayloads.map((segmentInfo, idx, list) => {
          const segmentId = segmentInfo.id as string;
          const segOverride = (characterOverrides.value[segmentId] || {}) as Record<
            string,
            unknown
          >;
          const segmentSkillId = (segmentInfo.skillId as string) || skillId;
          const segmentSpCost =
            skill.type === 'battleSkill'
              ? (segmentInfo.spCost ?? baseDefaults.spCost)
              : idx === 0
                ? baseDefaults.spCost
                : 0;
          const segmentGaugeGain =
            skill.type === 'battleSkill'
              ? Number(segmentInfo.ultimateEnergyGain ?? DEFAULT_BATTLE_SKILL_UE) || 0
              : skill.type === 'comboSkill'
                ? baseDefaults.gaugeGain
                : idx === list.length - 1
                  ? baseDefaults.gaugeGain
                  : 0;
          return buildBaseAction({
            id: segmentId,
            type: actionType,
            skillId: segmentSkillId,
            name: `${displayName} ${idx + 1}`,
            element: segmentInfo.element,
            icon,
            duration: segmentInfo.duration,
            cooldown: skill.type === 'comboSkill' ? cooldown : 0,
            spCost: segmentSpCost,
            gaugeCost: idx === 0 ? baseDefaults.gaugeCost : 0,
            gaugeGain: segmentGaugeGain,
            teamGaugeGain:
              skill.type === 'battleSkill'
                ? segmentGaugeGain
                : idx === list.length - 1
                  ? baseDefaults.teamGaugeGain
                  : 0,
            enhancementTime: idx === 0 ? baseDefaults.enhancementTime : 0,
            animationTime: idx === 0 ? baseDefaults.animationTime : 0,
            payload: segmentInfo.payload,
            override: segOverride,
            sourceSkillKey: skillId,
            extra: {
              kind: 'segment',
              segmentIndex: idx + 1,
              followupDelay: segmentInfo.followupDelay,
              hiddenInLibraryGrid: true,
            },
          });
        });

        return buildBaseAction({
          id: skillIdBase,
          type: actionType,
          skillId,
          name: displayName,
          element: segmentData.element,
          icon,
          duration: segmentData.totalDuration || 1,
          cooldown,
          spCost: baseDefaults.spCost,
          gaugeCost: baseDefaults.gaugeCost,
          gaugeGain: baseDefaults.gaugeGain,
          teamGaugeGain: baseDefaults.teamGaugeGain,
          enhancementTime: baseDefaults.enhancementTime,
          animationTime: baseDefaults.animationTime,
          payload: segmentData.aggregatePayload,
          override: globalOverride,
          extra: {
            kind: 'group',
            segments,
            segmentsAll: segments,
          },
          sourceSkillKey: skillId,
        });
      }

      return buildBaseAction({
        id: skillIdBase,
        type: actionType,
        skillId,
        name: displayName,
        element: segmentData.element,
        icon,
        duration: Math.max(
          0,
          segmentData.totalDuration || Number(skill?.segments?.[0]?.duration) || 1,
        ),
        cooldown,
        spCost: baseDefaults.spCost,
        gaugeCost: baseDefaults.gaugeCost,
        gaugeGain: baseDefaults.gaugeGain,
        teamGaugeGain: baseDefaults.teamGaugeGain,
        enhancementTime: baseDefaults.enhancementTime,
        animationTime: baseDefaults.animationTime,
        payload: segmentData.aggregatePayload,
        override: globalOverride,
      });
    };

    const standardSkillOrder = [
      'basicAttack',
      'dive',
      'finisher',
      'battleSkill',
      'comboSkill',
      'ultimate',
    ];
    const isSkill = (s: Record<string, unknown> | null): s is Record<string, unknown> => Boolean(s);
    const standardSkills = standardSkillOrder
      .map(skillKey =>
        buildStandardOrVariantSkill(flatSkills[skillKey] as Record<string, any> | undefined, {
          isStandard: true,
        }),
      )
      .filter(isSkill);

    const variantSkills = (Object.values(flatSkills) as Record<string, any>[])
      .filter(skill => !standardSkillOrder.includes(skill?.skillKey ?? ''))
      .map(skill => buildStandardOrVariantSkill(skill, { isStandard: false }))
      .filter(isSkill);

    const visibleSkills = [...standardSkills, ...variantSkills].sort((a, b) => {
      const weightA = TYPE_ORDER[a.type as string] || 99;
      const weightB = TYPE_ORDER[b.type as string] || 99;

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      const isVariantA = String(a.id).includes('_variant_');
      const isVariantB = String(b.id).includes('_variant_');

      if (isVariantA !== isVariantB) {
        return isVariantA ? 1 : -1;
      }

      return 0;
    });

    const hiddenSkillChildren: Record<string, unknown>[] = [];
    const seenChildIds = new Set(visibleSkills.map(skill => skill.id));
    visibleSkills.forEach(skill => {
      const children = [
        ...(Array.isArray(skill.attackSegments) ? skill.attackSegments : []),
        ...(Array.isArray(skill.segments) ? skill.segments : []),
      ];
      children.forEach(child => {
        if (!child?.id || seenChildIds.has(child.id)) return;
        seenChildIds.add(child.id);
        hiddenSkillChildren.push(child);
      });
    });

    return [...visibleSkills, ...hiddenSkillChildren];
  });

  return {
    activeSkillLibrary,
  };
}
