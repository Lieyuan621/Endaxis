import { distinctStrings, requireRecord } from './primitives.ts';

export interface OperatorSkillGroupValidationOptions {
  readonly routingOnlyNativeSkillIds?: readonly string[];
  readonly simulationEquivalentNativeSkillIds?: readonly string[];
  readonly basePassiveSkillIds?: readonly string[];
  readonly routedSkillKeys?: readonly string[];
  /** 需注册到技能系统、但不作为稳定时间轴入口的原生替换/内部技能。 */
  readonly runtimeReplacementSkillKeys?: readonly string[];
}

/** 生成与各类审计共用同一读取边界，避免内部技能等例外只在某个入口生效。 */
export function parseOperatorSkillGroupValidationOptions(
  value: unknown,
  sourcePath: string,
): OperatorSkillGroupValidationOptions {
  const row = requireRecord(value, sourcePath);
  const read = (key: keyof OperatorSkillGroupValidationOptions) =>
    row[key] === undefined ? undefined : distinctStrings(row[key], `${sourcePath}.${key}`);
  return {
    routingOnlyNativeSkillIds: read('routingOnlyNativeSkillIds'),
    simulationEquivalentNativeSkillIds: read('simulationEquivalentNativeSkillIds'),
    basePassiveSkillIds: read('basePassiveSkillIds'),
    routedSkillKeys: read('routedSkillKeys'),
    runtimeReplacementSkillKeys: read('runtimeReplacementSkillKeys'),
  };
}
