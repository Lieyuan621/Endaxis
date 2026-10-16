import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import type { CombatFaction } from '../../../../../packages/game-data-contract/src/primitives.ts';
import { COMPILED_BUFF_TARGET_KINDS } from '../buffs/compiledBuffMetadata.ts';
import type {
  AbilityEntityDefinition,
  AbilityEntityPassiveSkillDefinition,
} from '../intermediateDefinitions.ts';
import type { NativeAbilityEntityTemplateSource } from '../../source/abilityEntity.ts';
import { compileAbilityEntityChildSkillSource } from './abilityEntityChildSkill.ts';
import { compilePassiveSkillSource } from '../skills/passiveSkillDefinition.ts';
import { selectSkillBlackboardLevel } from '../skills/skillBlackboard.ts';
import { materializePassiveBuffInstallation } from '../skills/passiveSkillInstallation.ts';
import { compileCombatActionSequenceSource } from '../buffs/buffRuntimeProjection.ts';
import { isPresentationOnlyActionSequence } from '../skills/skillPresentationTargets.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import { projectAbilityEvent } from './abilityEventProjection.ts';
import type { CombatActionProjectionExtensionsSource } from '../combatProjectionCommon.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import { projectGameplayTags } from '../combatProjectionCommon.ts';
import { createActionGraphBuilder } from '../actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../actions/combatActionProjectionTypes.ts';

/** 原生 FactionIndex；数值仅在来源转换侧解释，不依赖公共枚举的排列顺序。 */
const NATIVE_FACTIONS: Readonly<Record<number, CombatFaction>> = {
  0: 'invalid',
  1: 'unknown',
  2: 'good',
  3: 'bad',
  4: 'neutral',
};

