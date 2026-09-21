import { expect, it } from 'vitest';
import { convertLegacyTimeline, resolveLegacyRuntimeReplacementSkillKey } from './convert';
import { gameDataRepository } from '../../data/gameDataRepository';
import { parseProjectDocument } from '../../core/project/serialization';
import realAxisMappings from './mappings.json';
import type { ConversionMappings } from './sourcePreparation';

it('保留时间允许同轴重叠，智能修复则顺延，且不改变原始输入', () => {
  const input = fixture();
  const actions = input.scenarioList[0]!.data.tracks[0]!.actions;
  actions.push({ ...actions[0]!, startTime: 625, logicalStartTime: 625 });
  const original = structuredClone(input);
  const mappings: ConversionMappings = {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  };
  const preserved = convertLegacyTimeline(input, gameDataRepository, mappings, {
    timingMode: 'preserve',
  });
  const repaired = convertLegacyTimeline(input, gameDataRepository, mappings, {
    timingMode: 'repair',
  });
  expect(preserved.report.issues).toEqual([]);
  expect(preserved.report.timingMode).toBe('preserve');
  expect(preserved.report.timingAdjustments).toEqual([]);
  expect(
    preserved.project!.scenarios[0]!.tracks[0]!.skillCasts.map(c => c.placement.startFrame),
  ).toEqual([162, 163]);
  expect(repaired.report.timingAdjustments.length).toBeGreaterThan(0);
  expect(
    repaired.project!.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame,
  ).toBeGreaterThan(163);
  expect(input).toEqual(original);
});

it('展示连线未迁移单独报告，不视为模拟内容缺失', () => {
  const input = fixture();
  Object.assign(input.scenarioList[0]!.data, {
    connections: [
      {
        id: 'legacy-effect-connection',
        fromNodeType: 'effect',
        fromNodeId: 'old-effect',
        toNodeType: 'action',
        toNodeId: 'old-action',
      },
    ],
  });
  const mappings: ConversionMappings = {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  };
  const result = convertLegacyTimeline(input, gameDataRepository, mappings);
  expect(result.project).not.toBeNull();
  expect(result.report.simulationIssues).toEqual([]);
  expect(result.report.presentationIssues).toHaveLength(1);
  expect(result.report.presentationIssues[0]?.message).toContain('V3 不支持 Hit 或效果节点连线');
  expect(result.report.issues).toEqual(result.report.presentationIssues);
  expect(result.project!.scenarios[0]!.tracks[0]!.skillCasts).toHaveLength(1);
  expect(result.project!.scenarios[0]!.connections).toEqual([]);
});

it('把旧版空闪避块转换为同轨普通闪避标签，不生成技能块或极限闪避收益', () => {
  const input = fixture();
  const scenario = input.scenarioList[0]!;
  scenario.data.operators[0]!.operatorSlug = 'rossi';
  scenario.data.tracks[0]!.id = 'ROSSI';
  Object.assign(scenario.data.tracks[0]!, {
    actions: [
      {
        id: 'ROSSI_dodge',
        type: 'dodge',
        startTime: 660,
        logicalStartTime: 660,
        duration: 30,
      },
    ],
  });

  const result = convertLegacyTimeline(
    input,
    gameDataRepository,
    realAxisMappings as ConversionMappings,
    { timingMode: 'preserve' },
  );

  expect(result.report.issues).toEqual([]);
  expect(result.project!.scenarios[0]!.tracks[0]!.skillCasts).toEqual([]);
  expect(result.project!.scenarios[0]!.battle.dodgeMarkers).toEqual([
    {
      id: 'legacy:test-axis:track:0:dodge:0',
      frame: 180,
      trackIndex: 0,
      direction: 'forward',
      mode: { kind: 'dodge' },
    },
  ]);
});

