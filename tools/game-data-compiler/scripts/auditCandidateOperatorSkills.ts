import fs from 'node:fs/promises';
import { OPERATOR_DEFINITION_OUTPUTS } from './operatorDefinitionOutputs.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCandidateRuntimeServer } from '../src/compiler/publication/candidateRuntimeServer.ts';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');
const REPLACEMENT_PATHS = [
  ...OPERATOR_DEFINITION_OUTPUTS,
  'src/data/buffs/generated',
  'src/data/combat/gameplayTagCatalog.generated.ts',
  'src/data/combat/gameplayTagPredefine.generated.ts',
  'src/data/combat/hitStopCurveCatalog.generated.ts',
  'src/data/combat/timeDilationCatalog.generated.ts',
  'src/data/combat/skillSettings.generated.ts',
] as const;

interface AuditArguments {
  readonly candidateRoot: string;
  readonly potential: number;
  readonly endFrame: number;
  readonly maxOperatorSourceBytes?: number;
}

const DEFAULT_MAX_OPERATOR_SOURCE_BYTES = 1024 * 1024;

interface RuntimeOperator {
  readonly slug: string;
  readonly talents: readonly unknown[];
  readonly skillGroups: readonly RuntimeSkillGroup[];
}

interface RuntimeSkillGroup {
  readonly key: string;
  readonly levelSource: string;
  readonly skillType: string;
  readonly replacementSkillPlacements?: Readonly<Record<string, string>>;
}

interface RuntimeSkillBinding {
  readonly group: {
    readonly key: string;
    readonly replacementSkillPlacements?: Readonly<Record<string, string>>;
  };
  readonly skill: { readonly key: string };
  readonly variant?: { readonly key: string };
}

interface RuntimeSkillCase {
  readonly operator: RuntimeOperator;
  readonly groupKey: string;
  readonly variantKey?: string;
  readonly skill: { readonly key: string };
}

interface RuntimeLibraryPlacement {
  readonly entryKey: string;
  readonly variantKey?: string;
  readonly placementSkillKey?: string;
  readonly skills: readonly { readonly key: string; readonly timelineBlockFrames: number }[];
}

interface RuntimeLibraryPlacementCase {
  readonly operator: RuntimeOperator;
  readonly groupKey: string;
  readonly placement: RuntimeLibraryPlacement;
}

type RuntimeScenario = Record<string, any>;
type RuntimePlaceSkillGroup = (input: Record<string, any>) => {
  readonly scenario: RuntimeScenario;
};

/**
 * 在候选覆盖视图里加载整批干员并逐个放置技能。候选仍位于 tmp，正式生成目录不发生写入；
 * 运行对象也保持 TypeScript 模块语义，不经 JSON 序列化破坏 Infinity 等数值。
 */
