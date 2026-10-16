import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import {
  isPartyHitBoxTargetGroup,
  isDynamicSingleEnemyTagTargetGroup,
  projectGameplayTags,
} from '../combatProjectionCommon.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { TimeScaleCurveKeyDefinition } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type { CompiledBuffStepSource } from './combatActionProjectionTypes.ts';

import type { TimeDilationCurveKeySource } from '../../source/timeDilationActions.ts';
import type { TargetGroupActionSource } from '../../source/targetGroup.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import { projectNativeTagQueryType } from '../../source/tagQuery.ts';
import { projectFinishOwner } from './timelineControlProjection.ts';
import {
  compileTargetGroupAbilityEntityQuerySource,
  compileTargetReferenceAbilityEntityQuerySource,
} from '../abilities/abilityEntityQuery.ts';
import {
  type ProjectedTargetGroup,
  type CombatActionProjectionContextSource,
  type CombatActionProjectionExtensionsSource,
  isEmptyStaticEnemyExclusionTargetGroup,
  isControlledOperatorInstantSearch,
  isOwnerSpawnedAbilityEntityInstantSearch,
  isStaticSingleEnemyOwnerAllyTargetGroup,
  isStaticExplicitBadFactionEnemyTargetGroup,
  isStaticSingleEnemyTargetGroup,
  isCurrentTargetRestrictedSingleEnemyTargetGroup,
  isZeroSpaceSingleEnemySmartTargetGroup,
  zeroDistanceValidatorsAlwaysPass,
  requireActionOwnerProjection,
  actionValueOperand,
  isPlainOwnerTarget,
} from '../combatProjectionCommon.ts';
import {
  compileActionNode,
  projectBuffAssignments,
  projectStringBuffAssignments,
} from './combatActionLeafProjection.ts';

/** 实体、时间膨胀、目标组和显式投射物扩展的叶子分派。
 * 本层按原顺序处理特殊分支，剩余动作委托普通叶子投影；目标组状态只沿调用返回。 */

/** 原生层保留整数；在输出边界检查契约可表达的权重模式，不断言、不截位或补默认值。 */
function projectTimeDilationCurveKeys(
  keys: readonly TimeDilationCurveKeySource[],
  sourcePath: string,
): readonly TimeScaleCurveKeyDefinition[] {
  return keys.map((key, index) => {
    const { weightedMode } = key;
    // AnimationCurveEvaluator：WeightedIn=1、WeightedOut=2，仅支持 0..3。
    if (weightedMode !== 0 && weightedMode !== 1 && weightedMode !== 2 && weightedMode !== 3) {
      throw new Error(
        `${sourcePath}.timeScaleCurve[${index}].weightedMode: unsupported value ${weightedMode}`,
      );
    }
    return { ...key, weightedMode };
  });
}