it('只把技能槽基础技能解析为同组声明的替换形态', () => {
  const laevatain = gameDataRepository.getOperator('laevatain')!;
  expect(
    resolveLegacyRuntimeReplacementSkillKey(
      laevatain,
      'battleSkill',
      'chr_0016_laevat_normal_skill',
      'chr_0016_laevat_normal_skill_during_ult',
    ),
  ).toBe('chr_0016_laevat_normal_skill_during_ult');
  expect(
    resolveLegacyRuntimeReplacementSkillKey(
      laevatain,
      'battleSkill',
      'chr_0016_laevat_normal_skill_during_ult',
      'chr_0016_laevat_normal_skill',
    ),
  ).toBeNull();
  expect(
    resolveLegacyRuntimeReplacementSkillKey(
      laevatain,
      'basicAttack',
      'chr_0016_laevat_attack1',
      'chr_0016_laevat_ult_attack1',
    ),
  ).toBeNull();
  expect(
    resolveLegacyRuntimeReplacementSkillKey(
      laevatain,
      'battleSkill',
      'chr_0016_laevat_normal_skill',
      'missingReplacement',
    ),
  ).toBeNull();
});

it('按当前递归输入路由把旧单块展开为稳定技能序列', { timeout: 15_000 }, () => {
  const input = fixture();
  const scenario = input.scenarioList[0]!;
  scenario.data.initialGaugeMode = 'stored';
  scenario.data.operators[0]!.operatorSlug = 'old-yvonne';
  scenario.data.tracks[0]!.id = 'old-yvonne';
  scenario.data.tracks[0]!.initialGauge = 220;
  Object.assign(scenario.data.tracks[0]!, {
    actions: [
      {
        skillId: 'ultimate',
        sourceSkillKey: 'ultimate',
        type: 'ultimate',
        startTime: 300,
        logicalStartTime: 300,
      },
      {
        skillId: 'enhancedBasicAttack',
        sourceSkillKey: 'enhancedBasicAttack',
        type: 'basicAttack',
        segmentIndex: 1,
        startTime: 450,
        logicalStartTime: 450,
      },
    ],
  });
  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-yvonne': 'yvonne' },
    skills: {
      'old-yvonne': [
        {
          source: { skillId: 'ultimate', sourceSkillKey: 'ultimate', type: 'ultimate' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'ultimate',
            skillKey: 'chr_0017_yvonne_ultimate_skill',
          },
        },
        {
          source: {
            skillId: 'enhancedBasicAttack',
            sourceSkillKey: 'enhancedBasicAttack',
            type: 'basicAttack',
            segmentIndex: 1,
          },
          target: {
            kind: 'operatorSkillSequence',
            skillGroupKey: 'basicAttack',
            variantKey: 'enhancedBasicAttack',
          },
        },
      ],
    },
  });
  expect(result.report.issues).toEqual([]);
  expect(result.report.sequenceExpansions).toHaveLength(1);
  const casts = result.project!.scenarios[0]!.tracks[0]!.skillCasts;
  const sequence = casts.filter(cast => cast.id.includes(':cast:1'));
  expect(sequence.length).toBeGreaterThan(6);
  expect(sequence[0]!.id).toBe('legacy:test-axis:track:0:cast:1');
  expect(sequence.at(-1)!.source).toMatchObject({ skillKey: 'chr_0017_yvonne_ult_attack_end' });
  expect(new Set(sequence.map(cast => cast.id)).size).toBe(sequence.length);
});

