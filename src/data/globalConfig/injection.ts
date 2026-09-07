import type { Effect } from '@/data/types';
import { getGlobalConfigPreset } from './presets';
import {
  createEmptyGlobalConfig,
  type GlobalConfigInjection,
  type GlobalConfigState,
  type GlobalModifier,
  type GlobalOperatorStatModifier,
  type OperatorStatModifier,
} from './types';

/**
 * Sentinel stamped onto injected effect `name` so StatDetailDialog / source lists
 * show one shared label (resolved via i18n `globalConfig.title`). Not a per-field id.
 */
export const GLOBAL_CONFIG_SOURCE_LABEL = '__global_config__';

export type GlobalOperatorStatValueKind = 'percent' | 'percentPlus' | 'flat';

export const GLOBAL_CONFIG_OPERATOR_STAT_CHOICES: Array<{
  key: string;
  modifier: OperatorStatModifier;
  skillTypes?: string;
  /** Matches EditOperatorBaseStatsPanel affix layout. */
  valueKind: GlobalOperatorStatValueKind;
}> = [
  {
    key: 'comboCooldownReductionPercent',
    modifier: 'cooldownReductionPercent',
    skillTypes: 'comboSkill',
    valueKind: 'percent',
  },
  {
    key: 'ultimateGainEfficiency',
    modifier: 'ultimateGainEfficiency',
    valueKind: 'percentPlus',
  },
  {
    key: 'artsIntensity',
    modifier: 'artsIntensity',
    valueKind: 'flat',
  },
  {
    key: 'atkPercent',
    modifier: 'atkPercent',
    valueKind: 'percent',
  },
  {
    key: 'critRate',
    modifier: 'critRate',
    valueKind: 'percent',
  },
  {
    key: 'critDmg',
    modifier: 'critDmg',
    valueKind: 'percent',
  },
];

function newModifierId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultOperatorStatModifier(
  choiceKey = GLOBAL_CONFIG_OPERATOR_STAT_CHOICES[0]?.key,
): GlobalOperatorStatModifier {
  const choice =
    GLOBAL_CONFIG_OPERATOR_STAT_CHOICES.find(c => c.key === choiceKey) ||
    GLOBAL_CONFIG_OPERATOR_STAT_CHOICES[0]!;
  return {
    id: newModifierId('gc_op'),
    kind: 'operatorStat',
    modifier: choice.modifier,
    value: 0,
    ...(choice.skillTypes ? { skillTypes: choice.skillTypes } : {}),
  };
}

/** Display label reused from existing i18n (effects.name / statDetail). */
export function formatGlobalModifierLabel(
  mod: {
    kind?: string;
    modifier?: string;
    skillTypes?: string | string[];
  },
  t: (key: string) => string,
): string {
  if (mod.kind && mod.kind !== 'operatorStat') return '';
  const modifier = mod.modifier;
  if (!modifier) return '';
  const skillRaw = mod.skillTypes;
  const skill = Array.isArray(skillRaw) ? skillRaw[0] : skillRaw;
  // Match operator base-stats / StatDetail wording for combo CDR.
  if (modifier === 'cooldownReductionPercent' && skill === 'comboSkill') {
    return t('statDetail.comboCdReduction');
  }
  const base = t(`effects.name.${modifier}`);
  if (typeof skill === 'string' && skill) {
    return `${base}（${t(`hitEditor.skillTypes.${skill}`)}）`;
  }
  return base;
}

function isOperatorStatModifier(
  mod: GlobalModifier,
): mod is Extract<GlobalModifier, { kind: 'operatorStat' }> {
  return mod.kind === 'operatorStat';
}

function isEffectModifier(mod: GlobalModifier): mod is Extract<GlobalModifier, { kind: 'effect' }> {
  return mod.kind === 'effect';
}

function stampGlobalSourceName(effect: Effect): Effect {
  return { ...effect, name: GLOBAL_CONFIG_SOURCE_LABEL } as Effect;
}

