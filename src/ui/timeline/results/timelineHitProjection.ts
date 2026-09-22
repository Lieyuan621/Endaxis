/**
 * 算出一个技能块上的命中点画在哪、对应哪个命中。
 *
 * 本模块只从定义收集稳定身份与无运行结果时的局部回退偏移；实际位置由页面消费
 * `DamageApplied(castId, hitId)` 回执。条件分支里的命中点会标记出来，由页面决定怎么显示。
 * 命中点来自调用方提供的 SkillDefinition（目录或自定义），投影层不再从存档快照读取。
 */
import type {
  CombatCondition,
  OperatorAbilityEntityDefinitions,
  OperatorBuffDefinitions,
  SkillBuffDefinition,
  SkillDefinition,
  CombatStepDefinition,
} from '../../../core/game-data/operatorDefinition';
import type { SkillCastDocument } from '../../../core/project/schema';
import { deriveHitId } from '../../../core/combat/timeline/deriveHitId';
import { compareCombatNumbers } from '../../../../packages/game-data-contract/src/primitives';

/** 一个可渲染的命中点。 */
export interface TimelineHitMarker {
  readonly stepKey: string;
  readonly hitId: string;
  /** 产生该候选命中的基础或运行时替换技能形态。 */
  readonly skillKey?: string;
  /** 相对技能块左边缘的帧偏移。 */
  readonly frameOffset: number;
  /** 在条件分支里，跑不跑取决于当时的条件。 */
  readonly conditional: boolean;
}

/** 页面算好像素位置后交给组件画出来的命中点。 */
export interface TimelineHitMarkerView {
  /** 由明确的伤害事件响应产生的追加命中；执行宿主类型不参与判定。 */
  readonly triggered?: boolean;
  readonly triggeredStackIndex?: number;
  readonly executionFrame?: number;
  readonly stepKey: string;
  readonly hitId: string;
  /** 相对技能块左边缘的像素偏移。 */
  readonly leftPx: number;
  readonly title?: string;
  /** 该次命中实际获得了“连击”伤害 Buff；沿用 main 的蓝色命中点反馈。 */
  readonly linkBuffed?: boolean;
  /** 该命中是否被编辑器强制设为暴击；仅用于复刻旧版命中点反馈。 */
  readonly forcedCritical?: boolean;
}

/**
 * 尚无模拟结果时只展示定义中无条件的命中预览；一旦有模拟快照，命中事实必须来自
 * `DamageApplied(castId, hitId)`。这样时间轴跳转或提前结束后不可达的根调度命中不会
 * 再退回原生定义帧，伪装成一次延迟命中。
 */
export function shouldDisplayTimelineHitMarker(
  marker: TimelineHitMarker,
  hasSimulationRun: boolean,
  actualFrames: ReadonlyMap<string, number>,
): boolean {
  return hasSimulationRun ? actualFrames.has(marker.hitId) : !marker.conditional;
}

/**
 * 命中可以由能力实体等延迟到主技能块结束之后，不能被技能块宽度截断。
 * 负偏移没有可展示的实际意义，仍收敛到技能起点。
 */
export function projectTimelineHitMarkerLeftPx(leftPx: number): number {
  return Math.max(0, leftPx);
}

function resolveStaticCondition(condition: CombatCondition): boolean | null {
  if (
    condition.kind !== 'actionValueCompare' ||
    condition.left.kind !== 'constant' ||
    condition.right.kind !== 'constant'
  ) {
    return null;
  }
  return compareCombatNumbers(condition.left.value, condition.right.value, condition.operator);
}