export async function auditCandidateOperatorSkills(args: AuditArguments) {
  const candidateRoot = await fs.realpath(path.resolve(args.candidateRoot));
  const operatorFiles = OPERATOR_DEFINITION_OUTPUTS.map(file => path.join(candidateRoot, file));
  if (operatorFiles.length === 0) throw new Error('candidate contains no generated operators');
  const maxOperatorSourceBytes = args.maxOperatorSourceBytes ?? DEFAULT_MAX_OPERATOR_SOURCE_BYTES;
  const operatorSourceSizes = await Promise.all(
    operatorFiles.map(async file => ({
      file: path.relative(candidateRoot, file).split(path.sep).join('/'),
      bytes: (await fs.stat(file)).size,
    })),
  );
  const oversizedOperatorSources = operatorSourceSizes.filter(
    entry => entry.bytes > maxOperatorSourceBytes,
  );
  if (oversizedOperatorSources.length > 0) {
    throw new Error(
      `candidate operator source size exceeds ${maxOperatorSourceBytes} bytes:\n${oversizedOperatorSources
        .sort((left, right) => right.bytes - left.bytes)
        .map(entry => `${entry.file}: ${entry.bytes}`)
        .join('\n')}`,
    );
  }

  const server = await createCandidateRuntimeServer({
    projectRoot: PROJECT_ROOT,
    candidateRoot,
    replacementPaths: REPLACEMENT_PATHS,
  });
  try {
    const operators: RuntimeOperator[] = [];
    for (const file of operatorFiles.sort()) {
      const module = await server.ssrLoadModule(toViteFsId(file));
      // 具名与default导出可以指向同一个干员；不同对象仍必须拒绝。
      const definitions = [...new Set(Object.values(module).filter(isOperatorDefinition))];
      if (definitions.length !== 1) {
        throw new Error(
          `${path.relative(candidateRoot, file)} exports ${definitions.length} operator definitions`,
        );
      }
      assertNoGeneratedIdentityPlaceholders(definitions[0], path.relative(candidateRoot, file));
      operators.push(definitions[0]);
    }

    const repositoryModule = await server.ssrLoadModule('/src/data/gameDataRepository.ts');
    const formalRepository = repositoryModule.gameDataRepository;
    const commonBuffModule = await server.ssrLoadModule(
      toViteFsId(
        path.join(candidateRoot, 'src/data/buffs/generated/commonBuffDefinitions.generated.ts'),
      ),
    );
    const runtimeSkillSettings = await server.ssrLoadModule('/src/data/combat/skillSettings.ts');
    const repository = repositoryModule.createGameDataRepository({
      revision: 'candidate-operator-simulation-audit',
      commonDefinitionSources: [
        { id: 'common-buffs', buffDefinitions: commonBuffModule.commonBuffDefinitions },
      ],
      operators,
      enemies: formalRepository.getEnemies(),
    });
    const perlica = operators.find(operator => operator.slug === 'perlica');
    if (perlica === undefined) throw new Error('candidate does not contain perlica');

    const bindingsModule = await server.ssrLoadModule(
      '/src/core/game-data/operatorSkillDefinitions.ts',
    );
    const projectModule = await server.ssrLoadModule('/src/core/project/createProject.ts');
    const placementModule = await server.ssrLoadModule(
      '/src/ui/timeline/interaction/placeSkillGroup.ts',
    );
    const libraryPlacementModule = await server.ssrLoadModule(
      '/src/application/editor/skillGroupPlacement.ts',
    );
    const serviceModule = await server.ssrLoadModule(
      '/src/application/simulation/scenarioSimulationService.ts',
    );
    const attachmentModule = await server.ssrLoadModule('/src/data/buffs/elementalAttachments.ts');
    const cases: RuntimeSkillCase[] = operators.flatMap(operator =>
      (bindingsModule.listOperatorSkillDefinitionBindings(operator) as RuntimeSkillBinding[])
        .filter(
          ({ group, skill }: RuntimeSkillBinding) =>
            group.replacementSkillPlacements?.[skill.key] !== 'internal',
        )
        .map(({ group, skill, variant }: RuntimeSkillBinding) => ({
          operator,
          groupKey: group.key,
          variantKey: variant?.key,
          skill,
        })),
    );
    const identities = new Set(cases.map(skillIdentity));
    if (identities.size !== cases.length) throw new Error('candidate skill identity is not unique');
    const libraryPlacementCases: RuntimeLibraryPlacementCase[] = operators.flatMap(operator =>
      operator.skillGroups.flatMap(group =>
        (
          libraryPlacementModule.listSkillGroupLibraryPlacements(group) as RuntimeLibraryPlacement[]
        ).map(placement => ({ operator, groupKey: group.key, placement })),
      ),
    );
    const libraryPlacementIdentities = new Set(libraryPlacementCases.map(libraryPlacementIdentity));
    if (libraryPlacementIdentities.size !== libraryPlacementCases.length) {
      throw new Error('candidate library placement identity is not unique');
    }

    const nativeResources = runtimeSkillSettings.skillSettingResources;
    const service = new serviceModule.ScenarioSimulationService({
      index: repository,
      repositoryRevision: 'candidate-operator-simulation-audit',
      resources: {
        sharedSpGain: { baseGainEfficiency: nativeResources.atbGainEfficiency },
        spRecoveryPauseDuration: nativeResources.atbRecoverInterval,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: {
          selfGainPerSp: nativeResources.atbConsumedDefaultUspGainSelf,
          otherGainPerSp: nativeResources.atbConsumedDefaultUspGainOther,
        },
      },
      elementalInflictionDocument: attachmentModule.elementalAttachments,
      spellInflictionSettings: runtimeSkillSettings.skillSettings,
    });
    const failures = [];
    let maximumCompositeEndFrame = args.endFrame;
    for (const entry of cases) {
      const identity = skillIdentity(entry);
      try {
        const scenario = createAuditScenario(
          projectModule.createEmptyScenario(`audit:${identity}`, '候选技能运行门禁'),
          entry.operator,
          perlica,
          args.potential,
          args.endFrame,
        );
        const context = placeRequiredSkillContext(
          scenario,
          identity,
          entry.operator,
          placementModule.placeSkillGroup,
        );
        const placed = placementModule.placeSkillGroup({
          scenario: context.scenario,
          trackIndex: 0,
          operator: entry.operator,
          skillGroupKey: entry.groupKey,
          ...(entry.variantKey === undefined ? {} : { variantKey: entry.variantKey }),
          skillKey: entry.skill.key,
          startFrame: context.startFrame,
          ids: createScopedIdAllocator(identity),
        }).scenario;
        await service.simulate(placed, args.endFrame);
      } catch (error) {
        failures.push({
          identity,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }
    for (const entry of libraryPlacementCases) {
      const identity = libraryPlacementIdentity(entry);
      try {
        let scenario = createAuditScenario(
          projectModule.createEmptyScenario(`audit:${identity}`, '候选技能库组合轴门禁'),
          entry.operator,
          perlica,
          args.potential,
          args.endFrame,
        );
        const onlySkill =
          entry.placement.skills.length === 1 ? entry.placement.skills[0] : undefined;
        const context =
          onlySkill === undefined
            ? { scenario, startFrame: 1 }
            : placeRequiredSkillContext(
                scenario,
                `${entry.operator.slug}/${entry.groupKey}/${
                  entry.placement.variantKey ?? 'base'
                }/${onlySkill.key}`,
                entry.operator,
                placementModule.placeSkillGroup,
              );
        scenario = placementModule.placeSkillGroup({
          scenario: context.scenario,
          trackIndex: 0,
          operator: entry.operator,
          skillGroupKey: entry.groupKey,
          ...(entry.placement.variantKey === undefined
            ? {}
            : { variantKey: entry.placement.variantKey }),
          ...(entry.placement.placementSkillKey === undefined
            ? {}
            : { skillKey: entry.placement.placementSkillKey }),
          startFrame: context.startFrame,
          ids: createScopedIdAllocator(identity),
        }).scenario;
        await service.simulate(scenario, args.endFrame);
      } catch (error) {
        failures.push({
          identity,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }
    for (const operator of operators) {
      const entries = libraryPlacementCases.filter(entry => entry.operator === operator);
      const identity = `${operator.slug}/library-composite`;
      const placementFrames = entries.reduce(
        (total, entry) =>
          total +
          entry.placement.skills.reduce((sum, skill) => sum + skill.timelineBlockFrames, 0) +
          1,
        1,
      );
      const simulationEndFrame = Math.max(args.endFrame, placementFrames + 300);
      maximumCompositeEndFrame = Math.max(maximumCompositeEndFrame, simulationEndFrame);
      try {
        let scenario = createAuditScenario(
          projectModule.createEmptyScenario(`audit:${identity}`, '候选技能库跨卡片组合轴门禁'),
          operator,
          perlica,
          args.potential,
          simulationEndFrame,
        );
        let startFrame = 1;
        for (const entry of entries) {
          scenario = placementModule.placeSkillGroup({
            scenario,
            trackIndex: 0,
            operator,
            skillGroupKey: entry.groupKey,
            ...(entry.placement.variantKey === undefined
              ? {}
              : { variantKey: entry.placement.variantKey }),
            ...(entry.placement.placementSkillKey === undefined
              ? {}
              : { skillKey: entry.placement.placementSkillKey }),
            startFrame,
            ids: createScopedIdAllocator(`${identity}:${entry.placement.entryKey}`),
          }).scenario;
          startFrame +=
            entry.placement.skills.reduce((sum, skill) => sum + skill.timelineBlockFrames, 0) + 1;
        }
        await service.simulate(scenario, simulationEndFrame);
      } catch (error) {
        failures.push({
          identity,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }
    if (failures.length > 0) {
      throw new Error(
        `candidate simulation failed for ${failures.length}/${
          cases.length + libraryPlacementCases.length + operators.length
        } skill, library placement, or operator composite case(s):\n${failures
          .slice(0, 30)
          .map(
            failure =>
              `${failure.identity}: ${failure.message}${
                failure.stack === undefined ? '' : `\n${failure.stack}`
              }`,
          )
          .join('\n')}`,
      );
    }
    return {
      operatorCount: operators.length,
      placeableSkillCount: cases.length,
      libraryPlacementCount: libraryPlacementCases.length,
      multiSkillLibraryPlacementCount: libraryPlacementCases.filter(
        entry => entry.placement.skills.length > 1,
      ).length,
      operatorCompositeCount: operators.length,
      maximumCompositeEndFrame,
      operatorSourceBytes: operatorSourceSizes.reduce((sum, entry) => sum + entry.bytes, 0),
      largestOperatorSource: operatorSourceSizes.toSorted(
        (left, right) => right.bytes - left.bytes,
      )[0],
      maxOperatorSourceBytes,
      potential: args.potential,
      endFrame: args.endFrame,
    };
  } finally {
    await server.close();
  }
}

function createAuditScenario(
  scenario: RuntimeScenario,
  operator: RuntimeOperator,
  teammate: RuntimeOperator,
  potential: number,
  endFrame: number,
): RuntimeScenario {
  scenario.battle.durationFrames = endFrame;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.battle.resourceRules = {
    maxSp: 1000,
    initialSp: 1000,
    spRecoveryPerSecond: 100,
    defaultSkillSpCost: 100,
  };
  scenario.tracks[0] = createTrack(operator, potential, 1000);
  scenario.tracks[1] = createTrack(teammate, potential, 0, 'track:audit-teammate');
  return scenario;
}

function assertNoGeneratedIdentityPlaceholders(value: unknown, path: string): void {
  if (typeof value === 'string') {
    if (value.startsWith('\u0000endaxis-generated-identity:')) {
      throw new Error(`${path}: unresolved generated identity placeholder`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      assertNoGeneratedIdentityPlaceholders(child, `${path}[${index}]`),
    );
    return;
  }
  if (value === null || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assertNoGeneratedIdentityPlaceholders(child, `${path}.${key}`);
  }
}

function createTrack(
  operator: RuntimeOperator,
  potential: number,
  ultimateEnergy: number,
  id?: string,
) {
  return {
    id: id ?? `track:${operator.slug}`,
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: Object.fromEntries(operator.talents.map((_, index: number) => [index, 0])),
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy, maxUltimateEnergyOverride: 1000 },
    skillCasts: [],
  };
}

function placeRequiredSkillContext(
  scenario: RuntimeScenario,
  identity: string,
  operator: RuntimeOperator,
  placeSkillGroup: RuntimePlaceSkillGroup,
) {
  if (identity === 'yvonne/basicAttack/enhancedBasicAttack/ultimateAttackEnd') {
    return {
      scenario: placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator,
        skillGroupKey: 'ultimate',
        skillKey: 'ultimate',
        startFrame: 1,
        ids: {
          allocate: (kind: string) => `${kind}:yvonne:ultimate:enhancement-prerequisite`,
        },
      }).scenario,
      startFrame: 66,
    };
  }
  return { scenario, startFrame: 1 };
}

function skillIdentity(entry: RuntimeSkillCase): string {
  return `${entry.operator.slug}/${entry.groupKey}/${entry.variantKey ?? 'base'}/${entry.skill.key}`;
}

function libraryPlacementIdentity(entry: RuntimeLibraryPlacementCase): string {
  return `${entry.operator.slug}/${entry.groupKey}/library/${entry.placement.entryKey}`;
}

function createScopedIdAllocator(scope: string): { allocate(kind: string): string } {
  let next = 0;
  return { allocate: kind => `${kind}:${scope}:${next++}` };
}

function isOperatorDefinition(value: unknown): value is RuntimeOperator {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { slug?: unknown }).slug === 'string' &&
    Array.isArray((value as { skillGroups?: unknown }).skillGroups)
  );
}

function toViteFsId(file: string): string {
  return `/@fs/${file.replaceAll('\\', '/')}`;
}

function parseArguments(argv: readonly string[]): AuditArguments {
  let candidateRoot = '';
  let potential = 0;
  let endFrame = 3600;
  let maxOperatorSourceBytes = DEFAULT_MAX_OPERATOR_SOURCE_BYTES;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    const value = argv[index + 1];
    if (argument === '--candidate-root' && value !== undefined) {
      candidateRoot = value;
      index += 1;
    } else if (argument === '--potential' && value !== undefined) {
      potential = Number(value);
      index += 1;
    } else if (argument === '--end-frame' && value !== undefined) {
      endFrame = Number(value);
      index += 1;
    } else if (argument === '--max-operator-source-bytes' && value !== undefined) {
      maxOperatorSourceBytes = Number(value);
      index += 1;
    } else {
      throw new Error(`unknown or incomplete argument: ${argument}`);
    }
  }
  if (candidateRoot.length === 0) throw new Error('--candidate-root is required');
  if (!Number.isInteger(potential) || potential < 0 || potential > 5)
    throw new Error('--potential must be an integer from 0 to 5');
  if (!Number.isInteger(endFrame) || endFrame < 1)
    throw new Error('--end-frame must be a positive integer');
  if (!Number.isInteger(maxOperatorSourceBytes) || maxOperatorSourceBytes < 1) {
    throw new Error('--max-operator-source-bytes must be a positive integer');
  }
  return { candidateRoot, potential, endFrame, maxOperatorSourceBytes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await auditCandidateOperatorSkills(parseArguments(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}