it('把旧版提弗洛斯战技块展开为战技和完整强化普攻链', { timeout: 15_000 }, () => {
  const input = fixture();
  const scenario = input.scenarioList[0]!;
  scenario.data.operators[0]!.operatorSlug = 'typhoeus';
  scenario.data.tracks[0]!.id = 'typhoeus';
  const result = convertLegacyTimeline(
    input,
    gameDataRepository,
    realAxisMappings as ConversionMappings,
  );

  expect(result.report.issues).toEqual([]);
  const casts = result.project!.scenarios[0]!.tracks[0]!.skillCasts;
  expect(casts.map(cast => cast.source)).toMatchObject([
    { skillGroupKey: 'battleSkill', skillKey: 'chr_0034_typhoea_normal_skill_floating_start' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack1' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack2' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack3' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack4' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack5' },
  ]);
  expect(
    casts.every(
      (cast, index) =>
        index === 0 || cast.placement.startFrame! > casts[index - 1]!.placement.startFrame!,
    ),
  ).toBe(true);
});

it('按真实旧轴段号把提弗洛斯战技链映射为战技和五段强化普攻', { timeout: 15_000 }, () => {
  const input = fixture();
  const scenario = input.scenarioList[0]!;
  scenario.data.operators[0]!.operatorSlug = 'typhoeus';
  scenario.data.tracks[0]!.id = 'typhoeus';
  scenario.data.tracks[0]!.actions = Array.from({ length: 6 }, (_, index) => ({
    skillId: 'battleSkill',
    sourceSkillKey: 'battleSkill',
    type: 'battleSkill',
    segmentIndex: index + 1,
    startTime: 300 + index * 120,
    logicalStartTime: 300 + index * 120,
  }));
  const result = convertLegacyTimeline(
    input,
    gameDataRepository,
    realAxisMappings as ConversionMappings,
  );

  expect(result.report.unresolvedSkills).toEqual([]);
  expect(
    result.project!.scenarios[0]!.tracks[0]!.skillCasts.map(cast => cast.source),
  ).toMatchObject([
    { skillGroupKey: 'battleSkill', skillKey: 'chr_0034_typhoea_normal_skill_floating_start' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack1' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack2' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack3' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack4' },
    { skillGroupKey: 'basicAttack', skillKey: 'chr_0034_typhoea_floating_attack5' },
  ]);
});

it('真实轴的末次诀终结技明确映射为秘仪，不自动替换其他终结技', { timeout: 15_000 }, () => {
  const input = fixture();
  const scenario = input.scenarioList[0]!;
  scenario.id = 'sc_zpm5ozw';
  scenario.data.operators[0]!.operatorSlug = 'arcane';
  scenario.data.tracks[0]!.id = 'arcane';
  scenario.data.tracks[0]!.actions = Array.from({ length: 48 }, (_, index) => ({
    skillId: 'ultimate',
    sourceSkillKey: 'ultimate',
    type: 'ultimate',
    startTime: 300 + index * 180,
    logicalStartTime: 300 + index * 180,
  }));
  const result = convertLegacyTimeline(
    input,
    gameDataRepository,
    realAxisMappings as ConversionMappings,
  );
  expect(result.report.issues).toEqual([]);
  const casts = result.project!.scenarios[0]!.tracks[0]!.skillCasts;
  expect(casts[39]!.source).toMatchObject({
    skillGroupKey: 'ultimate',
    skillKey: 'chr_0032_lizhiyan_ultimate_skill',
  });
  expect(casts[47]!.source).toMatchObject({
    skillGroupKey: 'ultimate',
    skillKey: 'chr_0032_lizhiyan_ultimate_skill2',
  });
});

it.each(['inst_e889ock', 'different-share-instance'])(
  '公开轴秘仪映射同时核对坐标和源实例：%s',
  instanceId => {
    const input = fixture();
    const scenario = input.scenarioList[0]!;
    scenario.id = 'default_sc';
    scenario.data.operators[0]!.operatorSlug = 'arcane';
    scenario.data.tracks[0]!.id = 'arcane';
    scenario.data.tracks[0]!.actions = Array.from({ length: 4 }, (_, index) => ({
      skillId: 'ultimate',
      sourceSkillKey: 'ultimate',
      type: 'ultimate',
      instanceId: index === 3 ? instanceId : 'other-' + index,
      startTime: 300 + index * 180,
      logicalStartTime: 300 + index * 180,
    }));
    const before = JSON.stringify(input);
    const result = convertLegacyTimeline(
      input,
      gameDataRepository,
      realAxisMappings as ConversionMappings,
    );
    expect(result.report.issues).toEqual([]);
    expect(JSON.stringify(input)).toBe(before);
    const casts = result.project!.scenarios[0]!.tracks[0]!.skillCasts;
    expect(casts[2]!.source).toMatchObject({ skillKey: 'chr_0032_lizhiyan_ultimate_skill' });
    expect(casts[3]!.source).toMatchObject({
      skillKey:
        instanceId === 'inst_e889ock'
          ? 'chr_0032_lizhiyan_ultimate_skill2'
          : 'chr_0032_lizhiyan_ultimate_skill',
    });
  },
);

function fixture() {
  return {
    version: '1.0.0',
    timeUnit: 'frame',
    fps: 60,
    scenarioList: [
      {
        id: 'test-axis',
        name: '转换测试',
        data: {
          operators: [
            {
              id: 'op',
              operatorSlug: 'old-perlica',
              level: 90,
              promoted: true,
              potential: 0,
              trustLevel: 4,
              skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
              talentStates: { 0: 2, 1: 1 },
            },
          ],
          weapons: [],
          gears: [],
          initialGaugeMode: 'empty',
          prepDuration: 300,
          battleDuration: 7200,
          systemConstants: {
            maxSp: 300,
            initialSp: 300,
            spRegenRate: 8,
            skillSpCostDefault: 100,
            enemyHp: 100000,
            def: 100,
            superArmor: 0,
            finisherMultiplier: 1,
            maxStagger: 300,
            staggerNodeCount: 1,
            staggerNodeDuration: 120,
            staggerBreakDuration: 600,
            executionRecovery: 100,
            resistance: {},
          },
          tracks: [
            {
              id: 'old-perlica',
              operatorInstanceId: 'op',
              initialGauge: 0,
              actions: [
                {
                  skillId: 'battleSkill',
                  sourceSkillKey: 'battleSkill',
                  type: 'battleSkill',
                  startTime: 623,
                  logicalStartTime: 623,
                },
              ],
            },
          ],
        },
      },
    ],
  };
}
it('keeps old empty track placeholders without treating them as unresolved operators', () => {
  const input = fixture();
  input.scenarioList[0]!.data.tracks.push(
    ...([
      { id: null, operatorInstanceId: null, initialGauge: 0, actions: [] },
      { id: null, operatorInstanceId: null, initialGauge: 0, actions: [] },
      { id: null, operatorInstanceId: null, initialGauge: 0, actions: [] },
    ] as never[]),
  );

  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  });

  expect(result.status).toBe('converted');
  expect(result.report.issues).toEqual([]);
  expect(result.project?.scenarios[0]?.tracks.slice(1)).toEqual([null, null, null]);
});
it('produces a current reloadable document only after explicit skill mapping and validation', () => {
  const result = convertLegacyTimeline(fixture(), gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  });
  expect(result.report.issues).toEqual([]);
  expect(result.status).toBe('converted');
  expect(result.project?.scenarios[0]?.tracks[0]?.skillCasts[0]?.placement.startFrame).toBe(162);
  expect(parseProjectDocument(JSON.stringify(result.project), { gameDataRepository }).ok).toBe(
    true,
  );
});
it('clamps an excessive stored gauge to the current native maximum before retiming', () => {
  const input = fixture();
  input.scenarioList[0]!.data.initialGaugeMode = 'custom';
  input.scenarioList[0]!.data.tracks[0]!.initialGauge = 999;

  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  });

  expect(result.status).toBe('converted');
  expect(result.project?.scenarios[0]?.tracks[0]?.initialState.ultimateEnergy).toBe(80);
  expect(result.report.issues).toEqual([]);
  expect(result.report.resourceAdjustments).toContainEqual({
    path: 'scenarioList[0].data.tracks[0].initialGauge',
    resource: 'ultimateEnergy',
    from: 999,
    to: 80,
    reason: 'clampedToCurrentNativeMaximum',
  });
});
it('retimes from simulated starts, same-track ends, and ultimate dilation', () => {
  const input = fixture();
  const data = input.scenarioList[0]!.data as any;
  data.operators.push({
    ...data.operators[0]!,
    id: 'op-2',
  });
  data.tracks[0]!.actions = [
    {
      skillId: 'ultimate',
      sourceSkillKey: 'ultimate',
      type: 'ultimate',
      startTime: 600,
      logicalStartTime: 600,
      duration: 60,
    },
    {
      skillId: 'ultimate',
      sourceSkillKey: 'ultimate',
      type: 'ultimate',
      startTime: 660,
      logicalStartTime: 660,
      duration: 60,
    },
  ];
  data.tracks.push({
    id: 'old-perlica',
    operatorInstanceId: 'op-2',
    initialGauge: 0,
    actions: [
      {
        skillId: 'battleSkill',
        sourceSkillKey: 'battleSkill',
        type: 'battleSkill',
        startTime: 680,
        logicalStartTime: 680,
        duration: 60,
      },
    ],
  });

  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'ultimate', sourceSkillKey: 'ultimate', type: 'ultimate' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'ultimate',
            skillKey: 'chr_0004_pelica_ultimate_skill',
          },
        },
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  });

  expect(result.report.issues).toEqual([]);
  expect(
    result.project?.scenarios[0]?.tracks[0]?.skillCasts.map(cast => cast.placement.startFrame),
  ).toEqual([150, 237]);
  expect(result.project?.scenarios[0]?.tracks[1]?.skillCasts[0]?.placement.startFrame).toBe(288);
  expect(result.report.timingAdjustments).toEqual([
    expect.objectContaining({
      trackIndex: 0,
      actionIndex: 1,
      sourceStartFrame: 180,
      adjustedStartFrame: 237,
      sameTrackEndCandidate: 237,
      globalOrderCandidate: 180,
      pushedByUltimateTimeDilation: false,
    }),
    expect.objectContaining({
      trackIndex: 1,
      actionIndex: 0,
      sourceStartFrame: 190,
      adjustedStartFrame: 288,
      globalOrderCandidate: 247,
      pushedByUltimateTimeDilation: true,
      ultimateTimeDilationEndFrame: 287,
    }),
  ]);
});
it('preserves validated action-to-action connections with migrated cast identities', () => {
  const input = fixture();
  const first = input.scenarioList[0]!.data.tracks[0]!.actions[0]!;
  Object.assign(first, { instanceId: 'old-cast-a' });
  input.scenarioList[0]!.data.tracks[0]!.actions.push({
    ...first,
    startTime: 700,
    logicalStartTime: 700,
  });
  Object.assign(input.scenarioList[0]!.data.tracks[0]!.actions[1]!, {
    instanceId: 'old-cast-b',
  });
  Object.assign(input.scenarioList[0]!.data, {
    connections: [
      {
        id: 'legacy-connection',
        fromNodeType: 'action',
        toNodeType: 'action',
        fromNodeId: 'old-cast-a',
        toNodeId: 'old-cast-b',
        sourcePort: 'right',
        targetPort: 'left',
      },
    ],
  });
  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  });

  expect(result.report.issues).toEqual([]);
  expect(result.project?.scenarios[0]?.connections).toEqual([
    {
      id: 'legacy-connection',
      consumption: false,
      from: {
        kind: 'skillCast',
        skillCastId: 'legacy:test-axis:track:0:cast:0',
        port: 'right',
      },
      to: {
        kind: 'skillCast',
        skillCastId: 'legacy:test-axis:track:0:cast:1',
        port: 'left',
      },
    },
  ]);
});
it('preserves the stored full ultimate energy without recompiling conditional talents', () => {
  const input = fixture();
  const data = input.scenarioList[0]!.data;
  data.initialGaugeMode = 'full';
  data.operators[0]!.operatorSlug = 'arcane';
  data.operators[0]!.talentStates = { 0: 1, 1: 1 };
  data.tracks[0]!.id = 'arcane';
  data.tracks[0]!.initialGauge = 100;
  data.tracks[0]!.actions = [];

  const result = convertLegacyTimeline(input, gameDataRepository);

  expect(result.status).toBe('converted');
  expect(result.report.issues).toEqual([]);
  expect(result.project?.scenarios[0]?.tracks[0]?.initialState.ultimateEnergy).toBe(100);
});
it('reports the clamp when stored initial energy exceeds the compiled maximum', () => {
  const input = fixture();
  const data = input.scenarioList[0]!.data;
  data.initialGaugeMode = 'custom';
  data.tracks[0]!.initialGauge = 101;
  data.tracks[0]!.actions = [];

  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
  });

  expect(result.status).toBe('converted');
  expect(result.project?.scenarios[0]?.tracks[0]?.initialState.ultimateEnergy).toBe(80);
  expect(result.report.issues).toEqual([]);
  expect(result.report.resourceAdjustments).toContainEqual({
    path: 'scenarioList[0].data.tracks[0].initialGauge',
    resource: 'ultimateEnergy',
    from: 101,
    to: 80,
    reason: 'clampedToCurrentNativeMaximum',
  });
});
it('uses an explicit legacy gauge maximum before deciding whether to clamp', () => {
  const input = fixture();
  const data = input.scenarioList[0]!.data;
  data.initialGaugeMode = 'custom';
  data.tracks[0]!.initialGauge = 101;
  (data.tracks[0]! as { maxGaugeOverride?: number }).maxGaugeOverride = 120;
  data.tracks[0]!.actions = [];

  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
  });

  expect(result.status).toBe('converted');
  expect(result.report.resourceAdjustments).toEqual([]);
  expect(result.project?.scenarios[0]?.tracks[0]?.initialState).toEqual({
    ultimateEnergy: 101,
    maxUltimateEnergyOverride: 120,
  });
});
it('omits an unmapped skill and still publishes the rest of the project', () => {
  const result = convertLegacyTimeline(fixture(), gameDataRepository);
  expect(result.status).toBe('converted-with-issues');
  expect(result.project?.scenarios[0]?.tracks[0]).toBeNull();
  expect(result.report.unresolvedSkills).toHaveLength(1);
});

