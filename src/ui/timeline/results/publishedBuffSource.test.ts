import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { PublishedOperatorMetadata } from './publishedOperatorMetadata';
import { capturePublishedOperatorMetadata } from './publishedOperatorMetadata';
import { arcane } from '../../../data/operators/arcane.generated';
import {
  capturePublishedEquipmentSources,
  resolvePublishedBuffSource,
  resolvePublishedEquipmentTrait,
} from './publishedBuffSource';

it('从冻结词条定位事件处理器，重复处理器键不强选词条', () => {
  const weapon = {
    slug: 'weapon',
    traits: [
      { key: 'skill3', eventHandlers: [{ key: 'on-hit' }] },
      { key: 'skill2', eventHandlers: [{ key: 'shared' }] },
      { key: 'skill1', eventHandlers: [{ key: 'shared' }] },
    ],
  };
  const source = capturePublishedEquipmentSources([weapon]).get('weapon')!;
  weapon.traits[0]!.eventHandlers[0]!.key = 'edited';
  expect(resolvePublishedEquipmentTrait(source, 'equipment:weaponTrait:weapon:on-hit')).toBe(
    'skill3',
  );
  expect(
    resolvePublishedEquipmentTrait(source, 'upgrade-initialization:weapon-trait:weapon:skill2'),
  ).toBe('skill2');
  expect(
    resolvePublishedEquipmentTrait(source, 'equipment:weaponTrait:weapon:shared'),
  ).toBeUndefined();
  expect(
    resolvePublishedEquipmentTrait(source, 'equipment:weaponTrait:weapon:unknown'),
  ).toBeUndefined();
});

it('装备按发布时的处理器定位到具体词条', () => {
  const gear = { slug: 'gear', traits: [{ key: 'secondary', eventHandlers: [{ key: 'on-hit' }] }] };
  const gears = capturePublishedEquipmentSources([gear], 'gear');
  const source = resolvePublishedBuffSource(
    { sourceId: 'track', sourceActionId: 'equipment:gearTrait:gear:on-hit' },
    scenario,
    operators,
    new Map(),
    gears,
  )!;
  expect(source.kind).toBe('gear');
  expect(resolvePublishedEquipmentTrait(source, 'equipment:gearTrait:gear:on-hit')).toBe(
    'secondary',
  );
});

it('captures native weapon presentation identity and custom names without retaining mutable definitions', () => {
  const weapon = {
    slug: 'wpn_funnel_0016',
    assetSlug: 'wpn_artsunit_0016',
    iconPath: '/icons/weapons/funnel.webp',
  };
  const captured = capturePublishedEquipmentSources([
    weapon,
    { slug: 'custom', displayName: '自定义武器' },
  ]);
  weapon.assetSlug = 'changed-after-publication';
  expect(
    resolvePublishedBuffSource(
      { sourceActionId: 'upgrade-initialization:weapon-trait:wpn_funnel_0016:skill3' },
      scenario,
      operators,
      captured,
    ),
  ).toEqual({
    kind: 'weapon',
    slug: 'wpn_artsunit_0016',
    iconPath: '/icons/weapons/funnel.webp',
  });
  expect(
    resolvePublishedBuffSource(
      { sourceActionId: 'equipment:weaponTrait:custom:skill3' },
      scenario,
      operators,
      captured,
    ),
  ).toEqual({ kind: 'weapon', slug: 'custom', name: '自定义武器' });
});

const scenario = createEmptyScenario('test', 'test');
scenario.tracks[0] = {
  id: 'track',
  operator: {
    operatorSlug: 'custom',
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
      source: { kind: 'operatorSkill', skillGroupKey: 'group', skillKey: 'skill' },
      placement: { startFrame: 0 },
    },
  ],
};
const metadata: PublishedOperatorMetadata = {
  slug: 'custom',
  assetSlug: 'native',
  displayName: 'custom name',
  element: 'electric',
  skillKeys: ['skill'],
  talents: [
    { levels: 2, passiveKeys: [] },
    { levels: 1, passiveKeys: ['passive-t'] },
  ],
  potentials: [{ levels: 1, passiveKeys: ['passive-p'] }],
};
const operators = new Map([['custom', metadata]]);

