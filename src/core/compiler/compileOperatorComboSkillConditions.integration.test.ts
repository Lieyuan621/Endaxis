import { fixtureGameplayTagRegistry } from '../../../tools/game-data-compiler/test/gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { unityComboConditionFixture } from '../../../tools/game-data-compiler/test/unityComboConditionFixture.ts';
import { parseUnityComboSkillConditionsSource } from '../../../tools/game-data-compiler/src/source/unityComboSkillConditions.ts';
import { parseAbilitySystemBlackboardsSource } from '../../../tools/game-data-compiler/src/source/abilitySystemBlackboards.ts';
import { compileAbilitySystemBlackboardsSource } from '../../../tools/game-data-compiler/src/compiler/abilities/abilitySystemBlackboards.ts';
import { compileComboSkillConditionDefinitionSource } from '../../../tools/game-data-compiler/src/compiler/conditions/comboSkillConditions.ts';
import { perlica } from '../../data/operators/perlica.generated';
import { arcane } from '../../data/operators/arcane.generated';
import { parseSkillTargetSelectionHeaderSource } from '../../../tools/game-data-compiler/src/source/skillTargetSelection.ts';
import { compileSkillSmartTargetSource } from '../../../tools/game-data-compiler/src/compiler/conditions/comboSmartTarget.ts';
import { createGameDataRepository } from '../../data/gameDataRepository';
import { elementalAttachments } from '../../data/buffs/elementalAttachments';
import { skillSettings } from '../../data/combat/skillSettings';
import { commonBuffDefinitions } from '../../data/buffs/commonDefinitions';
import { timeDilationRuntimeConfig } from '../../data/combat/timeDilationConfig';
import { createEmptyProject } from '../project/createProject';
import {
  getProjectDefinitionLibrary,
  createProjectGameDataRepository,
} from '../project/projectDefinitionLibrary';
import { withProjectOperatorTemplate } from '../../test/projectOperatorTemplateFixture';
import { serializeProjectDocument, parseProjectDocument } from '../project/serialization';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import { validateComboSkillConditions } from '../game-data/validateComboSkillConditions';
import type { OperatorDefinition } from '../game-data/operatorDefinition';
import { compileScenarioRuntimeAssembly } from './compileScenarioRuntimeAssembly';
import { compileScenarioEnemy } from './compileScenarioEnemy';
import { StandardPlayerDamageEnvironment } from '../combat/runtime/standardPlayerDamageEnvironment';
import { createEnemyCombatVitals } from '../combat/resources/combatVitalsFactory';
import { CombatRuntimeAssembly } from '../combat/runtime/combatRuntimeAssembly';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators.ts';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { compileOperatorComboSkillConditions } from './compileOperatorComboSkillConditions';

it('连携条件使用自己的图，不从干员过渡图读取同名入口', () => {
  const condition: ComboSkillConditionDefinition = {
    key: 'native-combo',
    skillKey: 'chr_0004_pelica_combo_skill',
    event: 'addedBuff',
    immediately: false,
    initialValues: null,
    sequence: { $sequence: 'entry' },
    actionGraph: {
      main: {
        nodes: {
          entry: { action: { kind: 'dealStagger', parameters: { value: 7 } }, next: null },
        },
      },
      macros: {},
    },
  };
  const operator: OperatorDefinition = {
    ...perlica,
    comboSkillConditions: [condition],
  };
  const build = {
    operatorSlug: perlica.slug,
    level: 90,
    promoted: true,
    potential: 0,
    trustLevel: 4,
    talentStates: {},
    skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
  };
  const compiled = compileOperatorComboSkillConditions(operator, build, {
    programs: new ActionGraphDefinitionRepository(),
  });
  const entry = compiled[0]!.sequence;
  expect(entry.graph.nodes.get(entry.entry!)?.action).toMatchObject({
    kind: 'dealStagger',
    parameters: { value: 7 },
  });
});

