import { describe, expect, test } from 'vitest';
import {
  EQUIPMENT_LEVELS,
  getEquipmentLevelColor,
  isEquipmentArtificable,
} from './equipmentLevels';

describe('equipmentLevels', () => {
  test('includes Lv60 in filter list and gold color', () => {
    expect(EQUIPMENT_LEVELS).toContain(60);
    expect(getEquipmentLevelColor(60)).toBe('#ffd700');
    expect(getEquipmentLevelColor(70)).toBe('#ffd700');
    expect(getEquipmentLevelColor(50)).toBe('#b37feb');
  });

  test('artificing starts at Lv60', () => {
    expect(isEquipmentArtificable(60)).toBe(true);
    expect(isEquipmentArtificable(70)).toBe(true);
    expect(isEquipmentArtificable(50)).toBe(false);
  });
});
