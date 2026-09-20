/** 从已编译动作树收集显式与隐式 Buff 依赖；动态 ID 在来源编译边界解决。 */
export function collectCompiledBuffIds(value: unknown): ReadonlySet<string> {
  return new Set(collectCompiledBuffApplications(value).map(item => item.buffId));
}

export interface CompiledAbilityEntitySpawnReference {
  readonly abilityEntityId: string;
  readonly skillId: string;
  readonly sourcePath: string;
}

/**
 * 从已编译动作树收集实体生成边。实体子技能仍可生成其他实体，
 * 因此整名装配必须对这份结果做不动点闭包，不能只收集主动技能的第一层。
 */
export function collectCompiledAbilityEntitySpawns(
  value: unknown,
): readonly CompiledAbilityEntitySpawnReference[] {
  const spawns: CompiledAbilityEntitySpawnReference[] = [];
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item === null || typeof item !== 'object') return;
    const record = item as Record<string, unknown>;
    if (record.kind === 'spawnAbilityEntity') {
      const parameters = record.parameters;
      if (parameters === null || typeof parameters !== 'object')
        throw new Error('compiled spawnAbilityEntity step is missing parameters');
      const parameterRecord = parameters as Record<string, unknown>;
      const abilityEntityId = parameterRecord.abilityEntityId;
      const skillId = parameterRecord.childSkillId;
      if (typeof abilityEntityId !== 'string' || abilityEntityId.length === 0)
        throw new Error('compiled spawnAbilityEntity step has an invalid abilityEntityId');
      if (typeof skillId !== 'string' || skillId.length === 0)
        throw new Error('compiled spawnAbilityEntity step has an invalid childSkillId');
      spawns.push({
        abilityEntityId,
        skillId,
        sourcePath: `compiled.spawnAbilityEntity.${abilityEntityId}.${skillId}`,
      });
    }
    Object.values(record).forEach(visit);
  };
  visit(value);
  return spawns;
}

/**
 * 识别公共 Keyword 投影留下的固定调用协议，供闭包区分“已证明的关键词根”和任意外部 Buff 根。
 * 带 child 覆盖的调用仍由静态引用闭包单独证明，不能借此回退到载体默认 child。
 */
export function collectCompiledDefaultKeywordCarrierIds(value: unknown): ReadonlySet<string> {
  const ids = new Set<string>();
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item === null || typeof item !== 'object') return;
    const record = item as Record<string, unknown>;
    if (record.kind === 'applyBuff') {
      const parameters = record.parameters;
      if (parameters !== null && typeof parameters === 'object') {
        const parameterRecord = parameters as Record<string, unknown>;
        const buffId = parameterRecord.buffId;
        const assignments = parameterRecord.blackboardAssignments;
        const assignmentKeys =
          assignments !== null && typeof assignments === 'object'
            ? Object.keys(assignments as Record<string, unknown>).sort()
            : [];
        if (
          typeof buffId === 'string' &&
          isRecoveredKeywordCarrierBuffId(buffId) &&
          parameterRecord.inheritSourceSkillCastInfo === true &&
          assignmentKeys.length === 2 &&
          assignmentKeys[0] === 'duration' &&
          assignmentKeys[1] === 'rate' &&
          parameterRecord.stringBlackboardAssignments === undefined
        )
          ids.add(buffId);
      }
    }
    Object.values(record).forEach(visit);
  };
  visit(value);
  return ids;
}

/** 只收集仍需最终内联水合的物理异常公共 Buff；普通 applyBuff 已携带自己的定义。 */
export function collectCompiledPhysicalInflictionBuffIds(value: unknown): ReadonlySet<string> {
  const ids = new Set<string>();
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item === null || typeof item !== 'object') return;
    const record = item as Record<string, unknown>;
    if (record.kind === 'applyPhysicalInfliction') {
      const parameters = record.parameters as Record<string, unknown>;
      for (const key of ['noGuardBuffId', 'fractureBuffId', 'crushedBuffId', 'airborneBuffId']) {
        const id = parameters[key];
        if (typeof id === 'string' && id.length > 0) ids.add(id);
      }
    }
    Object.values(record).forEach(visit);
  };
  visit(value);
  return ids;
}

