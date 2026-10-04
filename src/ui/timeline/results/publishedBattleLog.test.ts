import { expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { perlica } from '../../../data/operators/index';
import type { PublishedScenarioSimulation } from '../useScenarioSimulation';
import { capturePublishedBattleLog } from './publishedBattleLog';
import { capturePublishedOperatorMetadata } from './publishedOperatorMetadata';
import { CombatReceiptCollector } from '../../../core/combat/receipt/combatReceipt';

it('captures definition metadata once, while localization uses the captured identity', () => {
  const scenario = createEmptyScenario('test', 'test');
  scenario.tracks[0] = {
    id: 'track',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 1, battleSkill: 1, comboSkill: 1, ultimate: 1 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'cast',
        source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
        placement: { startFrame: 0 },
      },
    ],
  };
  const definition = {
    ...perlica,
    displayName: 'captured custom name',
    buffDefinitions: {
      'buff:owned': {
        stackingType: 'stack' as const,
        presentation: { nameKey: 'effects.name.razorClawmark' },
      },
    },
    talents: perlica.talents.map(talent => ({ ...talent })),
  };
  const index = { getOperator: vi.fn(() => definition) };
  const receiptHistory = new CombatReceiptCollector().history.snapshot();
  let language = 'zh';
  const operators = capturePublishedOperatorMetadata(scenario, index);
  const originalTalent = { ...operators.get(perlica.slug)!.talents[0] };
  const snapshot = capturePublishedBattleLog(
    { scenario, run: { receiptHistory } as unknown as PublishedScenarioSimulation['run'] },
    index,
    operators,
    {
      skill: () => (language === 'zh' ? '战技' : 'Battle skill'),
      operator: name => `${name.displayName}:${language}`,
      color: () => '#ff4d4f',
    },
  );
  const reads = index.getOperator.mock.calls.length;
  definition.displayName = 'edited name';
  definition.buffDefinitions['buff:owned'].presentation.nameKey = 'effects.name.edited';
  definition.talents[0]!.levels = 99;
  expect(operators.get(perlica.slug)!.talents[0]).toEqual(originalTalent);
  expect(Object.keys(operators.get(perlica.slug)!)).not.toContain('skills');
  expect(snapshot.resolveCastOwners()[0]?.operatorLabel).toBe('captured custom name:zh');
  language = 'en';
  expect(snapshot.resolveCastOwners()[0]).toMatchObject({
    label: 'Battle skill',
    operatorLabel: 'captured custom name:en',
    skillId: 'battleSkill',
    color: '#ff4d4f',
  });
  expect(index.getOperator).toHaveBeenCalledTimes(reads);
  expect(snapshot.history).toBe(receiptHistory);
  expect(snapshot.buffDisplayNameKeys?.get('buff:owned')).toBe('effects.name.razorClawmark');

  scenario.tracks[0]!.skillCasts[0]!.presentation = { color: '#123456' };
  expect(snapshot.resolveCastOwners()[0]?.color).toBe('#ff4d4f');
  const recolored = capturePublishedBattleLog(
    { scenario, run: { receiptHistory } as unknown as PublishedScenarioSimulation['run'] },
    index,
    operators,
    {
      skill: () => '战技',
      operator: () => '佩里卡',
      color: () => '#ff4d4f',
    },
  );
  expect(recolored.resolveCastOwners()[0]?.color).toBe('#123456');
});
