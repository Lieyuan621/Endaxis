import { describe, expect, it } from 'vitest';
import zhCN from '../../i18n/locales/zh-CN.json';
import en from '../../i18n/locales/en.json';
import { commonBuffDefinitions } from './generated/commonBuffDefinitions.generated';
import { commonBuffPresentationNameKeys } from './generated/commonBuffPresentationNames.generated';

const REQUIRED_STATUS_IDS = [
  'buff_common_energy_shard_attached_fire',
  'buff_common_energy_shard_attached_pulse',
  'buff_common_energy_shard_attached_cryst',
  'buff_common_energy_shard_attached_natural',
  'buff_common_fire_fire_burning_triggered',
  'buff_common_pulse_pulse_conduct_triggered_do',
  'buff_common_cryst_cryst_frozen_triggered_do',
  'buff_common_natural_natural_corrupt_do',
  'buff_physical_no_guard',
  'buff_physical_airborne',
  'buff_physical_knockdown',
  'buff_physical_crushed',
  'buff_physical_do_fracture',
] as const;

describe('公共 Buff 展示名称配置', () => {
  it('覆盖四系附着、四种法术异常、破防和四种物理异常', () => {
    expect(Object.keys(commonBuffPresentationNameKeys)).toEqual(REQUIRED_STATUS_IDS);
  });

  it('所有配置名称在两种产品语言中都有 i18n 文本', () => {
    for (const nameKey of Object.values(commonBuffPresentationNameKeys)) {
      expect(zhCN.effects.name).toHaveProperty(nameKey);
      expect(en.effects.name).toHaveProperty(nameKey);
    }
  });

  it('名称配置独立于公共战斗定义', () => {
    for (const buffId of Object.keys(commonBuffPresentationNameKeys)) {
      const definition = commonBuffDefinitions[buffId];
      if (definition?.presentation !== undefined) {
        expect(definition.presentation).not.toHaveProperty('nameKey');
      }
    }
  });
});
