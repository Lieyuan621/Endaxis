/**
 * 把场景持久化的资源输入与上游已解析规则组合成完整战斗资源快照。
 *
 * 本模块只负责编译全新战斗的初始账本，不读取定义、面板或 Buff。调用方必须先解析项目中
 * 没有保存的原生规则；场景继承需要来源边界快照，不能调用本入口并假定资源从零开始。
 */
import type { CombatResourceSnapshot } from '../combat/resources/combatResources';
import type { SharedSpGainSettings } from '../combat/resources/sharedSpGainModifiers';
import type {
  NormalSkillUltimateEnergySettings,
  OperatorResourceSnapshot,
} from '../combat/state/environmentState';
import type { GameplayTag } from '../combat/tags/gameplayTags';
import type { ScenarioDocument, TrackDocument } from '../project/schema';

/** 存档没有保存、必须由定义与构筑解析层显式提供的单个干员资源规则。 */
export interface ResolvedOperatorResourceRules {
  /** 轨道没有用户上限覆盖时使用的已解析终结技能量上限。 */
  readonly maxUltimateEnergy?: number;
  readonly ultimateEnergyGainMultiplier: number;
  /** `null` 表示没有回能限制；空集合表示所有正向回能均被拦截。 */
  readonly allowedUltimateEnergyRecoveryTags: ReadonlySet<GameplayTag> | null;
}

/** 场景文档之外、组装完整资源快照所需的已解析规则。 */
export interface CompileScenarioResourcesOptions {
  /** GlobalConst 的账号能量上限换算出的共享闪避次数；缺失时只记录相对消耗。 */
  readonly dashEnergyCapacity?: number;
  readonly sharedSpGain: SharedSpGainSettings;
  readonly spRecoveryPauseDuration: number;
  readonly ultimateEnergySystemUnlocked: boolean;
  readonly normalSkillUltimateEnergy: NormalSkillUltimateEnergySettings;
  /** 以 `OperatorInstanceDocument.id` 为键；运行时干员身份与时间轴编译保持一致。 */
  readonly operators: ReadonlyMap<string, ResolvedOperatorResourceRules>;
}

function requireNonNegativeFinite(value: number, path: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${path} must be a non-negative finite number`);
  }
}

function requireFinite(value: number, path: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${path} must be a finite number`);
}

function compileOperatorResource(
  track: TrackDocument,
  trackIndex: number,
  options: CompileScenarioResourcesOptions,
): OperatorResourceSnapshot | null {
  const trackPath = `scenario.tracks[${trackIndex}]`;
  if (track.operator === null) {
    if (
      track.initialState.ultimateEnergy !== 0 ||
      track.initialState.maxUltimateEnergyOverride !== undefined
    ) {
      throw new Error(
        `${trackPath}.initialState configures resources without an operator instance`,
      );
    }
    return null;
  }

  const operatorId = track.id;
  const resolved = options.operators.get(operatorId);
  if (resolved === undefined) {
    throw new Error(`resolved resource rules for operator instance '${operatorId}' do not exist`);
  }

  requireNonNegativeFinite(
    track.initialState.ultimateEnergy,
    `${trackPath}.initialState.ultimateEnergy`,
  );
  requireFinite(
    resolved.ultimateEnergyGainMultiplier,
    `options.operators['${operatorId}'].ultimateEnergyGainMultiplier`,
  );

  const override = track.initialState.maxUltimateEnergyOverride;
  if (override !== undefined) {
    requireNonNegativeFinite(override, `${trackPath}.initialState.maxUltimateEnergyOverride`);
  } else if (resolved.maxUltimateEnergy === undefined) {
    throw new Error(
      `${trackPath}.initialState has no maximum override and resolved resource rules for '${operatorId}' have no maxUltimateEnergy`,
    );
  }
  const maxUltimateEnergy = override ?? resolved.maxUltimateEnergy!;
  requireNonNegativeFinite(
    maxUltimateEnergy,
    `options.operators['${operatorId}'].maxUltimateEnergy`,
  );
  if (track.initialState.ultimateEnergy > maxUltimateEnergy) {
    throw new RangeError(`${trackPath}.initialState.ultimateEnergy exceeds its maximum`);
  }

  return {
    operatorId,
    ultimateEnergy: track.initialState.ultimateEnergy,
    maxUltimateEnergy,
    ultimateEnergyGainMultiplier: resolved.ultimateEnergyGainMultiplier,
    allowedUltimateEnergyRecoveryTags:
      resolved.allowedUltimateEnergyRecoveryTags === null
        ? null
        : new Set(resolved.allowedUltimateEnergyRecoveryTags),
  };
}