export interface CompiledBuffApplicationReference {
  readonly buffId: string;
  readonly target: string;
  readonly source?: string;
  readonly capturedTargetGroups?: CompiledBuffCapturedTargetGroupsSource;
}

export function collectCompiledBuffApplications(
  value: unknown,
): readonly CompiledBuffApplicationReference[] {
  const applications: CompiledBuffApplicationReference[] = [];
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item === null || typeof item !== 'object') return;
    const record = item as Record<string, unknown>;
    if (record.kind === 'applyKnockDown') {
      const parameters = record.parameters as Record<string, unknown>;
      if (parameters.targetFilter !== 'skipAll') {
        // 原生根动作的隐式安装仍是依赖，不能在从来源图转到正式程序时丢失。
        applications.push({ buffId: 'buff_physical_knockdown', target: 'enemy' });
        if (!parameters.force)
          applications.push({ buffId: 'buff_physical_no_guard', target: 'enemy' });
      }
    }
    if (record.kind === 'applyPhysicalInfliction') {
      const parameters = record.parameters as Record<string, unknown>;
      const type = parameters.type;
      const noGuardBuffId = parameters.noGuardBuffId;
      const abnormalBuffId =
        type === 'fracture'
          ? parameters.fractureBuffId
          : type === 'crush'
            ? parameters.crushedBuffId
            : parameters.airborneBuffId;
      if (typeof noGuardBuffId !== 'string' || typeof abnormalBuffId !== 'string')
        throw new Error('compiled physical infliction step has invalid Buff identities');
      applications.push({ buffId: noGuardBuffId, target: 'enemy' });
      applications.push({ buffId: abnormalBuffId, target: 'enemy' });
    }
    if (record.kind === 'applyBuff') {
      const parameters = record.parameters;
      if (parameters === null || typeof parameters !== 'object')
        throw new Error('compiled applyBuff step is missing parameters');
      const buffId = (parameters as Record<string, unknown>).buffId;
      if (typeof buffId !== 'string' || buffId.length === 0)
        throw new Error('compiled applyBuff step has an invalid buffId');
      const target = (parameters as Record<string, unknown>).target;
      if (typeof target !== 'string' || target.length === 0)
        throw new Error('compiled applyBuff step has an invalid target');
      const source = (parameters as Record<string, unknown>).source;
      const capturedTargetGroups = (
        parameters as {
          readonly [COMPILED_BUFF_CAPTURED_TARGET_GROUPS]?: CompiledBuffCapturedTargetGroupsSource;
        }
      )[COMPILED_BUFF_CAPTURED_TARGET_GROUPS];
      applications.push({
        buffId,
        target,
        ...(typeof source === 'string' ? { source } : {}),
        ...(capturedTargetGroups === undefined ? {} : { capturedTargetGroups }),
      });
      const onActionEndBuffs = (parameters as Record<string, unknown>).onActionEndBuffs;
      if (Array.isArray(onActionEndBuffs)) {
        for (const [index, raw] of onActionEndBuffs.entries()) {
          if (raw === null || typeof raw !== 'object')
            throw new Error(`compiled action-end Buff ${index} is invalid`);
          const exit = raw as Record<string, unknown>;
          if (typeof exit.buffId !== 'string' || exit.buffId.length === 0)
            throw new Error(`compiled action-end Buff ${index} has an invalid buffId`);
          if (typeof exit.target !== 'string' || exit.target.length === 0)
            throw new Error(`compiled action-end Buff ${index} has an invalid target`);
          applications.push({
            buffId: exit.buffId,
            target: exit.target,
            ...(typeof exit.source === 'string' ? { source: exit.source } : {}),
          });
        }
      }
    }
    Object.values(record).forEach(visit);
  };
  visit(value);
  return applications;
}