function collectDamageSteps(
  step: CombatStepDefinition,
  conditional: boolean,
  markers: TimelineHitMarker[],
  cast: SkillCastDocument,
  frameOffset: number,
  abilityEntityDefinitions?: OperatorAbilityEntityDefinitions,
  buffDefinitions?: OperatorBuffDefinitions,
  activeBuffIds: ReadonlySet<string> = new Set(),
): void {
  if (step.kind === 'dealDamage' || step.kind === 'dealFixedDamage') {
    if (step.key === undefined || step.key.length === 0) {
      throw new Error(
        `damage step '${step.kind}' in cast '${cast.id}' is missing a stable key for projection`,
      );
    }
    markers.push({
      stepKey: step.key,
      hitId: deriveHitId(cast.id, step.key),
      frameOffset,
      conditional,
    });
    return;
  }
  if (step.kind === 'switch') {
    for (const option of step.options)
      for (const nested of option.sequence.steps) {
        collectDamageSteps(
          nested,
          true,
          markers,
          cast,
          frameOffset,
          abilityEntityDefinitions,
          buffDefinitions,
          activeBuffIds,
        );
      }
    return;
  }
  if (step.kind === 'conditional') {
    const staticResult = resolveStaticCondition(step.parameters.condition);
    if (staticResult === false) {
      for (const nested of step.whenFalse?.steps ?? []) {
        collectDamageSteps(
          nested,
          conditional,
          markers,
          cast,
          frameOffset,
          abilityEntityDefinitions,
          buffDefinitions,
          activeBuffIds,
        );
      }
      return;
    }
    // 只有纯常量比较可在无模拟预览中证明；其余分支仍等待实际回执。
    for (const nested of step.whenTrue.steps)
      collectDamageSteps(
        nested,
        staticResult === true ? conditional : true,
        markers,
        cast,
        frameOffset,
        abilityEntityDefinitions,
        buffDefinitions,
        activeBuffIds,
      );
    if (staticResult === true) return;
    for (const nested of step.whenFalse?.steps ?? []) {
      collectDamageSteps(
        nested,
        true,
        markers,
        cast,
        frameOffset,
        abilityEntityDefinitions,
        buffDefinitions,
        activeBuffIds,
      );
    }
    return;
  }
  if (step.kind === 'once' || step.kind === 'withActionBlackboardScope') {
    for (const nested of step.body.steps)
      collectDamageSteps(
        nested,
        conditional,
        markers,
        cast,
        frameOffset,
        abilityEntityDefinitions,
        buffDefinitions,
        activeBuffIds,
      );
    return;
  }
  if (step.kind === 'repeatEachTick' || step.kind === 'forEachContextTarget') {
    for (const nested of step.body.steps)
      collectDamageSteps(
        nested,
        conditional,
        markers,
        cast,
        frameOffset,
        abilityEntityDefinitions,
        buffDefinitions,
        activeBuffIds,
      );
    return;
  }
  if (step.kind === 'listenForCombatEvents') {
    for (const response of step.parameters.responses) {
      for (const nested of response.sequence.steps) {
        collectDamageSteps(
          nested,
          true,
          markers,
          cast,
          frameOffset,
          abilityEntityDefinitions,
          buffDefinitions,
          activeBuffIds,
        );
      }
    }
    return;
  }
  if (step.kind === 'applyBuff') {
    if (step.parameters.inheritSourceSkillCastInfo === false) return;
    if (typeof step.parameters.buffId !== 'string') return;
    const buffId = step.parameters.buffId;
    const definition = step.parameters.definition ?? buffDefinitions?.[buffId];
    if (definition === undefined || activeBuffIds.has(buffId)) return;
    const nextActiveBuffIds = new Set(activeBuffIds).add(buffId);
    collectBuffDamageSteps(
      definition,
      markers,
      cast,
      frameOffset,
      abilityEntityDefinitions,
      buffDefinitions,
      nextActiveBuffIds,
    );
    return;
  }
  const childSkill =
    step.kind === 'spawnAbilityEntity'
      ? (() => {
          const entityDefinition =
            step.parameters.definition ??
            abilityEntityDefinitions?.[step.parameters.abilityEntityId];
          if (entityDefinition === undefined) return undefined;
          const requestedSkillId = step.parameters.childSkillId;
          if (requestedSkillId !== undefined) {
            if (entityDefinition.childSkill?.skillId === requestedSkillId) {
              return entityDefinition.childSkill;
            }
            return entityDefinition.childSkills?.[requestedSkillId];
          }
          if (entityDefinition.childSkill !== undefined) return entityDefinition.childSkill;
          const namedChildren = Object.values(entityDefinition.childSkills ?? {});
          return namedChildren.length === 1 ? namedChildren[0] : undefined;
        })()
      : step.kind === 'startCurrentAbilityEntityChildSkill'
        ? step.parameters.childSkill
        : undefined;
  if (childSkill !== undefined) {
    for (const scheduled of childSkill.scheduledSequences) {
      for (const nested of scheduled.sequence.steps) {
        collectDamageSteps(
          nested,
          conditional,
          markers,
          cast,
          frameOffset + scheduled.startFrame,
          abilityEntityDefinitions,
          buffDefinitions,
          activeBuffIds,
        );
      }
    }
  }
}

function collectBuffDamageSteps(
  definition: SkillBuffDefinition,
  markers: TimelineHitMarker[],
  cast: SkillCastDocument,
  frameOffset: number,
  abilityEntityDefinitions: OperatorAbilityEntityDefinitions | undefined,
  buffDefinitions: OperatorBuffDefinitions | undefined,
  activeBuffIds: ReadonlySet<string>,
): void {
  const collectSequence = (steps: readonly CombatStepDefinition[], offset: number) => {
    for (const step of steps) {
      collectDamageSteps(
        step,
        true,
        markers,
        cast,
        offset,
        abilityEntityDefinitions,
        buffDefinitions,
        activeBuffIds,
      );
    }
  };
  for (const scheduled of definition.scheduledSequences ?? []) {
    collectSequence(scheduled.sequence.steps, frameOffset + scheduled.startFrame);
  }
  for (const sequence of Object.values(definition.lifecycleSequences ?? {})) {
    if (sequence !== undefined) collectSequence(sequence.steps, frameOffset);
  }
  for (const response of definition.abilityEventResponses ?? []) {
    collectSequence(response.sequence.steps, frameOffset);
  }
  for (const response of definition.igniteEventResponses ?? []) {
    collectSequence(response.sequence.steps, frameOffset);
  }
}

/**
 * 收集一次技能释放的全部命中点，按序列声明顺序返回。
 * 调用方传入本次使用的技能定义；伤害步骤缺少 key 时直接报错。
 */
export function projectCastHitMarkers(
  cast: SkillCastDocument,
  definition: SkillDefinition,
  abilityEntityDefinitions?: OperatorAbilityEntityDefinitions,
  buffDefinitions?: OperatorBuffDefinitions,
): readonly TimelineHitMarker[] {
  const markers: TimelineHitMarker[] = [];
  for (const scheduled of definition.scheduledSequences) {
    for (const step of scheduled.sequence.steps) {
      collectDamageSteps(
        step,
        false,
        markers,
        cast,
        scheduled.startFrame,
        abilityEntityDefinitions,
        buffDefinitions,
      );
    }
  }
  return markers;
}

/** 按稳定 step key 查询一次释放中的命中标记；找不到时返回 null。 */
export function findCastHitMarker(
  cast: SkillCastDocument,
  stepKey: string,
  definition: SkillDefinition,
  abilityEntityDefinitions?: OperatorAbilityEntityDefinitions,
  buffDefinitions?: OperatorBuffDefinitions,
): TimelineHitMarker | null {
  return (
    projectCastHitMarkers(cast, definition, abilityEntityDefinitions, buffDefinitions).find(
      marker => marker.stepKey === stepKey,
    ) ?? null
  );
}
