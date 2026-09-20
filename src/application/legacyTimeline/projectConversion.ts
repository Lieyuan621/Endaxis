/**
 * 旧版时间轴项目到 Next 项目文档的显式迁移器。
 *
 * 旧文件中的命中、Buff、面板和伤害结果都是旧模拟器的派生快照，迁移时一律丢弃；这里只
 * 搬运用户输入：养成、配装、场景参数、技能身份和放置帧。游戏数据仓库只负责解析稳定身份，
 * 不能为旧文件补当前编辑器默认值。
 */
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import {
  layoutSkillGroupPlacement,
  resolveSkillGroupPlacementSkills,
} from '../editor/skillGroupPlacement';
export type LegacyMigrationResult =
  { ok: true; value: EndaxisProjectDocument; warnings: string[] } | { ok: false; errors: string[] };
interface LegacyProjectImporter {
  migrate(input: unknown): LegacyMigrationResult;
}
import {
  ENEMY_EDITABLE_FIELDS,
  PROJECT_FPS,
  PROJECT_KIND,
  PROJECT_SCHEMA_VERSION,
  type EndaxisProjectDocument,
  type ConnectionDocument,
  type GearInstanceDocument,
  type OperatorInstanceDocument,
  type ScenarioDocument,
  type SkillCastDocument,
  type TrackDocument,
  type TrackListDocument,
  type WeaponInstanceDocument,
} from '../../core/project/schema';

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record).filter(value => value !== null) : [];
}

