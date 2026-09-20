import { PROJECT_FPS, type SkillCastDocument } from '../../core/project/schema';
import {
  hydrateLegacyTrack,
  isLegacyDodgeAction,
  normalizeLegacySkill,
  resolveLegacyOperator,
} from './legacyFormat';

/** 一个旧技能块对应当前技能库中的整组技能；具体分段和默认间距取当前干员定义。 */
export interface LegacySkillSequenceTarget {
  readonly kind: 'operatorSkillSequence';
  readonly skillGroupKey: string;
  readonly variantKey?: string;
  /** 同一旧技能块实际还包含的后续技能组，按数组顺序紧接在首技能组之后。 */
  readonly continuations?: readonly {
    readonly skillGroupKey: string;
    readonly variantKey?: string;
  }[];
}

export type LegacySkillMappingTarget = SkillCastDocument['source'] | LegacySkillSequenceTarget;

export interface ConversionMappings {
  /** 历史 gamedata.json 中的完整技能块身份；同时校验所属干员、类别和段号。 */
  historicalSkills?: readonly {
    operator: string;
    id: string;
    type: string;
    segmentIndex?: number;
    name: string;
    evidence: string;
    target: LegacySkillMappingTarget;
  }[];
  operators?: Record<string, string>;
  weapons?: Record<string, string>;
  gears?: Record<string, string>;
  enemies?: Record<string, string>;
  /** 按旧干员 ID 分组；匹配完整技能身份，段号和变体缺省表示源字段也缺省。 */
  skills?: Record<
    string,
    readonly {
      source: LegacySkillIdentity;
      target: LegacySkillMappingTarget;
    }[]
  >;
  /** 精确旧坐标：方案 ID / 轨道下标 / 动作下标，不按名称猜变体。 */
  actions?: Record<string, LegacySkillMappingTarget>;
  /** 通用方案ID的已验证例外：坐标、源干员、实例及技能身份必须同时匹配。 */
  guardedActions?: readonly {
    path: string;
    operator: string;
    instanceId: string;
    source: LegacySkillIdentity;
    target: LegacySkillMappingTarget;
  }[];
}
export interface LegacySkillIdentity {
  skillId?: string;
  sourceSkillKey?: string;
  type?: string;
  segmentIndex?: number;
  variantKey?: string;
}
export function legacySkillIdentity(action: LegacySkillIdentity): LegacySkillIdentity {
  return {
    skillId: action.skillId,
    sourceSkillKey: action.sourceSkillKey,
    type: action.type,
    segmentIndex: action.segmentIndex,
    variantKey: action.variantKey,
  };
}
export interface ConversionIssue {
  path: string;
  message: string;
  /** 展示问题不影响技能、状态和伤害输入的完整性；未标注的仍按模拟内容问题处理。 */
  impact?: 'presentation';
}
export interface TimeConversion {
  path: string;
  sourceValue: number;
  sourceFps: number;
  /** 原存档坐标原点；时长为 0，绝对时刻为该方案的原始战前准备时长。 */
  sourceOrigin: number;
  frame: number;
  errorSeconds: number;
}
type Row = Record<string, any>;
function object(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('expected object');
  return value as Row;
}

/** 空对象和空数组只是旧编辑器留下的容器，不表示用户实际改过数值。 */
function hasConfiguredValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some(hasConfiguredValue);
  if (typeof value === 'object')
    return Object.values(value as Record<string, unknown>).some(hasConfiguredValue);
  return true;
}
const timeKeys = new Set([
  'prepDuration',
  'battleDuration',
  'simulationStartline',
  'simulationEndline',
  'staggerBreakDuration',
  'staggerNodeDuration',
  'startTime',
  'logicalStartTime',
  'duration',
  'time',
]);

