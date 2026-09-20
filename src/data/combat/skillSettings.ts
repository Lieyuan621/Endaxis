import type { SkillSettingsDocument } from '../../core/combat/infliction/skillSettings';
import type { SkillSettingResources } from '../../../packages/game-data-contract/src/skillSettingResources';
import { generatedSkillSettings } from './skillSettings.generated';

/** 当前版本 SkillSetting TypeTree dump 经严格生成器导出的法术配置。 */
const { resources, ...infliction } = generatedSkillSettings;
export const skillSettings: SkillSettingsDocument = infliction;
export const skillSettingResources: SkillSettingResources = resources;
