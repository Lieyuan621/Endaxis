import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';
import operator from '../timeline/definitions/operators/OperatorDefinitionWorkspaceDialog.vue?raw';
import weapon from '../timeline/definitions/equipment/WeaponDefinitionWorkspaceDialog.vue?raw';
import gear from '../timeline/definitions/equipment/GearDefinitionWorkspaceDialog.vue?raw';
import gearSet from '../timeline/definitions/equipment/GearSetDefinitionWorkspaceDialog.vue?raw';
import skillEditor from '../timeline/definitions/skills/SkillDefinitionEditor.vue?raw';
import operatorBuild from '../timeline/library/OperatorBuildDialog.vue?raw';
import weaponBuild from '../timeline/library/WeaponBuildDialog.vue?raw';
import gearBuild from '../timeline/library/GearLoadoutBuildDialog.vue?raw';
import gearInstance from '../timeline/library/GearInstanceDialog.vue?raw';
import { createSkillEditorDraft } from '../timeline/definitions/skills/skillDefinitionEditorViewModel';
import type { SkillDefinition } from '../../core/game-data/operatorDefinition';

describe('definition workspace regions', () => {
  it.each([operator, weapon, gear, gearSet, operatorBuild, weaponBuild, gearBuild, gearInstance])(
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
  it('unwraps the reactive definition before making an isolated skill draft', () => {
    const definition = reactive({ scheduledSequences: [] } as unknown as SkillDefinition);
    const draft = createSkillEditorDraft(toRaw(definition), undefined);
    expect(draft).not.toBe(toRaw(definition));
    expect(draft.scheduledSequences).not.toBe(definition.scheduledSequences);
    expect(skillEditor.match(/cloneEditorDefinition\(props.template\)/g)).toHaveLength(3);
    expect(skillEditor.match(/cloneEditorDefinition\(props.customDefinition\)/g)).toHaveLength(3);
  });
});