it('reports a connected omitted skill instead of aborting conversion', () => {
  const input = fixture();
  const action = input.scenarioList[0]!.data.tracks[0]!.actions[0]!;
  Object.assign(action, { instanceId: 'unmapped-cast' });
  Object.assign(input.scenarioList[0]!.data, {
    connections: [
      {
        id: 'unmapped-connection',
        fromNodeType: 'action',
        toNodeType: 'action',
        fromNodeId: 'unmapped-cast',
        toNodeId: 'unmapped-cast',
      },
    ],
  });

  const result = convertLegacyTimeline(input, gameDataRepository);

  expect(result.status).toBe('converted-with-issues');
  expect(result.project).not.toBeNull();
  expect(result.report.issues).toContainEqual({
    path: '',
    message: 'test-axis: connection 1 refers to an omitted skill block',
  });
});

it('converts old characterId switch markers to the original track index before slug mapping', () => {
  const input = fixture();
  Object.assign(input.scenarioList[0]!.data, {
    switchEvents: [{ id: 'switch', time: 360, characterId: 'old-perlica' }],
  });
  input.scenarioList[0]!.data.tracks[0]!.actions = [];
  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
  });
  expect(result.report.issues).toEqual([]);
  expect(result.project?.scenarios[0]?.battle.controlSwitches).toEqual([
    { id: 'switch', frame: 30, trackIndex: 0 },
  ]);
});