export function compileBuffLeafNode(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  visualOnlyIds: ReadonlySet<string>,
  partyTargetGroups: ReadonlyMap<string, ProjectedTargetGroup>,
  context: CombatActionProjectionContextSource,
  extensions: CombatActionProjectionExtensionsSource = {},
): {
  readonly steps: readonly CompiledBuffStepSource[];
  readonly state: ReadonlyMap<string, ProjectedTargetGroup>;
} {
  if (node.body.kind !== 'leaf') {
    throw new Error(`${node.sourcePath}: expected an action leaf`);
  }
  if (node.body.value.family === 'saveTransferredSource') {
    const action = node.body.value.action;
    if (action.contextKey === '') return { steps: [], state: partyTargetGroups };
    const nextGroups = new Map(partyTargetGroups);
    nextGroups.set(action.contextKey, 'runtimeTargets');
    return {
      steps: [
        {
          kind: 'saveTransferredSource',
          parameters: {
            source: projectActionTargetQuery(action.source, context, node.sourcePath),
            saveToContextKey: action.contextKey,
          },
        },
      ],
      state: nextGroups,
    };
  }
  if (node.body.value.family === 'skillSlotReplacement') {
    const compile = extensions.compileSkillSlotReplacement;
    if (compile !== undefined) {
      return {
        steps: compile(node.body.value.action, node.sourcePath, context),
        state: partyTargetGroups,
      };
    }
  }
  if (node.body.value.family === 'rayCastTargetGroup') {
    const action = node.body.value.action;
    const plainOwnerSource =
      action.source.targetSource === 'Owner' &&
      action.source.targetGroupKey === '' &&
      action.source.finderType === null &&
      action.source.validatorTypes.length === 0 &&
      action.source.postProcessorTypes.length === 0;
    const contextSpatialSource =
      action.source.targetSource === 'Context' &&
      action.source.targetGroupKey !== '' &&
      action.source.finderType === null &&
      action.source.validatorTypes.length === 0 &&
      action.source.postProcessorTypes.length === 0 &&
      (['abilityEntity', 'enemy', 'spatialPoint'].includes(
        partyTargetGroups.get(action.source.targetGroupKey) ?? '',
      ) ||
        context.staticAbilityEntityTargetGroupKeys?.has(action.source.targetGroupKey) === true);
    const fixedPointTarget =
      ((action.target.targetSource === 'Owner' && action.target.targetGroupKey === '') ||
        (action.target.targetSource === 'Target' &&
          action.target.targetGroupKey === '' &&
          (context.actionTargetTarget === 'enemy' ||
            (context.actionTargetTarget === 'actionInputTarget' &&
              context.actionInputIsZeroSpace === true))) ||
        (action.target.targetSource === 'Context' &&
          action.target.targetGroupKey === action.source.targetGroupKey &&
          contextSpatialSource)) &&
      action.target.finderType === 'FixedPointFinder' &&
      action.target.validatorTypes.length === 0 &&
      action.target.postProcessorTypes.length === 0;
    if (
      (context.actionOwnerTarget !== 'caster' &&
        context.actionOwnerTarget !== 'currentAbilityEntity' &&
        !(
          context.actionOwnerTarget === 'buffOwner' &&
          context.fixedBuffOwnerTarget === 'currentAbilityEntity'
        )) ||
      action.moveType !== 'PointToPoint' ||
      (!plainOwnerSource && !contextSpatialSource) ||
      !fixedPointTarget ||
      // 开启过滤时，当前只证明干员 Owner 的自动敌对阵营；不推断实体宿主的阵营。
      (action.useFaction && context.actionOwnerTarget !== 'caster') ||
      !action.autoSetTargetFaction ||
      action.containsUnMarkable ||
      action.factionTarget !== 'Anti' ||
      action.rayMaxLength <= 0 ||
      action.rayRadius < 0 ||
      action.raycastSegmentCount !== 0
    ) {
      throw new Error(
        `${node.sourcePath}: unsupported RayCastEffectAction stump projection ${JSON.stringify({
          actionOwnerTarget: context.actionOwnerTarget,
          fixedBuffOwnerTarget: context.fixedBuffOwnerTarget,
          plainOwnerSource,
          contextSpatialSource,
          fixedPointTarget,
          sourceGroup: partyTargetGroups.get(action.source.targetGroupKey),
          staticAbilityEntitySource: context.staticAbilityEntityTargetGroupKeys?.has(
            action.source.targetGroupKey,
          ),
        })}`,
      );
    }
    // The standard model contains one enemy and treats every range query as
    // finding every modeled instance. Native code clears both handles on each
    // tick and then writes the current ray hits, so this action establishes an
    // enemy group and a spatial hit-position group without a runtime geometry step.
    const nextGroups = new Map(partyTargetGroups);
    nextGroups.set(action.targetGroupKey, 'enemy');
    nextGroups.set(action.hitPosGroupKey, 'spatialPoint');
    return { steps: [], state: nextGroups };
  }
  if (node.body.value.family === 'lifecycle') {
    return {
      steps: [projectFinishOwner(node.body.value.action, context, node.sourcePath)],
      state: partyTargetGroups,
    };
  }
  if (node.body.value.family === 'projectile') {
    const target = node.body.value.action.target;
    if (
      target.targetSource === 'Context' &&
      target.targetGroupKey !== '' &&
      partyTargetGroups.get(target.targetGroupKey) === 'empty'
    ) {
      return { steps: [], state: partyTargetGroups };
    }
    const compile = extensions.compileProjectileLaunch;
    if (compile === undefined)
      throw new Error(`${node.sourcePath}: projectile launch projection is unavailable`);
    if (
      target.targetSource === 'Context' &&
      target.targetGroupKey !== '' &&
      (context.singleEnemyTargetGroupKeys?.has(target.targetGroupKey) === true ||
        partyTargetGroups.get(target.targetGroupKey) === 'dynamicEnemy') &&
      context.staticEnemyTargetGroupKeys?.has(target.targetGroupKey) !== true
    ) {
      // 标签筛选后的组可能为空。只在实际迭代体中证明目标是唯一敌人，
      // 不能把“至多一个敌人”升级成整条序列的“必有敌人”。
      const compiled = compile(node.body.value.action, node.sourcePath, {
        ...context,
        staticEnemyTargetGroupKeys: new Set([
          ...(context.staticEnemyTargetGroupKeys ?? []),
          target.targetGroupKey,
        ]),
        staticZeroSpaceTargetGroupKeys: new Set([
          ...(context.staticZeroSpaceTargetGroupKeys ?? []),
          target.targetGroupKey,
        ]),
      });
      return {
        steps: withProjectileTargets(compiled, {
          kind: 'context',
          contextKey: target.targetGroupKey,
        }),
        state: partyTargetGroups,
      };
    }
    if (
      node.body.value.action.callbacks.every(callback => !callback.enabled) &&
      target.targetSource === 'Context' &&
      target.targetGroupKey !== '' &&
      (partyTargetGroups.get(target.targetGroupKey) === 'abilityEntity' ||
        context.staticAbilityEntityTargetGroupKeys?.has(target.targetGroupKey) === true)
    ) {
      // 能力实体实例也位于零空间，但不能把目标组当作恰好一个目标。
      // 保留实际查询结果的基数：空组不发射，每个存活句柄各发射一次。
      const compiled = compile(node.body.value.action, node.sourcePath, {
        ...context,
        staticZeroSpaceTargetGroupKeys: new Set([
          ...(context.staticZeroSpaceTargetGroupKeys ?? []),
          target.targetGroupKey,
        ]),
      });
      return {
        steps: withProjectileTargets(compiled, {
          kind: 'context',
          contextKey: target.targetGroupKey,
        }),
        state: partyTargetGroups,
      };
    }
    const targetIsEnemy =
      target.targetSource === 'Context' &&
      target.targetGroupKey !== '' &&
      partyTargetGroups.get(target.targetGroupKey) === 'enemy';
    const targetIsSpatialPoint =
      target.targetSource === 'Context' &&
      target.targetGroupKey !== '' &&
      partyTargetGroups.get(target.targetGroupKey) === 'spatialPoint';
    const compiled = compile(
      node.body.value.action,
      node.sourcePath,
      targetIsEnemy || targetIsSpatialPoint
        ? {
            ...context,
            staticEnemyTargetGroupKeys: new Set([
              ...(context.staticEnemyTargetGroupKeys ?? []),
              ...(targetIsEnemy ? [target.targetGroupKey] : []),
            ]),
            staticZeroSpaceTargetGroupKeys: new Set([
              ...(context.staticZeroSpaceTargetGroupKeys ?? []),
              target.targetGroupKey,
            ]),
          }
        : context,
    );
    const usesPointGroup =
      target.targetSource === 'Context' &&
      context.randomPointTargetGroupKeys?.has(target.targetGroupKey) === true;
    return {
      steps: usesPointGroup
        ? withProjectileTargets(compiled, { kind: 'context', contextKey: target.targetGroupKey })
        : compiled,
      state: partyTargetGroups,
    };
  }
  if (node.body.value.family === 'globalBuff') {
    const compile = extensions.compileGlobalBuffAction;
    if (compile === undefined)
      throw new Error(`${node.sourcePath}: GlobalBuff projection is unavailable`);
    return {
      steps: compile(node.body.value.action, node.sourcePath, context),
      state: partyTargetGroups,
    };
  }
  if (node.body.value.family === 'skillSetting') {
    const compile = extensions.compileSkillSettingRead;
    if (compile === undefined)
      throw new Error(`${node.sourcePath}: SkillSetting projection is unavailable`);
    return {
      steps: compile(node.body.value.action, node.sourcePath, context),
      state: partyTargetGroups,
    };
  }
  if (node.body.value.family === 'abilityEntity') {
    const action = node.body.value.action;
    // 当前 1.6.3 消费者均关闭这些新增分支；来源完整保留，启用时不能静默裁剪。
    if (
      action.dieWhenTargetDies ||
      action.attachWeaponModel ||
      action.readFullPotentialExtraEffect ||
      (action.weaponIndex !== undefined && action.weaponIndex !== 0)
    ) {
      throw new Error(
        `${node.sourcePath}: enabled target-death or weapon SpawnAbilityEntity options require native projection`,
      );
    }
    const bornAt = projectActionTargetQuery(action.bornAt, context, `${node.sourcePath}.bornAt`);
    const sourceIsCaster =
      action.sourceType === 'ActionSource' ||
      (action.sourceType === 'ActionOwner' &&
        (requireActionOwnerProjection(context, node.sourcePath) === 'caster' ||
          (context.actionOwnerTarget === 'buffOwner' &&
            context.fixedBuffOwnerTarget === 'caster')));
    const sourceIsCurrentAbilityEntity =
      action.sourceType === 'ActionOwner' &&
      (requireActionOwnerProjection(context, node.sourcePath) === 'currentAbilityEntity' ||
        (context.actionOwnerTarget === 'buffOwner' &&
          context.fixedBuffOwnerTarget === 'currentAbilityEntity'));
    const sourceContextKey =
      action.sourceType === 'ContextTarget' && action.sourceContextKey !== ''
        ? action.sourceContextKey
        : undefined;
    const sourceIsInput = action.sourceType === 'CurrentTarget';
    const targetIsEnemy =
      action.setTarget &&
      action.target.finderType === null &&
      action.target.validatorTypes.length === 0 &&
      action.target.postProcessorTypes.length === 0 &&
      ((action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
        (action.target.targetSource === 'Owner' &&
          action.target.targetGroupKey === '' &&
          context.actionOwnerTarget === 'buffOwner' &&
          context.fixedBuffOwnerTarget === 'enemy') ||
        (action.target.targetSource === 'Context' &&
          action.target.targetGroupKey !== '' &&
          (partyTargetGroups.get(action.target.targetGroupKey) === 'enemy' ||
            (!partyTargetGroups.has(action.target.targetGroupKey) &&
              context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true))));
    const targetIsInput =
      action.setTarget &&
      action.target.targetSource === 'Target' &&
      context.actionTargetTarget === 'actionInputTarget';
    const contextTargetKey =
      action.setTarget &&
      action.target.targetSource === 'Context' &&
      // Context 读取已有句柄；只有 InstantSearch 执行序列化的 selectorData。
      action.target.targetGroupKey !== ''
        ? action.target.targetGroupKey
        : undefined;
    const targetIsCaster =
      action.setTarget &&
      action.target.finderType === null &&
      action.target.validatorTypes.length === 0 &&
      action.target.postProcessorTypes.length === 0 &&
      ((action.target.targetSource === 'Source' &&
        action.target.targetGroupKey === '' &&
        context.actionSourceTarget === 'caster') ||
        (action.target.targetSource === 'Owner' &&
          (context.actionOwnerTarget === 'caster' ||
            (context.actionOwnerTarget === 'buffOwner' &&
              context.fixedBuffOwnerTarget === 'caster'))));
    const targetIsCurrentAbilityEntity =
      action.setTarget &&
      action.target.targetSource === 'Owner' &&
      action.target.finderType === null &&
      action.target.validatorTypes.length === 0 &&
      action.target.postProcessorTypes.length === 0 &&
      (context.actionOwnerTarget === 'currentAbilityEntity' ||
        (context.actionOwnerTarget === 'buffOwner' &&
          context.fixedBuffOwnerTarget === 'currentAbilityEntity'));
    const targetIsSpatialPoint =
      action.setTarget &&
      action.target.targetSource === 'Context' &&
      action.target.targetGroupKey !== '' &&
      partyTargetGroups.get(action.target.targetGroupKey) === 'spatialPoint' &&
      action.target.finderType === null &&
      action.target.validatorTypes.length === 0 &&
      action.target.postProcessorTypes.length === 0;
    const targetQuery =
      action.setTarget &&
      contextTargetKey === undefined &&
      !targetIsEnemy &&
      !targetIsCaster &&
      !targetIsInput &&
      !targetIsCurrentAbilityEntity
        ? projectActionTargetQuery(action.target, context, `${node.sourcePath}.abilityEntityTarget`)
        : undefined;
    // SpawnAbilityEntity 的开关只决定子技能 SaveTarget 保存首项还是全部。
    // 无目标/无子技能时不产生差异；既有投影已证明的单一敌人、施术者或当前实体也等价。
    // 空间点组可能有多项，不能把“零空间”误当“只有一个输入目标”。
    if (
      action.allowMultiInputTarget &&
      action.setTarget &&
      action.skillId !== '' &&
      !targetIsEnemy &&
      !targetIsCaster &&
      !targetIsInput &&
      !targetIsCurrentAbilityEntity
    ) {
      throw new Error(
        `${node.sourcePath}.allowMultiInputTarget: child skill input is not a proven singleton`,
      );
    }
    const disabledAssignmentsArePlaceholders =
      !action.assignEntityBlackboard &&
      action.assignments.every(
        assignment =>
          assignment.targetKey === '' &&
          assignment.inputValueKey === '' &&
          !assignment.useDirectValue &&
          assignment.valueType === 'Numeric' &&
          assignment.numericValue === 0 &&
          assignment.stringValue === '',
      );
    const assignmentShapeMatches = action.assignEntityBlackboard
      ? action.assignments.every(item => item.targetKey !== '')
      : disabledAssignmentsArePlaceholders;
    const enabledAssignments = action.assignEntityBlackboard ? action.assignments : [];
    const assignments = projectBuffAssignments(enabledAssignments, node.sourcePath);
    const stringAssignments = projectStringBuffAssignments(enabledAssignments);
    if (
      !action.setSource ||
      (!sourceIsCaster &&
        !sourceIsCurrentAbilityEntity &&
        !sourceIsInput &&
        sourceContextKey === undefined) ||
      (action.setTarget &&
        !targetIsEnemy &&
        !targetIsCaster &&
        !targetIsInput &&
        contextTargetKey === undefined &&
        targetQuery === undefined &&
        !targetIsCurrentAbilityEntity &&
        !targetIsSpatialPoint) ||
      action.checkNavmeshAreaName ||
      action.forbiddenAreaNames.length !== 0 ||
      !assignmentShapeMatches ||
      action.saveToContext !== (action.contextKey !== '')
    )
      throw new Error(
        `${node.sourcePath}: unsupported AbilityEntity spawn projection ` +
          JSON.stringify({
            setSource: action.setSource,
            sourceIsCaster,
            sourceIsCurrentAbilityEntity,
            sourceContextKey: action.sourceContextKey,
            setTarget: action.setTarget,
            targetIsEnemy,
            targetIsCaster,
            targetIsCurrentAbilityEntity,
            targetIsSpatialPoint,
            checkNavmeshAreaName: action.checkNavmeshAreaName,
            forbiddenAreaNameCount: action.forbiddenAreaNames.length,
            assignmentShapeMatches,
            assignBlackboard: action.assignBlackboard,
            overrideDuration: action.overrideDuration,
            durationBlackboardKey: action.duration.blackboardKey,
            durationValue: action.duration.value,
            saveContextShapeMatches: action.saveToContext === (action.contextKey !== ''),
            pauseEffectOnEnd: action.pauseEffectOnEnd,
            inheritSourceSkillCastId: action.inheritSourceSkillCastId,
            dieWhenSourceDies: action.dieWhenSourceDies,
            dieOnEnd: action.dieOnEnd,
          }),
      );
    // 1.4.4 SpawnAbilityEntity.OnEnd (RVA 0x03F52450) 对 pauseEffectOnEnd
    // 与 dieOnEnd 走两条独立分支：前者只调用已生成实体的特效暂停接口，
    // 后者才结束逻辑实体。Next 无渲染后端因而完整保留来源事实，
    // 但不为 pauseEffectOnEnd 生成战斗步骤；dieOnEnd 由 finishByAction 保留。
    // SpawnAbilityEntity.ExecuteInternal：只有 overrideDuration=true 才求值
    // duration；关闭时其中的字面值/黑板键是未选中的序列化残留。Target 与原生公共解析器一致，
    // 不读取序列化 targetGroupKey。出生位置、挂点和旋转均已
    // 由来源 IR 严格保留；零空间模型只保留实体身份、
    // 技能与黑板继承。带区域准入检查的生成仍可能改变“是否出生”，不能在此省略。
    const nextGroups = new Map(partyTargetGroups);
    if (action.saveToContext) nextGroups.set(action.contextKey, 'abilityEntity');
    const spawnStep = {
      kind: 'spawnAbilityEntity' as const,
      parameters: {
        bornAt,
        abilityEntityId: action.abilityEntityId,
        ...(action.skillId.length === 0 ? {} : { childSkillId: action.skillId }),
        ...(sourceIsCurrentAbilityEntity ? { source: 'currentAbilityEntity' as const } : {}),
        ...(sourceIsInput ? { source: { kind: 'inputTarget' as const } } : {}),
        ...(sourceContextKey === undefined
          ? {}
          : { source: { kind: 'context' as const, key: sourceContextKey } }),
        inheritActionBlackboard: action.assignBlackboard,
        ...(action.inheritSourceSkillCastId ? {} : { inheritSourceSkillCastInfo: false }),
        dieWhenSourceDies: action.dieWhenSourceDies,
        ...(action.dieOnEnd ? { finishByAction: true } : {}),
        ...(contextTargetKey !== undefined
          ? { target: { kind: 'context' as const, key: contextTargetKey } }
          : targetQuery !== undefined
            ? { target: targetQuery }
            : targetIsInput
              ? { target: 'actionInputTarget' as const }
              : targetIsEnemy
                ? { target: 'enemy' as const }
                : targetIsCaster
                  ? { target: 'caster' as const }
                  : targetIsCurrentAbilityEntity
                    ? { target: 'currentAbilityEntity' as const }
                    : {}),
        ...(action.overrideDuration
          ? { overrideDurationSeconds: actionValueOperand(action.duration) }
          : {}),
        ...(action.saveToContext ? { saveToContextKey: action.contextKey } : {}),
        ...(Object.keys(assignments).length === 0 ? {} : { blackboardAssignments: assignments }),
        ...(Object.keys(stringAssignments).length === 0
          ? {}
          : { stringBlackboardAssignments: stringAssignments }),
      },
    };
    return {
      steps: [spawnStep],
      state: nextGroups,
    };
  }
  if (node.body.value.family === 'abilityEntityDuration') {
    const action = node.body.value.action;
    if (
      !action.setMultipleTargets &&
      action.actionTargetType === 'InputTarget' &&
      action.targetContextKey === '' &&
      action.operation === 'Assign' &&
      context.actionTargetTarget === 'currentAbilityEntity'
    ) {
      return {
        steps: [
          {
            kind: 'setAbilityEntityRemainingDuration',
            parameters: {
              target: { kind: 'inputTarget' },
              value: actionValueOperand(action.value),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      action.setMultipleTargets ||
      action.actionTargetType !== 'ContextTarget' ||
      action.operation !== 'Assign' ||
      action.target.targetSource !== 'Target' ||
      action.target.targetGroupKey !== '' ||
      action.target.finderType !== null ||
      action.target.validatorTypes.length !== 0 ||
      action.target.postProcessorTypes.length !== 0 ||
      partyTargetGroups.get(action.targetContextKey) !== 'abilityEntity'
    )
      throw new Error(`${node.sourcePath}: unsupported AbilityEntity duration projection`);
    return {
      steps: [
        {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: {
            target: { kind: 'context', key: action.targetContextKey },
            value: actionValueOperand(action.value),
          },
        },
      ],
      state: partyTargetGroups,
    };
  }
  if (node.body.value.family === 'abilityEntityTarget') {
    const target = node.body.value.action.target;
    if (
      context.actionOwnerTarget !== 'currentAbilityEntity' ||
      context.actionTargetTarget !== 'enemy' ||
      target.targetSource !== 'Target' ||
      target.targetGroupKey !== '' ||
      target.finderType !== null ||
      target.validatorTypes.length !== 0 ||
      target.postProcessorTypes.length !== 0 ||
      target.priorityFilters.length !== 0 ||
      target.shuffleTargets.length !== 0 ||
      target.distanceValidators.length !== 0
    ) {
      throw new Error(`${node.sourcePath}: unsupported AbilityEntity target mutation`);
    }
    // SetAbilityEntityTarget 把输入 Target 的独立副本写回当前
    // AbilityEntityController。Endaxis 只有一个敌人实例，当前输入与后续 Finder 都已严格投影为
    // 同一 enemy，故这次赋值不改变可观察目标身份；不向其他目标形状推广该省略。
    return { steps: [], state: partyTargetGroups };
  }
  if (node.body.value.family === 'interrupt') {
    const action = node.body.value.action;
    const defenderIsEnemy =
      (action.defender.targetSource === 'Target' &&
        (context.actionTargetTarget === 'enemy' ||
          (context.actionTargetTarget === 'actionInputTarget' &&
            action.overrideSuperArmorLimit === -1) ||
          (context.actionTargetTarget === 'buffOwner' &&
            context.fixedBuffOwnerTarget === 'enemy'))) ||
      (action.defender.targetSource === 'Context' &&
        (context.staticEnemyTargetGroupKeys?.has(action.defender.targetGroupKey) === true ||
          partyTargetGroups.get(action.defender.targetGroupKey) === 'enemy')) ||
      (action.defender.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy');
    if (
      (context.actionSourceTarget !== 'caster' && context.fixedBuffSourceTarget !== 'caster') ||
      action.attacker.targetSource !== 'Source' ||
      !defenderIsEnemy
    )
      throw new Error(`${node.sourcePath}: unsupported InterruptAction stump projection`);
    // 玩家伤害模型不模拟敌方主动行为及受击硬直。投射物命中输入保留真实身份，
    // 不能为了省略敌方控制而把整个回调目标改成 enemy。当前墨魂模板初始霸体 50，
    // 高于这里使用的默认中断门槛 20；不将 InterruptAction 映射为无条件结束子技能。
    // 此省略不代表通用能力实体已实现受击硬直或完整的霸体判定。
    return { steps: [], state: partyTargetGroups };
  }
  if (node.body.value.family === 'stumpControl') {
    const action = node.body.value.action;
    if (action.kind === 'launchUpward') {
      const sourceIsCaster =
        (action.source.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (action.source.targetSource === 'Owner' &&
          (context.actionOwnerTarget === 'caster' ||
            context.actionOwnerTarget === 'currentAbilityEntity'));
      const targetIsEnemy =
        (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
        (action.target.targetSource === 'Context' &&
          (context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true ||
            context.singleEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true ||
            partyTargetGroups.get(action.target.targetGroupKey) === 'enemy'));
      if (
        !sourceIsCaster ||
        !targetIsEnemy ||
        action.deadOption !== 'AllValid' ||
        action.returnTrueWhen !== 'Always'
      ) {
        throw new Error(`${node.sourcePath}: unsupported LaunchUpward stump projection`);
      }
      // LaunchUpwardAction 直接进入敌人的控制/空间状态，
      // 不经过 AirborneAction 的破防、状态 Buff 或物理异常事件链。Always 使控制结果
      // 不改变后续序列分支；固定木桩不模拟位移、受控生命周期和原生特效。
      return { steps: [], state: partyTargetGroups };
    }
    if (action.kind === 'takeDown') {
      const sourceIsCaster =
        (action.source.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (action.source.targetSource === 'Owner' &&
          (context.actionOwnerTarget === 'caster' ||
            context.actionOwnerTarget === 'currentAbilityEntity'));
      const targetIsEnemy =
        (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
        (action.target.targetSource === 'Context' &&
          (context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true ||
            partyTargetGroups.get(action.target.targetGroupKey) === 'enemy'));
      if (!sourceIsCaster || !targetIsEnemy || action.deadOption !== 'AllValid') {
        throw new Error(`${node.sourcePath}: unsupported TakeDown stump projection`);
      }
      // TakeDownAction 进入敌人的受控动画状态机，不产生伤害、
      // 资源或物理异常事件。固定木桩没有主动/受控行为，邻接数值动作仍按原序执行。
      return { steps: [], state: partyTargetGroups };
    }
    if (
      action.kind === 'targetHitStop' &&
      action.affectType === 'OnlyTarget' &&
      ((action.target.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        isControlledOperatorInstantSearch(action.target))
    ) {
      const priority = extensions.resolveTimeDilationPriority?.(
        action.priorityTagId,
        node.sourcePath,
      );
      if (priority === undefined || !Number.isFinite(priority)) {
        throw new Error(`${node.sourcePath}: unsupported source-target hit-stop priority`);
      }
      const target = isControlledOperatorInstantSearch(action.target)
        ? ('controlled' as const)
        : ('caster' as const);
      // Source 分支直接解析技能施放者，MainCharacterValidator 则唯一确定主控干员。
      // 这类停顿作用于玩家技能时间，不能按敌方 OnlyTarget 路径省略。
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: action.durationSeconds },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority,
              curve:
                action.directCurveKeys.length > 0
                  ? {
                      kind: 'inline',
                      keys: projectTimeDilationCurveKeys(action.directCurveKeys, node.sourcePath),
                    }
                  : { kind: 'named', key: action.curveKey },
              finishByAction: false,
              targets: [target],
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      action.kind === 'targetHitStop' &&
      action.affectType === 'OnlyTarget' &&
      action.target.targetSource === 'Context' &&
      action.target.targetGroupKey !== '' &&
      (partyTargetGroups.get(action.target.targetGroupKey) === 'abilityEntity' ||
        context.staticAbilityEntityTargetGroupKeys?.has(action.target.targetGroupKey) === true)
    ) {
      const priority = extensions.resolveTimeDilationPriority?.(
        action.priorityTagId,
        node.sourcePath,
      );
      if (priority === undefined || !Number.isFinite(priority)) {
        throw new Error(`${node.sourcePath}: unsupported AbilityEntity hit-stop priority`);
      }
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: action.durationSeconds },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority,
              curve:
                action.directCurveKeys.length > 0
                  ? {
                      kind: 'inline',
                      keys: projectTimeDilationCurveKeys(action.directCurveKeys, node.sourcePath),
                    }
                  : { kind: 'named', key: action.curveKey },
              finishByAction: false,
              targets: [],
              abilityEntityTargets: [{ kind: 'context', contextKey: action.target.targetGroupKey }],
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (action.kind === 'targetHitStop' && action.affectType !== 'OnlyTarget') {
      const attackerContextQuery =
        action.source.targetSource === 'Context' ||
        (action.source.targetSource === 'Owner' &&
          context.actionOwnerTarget === 'buffOwner' &&
          context.fixedBuffOwnerTarget === undefined)
          ? projectActionTargetQuery(action.source, context, `${node.sourcePath}.attacker`)
          : undefined;
      const attackerIsCaster =
        (action.source.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (action.source.targetSource === 'Owner' && context.actionOwnerTarget === 'caster');
      const attackerIsMainCharacter =
        action.source.targetSource === 'MainCharacter' && action.source.targetGroupKey === '';
      const attackerIsCurrentAbilityEntity =
        action.source.targetSource === 'Owner' &&
        action.source.targetGroupKey === '' &&
        (context.actionOwnerTarget === 'currentAbilityEntity' ||
          (context.actionOwnerTarget === 'buffOwner' &&
            context.fixedBuffOwnerTarget === 'currentAbilityEntity'));
      const attackerIsEnemy =
        action.source.targetSource === 'Owner' &&
        action.source.targetGroupKey === '' &&
        context.actionOwnerTarget === 'buffOwner' &&
        context.fixedBuffOwnerTarget === 'enemy';
      const targetIsEnemy =
        action.target.targetSource === 'Target' ||
        (action.target.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy') ||
        (action.target.targetSource === 'Context' &&
          (context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true ||
            context.singleEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true ||
            partyTargetGroups.get(action.target.targetGroupKey) === 'enemy'));
      const targetIsAbilityEntity =
        action.target.targetSource === 'Context' &&
        (partyTargetGroups.get(action.target.targetGroupKey) === 'abilityEntity' ||
          context.staticAbilityEntityTargetGroupKeys?.has(action.target.targetGroupKey) === true);
      const targetIsRuntimeContext =
        action.target.targetSource === 'Context' && !targetIsEnemy && !targetIsAbilityEntity;
      const priority = extensions.resolveTimeDilationPriority?.(
        action.priorityTagId,
        node.sourcePath,
      );
      if (
        attackerIsEnemy &&
        (action.affectType === 'OnlyAttacker' || (action.affectType === 'Both' && targetIsEnemy))
      ) {
        // Buff Owner 与目标都严格落在唯一敌人上；木桩没有主动动作时间轴，敌方局部停顿
        // 不改变玩家技能、伤害或资源账本。
        return { steps: [], state: partyTargetGroups };
      }
      if (
        (!attackerIsCaster &&
          !attackerIsMainCharacter &&
          !attackerIsCurrentAbilityEntity &&
          attackerContextQuery === undefined) ||
        (action.affectType === 'Both' &&
          !targetIsEnemy &&
          !targetIsAbilityEntity &&
          !targetIsRuntimeContext) ||
        priority === undefined ||
        !Number.isFinite(priority)
      )
        throw new Error(
          `${node.sourcePath}: unsupported attacker hit-stop projection ${JSON.stringify({
            attackerIsCaster,
            attackerIsMainCharacter,
            attackerIsCurrentAbilityEntity,
            targetIsEnemy,
            affectType: action.affectType,
            priority,
            targetGroupKey: action.target.targetGroupKey,
            staticEnemy: context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey),
            singleEnemy: context.singleEnemyTargetGroupKeys?.has(action.target.targetGroupKey),
            runtimeTargetKind: partyTargetGroups.get(action.target.targetGroupKey),
          })}`,
        );
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: action.durationSeconds },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority,
              curve:
                action.directCurveKeys.length > 0
                  ? {
                      kind: 'inline',
                      keys: projectTimeDilationCurveKeys(action.directCurveKeys, node.sourcePath),
                    }
                  : { kind: 'named', key: action.curveKey },
              finishByAction: false,
              targets: [
                ...(attackerContextQuery === undefined ? [] : [attackerContextQuery]),
                ...(action.affectType === 'Both' && targetIsEnemy ? ['enemy' as const] : []),
                ...(action.affectType === 'Both' && targetIsRuntimeContext
                  ? [{ kind: 'context' as const, key: action.target.targetGroupKey }]
                  : []),
                ...(attackerIsCaster ? ['caster' as const] : []),
                ...(attackerIsMainCharacter ? ['controlled' as const] : []),
              ],
              ...(attackerIsCurrentAbilityEntity ||
              (action.affectType === 'Both' && targetIsAbilityEntity)
                ? {
                    abilityEntityTargets: [
                      ...(attackerIsCurrentAbilityEntity ? [{ kind: 'current' as const }] : []),
                      ...(action.affectType === 'Both' && targetIsAbilityEntity
                        ? [{ kind: 'context' as const, contextKey: action.target.targetGroupKey }]
                        : []),
                    ],
                  }
                : {}),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      (action.kind === 'enemyHurtAnimation' || action.kind === 'pushBack') &&
      action.target.targetSource === 'Context' &&
      partyTargetGroups.get(action.target.targetGroupKey) === 'empty'
    )
      return { steps: [], state: partyTargetGroups };
    const targetIsEnemy =
      action.target.targetSource === 'Target' ||
      (action.target.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy') ||
      (action.target.targetSource === 'Context' &&
        (context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true ||
          partyTargetGroups.get(action.target.targetGroupKey) === 'enemy'));
    const sourceIsKnownStatic =
      (action.source.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
      (action.source.targetSource === 'Owner' &&
        (context.actionOwnerTarget === 'caster' ||
          context.actionOwnerTarget === 'currentAbilityEntity' ||
          context.fixedBuffOwnerTarget === 'currentAbilityEntity'));
    // EnemyHurtAnimAction 只驱动敌方受击组件（部位会先取主体），不把动态目标组
    // 改写为敌人。沿用木桩受击/位移裁剪；此豁免不适用于 HitStop 或其他控制动作。
    const runtimeEnemyHurtAnimation =
      action.kind === 'enemyHurtAnimation' &&
      action.target.targetSource === 'Context' &&
      partyTargetGroups.get(action.target.targetGroupKey) === 'runtimeTargets';
    // 受击表现、拉拽、推退和 BlowOffAction 只改变目标的动画/空间状态；固定木桩的距离恒为零，
    // 因而其空间来源点不进入任何可见账本。BlowOffEnemy 属于独立物理异常链，
    // 仍保留来源身份和死亡过滤的严格门槛。
    if (
      (!sourceIsKnownStatic && action.kind === 'blowOffEnemy') ||
      (!targetIsEnemy && !runtimeEnemyHurtAnimation)
    )
      throw new Error(`${node.sourcePath}: unsupported static-enemy control projection`);
    // Pull 的普通失败返回 alwaysNext；true 明确保留后继，false 沿用已证明唯一敌人的
    // 既有处理路径。这里只省略位移，不删除兄弟动作，也不把 Pull 当作可求值的条件。
    // 返回值被 Not/IfElse 消费时仍由公共条件编译拒绝，不能扩展成任意目标恒真。
    if (action.kind === 'blowOffEnemy' && action.deadOption !== 'OnlyDead')
      throw new Error(
        `${node.sourcePath}: live-target BlowOffEnemy physical infliction is not projected`,
      );
    // 木桩无主动行为，且 Endaxis 距离恒为零；受击动画、拉拽、BlowOffAction 和 OnlyTarget hit-stop
    // 均不改变玩家动作、伤害或资源账本。OnlyDead 的吹飞只在敌人已经死亡后进入 Process；
    // 标准木桩的死亡是数值终止边界，不继续执行可能产生的新伤害链。
    return { steps: [], state: partyTargetGroups };
  }
  if (node.body.value.family === 'castingControl') {
    if (context.actionSourceTarget !== 'caster')
      throw new Error(`${node.sourcePath}: unsupported ChannelingCastingAction owner`);
    // 原生动作只在自身区间持有禁止切人/回中/再次施法的句柄及同寿命标记 Buff。
    // Endaxis 直接安排现实时间操作，当前技能自身的占用区间已覆盖该限制；没有黑板或战斗输出。
    return { steps: [], state: partyTargetGroups };
  }
  if (node.body.value.family === 'timeDilation') {
    const action = node.body.value.action;
    if (action.kind === 'sealTimeDilation') {
      if (
        action.attacker.targetSource !== 'Source' ||
        action.attacker.finderType !== null ||
        action.attacker.validatorTypes.length !== 0 ||
        action.attacker.postProcessorTypes.length !== 0 ||
        action.target.targetSource !== 'Owner' ||
        action.target.finderType !== null ||
        action.target.validatorTypes.length !== 0 ||
        action.target.postProcessorTypes.length !== 0 ||
        context.fixedBuffOwnerTarget !== 'enemy' ||
        (action.useDirectCurve ? action.inlineCurveKeys.length === 0 : action.curveKey.length === 0)
      )
        throw new Error(`${node.sourcePath}: unsupported SealAction projection`);
      // SealAction 只给敌方实体创建局部时间膨胀 handle。唯一木桩没有主动行为；该倍率不改变
      // 玩家现实时间技能安排、命中伤害或资源，因此在固定木桩模型中没有可见输出。
      return { steps: [], state: partyTargetGroups };
    }
    if (action.kind === 'setIgnoreGlobalTimeScale') {
      const currentTargets =
        context.actionOwnerTarget === 'currentAbilityEntity' && isPlainOwnerTarget(action.target)
          ? ([{ kind: 'current' as const }] as const)
          : null;
      const contextTargets =
        action.target.targetSource !== 'Context' ||
        action.target.targetGroupKey === '' ||
        action.target.finderType !== null ||
        action.target.validatorTypes.length !== 0 ||
        action.target.postProcessorTypes.length !== 0 ||
        partyTargetGroups.get(action.target.targetGroupKey) !== 'abilityEntity'
          ? null
          : ([{ kind: 'context' as const, contextKey: action.target.targetGroupKey }] as const);
      const ownerSpawnedQuery =
        contextTargets === null &&
        action.target.targetSource === 'InstantSearch' &&
        action.target.finderType === 'OwnerSpawnedEntityFinder' &&
        action.target.finderSpawnedObjectType === 'AbilityEntity' &&
        action.target.validatorTypes.length > 0 &&
        action.target.validatorTypes.every(type => type === 'TagValidator') &&
        action.target.postProcessorTypes.length === 0 &&
        context.actionOwnerTarget === 'caster' &&
        context.abilityEntityQueries !== undefined
          ? compileTargetReferenceAbilityEntityQuerySource(
              action.target,
              context.abilityEntityQueries.catalog,
              context.abilityEntityQueries.gameplayTagRegistry,
              `${node.sourcePath}.target`,
            )
          : null;
      const ownerSpawnedTargets =
        ownerSpawnedQuery !== null &&
        ownerSpawnedQuery.objectFilter === 'abilityEntity' &&
        ownerSpawnedQuery.owner.kind === 'actionOwner' &&
        ownerSpawnedQuery.postProcessors.length === 0 &&
        ownerSpawnedQuery.validators.every(validator => validator.kind === 'tag') &&
        ownerSpawnedQuery.candidateTemplateIds.length > 0
          ? ([
              {
                kind: 'ownerSpawned' as const,
                abilityEntityIds: ownerSpawnedQuery.candidateTemplateIds,
              },
            ] as const)
          : null;
      if (currentTargets === null && contextTargets === null && ownerSpawnedTargets === null) {
        throw new Error(`${node.sourcePath}: unsupported global-time-scale ignore target`);
      }
      return {
        steps: [
          {
            kind: 'setIgnoreGlobalTimeScale',
            parameters: {
              abilityEntityTargets: currentTargets ?? contextTargets ?? ownerSpawnedTargets!,
              ignore: action.ignoreGlobalTimeScale,
              revertOnEnd: action.revertOnEnd,
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (action.kind === 'ultimateTimeDilation') {
      const priority = extensions.resolveTimeDilationPriority?.(
        action.priorityTagId,
        node.sourcePath,
      );
      const ignoredAbilityEntityTargets = action.ignoreTargets.map((target, index) => {
        if (
          target.targetSource !== 'Context' ||
          target.targetGroupKey === '' ||
          target.finderType !== null ||
          target.validatorTypes.length !== 0 ||
          target.postProcessorTypes.length !== 0 ||
          partyTargetGroups.get(target.targetGroupKey) !== 'abilityEntity'
        ) {
          throw new Error(
            `${node.sourcePath}.ignoreTargets[${index}]: expected a proven AbilityEntity Context`,
          );
        }
        return { kind: 'context' as const, contextKey: target.targetGroupKey };
      });
      if (
        priority === undefined ||
        !Number.isFinite(priority) ||
        !Number.isFinite(action.timeScale) ||
        action.timeScale < 0
      )
        throw new Error(`${node.sourcePath}: unsupported ultimate time-dilation projection`);
      return {
        steps: [
          {
            kind: 'startUltimateTimeDilation',
            parameters: {
              priority,
              targetScale: { kind: 'constant', value: action.timeScale },
              ignoredTargets: [],
              ...(ignoredAbilityEntityTargets.length === 0 ? {} : { ignoredAbilityEntityTargets }),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    const priority = extensions.resolveTimeDilationPriority?.(
      action.priorityTagId,
      node.sourcePath,
    );
    if (priority === undefined || !Number.isFinite(priority))
      throw new Error(`${node.sourcePath}: unsupported time-dilation cooldown/priority projection`);
    if (action.layer === 'Entity') {
      if (action.useTimeScaleForSkillCooldownTick)
        throw new Error(`${node.sourcePath}: entity time dilation cannot influence skill cooldown`);
      const target = action.effectTargets[0];
      const source = action.effectTargets[1];
      const ownerSpawnedAbilityEntities =
        action.effectTargets.length === 1 &&
        target !== undefined &&
        isOwnerSpawnedAbilityEntityInstantSearch(target) &&
        (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster');
      const currentAbilityEntity =
        action.effectTargets.length === 1 &&
        target?.targetSource === 'Owner' &&
        target.targetGroupKey === '' &&
        context.actionOwnerTarget === 'currentAbilityEntity';
      // Owner 直接由动作环境解析；部分原始 Buff 会残留仅供 Context 分支使用的 group key。
      // 该字段不参与 Owner 解析，不能因此把已知 Buff 宿主降成未知目标。
      const targets =
        action.effectTargets.length === 1 && target?.targetSource === 'Owner'
          ? context.fixedBuffOwnerTarget === 'enemy'
            ? (['enemy'] as const)
            : context.fixedBuffOwnerTarget === undefined ||
                context.fixedBuffOwnerTarget === 'caster'
              ? (['caster'] as const)
              : null
          : action.effectTargets.length === 1 &&
              target?.targetSource === 'Target' &&
              context.actionTargetTarget === 'enemy'
            ? (['enemy'] as const)
            : action.effectTargets.length === 2 &&
                (target?.targetSource === 'Target' ||
                  (target?.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy')) &&
                ((source?.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
                  (source?.targetSource === 'Owner' && context.actionOwnerTarget === 'caster'))
              ? (['enemy', 'caster'] as const)
              : action.effectTargets.length === 2 &&
                  target?.targetSource === 'Context' &&
                  target.targetGroupKey !== '' &&
                  (context.staticEnemyTargetGroupKeys?.has(target.targetGroupKey) === true ||
                    context.singleEnemyTargetGroupKeys?.has(target.targetGroupKey) === true) &&
                  source?.targetSource === 'Owner' &&
                  source.targetGroupKey === '' &&
                  context.actionOwnerTarget === 'caster'
                ? (['enemy', 'caster'] as const)
                : ownerSpawnedAbilityEntities
                  ? ([] as const)
                  : currentAbilityEntity
                    ? ([] as const)
                    : null;
      // TimeDilationAction：开关选择命名曲线时，内嵌曲线只是序列化残留。
      const usesNamedCurve = action.useCurveKey && action.curveKey.length > 0;
      // useCurveKey 是来源选择器；内联模式下命名 key 可以保留为未选中的序列化残值。
      const usesInlineCurve = !action.useCurveKey && action.inlineCurveKeys.length > 0;
      if (
        !action.useCurveKey &&
        action.inlineCurveKeys.length === 0 &&
        targets?.length === 1 &&
        targets[0] === 'enemy'
      ) {
        // 空字面曲线的原生求值仍未知。固定木桩没有敌方主动
        // 行为或敌方技能时钟，故该实体减速对模拟不可观测；宿主 Buff 的寿命和图标照常保留。
        return { steps: [], state: partyTargetGroups };
      }
      if ((!usesNamedCurve && !usesInlineCurve) || targets === null)
        throw new Error(`${node.sourcePath}: unsupported entity time-dilation projection`);
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'entity',
              durationSeconds: actionValueOperand(action.duration),
              slot:
                action.slotTagId === 0
                  ? 'unassigned'
                  : projectGameplayTags([action.slotTagId], context, node.sourcePath)[0]!,
              priority,
              curve: usesNamedCurve
                ? { kind: 'named', key: action.curveKey }
                : {
                    kind: 'inline',
                    keys: projectTimeDilationCurveKeys(action.inlineCurveKeys, node.sourcePath),
                  },
              finishByAction: action.finishByAction,
              targets,
              ...(ownerSpawnedAbilityEntities
                ? { abilityEntityTargets: [{ kind: 'ownerSpawned' as const }] }
                : currentAbilityEntity
                  ? { abilityEntityTargets: [{ kind: 'current' as const }] }
                  : {}),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    const ignored = action.ignoreTargets[0];
    const affected = action.effectTargets[0];
    const namedComboGlobal =
      action.useCurveKey &&
      action.curveKey.length > 0 &&
      action.ignoreTargets.length === 2 &&
      ignored?.targetSource === 'Owner' &&
      ignored.targetGroupKey === '' &&
      isOwnerSpawnedAbilityEntityInstantSearch(action.ignoreTargets[1]!) &&
      action.effectTargets.length === 0 &&
      (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster');
    const namedCasterOnlyGlobal =
      action.useCurveKey &&
      action.curveKey.length > 0 &&
      action.ignoreTargets.length === 1 &&
      ignored?.targetSource === 'Owner' &&
      ignored.targetGroupKey === '' &&
      action.effectTargets.length === 0 &&
      (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster');
    const namedOwnerSpawnedOnlyGlobal =
      action.useCurveKey &&
      action.curveKey.length > 0 &&
      action.ignoreTargets.length === 1 &&
      ignored !== undefined &&
      isOwnerSpawnedAbilityEntityInstantSearch(ignored) &&
      action.effectTargets.length === 0 &&
      (context.actionOwnerTarget === 'caster' ||
        context.fixedBuffOwnerTarget === 'caster' ||
        context.actionSourceTarget === 'caster' ||
        context.fixedBuffSourceTarget === 'caster');
    // 1.5.3 起实体子技能（如 pograni 终结收尾）用具名曲线做全局慢动作、只忽略当前实体自身。
    const namedCurrentEntityOnlyGlobal =
      action.useCurveKey &&
      action.curveKey.length > 0 &&
      action.ignoreTargets.length === 1 &&
      ignored?.targetSource === 'Owner' &&
      ignored.targetGroupKey === '' &&
      action.effectTargets.length === 0 &&
      context.actionOwnerTarget === 'currentAbilityEntity';
    const taggedOwnerSpawnedQuery =
      action.useCurveKey &&
      action.curveKey.length > 0 &&
      action.ignoreTargets.length === 1 &&
      ignored !== undefined &&
      ignored.targetSource === 'InstantSearch' &&
      ignored.finderType === 'OwnerSpawnedEntityFinder' &&
      ignored.finderSpawnedObjectType === 'AbilityEntity' &&
      ignored.validatorTypes.length === 1 &&
      ignored.validatorTypes[0] === 'TagValidator' &&
      ignored.postProcessorTypes.length === 0 &&
      action.effectTargets.length === 0 &&
      (context.actionSourceTarget === 'caster' || context.fixedBuffSourceTarget === 'caster') &&
      context.abilityEntityQueries !== undefined
        ? compileTargetReferenceAbilityEntityQuerySource(
            ignored,
            context.abilityEntityQueries.catalog,
            context.abilityEntityQueries.gameplayTagRegistry,
            `${node.sourcePath}.ignoreTargets[0]`,
          )
        : null;
    const namedTaggedOwnerSpawnedOnlyGlobal =
      taggedOwnerSpawnedQuery !== null &&
      taggedOwnerSpawnedQuery.objectFilter === 'abilityEntity' &&
      taggedOwnerSpawnedQuery.owner.kind === 'actionSource' &&
      taggedOwnerSpawnedQuery.postProcessors.length === 0 &&
      taggedOwnerSpawnedQuery.validators.every(validator => validator.kind === 'tag') &&
      taggedOwnerSpawnedQuery.candidateTemplateIds.length > 0;
    if (taggedOwnerSpawnedQuery !== null && !namedTaggedOwnerSpawnedOnlyGlobal) {
      throw new Error(`${node.sourcePath}: unsupported tagged AbilityEntity ignore query`);
    }
    if (
      namedComboGlobal ||
      namedCasterOnlyGlobal ||
      namedCurrentEntityOnlyGlobal ||
      namedOwnerSpawnedOnlyGlobal ||
      namedTaggedOwnerSpawnedOnlyGlobal
    ) {
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'global',
              durationSeconds: actionValueOperand(action.duration),
              slot:
                action.slotTagId === 0
                  ? 'unassigned'
                  : projectGameplayTags([action.slotTagId], context, node.sourcePath)[0]!,
              priority,
              curve: { kind: 'named', key: action.curveKey },
              finishByAction: action.finishByAction,
              ignoredTargets: namedComboGlobal || namedCasterOnlyGlobal ? ['caster'] : [],
              ...(namedCasterOnlyGlobal
                ? {}
                : {
                    ignoredAbilityEntityTargets: [
                      {
                        kind: namedCurrentEntityOnlyGlobal
                          ? ('current' as const)
                          : ('ownerSpawned' as const),
                        ...(namedTaggedOwnerSpawnedOnlyGlobal
                          ? { abilityEntityIds: taggedOwnerSpawnedQuery!.candidateTemplateIds }
                          : {}),
                      },
                    ],
                  }),
              ...(action.useTimeScaleForSkillCooldownTick
                ? {
                    influenceSkillCooldownSeconds: actionValueOperand(
                      action.influenceSkillCooldownTime,
                    ),
                  }
                : {}),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    const inlineGlobalIgnoringCaster =
      !action.useCurveKey &&
      action.inlineCurveKeys.length > 0 &&
      action.ignoreTargets.length === 1 &&
      action.effectTargets.length === 0 &&
      ignored?.targetGroupKey === '' &&
      ((ignored.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (ignored.targetSource === 'Owner' &&
          (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')));
    if (inlineGlobalIgnoringCaster) {
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'global',
              durationSeconds: actionValueOperand(action.duration),
              slot:
                action.slotTagId === 0
                  ? 'unassigned'
                  : projectGameplayTags([action.slotTagId], context, node.sourcePath)[0]!,
              priority,
              curve: {
                kind: 'inline',
                keys: projectTimeDilationCurveKeys(action.inlineCurveKeys, node.sourcePath),
              },
              finishByAction: action.finishByAction,
              ignoredTargets: ['caster'],
              ...(action.useTimeScaleForSkillCooldownTick
                ? {
                    influenceSkillCooldownSeconds: actionValueOperand(
                      action.influenceSkillCooldownTime,
                    ),
                  }
                : {}),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    const inlineGlobalAffectsAll =
      !action.useCurveKey && action.inlineCurveKeys.length > 0 && action.ignoreTargets.length === 0;
    if (inlineGlobalAffectsAll) {
      // TimeDilationAction 的 Global 分支只解析 ignoreTargets；effectTargets
      // 属于同一序列化结构的 Entity 分支字段，在 Global 模式下不读取。
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'global',
              durationSeconds: actionValueOperand(action.duration),
              slot:
                action.slotTagId === 0
                  ? 'unassigned'
                  : projectGameplayTags([action.slotTagId], context, node.sourcePath)[0]!,
              priority,
              curve: {
                kind: 'inline',
                keys: projectTimeDilationCurveKeys(action.inlineCurveKeys, node.sourcePath),
              },
              finishByAction: action.finishByAction,
              ignoredTargets: [],
              ...(action.useTimeScaleForSkillCooldownTick
                ? {
                    influenceSkillCooldownSeconds: actionValueOperand(
                      action.influenceSkillCooldownTime,
                    ),
                  }
                : {}),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      action.useCurveKey ||
      action.inlineCurveKeys.length === 0 ||
      action.ignoreTargets.length !== 1 ||
      ignored === undefined ||
      !isControlledOperatorInstantSearch(ignored) ||
      action.effectTargets.length !== 1 ||
      affected === undefined ||
      affected.targetSource !== 'Source' ||
      affected.targetGroupKey !== ''
    )
      throw new Error(`${node.sourcePath}: unsupported global time-dilation projection`);
    return {
      steps: [
        {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: actionValueOperand(action.duration),
            slot:
              action.slotTagId === 0
                ? 'unassigned'
                : projectGameplayTags([action.slotTagId], context, node.sourcePath)[0]!,
            priority,
            curve: {
              kind: 'inline',
              keys: projectTimeDilationCurveKeys(action.inlineCurveKeys, node.sourcePath),
            },
            finishByAction: action.finishByAction,
            ignoredTargets: ['controlled'],
            ...(action.useTimeScaleForSkillCooldownTick
              ? {
                  influenceSkillCooldownSeconds: actionValueOperand(
                    action.influenceSkillCooldownTime,
                  ),
                }
              : {}),
          },
        },
      ],
      state: partyTargetGroups,
    };
  }
  if (node.body.value.family === 'targetGroup') {
    const queryInputs = context.abilityEntityQueries;
    const write = node.body.value.action;
    if (write.producerType === 'MergeTargetAction' && write.inputTargets.length === 0) {
      // 空合并仍覆盖命名目标组，不能作为无动作省略，否则旧目标会残留。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'empty');
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: { saveToContextKey: write.targetGroupKey, sources: [] },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      context.presentationOnlyTargetGroupKeys?.has(write.targetGroupKey) &&
      !context.materializedTargetGroupKeys?.has(write.targetGroupKey)
    )
      return { steps: [], state: partyTargetGroups };
    if (
      write.producerType === 'FindTargetAction' &&
      (write.finderType === 'MainTargetFinder' || write.finderType === 'GodEntityFinder') &&
      write.validatorTypes.length === 0 &&
      write.postProcessorTypes.length === 0 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      (write.selectorOwner === 'ActionOwner' || write.selectorOwner === 'ActionSource')
    ) {
      const owner = { kind: write.selectorOwner === 'ActionOwner' ? 'owner' : 'source' } as const;
      const nextGroups = new Map(partyTargetGroups);
      const knownCaster =
        owner.kind === 'owner'
          ? context.actionOwnerTarget === 'caster'
          : context.actionSourceTarget === 'caster';
      const isGodEntity = write.finderType === 'GodEntityFinder';
      nextGroups.set(
        write.targetGroupKey,
        isGodEntity ? 'godEntity' : knownCaster ? 'enemy' : 'dynamicEnemy',
      );
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner,
              query: isGodEntity ? { kind: 'godEntity' } : { kind: 'mainTarget', owner },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'TargetPostProcessorAction' &&
      write.postProcessorTypes.length === 1 &&
      write.postProcessorTypes[0] === 'ReplacePartWithMainBody' &&
      write.validatorTypes.length === 0
    ) {
      const input = write.inputTargets[0];
      const detail = write.targetPostProcessor;
      const inputTarget = input !== undefined && isPlainTargetGroupInput(input, 'Target');
      const group = inputTarget
        ? 'runtimeTargets'
        : input && partyTargetGroups.get(input.targetGroupKey);
      if (
        detail !== undefined &&
        isPlainTargetGroupInput(detail.source, 'Source') &&
        isPlainTargetGroupInput(detail.center, 'Target') &&
        !detail.direction.customSourceAndTarget &&
        write.inputTargets.length === 1 &&
        input !== undefined &&
        (inputTarget || isPlainTargetGroupInput(input, 'Context')) &&
        (group === 'enemy' ||
          group === 'dynamicEnemy' ||
          group === 'empty' ||
          group === 'abilityEntity' ||
          group === 'runtimeTargets')
      ) {
        // 原生原位替换部位，非部位原样保留。已证明仅含木桩的组无需替换，
        // dynamicEnemy 必须复制实际集合（可能为空）；只有 enemy 证明才允许直接取木桩。
        // 能力实体组和动作 Target 交给运行时逐项替换；普通能力实体保留，不能猜成敌人。
        const nextGroups = new Map(partyTargetGroups);
        const replace = group === 'abilityEntity' || group === 'runtimeTargets';
        nextGroups.set(write.targetGroupKey, replace ? 'runtimeTargets' : group);
        return {
          steps: [
            {
              kind: 'copyContextTargets',
              parameters: {
                source: inputTarget
                  ? { kind: 'inputTarget' }
                  : group === 'enemy'
                    ? { kind: 'fixed', target: 'enemy' }
                    : { kind: 'context', key: input.targetGroupKey },
                saveToContextKey: write.targetGroupKey,
                ...(replace ? { replacePartsWithMainBodies: true } : {}),
              },
            },
          ],
          state: nextGroups,
        };
      }
    }
    if (
      write.producerType === 'FindTargetAction' &&
      (write.finderType === 'AllEnemyFinder' || write.finderType === 'InFightEnemyFinder') &&
      write.postProcessorTypes[0] === 'ExcludeTarget' &&
      write.excludeTargets?.length === 1 &&
      write.excludeTargets[0]!.targetSource === 'Context' &&
      write.excludeTargets[0]!.targetGroupKey !== '' &&
      write.center === 'ActionSource' &&
      write.centerContextKey === '' &&
      write.selectorOwner === 'ActionOwner' &&
      write.selectorOwnerContextKey === '' &&
      (isStaticSingleEnemyTargetGroup({
        ...write,
        postProcessorTypes: write.postProcessorTypes.slice(1),
      }) ||
        isDynamicSingleEnemyTagTargetGroup({
          ...write,
          postProcessorTypes: write.postProcessorTypes.slice(1),
        }))
    ) {
      // 单敌人目录的排序不改变结果，但排除的 Context 可能已被重设，必须运行时读取。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'copyContextTargets',
            parameters: {
              source:
                write.validatorTagQueries.length === 0
                  ? { kind: 'fixed', target: 'enemy' }
                  : {
                      kind: 'enemyByTags',
                      tagQueryType: projectNativeTagQueryType(
                        write.validatorTagQueries[0]![0],
                        node.sourcePath,
                      ),
                      tags: projectGameplayTags(
                        write.validatorTagQueries[0]![1],
                        context,
                        node.sourcePath,
                      ),
                    },
              excludeTargets: { kind: 'context', key: write.excludeTargets[0]!.targetGroupKey },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    // A prior proof that a Context contains the enemy cannot erase a later exclusion write.
    if (
      write.producerType === 'TargetPostProcessorAction' &&
      write.postProcessorTypes.includes('ExcludeTarget')
    ) {
      const input = write.inputTargets[0];
      const detail = write.targetPostProcessor;
      if (
        detail === undefined ||
        !isPlainTargetGroupInput(detail.source, 'Source') ||
        !isPlainTargetGroupInput(detail.center, 'Target') ||
        context.actionSourceTarget !== 'caster' ||
        detail.direction.directionType !== 'SourceForward' ||
        detail.direction.customSourceAndTarget ||
        write.inputTargets.length !== 1 ||
        input === undefined ||
        !isPlainTargetGroupInput(input, 'Context') ||
        !write.excludesCurrentTarget ||
        write.excludeTargets?.length !== 1 ||
        write.validatorTypes.length !== 0 ||
        write.postProcessorTypes.length !== 1 ||
        write.priorityFilters.length !== 0 ||
        write.shuffleTargets.length !== 0 ||
        write.distanceValidators.length !== 0
      )
        throw new Error(`${node.sourcePath}: unsupported target postprocessor exclusion`);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'runtimeTargets');
      return {
        steps: [
          {
            kind: 'copyContextTargets',
            parameters: {
              source: { kind: 'context', key: input.targetGroupKey },
              excludeTargets: { kind: 'inputTarget' },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      context.unconsumedTargetGroupKeys?.has(write.targetGroupKey) === true &&
      !context.materializedTargetGroupKeys?.has(write.targetGroupKey) &&
      write.producerType === 'FindTargetAction' &&
      write.postProcessorTypes.length === 0 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.centerContextKey === '' &&
      write.selectorOwnerContextKey === '' &&
      ((write.center === 'ActionSource' && context.actionSourceTarget === 'caster') ||
        (write.center === 'ActionOwner' &&
          (context.actionOwnerTarget === 'caster' ||
            context.actionOwnerTarget === 'currentAbilityEntity'))) &&
      ((write.selectorOwner === 'ActionSource' && context.actionSourceTarget === 'caster') ||
        (write.selectorOwner === 'ActionOwner' &&
          (context.actionOwnerTarget === 'caster' ||
            context.actionOwnerTarget === 'currentAbilityEntity')))
    ) {
      // FindTargetAction 在 owner/center 可解析时即使搜索为空也覆盖 Context 并返回 true。
      // 无读取者只能证明结果无用；仍排除可能取样或写入的后处理器。
      return { steps: [], state: partyTargetGroups };
    }
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'HitBoxFinder' &&
      write.finderAutoSetTargetFaction === true &&
      write.finderFactionTarget === 'Ally' &&
      write.finderTargetObjectType === 'Normal' &&
      write.finderCheckAlive !== null &&
      write.finderContainsUnMarkable !== undefined &&
      write.validatorTypes.length === 0 &&
      write.postProcessorTypes.every(type => type === 'ReplacePartWithMainBody') &&
      write.postProcessorTypes.length <= 1 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      write.selectorOwner === 'ActionOwner' &&
      write.selectorOwnerContextKey === '' &&
      write.center === 'ActionOwner' &&
      write.centerContextKey === '' &&
      context.actionOwnerTarget === 'currentAbilityEntity'
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'runtimeTargets');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner: { kind: 'owner' },
              query: {
                kind: 'allyHitBox',
                owner: { kind: 'owner' },
                checkAlive: write.finderCheckAlive,
                containsUnmarkable: write.finderContainsUnMarkable,
                replacePartsWithMainBodies: write.postProcessorTypes.length !== 0,
              },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    // 单次命中盒写入的证明不要求该 Context 在整个技能中保持不变。
    // 后续排除或替换可以改写同一组，此时必须实际保存本次结果供后续动作读取。
    const directEnemyHitBoxWrite =
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'HitBoxFinder' &&
      write.center === 'ActionOwner' &&
      write.centerContextKey === '' &&
      write.selectorOwnerContextKey === '' &&
      (context.actionOwnerTarget === 'currentAbilityEntity' ||
        context.actionOwnerTarget === 'buffOwner') &&
      // 显式 Bad 阵营不依赖宿主身份；自动敌对阵营则必须证明选择器的基准为我方。
      (isStaticExplicitBadFactionEnemyTargetGroup(write) ||
        (write.finderAutoSetTargetFaction === true &&
          isStaticSingleEnemyTargetGroup(write) &&
          (context.actionSourceTarget === 'caster' || context.fixedBuffSourceTarget === 'caster') &&
          ((write.selectorOwner === 'ActionOwner' &&
            context.actionOwnerTarget === 'currentAbilityEntity') ||
            write.selectorOwner === 'ActionSource')));
    if (
      (context.staticEnemyTargetGroupKeys?.has(write.targetGroupKey) || directEnemyHitBoxWrite) &&
      write.finderType !== 'OwnerSpawnedEntityFinder' &&
      write.finderType !== 'AbilityEntityTargetFinder'
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'enemy');
      return {
        steps:
          directEnemyHitBoxWrite || context.materializedTargetGroupKeys?.has(write.targetGroupKey)
            ? [
                {
                  kind: 'mergeContextTargets' as const,
                  parameters: {
                    saveToContextKey: write.targetGroupKey,
                    sources: [{ kind: 'target' as const, target: 'enemy' as const }],
                  },
                },
              ]
            : [],
        state: nextGroups,
      };
    }
    if (context.staticEmptyTargetGroupKeys?.has(write.targetGroupKey)) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'empty');
      return { steps: [], state: nextGroups };
    }
    if (
      (write.finderType === 'OwnerSoulFinder' ||
        context.fixedBuffOwnerTarget === 'currentAbilityEntity') &&
      write.producerType === 'FindTargetAction' &&
      (write.finderType === 'AbilityEntityTargetFinder' ||
        write.finderType === 'OwnerSoulFinder') &&
      write.validatorTypes.length === 0 &&
      write.postProcessorTypes.length === 0 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      ((write.selectorOwner === 'ActionOwner' && write.selectorOwnerContextKey === '') ||
        (write.finderType === 'OwnerSoulFinder' &&
          write.selectorOwner === 'ContextTarget' &&
          write.selectorOwnerContextKey !== ''))
    ) {
      // 两种 finder 都在执行时读取关系槽，不能退化为敌人或技能启动时的输入快照。
      // OwnerSoulFinder 读取主体关联；AbilityEntityTargetFinder 读取控制器目标。
      // 关系查询不读取中心坐标，ContextTarget 则从既有目标组取得主体身份。
      const owner =
        write.selectorOwner === 'ContextTarget'
          ? { kind: 'context' as const, key: write.selectorOwnerContextKey }
          : { kind: 'owner' as const };
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'runtimeTargets');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner,
              query: {
                kind: write.finderType === 'OwnerSoulFinder' ? 'ownerSoul' : 'abilityEntityTarget',
                owner,
              },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      context.actionTargetTarget === 'enemy' &&
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'HitBoxFinder' &&
      write.finderFactionTarget === 'Anti' &&
      write.finderTargetObjectType === 'Normal' &&
      write.finderCheckAlive === true &&
      write.validatorTypes.length === 1 &&
      write.validatorTypes[0] === 'HittableObjectValidator' &&
      write.postProcessorTypes.length === 0 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      write.center === 'ContextTarget' &&
      partyTargetGroups.get(write.centerContextKey) === 'spatialPoint' &&
      write.selectorOwner === 'ActionOwner' &&
      write.selectorOwnerContextKey === ''
    ) {
      // HittableObjectValidator 的 HitBox 只收集场景可破坏物；它不是唯一敌人的另一种写法。
      // Next 没有场景可破坏物后端；不把该组伪装成敌人或普通 Context。后续只有明确的
      // hitEnvironment 空 DamageUnit 路径会自行省略，其他消费者因找不到该组仍会严格失败。
      return { steps: [], state: partyTargetGroups };
    }
    if (
      (write.finderType === 'AllEnemyFinder' ||
        write.finderType === 'InFightEnemyFinder' ||
        context.actionTargetTarget === 'enemy' ||
        ((context.actionTargetTarget === 'eventSource' ||
          context.actionTargetTarget === 'actionInputTarget') &&
          context.actionOwnerTarget === 'currentAbilityEntity')) &&
      isDynamicSingleEnemyTagTargetGroup(write)
    ) {
      if (write.producerType === 'ContinuousFindTargetAction')
        throw new Error(`${node.sourcePath}: continuous target query requires a runtime lifecycle`);
      // AllEnemyFinder 独立遍历 allEnemies，不依赖宿主或输入目标的类型。
      // 实体被动的接收侧事件 Target/Source 都是事件身份；InFightEnemyFinder 仍从战斗目录
      // 独立筛选敌人。固定木桩模型保留标签动态判定，不能把事件发送者冒充为敌人。
      const rawQuery = write.validatorTagQueries[0]!;
      const queryType = projectNativeTagQueryType(
        rawQuery[0],
        `${node.sourcePath}.validatorTagQueries[0]`,
      );
      const owner =
        write.selectorOwner === 'ActionOwner'
          ? { kind: 'owner' as const }
          : write.selectorOwner === 'ActionSource'
            ? { kind: 'source' as const }
            : write.selectorOwner === 'MainCharacter'
              ? { kind: 'mainCharacter' as const }
              : write.selectorOwner === 'ContextTarget'
                ? { kind: 'context' as const, key: write.selectorOwnerContextKey }
                : null;
      if (owner === null) throw new Error(`${node.sourcePath}: unsupported selector owner`);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner,
              query: {
                kind: 'enemyByTags',
                tagQueryType: queryType,
                tags: projectGameplayTags(rawQuery[1], context, node.sourcePath),
              },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      context.actionSourceTarget === 'caster' &&
      (context.fixedBuffOwnerTarget === 'caster' ||
        context.actionOwnerTarget === 'caster' ||
        context.actionOwnerTarget === 'currentAbilityEntity') &&
      isZeroSpaceSingleEnemySmartTargetGroup(write)
    ) {
      // 智能选择未命中仍回退主目标。零空间单敌人下两条路径等价，但必须保留
      // FindTargetAction 的宿主检查和结果覆盖，不能改成 Buff 条件或抹掉查询。
      const owner = { kind: write.selectorOwner === 'ActionOwner' ? 'owner' : 'source' } as const;
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner,
              query: { kind: 'mainTarget', owner },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (queryInputs !== undefined && write.finderType === 'OwnerSpawnedEntityFinder') {
      const ownerEnvironmentSupported =
        (write.selectorOwner === 'ActionSource' &&
          (context.actionSourceTarget === 'caster' ||
            context.fixedBuffSourceTarget === 'caster')) ||
        (write.selectorOwner === 'ActionOwner' &&
          ['caster', 'buffOwner'].includes(context.actionOwnerTarget)) ||
        (write.selectorOwner === 'ContextTarget' &&
          write.selectorOwnerContextKey !== '' &&
          partyTargetGroups.get(write.selectorOwnerContextKey) === 'sourceFinderResult');
      if (write.producerType !== 'FindTargetAction' || !ownerEnvironmentSupported)
        throw new Error(`${node.sourcePath}: unsupported AbilityEntity query environment`);
      const query = compileTargetGroupAbilityEntityQuerySource(
        write,
        queryInputs.catalog,
        queryInputs.gameplayTagRegistry,
        node.sourcePath,
      );
      const distancePostProcessors = query.postProcessors.filter(
        postProcessor =>
          postProcessor.kind === 'distanceFromOwner' ||
          postProcessor.kind === 'distanceFromMainCharacter',
      );
      const circularPostProcessors = query.postProcessors.filter(
        postProcessor => postProcessor.kind === 'circularOrder',
      );
      const ownerContextKey =
        query.owner.kind === 'contextTarget' &&
        partyTargetGroups.get(query.owner.key) === 'sourceFinderResult'
          ? query.owner.key
          : undefined;
      if (
        (!['actionOwner', 'actionSource'].includes(query.owner.kind) &&
          ownerContextKey === undefined) ||
        !zeroDistanceValidatorsAlwaysPass(write) ||
        distancePostProcessors.length + circularPostProcessors.length !==
          query.postProcessors.length ||
        distancePostProcessors.length > 1 ||
        circularPostProcessors.length > 1 ||
        (distancePostProcessors.length > 0 && circularPostProcessors.length > 0)
      )
        throw new Error(`${node.sourcePath}: unsupported AbilityEntity runtime query filter`);
      const maxTargets = distancePostProcessors[0]?.maxTargets;
      const circularOrder = circularPostProcessors[0];
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'abilityEntity');
      return {
        steps: [
          {
            kind: 'findOwnerSpawnedAbilityEntities',
            parameters: {
              saveToContextKey: write.targetGroupKey,
              abilityEntityIds: query.candidateTemplateIds,
              owner:
                ownerContextKey !== undefined
                  ? { kind: 'context', key: ownerContextKey }
                  : { kind: query.owner.kind === 'actionOwner' ? 'owner' : 'source' },
              ...(maxTargets === undefined ? {} : { maxTargets }),
              ...(query.validators.some(validator => validator.kind === 'sameSkillCast')
                ? { sameSourceSkillCast: true }
                : {}),
              ...(circularOrder?.kind === 'circularOrder'
                ? {
                    circularOrder: {
                      indexBlackboardKey: circularOrder.indexBlackboardKey,
                      desiredCount: circularOrder.desiredCount,
                      reverseFlag: circularOrder.reverseFlag,
                    },
                  }
                : {}),
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'PickTargetAction' &&
      write.inputTargets.length === 1 &&
      write.inputTargets[0]!.targetSource === 'Context' &&
      write.inputTargets[0]!.targetGroupKey !== '' &&
      (context.staticAbilityEntityTargetGroupKeys?.has(write.inputTargets[0]!.targetGroupKey) ===
        true ||
        partyTargetGroups.get(write.inputTargets[0]!.targetGroupKey) === 'abilityEntity' ||
        partyTargetGroups.get(write.inputTargets[0]!.targetGroupKey) === 'spatialPoint' ||
        partyTargetGroups.get(write.inputTargets[0]!.targetGroupKey) === 'enemy' ||
        context.staticEnemyTargetGroupKeys?.has(write.inputTargets[0]!.targetGroupKey) === true ||
        context.singleEnemyTargetGroupKeys?.has(write.inputTargets[0]!.targetGroupKey) === true) &&
      write.pickIndexValue !== null
    ) {
      const sourceContextKey = write.inputTargets[0]!.targetGroupKey;
      const sourceKind =
        partyTargetGroups.get(sourceContextKey) ??
        (context.staticAbilityEntityTargetGroupKeys?.has(sourceContextKey)
          ? 'abilityEntity'
          : context.staticEnemyTargetGroupKeys?.has(sourceContextKey) === true ||
              context.singleEnemyTargetGroupKeys?.has(sourceContextKey) === true
            ? 'enemy'
            : undefined);
      if (sourceKind === undefined) {
        throw new Error(`${node.sourcePath}: missing PickTarget source identity`);
      }
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, sourceKind);
      return {
        steps: [
          {
            kind: 'pickContextTarget',
            parameters: {
              sourceContextKey,
              saveToContextKey: write.targetGroupKey,
              index:
                write.pickIndexBlackboardKey === null
                  ? { kind: 'constant', value: write.pickIndexValue }
                  : { kind: 'blackboard', key: write.pickIndexBlackboardKey },
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'SourceFinder' &&
      write.validatorTypes.length === 0 &&
      write.postProcessorTypes.length === 0 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      write.finderSpawnedObjectType === null &&
      write.validatorTagQueries.length === 0 &&
      write.centerContextKey === '' &&
      write.selectorOwnerContextKey === '' &&
      (write.selectorOwner === 'ActionSource' || write.selectorOwner === 'ActionOwner') &&
      context.actionSourceTarget === 'caster'
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'sourceFinderResult');
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: {
              saveToContextKey: write.targetGroupKey,
              sources: [
                {
                  kind: 'abilitySystemSource',
                  owner: write.selectorOwner === 'ActionSource' ? 'actionSource' : 'actionOwner',
                },
              ],
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (write.producerType === 'FindTargetAction' && write.finderType === 'ProjectileFinder') {
      const shape = write.finderProjectileShape;
      if (
        shape === undefined ||
        shape.shape !== 'Sphere' ||
        shape.radiusKey !== '' ||
        shape.radius <= 0 ||
        shape.useCenterKey ||
        shape.center.some(value => value !== 0) ||
        write.validatorTypes.length !== 0 ||
        write.postProcessorTypes.length !== 0 ||
        write.priorityFilters.length !== 0 ||
        write.shuffleTargets.length !== 0 ||
        write.distanceValidators.length !== 0 ||
        write.validatorTagQueries.length !== 0
      )
        throw new Error(`${node.sourcePath}: unsupported projectile query shape or filters`);
      // 所有实体共处零空间。正半径球覆盖全部未结束投射物，仍从当前实例目录实时取值。
      if (write.selectorOwner !== 'ActionOwner' && write.selectorOwner !== 'ActionSource')
        throw new Error(`${node.sourcePath}: unsupported projectile selector owner`);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'abilityEntity');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner: { kind: write.selectorOwner === 'ActionOwner' ? 'owner' : 'source' },
              query: { kind: 'unfinishedProjectiles' },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    const characterTeamQuery = projectCharacterTeamQuery(write, context);
    if (characterTeamQuery !== null) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(
        write.targetGroupKey,
        characterTeamQuery.selection.kind === 'controlledOperator'
          ? 'controlledOperator'
          : characterTeamQuery.selection.excludeCaster === true
            ? 'lowestHealthRatioOperatorExceptCaster'
            : 'contextOperator',
      );
      return {
        steps: [
          {
            kind: 'findCharacterTeamTargets',
            parameters: {
              saveToContextKey: write.targetGroupKey,
              selection: characterTeamQuery.selection,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'FindTargetAction' &&
      (write.finderType === 'FixedPointFinder' ||
        (write.finderSpatialPoint !== undefined &&
          write.validatorTypes.length === 0 &&
          write.priorityFilters.length === 0 &&
          write.shuffleTargets.length === 0 &&
          write.distanceValidators.length === 0)) &&
      write.postProcessorTypes.length === 0
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'spatialPoint');
      return {
        steps:
          context.materializedTargetGroupKeys?.has(write.targetGroupKey) === true
            ? [
                {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: write.targetGroupKey,
                    count: { kind: 'constant', value: 1 },
                  },
                },
              ]
            : [],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'RandomPointFinder' &&
      write.finderRandomPointCount !== undefined &&
      context.randomPointTargetGroupKeys?.has(write.targetGroupKey) === true &&
      write.validatorTypes.length === 0 &&
      write.postProcessorTypes.length === 0 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      ((write.center === 'InputTarget' && context.actionTargetTarget === 'enemy') ||
        (write.center === 'ActionSource' && context.actionSourceTarget === 'caster') ||
        (write.center === 'ActionOwner' &&
          (context.actionOwnerTarget === 'caster' ||
            context.actionOwnerTarget === 'currentAbilityEntity')) ||
        (write.center === 'ContextTarget' &&
          write.centerContextKey !== '' &&
          context.staticZeroSpaceTargetGroupKeys?.has(write.centerContextKey) === true)) &&
      (write.center === 'ContextTarget' || write.centerContextKey === '') &&
      write.selectorOwner === 'ActionOwner' &&
      write.selectorOwnerContextKey === ''
    ) {
      // 零空间模型丢弃扇形坐标与 NavMesh 吸附，但 pointNum 决定投射物及回调次数，不能消去。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'spatialPoint');
      const sourceCount =
        write.finderRandomPointCount.blackboardKey === null
          ? { kind: 'constant' as const, value: write.finderRandomPointCount.value }
          : {
              kind: 'blackboard' as const,
              key: write.finderRandomPointCount.blackboardKey,
            };
      return {
        steps: [
          {
            kind: 'createSpatialPointTargets',
            parameters: { saveToContextKey: write.targetGroupKey, count: sourceCount },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'PointFinder' &&
      write.validatorTypes.length === 0 &&
      write.postProcessorTypes.length === 0 &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      (write.center === 'MainCharacter' ||
        (write.center === 'ActionSource' && write.centerContextKey === '') ||
        (write.center === 'ContextTarget' &&
          write.centerContextKey !== '' &&
          (context.staticEnemyTargetGroupKeys?.has(write.centerContextKey) === true ||
            partyTargetGroups.get(write.centerContextKey) === 'enemy')) ||
        (write.center === 'CurrentTarget' && context.actionTargetTarget === 'enemy')) &&
      (write.selectorOwner === 'MainCharacter' ||
        (write.selectorOwner === 'ActionOwner' && write.selectorOwnerContextKey === '') ||
        (write.selectorOwner === 'ActionSource' && context.actionSourceTarget === 'caster')) &&
      ((write.directionTarget === 'ContextTarget' &&
        write.directionContextKey !== '' &&
        (context.staticEnemyTargetGroupKeys?.has(write.directionContextKey) === true ||
          context.guaranteedSingletonZeroSpaceTargetGroupKeys?.has(write.directionContextKey) ===
            true ||
          partyTargetGroups.get(write.directionContextKey) === 'enemy' ||
          partyTargetGroups.get(write.directionContextKey) === 'dynamicEnemy')) ||
        (['InputTarget', 'CurrentTarget'].includes(write.directionTarget ?? '') &&
          context.actionTargetTarget === 'enemy'))
    ) {
      // PointFinder 始终输出一个空间点，不枚举方向目标。主控中心/Owner 不读取残留 ContextKey；
      // 动态方向组为空也只改变几何方向，不改变点数。1.6.3 非 IFix 主干见 08F03B48，
      // FindTargetAction 高级方向空目标回退见 0741163B..07411676；中心自身仍必须可解析。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'spatialPoint');
      return {
        steps:
          context.materializedTargetGroupKeys?.has(write.targetGroupKey) === true
            ? [
                {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: write.targetGroupKey,
                    count: { kind: 'constant', value: 1 },
                  },
                },
              ]
            : [],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'ConvertToTargetContext' &&
      write.conversionOperation === 'ConvertEntityToPosition' &&
      write.inputTargets.length === 1 &&
      ((['Source', 'Owner', 'Target'].includes(write.inputTargets[0]?.targetSource ?? '') &&
        write.inputTargets[0]?.targetGroupKey === '') ||
        (write.inputTargets[0]?.targetSource === 'Context' &&
          write.inputTargets[0].targetGroupKey !== '' &&
          (context.staticEnemyTargetGroupKeys?.has(write.inputTargets[0].targetGroupKey) === true ||
            partyTargetGroups.get(write.inputTargets[0].targetGroupKey) === 'enemy'))) &&
      write.inputTargets[0]?.finderType === null &&
      write.inputTargets[0]?.validatorTypes.length === 0 &&
      write.inputTargets[0]?.postProcessorTypes.length === 0 &&
      write.inputTargets[0]?.priorityFilters.length === 0 &&
      write.inputTargets[0]?.shuffleTargets.length === 0 &&
      write.inputTargets[0]?.distanceValidators.length === 0 &&
      write.inputTargets[0]?.finderSpawnedObjectType === null &&
      write.inputTargets[0]?.validatorTagQueries.length === 0
    ) {
      // 原生 ConvertEntityToPosition 只把来源句柄中的实体身份替换为当时的位置。
      // 已证明的唯一木桩 Context 在零空间模型中因此精确投影为一个空间点；该点仍不能
      // 反向冒充敌人实体。Rossi 的 smart_target -> TarPos 只供移动动作消费。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'spatialPoint');
      return { steps: [], state: nextGroups };
    }
    if (write.producerType === 'ConvertToTargetContext' && write.conversionOperation === 'None') {
      if (!write.conversionSource) throw new Error(`${node.sourcePath}: missing conversion source`);
      const source = projectActionTargetQuery(
        write.conversionSource,
        context,
        `${node.sourcePath}.convertFrom`,
      );
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.delete(write.targetGroupKey);
      const group =
        source.kind === 'context'
          ? partyTargetGroups.get(source.key)
          : source.kind === 'fixedPoint'
            ? 'spatialPoint'
            : source.kind === 'mainCharacter'
              ? 'controlledOperator'
              : source.kind === 'fixed' && source.target === 'enemy'
                ? 'dynamicEnemy'
                : undefined;
      if (group !== undefined) nextGroups.set(write.targetGroupKey, group);
      return {
        steps: [
          {
            kind: 'copyContextTargets',
            parameters: { source, saveToContextKey: write.targetGroupKey },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'ConvertToTargetContext' &&
      write.conversionOperation === 'ExcludeTarget' &&
      write.inputTargets.length === 1 &&
      write.inputTargets[0]?.targetSource === 'Context' &&
      write.inputTargets[0].targetGroupKey !== '' &&
      partyTargetGroups.get(write.inputTargets[0].targetGroupKey) === 'enemy' &&
      write.inputTargets[0].finderType === null &&
      write.inputTargets[0].validatorTypes.length === 0 &&
      write.inputTargets[0].postProcessorTypes.length === 0 &&
      write.inputTargets[0].priorityFilters.length === 0 &&
      write.inputTargets[0].shuffleTargets.length === 0 &&
      write.inputTargets[0].distanceValidators.length === 0 &&
      write.inputTargets[0].finderSpawnedObjectType === null &&
      write.inputTargets[0].validatorTagQueries.length === 0 &&
      write.conversionTransform?.excludeTarget === 'InputTarget' &&
      context.actionTargetTarget === 'enemy'
    ) {
      // 原生 ExcludeTarget 只保留来源组中与指定实体不同的 Entity。
      // 已保存 Context 与 InputTarget 都严格证明为唯一木桩时，新目标组必为空。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'empty');
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: { saveToContextKey: write.targetGroupKey, sources: [] },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'MergeTargetAction' &&
      write.inputTargets.length > 0 &&
      write.inputTargets.every(
        target =>
          target.targetSource === 'Context' &&
          target.targetGroupKey !== '' &&
          partyTargetGroups.get(target.targetGroupKey) === 'spatialPoint',
      )
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'spatialPoint');
      return { steps: [], state: nextGroups };
    }
    if (
      write.producerType === 'MergeTargetAction' &&
      write.inputTargets.length === 2 &&
      (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')
    ) {
      const contextInput = write.inputTargets.find(
        target =>
          isPlainTargetGroupInput(target, 'Context') &&
          (partyTargetGroups.get(target.targetGroupKey) === 'controlledOperator' ||
            partyTargetGroups.get(target.targetGroupKey) ===
              'lowestHealthRatioOperatorExceptCaster'),
      );
      const ownerInput = write.inputTargets.find(target =>
        isPlainTargetGroupInput(target, 'Owner'),
      );
      if (contextInput !== undefined && ownerInput !== undefined) {
        const contextKind = partyTargetGroups.get(contextInput.targetGroupKey)!;
        const nextGroups = new Map(partyTargetGroups);
        nextGroups.set(
          write.targetGroupKey,
          contextKind === 'controlledOperator'
            ? 'casterAndControlledOperator'
            : 'casterAndLowestHealthRatioOperatorExceptCaster',
        );
        return {
          steps: [
            {
              kind: 'mergeContextTargets',
              parameters: {
                saveToContextKey: write.targetGroupKey,
                sources: write.inputTargets.map(target =>
                  target === contextInput
                    ? { kind: 'context' as const, contextKey: target.targetGroupKey }
                    : { kind: 'target' as const, target: 'caster' as const },
                ),
              },
            },
          ],
          state: nextGroups,
        };
      }
    }
    if (
      write.producerType === 'MergeTargetAction' &&
      write.inputTargets.length === 1 &&
      isPlainTargetGroupInput(write.inputTargets[0]!, 'Target') &&
      context.actionTargetTarget === 'enemy'
    ) {
      // ForEach 会把当前迭代实体重新绑定为动作 Target。该身份是控制流局部事实，无法由
      // SkillData 顶层的静态 Context 写入闭包推导；已证明循环集合为唯一木桩时，单纯合并
      // 当前 Target 仍精确得到同一木桩，并把该事实传给循环体后续伤害动作。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'enemy');
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: {
              saveToContextKey: write.targetGroupKey,
              sources: [{ kind: 'target', target: 'enemy' }],
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'MergeTargetAction' &&
      write.inputTargets.length === 1 &&
      isPlainTargetGroupInput(write.inputTargets[0]!, 'Target') &&
      context.actionTargetTarget === 'currentOperator'
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'contextOperator');
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: {
              saveToContextKey: write.targetGroupKey,
              sources: [{ kind: 'target', target: 'currentTarget' }],
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'MergeTargetAction' &&
      context.singleEnemyTargetGroupKeys?.has(write.targetGroupKey) === true &&
      write.inputTargets.length > 0
    ) {
      const sources = write.inputTargets.map((target, index) => {
        const noFilters =
          target.validatorTypes.length === 0 &&
          target.postProcessorTypes.length === 0 &&
          target.priorityFilters.length === 0 &&
          target.shuffleTargets.length === 0 &&
          target.distanceValidators.length === 0 &&
          target.finderSpawnedObjectType === null &&
          target.validatorTagQueries.length === 0;
        if (
          noFilters &&
          target.targetSource === 'InstantSearch' &&
          (target.finderType === 'MainTargetFinder' ||
            (target.finderType === 'HitBoxFinder' &&
              target.finderFactionTarget === 'Anti' &&
              (target.finderTargetObjectType === 'Normal' ||
                target.finderTargetObjectType === 'NoInteractive') &&
              target.finderCheckAlive !== null))
        ) {
          return { kind: 'target' as const, target: 'enemy' as const };
        }
        if (
          noFilters &&
          target.finderType === null &&
          target.targetSource === 'Context' &&
          target.targetGroupKey !== '' &&
          context.singleEnemyTargetGroupKeys?.has(target.targetGroupKey) === true
        ) {
          return { kind: 'context' as const, contextKey: target.targetGroupKey };
        }
        if (
          noFilters &&
          target.finderType === null &&
          target.targetSource === 'Target' &&
          target.targetGroupKey === '' &&
          (context.actionTargetTarget === 'enemy' || context.actionTargetTarget === 'caster')
        ) {
          return { kind: 'target' as const, target: context.actionTargetTarget };
        }
        throw new Error(
          `${node.sourcePath}.targets[${index}]: unsupported single-enemy merge source`,
        );
      });
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: { saveToContextKey: write.targetGroupKey, sources },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      ((isStaticSingleEnemyTargetGroup(write) ||
        isCurrentTargetRestrictedSingleEnemyTargetGroup(write)) &&
        (context.actionTargetTarget === 'enemy' ||
          context.fixedBuffOwnerTarget === 'caster' ||
          context.fixedBuffOwnerTarget === 'currentAbilityEntity')) ||
      (context.fixedBuffOwnerTarget === 'enemy' && isStaticSingleEnemyOwnerAllyTargetGroup(write))
    ) {
      // 只有消费者已改用静态敌人时才能消除持续写入；真实目标组可能被后续动作覆盖。
      if (
        write.producerType === 'ContinuousFindTargetAction' &&
        context.materializedTargetGroupKeys?.has(write.targetGroupKey)
      )
        throw new Error(`${node.sourcePath}: continuous target query requires a runtime lifecycle`);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'enemy');
      return {
        steps:
          context.materializedTargetGroupKeys?.has(write.targetGroupKey) === true
            ? [
                {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: write.targetGroupKey,
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
              ]
            : [],
        state: nextGroups,
      };
    }
    if (context.actionTargetTarget === 'enemy' && isEmptyStaticEnemyExclusionTargetGroup(write)) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'empty');
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: { saveToContextKey: write.targetGroupKey, sources: [] },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'CharacterTeamFinder' &&
      write.validatorTypes.length === 1 &&
      write.validatorTypes[0] === 'MainCharacterValidator' &&
      write.postProcessorTypes.length === 1 &&
      write.postProcessorTypes[0] === 'ConvertToSlot' &&
      write.priorityFilters.length === 0 &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      write.center === 'ActionSource' &&
      write.centerContextKey === '' &&
      context.actionSourceTarget === 'caster' &&
      write.selectorOwner === 'ActionOwner' &&
      write.selectorOwnerContextKey === '' &&
      (context.actionOwnerTarget === 'caster' ||
        context.actionOwnerTarget === 'currentAbilityEntity')
    ) {
      // CharacterTeamFinder + MainCharacterValidator 锁定当前主控；ConvertToSlot 只把同一稳定
      // 身份交给表现组件。公共目标账本仍保存实际干员实例，不创建另一种“槽位实体”。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'controlledOperator');
      return {
        steps: [
          {
            kind: 'findCharacterTeamTargets',
            parameters: {
              saveToContextKey: write.targetGroupKey,
              selection: { kind: 'controlledOperator' },
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (isPartyHitBoxTargetGroup(write, context)) {
      // 我方实体的友方命中盒查询在全范围战斗模型中返回队伍；保留实际干员身份供治疗迭代。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'party');
      return {
        steps: [
          {
            kind: 'findCharacterTeamTargets' as const,
            parameters: {
              saveToContextKey: write.targetGroupKey,
              selection: { kind: 'allOperators' as const },
            },
          },
        ],
        state: nextGroups,
      };
    }
    const partyKind =
      write.postProcessorTypes.length === 0
        ? write.validatorTypes.length === 0
          ? ('party' as const)
          : write.validatorTypes.length === 1 && write.validatorTypes[0] === 'ExcludeOwnerValidator'
            ? ('partyExceptCaster' as const)
            : null
        : write.postProcessorTypes.length === 1 &&
            write.postProcessorTypes[0] === 'ExcludeTarget' &&
            write.excludesOwner
          ? ('partyExceptCaster' as const)
          : null;
    const centerMatchesCaster =
      write.center === 'ActionOwner' ||
      (write.center === 'ActionSource' && context.actionSourceTarget === 'caster');
    const selectorOwnerMatchesCaster =
      write.selectorOwner === 'ActionOwner' ||
      (write.selectorOwner === 'ActionSource' && context.actionSourceTarget === 'caster');
    const validatorsMatchPartyKind =
      partyKind === 'party'
        ? write.validatorTypes.length === 0
        : partyKind === 'partyExceptCaster' &&
          ((write.postProcessorTypes.length === 0 &&
            write.validatorTypes.length === 1 &&
            write.validatorTypes[0] === 'ExcludeOwnerValidator') ||
            (write.validatorTypes.length === 0 &&
              write.postProcessorTypes.length === 1 &&
              write.postProcessorTypes[0] === 'ExcludeTarget' &&
              write.excludesOwner));
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'CharacterTeamFinder' &&
      validatorsMatchPartyKind &&
      partyKind !== null &&
      centerMatchesCaster &&
      write.centerContextKey === '' &&
      selectorOwnerMatchesCaster &&
      write.selectorOwnerContextKey === ''
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, partyKind);
      const owner = {
        kind: write.selectorOwner === 'ActionSource' ? ('source' as const) : ('owner' as const),
      };
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner,
              query: {
                kind: 'characterTeam',
                excludeOwner: partyKind === 'partyExceptCaster',
                owner,
              },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (context.actionTargetTarget === 'currentAbilityEntity')
      throw new Error(`${node.sourcePath}: unaudited AbilityEntity target group`);
    if (context.actionTargetTarget === 'enemy')
      throw new Error(
        `${node.sourcePath}: unaudited single-enemy action target group ` +
          JSON.stringify({
            producerType: write.producerType,
            finderType: write.finderType,
            finderFactionTarget: write.finderFactionTarget,
            finderTargetObjectType: write.finderTargetObjectType,
            finderCheckAlive: write.finderCheckAlive,
            validatorTypes: write.validatorTypes,
            postProcessorTypes: write.postProcessorTypes,
            priorityFilterCount: write.priorityFilters.length,
            shuffleTargetCount: write.shuffleTargets.length,
            distanceValidatorCount: write.distanceValidators.length,
            center: write.center,
            centerContextKey: write.centerContextKey,
            centerKind: partyTargetGroups.get(write.centerContextKey),
            selectorOwner: write.selectorOwner,
            selectorOwnerContextKey: write.selectorOwnerContextKey,
          }),
      );
    if (
      context.actionTargetTarget === 'eventSource' &&
      write.producerType === 'ConvertToTargetContext' &&
      write.conversionOperation === 'None' &&
      write.inputTargets.length === 1 &&
      isPlainTargetGroupInput(write.inputTargets[0]!, 'Target')
    ) {
      return {
        steps: [
          {
            kind: 'mergeContextTargets' as const,
            parameters: {
              saveToContextKey: write.targetGroupKey,
              sources: [{ kind: 'target' as const, target: 'eventSource' as const }],
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (context.actionTargetTarget === 'eventSource')
      throw new Error(`${node.sourcePath}: unaudited receiving Buff event target group`);
    const action = node.body.value.action;
    if (action.producerType === 'MergeTargetAction') {
      const sources = action.inputTargets.map((target, index) => {
        if (target.targetSource === 'Target' && target.targetGroupKey === '') {
          return { kind: 'target' as const, target: 'eventTarget' as const };
        }
        if (target.targetSource === 'Context' && target.targetGroupKey !== '') {
          return { kind: 'context' as const, contextKey: target.targetGroupKey };
        }
        throw new Error(
          `${node.sourcePath}.targets[${index}]: unsupported Buff merge target source`,
        );
      });
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: { saveToContextKey: action.targetGroupKey, sources },
          },
        ],
        state: partyTargetGroups,
      };
    }
    throw new Error(
      `${node.sourcePath}: unsupported Buff target group query ` +
        JSON.stringify({
          producerType: write.producerType,
          finderType: write.finderType,
          validatorTypes: write.validatorTypes,
          postProcessorTypes: write.postProcessorTypes,
          excludesOwner: write.excludesOwner,
          center: write.center,
          centerContextKey: write.centerContextKey,
          selectorOwner: write.selectorOwner,
          selectorOwnerContextKey: write.selectorOwnerContextKey,
          actionOwnerTarget: context.actionOwnerTarget,
          actionSourceTarget: context.actionSourceTarget,
        }),
    );
  }
  return {
    steps: compileActionNode(node, visualOnlyIds, partyTargetGroups, context, extensions),
    state: partyTargetGroups,
  };
}

function projectCharacterTeamQuery(
  write: TargetGroupActionSource,
  context: CombatActionProjectionContextSource,
): {
  readonly selection:
    | { readonly kind: 'controlledOperator' }
    | {
        readonly kind: 'lowestHealthRatioOperator';
        readonly excludedContextKey?: string;
        readonly excludeCaster?: true;
        readonly excludeCurrentTarget?: true;
      };
} | null {
  const centerMatchesCaster =
    (write.center === 'ActionOwner' &&
      (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')) ||
    (write.center === 'ActionSource' && context.actionSourceTarget === 'caster');
  const selectorOwnerMatchesCaster =
    (write.selectorOwner === 'ActionOwner' &&
      (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')) ||
    // CharacterTeamFinder 直接读取全局 squadMembers；
    // selector owner 只需被公共管线成功解析，不参与其候选队伍计算。能力实体 ActionOwner
    // 是有效 AbilitySystem，且此处的 ActionSource 已独立证明为施术者。
    (write.selectorOwner === 'ActionOwner' &&
      context.actionOwnerTarget === 'currentAbilityEntity' &&
      context.actionSourceTarget === 'caster') ||
    (write.selectorOwner === 'ActionSource' && context.actionSourceTarget === 'caster') ||
    // MainCharacterValidator 把结果限定为全局主控；这类原生配置以 ActionSource 为队伍中心，
    // 即使动作宿主是敌方 Buff，序列化的 selectorOwner 也不改写候选队伍身份。
    (write.characterTeamSelection?.kind === 'controlledOperator' &&
      write.center === 'ActionSource' &&
      context.actionSourceTarget === 'caster');
  if (
    write.producerType !== 'FindTargetAction' ||
    write.finderType !== 'CharacterTeamFinder' ||
    write.characterTeamSelection === null ||
    write.characterTeamSelection === undefined ||
    !centerMatchesCaster ||
    write.centerContextKey !== '' ||
    !selectorOwnerMatchesCaster ||
    write.selectorOwnerContextKey !== ''
  ) {
    return null;
  }
  if (write.characterTeamSelection.kind === 'controlledOperator') {
    if (
      write.validatorTypes.length !== 1 ||
      write.validatorTypes[0] !== 'MainCharacterValidator' ||
      write.postProcessorTypes.length !== 0
    ) {
      return null;
    }
    return { selection: { kind: 'controlledOperator' } };
  }
  if (write.validatorTypes.length !== 0) return null;
  const excluded = write.characterTeamSelection.excludedTarget;
  if (excluded === null) {
    if (write.postProcessorTypes.length !== 1) return null;
    return { selection: { kind: 'lowestHealthRatioOperator' } };
  }
  if (write.postProcessorTypes.length !== 2 || !isPlainContextTarget(excluded)) {
    if (
      write.postProcessorTypes.length === 2 &&
      isPlainInputTarget(excluded) &&
      context.actionTargetTarget === 'currentOperator'
    ) {
      return {
        selection: {
          kind: 'lowestHealthRatioOperator',
          excludeCurrentTarget: true,
        },
      };
    }
    if (
      write.postProcessorTypes.length === 2 &&
      isPlainOwnerTarget(excluded) &&
      (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')
    ) {
      return {
        selection: {
          kind: 'lowestHealthRatioOperator',
          excludeCaster: true,
        },
      };
    }
    return null;
  }
  return {
    selection: {
      kind: 'lowestHealthRatioOperator',
      excludedContextKey: excluded.targetGroupKey,
    },
  };
}

function isPlainInputTarget(target: TargetReferenceSource): boolean {
  return (
    target.targetSource === 'Target' &&
    target.targetGroupKey === '' &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.selectorDirection === 'SourceForward' &&
    target.finderType === null &&
    target.finderShape === null &&
    target.finderOwnerPartsQuery === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

function isPlainTargetGroupInput(
  target: TargetGroupActionSource['inputTargets'][number] | TargetReferenceSource,
  targetSource: 'Context' | 'Owner' | 'Target' | 'Source',
): boolean {
  return (
    target.targetSource === targetSource &&
    (targetSource !== 'Context' || target.targetGroupKey !== '') &&
    (targetSource !== 'Owner' || target.targetGroupKey === '') &&
    (targetSource !== 'Source' || target.targetGroupKey === '') &&
    target.finderType === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

function isPlainContextTarget(target: TargetReferenceSource): boolean {
  return (
    target.targetSource === 'Context' &&
    target.targetGroupKey !== '' &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.selectorDirection === 'SourceForward' &&
    target.finderType === null &&
    target.finderShape === null &&
    target.finderOwnerPartsQuery === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

function withProjectileTargets(
  steps: readonly [Extract<CompiledBuffStepSource, { kind: 'launchProjectile' }>],
  targets: NonNullable<
    Extract<CompiledBuffStepSource, { kind: 'launchProjectile' }>['parameters']['targets']
  >,
): CompiledBuffStepSource[] {
  const [step] = steps;
  return [{ ...step, parameters: { ...step.parameters, targets } }];
}
