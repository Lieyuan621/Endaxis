import type { ActionTargetQuery } from '../../../../../packages/game-data-contract/src/conditions.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import { projectSelectorBuffValidators } from '../conditions/selectorBuffProjection.ts';
import {
  isPartyHitBoxTargetGroup,
  isDynamicSingleEnemyTagTargetGroup,
  projectGameplayTags,
} from '../combatProjectionCommon.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { CompiledBuffStepSource } from './combatActionProjectionTypes.ts';

import { projectAnimationCurveKeys } from '../animationCurveProjection.ts';
import type { TargetGroupActionSource } from '../../source/targetGroup.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import { projectNativeTagQueryType } from '../../source/tagQuery.ts';
import { projectFinishOwner } from './timelineControlProjection.ts';
import { compileTargetGroupAbilityEntityQuerySource } from '../abilities/abilityEntityQuery.ts';
import {
  type ProjectedTargetGroup,
  type CombatActionProjectionContextSource,
  type CombatActionProjectionExtensionsSource,
  isSingleRemainingEnemyTargetGroup,
  isStaticSingleEnemyTargetGroup,
  isZeroSpaceSingleEnemySmartTargetGroup,
  zeroDistanceValidatorsAlwaysPass,
  requireActionOwnerProjection,
  actionValueOperand,
  COMPARISON_OPERATORS,
  isPlainOwnerTarget,
} from '../combatProjectionCommon.ts';
import {
  compileActionNode,
  projectBuffAssignments,
  projectStringBuffAssignments,
} from './combatActionLeafProjection.ts';

