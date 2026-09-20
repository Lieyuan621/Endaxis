import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  CombatRuntimeAssembly,
  type CombatOperationExecutorContext,
  type EnemyBuffRuntime,
  type CombatRuntimeAssemblyOptions,
  type CombatRuntimeEnvironmentOptions,
  type CombatRuntimeScenarioOptions,
} from '../combat/runtime/combatRuntimeAssembly';
import type { CombatOperationExecutor } from '../combat/skills/skillRuntime';
import type { CompiledSkillProgram } from './combatProgram';
import type { OperatorDefinition, SkillDefinition } from '../game-data/operatorDefinition';
import { createEmptyScenario } from '../project/createProject';
import type { ScenarioDocument } from '../project/schema';
import { perlica } from '../../data/operators/perlica.generated';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import {
  compileOperatorEntityBlackboardInitialValues,
  compileScenarioRuntimeAssembly,
  type CompileScenarioRuntimeAssemblyOptions,
} from './compileScenarioRuntimeAssembly';

it('场景输入与环境端口互不重叠，完整装配选项由两者组成', () => {
  expectTypeOf<keyof CombatRuntimeScenarioOptions>().toEqualTypeOf<
    | 'resources'
    | 'enemy'
    | 'operators'
    | 'consumables'
    | 'consumableUses'
    | 'inputs'
    | 'skillInputGroups'
    | 'externalEvents'
    | 'dodgeInputs'
    | 'initialControlledOperatorId'
    | 'isOperatorControlled'
  >();
  expectTypeOf<
    keyof CombatRuntimeScenarioOptions & keyof CombatRuntimeEnvironmentOptions
  >().toEqualTypeOf<never>();
  expectTypeOf<keyof CombatRuntimeAssemblyOptions>().toEqualTypeOf<
    keyof CombatRuntimeScenarioOptions | keyof CombatRuntimeEnvironmentOptions
  >();
  expectTypeOf<
    CompileScenarioRuntimeAssemblyOptions['environment']
  >().toEqualTypeOf<CombatRuntimeEnvironmentOptions>();
});

function createScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario:assembly', '运行时装配样本');

  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 20 },
    skillCasts: [],
  };
  scenario.battle.resourceRules = {
    maxSp: 300,
    initialSp: 120,
    spRecoveryPerSecond: 10,
    defaultSkillSpCost: 100,
  };
  return scenario;
}

function enemyBuffRuntime(): EnemyBuffRuntime {
  return {
    ownerId: 'enemy',
    advanceFrame: () => undefined,
    getCountByIds: () => 0,
    findFirstByIds: () => undefined,
    finishByIds: () => 0,
    holdByIds: () => ({ release() {} }),
    getCountByTags: () => 0,
    matchesEntityTags: () => false,
    findFirstByTags: () => undefined,
    finishByTags: () => 0,
  };
}

function operationExecutor(): CombatOperationExecutor {
  return {
    execute: () => true,
    evaluate: () => true,
  };
}

function options(): CompileScenarioRuntimeAssemblyOptions {
  return {
    index: {
      getOperator: slug => (slug === perlica.slug ? perlica : null),
      getWeapon: () => null,
      getGear: () => null,
      getGearSet: () => null,
    },
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
    environment: {
      enemyBuffRuntime: enemyBuffRuntime(),
      createOperationExecutor: () => operationExecutor(),
      registerComboSkillCondition: () => ({ dispose: () => undefined }),
      comboConditionEligibility: { isAlive: () => true, isSilenced: () => false },
    },
  };
}

