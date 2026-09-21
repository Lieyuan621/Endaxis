/**
 * 在整场 Buff 实例已经存在后，恢复全部干员的核心运行时和来源宿主。
 *
 * 先为全队建立黑板、状态、冷却、技能和能力系统，再按队伍顺序建立装备、潜能、初始化与被动。
 * 来源持有的子 Buff 在所有宿主创建成功后跨全队检查唯一所有者，再统一绑定到当前分支实例。
 */
import {
  failAfterAbilityHostCleanup,
  runAbilityHostCleanup,
} from '../../abilities/abilityEventHostLifecycle';
import { buffReferenceKey } from '../../buffs/buffReference';
import type { BuffApplicationHandle } from '../../buffs/combatBuffs';
import { type BuffReference } from '../../state/foundationState';
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import {
  bindRestoredCombatOperatorCore,
  type RestoreCombatOperatorCoreOptions,
  type RestoredCombatOperatorCore,
} from './combatOperatorCoreRestoration';
import {
  bindRestoredCombatOperatorSources,
  type RestoreCombatOperatorSourcesOptions,
  type RestoredCombatOperatorSources,
} from './combatOperatorSourceRestoration';
import type { RestoredCombatAbilityEntityDirectory } from './combatRuntimeAbilityEntityRestoration';
import type { RestoredCombatRuntimeFoundation } from './combatRuntimeRestoreFoundation';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';

type OperatorCoreBindings = Pick<
  RestoreCombatOperatorCoreOptions,
  | 'createSkillDependencies'
  | 'abilityRuntime'
  | 'onCooldownReady'
  | 'timedMarkerHooks'
  | 'preboundStatusRuntime'
>;

type OperatorSourceBindings = Omit<
  RestoreCombatOperatorSourcesOptions,
  'operator' | 'state' | 'operatorBlackboard' | 'semanticEvents'
>;

export interface RestoreCombatRuntimeOperatorsOptions {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly createCoreBindings: (operator: CombatOperatorProgram) => OperatorCoreBindings;
  /** 在来源宿主创建前，把已恢复核心登记到完整装配的当前分支目录。 */
  readonly onCoreBound?: (
    operator: CombatOperatorProgram,
    core: RestoredCombatOperatorCore,
  ) => void;
  readonly createSourceBindings: (operator: CombatOperatorProgram) => OperatorSourceBindings;
  readonly onSourcesBound?: (
    operator: CombatOperatorProgram,
    sources: RestoredCombatOperatorSources,
  ) => void;
}

export interface RestoredCombatRuntimeOperators {
  readonly programs: ReadonlyMap<string, CombatOperatorProgram>;
  readonly cores: ReadonlyMap<string, RestoredCombatOperatorCore>;
  readonly sources: ReadonlyMap<string, RestoredCombatOperatorSources>;
  bindRestoredChildren(): void;
  disposeSources(): void;
}

export function bindRestoredCombatRuntimeOperators(
  options: RestoreCombatRuntimeOperatorsOptions,
): RestoredCombatRuntimeOperators {
  const programs = new Map<string, CombatOperatorProgram>();
  const cores = new Map<string, RestoredCombatOperatorCore>();
  const sources = new Map<string, RestoredCombatOperatorSources>();
  const resolveBuff = (reference: BuffReference) =>
    options.entities.targets.get(reference.ownerId)?.resolveHandle?.(reference);
  for (const [operatorId, program] of options.preparation.programs) {
    const buffRuntime = options.foundation.operatorBuffTargets.get(operatorId);
    if (buffRuntime === undefined) {
      throw new Error(`restored operator '${operatorId}' has no Buff target`);
    }
    const restoredProgram = { ...program, buffRuntime };
    programs.set(operatorId, restoredProgram);
    const core = bindRestoredCombatOperatorCore({
      operator: restoredProgram,
      state: options.preparation.operators.get(operatorId)!,
      skills: options.preparation.skills.get(operatorId)!,
      clock: options.foundation.shared.clock,
      entityClock: options.foundation.shared.timeDilation?.getEntityClock(operatorId),
      globalScaledClock: options.foundation.shared.timeDilation ?? options.foundation.shared.clock,
      receipt: options.foundation.shared.receipt,
      resolveAttachedBuff: resolveBuff,
      ...options.createCoreBindings(restoredProgram),
    });
    cores.set(operatorId, core);
    options.onCoreBound?.(restoredProgram, core);
  }
  try {
    for (const [operatorId, program] of programs) {
      const source = bindRestoredCombatOperatorSources({
        operator: program,
        state: options.preparation.operators.get(operatorId)!,
        operatorBlackboard: cores.get(operatorId)!.blackboard,
        semanticEvents: options.foundation.semanticEvents,
        ...options.createSourceBindings(program),
      });
      sources.set(operatorId, source);
      options.onSourcesBound?.(program, source);
    }
  } catch (error) {
    failAfterAbilityHostCleanup(
      error,
      [...sources.values()].map(source => () => source.dispose()),
    );
  }
  return {
    programs,
    cores,
    sources,
    bindRestoredChildren() {
      const children = resolveOperatorSourceChildren(options.preparation, resolveBuff);
      for (const source of sources.values()) {
        source.bindRestoredChildren(reference => children.get(buffReferenceKey(reference)));
      }
    },
    disposeSources() {
      runAbilityHostCleanup([...sources.values()].map(source => () => source.dispose()));
    },
  };
}

function resolveOperatorSourceChildren(
  preparation: CombatRuntimeRestorePreparation,
  resolve: (reference: BuffReference) => BuffApplicationHandle | undefined,
): ReadonlyMap<string, BuffApplicationHandle> {
  const children = new Map<string, BuffApplicationHandle>();
  for (const [key, reference] of preparation.buffs.operatorSourceChildren) {
    const child = resolve(reference);
    if (child === undefined) throw new Error(`restored source child Buff '${key}' is missing`);
    children.set(key, child);
  }
  return children;
}
