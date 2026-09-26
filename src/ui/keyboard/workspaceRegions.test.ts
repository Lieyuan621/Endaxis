import { describe, expect, it } from 'vitest';
import operatorBuild from '../timeline/library/OperatorBuildDialog.vue?raw';
import weaponBuild from '../timeline/library/WeaponBuildDialog.vue?raw';
import gearBuild from '../timeline/library/GearLoadoutBuildDialog.vue?raw';
import gearInstance from '../timeline/library/GearInstanceDialog.vue?raw';

describe('definition workspace regions', () => {
  it.each([operatorBuild, weaponBuild, gearBuild, gearInstance])(
    'wraps the whole dialog including named slots',
    source => {
      const template = source.slice(source.indexOf('<template>'));
      expect(template.indexOf('<EaDialog')).toBeGreaterThanOrEqual(0);
      expect(template.indexOf('<InputRegionBoundary')).toBeLessThan(template.indexOf('<EaDialog'));
      expect(template.indexOf('</InputRegionBoundary>')).toBeGreaterThan(
        template.indexOf('</EaDialog>'),
      );
    },
  );
  it('does not reopen an equipment child when its parent is reopened', () => {
    expect(gearBuild).toContain('if (!visible) editingSlot.value = null');
    expect(gearBuild).toContain(':visible="visible && editingGear !== null"');
  });
});