describe('compileScenarioRuntimeAssembly', () => {
  it('连续组进入正式装配，禁用原组头也只按该锚点启动准备期', () => {
    const scenario = createScenario();
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: -12,
      ids: {
        allocate: (() => {
          let next = 0;
          return () => `cast:${++next}`;
        })(),
      },
    }).scenario;
    const casts = placed.tracks[0]!.skillCasts;
    casts[0]!.presentation = { disabled: true };
    for (let index = 1; index < casts.length; index += 1)
      casts[index]!.placement = { afterCastId: casts[index - 1]!.id };
    const compiled = compileScenarioRuntimeAssembly(placed, options());
    expect(compiled.initialFrame).toBe(-12);
    expect(compiled.skillInputGroups).toEqual([
      { anchorCastId: casts[0]!.id, castIds: casts.slice(1).map(cast => cast.id) },
    ]);
    expect(compiled.inputs?.map(input => input.frame)).toEqual([-12, -12, -12]);
  });

  it('空轴也编译静态连携槽位、冷却和内部技能，但不执行定义动作或虚构施法', () => {
    const settings = options();
    const execute = vi.fn(() => true);
    const createOperationExecutor = vi.fn((): CombatOperationExecutor => ({
      execute,
      evaluate: () => true,
    }));
    const compiled = compileScenarioRuntimeAssembly(createScenario(), {
      ...settings,
      environment: { ...settings.environment, createOperationExecutor },
    });
    const operator = compiled.operators[0]!;
    expect(operator.skills).toEqual([]);
    expect(compiled.inputs).toEqual([]);
    expect(operator.skillSlotGroups).toContainEqual(
      expect.objectContaining({
        skillGroupKey: 'comboSkill',
        baseSkillKey: 'chr_0004_pelica_combo_skill',
        replacementSkillKeys: [],
      }),
    );
    const combo = operator.skillCooldownPrograms!.find(
      program => program.skillId === 'chr_0004_pelica_combo_skill',
    );
    expect(combo).toMatchObject({
      operatorId: 'track:0',
      skillType: 'comboSkill',
      skillGroupKey: 'comboSkill',
    });
    expect(combo?.cooldownFrames).toBeGreaterThan(0);
    expect(combo).not.toHaveProperty('castId');
    expect(combo).not.toHaveProperty('timelineActions');
    expect(combo).not.toHaveProperty('initialBlackboard');
    const assembly = new CombatRuntimeAssembly(compiled);
    assembly.advanceFrames(10);
    // 完整定义中的未放置技能会装配成内部路由目标，但静态目录本身不能触发动作。
    expect(createOperationExecutor).toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    expect(assembly.receipt.entries.some(entry => entry.event === 'SkillStarted')).toBe(false);
  });

  it('未放置的基础与替换冷却同样解析技能等级和潜能修正', () => {
    const settings = options();
    const scenario = createScenario();
    scenario.tracks[0]!.operator!.skillLevels.comboSkill = 2;
    scenario.tracks[0]!.operator!.potential = 1;
    const operator: OperatorDefinition = {
      ...perlica,
      potentials: [
        {
          levels: 1,
          modifiers: [{ kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -15 }],
        },
      ],
      skillSlots: perlica.skillSlots?.map(slot =>
        slot.key === 'comboSkill' ? { ...slot, replacementSkillKeys: ['replacement'] } : slot,
      ),
      skillGroups: perlica.skillGroups.map(group => {
        if (group.key !== 'comboSkill') return group;
        const base = group.skills as SkillDefinition;
        return {
          ...group,
          skills: { ...base, cooldownFrames: [60, 90] },
          replacementSkills: [{ ...base, key: 'replacement', cooldownFrames: [120, 180] }],
        };
      }),
    };
    const compiled = compileScenarioRuntimeAssembly(scenario, {
      ...settings,
      index: { ...settings.index, getOperator: () => operator },
    });
    expect(compiled.operators[0]!.skills).toEqual([]);
    expect(
      compiled.operators[0]!.skillCooldownPrograms!.filter(
        program => program.skillType === 'comboSkill',
      ).map(program => [program.skillId, program.cooldownFrames]),
    ).toEqual([
      ['chr_0004_pelica_combo_skill', 75],
      ['replacement', 165],
    ]);
    expect(compiled.operators[0]!.skillSlotGroups).toContainEqual(
      expect.objectContaining({
        skillGroupKey: 'comboSkill',
        baseSkillKey: 'chr_0004_pelica_combo_skill',
        replacementSkillKeys: ['replacement'],
      }),
    );
  });

  it('放置块自定义冷却不改模板目录，实际装配使用放置定义而非强制模板值', () => {
    const scenario = placeSkillGroup({
      scenario: createScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'comboSkill',
      startFrame: 10,
      ids: { allocate: kind => `${kind}:custom` },
    }).scenario;
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    const base = perlica.skillGroups.find(group => group.key === 'comboSkill')!
      .skills as SkillDefinition;
    cast.customDefinition = { ...base, cooldownFrames: 123 };
    const compiled = compileScenarioRuntimeAssembly(scenario, options());
    expect(compiled.operators[0]!.skillCasts![0]!.program.cooldownFrames).toBe(123);
    expect(
      compiled.operators[0]!.skillCooldownPrograms!.find(
        program => program.skillId === 'chr_0004_pelica_combo_skill',
      )!.cooldownFrames,
    ).not.toBe(123);
    expect(() => new CombatRuntimeAssembly(compiled)).not.toThrow();
  });
  it('shares installed template values across real skill starts but not across battles', () => {
    const settings = options();
    const observed: unknown[] = [];
    const make = () => {
      const compiled = compileScenarioRuntimeAssembly(createScenario(), {
        ...settings,
        index: {
          ...settings.index,
          getOperator: () => ({
            ...perlica,
            entityBlackboard: { EntityBB_type: 2, label: 'template' },
          }),
        },
      });
      const program: CompiledSkillProgram = {
        operatorId: 'track:0',
        skillGroupKey: 'battleSkill',
        skillId: 'probe',
        skillType: 'battleSkill',
        skillLevel: 1,
        initialBlackboard: { consumed_type: 5 },
        costs: [],
        timelineBlockFrames: 1,
        timelineActions: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'dealDamage',
                  parameters: { damageType: 'physical', attackScale: 1, tags: [] },
                },
                {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'EntityBB_type',
                    operation: 'assign',
                    value: { kind: 'constant', value: 3 },
                  },
                },
              ],
            },
          },
        ],
      };
      return new CombatRuntimeAssembly({
        ...compiled,
        inputs: [],
        operators: [{ ...compiled.operators[0]!, skills: [program] }],
        createOperationExecutor: () => ({
          evaluate: () => false,
          execute: (_step, context) => {
            observed.push([
              context!.blackboard.getNumber('EntityBB_type'),
              context!.blackboard.getNumber('consumed_type'),
              context!.blackboard.getString('label'),
            ]);
            return true;
          },
        }),
      });
    };
    const first = make();
    expect(first.tryStartSkill('track:0', 'probe')).toBe(true);
    first.advanceFrames(2);
    expect(first.tryStartSkill('track:0', 'probe')).toBe(true);
    expect(make().tryStartSkill('track:0', 'probe')).toBe(true);
    expect(observed).toEqual([
      [2, 5, 'template'],
      [3, 5, 'template'],
      [2, 5, 'template'],
    ]);
  });

  it('installs template literals before Deck writes without leaking them into skill direct values', () => {
    const scenario = createScenario();
    const settings = options();
    const operator = {
      ...perlica,
      entityBlackboard: { EntityBB_form: 7, EntityBB_type: 0, label: 'template' },
      entityBlackboardInitializers: [
        {
          key: 'EntityBB_form',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
          trueValue: 1,
          falseValue: 0,
        },
      ],
    } as const;
    const compiled = compileScenarioRuntimeAssembly(scenario, {
      ...settings,
      index: { ...settings.index, getOperator: () => operator },
    });
    expect(compiled.operators[0]!.initialEntityBlackboard).toMatchObject({
      EntityBB_form: 1,
      EntityBB_type: 0,
      label: 'template',
    });
    expect(() => new CombatRuntimeAssembly(compiled)).not.toThrow();
    expect(operator.entityBlackboard.EntityBB_form).toBe(7);
    for (const skill of [
      ...(compiled.operators[0]!.definitionSkillPrograms ?? []),
      ...(compiled.operators[0]!.skillCasts ?? []).map(binding => binding.program),
    ])
      expect(skill.initialBlackboard).not.toHaveProperty('EntityBB_type');
  });

  it.each<Record<string, number>>([
    { '': 0 },
    { level: 1 },
    { strength: 99 },
    { invalid: Infinity },
    { invalid: NaN },
  ])('rejects invalid or panel-reserved template values %j', entityBlackboard => {
    const panel = compileScenarioRuntimeAssembly(createScenario(), options()).operators[0]!.panel!;
    expect(() =>
      compileOperatorEntityBlackboardInitialValues({ ...perlica, entityBlackboard }, panel),
    ).toThrow('entityBlackboard');
  });

  it('derives entity blackboard values from final deck attributes, including equality', () => {
    const panel = compileScenarioRuntimeAssembly(createScenario(), options()).operators[0]!.panel!;
    const operator = {
      ...perlica,
      entityBlackboardInitializers: [
        {
          key: 'EntityBB_form',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
          trueValue: 1,
          falseValue: 0,
        },
      ],
    } as const;

    expect(
      compileOperatorEntityBlackboardInitialValues(operator, {
        ...panel,
        attributes: { ...panel.attributes, intellect: 20, will: 20 },
      }),
    ).toEqual({
      level: panel.level,
      maxHealth: panel.health,
      strength: panel.attributes.strength,
      agility: panel.attributes.agility,
      intellect: 20,
      will: 20,
      EntityBB_form: 1,
    });
    expect(
      compileOperatorEntityBlackboardInitialValues(operator, {
        ...panel,
        attributes: { ...panel.attributes, intellect: 19, will: 20 },
      }),
    ).toEqual({
      level: panel.level,
      maxHealth: panel.health,
      strength: panel.attributes.strength,
      agility: panel.attributes.agility,
      intellect: 19,
      will: 20,
      EntityBB_form: 0,
    });
  });

  it('compiles global modifiers into initialization Buffs without changing the build panel', () => {
    const scenario = createScenario();
    scenario.globalConfig.modifiers = [
      {
        id: 'global:critical-rate',
        kind: 'operatorStat',
        modifier: 'criticalRate',
        value: 0.2,
      },
      {
        id: 'global:combo-cooldown',
        kind: 'operatorStat',
        modifier: 'skillCooldownReduction',
        value: 0.25,
        skillType: 'comboSkill',
      },
    ];

    const compiled = compileScenarioRuntimeAssembly(scenario, options());
    expect(compiled.operators[0]!.panel).toMatchObject({
      criticalRate: 0.05,
      combatModifiers: [],
    });
    expect(
      compiled.operators[0]!.buffDefinitions?.['scenario:global-attribute-modifiers'],
    ).toMatchObject({
      presentation: { visible: false },
      attributeModifiers: [
        { attribute: 'criticalRate', slot: 'baseAddition', value: 0.2 },
        { attribute: 'ComboSkillCooldownScalar', slot: 'finalMultiplier', value: 0.75 },
      ],
    });
  });

  it('rejects duplicate entity blackboard initializer keys', () => {
    const panel = compileScenarioRuntimeAssembly(createScenario(), options()).operators[0]!.panel!;
    const initializer = {
      key: 'EntityBB_form',
      condition: {
        kind: 'deckAttributeCompare',
        left: 'intellect',
        operator: 'greaterOrEqual',
        right: 'will',
      },
      trueValue: 1,
      falseValue: 0,
    } as const;

    expect(() =>
      compileOperatorEntityBlackboardInitialValues(
        { ...perlica, entityBlackboardInitializers: [initializer, initializer] },
        panel,
      ),
    ).toThrow("duplicates entity blackboard initializer 'EntityBB_form'");
  });

  it('combines existing timeline and resource compilers into executable assembly options', () => {
    const settings = options();
    const compiled = compileScenarioRuntimeAssembly(createScenario(), settings);

    expect(compiled.resources.sp).toBe(120);
    expect(compiled.enemy).toMatchObject({
      source: { kind: 'custom', level: 90 },
      health: 100000,
      defenderAttributes: {
        defense: 100,
        breakingAttackDamageTakenMultiplier: 1,
      },
    });
    expect(compiled.resources.squad[0]).toMatchObject({
      operatorId: 'track:0',
      ultimateEnergy: 20,
      maxUltimateEnergy: 80,
    });
    expect(compiled.operators).toHaveLength(1);
    expect(compiled.operators[0]!.operatorId).toBe('track:0');
    expect(compiled.operators[0]!.panel).toMatchObject({
      operatorId: 'track:0',
      attack: 706,
      health: 5950,
      defense: 0,
    });
    expect(compiled.inputs).toEqual([]);
    expect(compiled.isOperatorControlled?.('track:0', 0)).toBe(true);
    expect(compiled.isOperatorControlled?.('track:0', 30)).toBe(true);
    expect(compiled.enemyBuffRuntime).toBe(settings.environment.enemyBuffRuntime);
    expect(compiled.createOperationExecutor).toBe(settings.environment.createOperationExecutor);
    expect(() => new CombatRuntimeAssembly(compiled)).not.toThrow();
  });

  it('derives the controlled operator from scenario switch events', () => {
    const scenario = createScenario();
    scenario.tracks[1] = {
      ...scenario.tracks[0]!,
      id: 'track:1',
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    scenario.battle.controlSwitches.push({ id: 'switch:1', frame: 30, trackIndex: 1 });

    const compiled = compileScenarioRuntimeAssembly(scenario, options());

    expect(compiled.isOperatorControlled?.('track:0', 29)).toBe(true);
    expect(compiled.isOperatorControlled?.('track:0', 30)).toBe(false);
    expect(compiled.isOperatorControlled?.('track:1', 30)).toBe(true);
  });

  it('starts at a preparation-frame control switch instead of applying it at frame zero', () => {
    const scenario = createScenario();
    scenario.battle.prepFrames = 150;
    scenario.tracks[1] = {
      ...scenario.tracks[0]!,
      id: 'track:1',
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    scenario.battle.controlSwitches.push({ id: 'switch:prep', frame: -90, trackIndex: 1 });

    const compiled = compileScenarioRuntimeAssembly(scenario, options());

    expect(compiled.initialFrame).toBe(-90);
    expect(compiled.initialControlledOperatorId).toBe('track:1');
    expect(compiled.isOperatorControlled?.('track:1', -90)).toBe(true);
  });

  it('compiles combo cooldown markers to stable operator instances in timeline order', () => {
    const scenario = createScenario();
    scenario.battle.externalEventMarkers = [
      {
        id: 'combo:late',
        frame: 60,
        target: { scope: 'team' },
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
      {
        id: 'combo:early',
        frame: 30,
        target: { scope: 'team' },
        event: { kind: 'comboCooldownControl', mode: 'cooldown' },
      },
      {
        id: 'combo:middle',
        frame: 45,
        target: { scope: 'team' },
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
    ];

    expect(compileScenarioRuntimeAssembly(scenario, options()).externalEvents).toEqual([
      {
        frame: 30,
        targetOperatorIds: ['track:0'],
        event: { kind: 'comboCooldownControl', mode: 'cooldown' },
      },
      {
        frame: 45,
        targetOperatorIds: ['track:0'],
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
      {
        frame: 60,
        targetOperatorIds: ['track:0'],
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
    ]);
  });

  it('rejects combo cooldown markers on empty operator tracks', () => {
    const scenario = createScenario();
    scenario.battle.externalEventMarkers = [
      {
        id: 'combo:empty',
        frame: 0,
        target: { scope: 'operator', trackIndex: 1 },
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
    ];

    expect(() => compileScenarioRuntimeAssembly(scenario, options())).toThrow(
      "external event marker 'combo:empty' references empty track 1",
    );
  });

  it('compiles dodge markers in frame, phase and declaration order', () => {
    const scenario = createScenario();
    scenario.battle.prepFrames = 30;
    scenario.battle.dodgeMarkers = [
      {
        id: 'perfect',
        frame: -10,
        trackIndex: 0,
        direction: 'backward',
        mode: { kind: 'perfectDodge', successDelayFrames: 5 },
      },
      {
        id: 'same-frame',
        frame: -5,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'dodge' },
      },
    ];

    const compiled = compileScenarioRuntimeAssembly(scenario, options());

    expect(compiled.initialFrame).toBe(-10);
    expect(compiled.dodgeInputs).toEqual([
      {
        kind: 'dash',
        frame: -10,
        dodgeId: 'perfect',
        operatorId: 'track:0',
        direction: 'backward',
      },
      {
        kind: 'dash',
        frame: -5,
        dodgeId: 'same-frame',
        operatorId: 'track:0',
        direction: 'forward',
      },
      {
        kind: 'perfectDodgeSuccess',
        frame: -5,
        dodgeId: 'perfect',
        operatorId: 'track:0',
      },
    ]);
  });

  it('rejects dodge markers on empty tracks', () => {
    const scenario = createScenario();
    scenario.battle.dodgeMarkers = [
      {
        id: 'empty',
        frame: 0,
        trackIndex: 1,
        direction: 'forward',
        mode: { kind: 'dodge' },
      },
    ];

    expect(() => compileScenarioRuntimeAssembly(scenario, options())).toThrow(
      "dodge marker 'empty' references empty track 1",
    );
  });

  it('delivers compiled equipment contributions to the runtime operation executor', () => {
    const scenario = createScenario();
    const weapon: WeaponDefinition = {
      slug: 'runtime-weapon',
      rarity: 6,
      weaponType: perlica.weaponType,
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        {
          key: 'main-attribute',
          levelCount: 1,
          modifiers: [{ kind: 'attribute', attribute: 'main', operation: 'flat', value: 12 }],
        },
      ],
    };

    scenario.tracks[0]!.weapon = {
      weaponSlug: weapon.slug,
      level: 90,
      tuned: true,
      potential: 0,
      traitLevels: [1],
    };
    // 执行器只在有技能实例时构造；放置一个技能让装备贡献能到达运行时装订层。
    let nextId = 0;
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 60,
      ids: { allocate: kind => `${kind}:${++nextId}` },
    }).scenario;
    const settings = options();
    const createOperationExecutor = vi.fn((_context: CombatOperationExecutorContext) =>
      operationExecutor(),
    );
    const compiled = compileScenarioRuntimeAssembly(placed, {
      ...settings,
      index: {
        ...settings.index,
        getWeapon: slug => (slug === weapon.slug ? weapon : null),
      },
      environment: { ...settings.environment, createOperationExecutor },
    });

    new CombatRuntimeAssembly(compiled);

    expect(compiled.operators[0]!.equipmentContributions).toHaveLength(1);
    expect(createOperationExecutor).toHaveBeenCalled();
    expect(createOperationExecutor.mock.calls[0]![0].enemy).toBe(compiled.enemy);
    expect(
      createOperationExecutor.mock.calls[0]![0].equipmentContributions[0]!.modifiers[0],
    ).toEqual({
      kind: 'attribute',
      attribute: perlica.mainAttribute,
      operation: 'flat',
      value: 12,
    });
    expect(createOperationExecutor.mock.calls[0]![0].panel).toBe(compiled.operators[0]!.panel);
  });

  it('does not require empty runtime binding records', () => {
    const settings = options();
    expect(() => compileScenarioRuntimeAssembly(createScenario(), settings)).not.toThrow();
  });

  it('merges active equipment Buff blueprints and frame-zero installation programs', () => {
    const scenario = createScenario();
    const makeGear = (slug: string, slotType: GearDefinition['slotType']): GearDefinition => ({
      slug,
      slotType,
      levelRequirement: 1,
      baseDefense: 0,
      gearSetSlug: 'runtime-set',
      traits: [],
    });
    const armor = makeGear('runtime-set-armor', 'armor');
    const gloves = makeGear('runtime-set-gloves', 'gloves');
    const accessory = makeGear('runtime-set-accessory', 'accessory');
    const gearSet: GearSetDefinition = {
      slug: 'runtime-set',
      buffDefinitions: { 'buff.runtime-set': { stackingType: 'unique' } },
      enableSequence: {
        steps: [
          { kind: 'changeResource', parameters: { resource: 'sp', amount: 2, recipient: 'team' } },
        ],
      },
      initializationSequence: {
        steps: [
          { kind: 'applyBuff', parameters: { buffId: 'buff.runtime-set', target: 'caster' } },
        ],
      },
    };
    scenario.tracks[0]!.gears = {
      armor: { gearSlug: armor.slug, artificingLevels: [] },
      gloves: { gearSlug: gloves.slug, artificingLevels: [] },
      accessory1: { gearSlug: accessory.slug, artificingLevels: [] },
      accessory2: null,
    };
    const settings = options();
    const gears = new Map([armor, gloves, accessory].map(entry => [entry.slug, entry]));

    const compiled = compileScenarioRuntimeAssembly(scenario, {
      ...settings,
      index: {
        ...settings.index,
        getGear: slug => gears.get(slug) ?? null,
        getGearSet: slug => (slug === gearSet.slug ? gearSet : null),
      },
    });

    expect(compiled.operators[0]!.buffDefinitions?.['buff.runtime-set']).toMatchObject({
      stackingType: 'unique',
    });
    expect(compiled.operators[0]!.initializationPrograms?.at(-1)).toMatchObject({
      key: 'gear-set:runtime-set',
      equipmentContributionIndex: compiled.operators[0]!.equipmentContributions!.length - 1,
      enableSequence: {
        steps: [
          { kind: 'changeResource', parameters: { resource: 'sp', amount: 2, recipient: 'team' } },
        ],
      },
      sequence: {
        steps: [{ kind: 'applyBuff', parameters: { buffId: 'buff.runtime-set' } }],
      },
    });
  });

  it('fails when runtime bindings reference an inactive operator', () => {
    const settings = options();

    expect(() =>
      compileScenarioRuntimeAssembly(createScenario(), {
        ...settings,
        operatorRuntimeBindings: new Map([
          ['track:0', {}],
          ['inactive', {}],
        ]),
      }),
    ).toThrow("runtime bindings reference inactive operator build 'inactive'");
  });

  it('propagates child compiler failures instead of supplying missing rules', () => {
    const settings = options();
    const getOperator = vi.fn(() => null);

    expect(() =>
      compileScenarioRuntimeAssembly(createScenario(), {
        ...settings,
        index: { ...settings.index, getOperator },
      }),
    ).toThrow(`operator definition '${perlica.slug}' does not exist`);
    expect(getOperator).toHaveBeenCalledWith(perlica.slug);

    const invalidInitialEnergy = createScenario();
    invalidInitialEnergy.tracks[0]!.initialState.ultimateEnergy = 81;
    expect(() => compileScenarioRuntimeAssembly(invalidInitialEnergy, settings)).toThrow(
      'scenario.tracks[0].initialState.ultimateEnergy exceeds its maximum',
    );
  });
});
