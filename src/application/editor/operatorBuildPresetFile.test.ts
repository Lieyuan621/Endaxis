import { describe, expect, it } from 'vitest';
import {
  readOperatorPresetFile,
  serializeOperatorPresets,
  operatorPresetFilename,
} from './operatorBuildPresetFile';
import type { OperatorBuildPreset } from './operatorBuildPreset';

const preset: OperatorBuildPreset = {
  id: 'one',
  name: 'Preset',
  build: {
    operator: {
      operatorSlug: 'perlica',
      level: 90,
      promoted: false,
      potential: 5,
      trustLevel: 4,
      skillLevels: { basicAttack: 9, battleSkill: 10, comboSkill: 11, ultimate: 12 },
      talentStates: { '0': 2, '1': 2 },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
  },
};
describe('预设文件', () => {
  it('多预设往返保留完整配置，日期使用本地日历', () => {
    const presets = [preset, { ...preset, id: 'two', name: 'Second' }];
    expect(readOperatorPresetFile(serializeOperatorPresets(presets))).toEqual(presets);
    expect(operatorPresetFilename(new Date(2026, 9, 18))).toBe('Endaxis_Preset-2026-10-18.json');
  });
  it('错误文件类型和不完整配装不能导入', () => {
    expect(() => readOperatorPresetFile('{"kind":"EndaxisProject"}')).toThrow();
    const data = JSON.parse(serializeOperatorPresets([preset]));
    delete data.presets[0].build.gears.armor;
    expect(() => readOperatorPresetFile(JSON.stringify(data))).toThrow();
  });
});