/** 实体、时间膨胀、目标组和显式投射物扩展的叶子分派。
 * 本层按原顺序处理特殊分支，剩余动作委托普通叶子投影；目标组状态只沿调用返回。 */

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
    // 原生逐个消费目标视图；合并的固定落点与随机点具有相同的发射基数语义。
    const usesTargetGroup = target.targetSource === 'Context' && target.targetGroupKey !== '';
    return {
      steps: usesTargetGroup
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
    const sourceIsOwner = action.sourceType === 'ActionOwner';
    if (sourceIsOwner) requireActionOwnerProjection(context, node.sourcePath);
    const sourceIsActionSource = action.sourceType === 'ActionSource';
    const sourceContextKey =
      action.sourceType === 'ContextTarget' && action.sourceContextKey !== ''
        ? action.sourceContextKey
        : undefined;
    const sourceIsInput = action.sourceType === 'CurrentTarget';
    const targetQuery = action.setTarget
      ? projectActionTargetQuery(action.target, context, `${node.sourcePath}.abilityEntityTarget`)
      : undefined;
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
      (!sourceIsActionSource &&
        !sourceIsOwner &&
        !sourceIsInput &&
        sourceContextKey === undefined) ||
      action.checkNavmeshAreaName ||
      action.forbiddenAreaNames.length !== 0 ||
      !assignmentShapeMatches ||
      action.saveToContext !== (action.contextKey !== '')
    )
      throw new Error(
        `${node.sourcePath}: unsupported AbilityEntity spawn projection ` +
          JSON.stringify({
            setSource: action.setSource,
            sourceIsActionSource,
            sourceIsOwner,
            sourceContextKey: action.sourceContextKey,
            setTarget: action.setTarget,
            targetQuery,
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
        ...(action.sourceType === 'ActionSource' ? { source: { kind: 'source' as const } } : {}),
        ...(sourceIsOwner ? { source: { kind: 'owner' as const } } : {}),
        ...(sourceIsInput ? { source: { kind: 'inputTarget' as const } } : {}),
        ...(sourceContextKey === undefined
          ? {}
          : { source: { kind: 'context' as const, key: sourceContextKey } }),
        inheritActionBlackboard: action.assignBlackboard,
        ...(action.inheritSourceSkillCastId ? {} : { inheritSourceSkillCastInfo: false }),
        dieWhenSourceDies: action.dieWhenSourceDies,
        ...(action.dieOnEnd ? { finishByAction: true } : {}),
        ...(targetQuery === undefined ? {} : { target: targetQuery }),
        ...(action.allowMultiInputTarget ? { allowMultiInputTarget: true } : {}),
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
    return {
      steps: [
        {
          kind: 'setAbilityEntityTarget',
          parameters: {
            targets: projectActionTargetQuery(
              node.body.value.action.target,
              context,
              `${node.sourcePath}.target`,
            ),
          },
        },
      ],
      state: partyTargetGroups,
    };
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
          partyTargetGroups.get(action.defender.targetGroupKey) === 'dynamicEnemy' ||
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
    if (action.kind === 'blowOffEnemy') {
      if (action.deadOption !== 'OnlyDead')
        throw new Error(`${node.sourcePath}: live-target BlowOffEnemy processing is not projected`);
      return {
        steps: [
          {
            kind: 'blowOffEnemy',
            parameters: {
              source: projectActionTargetQuery(action.source, context, node.sourcePath),
              targets: projectActionTargetQuery(action.target, context, node.sourcePath),
              deadOption: 'OnlyDead',
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (action.kind === 'pushBack') {
      return {
        steps: [
          {
            kind: 'pushBack',
            parameters: {
              source: projectActionTargetQuery(action.source, context, node.sourcePath),
              targets: projectActionTargetQuery(action.target, context, node.sourcePath),
              sourcePoint: projectActionTargetQuery(action.sourcePoint, context, node.sourcePath),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (action.kind === 'pull') {
      return {
        steps: [
          {
            kind: 'pull',
            parameters: {
              targets: projectActionTargetQuery(
                action.target,
                context,
                `${node.sourcePath}.targetSettings`,
              ),
              destination: projectActionTargetQuery(
                action.source,
                context,
                `${node.sourcePath}.destination`,
              ),
              targetType: action.targetType,
              alwaysNext: action.alwaysNext,
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
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
      if (
        !sourceIsCaster ||
        !targetIsEnemy ||
        action.deadOption !== 'AllValid' ||
        action.returnTrueWhen !== 'Always'
      ) {
        throw new Error(`${node.sourcePath}: unsupported TakeDown stump projection`);
      }
      // TakeDownAction 进入敌人的受控动画状态机，不产生伤害、
      // 资源或物理异常事件。固定木桩没有主动/受控行为，邻接数值动作仍按原序执行。
      return { steps: [], state: partyTargetGroups };
    }
    if (action.kind === 'targetHitStop') {
      if (
        action.affectType !== 'OnlyAttacker' &&
        action.affectType !== 'OnlyTarget' &&
        action.affectType !== 'Both'
      )
        throw new Error(
          `${node.sourcePath}: unsupported hit-stop affect type ${action.affectType}`,
        );
      const priority = extensions.resolveTimeDilationPriority?.(
        action.priorityTagId,
        node.sourcePath,
      );
      if (priority === undefined || !Number.isFinite(priority))
        throw new Error(`${node.sourcePath}: unsupported hit-stop priority`);
      return {
        steps: [
          {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'hitStop',
              attacker: projectActionTargetQuery(
                action.source,
                context,
                `${node.sourcePath}.attacker`,
              ),
              targets: projectActionTargetQuery(
                action.target,
                context,
                `${node.sourcePath}.target`,
              ),
              affectType: action.affectType,
              durationSeconds: { kind: 'constant', value: action.durationSeconds },
              priority,
              curve:
                action.directCurveKeys.length > 0
                  ? {
                      kind: 'inline',
                      keys: projectAnimationCurveKeys(action.directCurveKeys, node.sourcePath),
                    }
                  : { kind: 'named', key: action.curveKey },
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      action.kind === 'enemyHurtAnimation' &&
      action.target.targetSource === 'Context' &&
      partyTargetGroups.get(action.target.targetGroupKey) === 'empty'
    )
      return { steps: [], state: partyTargetGroups };
    const targetIsEnemy =
      action.target.targetSource === 'Target' ||
      (action.target.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy') ||
      (action.target.targetSource === 'Context' &&
        (context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true ||
          partyTargetGroups.get(action.target.targetGroupKey) === 'enemy' ||
          partyTargetGroups.get(action.target.targetGroupKey) === 'dynamicEnemy'));
    // EnemyHurtAnimAction 只驱动敌方受击组件（部位会先取主体），不把动态目标组
    // 改写为敌人。沿用木桩受击/位移裁剪；此豁免不适用于 HitStop 或其他控制动作。
    const runtimeEnemyHurtAnimation =
      action.kind === 'enemyHurtAnimation' &&
      action.target.targetSource === 'Context' &&
      partyTargetGroups.get(action.target.targetGroupKey) === 'runtimeTargets';
    // 尚待接入的受击/吹飞控制保留原有目标范围诊断。
    if (!targetIsEnemy && !runtimeEnemyHurtAnimation)
      throw new Error(`${node.sourcePath}: unsupported static-enemy control projection`);
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
      return {
        steps: [
          {
            kind: 'setIgnoreGlobalTimeScale',
            parameters: {
              targets: projectActionTargetQuery(
                action.target,
                context,
                `${node.sourcePath}.target`,
              ),
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
      const ignoredTargets = action.ignoreTargets.map((target, index) =>
        projectActionTargetQuery(target, context, `${node.sourcePath}.ignoreTargets[${index}]`),
      );
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
              ignoredTargets,
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
      const targetsOnlyEnemy =
        action.effectTargets.length === 1 &&
        ((target?.targetSource === 'Owner' && context.fixedBuffOwnerTarget === 'enemy') ||
          (target?.targetSource === 'Target' && context.actionTargetTarget === 'enemy'));
      // TimeDilationAction：开关选择命名曲线时，内嵌曲线只是序列化残留。
      const usesNamedCurve = action.useCurveKey && action.curveKey.length > 0;
      // useCurveKey 是来源选择器；内联模式下命名 key 可以保留为未选中的序列化残值。
      const usesInlineCurve = !action.useCurveKey && action.inlineCurveKeys.length > 0;
      if (!action.useCurveKey && action.inlineCurveKeys.length === 0 && targetsOnlyEnemy) {
        // 空字面曲线的原生求值仍未知。固定木桩没有敌方主动
        // 行为或敌方技能时钟，故该实体减速对模拟不可观测；宿主 Buff 的寿命和图标照常保留。
        return { steps: [], state: partyTargetGroups };
      }
      if (!usesNamedCurve && !usesInlineCurve)
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
                    keys: projectAnimationCurveKeys(action.inlineCurveKeys, node.sourcePath),
                  },
              finishByAction: action.finishByAction,
              targets: action.effectTargets.map((target, index) =>
                projectActionTargetQuery(
                  target,
                  context,
                  `${node.sourcePath}.effectTargets[${index}]`,
                ),
              ),
            },
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      (action.useCurveKey && action.curveKey.length === 0) ||
      (!action.useCurveKey && action.inlineCurveKeys.length === 0)
    )
      throw new Error(`${node.sourcePath}: unsupported global time-dilation curve`);
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
            curve: action.useCurveKey
              ? { kind: 'named', key: action.curveKey }
              : {
                  kind: 'inline',
                  keys: projectAnimationCurveKeys(action.inlineCurveKeys, node.sourcePath),
                },
            finishByAction: action.finishByAction,
            ignoredTargets: action.ignoreTargets.map((target, index) =>
              projectActionTargetQuery(
                target,
                context,
                `${node.sourcePath}.ignoreTargets[${index}]`,
              ),
            ),
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
    if (write.producerType === 'ContinuousFindTargetAction') {
      const projected = compileBuffLeafNode(
        {
          ...node,
          body: {
            kind: 'leaf',
            value: {
              family: 'targetGroup',
              action: {
                ...write,
                producerType: 'FindTargetAction',
                intervalSeconds: null,
              },
            },
          },
        },
        visualOnlyIds,
        partyTargetGroups,
        context,
        extensions,
      );
      const step = projected.steps[0];
      if (
        projected.steps.length !== 1 ||
        step?.kind !== 'findTargets' ||
        write.intervalSeconds === null
      )
        throw new Error(`${node.sourcePath}: continuous target query requires a runtime query`);
      return {
        ...projected,
        steps: [
          {
            ...step,
            parameters: {
              ...step.parameters,
              continuousIntervalSeconds: write.intervalSeconds,
            },
          },
        ],
      };
    }
    if (write.producerType === 'MergeTargetAction') {
      const sources = write.inputTargets.map((target, index) =>
        projectActionTargetQuery(target, context, `${node.sourcePath}.targets[${index}]`),
      );
      const nextGroups = new Map(partyTargetGroups);
      const inputGroups = write.inputTargets.map(target =>
        target.targetSource === 'Context'
          ? partyTargetGroups.get(target.targetGroupKey)
          : undefined,
      );
      let group: ProjectedTargetGroup = 'runtimeTargets';
      if (sources.length === 0) group = 'empty';
      else if (
        context.staticEnemyTargetGroupKeys?.has(write.targetGroupKey) ||
        isStaticSingleEnemyTargetGroup(write) ||
        (sources.length === 1 &&
          sources[0]?.kind === 'inputTarget' &&
          context.actionTargetTarget === 'enemy')
      )
        group = 'enemy';
      else if (inputGroups.every(kind => kind !== undefined && kind === inputGroups[0]))
        group = inputGroups[0]!;
      else if (
        sources.length === 1 &&
        sources[0]?.kind === 'inputTarget' &&
        context.actionTargetTarget === 'currentOperator'
      )
        group = 'contextOperator';
      else if (
        sources.length === 2 &&
        sources.some(source => source.kind === 'owner') &&
        (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')
      ) {
        if (inputGroups.includes('controlledOperator')) group = 'casterAndControlledOperator';
        else if (inputGroups.includes('lowestHealthRatioOperatorExceptCaster'))
          group = 'casterAndLowestHealthRatioOperatorExceptCaster';
      }
      // 种类证明只供后续闭包分析；运行时仍按原生输入顺序逐项求值和去重。
      nextGroups.set(write.targetGroupKey, group);
      return {
        steps: [
          {
            kind: 'mergeContextTargets',
            parameters: { saveToContextKey: write.targetGroupKey, sources },
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
        ? context.actionOwnerTarget === 'currentAbilityEntity' &&
          context.actionTargetTarget === 'enemy'
          ? 'enemy'
          : 'runtimeTargets'
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
        // 原生逐项替换部位，非部位原样保留；种类证明不能替代本次集合读取。
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
      write.finderType === 'TyphoeaArcherySelectedFinder' &&
      write.validatorTypes.every(type => type === 'TagValidator') &&
      write.validatorTagQueries.length === write.validatorTypes.length &&
      write.postProcessorTypes.every(type => type === 'PriorityFilter')
    ) {
      let query: ActionTargetQuery = { kind: 'typhoeaArcherySelected' };
      for (const [type, tags] of write.validatorTagQueries)
        query = {
          kind: 'tagFilter',
          targets: query,
          tagQueryType: projectNativeTagQueryType(type, node.sourcePath),
          tags: projectGameplayTags(tags, context, node.sourcePath),
        };
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner: projectSelectorOwner(write, node.sourcePath),
              query: projectCoincidentEnemyPriority(query, write.priorityFilters, node.sourcePath),
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'FindTargetAction' &&
      (write.finderType === 'AllEnemyFinder' || write.finderType === 'InFightEnemyFinder') &&
      write.postProcessorTypes.every(
        type => type === 'ExcludeTarget' || type === 'PriorityFilter',
      ) &&
      write.postProcessorTypes.filter(type => type === 'ExcludeTarget').length <= 1 &&
      (!write.postProcessorTypes.includes('ExcludeTarget') ||
        write.postProcessorTypes[0] === 'ExcludeTarget') &&
      (write.postProcessorTypes[0] !== 'ExcludeTarget' ||
        (write.excludeTargets?.length === 1 &&
          write.excludeTargets[0]!.targetSource === 'Context' &&
          write.excludeTargets[0]!.targetGroupKey !== '')) &&
      (isStaticSingleEnemyTargetGroup({ ...write, postProcessorTypes: [], priorityFilters: [] }) ||
        isDynamicSingleEnemyTagTargetGroup({
          ...write,
          postProcessorTypes: [],
          priorityFilters: [],
        }))
    ) {
      // 独立遍历敌人目录；排除、限数都在运行时执行，不能由旧单元素证明覆盖。
      let query: ActionTargetQuery =
        write.validatorTagQueries.length === 0
          ? {
              kind: 'enemyByTags',
              scope: 'global',
              reverse: true,
              tagQueryType: 'hasAll',
              tags: [],
            }
          : {
              kind: 'enemyByTags',
              scope: 'global',
              reverse: true,
              tagQueryType: projectNativeTagQueryType(
                write.validatorTagQueries[0]![0],
                node.sourcePath,
              ),
              tags: projectGameplayTags(write.validatorTagQueries[0]![1], context, node.sourcePath),
            };
      if (write.postProcessorTypes[0] === 'ExcludeTarget') {
        const excluded = write.excludeTargets?.[0];
        if (!excluded) throw new Error(`${node.sourcePath}: missing exclusion target`);
        query = {
          kind: 'exclude',
          targets: query,
          excludeTargets: { kind: 'context', key: excluded.targetGroupKey },
        };
      }
      query = projectCoincidentEnemyPriority(query, write.priorityFilters, node.sourcePath);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner: projectSelectorOwner(write, node.sourcePath),
              center: projectSelectorOwner(
                { selectorOwner: write.center, selectorOwnerContextKey: write.centerContextKey },
                node.sourcePath,
              ),
              query,
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (context.actionTargetTarget === 'enemy' && isSingleRemainingEnemyTargetGroup(write)) {
      if (write.finderContainsUnMarkable === undefined)
        throw new Error(`${node.sourcePath}: missing hit-box unmarkable policy`);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner: projectSelectorOwner(write, node.sourcePath),
              center: { kind: 'source' },
              query: {
                kind: 'limit',
                count: 1,
                targets: {
                  kind: 'exclude',
                  targets: {
                    kind: 'factionHitBox',
                    owner: projectSelectorOwner(write, node.sourcePath),
                    factionTarget: 'anti',
                    checkAlive: true,
                    containsUnmarkable: write.finderContainsUnMarkable,
                    replacePartsWithMainBodies: false,
                    ...(write.finderAutoSetTargetFaction === false
                      ? { targetFactions: ['bad' as const] }
                      : {}),
                  },
                  excludeTargets: { kind: 'inputTarget' },
                },
              },
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
      write.postProcessorTypes[0] === 'PriorityFilter'
    ) {
      const input = write.inputTargets[0];
      const detail = write.targetPostProcessor;
      if (
        input &&
        detail &&
        write.inputTargets.length === 1 &&
        isPlainTargetGroupInput(input, 'Context') &&
        (context.staticEnemyTargetGroupKeys?.has(input.targetGroupKey) ||
          partyTargetGroups.get(input.targetGroupKey) === 'enemy' ||
          partyTargetGroups.get(input.targetGroupKey) === 'dynamicEnemy') &&
        isPlainTargetGroupInput(detail.source, 'Source') &&
        isPlainTargetGroupInput(detail.center, 'Context') &&
        detail.center.targetGroupKey === input.targetGroupKey &&
        detail.direction.directionType === 'SourceForward' &&
        !detail.direction.customSourceAndTarget &&
        write.validatorTypes.length === 0 &&
        write.shuffleTargets.length === 0 &&
        write.distanceValidators.length === 0
      ) {
        const nextGroups = new Map(partyTargetGroups);
        nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
        return {
          steps: [
            {
              kind: 'copyContextTargets',
              parameters: {
                source: projectCoincidentEnemyPriority(
                  { kind: 'context', key: input.targetGroupKey },
                  write.priorityFilters,
                  node.sourcePath,
                ),
                saveToContextKey: write.targetGroupKey,
              },
            },
          ],
          state: nextGroups,
        };
      }
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
      (write.finderAutoSetTargetFaction === true ||
        (write.finderAutoSetTargetFaction === false && write.finderTargetFactionType === 'Bad')) &&
      (write.finderFactionTarget === 'Ally' || write.finderFactionTarget === 'Anti') &&
      // 简化场景没有场景交互物；NoInteractive 仍查询所有满足条件的战斗对象。
      (write.finderTargetObjectType === 'Normal' ||
        write.finderTargetObjectType === 'NoInteractive') &&
      write.finderCheckAlive !== null &&
      write.finderContainsUnMarkable !== undefined &&
      write.validatorTypes.every(
        type =>
          type === 'BuffValidator' || type === 'TagValidator' || type === 'TargetContainsValidator',
      ) &&
      (write.targetContainsParents?.length ?? 0) ===
        write.validatorTypes.filter(type => type === 'TargetContainsValidator').length &&
      (write.buffValidators?.length ?? 0) ===
        write.validatorTypes.filter(type => type === 'BuffValidator').length &&
      write.validatorTagQueries.length ===
        write.validatorTypes.filter(type => type === 'TagValidator').length &&
      (write.validatorTypes.length === 0 ||
        write.postProcessorTypes.every(type => type === 'PriorityFilter')) &&
      write.postProcessorTypes.every(
        type =>
          type === 'ReplacePartWithMainBody' ||
          type === 'PriorityFilter' ||
          type === 'ExcludeTarget',
      ) &&
      write.postProcessorTypes.length <= 1 &&
      (write.priorityFilters.length === 0 ||
        write.finderFactionTarget === 'Anti' ||
        write.finderAutoSetTargetFaction === false) &&
      write.shuffleTargets.length === 0 &&
      write.distanceValidators.length === 0 &&
      (write.selectorOwner === 'ActionOwner' || write.selectorOwner === 'ActionSource') &&
      (write.center === 'ActionOwner' ||
        write.center === 'ActionSource' ||
        write.center === 'InputTarget' ||
        (write.center === 'ContextTarget' && write.centerContextKey !== '')) &&
      (context.actionOwnerTarget === 'currentAbilityEntity' ||
        context.actionOwnerTarget === 'buffOwner' ||
        context.actionOwnerTarget === 'caster')
    ) {
      let query: ActionTargetQuery = projectSelectorBuffValidators(
        {
          kind: 'factionHitBox',
          ...(write.finderAutoSetTargetFaction === false
            ? { targetFactions: ['bad' as const] }
            : {}),
          factionTarget: write.finderFactionTarget === 'Ally' ? 'ally' : 'anti',
          owner: projectSelectorOwner(write, node.sourcePath),
          checkAlive: write.finderCheckAlive,
          containsUnmarkable: write.finderContainsUnMarkable,
          replacePartsWithMainBodies: write.postProcessorTypes.includes('ReplacePartWithMainBody'),
        },
        write.buffValidators ?? [],
        context,
        node.sourcePath,
      );
      for (const [type, tags] of write.validatorTagQueries)
        query = {
          kind: 'tagFilter',
          targets: query,
          tagQueryType: projectNativeTagQueryType(type, node.sourcePath),
          tags: projectGameplayTags(tags, context, node.sourcePath),
        };
      for (const parent of write.targetContainsParents ?? [])
        query = {
          kind: 'intersection',
          targets: query,
          parentTargets: projectActionTargetQuery(parent, context, node.sourcePath),
        };
      if (write.postProcessorTypes.includes('ExcludeTarget')) {
        const excluded = write.excludeTargets ?? [];
        if (excluded.length === 0 && !write.excludesOwner)
          throw new Error(`${node.sourcePath}: missing hit-box exclusion targets`);
        for (const target of excluded)
          query = {
            kind: 'exclude',
            targets: query,
            excludeTargets: projectActionTargetQuery(target, context, node.sourcePath),
          };
        if (excluded.length === 0)
          query = { kind: 'exclude', targets: query, excludeTargets: { kind: 'owner' } };
      }
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(
        write.targetGroupKey,
        write.finderAutoSetTargetFaction === false || write.finderFactionTarget === 'Anti'
          ? 'dynamicEnemy'
          : 'runtimeTargets',
      );
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner: projectSelectorOwner(write, node.sourcePath),
              ...(write.center === 'InputTarget'
                ? { center: { kind: 'inputTarget' as const } }
                : {}),
              ...(write.center === 'ContextTarget' &&
              !(
                context.staticZeroSpaceTargetGroupKeys?.has(write.centerContextKey) &&
                context.guaranteedSingletonZeroSpaceTargetGroupKeys?.has(write.centerContextKey)
              )
                ? { center: { kind: 'context' as const, key: write.centerContextKey } }
                : {}),
              query: projectCoincidentEnemyPriority(query, write.priorityFilters, node.sourcePath),
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
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
      (partyTargetGroups.get(write.inputTargets[0].targetGroupKey) === 'enemy' ||
        partyTargetGroups.get(write.inputTargets[0].targetGroupKey) === 'dynamicEnemy' ||
        context.enemyTargetGroupKeys?.has(write.inputTargets[0].targetGroupKey) === true) &&
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
      // 输入目标未必等于组内敌人；排除后是否为空必须由运行时身份比较决定。
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'copyContextTargets',
            parameters: {
              source: { kind: 'context', key: write.inputTargets[0].targetGroupKey },
              excludeTargets: { kind: 'inputTarget' },
              saveToContextKey: write.targetGroupKey,
            },
          },
        ],
        state: nextGroups,
      };
    }
    if (context.staticEmptyTargetGroupKeys?.has(write.targetGroupKey)) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'empty');
      return {
        steps: context.materializedTargetGroupKeys?.has(write.targetGroupKey)
          ? [
              {
                kind: 'mergeContextTargets',
                parameters: { saveToContextKey: write.targetGroupKey, sources: [] },
              },
            ]
          : [],
        state: nextGroups,
      };
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
      // AllEnemyFinder 独立遍历 allEnemies，不依赖宿主或输入目标的类型。
      // 实体被动的接收侧事件 Target/Source 都是事件身份；InFightEnemyFinder 仍从战斗目录
      // 独立筛选敌人。固定木桩模型保留标签动态判定，不能把事件发送者冒充为敌人。
      const rawQuery = write.validatorTagQueries[0]!;
      const queryType = projectNativeTagQueryType(
        rawQuery[0],
        `${node.sourcePath}.validatorTagQueries[0]`,
      );
      const owner = projectSelectorOwner(write, node.sourcePath);
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
                ...(write.finderType === 'AllEnemyFinder' ||
                write.finderType === 'InFightEnemyFinder'
                  ? { scope: 'global' as const, reverse: true }
                  : {}),
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
    const smart = write.smartTargetSelection;
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'SmartTargetFinder' &&
      smart?.strategy === 'SelectByTag' &&
      !smart.useCustomRange &&
      !smart.limitFallbackRange &&
      context.actionSourceTarget === 'caster' &&
      write.selectorOwner === 'ActionSource' &&
      write.selectorOwnerContextKey === '' &&
      write.centerContextKey === '' &&
      (write.center === 'ActionOwner' || write.center === 'ActionSource') &&
      write.validatorTypes.every(type => type === 'DistanceValidator') &&
      zeroDistanceValidatorsAlwaysPass(write) &&
      write.postProcessorTypes.every(
        type => type === 'ExcludeTarget' || type === 'PriorityFilter',
      ) &&
      write.priorityFilters.every(
        filter =>
          filter.filterType === 'DistanceFromOwnerAsc' &&
          (!filter.limitMaxNum || filter.maxNum >= 1),
      ) &&
      (!write.postProcessorTypes.includes('ExcludeTarget') ||
        (write.excludesOwner &&
          write.postProcessorTypes.filter(type => type === 'ExcludeTarget').length === 1))
    ) {
      const owner = projectSelectorOwner(write, node.sourcePath);
      let query: ActionTargetQuery = {
        kind: 'smartTargetByTag',
        owner,
        tagQueryType: projectNativeTagQueryType(smart.tagQuery.queryType, node.sourcePath),
        tags: projectGameplayTags(smart.tagQuery.tagIds, context, node.sourcePath),
      };
      // Finder 只产生一个目标；距离排序不会改变它。排除在选择及回退之后执行，不能再次搜索。
      if (write.postProcessorTypes.includes('ExcludeTarget'))
        query = { kind: 'exclude', targets: query, excludeTargets: { kind: 'owner' } };
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: { owner, query, saveToContextKey: write.targetGroupKey },
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
      // 多敌人时智能选择与主目标并不等价：先读动态 Buff/标签，再执行主目标回退。
      const owner = { kind: write.selectorOwner === 'ActionOwner' ? 'owner' : 'source' } as const;
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'dynamicEnemy');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner,
              query:
                smart!.strategy === 'SelectByBuff'
                  ? { kind: 'smartTargetByBuff', owner, buffIds: smart!.buffIds }
                  : {
                      kind: 'smartTargetByTag',
                      owner,
                      tags: projectGameplayTags(smart!.tagQuery.tagIds, context, node.sourcePath),
                      tagQueryType: projectNativeTagQueryType(
                        smart!.tagQuery.queryType,
                        node.sourcePath,
                      ),
                    },
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
              ...(query.objectFilter === 'none' ? { objectType: 'none' as const } : {}),
              tagFilters: query.validators
                .filter(v => v.kind === 'tag')
                .map(v => ({
                  queryType: v.query.queryType,
                  tags: projectGameplayTags(v.query.tagIds, context, node.sourcePath),
                })),
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
      isPlainTargetGroupInput(write.inputTargets[0]!, 'Context') &&
      write.pickIndexValue !== null
    ) {
      const sourceContextKey = write.inputTargets[0]!.targetGroupKey;
      const nextGroups = new Map(partyTargetGroups);
      // 选择的是运行时集合中的一项，并非整队或固定木桩；失败时保留旧输出组。
      nextGroups.set(write.targetGroupKey, 'runtimeTargets');
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
                  owner: { kind: write.selectorOwner === 'ActionSource' ? 'source' : 'owner' },
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
    if (
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'CharacterTeamFinder' &&
      write.validatorTypes.length === 2 &&
      write.validatorTypes[0] === 'MainCharacterValidator' &&
      write.validatorTypes[1] === 'DistanceValidator' &&
      write.distanceValidators.length === 1 &&
      write.postProcessorTypes.length === 0 &&
      write.center === 'ActionOwner' &&
      write.centerContextKey === '' &&
      write.selectorOwner === 'ActionOwner' &&
      write.selectorOwnerContextKey === ''
    ) {
      const distance = write.distanceValidators[0]!;
      const operator = COMPARISON_OPERATORS[distance.compareType];
      if (!operator) throw new Error(`${node.sourcePath}: unsupported distance comparison`);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'runtimeTargets');
      return {
        steps: [
          {
            kind: 'findTargets',
            parameters: {
              owner: { kind: 'owner' },
              query: {
                kind: 'distanceFilter',
                targets: { kind: 'mainCharacter' },
                center: { kind: 'owner' },
                operator,
                threshold: actionValueOperand(distance.threshold),
                clampToXZ: distance.clampToXZ,
              },
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
      const centerOrigin =
        write.center === 'ActionOwner'
          ? { kind: 'owner' as const }
          : write.center === 'ActionSource'
            ? { kind: 'source' as const }
            : write.center === 'MainCharacter'
              ? { kind: 'mainCharacter' as const }
              : write.center === 'ContextTarget' && write.centerContextKey
                ? { kind: 'context' as const, key: write.centerContextKey }
                : ['InputTarget', 'CurrentTarget'].includes(write.center ?? '')
                  ? { kind: 'inputTarget' as const }
                  : undefined;
      return {
        steps:
          context.materializedTargetGroupKeys?.has(write.targetGroupKey) === true
            ? [
                {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: write.targetGroupKey,
                    count: { kind: 'constant', value: 1 },
                    ...(write.finderSpatialPoint?.kind === 'ownerMountPoint'
                      ? { origin: projectSelectorOwner(write, node.sourcePath) }
                      : centerOrigin === undefined
                        ? {}
                        : { origin: centerOrigin }),
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
      write.finderRandomPoint !== undefined &&
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
            context.actionOwnerTarget === 'buffOwner' ||
            context.actionOwnerTarget === 'currentAbilityEntity')) ||
        (write.center === 'ContextTarget' &&
          write.centerContextKey !== '' &&
          context.staticZeroSpaceTargetGroupKeys?.has(write.centerContextKey) === true)) &&
      (write.center === 'ContextTarget' || write.centerContextKey === '') &&
      write.selectorOwner === 'ActionOwner' &&
      write.selectorOwnerContextKey === ''
    ) {
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'spatialPoint');
      if (context.materializedTargetGroupKeys?.has(write.targetGroupKey) !== true)
        return { steps: [], state: nextGroups };
      const origin =
        write.center === 'ContextTarget'
          ? { kind: 'context' as const, key: write.centerContextKey }
          : write.center === 'InputTarget'
            ? { kind: 'inputTarget' as const }
            : write.center === 'ActionSource'
              ? { kind: 'source' as const }
              : { kind: 'owner' as const };
      // 逻辑点保留数量与来源是否存在；方向、半径和地形不参与模拟。

      const sourceCount =
        write.finderRandomPoint.count.blackboardKey === null
          ? { kind: 'constant' as const, value: write.finderRandomPoint.count.value }
          : {
              kind: 'blackboard' as const,
              key: write.finderRandomPoint.count.blackboardKey,
            };
      return {
        steps: [
          {
            kind: 'createSpatialPointTargets',
            parameters: {
              saveToContextKey: write.targetGroupKey,
              count: sourceCount,
              origin,
            },
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
      const origin =
        write.center === 'MainCharacter'
          ? { kind: 'mainCharacter' as const }
          : write.center === 'ActionSource'
            ? { kind: 'source' as const }
            : write.center === 'ContextTarget'
              ? { kind: 'context' as const, key: write.centerContextKey }
              : { kind: 'inputTarget' as const };
      return {
        steps:
          context.materializedTargetGroupKeys?.has(write.targetGroupKey) === true
            ? [
                {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: write.targetGroupKey,
                    count: { kind: 'constant', value: 1 },
                    origin,
                  },
                },
              ]
            : [],
        state: nextGroups,
      };
    }
    if (
      write.producerType === 'ConvertToTargetContext' &&
      write.conversionOperation === 'ConvertEntityToPosition'
    ) {
      if (!write.conversionSource) throw new Error(`${node.sourcePath}: missing conversion source`);
      const nextGroups = new Map(partyTargetGroups);
      nextGroups.set(write.targetGroupKey, 'spatialPoint');
      return {
        steps: [
          {
            kind: 'copyContextTargets',
            parameters: {
              source: projectActionTargetQuery(write.conversionSource, context, node.sourcePath),
              saveToContextKey: write.targetGroupKey,
              convertEntitiesToPositions: true,
            },
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
    if (context.actionTargetTarget === 'eventSource')
      throw new Error(`${node.sourcePath}: unaudited receiving Buff event target group`);
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
  steps: readonly [] | readonly [Extract<CompiledBuffStepSource, { kind: 'launchProjectile' }>],
  targets: NonNullable<
    Extract<CompiledBuffStepSource, { kind: 'launchProjectile' }>['parameters']['targets']
  >,
): CompiledBuffStepSource[] {
  if (steps.length === 0) return [];
  const [step] = steps;
  return [{ ...step, parameters: { ...step.parameters, targets } }];
}

function projectSelectorOwner(
  write: Pick<TargetGroupActionSource, 'selectorOwner' | 'selectorOwnerContextKey'>,
  path: string,
) {
  switch (write.selectorOwner) {
    case 'CurrentTarget':
    case 'InputTarget':
      return { kind: 'inputTarget' as const };
    case 'ActionOwner':
      return { kind: 'owner' as const };
    case 'ActionSource':
      return { kind: 'source' as const };
    case 'MainCharacter':
      return { kind: 'mainCharacter' as const };
    case 'ContextTarget':
      return { kind: 'context' as const, key: write.selectorOwnerContextKey };
    default:
      throw new Error(`${path}: unsupported selector owner ${write.selectorOwner}`);
  }
}

/** 敌人位置重合：保留原生数量限制，等权时以输入顺序作确定性简化（原生使用对象哈希决胜）。 */
function projectCoincidentEnemyPriority(
  query: ActionTargetQuery,
  filters: TargetGroupActionSource['priorityFilters'],
  sourcePath: string,
): ActionTargetQuery {
  for (const filter of filters) {
    if (
      ![
        'DistanceFromCenterAsc',
        'DistanceFromCenterDes',
        'DistanceFromOwnerAsc',
        'DistanceFromOwnerDes',
        'DistanceFromMainCharAsc',
        'DistanceFromMainCharDes',
        // 重合木桩的屏幕位置同样并列，保留原候选顺序及数量上限。
        'ScreenPosLeftToRight',
        'ScreenPosRightToLeft',
        'ScreenPosClosestToCenter',
      ].includes(filter.filterType) ||
      filter.buffFilter.checkType !== 'Id' ||
      filter.buffFilter.buffIds.length !== 0 ||
      filter.buffFilter.tagQuery.tagIds.length !== 0
    )
      throw new Error(`${sourcePath}: unsupported enemy priority ${filter.filterType}`);
    const count = filter.limitMaxNum ? filter.maxNum : 128;
    if (!Number.isSafeInteger(count) || count < 0)
      throw new Error(`${sourcePath}: invalid enemy target limit ${count}`);
    query = { kind: 'limit', targets: query, count };
  }
  return query;
}