/** 只规格化迁移使用的输入；旧派生结果不作为目标项目的数据源。 */
export function prepareLegacySource(input: unknown, mappings: ConversionMappings = {}) {
  const root = object(JSON.parse(JSON.stringify(input)));
  if (root.version !== '1.0.0' || !Array.isArray(root.scenarioList))
    throw new Error('仅支持 version=1.0.0 的 scenarioList 项目');
  if (root.timeUnit !== undefined && root.timeUnit !== 'frame')
    throw new Error('未知 timeUnit，不能猜测时间单位');
  const sourceFps = root.timeUnit === 'frame' ? root.fps : 1;
  if (!Number.isFinite(sourceFps) || sourceFps <= 0) throw new Error('帧存档必须明确提供有效 fps');
  const issues: ConversionIssue[] = [];
  const ignoredCustomizations: ConversionIssue[] = [];
  const times: TimeConversion[] = [];
  const identityChanges: { path: string; from: string; to: string }[] = [];
  const unresolvedSkills: { path: string; operator: string; source: LegacySkillIdentity }[] = [];
  const seen = new Set<string>();
  for (const [si, wrapper] of root.scenarioList.entries()) {
    object(wrapper);
    if (typeof wrapper.id !== 'string' || seen.has(wrapper.id))
      throw new Error('方案 ID 缺失或重复');
    seen.add(wrapper.id);
    const d = object(wrapper.data);
    const sourceOrigin = d.prepDuration ?? 0;
    if (!Number.isFinite(sourceOrigin) || sourceOrigin < 0) throw new Error('非法战前准备时长');
    const prefix = 'scenarioList[' + si + '].data';
    const enemyTarget = mappings.enemies?.[d.activeEnemyId];
    if (enemyTarget) {
      identityChanges.push({
        path: prefix + '.activeEnemyId',
        from: d.activeEnemyId,
        to: enemyTarget,
      });
      d.activeEnemyId = enemyTarget;
    }
    // 用户明确选择按标准技能转换，旧技能覆盖不参与目标定义，也不阻塞转换。
    if (hasConfiguredValue(d.characterOverrides)) {
      ignoredCustomizations.push({
        path: prefix + '.characterOverrides',
        message: '已忽略旧技能自定义覆盖，按标准技能定义转换',
      });
    }
    delete d.characterOverrides;
    for (const key of [
      'weaponOverrides',
      'equipmentCategoryOverrides',
      'inheritedInitialEffects',
      'inheritedInitialEnemyState',
      'contingencyContractTags',
    ]) {
      if (hasConfiguredValue(d[key]))
        issues.push({
          path: prefix + '.' + key,
          message: '存在尚不支持的用户配置，不生成完整项目',
        });
    }
    const actionInstanceCounts = new Map<string, number>();
    for (const track of Array.isArray(d.tracks) ? d.tracks : []) {
      for (const action of track.actions ?? []) {
        if (typeof action.instanceId !== 'string' || action.instanceId.length === 0) continue;
        actionInstanceCounts.set(
          action.instanceId,
          (actionInstanceCounts.get(action.instanceId) ?? 0) + 1,
        );
      }
    }
    const connections = Array.isArray(d.connections) ? d.connections : [];
    if (d.connections != null && !Array.isArray(d.connections)) {
      issues.push({
        path: `${prefix}.connections`,
        message: '连接列表格式无效',
      });
    }
    const validConnections: Row[] = [];
    for (const [index, connection] of connections.entries()) {
      object(connection);
      const path = `${prefix}.connections[${index}]`;
      // 早期连线没有节点类型；只有端点唯一对应技能块且未指定效果时才能补齐。
      for (const side of ['from', 'to'] as const) {
        const id = connection[`${side}NodeId`] ?? connection[side];
        if (
          connection[`${side}NodeType`] == null &&
          connection[`${side}EffectId`] == null &&
          connection[`${side}EffectIndex`] == null &&
          actionInstanceCounts.get(id) === 1
        ) {
          connection[`${side}NodeType`] = 'action';
          connection[`${side}NodeId`] = id;
        }
      }
      const actionOnly =
        connection.fromNodeType === 'action' &&
        connection.toNodeType === 'action' &&
        connection.fromEffectId == null &&
        connection.toEffectId == null &&
        connection.fromEffectIndex == null &&
        connection.toEffectIndex == null;
      if (!actionOnly) {
        issues.push({
          path,
          message: 'V3 不支持 Hit 或效果节点连线，已删除这条连线；只保留技能块之间的连线',
          impact: 'presentation',
        });
        continue;
      }
      let valid = true;
      for (const [endpoint, id] of [
        ['from', connection.fromNodeId ?? connection.from],
        ['to', connection.toNodeId ?? connection.to],
      ] as const) {
        if (typeof id !== 'string' || actionInstanceCounts.get(id) !== 1) {
          valid = false;
          issues.push({
            path: `${path}.${endpoint}`,
            message: `连接端点 '${String(id)}' 未唯一对应一个旧技能块`,
            impact: 'presentation',
          });
        }
      }
      if (valid) validConnections.push(connection);
    }
    // 局部失败不再阻塞整个项目；迁移器只能收到已经验证的连接，不能把 Hit 端点猜成技能块。
    d.connections = validConnections;
    if (d.globalConfig?.presetId || d.globalConfig?.customModifiers?.length)
      issues.push({ path: prefix + '.globalConfig', message: '全局配置尚未转换' });
    // 项目加载先应用根级常量，再应用方案局部覆盖；每个方案独立复制后换算时间。
    const inheritedConstants =
      root.systemConstants == null ? undefined : object(root.systemConstants);
    const localConstants = d.systemConstants == null ? undefined : object(d.systemConstants);
    const constants = { ...structuredClone(inheritedConstants ?? {}), ...localConstants };
    d.systemConstants = constants;
    if (localConstants === undefined && inheritedConstants === undefined) {
      issues.push({
        path: `${prefix}.systemConstants`,
        message: '缺少旧战斗常量，不能完整还原该方案',
      });
      d.systemConstants = constants;
    }
    if (constants.linkCdReduction)
      issues.push({
        path: prefix + '.systemConstants.linkCdReduction',
        message: '连携冷却修正尚未转换',
      });
    if (
      constants.finisherDamageTakenMultiplier != null &&
      constants.finisherDamageTakenMultiplier !== 1
    )
      issues.push({
        path: prefix + '.systemConstants.finisherDamageTakenMultiplier',
        message: '处决承伤修正尚未转换',
      });
    if (!Array.isArray(d.tracks) || d.tracks.length > 4) throw new Error('只支持最多四条轨道');
    // 旧 SwitchEvent 可能仍保存 gameId，而轨道已保存 slug；两侧共用旧身份解析。
    for (const [index, event] of (d.switchEvents ?? []).entries()) {
      object(event);
      const matches = d.tracks
        .map((track: Row, trackIndex: number) => ({ id: track.id, trackIndex }))
        .filter(
          (track: { id: unknown }) =>
            typeof track.id === 'string' &&
            typeof event.characterId === 'string' &&
            resolveLegacyOperator(track.id) === resolveLegacyOperator(event.characterId),
        );
      if (event.characterId !== undefined) {
        if (
          matches.length !== 1 ||
          (event.trackIndex !== undefined && event.trackIndex !== matches[0]!.trackIndex)
        ) {
          issues.push({
            path: `${prefix}.switchEvents[${index}]`,
            message: '切入目标不唯一、不存在或与轨道下标冲突',
          });
          delete event.trackIndex;
          continue;
        }
        event.trackIndex = matches[0]!.trackIndex;
      }
      if (
        !Number.isInteger(event.trackIndex) ||
        event.trackIndex < 0 ||
        event.trackIndex >= d.tracks.length
      ) {
        issues.push({
          path: `${prefix}.switchEvents[${index}]`,
          message: '切入标记缺少有效目标轨道',
        });
        delete event.trackIndex;
      }
    }
    for (const [ti, t] of d.tracks.entries()) {
      object(t);
      hydrateLegacyTrack(t, d, mappings, ti);
      const rawOperator = t.id;
      const oldOperator =
        typeof rawOperator === 'string' ? resolveLegacyOperator(rawOperator) : rawOperator;
      const mappedOperator = mappings.operators?.[oldOperator];
      if (mappedOperator) {
        identityChanges.push({
          path: prefix + '.tracks[' + ti + '].id',
          from: rawOperator,
          to: mappedOperator,
        });
        t.id = mappedOperator;
      }
      if (!Array.isArray(t.actions)) throw new Error('轨道缺少 actions 数组');
      for (const [ai, action] of t.actions.entries()) {
        object(action);
        delete action.convertedSource;
        delete action.convertedSequence;
        delete action.convertedDodge;
        const path = wrapper.id + '/' + ti + '/' + ai;
        if (isLegacyDodgeAction(oldOperator, action)) {
          // 旧块没有方向字段；向前是新版普通闪避标签的中性导入约定，不补极限闪避收益。
          action.convertedDodge = { direction: 'forward' };
          continue;
        }
        const identity = legacySkillIdentity(normalizeLegacySkill(oldOperator, action));
        const candidates = (mappings.skills?.[oldOperator] ?? []).filter(
          rule => JSON.stringify(legacySkillIdentity(rule.source)) === JSON.stringify(identity),
        );
        const historical =
          action.skillId === undefined && action.sourceSkillKey === undefined
            ? (mappings.historicalSkills ?? []).filter(
                rule =>
                  rule.operator === oldOperator &&
                  rule.id === action.id &&
                  rule.type === action.type &&
                  rule.segmentIndex ===
                    (action.segmentIndex ??
                      (action.type === 'link'
                        ? action.comboSegmentIndex
                        : action.attackSegmentIndex)) &&
                  action.variantKey === undefined,
              )
            : [];
        const guarded = (mappings.guardedActions ?? []).filter(
          rule =>
            rule.path === path &&
            rule.operator === oldOperator &&
            rule.instanceId === action.instanceId &&
            JSON.stringify(legacySkillIdentity(rule.source)) === JSON.stringify(identity),
        );
        if (guarded.length > 1 || (guarded.length && mappings.actions?.[path])) {
          issues.push({ path, message: '单动作映射不唯一' });
          continue;
        }
        const override = guarded[0]?.target ?? mappings.actions?.[path];
        const matches = [...candidates, ...historical];
        const target = override ?? (matches.length === 1 ? matches[0]!.target : undefined);
        if (target?.kind === 'operatorSkillSequence') action.convertedSequence = target;
        else if (target) action.convertedSource = target;
        else {
          issues.push({
            path,
            message: matches.length
              ? '技能映射不唯一'
              : `缺少显式技能映射${action.id ? `：${action.id}` : ''}`,
          });
          unresolvedSkills.push({ path, operator: oldOperator, source: identity });
        }
      }
    }
    for (const op of d.operators ?? []) {
      const target = mappings.operators?.[resolveLegacyOperator(op.operatorSlug)];
      if (target) op.operatorSlug = target;
    }
    for (const [collection, key, map] of [
      ['weapons', 'weaponSlug', mappings.weapons],
      ['gears', 'gearPieceId', mappings.gears],
    ] as const) {
      for (const [index, row] of (d[collection] ?? []).entries()) {
        const target = map?.[row[key]];
        if (target) {
          identityChanges.push({
            path: prefix + '.' + collection + '[' + index + '].' + key,
            from: row[key],
            to: target,
          });
          row[key] = target;
        }
      }
    }
    // 旧 timeSerialization.ts 明确按字段名保存时间。只遍历迁移消费的区域，
    // 不量化 hits、效果、面板等派生快照，也不经旧版毫秒显示值二次取整。
    function convert(row: Row, path: string) {
      for (const key of Object.keys(row)) {
        const value = row[key];
        if (!timeKeys.has(key) || value == null) continue;
        if (typeof value !== 'number' || !Number.isFinite(value))
          throw new Error(path + '.' + key + ': 非法时间');
        // 旧轴从战前准备开始计时，新轴以开战为 0；先平移源坐标再取整，
        // 不能用两个已经分别取整的时刻相减，否则奇数源帧会额外偏移一帧。
        const origin = [
          'startTime',
          'logicalStartTime',
          'simulationStartline',
          'simulationEndline',
          'time',
        ].includes(key)
          ? sourceOrigin
          : 0;
        const seconds = (value - origin) / sourceFps;
        const frame = Math.round(seconds * PROJECT_FPS);
        times.push({
          path: path + '.' + key,
          sourceValue: value,
          sourceFps,
          sourceOrigin: origin,
          frame,
          errorSeconds: frame / PROJECT_FPS - seconds,
        });
        row[key] = frame;
      }
    }
    convert(d, prefix);
    convert(constants, prefix + '.systemConstants');
    d.tracks.forEach((t: Row, ti: number) =>
      t.actions.forEach((a: Row, ai: number) =>
        convert(a, prefix + '.tracks[' + ti + '].actions[' + ai + ']'),
      ),
    );
    for (const key of ['cycleBoundaries', 'switchEvents'])
      (d[key] ?? []).forEach((row: Row, index: number) =>
        convert(row, prefix + '.' + key + '[' + index + ']'),
      );
  }
  return { source: root, issues, ignoredCustomizations, times, identityChanges, unresolvedSkills };
}
