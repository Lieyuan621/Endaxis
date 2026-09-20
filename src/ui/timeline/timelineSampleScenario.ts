/**
 * Next 时间轴的可交互样本项目。
 *
 * Arclight 终结技直接引用当前生成定义，其中的能力实体与子技能时间线来自
 * 版本化生成证据；这里不复制或改写游戏规则，只提供一个可立即打开的技能块。
 */
import { createEmptyScenario } from '../../core/project/createProject';
import type { ScenarioDocument, TrackIndex } from '../../core/project/schema';

const SAMPLE_PERLICA_SLUG = 'perlica';
const SAMPLE_ARCLIGHT_SLUG = 'arclight';

export const ABILITY_ENTITY_SAMPLE_TRACK_INDEX = 1 satisfies TrackIndex;
export const ABILITY_ENTITY_SAMPLE_CAST_ID = 'skillCast:sample:arclight-ultimate';

export function createTimelineSampleScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('sample:scenario:1', '方案 1');
  scenario.tracks[0] = {
    id: 'track:sample:perlica',
    operator: {
      operatorSlug: SAMPLE_PERLICA_SLUG,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  scenario.tracks[ABILITY_ENTITY_SAMPLE_TRACK_INDEX] = {
    id: 'track:sample:arclight',
    operator: {
      operatorSlug: SAMPLE_ARCLIGHT_SLUG,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 90 },
    skillCasts: [
      {
        id: ABILITY_ENTITY_SAMPLE_CAST_ID,
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0007_ikut_ultimate_skill',
        },
        placement: { startFrame: 30 },
        // 初始样例保留一个可直接启用的真实终结技，默认禁用以保持首次打开时的空轴状态。
        presentation: { disabled: true },
      },
    ],
  };
  return scenario;
}