/**
 * 编译一次不继承运行时边界的场景资源快照。
 *
 * `returnedSp` 与恢复暂停剩余时间是新账本的运行时状态，因此从零开始。
 * 继承方案将通过自带历史重放建立切面；正式重放入口尚未接通时保留显式拒绝，
 * 避免把继承帧错误地当作普通初始化帧。不能查询来源方案恢复资源。
 */
export function compileScenarioResources(
  scenario: ScenarioDocument,
  options: CompileScenarioResourcesOptions,
): CombatResourceSnapshot {
  if (scenario.inheritance !== undefined) {
    throw new Error(
      `scenario '${scenario.id}' inherits runtime state, but inherited resource compilation is not connected`,
    );
  }

  const rules = scenario.battle.resourceRules;
  requireNonNegativeFinite(rules.maxSp, 'scenario.battle.resourceRules.maxSp');
  requireNonNegativeFinite(rules.initialSp, 'scenario.battle.resourceRules.initialSp');
  requireNonNegativeFinite(
    rules.spRecoveryPerSecond,
    'scenario.battle.resourceRules.spRecoveryPerSecond',
  );
  if (rules.initialSp > rules.maxSp) {
    throw new RangeError('scenario.battle.resourceRules.initialSp exceeds maxSp');
  }

  requireFinite(options.sharedSpGain.baseGainEfficiency, 'options.sharedSpGain.baseGainEfficiency');
  if (options.dashEnergyCapacity !== undefined) {
    requireNonNegativeFinite(options.dashEnergyCapacity, 'options.dashEnergyCapacity');
  }
  requireNonNegativeFinite(options.spRecoveryPauseDuration, 'options.spRecoveryPauseDuration');
  requireFinite(
    options.normalSkillUltimateEnergy.selfGainPerSp,
    'options.normalSkillUltimateEnergy.selfGainPerSp',
  );
  requireFinite(
    options.normalSkillUltimateEnergy.otherGainPerSp,
    'options.normalSkillUltimateEnergy.otherGainPerSp',
  );

  const seenOperatorIds = new Set<string>();
  const squad: OperatorResourceSnapshot[] = [];
  scenario.tracks.forEach((track, trackIndex) => {
    if (track === null) return;
    const member = compileOperatorResource(track, trackIndex, options);
    if (member === null) return;
    if (seenOperatorIds.has(member.operatorId)) {
      throw new Error(`operator instance '${member.operatorId}' is assigned to multiple tracks`);
    }
    seenOperatorIds.add(member.operatorId);
    squad.push(member);
  });

  return {
    ...(options.dashEnergyCapacity === undefined
      ? {}
      : {
          dashEnergy: {
            spent: 0,
            capacity: options.dashEnergyCapacity,
            inOverdraft: false,
          },
        }),
    sp: rules.initialSp,
    maxSp: rules.maxSp,
    returnedSp: 0,
    sharedSpGain: { ...options.sharedSpGain },
    spRecovery: {
      valuePerSecond: rules.spRecoveryPerSecond,
      pauseDuration: options.spRecoveryPauseDuration,
      pauseRemaining: 0,
    },
    ultimateEnergySystemUnlocked: options.ultimateEnergySystemUnlocked,
    squad,
    normalSkillUltimateEnergy: { ...options.normalSkillUltimateEnergy },
  };
}
