import type { ComboSkillConditionSource } from '../../source/comboSkillConditions.ts';
import type { CompiledAbilitySystemBlackboardsSource } from '../abilities/abilitySystemBlackboards.ts';
import { requireNonEmptyString } from '../../source/primitives.ts';
import { compileCombatConditionSequenceSource } from '../buffs/buffRuntimeProjection.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import type { CompiledBuffSequenceSource } from '../actions/combatActionProjectionTypes.ts';
import {
  ABILITY_EVENT_ACTION_CONTEXT_BINDINGS,
  type AbilityEvent,
  type ActionContextBoundAbilityEvent,
} from '../../../../../packages/game-data-contract/src/abilityEvents.ts';
import { projectAbilityEvent } from '../abilities/abilityEventProjection.ts';
import { createActionGraphBuilder } from '../actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../actions/combatActionProjectionTypes.ts';

export function createOperatorComboActionProjectionContext(
  gameplayTagRegistry: CombatActionProjectionContextSource['gameplayTagRegistry'],
): Omit<CombatActionProjectionContextSource, 'graph'> {
  return {
    gameplayTagRegistry,
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'eventTarget',
    contextTargetGroupTargets: new Map([['trigger', 'eventTarget']]),
  };
}

export interface CompiledComboConditionSource {
  readonly actionGraph: import('../../../../../packages/game-data-contract/src/actionGraph.ts').ActionGraphResourceDefinition;
  readonly source: ComboSkillConditionSource;
  readonly event: AbilityEvent;
  readonly sequence: CompiledBuffSequenceSource;
}

/** 供正式定义渲染的字段投影；来源记录另存审计，不能混入项目定义。 */
export function compileComboSkillConditionDefinitionSource(
  source: ComboSkillConditionSource,
  blackboards: CompiledAbilitySystemBlackboardsSource,
  binding: { readonly key: string; readonly skillKey: string },
  context: Omit<CombatActionProjectionContextSource, 'graph'>,
) {
  const compiled = compilePendingComboConditionSource(source, context);
  return {
    source: { condition: compiled.source, blackboards: blackboards.source },
    definition: {
      key: requireNonEmptyString(binding.key, `${source.sourcePath}.binding.key`),
      skillKey: requireNonEmptyString(binding.skillKey, `${source.sourcePath}.binding.skillKey`),
      event: compiled.event,
      immediately: source.immediately,
      initialValues:
        blackboards.comboConditionInitialValues === null
          ? null
          : { ...blackboards.comboConditionInitialValues },
      sequence: compiled.sequence,
      actionGraph: compiled.actionGraph,
    },
  };
}

/** 事件身份与条件树均走公共编译器；目标绑定和事件产生能力由运行端另行门禁。 */
export function compilePendingComboConditionSource(
  source: ComboSkillConditionSource,
  context: Omit<CombatActionProjectionContextSource, 'graph'>,
): CompiledComboConditionSource {
  const event = projectAbilityEvent(source.nativeEvent, `${source.sourcePath}.nativeEvent`);
  if (!(event in ABILITY_EVENT_ACTION_CONTEXT_BINDINGS))
    throw new Error(
      `${source.sourcePath}.nativeEvent: AbilityEvent '${event}' has no audited action-context binding`,
    );
  const binding = ABILITY_EVENT_ACTION_CONTEXT_BINDINGS[event as ActionContextBoundAbilityEvent];
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const sequence = compileCombatConditionSequenceSource(source.sequence, {
    ...context,
    graph,
    actionTargetTarget:
      'fixedStumpInputTarget' in binding ? binding.fixedStumpInputTarget : binding.inputTarget,
    ...(binding.triggerTarget === null ? { contextTargetGroupTargets: new Map() } : {}),
  });
  return { source, event, sequence, actionGraph: { main: graph.finish(), macros: {} } };
}