function operatorStatToEffect(mod: Extract<GlobalModifier, { kind: 'operatorStat' }>): Effect {
  return stampGlobalSourceName({
    kind: 'status',
    id: `gc:${mod.id}`,
    target: 'team',
    stat: mod.skillTypes
      ? { modifier: mod.modifier, skillTypes: mod.skillTypes }
      : { modifier: mod.modifier },
    value: Number(mod.value) || 0,
  } as Effect);
}

function collectModifiers(state: GlobalConfigState): GlobalModifier[] {
  const preset = getGlobalConfigPreset(state.presetId);
  const fromPreset = preset?.resolve()?.modifiers ?? [];
  return [...fromPreset, ...(state.customModifiers || [])];
}

export function buildGlobalConfigInjection(state: GlobalConfigState): GlobalConfigInjection {
  const effects: GlobalConfigInjection['effects'] = [];
  const triggers: GlobalConfigInjection['triggers'] = [];

  const preset = getGlobalConfigPreset(state.presetId);
  const resolved = preset?.resolve();
  (resolved?.effects || []).forEach((effect, ei) => {
    const withId = effect.id ? effect : { ...effect, id: `gc:preset:${preset!.id}:e${ei}` };
    effects.push({
      effect: stampGlobalSourceName(withId),
      sourceSlotIndex: 0,
      sourceOperatorSlug: `gc:preset:${preset!.id}:e${ei}`,
    });
  });
  (resolved?.triggers || []).forEach((triggerEffect, ti) => {
    const stamped = {
      ...triggerEffect,
      effects: (triggerEffect.effects || []).map(stampGlobalSourceName),
    };
    triggers.push({
      triggerEffect: stamped,
      sourceSlotIndex: 0,
      sourceOperatorSlug: `gc:preset:${preset!.id}:t${ti}`,
      sourceTrackId: null,
    });
  });

  for (const mod of collectModifiers(state)) {
    if (isOperatorStatModifier(mod)) {
      effects.push({
        effect: operatorStatToEffect(mod),
        sourceSlotIndex: 0,
        sourceOperatorSlug: `gc:mod:${mod.id}`,
      });
    } else if (isEffectModifier(mod) && mod.effect) {
      const effect = mod.effect.id ? mod.effect : { ...mod.effect, id: `gc:mod:${mod.id}` };
      effects.push({
        effect: stampGlobalSourceName(effect),
        sourceSlotIndex: 0,
        sourceOperatorSlug: `gc:mod:${mod.id}`,
      });
    }
  }

  return { effects, triggers };
}

function normalizeModifier(raw: unknown): GlobalModifier | null {
  if (!raw || typeof raw !== 'object') return null;
  const mod = raw as Record<string, unknown>;
  const id = typeof mod.id === 'string' && mod.id ? mod.id : newModifierId('gc');
  if (mod.kind === 'operatorStat' && typeof mod.modifier === 'string') {
    return {
      id,
      kind: 'operatorStat',
      modifier: mod.modifier as OperatorStatModifier,
      value: Number(mod.value) || 0,
      ...(mod.skillTypes != null ? { skillTypes: mod.skillTypes as string | string[] } : {}),
    };
  }
  if (mod.kind === 'effect' && mod.effect && typeof mod.effect === 'object') {
    return { id, kind: 'effect', effect: mod.effect as Effect };
  }
  return null;
}

export function normalizeGlobalConfig(raw: unknown): GlobalConfigState {
  if (!raw || typeof raw !== 'object') return createEmptyGlobalConfig();
  const data = raw as Record<string, unknown>;
  const presetId =
    typeof data.presetId === 'string' && data.presetId
      ? getGlobalConfigPreset(data.presetId)
        ? data.presetId
        : null
      : null;
  const customModifiers = Array.isArray(data.customModifiers)
    ? data.customModifiers.map(normalizeModifier).filter((m): m is GlobalModifier => !!m)
    : [];
  return { presetId, customModifiers };
}