function template(
  element: 'heat' | 'electric' | 'cryo' | 'nature',
  deckGate: number,
  actualCombo = false,
): OperatorDefinition {
  const carrier = actualCombo ? arcane : perlica;
  const pair = (key: string, valueDouble = 0) => ({
    key,
    valueDouble,
    valueStr: '',
    isDynamic: true,
  });
  // 已取证的最小黑板切片；仅 deckGate 按测试构筑取 0/1。其余技能/面板是测试载体，不冒充完整诀转换。
  const blackboards = compileAbilitySystemBlackboardsSource(
    parseAbilitySystemBlackboardsSource(
      {
        entityBlackboard: [
          pair('EntityBB_consumed_type'),
          pair('EntityBB_consumed_layer'),
          pair('EntityBB_ult_hit'),
          pair('EntityBB_wisd_greater_will', deckGate),
        ],
        skillDataBundle: {
          enableComboSkillBlackboard: true,
          comboSkillBlackboard: [pair('consumed_layer'), pair('consumed_type')],
        },
      },
      'fixture.abilitySystem',
    ),
  );
  const fixture = unityComboConditionFixture();
  const projections = parseUnityComboSkillConditionsSource(
    fixture.conditions,
    fixture.references,
    'fixture.combo',
  ).conditions.map((source, index) =>
    compileComboSkillConditionDefinitionSource(
      source,
      blackboards,
      {
        key: `condition:${index}`,
        skillKey: actualCombo ? 'chr_0032_lizhiyan_combo_skill' : 'chr_0004_pelica_combo_skill',
      },
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'eventTarget',
      },
    ),
  );
  const rawDefinitions: unknown = projections.map(result => result.definition);
  expect(validateComboSkillConditions(rawDefinitions)).toEqual([]);
  // 仅在公共严格结构校验后进入正式定义类型；不会将审计 source 一起塞进项目。
  const comboSkillConditions = projections.map(
    result => result.definition,
  ) as readonly ComboSkillConditionDefinition[];
  return {
    ...carrier,
    entityBlackboard: blackboards.entityInitialValues,
    // 两个构筑分支显式独立测试，不借载体面板恰好选择其中一侧。
    entityBlackboardInitializers: [],
    // 诀的常驻被动会按真实面板再次写入同一黑板值；此测试只验证原生连携条件链，需隔离该写入。
    passiveSkills: [],
    comboSkillConditions,
    // 只保留本次链路入口，避免将旧产物其他技能的编辑身份问题混入连携验证。
    skillGroups: carrier.skillGroups
      .filter(group => !actualCombo || group.key === 'battleSkill' || group.key === 'comboSkill')
      .map(group => {
        const skills = group.skills;
        if (Array.isArray(skills)) return group;
        const single = skills as Exclude<typeof skills, readonly unknown[]>;
        return group.key === 'comboSkill'
          ? {
              ...group,
              skills: {
                ...single,
                cooldownFrames: single.cooldownFrames ?? 300,
                // 诀真实 CastData.startCdFrame=0；补旧产物遗漏的静态元数据，不改它的动作。
                costFrame: 0,
                ...(actualCombo
                  ? compileSkillSmartTargetSource(
                      parseSkillTargetSelectionHeaderSource(
                        {
                          selectStrategy: 4,
                          smartTargetSelectStrategy: 1,
                          canDummyCast: true,
                          dummyPositionOffset: { x: 0, y: 0, z: 6 },
                        },
                        'chr_0032_lizhiyan_combo_skill',
                      ),
                    ).definition
                  : {}),
              },
            }
          : group.key !== 'battleSkill'
            ? group
            : {
                ...group,
                skills: {
                  ...single,
                  costs: [],
                  costFrame: undefined,
                  cooldownFrames: undefined,
                  timelineBlockFrames: 1,
                  scheduledSequences: [
                    { startFrame: 0, sequence: { $sequence: 'apply-infliction' } },
                  ],
                  actionGraph: {
                    main: {
                      nodes: {
                        'apply-infliction': {
                          action: {
                            kind: 'applyElementalInfliction',
                            parameters: { element, isExtra: false },
                          },
                          next: null,
                        },
                      },
                    },
                    macros: {},
                  },
                },
              };
      }),
  };
}

