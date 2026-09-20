import { expect, it } from 'vitest';
import { prepareLegacySource, type ConversionMappings } from './sourcePreparation';
import mappingData from './mappings.json';
// JSON 导入会把 kind 扩宽为 string；目标身份另由 mappings.test.ts 逐条校验。
const fullMappings = mappingData as ConversionMappings;
const source = { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' };
const target = {
  kind: 'operatorSkill',
  skillGroupKey: 'battleSkill',
  skillKey: 'battleSkill',
} as const;
const mappings: ConversionMappings = {
  operators: { old: 'perlica' },
  skills: { old: [{ source, target }] },
  weapons: { oldWeapon: 'wpn_sword_0022' },
  gears: { oldGear: 'item_equip_example' },
};
it('maps every reviewed historical variant without importing its saved damage or effects', () => {
  for (const rule of mappingData.historicalSkills) {
    const value = {
      version: '1.0.0',
      systemConstants: { initialSp: 200 },
      scenarioList: [
        {
          id: 'historic',
          data: {
            tracks: [
              {
                id: rule.operator,
                actions: [
                  {
                    id: rule.id,
                    type: rule.type,
                    attackSegmentIndex: 'segmentIndex' in rule ? rule.segmentIndex : undefined,
                    startTime: 0,
                    damageTicks: [{ multiplier: 999999 }],
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const result = prepareLegacySource(value, fullMappings);
    expect(result.issues, rule.id).toEqual([]);
    const action = result.source.scenarioList[0].data.tracks[0].actions[0];
    expect(action.convertedSource ?? action.convertedSequence, rule.id).toEqual(rule.target);
    value.scenarioList[0]!.data.tracks[0]!.actions[0]!.type = 'unknown';
    expect(prepareLegacySource(value, fullMappings).unresolvedSkills, rule.id).toHaveLength(1);
  }
});
it('按旧连携段号字段还原两段技能，且不把矛盾的段号当成有效身份', () => {
  const value = {
    version: '1.0.0',
    systemConstants: { initialSp: 200 },
    scenarioList: [
      {
        id: 'combo',
        data: {
          tracks: [
            {
              id: 'ROSSI',
              actions: [
                { id: 'ROSSI_link_seg1', type: 'link', comboSegmentIndex: 1, startTime: 0 },
                { id: 'ROSSI_link_seg2', type: 'link', comboSegmentIndex: 2, startTime: 60 },
              ],
            },
          ],
        },
      },
    ],
  };
  const result = prepareLegacySource(value, fullMappings);
  expect(result.issues).toEqual([]);
  expect(
    result.source.scenarioList[0].data.tracks[0].actions.map(
      (action: { convertedSource: { skillKey: string } }) => action.convertedSource.skillKey,
    ),
  ).toEqual(['chr_0028_wulfa_combo_2_skill', 'chr_0028_wulfa_combo_3_skill']);
  value.scenarioList[0]!.data.tracks[0]!.actions[0]!.comboSegmentIndex = 2;
  expect(prepareLegacySource(value, fullMappings).unresolvedSkills).toHaveLength(1);
});

it('只把所属干员的标准旧闪避块标为普通 Dash，不猜极限闪避成功', () => {
  const value = {
    version: '1.0.0',
    timeUnit: 'frame',
    fps: 60,
    systemConstants: { initialSp: 200 },
    scenarioList: [
      {
        id: 'dodge',
        data: {
          tracks: [
            {
              id: 'ROSSI',
              actions: [
                { id: 'ROSSI_dodge', type: 'dodge', startTime: 90 },
                { id: 'OTHER_dodge', type: 'dodge', startTime: 120 },
              ],
            },
          ],
        },
      },
    ],
  };

  const result = prepareLegacySource(value, fullMappings);
  const actions = result.source.scenarioList[0].data.tracks[0].actions;
  expect(actions[0].convertedDodge).toEqual({ direction: 'forward' });
  expect(actions[0].startTime).toBe(45);
  expect(actions[0].convertedSource).toBeUndefined();
  expect(result.unresolvedSkills).toHaveLength(1);
  expect(result.unresolvedSkills[0]?.path).toBe('dodge/0/1');
});

it('loads early identities, armory defaults, root constants and action connections', () => {
  const value = {
    version: '1.0.0',
    timeUnit: 'frame',
    fps: 60,
    systemConstants: { initialSp: 200, staggerBreakDuration: 600 },
    scenarioList: [
      {
        id: 'early',
        data: {
          systemConstants: { initialSp: 150 },
          tracks: [
            {
              id: 'PERLICA',
              weaponId: 'wpn_funnel_0004',
              equipArmorId: 'swordmancer-heavy-armor',
              equipArmorRefineTier: 2,
              actions: [
                { id: 'PERLICA_link', type: 'link', instanceId: 'a', startTime: 0 },
                { id: 'PERLICA_ultimate', type: 'ultimate', instanceId: 'b', startTime: 60 },
              ],
            },
          ],
          connections: [{ from: 'a', to: 'b' }],
        },
      },
    ],
  };
  const before = JSON.stringify(value);
  const result = prepareLegacySource(value, fullMappings);
  expect(result.issues).toEqual([]);
  const data = result.source.scenarioList[0].data;
  expect(data.systemConstants).toEqual({ initialSp: 150, staggerBreakDuration: 300 });
  expect(data.tracks[0].id).toBe('perlica');
  expect(data.tracks[0].actions[0].convertedSource.skillKey).toBe('chr_0004_pelica_combo_skill');
  expect(data.operators[0]).toMatchObject({
    level: 90,
    promoted: true,
    potential: 5,
    trustLevel: 4,
  });
  expect(data.weapons[0]).toMatchObject({
    weaponSlug: 'wpn_funnel_0004',
    skill1Level: 9,
    skill2Level: 9,
    skill3Level: 9,
  });
  expect(data.gears[0].artificingLevels).toEqual([2, 2, 2, 2]);
  expect(data.connections[0]).toMatchObject({ fromNodeType: 'action', toNodeType: 'action' });
  expect(JSON.stringify(value)).toBe(before);
});

it('切人标记的旧 gameId 与轨道 slug 共用身份解析，冲突和重复轨道仍报错', () => {
  const value = {
    version: '1.0.0',
    systemConstants: { initialSp: 200 },
    scenarioList: [
      {
        id: 'switch',
        data: {
          tracks: [
            { id: 'rossi', actions: [] },
            { id: 'perlica', actions: [] },
          ],
          switchEvents: [{ time: 0, characterId: 'ROSSI' }],
        },
      },
    ],
  };
  const before = structuredClone(value);
  const result = prepareLegacySource(value, fullMappings);
  expect(result.issues).toEqual([]);
  expect(result.source.scenarioList[0].data.switchEvents[0].trackIndex).toBe(0);
  expect(value).toEqual(before);
  const conflict = structuredClone(value);
  Object.assign(conflict.scenarioList[0]!.data.switchEvents[0]!, { trackIndex: 1 });
  expect(prepareLegacySource(conflict, fullMappings).issues).toContainEqual(
    expect.objectContaining({ message: '切入目标不唯一、不存在或与轨道下标冲突' }),
  );
  value.scenarioList[0]!.data.tracks[1]!.id = 'ROSSI';
  expect(prepareLegacySource(value, fullMappings).issues).toContainEqual(
    expect.objectContaining({ message: '切入目标不唯一、不存在或与轨道下标冲突' }),
  );
});

it('does not guess timestamp variants or overwrite an existing operator instance', () => {
  const result = prepareLegacySource(
    {
      version: '1.0.0',
      systemConstants: { initialSp: 200 },
      scenarioList: [
        {
          id: 'early',
          data: {
            operators: [{ id: 'kept', operatorSlug: 'PERLICA', level: 20 }],
            tracks: [
              {
                id: 'PERLICA',
                operatorInstanceId: 'kept',
                actions: [{ id: 'PERLICA_variant_v_123', type: 'link', startTime: 0 }],
              },
            ],
          },
        },
      ],
    },
    fullMappings,
  );
  expect(result.source.scenarioList[0].data.operators).toEqual([
    { id: 'kept', operatorSlug: 'perlica', level: 20 },
  ]);
  expect(result.unresolvedSkills).toHaveLength(1);
});
function input() {
  return {
    version: '1.0.0',
    timeUnit: 'frame',
    fps: 60,
    scenarioList: [
      {
        id: 's',
        data: {
          systemConstants: { staggerBreakDuration: 600 },
          battleDuration: 7200,
          tracks: [{ id: 'old', actions: [{ ...source, startTime: 623, logicalStartTime: 623 }] }],
          operators: [{ operatorSlug: 'old' }],
          weapons: [{ weaponSlug: 'oldWeapon' }],
          gears: [{ gearPieceId: 'oldGear' }],
        },
      },
    ],
  };
}
it('maps four identity categories and quantizes source frames without modifying input', () => {
  const value = input();
  const before = JSON.stringify(value);
  const result = prepareLegacySource(value, mappings);
  const d = result.source.scenarioList[0].data;
  expect(result.issues).toEqual([]);
  expect(d.tracks[0].id).toBe('perlica');
  expect(d.operators[0].operatorSlug).toBe('perlica');
  expect(d.tracks[0].actions[0].convertedSource).toEqual(target);
  expect(d.weapons[0].weaponSlug).toBe('wpn_sword_0022');
  expect(d.gears[0].gearPieceId).toBe('item_equip_example');
  expect(d.tracks[0].actions[0].startTime).toBe(312);
  expect(d.battleDuration).toBe(3600);
  expect(d.systemConstants.staggerBreakDuration).toBe(300);
  expect(JSON.stringify(value)).toBe(before);
});
it('keeps a declared skill-group sequence separate from ordinary skill sources', () => {
  const sequence = {
    kind: 'operatorSkillSequence',
    skillGroupKey: 'basicAttack',
    variantKey: 'enhancedBasicAttack',
  } as const;
  const result = prepareLegacySource(input(), {
    skills: { old: [{ source, target: sequence }] },
  });
  const action = result.source.scenarioList[0].data.tracks[0].actions[0];
  expect(result.issues).toEqual([]);
  expect(action.convertedSequence).toEqual(sequence);
  expect(action.convertedSource).toBeUndefined();
});
it('keeps a cross-group continuation as one declared legacy skill chain', () => {
  const sequence = {
    kind: 'operatorSkillSequence',
    skillGroupKey: 'battleSkill',
    continuations: [{ skillGroupKey: 'basicAttack', variantKey: 'enhancedBasicAttack' }],
  } as const;
  const result = prepareLegacySource(input(), {
    skills: { old: [{ source, target: sequence }] },
  });
  expect(result.issues).toEqual([]);
  expect(result.source.scenarioList[0].data.tracks[0].actions[0].convertedSequence).toEqual(
    sequence,
  );
});
it('does not guess missing, duplicate, segmented or variant skill mappings', () => {
  expect(prepareLegacySource(input()).unresolvedSkills).toHaveLength(1);
  expect(
    prepareLegacySource(input(), {
      skills: {
        old: [
          { source, target },
          { source, target },
        ],
      },
    }).issues[0]?.message,
  ).toContain('不唯一');
  for (const field of [{ segmentIndex: 2 }, { variantKey: 'enhanced' }]) {
    const value = input();
    Object.assign(value.scenarioList[0]!.data.tracks[0]!.actions[0]!, field);
    expect(prepareLegacySource(value, mappings).unresolvedSkills).toHaveLength(1);
  }
});
it('supports audited per-action overrides and blocks nonempty unsupported user settings', () => {
  expect(prepareLegacySource(input(), { actions: { 's/0/0': target } }).unresolvedSkills).toEqual(
    [],
  );
  const value = input();
  Object.assign(value.scenarioList[0]!.data, { characterOverrides: { old: { hp: 1 } } });
  const result = prepareLegacySource(value, mappings);
  expect(result.issues).toEqual([]);
  expect(result.ignoredCustomizations[0]?.path).toContain('characterOverrides');
  expect(result.source.scenarioList[0].data.characterOverrides).toBeUndefined();
  expect(result.source.scenarioList[0].data.tracks[0].actions[0].convertedSource).toEqual(target);
});
it('ignores nested empty override containers left by the old editor', () => {
  const value = input();
  Object.assign(value.scenarioList[0]!.data, {
    characterOverrides: { old: { customBars: [] } },
    weaponOverrides: { old: {} },
  });

  expect(prepareLegacySource(value, mappings).issues).toEqual([]);
});
it('reports a missing system constants block instead of aborting conversion', () => {
  const value = input();
  Reflect.deleteProperty(value.scenarioList[0]!.data, 'systemConstants');

  const result = prepareLegacySource(value, mappings);

  expect(result.issues).toContainEqual({
    path: 'scenarioList[0].data.systemConstants',
    message: '缺少旧战斗常量，不能完整还原该方案',
  });
});
it('accepts unambiguous skill-block connections and rejects derived endpoints', () => {
  const value = input();
  const first = value.scenarioList[0]!.data.tracks[0]!.actions[0]!;
  Object.assign(first, { instanceId: 'cast-a' });
  value.scenarioList[0]!.data.tracks[0]!.actions.push({
    ...first,
    startTime: 700,
    logicalStartTime: 700,
  });
  Object.assign(value.scenarioList[0]!.data.tracks[0]!.actions[1]!, {
    instanceId: 'cast-b',
  });
  const connections = [
    {
      id: 'connection',
      fromNodeType: 'action',
      toNodeType: 'action',
      fromNodeId: 'cast-a',
      toNodeId: 'cast-b',
      sourcePort: 'right',
      targetPort: 'left',
    },
  ];
  Object.assign(value.scenarioList[0]!.data, {
    connections,
  });
  expect(prepareLegacySource(value, mappings).issues).toEqual([]);

  connections[0]!.toNodeType = 'hit';
  const invalid = prepareLegacySource(value, mappings);
  expect(invalid.issues[0]?.message).toContain('Hit');
  expect(invalid.source.scenarioList[0].data.connections).toEqual([]);
  connections[0]!.toNodeType = 'action';
  Object.assign(value.scenarioList[0]!.data.tracks[0]!.actions[1]!, { instanceId: 'cast-a' });
  const ambiguous = prepareLegacySource(value, mappings);
  expect(ambiguous.issues[0]?.message).toContain('未唯一对应');
  expect(ambiguous.source.scenarioList[0].data.connections).toEqual([]);
});
it('rejects unknown time units and preserves differing authored/resolved times', () => {
  const value = input();
  value.fps = 0;
  expect(() => prepareLegacySource(value)).toThrow('fps');
  value.fps = 60;
  value.scenarioList[0]!.data.tracks[0]!.actions[0]!.logicalStartTime = 600;
  const result = prepareLegacySource(value, mappings);
  expect(result.issues).toEqual([]);
  expect(result.source.scenarioList[0].data.tracks[0].actions[0]).toMatchObject({
    startTime: 312,
    logicalStartTime: 300,
  });
});

it('rebases absolute times before rounding and leaves durations unchanged', () => {
  const value = input();
  Object.assign(value.scenarioList[0]!.data, {
    prepDuration: 299,
    simulationStartline: 299,
    simulationEndline: 4762,
    cycleBoundaries: [{ time: 600 }],
    switchEvents: [{ time: 298, trackIndex: 1 }],
  });
  const action = value.scenarioList[0]!.data.tracks[0]!.actions[0]!;
  action.startTime = action.logicalStartTime = 302;
  const result = prepareLegacySource(value, mappings);
  const d = result.source.scenarioList[0].data;
  expect(d.prepDuration).toBe(150);
  expect(d.battleDuration).toBe(3600);
  expect(d.systemConstants.staggerBreakDuration).toBe(300);
  expect(d.tracks[0].actions[0].startTime).toBe(2);
  expect(d.simulationStartline).toBe(0);
  expect(d.simulationEndline).toBe(2232);
  expect(d.cycleBoundaries[0].time).toBe(151);
  expect(d.switchEvents[0].time).toBe(-0);
  expect(result.times.find(t => t.path.endsWith('actions[0].startTime'))?.sourceOrigin).toBe(299);
});