it('reports and omits unresolved control targets without discarding the project', () => {
  const input = fixture();
  Object.assign(input.scenarioList[0]!.data, {
    switchEvents: [{ id: 'missing-switch', time: 240, characterId: 'unknown-track' }],
  });
  input.scenarioList[0]!.data.tracks[0]!.actions = [];
  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
  });
  expect(result.status).toBe('converted-with-issues');
  expect(result.project?.scenarios[0]?.battle.controlSwitches).toEqual([]);
  expect(result.report.issues.length).toBeGreaterThan(0);
});

it('reports and omits a switch whose explicit track conflicts with its character', () => {
  const input = fixture();
  Object.assign(input.scenarioList[0]!.data, {
    switchEvents: [{ id: 'switch', time: 360, characterId: 'old-perlica', trackIndex: 1 }],
  });
  input.scenarioList[0]!.data.tracks[0]!.actions = [];
  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
  });
  expect(result.status).toBe('converted-with-issues');
  expect(result.project?.scenarios[0]?.battle.controlSwitches).toEqual([]);
  expect(result.report.issues.length).toBeGreaterThan(0);
});

it('preserves the active scenario and falls back only for an invalid reference', () => {
  const first = fixture();
  const second = structuredClone(first.scenarioList[0]!);
  second.id = 'second-axis';
  const input = {
    ...first,
    scenarioList: [...first.scenarioList, second],
    activeScenarioId: second.id,
  };
  const mappings = {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill' as const,
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  };
  const converted = convertLegacyTimeline(input, gameDataRepository, mappings);
  expect(converted.report.issues).toEqual([]);
  expect(converted.project?.activeScenarioId).toBe(second.id);
  input.activeScenarioId = 'missing';
  expect(convertLegacyTimeline(input, gameDataRepository, mappings).project?.activeScenarioId).toBe(
    first.scenarioList[0]!.id,
  );
});

