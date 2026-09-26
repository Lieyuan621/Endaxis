import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { arcane } from '../../../data/operators/arcane.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';
import type { ActionGraphNode } from '../../../../packages/game-data-contract/src/actionGraph';

it('诀处决按原生分段与目标触发间隔执行，不合并成旧版单次伤害', async () => {
  let scenario = createEmptyScenario('arcane-finisher', '诀处决');
  scenario.tracks[0] = {
    id: 'arcane',
    operator: {
      operatorSlug: arcane.slug,
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
  let id = 0;
  scenario = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: arcane,
    skillGroupKey: 'finisher',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:${++id}` },
  }).scenario;
  const run = await createEditorSimulationService().simulate(scenario, 200);
  const damage = run.receiptEntries.filter(e => e.event === 'DamageApplied');
  expect(damage).toHaveLength(5);
  expect(damage.every(e => e.data?.skillType === 'finisher')).toBe(true);
  const base = damage.map(e => e.data?.baseDamage as number);
  for (const value of base.slice(0, 4)) expect(value).toBeCloseTo(base[0]!, 4);
  expect(base[4]! / base[0]!).toBeCloseTo(5, 5);
  expect(new Set(damage.map(e => e.data?.castId)).size).toBe(1);
  // 持续检测的目标间隔为严格大于 0.067 秒；三个 30 FPS 帧内只触发一次。
  // 图语义下伤害身份携带所在图节点名；用 repeatEachTick 节点身份定位持续检测命中。
  const finisherGroup = arcane.skillGroups.find(group => group.key === 'finisher');
  const finisherSkill = (
    Array.isArray(finisherGroup?.skills) ? finisherGroup!.skills : [finisherGroup!.skills]
  )[0];
  const finisherNodes: Readonly<Record<string, ActionGraphNode>> =
    finisherSkill.actionGraph.main.nodes;
  const repeatNodeId = Object.entries(finisherNodes).find(
    ([, node]) => node.action.kind === 'repeatEachTick',
  )?.[0];
  if (repeatNodeId === undefined) throw new Error('finisher graph misses repeatEachTick node');
  const repeated = damage.filter(e => String(e.data?.stepKey).includes(repeatNodeId));
  expect(repeated).toHaveLength(1);
  expect(damage[4]!.frame).toBeGreaterThan(repeated[0]!.frame);
});
