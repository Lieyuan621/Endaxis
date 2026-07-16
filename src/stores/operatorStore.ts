// @ts-nocheck
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { OperatorInstance, OperatorLevel } from '../types';
import { getOperator, getOperatorTalentGroups, resolveOperatorSlug } from '../data';
import { getOperatorSkillMax, clampOperatorSkillLevel } from '../utils/operatorBounds';
import { getPromotionCount } from '../data/stats/baseValues';

const STORAGE_KEY = 'endfield-operator-armory';

let _counter = 0;
function generateId(): string {
  return `op_${Date.now()}_${++_counter}`;
}

const SKILL_KEY_MIGRATION: Record<string, string | null> = {
  'Basic Attack': 'basicAttack',
  'Battle Skill': 'battleSkill',
  'Combo Skill': 'comboSkill',
  Ultimate: 'ultimate',
  Finisher: null,
  Dive: null,
};

function migrateSkillLevels(instances: OperatorInstance[]): OperatorInstance[] {
  for (const inst of instances) {
    const staleKeys = Object.keys(inst.skillLevels).filter(k => k in SKILL_KEY_MIGRATION);
    if (staleKeys.length === 0) continue;
    for (const oldKey of staleKeys) {
      const newKey = SKILL_KEY_MIGRATION[oldKey];
      const value = inst.skillLevels[oldKey];
      delete inst.skillLevels[oldKey];
      if (newKey !== null) inst.skillLevels[newKey] = value;
    }
  }
  return instances;
}

const LEGACY_TALENT_STATE_MAP: Record<string, number> = { inactive: 0, active: 1, upgraded: 2 };

function migrateTalentStates(instances: OperatorInstance[]): OperatorInstance[] {
  for (const inst of instances) {
    for (const key of Object.keys(inst.talentStates)) {
      const val = inst.talentStates[key];
      if (typeof val === 'string') {
        inst.talentStates[key] = LEGACY_TALENT_STATE_MAP[val as string] ?? 0;
      }
    }
  }
  return instances;
}

function migrateTrustLevel(instances: OperatorInstance[]): OperatorInstance[] {
  for (const inst of instances) {
    if (inst.trustLevel === undefined || inst.trustLevel === null) {
      (inst as OperatorInstance).trustLevel = 0;
    }
  }
  return instances;
}

function migrateOperatorSlugs(instances: OperatorInstance[]): OperatorInstance[] {
  for (const inst of instances) {
    const resolved = resolveOperatorSlug(inst.operatorSlug);
    if (resolved) inst.operatorSlug = resolved;
  }
  return instances;
}

function loadFromStorage(): OperatorInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.state && Array.isArray(parsed.state.operators)) {
        return migrateOperatorSlugs(
          migrateTrustLevel(migrateTalentStates(migrateSkillLevels(parsed.state.operators))),
        );
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveToStorage(operators: OperatorInstance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { operators } }));
}

export const useOperatorStore = defineStore('operators', () => {
  const operators = ref<OperatorInstance[]>(loadFromStorage());

  function persist() {
    saveToStorage(operators.value);
  }

  function addOperator(slug: string): OperatorInstance {
    const resolvedSlug = resolveOperatorSlug(slug) || slug;
    const op = getOperator(resolvedSlug);
    const skillLevels: Record<string, number> = {};
    if (op) {
      for (const key of Object.keys(op.combatSkills)) {
        skillLevels[key] = 1;
      }
    }
    const talentGroups = getOperatorTalentGroups(resolvedSlug);
    const talentStates: Record<string, number> = {};
    for (let i = 0; i < talentGroups.length; i++) {
      talentStates[String(i)] = 0;
    }

    const instance: OperatorInstance = {
      id: generateId(),
      operatorSlug: resolvedSlug,
      level: 1,
      promoted: false,
      potential: 0,
      skillLevels,
      talentStates,
      trustLevel: 0,
    };
    operators.value.push(instance);
    persist();
    return instance;
  }

  function importOperator(data: Omit<OperatorInstance, 'id'>): OperatorInstance {
    const resolvedSlug = resolveOperatorSlug(data.operatorSlug) || data.operatorSlug;
    const normalizedData = { ...data, operatorSlug: resolvedSlug };
    const existing = operators.value.find(o => o.operatorSlug === resolvedSlug);
    if (existing) {
      Object.assign(existing, normalizedData, { id: existing.id });
      persist();
      return existing;
    }
    const instance: OperatorInstance = { id: generateId(), ...normalizedData };
    operators.value.push(instance);
    persist();
    return instance;
  }

  function updateOperator(
    id: string,
    updates: Partial<
      Pick<
        OperatorInstance,
        'level' | 'promoted' | 'potential' | 'skillLevels' | 'talentStates' | 'trustLevel'
      >
    >,
  ) {
    const o = operators.value.find(op => op.id === id);
    if (!o) return;

    if (updates.level !== undefined) o.level = updates.level;
    if (updates.promoted !== undefined) o.promoted = updates.promoted;
    if (updates.potential !== undefined) o.potential = updates.potential;
    if (updates.trustLevel !== undefined) o.trustLevel = updates.trustLevel;
    if (updates.skillLevels) Object.assign(o.skillLevels, updates.skillLevels);
    if (updates.talentStates) Object.assign(o.talentStates, updates.talentStates);

    // Normalize promoted for fixed levels
    if (o.level === 1) o.promoted = false;
    if (o.level === 90) o.promoted = true;

    // Clamp trust level to [0, promotionCount]
    const maxTrust = getPromotionCount(o.level, o.promoted);
    o.trustLevel = Math.min(Math.max(0, o.trustLevel ?? 0), maxTrust);

    // Clamp skill levels
    const max = getOperatorSkillMax(o.level as OperatorLevel, o.promoted);
    for (const key of Object.keys(o.skillLevels)) {
      o.skillLevels[key] = clampOperatorSkillLevel(o.skillLevels[key], max);
    }

    // Clamp talent states to valid range and migrate legacy string values
    const talentGroups = getOperatorTalentGroups(
      resolveOperatorSlug(o.operatorSlug) || o.operatorSlug,
    );
    const legacyMap: Record<string, number> = { inactive: 0, active: 1, upgraded: 2 };
    for (let i = 0; i < talentGroups.length; i++) {
      const key = String(i);
      let state = o.talentStates[key];
      if (typeof state === 'string') state = legacyMap[state as string] ?? 0;
      o.talentStates[key] = Math.min(Math.max(0, state ?? 0), talentGroups[i].levels);
    }

    persist();
  }

  function removeOperator(id: string) {
    operators.value = operators.value.filter(o => o.id !== id);
    persist();
  }

  function clearAll() {
    operators.value = [];
    persist();
  }

  function setAll(instances: OperatorInstance[]) {
    operators.value = migrateOperatorSlugs(JSON.parse(JSON.stringify(instances)));
    persist();
  }

  return {
    operators,
    addOperator,
    importOperator,
    updateOperator,
    removeOperator,
    clearAll,
    setAll,
  };
});