/** 只接入现有零空间运行时可表示的模板寿命；子技能身份来自 Spawn 动作，不从模板名称推导。 */
export function compileAbilityEntityDefinitionSource(
  template: NativeAbilityEntityTemplateSource,
  skillIds: string | readonly string[],
  loadSkill: (id: string) => unknown,
  visualOnlyIds: ReadonlySet<string> = new Set(),
  gameplayTagRegistry?: GameplayTagRegistry,
  extensions?:
    | CombatActionProjectionExtensionsSource
    | ((skillId: string) => CombatActionProjectionExtensionsSource),
  abilityEntityQueries?: CombatActionProjectionContextSource['abilityEntityQueries'],
  nativeMissingBlackboardZeroKeys?: (skillId: string) => ReadonlySet<string>,
  predefinedTagQueries?: CombatActionProjectionContextSource['predefinedTagQueries'],
): AbilityEntityDefinition {
  const faction = NATIVE_FACTIONS[template.factionNativeValue];
  if (faction === undefined)
    throw new Error(
      `${template.gameId}: unsupported native faction ${template.factionNativeValue}`,
    );
  if (
    template.abilitySystemType !== undefined &&
    template.abilitySystemType !== 'AbilitySystemData' &&
    !(template.abilitySystemType === 'AbilitySystemForSoulData' && template.soul !== undefined)
  )
    throw new Error(
      `${template.gameId}: unsupported ability system ${template.abilitySystemType}; native part/soul damage routing is required`,
    );
  if (
    template.maxStackingCount < -1 ||
    template.delayToRecycleSeconds >= 300 ||
    template.delayRecyclePerformSeconds !== 0 ||
    template.sendDieEvent
  )
    throw new Error(
      `${template.gameId}: unsupported AbilityEntity lifetime/stacking projection ` +
        JSON.stringify({
          durationBlackboardKey: template.durationBlackboard.blackboardKey,
          maxStackingCountBlackboardKey: template.maxStackingCountBlackboard.blackboardKey,
          maxStackingCount: template.maxStackingCount,
          maxDurationForServerSeconds: template.maxDurationForServerSeconds,
          delayToRecycleSeconds: template.delayToRecycleSeconds,
          delayRecyclePerformSeconds: template.delayRecyclePerformSeconds,
          sendDieEvent: template.sendDieEvent,
        }),
    );
  if (template.lifeTypeNativeValue !== 0 && template.lifeTypeNativeValue !== 1)
    throw new Error(`${template.gameId}: unsupported AbilityEntity life type`);
  const ids =
    typeof skillIds === 'string'
      ? skillIds
        ? [skillIds]
        : []
      : [...skillIds].filter(skillId => skillId.length > 0);
  if (ids.length > 0 && template.activeSkillTypes === undefined)
    throw new Error(`${template.gameId}: missing native skill registration`);
  // 出生动作可以携带已经不在实体技能表中的旧引用；原生只会施法失败。
  // 已登记技能仍必须加载并完整编译，不能把资源缺失当作未登记。
  const childSkills = ids
    .filter(skillId => template.activeSkillTypes?.[skillId] !== undefined)
    .map(skillId => {
      const nativeSkillType = template.activeSkillTypes?.[skillId];
      if (nativeSkillType === undefined)
        throw new Error(`${template.gameId}: missing native skill registration for ${skillId}`);
      const childExtensions = typeof extensions === 'function' ? extensions(skillId) : extensions;
      const childSkill = compileAbilityEntityChildSkillSource(
        loadSkill(skillId),
        `SkillData.${skillId}`,
        visualOnlyIds,
        gameplayTagRegistry,
        childExtensions,
        abilityEntityQueries,
        nativeMissingBlackboardZeroKeys?.(skillId),
        nativeSkillType,
        predefinedTagQueries,
      );
      if (childSkill.skillId !== skillId)
        throw new Error(`${template.gameId}: child skill identity mismatch`);
      return childSkill;
    });
  const passiveSkills = (template.skillDataBundle?.enabledPassiveSkillIds ?? []).map(skillId =>
    compileAbilityEntityPassiveSkill(
      skillId,
      loadSkill(skillId),
      visualOnlyIds,
      gameplayTagRegistry,
      typeof extensions === 'function' ? extensions(skillId) : extensions,
      abilityEntityQueries,
      predefinedTagQueries,
    ),
  );
  const entityBlackboard = Object.fromEntries(
    (template.entityBlackboard ?? []).map(entry => [entry.key, entry.value]),
  );
  return {
    faction,
    ...(template.soul === undefined
      ? {}
      : {
          soul: {
            ...template.soul,
            soulDamageRatio:
              template.soul.soulDamageRatio.blackboardKey === null
                ? template.soul.soulDamageRatio.value
                : {
                    blackboardKey: template.soul.soulDamageRatio.blackboardKey,
                    fallback: template.soul.soulDamageRatio.value,
                  },
            soulPoiseRatio:
              template.soul.soulPoiseRatio.blackboardKey === null
                ? template.soul.soulPoiseRatio.value
                : {
                    blackboardKey: template.soul.soulPoiseRatio.blackboardKey,
                    fallback: template.soul.soulPoiseRatio.value,
                  },
          },
        }),
    ...(template.bornTagIds.length === 0
      ? {}
      : {
          bornTags: projectGameplayTags(
            template.bornTagIds,
            { gameplayTagRegistry, abilityEntityQueries },
            `${template.gameId}.bornTagIds`,
          ),
        }),
    ...(Object.keys(entityBlackboard).length === 0 ? {} : { blackboard: entityBlackboard }),
    // AbilityEntityController.OnSpawn (当前 RVA 0x03EB4ADE..0x03EB4BBF) 在包装值非零或
    // 启用黑板键时读取 durationBB；两者都没有时才回退模板的 duration 字段。
    lifetime:
      template.lifeTypeNativeValue === 0
        ? {
            kind: 'limited',
            durationSeconds:
              template.durationBlackboard.blackboardKey !== null
                ? {
                    blackboardKey: template.durationBlackboard.blackboardKey,
                    fallback: template.durationBlackboard.value,
                  }
                : template.durationBlackboard.value !== 0
                  ? template.durationBlackboard.value
                  : template.durationSeconds,
          }
        : { kind: 'infinite' },
    ...(template.delayToRecycleSeconds === 0
      ? {}
      : { deathReleaseDelaySeconds: template.delayToRecycleSeconds }),
    ...(template.maxStackingCount > 0
      ? {
          maxStackingCount:
            template.maxStackingCountBlackboard.blackboardKey === null
              ? template.maxStackingCount
              : {
                  blackboardKey: template.maxStackingCountBlackboard.blackboardKey,
                  fallback: template.maxStackingCount,
                },
        }
      : {}),
    ...(childSkills.length === 1
      ? { childSkill: childSkills[0]! }
      : childSkills.length === 0
        ? {}
        : { childSkills: Object.fromEntries(childSkills.map(skill => [skill.skillId, skill])) }),
    ...(passiveSkills.length === 0 ? {} : { passiveSkills }),
  };
}