function string(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function integer(value: unknown): number | null {
  const parsed = number(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function boolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function numericRecord(value: unknown): Record<string, number> {
  const source = record(value);
  if (source === null) return {};
  return Object.fromEntries(
    Object.entries(source).filter((entry): entry is [string, number] => number(entry[1]) !== null),
  );
}

function indexById(values: unknown): Map<string, UnknownRecord> {
  return new Map(
    records(values).flatMap(value => {
      const id = string(value.id);
      return id === null ? [] : [[id, value] as const];
    }),
  );
}

/** 技能只接受配置确认的目标；目标有效性由正式项目校验器检查。 */
function resolveLegacySkillSource(
  _repository: GameDataRepository,
  _operatorSlug: string,
  action: UnknownRecord,
): SkillCastDocument['source'] | null {
  const explicit = record(action.convertedSource);
  return explicit ? (explicit as unknown as SkillCastDocument['source']) : null;
}

function resolveLegacySkillSequence(
  repository: GameDataRepository,
  operatorSlug: string,
  action: UnknownRecord,
): readonly { source: SkillCastDocument['source']; offsetFrames: number }[] | null {
  const explicit = record(action.convertedSequence);
  if (explicit === null || explicit.kind !== 'operatorSkillSequence') return null;
  const operator = repository.getOperator(operatorSlug);
  if (operator === null) return [];
  const parts = [explicit, ...records(explicit.continuations)];
  const resolvedParts = parts.map(part => {
    const skillGroupKey = string(part.skillGroupKey);
    const parsedVariantKey = part.variantKey === undefined ? undefined : string(part.variantKey);
    if (skillGroupKey === null || parsedVariantKey === null) return null;
    const variantKey = parsedVariantKey ?? undefined;
    const group = operator.skillGroups.find(candidate => candidate.key === skillGroupKey);
    if (group === undefined) return null;
    let skills;
    try {
      skills = resolveSkillGroupPlacementSkills(group, variantKey);
    } catch {
      return null;
    }
    const policy =
      variantKey === undefined
        ? group.placementPolicy
        : group.variants?.find(candidate => candidate.key === variantKey)?.placementPolicy;
    return { skillGroupKey, skills, policy };
  });
  if (resolvedParts.some(part => part === null)) return [];
  if (
    resolvedParts.length > 1 &&
    resolvedParts.some(part => part!.policy?.kind === 'recursiveInput')
  ) {
    return [];
  }
  const onlyPart = resolvedParts[0]!;
  if (onlyPart.policy?.kind === 'recursiveInput') {
    const first = onlyPart.skills.find(skill => skill.key === onlyPart.policy!.firstSkillKey);
    return first === undefined
      ? []
      : [
          {
            source: {
              kind: 'operatorSkill',
              skillGroupKey: onlyPart.skillGroupKey,
              skillKey: first.key,
            },
            offsetFrames: 0,
          },
        ];
  }
  const flattened = resolvedParts.flatMap(part =>
    part!.skills.map(skill => ({ skillGroupKey: part!.skillGroupKey, skill })),
  );
  const offsets = layoutSkillGroupPlacement(flattened.map(item => item.skill)).offsets;
  return flattened.map((item, index) => ({
    source: {
      kind: 'operatorSkill',
      skillGroupKey: item.skillGroupKey,
      skillKey: item.skill.key,
    },
    offsetFrames: offsets[index]!,
  }));
}
function migrateOperator(source: UnknownRecord, operatorSlug: string): OperatorInstanceDocument {
  return {
    operatorSlug,
    level: integer(source.level) ?? 1,
    promoted: boolean(source.promoted) ?? false,
    potential: integer(source.potential) ?? 0,
    trustLevel: integer(source.trustLevel) ?? 0,
    skillLevels: numericRecord(source.skillLevels),
    talentStates: numericRecord(source.talentStates),
  };
}

function migrateWeapon(
  repository: GameDataRepository,
  source: UnknownRecord | undefined,
): WeaponInstanceDocument | null {
  if (source === undefined) return null;
  const weaponSlug = string(source.weaponSlug);
  if (weaponSlug === null) return null;
  const definition = repository.getWeapon(weaponSlug);
  if (definition === null) return null;
  const legacyLevels = [source.skill1Level, source.skill2Level, source.skill3Level]
    .map(integer)
    .filter((value): value is number => value !== null);
  if (legacyLevels.length < definition.traits.length) return null;
  return {
    weaponSlug,
    level: integer(source.level) ?? 1,
    tuned: boolean(source.tuned) ?? false,
    potential: integer(source.potential) ?? 0,
    traitLevels: legacyLevels.slice(0, definition.traits.length),
  };
}

function migrateGear(
  repository: GameDataRepository,
  source: UnknownRecord | undefined,
): GearInstanceDocument | null {
  if (source === undefined) return null;
  const gearSlug = string(source.gearPieceId);
  if (gearSlug === null) return null;
  const definition = repository.getGear(gearSlug);
  if (definition === null) return null;
  const levels = Array.isArray(source.artificingLevels)
    ? source.artificingLevels.map(integer).filter((value): value is number => value !== null)
    : [];
  // 旧版实例固定保存四格，但旧模拟只按 skill1..3 的实际槽位消费前三格；第四格从未对应
  // GearDefinition trait。不可精锻装备保存空数组，等价于每个现有 trait 使用基础档 0。
  if (levels.length > 0 && levels.length < definition.traits.length) return null;
  return {
    gearSlug,
    artificingLevels:
      levels.length === 0
        ? definition.traits.map(() => 0)
        : levels.slice(0, definition.traits.length),
  };
}

function migrateTrack(
  repository: GameDataRepository,
  scenarioId: string,
  trackIndex: number,
  source: UnknownRecord,
  operators: ReadonlyMap<string, UnknownRecord>,
  weapons: ReadonlyMap<string, UnknownRecord>,
  gears: ReadonlyMap<string, UnknownRecord>,
  initialGaugeMode: string | null,
  warnings: string[],
): TrackDocument | null {
  const operatorSlug = string(source.id);
  const operatorSource = operators.get(string(source.operatorInstanceId) ?? '');
  const hasNoOperatorIdentity = operatorSlug === null && string(source.operatorInstanceId) === null;
  if (hasNoOperatorIdentity && records(source.actions).length === 0) return null;
  if (operatorSource && operatorSource.operatorSlug !== operatorSlug)
    warnings.push(`${scenarioId}: track/operator instance identity mismatch`);
  if (
    operatorSlug === null ||
    operatorSource === undefined ||
    repository.getOperator(operatorSlug) === null
  ) {
    warnings.push(
      `${scenarioId}: track ${trackIndex + 1} has an unresolved operator and was left empty`,
    );
    return null;
  }

  const skillCasts = records(source.actions).flatMap((action, actionIndex) => {
    if (record(action.convertedDodge) !== null) return [];
    const skillSource = resolveLegacySkillSource(repository, operatorSlug, action);
    const skillSequence = resolveLegacySkillSequence(repository, operatorSlug, action);
    const startFrame = integer(action.startTime) ?? integer(action.logicalStartTime);
    const resolved =
      skillSource === null ? skillSequence : [{ source: skillSource, offsetFrames: 0 }];
    if (resolved === null || resolved.length === 0 || startFrame === null) {
      warnings.push(
        `${scenarioId}: ${operatorSlug} action ${actionIndex + 1} has no stable Next skill identity and was omitted`,
      );
      return [];
    }
    const baseId = `legacy:${scenarioId}:track:${trackIndex}:cast:${actionIndex}`;
    return resolved.map(
      ({ source: resolvedSource, offsetFrames }, sequenceIndex) =>
        ({
          id: sequenceIndex === 0 ? baseId : `${baseId}:sequence:${sequenceIndex}`,
          source: resolvedSource,
          placement: { startFrame: startFrame + offsetFrames },
        }) satisfies SkillCastDocument,
    );
  });

  const weapon = migrateWeapon(repository, weapons.get(string(source.weaponInstanceId) ?? ''));
  if (
    source.weaponInstanceId !== null &&
    source.weaponInstanceId !== undefined &&
    weapon === null
  ) {
    warnings.push(`${scenarioId}: ${operatorSlug} weapon could not be migrated`);
  }
  const migrateGearSlot = (field: string): GearInstanceDocument | null => {
    const id = string(source[field]);
    const migrated = migrateGear(repository, id === null ? undefined : gears.get(id));
    if (id !== null && migrated === null)
      warnings.push(`${scenarioId}: ${operatorSlug} ${field} could not be migrated`);
    return migrated;
  };

  const operator = migrateOperator(operatorSource, operatorSlug);
  const storedInitialEnergy = number(source.initialGauge) ?? 0;
  // 旧存档已把“满能量”解析成每条轨道的 initialGauge。迁移器应保留这项用户输入；
  // 重新编译当前技能会依赖装备后的最终属性，也会把当前数据误当成旧存档事实。
  const initialUltimateEnergy = initialGaugeMode === 'empty' ? 0 : storedInitialEnergy;

  return {
    id: `legacy:${scenarioId}:track:${trackIndex}:${operatorSlug}`,
    operator,
    weapon,
    gears: {
      armor: migrateGearSlot('equipArmorInstanceId'),
      gloves: migrateGearSlot('equipGlovesInstanceId'),
      accessory1: migrateGearSlot('equipAccessory1InstanceId'),
      accessory2: migrateGearSlot('equipAccessory2InstanceId'),
    },
    initialState: {
      ultimateEnergy: initialUltimateEnergy,
      ...(number(source.maxGaugeOverride) === null
        ? {}
        : { maxUltimateEnergyOverride: number(source.maxGaugeOverride)! }),
    },
    skillCasts,
  };
}

/** 只搬运已在准备阶段验证过的技能块连接；旧派生 Hit 和效果身份不得在这里猜测。 */
function migrateConnections(
  source: UnknownRecord,
  scenarioId: string,
  tracks: TrackListDocument,
  warnings: string[],
): ConnectionDocument[] {
  const castIdsByLegacyInstance = new Map<string, string>();
  for (const [trackIndex, sourceTrack] of records(source.tracks).entries()) {
    for (const [actionIndex, action] of records(sourceTrack.actions).entries()) {
      const legacyInstanceId = string(action.instanceId);
      const castId = `legacy:${scenarioId}:track:${trackIndex}:cast:${actionIndex}`;
      if (
        legacyInstanceId !== null &&
        tracks[trackIndex]?.skillCasts.some(cast => cast.id === castId)
      ) {
        castIdsByLegacyInstance.set(legacyInstanceId, castId);
      }
    }
  }
  return records(source.connections).flatMap((connection, index) => {
    if (
      (connection.fromNodeType != null && connection.fromNodeType !== 'action') ||
      (connection.toNodeType != null && connection.toNodeType !== 'action') ||
      connection.fromEffectId != null ||
      connection.toEffectId != null ||
      connection.fromEffectIndex != null ||
      connection.toEffectIndex != null
    ) {
      warnings.push(
        `${scenarioId}: 第 ${index + 1} 条连线使用 Hit 或效果端点；V3 不支持，已删除这条连线`,
      );
      return [];
    }
    const fromLegacyId = string(connection.fromNodeId) ?? string(connection.from);
    const toLegacyId = string(connection.toNodeId) ?? string(connection.to);
    const fromId = fromLegacyId === null ? undefined : castIdsByLegacyInstance.get(fromLegacyId);
    const toId = toLegacyId === null ? undefined : castIdsByLegacyInstance.get(toLegacyId);
    if (fromId === undefined || toId === undefined) {
      warnings.push(`${scenarioId}: connection ${index + 1} refers to an omitted skill block`);
      return [];
    }
    return [
      {
        id: string(connection.id) ?? `legacy:${scenarioId}:connection:${index}`,
        consumption: boolean(connection.consumption) ?? false,
        from: {
          kind: 'skillCast',
          skillCastId: fromId,
          ...(string(connection.sourcePort) === null
            ? {}
            : { port: string(connection.sourcePort)! }),
        },
        to: {
          kind: 'skillCast',
          skillCastId: toId,
          ...(string(connection.targetPort) === null
            ? {}
            : { port: string(connection.targetPort)! }),
        },
      },
    ];
  });
}

function migrateScenario(
  repository: GameDataRepository,
  wrapper: UnknownRecord,
  scenarioIndex: number,
  warnings: string[],
): ScenarioDocument | null {
  const source = record(wrapper.data);
  if (source === null) return null;
  const scenarioId = string(wrapper.id) ?? `legacy-scenario-${scenarioIndex + 1}`;
  const operators = indexById(source.operators);
  const weapons = indexById(source.weapons);
  const gears = indexById(source.gears);
  const initialMode = string(source.initialGaugeMode);
  const tracks = records(source.tracks)
    .slice(0, 4)
    .map((track, trackIndex) =>
      migrateTrack(
        repository,
        scenarioId,
        trackIndex,
        track,
        operators,
        weapons,
        gears,
        initialMode,
        warnings,
      ),
    );
  while (tracks.length < 4) tracks.push(null);

  const constants = record(source.systemConstants) ?? {};
  const enemyId = string(source.activeEnemyId);
  const enemyDefinition = enemyId === null ? null : repository.getEnemy(enemyId);
  if (enemyId !== null && enemyId !== 'custom' && enemyDefinition === null) {
    warnings.push(
      `${scenarioId}: enemy '${enemyId}' has no resolved definition; provide an explicit enemy mapping`,
    );
  }
  const staggerNodeCount = Math.max(0, integer(constants.staggerNodeCount) ?? 0);
  const knotThresholds = Array.from(
    { length: staggerNodeCount },
    (_, index) => (index + 1) / (staggerNodeCount + 1),
  );
  const resistance = numericRecord(constants.resistance);
  const enemyLevel = integer(source.activeEnemyLevel) ?? 90;
  const customInitialGauges = numericRecord(source.customInitialGauges);

  return {
    id: scenarioId,
    name: string(wrapper.name) ?? `Legacy scenario ${scenarioIndex + 1}`,
    tracks: tracks as TrackListDocument,
    connections: migrateConnections(source, scenarioId, tracks as TrackListDocument, warnings),
    enemy: {
      source:
        enemyDefinition === null || enemyId === null
          ? { kind: 'custom', level: enemyLevel }
          : { kind: 'prefab', enemyId, level: enemyLevel },
      rank: enemyDefinition?.rank ?? 'mob',
      editable: {
        hp: number(constants.enemyHp) ?? 100000,
        defense: number(constants.def) ?? 100,
        superArmor: number(constants.superArmor) ?? 0,
        finisherMultiplier: number(constants.finisherMultiplier) ?? 1,
        resistances: resistance,
        stagger: {
          maximum: number(constants.maxStagger) ?? 300,
          knotThresholds,
          knotBreakDurationFrames: integer(constants.staggerNodeDuration) ?? 60,
          brokenDurationFrames: integer(constants.staggerBreakDuration) ?? 300,
          finisherSpRecovery: number(constants.executionRecovery) ?? 100,
        },
      },
      edited: [...ENEMY_EDITABLE_FIELDS],
    },
    battle: {
      prepFrames: integer(source.prepDuration) ?? 0,
      durationFrames: integer(source.battleDuration) ?? 3600,
      ...((integer(source.simulationStartline) ?? integer(source.simulationEndline)) === null
        ? {}
        : {
            simulationRange: {
              ...(integer(source.simulationStartline) === null
                ? {}
                : { startFrame: integer(source.simulationStartline)! }),
              ...(integer(source.simulationEndline) === null
                ? {}
                : { endFrame: integer(source.simulationEndline)! }),
            },
          }),
      resourceRules: {
        maxSp: number(constants.maxSp) ?? 300,
        initialSp: number(constants.initialSp) ?? 300,
        spRecoveryPerSecond: number(constants.spRegenRate) ?? 0,
        defaultSkillSpCost: number(constants.skillSpCostDefault) ?? 100,
      },
      cycleBoundaries: records(source.cycleBoundaries).flatMap((boundary, index) => {
        const frame = integer(boundary.time);
        return frame === null
          ? []
          : [{ id: string(boundary.id) ?? `legacy-cycle-${index}`, frame }];
      }),
      controlSwitches: records(source.switchEvents).flatMap((event, index) => {
        const frame = integer(event.time);
        const trackIndex = integer(event.trackIndex);
        return frame === null || trackIndex === null || trackIndex < 0 || trackIndex > 3
          ? []
          : [
              {
                id: string(event.id) ?? `legacy-switch-${index}`,
                frame,
                trackIndex: trackIndex as 0 | 1 | 2 | 3,
              },
            ];
      }),
      dodgeMarkers: records(source.tracks).flatMap((track, trackIndex) =>
        records(track.actions).flatMap((action, actionIndex) => {
          const converted = record(action.convertedDodge);
          const frame = integer(action.startTime) ?? integer(action.logicalStartTime);
          if (
            converted === null ||
            converted.direction !== 'forward' ||
            frame === null ||
            trackIndex < 0 ||
            trackIndex > 3 ||
            tracks[trackIndex] === null
          ) {
            return [];
          }
          return [
            {
              id: `legacy:${scenarioId}:track:${trackIndex}:dodge:${actionIndex}`,
              frame,
              trackIndex: trackIndex as 0 | 1 | 2 | 3,
              direction: 'forward' as const,
              mode: { kind: 'dodge' as const },
            },
          ];
        }),
      ),
      externalEventMarkers: [],
    },
    mechanics: { selections: [] },
    globalConfig: { modifiers: [] },
    editor: {
      trackHeightWeights: (() => {
        const values = Array.isArray(source.trackRowHeightWeights)
          ? source.trackRowHeightWeights.map(number)
          : [];
        return values.length === 4 && values.every(value => value !== null && value > 0)
          ? (values as [number, number, number, number])
          : [1, 1, 1, 1];
      })(),
      prepExpanded: boolean(source.prepExpanded) ?? true,
      initialUltimateEnergyPreset: {
        mode: initialMode === 'full' || initialMode === 'custom' ? initialMode : 'empty',
        customByTrackId: Object.fromEntries(
          (tracks as TrackListDocument).flatMap(track =>
            track === null
              ? []
              : [
                  [
                    track.id,
                    customInitialGauges[track.operator!.operatorSlug] ??
                      track.initialState.ultimateEnergy,
                  ],
                ],
          ),
        ),
      },
    },
  };
}

/** 创建只依赖显式只读游戏数据端口的旧项目迁移器。 */
export function createLegacyProjectImporter(repository: GameDataRepository): LegacyProjectImporter {
  return {
    migrate(input: unknown): LegacyMigrationResult {
      const root = record(input);
      if (root === null) return { ok: false, errors: ['legacy project root must be an object'] };
      const warnings: string[] = [];
      const scenarios = records(root.scenarioList).flatMap((scenario, index) => {
        const migrated = migrateScenario(repository, scenario, index, warnings);
        return migrated === null ? [] : [migrated];
      });
      if (scenarios.length === 0)
        return { ok: false, errors: ['legacy project has no migratable scenarios'] };
      const createdAt = new Date().toISOString();
      const project: EndaxisProjectDocument = {
        kind: PROJECT_KIND,
        schemaVersion: PROJECT_SCHEMA_VERSION,
        createdWith: 'Endaxis legacy importer',
        createdAt,
        fps: PROJECT_FPS,
        // 保留用户打开的方案；旧引用失效时才采用旧版加载器同样的首方案回退。
        activeScenarioId: scenarios.some(scenario => scenario.id === root.activeScenarioId)
          ? String(root.activeScenarioId)
          : scenarios[0]!.id,
        definitionLibrary: { operators: {}, weapons: {}, gears: {}, gearSets: {} },
        scenarios,
      };
      return { ok: true, value: project, warnings };
    },
  };
}
