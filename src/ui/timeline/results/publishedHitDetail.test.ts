import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { PublishedScenarioSimulation } from '../useScenarioSimulation';
import { projectPublishedHitDetail } from './publishedHitDetail';
import { deriveHitId } from '../../../core/combat/timeline/deriveHitId';
import {
  CombatReceiptCollector,
  type CombatReceiptEntry,
} from '../../../core/combat/receipt/combatReceipt';

function historyOf(entries: readonly CombatReceiptEntry[]) {
  const receipt = new CombatReceiptCollector();
  for (const { sequence: _sequence, ...entry } of entries) receipt.record(entry);
  return receipt.history.snapshot();
}

it('resolves receipts and panel through stable cast identity, independently of edited track position', () => {
  const scenario = createEmptyScenario('test', 'test');
  scenario.tracks[2] = {
    id: 'source',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'cast',
        source: { kind: 'operatorSkill', skillGroupKey: 'g', skillKey: 's' },
        placement: { startFrame: 0 },
      },
    ],
  };
  const panel = { operatorId: 'source' };
  const entry: CombatReceiptEntry = {
    sequence: 0,
    frame: 1,
    time: 1 / 30,
    event: 'DamageApplied',
    data: { castId: 'cast', hitId: 'hit', value: 100 },
  };
  const published: PublishedScenarioSimulation = {
    scenario,
    // Only owner/panel identity and hit projection fields are needed by this fixture.
    run: {
      receiptHistory: historyOf([entry]),
      operatorPanels: [panel],
    } as unknown as PublishedScenarioSimulation['run'],
  };
  const detail = projectPublishedHitDetail(published, { castId: 'cast', hitId: 'hit' });
  expect(detail?.track).toBe(scenario.tracks[2]);
  expect(detail?.operatorPanel).toBe(panel);
  expect(detail?.forcedCritical).toBe(false);
  expect(detail?.entries).toEqual([entry]);
  const laterEntry = {
    ...entry,
    sequence: 1,
    frame: 2,
    time: 2 / 30,
    data: { ...entry.data, value: 200 },
  };
  const repeated = {
    ...published,
    run: { ...published.run, receiptHistory: historyOf([entry, laterEntry]) },
  };
  expect(
    projectPublishedHitDetail(repeated, { castId: 'cast', hitId: 'hit', executionFrame: 2 })
      ?.entries,
  ).toEqual([laterEntry]);
  expect(
    projectPublishedHitDetail(repeated, { castId: 'cast', hitId: 'hit', executionFrame: 3 })
      ?.entries,
  ).toEqual([]);
  expect(projectPublishedHitDetail(published, { castId: 'new-cast', hitId: 'hit' })).toBeNull();
  expect(projectPublishedHitDetail(null, { castId: 'cast', hitId: 'hit' })).toBeNull();
  expect(projectPublishedHitDetail(published, null)).toBeNull();
  expect(
    projectPublishedHitDetail(published, { castId: 'cast', hitId: 'different-hit' })?.entries,
  ).toEqual([]);
  const forcedScenario = structuredClone(scenario);
  forcedScenario.tracks[2]!.skillCasts[0]!.simulationInputs = {
    criticalOverrides: { 'damage:1': true },
  };
  const forced = { ...published, scenario: forcedScenario };
  const target = { castId: 'cast', hitId: deriveHitId('cast', 'damage:1') };
  expect(projectPublishedHitDetail(published, target)?.forcedCritical).toBe(false);
  expect(projectPublishedHitDetail(forced, target)?.forcedCritical).toBe(true);
  expect(
    projectPublishedHitDetail(forced, { ...target, hitId: deriveHitId('cast', 'damage:2') })
      ?.forcedCritical,
  ).toBe(false);
});