function compileAbilityEntityPassiveSkill(
  skillId: string,
  value: unknown,
  visualOnlyIds: ReadonlySet<string>,
  gameplayTagRegistry?: GameplayTagRegistry,
  extensions?: CombatActionProjectionExtensionsSource,
  abilityEntityQueries?: CombatActionProjectionContextSource['abilityEntityQueries'],
  predefinedTagQueries?: CombatActionProjectionContextSource['predefinedTagQueries'],
): AbilityEntityPassiveSkillDefinition {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const sourcePath = `SkillData.${skillId}`;
  const compiled = compilePassiveSkillSource(value, sourcePath, null);
  const skill = compiled.skill;
  if (
    skill.skillId !== skillId ||
    skill.passiveType !== 'AddBuff' ||
    skill.toggleBuffs.length > 0 ||
    compiled.hasCardAttributeModifiers ||
    skill.actionGraph.actionGroup.timelineActions.some(
      timeline => !isPresentationOnlyActionSequence(timeline.sequence),
    )
  ) {
    throw new Error(`${sourcePath}: unsupported AbilityEntity passive SkillData program`);
  }
  const blackboard = selectSkillBlackboardLevel(compiled.blackboard, null).values;
  const enableSteps = skill.startupBuffs.map((buff, index) => {
    const materialized = materializePassiveBuffInstallation(buff, blackboard);
    const assignments = Object.fromEntries(
      Object.entries(materialized.blackboardAssignments).map(([key, assignment]) => {
        if (typeof assignment !== 'number' || !Number.isFinite(assignment)) {
          throw new Error(`${sourcePath}.buffs[${index}]: unresolved numeric assignment ${key}`);
        }
        return [key, { kind: 'constant' as const, value: assignment }];
      }),
    );
    return {
      kind: 'applyBuff' as const,
      parameters: {
        buffs: [
          {
            buffId: materialized.buffId,
            ...(Object.keys(assignments).length === 0
              ? {}
              : { blackboardAssignments: assignments }),
          },
        ],
        targets: { kind: 'owner' as const },
        source: { kind: 'owner' as const },
        [COMPILED_BUFF_TARGET_KINDS]: {
          target: 'currentAbilityEntity',
          source: 'currentAbilityEntity',
        },
        inheritSourceSkillCastInfo: false,
      },
    };
  });
  const context = {
    graph,
    gameplayTagRegistry,
    predefinedTagQueries,
    abilityEntityQueries,
    actionOwnerTarget: 'currentAbilityEntity' as const,
    // 投影层的 caster 表示当前 Ability 的 ActionSource；运行时上下文会把它绑定到实体实例。
    actionSourceTarget: 'caster' as const,
    actionTargetTarget: 'eventSource' as const,
    fixedBuffOwnerTarget: 'currentAbilityEntity' as const,
    fixedBuffSourceTarget: 'currentAbilityEntity' as const,
  };
  const abilityEventResponses: NonNullable<
    AbilityEntityPassiveSkillDefinition['abilityEventResponses']
  >[number][] = [];
  for (const event of skill.actionGraph.actionGroup.passiveEvents) {
    const projected = projectAbilityEvent(event.abilityEvent, sourcePath);
    if (projected !== 'addedBuff') {
      throw new Error(
        `${sourcePath}: unsupported AbilityEntity passive event ${JSON.stringify(event.abilityEvent)}`,
      );
    }
    for (const sequence of event.actions) {
      for (const node of collectNativeActionNodes(sequence)) {
        if (
          node.metadata.enabled &&
          (node.metadata.priorityLevel !== 'Default' || node.metadata.priorityOffset !== 0)
        ) {
          throw new Error(`${node.sourcePath}: unsupported AbilityEntity passive event priority`);
        }
      }
      abilityEventResponses.push({
        event: 'addedBuff',
        priority: 0,
        sequence: compileCombatActionSequenceSource(sequence, context, visualOnlyIds, extensions),
      });
    }
  }
  const enableSequence = graph.sequence(enableSteps);
  return {
    actionGraph: { main: graph.finish(), macros: {} },
    key: skillId,
    ...(Object.keys(blackboard).length === 0 ? {} : { blackboard }),
    enableSequence,
    ...(abilityEventResponses.length === 0 ? {} : { abilityEventResponses }),
  };
}
