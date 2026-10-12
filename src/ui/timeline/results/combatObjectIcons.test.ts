import { expect, it } from 'vitest';
import { CombatReceiptCollector } from '../../../core/combat/receipt/combatReceipt';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createCombatObjectIconResolver } from './combatObjectIcons';
import { capturePublishedOperatorMetadata } from './publishedOperatorMetadata';
import { capturePublishedEquipmentSources } from './publishedBuffSource';
import { arcane } from '../../../data/operators/arcane.generated';

it.each([
  ['buff_physical_airborne', '/icons/icon_term_ba_airborne.webp'],
  ['buff_physical_knockdown', '/icons/icon_term_ba_knockdown.webp'],
  ['buff_physical_crushed', '/icons/icon_term_ba_crush.webp'],
  ['buff_physical_do_fracture', '/icons/icon_term_ba_fracture.webp'],
])('uses the timeline physical-status icon in origin graph for %s', (buffId, expected) => {
  const c = new CombatReceiptCollector();
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffApplied',
    targetId: 'enemy',
    data: { instanceId: 1, buffId, icon: 'endaxis:icons/icon_attack_funnel' },
  });
  const q = new CombatObjectOrigins(c.entries);
  const icon = createCombatObjectIconResolver(c.entries, undefined, new Map(), new Map());
  expect(icon(q.get({ kind: 'buff', ownerId: 'enemy', instanceId: 1 }), 0)).toBe(expected);
  expect(icon(q.get({ kind: 'receipt', sequence: 0 }), 0)).toBe(expected);
});

it('uses exact Buff instance icons at the hit boundary and reuses them for consumption', () => {
  const c = new CombatReceiptCollector();
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffApplied',
    targetId: 'a',
    data: { instanceId: 1, buffId: 'same', icon: 'endaxis:icons/icon_attack_sword' },
  });
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffApplied',
    targetId: 'b',
    data: { instanceId: 1, buffId: 'same', icon: 'endaxis:icons/icon_attack_claym' },
  });
  c.record({ frame: 0, time: 0, event: 'BuffConsumed', targetId: 'a', data: { instanceId: 1 } });
  c.record({
    frame: 0,
    time: 0,
    event: 'BuffApplied',
    targetId: 'a',
    data: { instanceId: 1, icon: 'endaxis:icons/icon_attack_funnel' },
  });
  const q = new CombatObjectOrigins(c.entries);
  const icon = createCombatObjectIconResolver(c.entries, undefined, new Map(), new Map());
  expect(icon(q.get({ kind: 'buff', ownerId: 'a', instanceId: 1 }), 2)).toBe(
    '/icons/icon_attack_sword.webp',
  );
  expect(icon(q.get({ kind: 'buff', ownerId: 'b', instanceId: 1 }), 2)).toBe(
    '/icons/icon_attack_claym.webp',
  );
  expect(icon(q.get({ kind: 'receipt', sequence: 2 }), 2)).toBe('/icons/icon_attack_sword.webp');
  expect(icon(q.get({ kind: 'abilityEntity', instanceId: 1 }), 2)).toBeUndefined();
});

it('uses published operator, skill and weapon identities, including the timeline weapon Buff precedence', () => {
  const scenario = createEmptyScenario('test', 'test');
  scenario.tracks[0] = {
    id: 'track',
    operator: {
      operatorSlug: 'arcane',
      level: 1,
      promoted: false,
      potential: 0,
      trustLevel: 0,
      skillLevels: { basicAttack: 1, battleSkill: 1, comboSkill: 1, ultimate: 1 },
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
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill',
        },
        placement: { startFrame: 0 },
      },
    ],
  };
  const operators = capturePublishedOperatorMetadata(scenario, { getOperator: () => arcane }, [
    { operatorId: 'track', attributes: { strength: 0, agility: 0, intellect: 10, will: 20 } },
  ]);
  expect(operators.get('arcane')?.skillIcons?.chr_0032_lizhiyan_ultimate_skill).toBe(
    '/operators/arcane/ultimate 02.webp',
  );
  const equalAttributes = capturePublishedOperatorMetadata(
    scenario,
    { getOperator: () => arcane },
    [{ operatorId: 'track', attributes: { strength: 0, agility: 0, intellect: 20, will: 20 } }],
  );
  expect(equalAttributes.get('arcane')?.skillIcons?.chr_0032_lizhiyan_ultimate_skill).toBe(
    '/operators/arcane/ultimate 01.webp',
  );
  // 第二段不接受技能组图标覆盖，两种构筑都应保留独立图标。
  for (const metadata of [operators, equalAttributes]) {
    expect(metadata.get('arcane')?.skillIcons?.chr_0032_lizhiyan_ultimate_skill2).toBe(
      '/operators/arcane/ultimate 03.webp',
    );
  }
  const c = new CombatReceiptCollector();
  c.record({
    event: 'BuffApplied',
    frame: 0,
    time: 0,
    sourceId: 'track',
    targetId: 'track',
    data: {
      instanceId: 1,
      sourceActionId: 'upgrade-initialization:weapon-trait:item:skill3',
      icon: 'endaxis:icons/icon_attack_funnel',
    },
  });
  c.record({
    event: 'BuffApplied',
    frame: 0,
    time: 0,
    sourceId: 'track',
    targetId: 'track',
    data: {
      instanceId: 2,
      sourceActionId: 'upgrade-initialization:gear-set:suit_fixture',
      icon: 'endaxis:icons/icon_attack_funnel',
    },
  });
  const q = new CombatObjectOrigins(c.entries);
  const icon = createCombatObjectIconResolver(
    c.entries,
    scenario,
    operators,
    capturePublishedEquipmentSources([{ slug: 'item', icon: 'endaxis:weapons/default' }]),
    new Map(),
    new Map([['suit_fixture', '/set.webp']]),
  );
  expect(icon(q.get({ kind: 'operator', operatorId: 'track' }), 0)).toBe(
    '/operators/arcane/avatar.webp',
  );
  expect(icon(q.get({ kind: 'action', ownerId: 'track', actionId: 'cast' }), 0)).toBe(
    '/operators/arcane/ultimate 02.webp',
  );
  expect(icon(q.get({ kind: 'buff', ownerId: 'track', instanceId: 1 }), 0)).toBe(
    '/weapons/default.webp',
  );
  expect(icon(q.get({ kind: 'buff', ownerId: 'track', instanceId: 2 }), 1)).toBe('/set.webp');
  expect(
    icon(
      q.get({ kind: 'action', ownerId: 'track', actionId: 'upgrade-initialization:talent:1' }),
      0,
    ),
  ).toBe('/operators/arcane/talent 2.webp');
});
