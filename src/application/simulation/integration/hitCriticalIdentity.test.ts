import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { firstScenarioEnemy } from '../../../core/project/level';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createScenarioSimulationService } from '../createScenarioSimulationService';
function hitScenario(operatorSlug: string, skillGroupKey: string, skillKey: string) {
  const scenario = createEmptyScenario('hit-identity', 'hit-identity');
  scenario.tracks[0] = {
    id: 'operator',
    operator: {
      operatorSlug,
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
    skillCasts: [
      {
        id: 'cast',
        source: {
          kind: 'operatorSkill',
          skillGroupKey,
          skillKey,
        },
        placement: { startFrame: 0 },
      },
    ],
  };
  return scenario;
}

it('技能直接命中按来源图身份分别覆盖暴击和不暴击，平移不改变身份', async () => {
  const scenario = hitScenario('perlica', 'basicAttack', 'chr_0004_pelica_attack1');
  const service = createScenarioSimulationService(gameDataRepository);
  const run = () => service.simulate(scenario, 120);
  const initialRun = await run();
  const first = initialRun.receiptEntries.find(
    e => e.event === 'DamageApplied' && e.data?.castId === 'cast',
  )!;
  expect(first).toBeDefined();
  const key = first.data!.hitIdentity;

  expect(typeof key).toBe('string');
  expect(first.data!.canBreakWeakness).toBeUndefined();
  scenario.battle.hitWeaknessBreaks = { [String(key)]: { stagger: 80 } };
  for (const forced of [true, false]) {
    scenario.battle.hitCriticalOverrides = { [String(key)]: forced };
    scenario.tracks[0]!.skillCasts[0]!.placement.startFrame = 10;
    const hit = (await run()).receiptEntries.find(
      e => e.event === 'DamageApplied' && e.data?.castId === 'cast',
    )!;
    expect(hit.data).toMatchObject({
      hitIdentity: key,
      isCritical: forced,
      hitCriticalOverride: forced,
    });
    expect(hit.data?.breaksWeakness).not.toBe(true);
  }
});

it.each([true, { stagger: 0 }, { stagger: 30 }] as const)(
  '击破弱点 %j 的招式失衡先于陈千语天赋，均只作用于受击敌人且可恢复',
  async mark => {
    const scenario = hitScenario('chen-qianyu', 'battleSkill', 'chr_0005_chen_normal_skill');
    scenario.tracks[0]!.operator!.talentStates = { '1': 2 };
    const first = firstScenarioEnemy(scenario);
    const second = { ...structuredClone(first), id: 'enemy:second' };
    scenario.level = { kind: 'multiEnemies', enemies: [first, second] };
    const service = createScenarioSimulationService(gameDataRepository);
    const baseline = (await service.simulate(scenario, 120)).receiptEntries;
    const hits = baseline.filter(e => e.event === 'DamageApplied' && e.data?.canBreakWeakness);
    expect(hits.map(e => e.targetId)).toEqual(expect.arrayContaining([first.id, second.id]));
    const markedHit = hits.find(e => e.targetId === second.id)!;
    const identity = markedHit.data!.hitIdentity;
    expect(typeof identity).toBe('string');
    scenario.battle.hitWeaknessBreaks = { [String(identity)]: mark };
    const session = service.createCombatSession(scenario);
    session.advanceToFrame(markedHit.frame - 1);
    const resumed = session.fork(session.runtime.save());
    for (const run of [session, resumed]) run.advanceToFrame(120);
    const entries = session.collectResult().receiptEntries;
    expect(resumed.collectResult().receiptEntries).toEqual(entries);
    expect(entries.filter(e => e.data?.breaksWeakness)).toEqual([
      expect.objectContaining({
        event: 'DamageApplied',
        targetId: second.id,
        frame: markedHit.frame,
        data: expect.objectContaining({ hitIdentity: identity, canCritical: true }),
      }),
    ]);
    const stagger = (rows: typeof entries, targetId: string) =>
      rows
        .filter(e => e.event === 'PoiseApplied' && e.targetId === targetId)
        .map(e => e.data!.requestedDelta);
    expect(stagger(entries, first.id)).toEqual(stagger(baseline, first.id));
    const callbackStagger = mark === true ? 0 : mark.stagger;
    expect(stagger(entries, second.id)).toEqual([
      ...(callbackStagger ? [-callbackStagger] : []),
      -10,
      ...stagger(baseline, second.id),
    ]);
  },
);
