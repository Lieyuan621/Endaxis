import { projectAbilityEntityCountStatus } from '../../../core/projection/abilityEntityCountStatus';
import { operatorOwner, markersOfKind } from '../../../core/project/scenarioMarkers';
import { expect, it } from 'vitest';
import { availablePickups } from '../../../core/projection/availablePickups';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createTimelineSampleScenario } from '../../../ui/timeline/timelineSampleScenario';
import { createScenarioSimulationService } from '../createScenarioSimulationService';

function scenarioFor(
  slug: string,
  skillGroupKey: 'battleSkill' | 'ultimate' | 'comboSkill',
  skillKey: string,
) {
  const scenario = createTimelineSampleScenario();
  const track = scenario.tracks[0]!;
  track.operator!.operatorSlug = slug;
  track.operator!.talentStates = { 0: 2, 1: 2 };
  track.initialState.ultimateEnergy = slug === 'kay' ? 150 : 0;
  scenario.tracks[1] = null;
  track.skillCasts = [
    {
      id: 'cast',
      placement: { startFrame: 15 },
      source: { kind: 'operatorSkill', skillGroupKey, skillKey },
    },
  ];
  return scenario;
}
function simulate(scenario: ReturnType<typeof scenarioFor>, frame: number) {
  const session = createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
  session.advanceToFrame(frame);
  return session.collectResult().receiptEntries;
}
it.each([
  ['snowshine', 'chr_0014_aurora_normal_skill'],
  ['catcher', 'chr_0020_meurs_normal_skill'],
])('受击输入触发 %s 战技反击', (slug, skill) => {
  const scenario = scenarioFor(slug, 'battleSkill', skill);
  const base = simulate(scenario, 240);
  scenario.markers = [
    ...scenario.markers.filter(marker => marker.kind !== 'operatorHit'),
    {
      kind: 'operatorHit' as const,
      id: 'hit',
      frame: 30,
      owner: operatorOwner(scenario, 0),
    },
  ];
  const marked = simulate(scenario, 240);
  const frames = (entries: typeof base) =>
    entries.filter(e => e.event === 'DamageApplied').map(e => e.frame);
  expect(frames(marked).length).toBeGreaterThan(0);
  expect(frames(marked)).not.toEqual(frames(base));
  markersOfKind(scenario, 'operatorHit')[0]!.frame = 235;
  expect(frames(simulate(scenario, 240))).toEqual(frames(base));
});
it.each([
  ['ultimate', 'chr_0040_sweetpie_ultimate_skill'],
  ['comboSkill', 'chr_0040_sweetpie_combo_skill'],
] as const)('一个标记只拾取一个同组的小刻 %s 掉落物', (group, key) => {
  const scenario = scenarioFor('kay', group, key);
  const automatic = simulate(scenario, 400);
  const opened = automatic.filter(e => e.event === 'PickupOpened').map(e => [e.frame, e.targetId]);
  expect(opened.length).toBeGreaterThan(0);
  expect(
    automatic.filter(e => e.event === 'PickupEntered').map(e => [e.frame, e.targetId]),
  ).toEqual(opened);
  expect(availablePickups(automatic, 400).size).toBe(0);
  scenario.battle.automaticPickup = false;
  const entries = simulate(scenario, 400);
  const drops = availablePickups(entries, 400);
  const chosen = [...drops.entries()][0];
  expect(chosen).toBeDefined();
  const [, { group: pickupGroup, pickupFrame }] = chosen!;
  scenario.markers = [
    ...scenario.markers.filter(marker => marker.kind !== 'pickup'),
    {
      kind: 'pickup' as const,
      id: 'tooEarly',
      frame: pickupFrame - 1,
      owner: operatorOwner(scenario, 0),
      group: pickupGroup,
    },
  ];
  expect(simulate(scenario, 400).some(e => e.event === 'PickupEntered')).toBe(false);
  scenario.markers = [
    ...scenario.markers.filter(marker => marker.kind !== 'pickup'),
    {
      kind: 'pickup' as const,
      id: 'pickup',
      frame: 400,
      owner: operatorOwner(scenario, 0),
      group: pickupGroup,
    },
  ];
  const result = simulate(scenario, 425);
  expect(result.filter(e => e.event === 'PickupEntered')).toEqual([
    expect.objectContaining({ frame: 400, data: expect.objectContaining({ group: pickupGroup }) }),
  ]);
  expect(availablePickups(result, 425).size).toBe(drops.size - 1);
  const session = createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
  session.advanceToFrame(390);
  const restored = session.fork(session.runtime.save());
  restored.advanceToFrame(425);
  expect(restored.collectResult().receiptEntries).toEqual(result);
  const id = result.find(e => e.event === 'PickupEntered')?.targetId;
  expect(id && drops.has(id)).toBe(true);
  expect(result.filter(e => e.event === 'AbilityEntityFinished')).toContainEqual(
    expect.objectContaining({ event: 'AbilityEntityFinished', targetId: id, frame: 401 }),
  );
});

it('艾尔黛拉的影子按实体计数，手动拾取一个或在可拾取首帧自动拾取', () => {
  const scenario = scenarioFor('ardelia', 'battleSkill', 'chr_0025_ardelia_normal_skill');
  const rule = gameDataRepository.getOperator('ardelia')!.timelineInteractions!.ardeliaDollyShadow!;
  const track = scenario.tracks[0]!;
  track.operator!.talentStates = { 0: 1 };
  scenario.battle.automaticPickup = false;
  const before = simulate(scenario, 120);
  const drops = availablePickups(before, 120);
  expect(drops.size).toBe(3);
  const count = (entries: typeof before, frame: number) =>
    projectAbilityEntityCountStatus(entries, frame, track.id, rule.entityIds).entities.length;
  expect(count(before, 120)).toBe(3);
  scenario.markers.push({
    kind: 'pickup',
    group: 'ardeliaDollyShadow',
    id: 'pick-one',
    frame: 120,
    owner: operatorOwner(scenario, 0),
  });
  const manual = simulate(scenario, 150);
  expect(manual.filter(entry => entry.event === 'PickupEntered')).toHaveLength(1);
  expect(count(manual, 150)).toBe(2);

  scenario.battle.automaticPickup = true;
  const automatic = simulate(scenario, 150);
  const frames = (event: string) =>
    automatic.filter(e => e.event === event).map(e => [e.frame, e.targetId]);
  expect(frames('PickupEntered')).toHaveLength(3);
  expect(frames('PickupEntered')).toEqual(frames('PickupOpened'));
  expect(count(automatic, 150)).toBe(0);
});
