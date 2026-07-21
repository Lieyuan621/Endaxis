import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { GearInstance } from '../types';
import { getGearPiece } from '../data';
import { isEquipmentArtificable } from '@/utils/equipmentLevels';

const STORAGE_KEY = 'endfield-gear-armory';

let _counter = 0;
function generateId(): string {
  return `g_${Date.now()}_${++_counter}`;
}

function loadFromStorage(): GearInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.state && Array.isArray(parsed.state.gears)) {
        return parsed.state.gears.map((g: GearInstance) => {
          if (!Array.isArray(g.artificingLevels)) {
            return { ...g, artificingLevels: [] };
          }
          return g;
        });
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveToStorage(gears: GearInstance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { gears } }));
}

export const useGearStore = defineStore('gears', () => {
  const gears = ref<GearInstance[]>(loadFromStorage());

  function persist() {
    saveToStorage(gears.value);
  }

  function addGear(slug: string): GearInstance {
    const instance: GearInstance = {
      id: generateId(),
      gearPieceId: slug,
      artificingLevels: [],
    };
    gears.value.push(instance);
    persist();
    return instance;
  }

  function importGear(data: Omit<GearInstance, 'id'>): GearInstance {
    const instance: GearInstance = { id: generateId(), ...data };
    gears.value.push(instance);
    persist();
    return instance;
  }

  function updateGear(id: string, updates: { artificingLevels: number[] }) {
    const g = gears.value.find(gear => gear.id === id);
    if (!g) return;

    const piece = getGearPiece(g.gearPieceId);
    const isGold = piece && isEquipmentArtificable(piece.levelRequirement);
    if (!isGold) {
      g.artificingLevels = [];
      persist();
      return;
    }

    g.artificingLevels = updates.artificingLevels.map(v => Math.max(0, Math.min(3, v)));
    persist();
  }

  function removeGear(id: string) {
    gears.value = gears.value.filter(g => g.id !== id);
    persist();
  }

  function clearAll() {
    gears.value = [];
    persist();
  }

  function setAll(instances: GearInstance[]) {
    gears.value = JSON.parse(JSON.stringify(instances));
    persist();
  }

  return { gears, addGear, importGear, updateGear, removeGear, clearAll, setAll };
});