it('captures the generated Arcane replacement skill through the shared definition traversal', () => {
  const original = structuredClone(scenario);
  original.tracks[0]!.operator!.operatorSlug = 'arcane';
  const captured = capturePublishedOperatorMetadata(original, { getOperator: () => arcane });
  expect(captured.get('arcane')?.skillKeys).toContain('chr_0032_lizhiyan_ultimate_skill2');
  expect(
    resolvePublishedBuffSource(
      { sourceActionId: 'chr_0032_lizhiyan_ultimate_skill2', sourceId: 'track' },
      original,
      captured,
    ),
  ).toEqual({
    kind: 'skill',
    slug: 'arcane',
    key: 'chr_0032_lizhiyan_ultimate_skill2',
    fallbackKey: 'ultimate',
  });
});

it('keeps the skill identity while carrying its own level-source title fallback', () => {
  const withTitles = new Map([
    ['custom', { ...metadata, skillLevelSources: { skill: 'ultimate' } }],
  ]);
  for (const sourceActionId of ['cast', 'skill']) {
    expect(
      resolvePublishedBuffSource({ sourceActionId, sourceId: 'track' }, scenario, withTitles),
    ).toEqual({ kind: 'skill', slug: 'native', key: 'skill', fallbackKey: 'ultimate' });
  }
});

it('Buff 的接收者和施法者位于不同轨道时仍按全局技能块 ID 找施法者', () => {
  const crossTrack = structuredClone(scenario);
  crossTrack.tracks[1] = {
    ...crossTrack.tracks[0]!,
    id: 'receiving-track',
    skillCasts: [],
  };
  expect(
    resolvePublishedBuffSource(
      { sourceId: 'receiving-track', sourceActionId: 'cast' },
      crossTrack,
      operators,
    ),
  ).toEqual({ kind: 'skill', slug: 'native', key: 'skill' });
});

it.each([
  ['cast', { kind: 'skill', slug: 'native', key: 'skill' }],
  ['skill', { kind: 'skill', slug: 'native', key: 'skill' }],
  ['upgrade-initialization:talent:1', { kind: 'talent', slug: 'native', index: 2 }],
  ['passive:passive-t', { kind: 'talent', slug: 'native', index: 2 }],
  ['upgrade-initialization:potential:0', { kind: 'potential', slug: 'native', index: 0 }],
  ['passive:passive-p', { kind: 'potential', slug: 'native', index: 0 }],
  ['unknown', undefined],
] as const)('resolves published source %s without a live definition repository', (id, expected) => {
  expect(
    resolvePublishedBuffSource({ sourceId: 'track', sourceActionId: id }, scenario, operators),
  ).toEqual(expected);
});

it.each(['weaponTrait', 'weapon-trait', 'gearTrait', 'gear-trait', 'gearSet', 'gear-set'])(
  'keeps equipment alias %s',
  alias => {
    const kind = alias.startsWith('weapon')
      ? 'weapon'
      : alias === 'gearSet' || alias === 'gear-set'
        ? 'gearSet'
        : 'gear';
    for (const prefix of ['equipment', 'upgrade-initialization'])
      expect(
        resolvePublishedBuffSource(
          { sourceActionId: `${prefix}:${alias}:item:rest` },
          scenario,
          operators,
        ),
      ).toEqual({ kind, slug: 'item' });
  },
);

it('does not invent names without a publication or matching source', () => {
  expect(
    resolvePublishedBuffSource({ sourceActionId: 'cast' }, undefined, operators),
  ).toBeUndefined();
  expect(resolvePublishedBuffSource({}, scenario, operators)).toBeUndefined();
  expect(
    resolvePublishedBuffSource(
      { sourceActionId: 'passive:passive-t', sourceId: 'missing' },
      scenario,
      operators,
    ),
  ).toBeUndefined();
});
