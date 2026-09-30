import { expectTypeOf } from 'vitest';
import type {
  CombatRuntimeAssemblyOptions,
  CombatRuntimeEnvironmentOptions,
  CombatRuntimeScenarioOptions,
} from '../combat/runtime/combatRuntimeAssembly';
import type { CompileScenarioRuntimeAssemblyOptions } from './compileScenarioRuntimeAssembly';

// 场景输入与环境端口互不重叠；完整装配选项由两者组成。
expectTypeOf<
  keyof CombatRuntimeScenarioOptions & keyof CombatRuntimeEnvironmentOptions
>().toEqualTypeOf<never>();
expectTypeOf<keyof CombatRuntimeAssemblyOptions>().toEqualTypeOf<
  keyof CombatRuntimeScenarioOptions | keyof CombatRuntimeEnvironmentOptions
>();
expectTypeOf<
  CompileScenarioRuntimeAssemblyOptions['environment']
>().toEqualTypeOf<CombatRuntimeEnvironmentOptions>();