it('omits a malformed scenario while preserving other scenarios from the same file', () => {
  const input = fixture();
  const malformed = structuredClone(input.scenarioList[0]!);
  malformed.id = 'broken-axis';
  Object.assign(malformed.data.tracks[0]!, { actions: null });
  input.scenarioList.push(malformed);
  const result = convertLegacyTimeline(input, gameDataRepository, {
    operators: { 'old-perlica': 'perlica' },
    skills: {
      'old-perlica': [
        {
          source: { skillId: 'battleSkill', sourceSkillKey: 'battleSkill', type: 'battleSkill' },
          target: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
          },
        },
      ],
    },
  });
  expect(result.status).toBe('converted-with-issues');
  expect(result.project?.scenarios.map(scenario => scenario.id)).toEqual(['test-axis']);
  expect(result.report.issues).toContainEqual({
    path: 'scenarioList[1]',
    message: '轨道缺少 actions 数组',
  });
});

it('preserves enemy identity and falls back to a custom enemy when the identity is unresolved', () => {
  const input = fixture();
  const data = input.scenarioList[0]!.data;
  data.tracks = [];
  Object.assign(data, { activeEnemyId: 'eny_0071_sandb', activeEnemyLevel: 90 });
  const blocked = convertLegacyTimeline(input, gameDataRepository);
  expect(blocked.status).toBe('converted-with-issues');
  expect(blocked.project?.scenarios[0]?.enemy.source.kind).toBe('custom');
  expect(blocked.report.issues.some(issue => issue.message.includes('enemy'))).toBe(true);
  const mapped = convertLegacyTimeline(input, gameDataRepository, {
    enemies: { eny_0071_sandb: 'eny-0071-sandb' },
  });
  expect(mapped.report.issues).toEqual([]);
  expect(mapped.project?.scenarios[0]?.enemy).toMatchObject({
    source: { kind: 'prefab', enemyId: 'eny-0071-sandb', level: 90 },
    rank: 'elite',
    editable: { hp: 100000, defense: 100, superArmor: 0, finisherMultiplier: 1 },
  });
});
