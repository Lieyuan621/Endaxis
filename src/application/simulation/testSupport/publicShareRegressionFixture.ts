import { createEmptyScenario } from '../../../core/project/createProject';
import { PROJECT_FPS, type TrackIndex } from '../../../core/project/schema';
import { gameDataRepository } from '../../../data/gameDataRepository';

/** 公开轴动作坐标摘录，不是存档迁移器。来源与未保留项见 public-share-regression-samples.md。 */
export const LOW_STAR_SHARE_URL = 'https://www.end-axis.com/shares/6960d9afaf72c0e43d122dfb';
const sourceFps = 60;
const chen = [
  [302, 'basicAttack1'],
  [332, 'basicAttack2'],
  [354, 'basicAttack3'],
  [392, 'basicAttack4'],
  [436, 'basicAttack5'],
  [499, 'battleSkill'],
  [623, 'comboSkill'],
  [680, 'basicAttack1'],
  [710, 'basicAttack2'],
  [732, 'basicAttack3'],
  [800, 'basicAttack4'],
  [844, 'basicAttack5'],
  [913, 'basicAttack1'],
  [943, 'basicAttack2'],
  [965, 'basicAttack3'],
  [1003, 'basicAttack4'],
  [1047, 'basicAttack5'],
  [1148, 'basicAttack1'],
  [1178, 'basicAttack2'],
  [1200, 'basicAttack3'],
  [1238, 'basicAttack4'],
  [1282, 'basicAttack5'],
  [1360, 'basicAttack1'],
  [1390, 'basicAttack2'],
  [1412, 'basicAttack3'],
  [1450, 'basicAttack4'],
  [1494, 'basicAttack5'],
  [1647, 'comboSkill'],
] as const;
const tracks: readonly { slug: string; actions: readonly (readonly [number, string])[] }[] = [
  { slug: 'chen-qianyu', actions: chen },
  {
    slug: 'endministrator',
    actions: [
      [734, 'comboSkill'],
      [1762, 'comboSkill'],
      [1852, 'battleSkill'],
    ],
  },
  {
    slug: 'estella',
    actions: [
      [1369, 'battleSkill'],
      [1570, 'comboSkill'],
    ],
  },
  {
    slug: 'akekuri',
    actions: [
      [300, 'battleSkill'],
      [1618, 'comboSkill'],
    ],
  },
];

function resolveFixtureSkill(slug: string, legacyKey: string) {
  const skillGroupKey = legacyKey.startsWith('basicAttack') ? 'basicAttack' : legacyKey;
  const group = gameDataRepository
    .getOperator(slug)
    ?.skillGroups.find(candidate => candidate.key === skillGroupKey);
  if (!group) throw new Error(`missing ${slug}/${skillGroupKey} in regression fixture`);
  const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
  const index =
    skillGroupKey === 'basicAttack' ? Number(legacyKey.slice('basicAttack'.length)) - 1 : 0;
  const skill = skills[index];
  if (!skill) throw new Error(`missing ${slug}/${legacyKey} in regression fixture`);
  return { skillGroupKey, skillKey: skill.key };
}

export function createLowStarShareRegressionScenario() {
  const scenario = createEmptyScenario('public-share-low-star', '公开轴动作回归（非完整转换）');
  scenario.battle.durationFrames = 35 * PROJECT_FPS;
  const quantization: {
    castId: string;
    sourceFrame: number;
    frame: number;
    errorSeconds: number;
  }[] = [];
  tracks.forEach((track, index) => {
    scenario.tracks[index as TrackIndex] = {
      id: `public-share:${track.slug}`,
      operator: {
        operatorSlug: track.slug,
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
      skillCasts: track.actions.map(([sourceFrame, legacyKey], actionIndex) => {
        const id = `public-share:${index}:${actionIndex}`;
        // Convert the original integer frame directly; legacy compiler millisecond rounding
        // must not turn a 30 FPS half-frame tie into a different placement.
        const frame = Math.round((sourceFrame * PROJECT_FPS) / sourceFps);
        quantization.push({
          castId: id,
          sourceFrame,
          frame,
          errorSeconds: frame / PROJECT_FPS - sourceFrame / sourceFps,
        });
        return {
          id,
          source: { kind: 'operatorSkill', ...resolveFixtureSkill(track.slug, legacyKey) },
          placement: { startFrame: frame },
        };
      }),
    };
  });
  return { scenario, quantization };
}