describe('原生条件经正式项目定义进入实际附着', () => {
  it.each(
    (['heat', 'electric', 'cryo', 'nature'] as const).flatMap(element =>
      [false, true].map(actualCombo => ({ element, actualCombo })),
    ),
  )(
    '$element 来源→模板持久化→场景→连续附着，实际诀连携=$actualCombo',
    ({ element, actualCombo }) => {
      for (const deckGate of [0, 1]) {
        const definition = template(element, deckGate, actualCombo);
        const carrier = actualCombo ? arcane : perlica;
        const base = createGameDataRepository({
          revision: 'fixture',
          operators: [carrier],
          commonDefinitionSources: [
            { id: 'fixture-buffs', buffDefinitions: commonBuffDefinitions },
          ],
        });
        const project = withProjectOperatorTemplate(
          createEmptyProject({ createdWith: 'test' }),
          'project:operator:native-combo',
          'native combo fixture',
          definition,
        );
        let scenario = project.scenarios[0]!;
        const persisted =
          getProjectDefinitionLibrary(project).operators['project:operator:native-combo']!
            .definition;
        scenario.tracks[0] = {
          id: 'owner',
          operator: {
            operatorSlug: persisted.slug,
            level: 90,
            promoted: true,
            potential: 0,
            trustLevel: 4,
            talentStates: {},
            skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          },
          weapon: null,
          gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
          initialState: {
            ultimateEnergy: 0,
            ...(actualCombo ? { maxUltimateEnergyOverride: 100 } : {}),
          },
          skillCasts: [],
        };
        let nextId = 0;
        for (const startFrame of [0, 2])
          scenario = placeSkillGroup({
            scenario,
            trackIndex: 0,
            operator: persisted,
            skillGroupKey: 'battleSkill',
            startFrame,
            ids: { allocate: kind => `${kind}:${++nextId}` },
          }).scenario;
        if (actualCombo)
          scenario = placeSkillGroup({
            scenario,
            trackIndex: 0,
            operator: persisted,
            skillGroupKey: 'comboSkill',
            startFrame: 4,
            ids: { allocate: kind => `${kind}:${++nextId}` },
          }).scenario;
        project.scenarios[0] = scenario;
        const loaded = parseProjectDocument(serializeProjectDocument(project));
        if (!loaded.ok) throw new Error(JSON.stringify(loaded));
        const restoredScenario = loaded.value.scenarios[0]!;
        const repository = createProjectGameDataRepository(
          base,
          getProjectDefinitionLibrary(loaded.value),
        );
        const restoredDefinition = repository.getOperator('project:operator:native-combo')!;
        expect(restoredDefinition.entityBlackboard?.EntityBB_wisd_greater_will).toBe(deckGate);
        expect(restoredDefinition.entityBlackboardInitializers).toEqual([]);
        const environment = new StandardPlayerDamageEnvironment({
          criticalSamples: { nextCriticalSample: () => 1 },
          resolveNonRandomRuntimeSnapshot: () => ({
            runtimeExtensionMultiplier: 1,
            appliesIgniteDamageMultiplier: false,
            appliesPhysicalInflictionDamageMultiplier: false,
          }),
          enemyVitals: createEnemyCombatVitals(compileScenarioEnemy(restoredScenario.enemy)),
          elementalInflictionDocument: elementalAttachments,
          spellInflictionSettings: skillSettings,
        });
        const pending: string[] = [];
        const compiled = compileScenarioRuntimeAssembly(restoredScenario, {
          index: repository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            ultimateEnergySystemUnlocked: true,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          },
          environment: {
            ...environment.runtimeOptions,
            timeDilation: {
              config: timeDilationRuntimeConfig,
            },
            onPendingComboCondition: (operatorId, program, value) => {
              expect(operatorId).toBe('owner');
              expect(value.assignPairs).toEqual({ consumed_layer: 0, consumed_type: 0 });
              expect(value.inputTarget).toEqual({ kind: 'operator', operatorId: 'owner' });
              expect(value.triggerTarget).toEqual({ kind: 'enemy' });
              pending.push(program.key);
            },
          },
        });
        expect(compiled.operators[0]!.initialEntityBlackboard?.EntityBB_wisd_greater_will).toBe(
          deckGate,
        );
        expect(compiled.operators[0]!.comboConditionPrograms).toHaveLength(5);
        expect(
          compiled.operators[0]!.skillCasts?.some(
            binding => binding.program.skillType === 'comboSkill',
          ) ?? false,
        ).toBe(actualCombo);
        const assembly = new CombatRuntimeAssembly(compiled);
        expect(pending).toEqual([
          ...(element === 'nature' ? ['condition:0'] : []),
          ...(deckGate === 0 ? ['condition:4'] : []),
        ]);
        pending.length = 0;
        assembly.advanceFrames(2);
        expect(pending).toEqual([
          `condition:${{ nature: 0, heat: 1, electric: 2, cryo: 3 }[element]}`,
          ...(deckGate === 0 ? ['condition:4'] : []),
        ]);
        expect(
          environment.runtimeOptions.createOperatorBuffRuntime!(
            'owner',
          )!.entityBlackboard!.getNumber('EntityBB_consumed_type'),
        ).toBe(deckGate === 0 ? { heat: 0, electric: 1, cryo: 2, nature: 3 }[element] : 0);
        if (actualCombo) {
          assembly.advanceFrames(600);
          expect(
            assembly.receipt.entries.some(entry => entry.event === 'ComboWindowConsumed'),
          ).toBe(true);
          expect(
            assembly.receipt.entries.some(entry => entry.event === 'ComboWindowUnavailableAtStart'),
          ).toBe(false);
          const extraInflictions = assembly.receipt.entries.filter(
            entry => entry.event === 'ElementalInflictionApplied' && entry.frame >= 4,
          );
          // 意志分支读取条件写入的真实元素；智识分支不执行这段附着。
          expect(extraInflictions.map(entry => entry.data?.requestedElement)).toEqual(
            deckGate === 0 ? [element] : [],
          );
          const damage = assembly.receipt.entries.filter(
            entry => entry.event === 'DamageApplied' && entry.data?.skillType === 'comboSkill',
          );
          expect(damage.length).toBeGreaterThanOrEqual(2);
          expect(damage.every(entry => Number(entry.data?.value ?? 0) > 0)).toBe(true);
        }
        assembly.disposeComboSkillConditions();
      }
    },
  );
});