/**
 * Collapse per-application passTargetGroupsToBuff provenance for shared Buff
 * definitions. Only identities present with the same kind on every captured
 * producer remain compile-time facts.
 */
export function collectCompiledBuffCapturedTargetGroups(
  value: unknown,
): ReadonlyMap<string, CompiledBuffCapturedTargetGroupsSource> {
  const grouped = Map.groupBy(
    collectCompiledBuffApplications(value).filter(
      application => application.capturedTargetGroups !== undefined,
    ),
    application => application.buffId,
  );
  return new Map(
    [...grouped].map(([buffId, applications]) => {
      const [first, ...rest] = applications.map(application => application.capturedTargetGroups!);
      const captured = rest.reduce<CompiledBuffCapturedTargetGroupsSource>(
        (current, next) => ({
          enemyKeys: current.enemyKeys.filter(key => next.enemyKeys.includes(key)),
          zeroSpaceKeys: current.zeroSpaceKeys.filter(key => next.zeroSpaceKeys.includes(key)),
        }),
        first!,
      );
      return [buffId, captured] as const;
    }),
  );
}

/** 收集已编译树中会观察 Buff 身份的静态条件；这种空 Buff 是逻辑标记，不能按纯表现裁剪。 */
export function collectCompiledBuffIdentityReadIds(value: unknown): ReadonlySet<string> {
  const ids = new Set<string>();
  const addIds = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    for (const id of value) if (typeof id === 'string' && id.length > 0) ids.add(id);
  };
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item === null || typeof item !== 'object') return;
    const record = item as Record<string, unknown>;
    if (
      (record.kind === 'buffIdStackCompare' || record.kind === 'eventBuffIdMatch') &&
      Array.isArray(record.buffIds)
    ) {
      addIds(record.buffIds);
    }
    if (
      record.kind === 'readBuffStackCount' ||
      record.kind === 'readBuffBlackboard' ||
      record.kind === 'readBuffRemainingDuration'
    ) {
      const parameters = record.parameters;
      if (parameters !== null && typeof parameters === 'object') {
        const parameterRecord = parameters as Record<string, unknown>;
        addIds(parameterRecord.buffIds);
        const query = parameterRecord.query;
        if (query !== null && typeof query === 'object') {
          const queryRecord = query as Record<string, unknown>;
          if (queryRecord.kind === 'id') addIds(queryRecord.buffIds);
        }
      }
    }
    if (record.kind === 'applyBuff') {
      const parameters = record.parameters;
      if (parameters !== null && typeof parameters === 'object') {
        const parameterRecord = parameters as Record<string, unknown>;
        const assignments = parameterRecord.stringBlackboardAssignments;
        if (assignments !== null && typeof assignments === 'object') {
          const childId = (assignments as Record<string, unknown>).child_buff_id;
          if (typeof childId === 'string' && childId.length > 0) ids.add(childId);
        }
        const enhancements = parameterRecord.keywordEnhancements;
        if (Array.isArray(enhancements)) {
          for (const enhancement of enhancements) {
            if (enhancement === null || typeof enhancement !== 'object') continue;
            const triggerBuffIds = (enhancement as Record<string, unknown>).triggerBuffIds;
            if (!Array.isArray(triggerBuffIds)) continue;
            for (const id of triggerBuffIds)
              if (typeof id === 'string' && id.length > 0) ids.add(id);
          }
        }
      }
    }
    Object.values(record).forEach(visit);
  };
  visit(value);
  return ids;
}
import { isRecoveredKeywordCarrierBuffId } from '../../source/keywordActions.ts';
import {
  COMPILED_BUFF_CAPTURED_TARGET_GROUPS,
  type CompiledBuffCapturedTargetGroupsSource,
} from '../buffs/compiledBuffMetadata.ts';
