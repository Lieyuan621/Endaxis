import type {
  LevelValues,
  SkillDefinition,
  SkillCostDefinition,
} from '../../../../../packages/game-data-contract/src/index.ts';
import type { OperatorActiveSkillTypeSource } from './activeSkills.ts';
import type { SkillPatchSource } from '../../source/skillPatch.ts';
import { requireNonNegativeInteger, requireRecord } from '../../source/primitives.ts';
import {
  compileActiveSkillRuntimeProjectionSource,
  type CompiledActiveSkillRuntimeProjectionSource,
  type CompiledActiveSkillTimelineSequenceSource,
} from '../../compiler/skills/activeSkillRuntimeProjection.ts';
import type {
  CombatActionProjectionContextSource,
  CombatActionProjectionExtensionsSource,
} from '../../compiler/combatProjectionCommon.ts';
import type { CompiledBuffDefinitionSource } from '../../compiler/buffs/buffProjectionTypes.ts';
import { createPhysicalInflictionDefinitionHydrator } from '../../compiler/actions/physicalInflictionHydration.ts';

/** 已编译的正式技能子集；来源身份、黑板与消耗帧必填，不接受尚未接入的事件字段。 */
export type CompiledOperatorActiveSkillRuntimeDefinitionSource = Readonly<
  Pick<
    SkillDefinition,
    | 'key'
    | 'timelineBlockFrames'
    | 'timelineContinuationSkillId'
    | 'timelineBlockFollowUpSkillId'
    | 'naturalDurationFrames'
    | 'cooldownFrames'
    | 'enhancementStateBuffId'
  > &
    Required<
      Pick<
        SkillDefinition,
        | 'blackboard'
        | 'costFrame'
        | 'exclusiveFrame'
        | 'offsetRecordFrame'
        | 'naturalDurationFrames'
      >
    >
> & {
  /** 仅供整名技能组装配；生成最终 OperatorDefinition 前必须移除。 */
  readonly allowNextSkillTransitions: CompiledActiveSkillRuntimeProjectionSource['allowNextSkillTransitions'];
  readonly inputWindows?: SkillDefinition['inputWindows'];
  readonly smartTarget?: 'enemy' | 'input' | 'trigger';
  readonly switchToBuffCast?: NonNullable<SkillDefinition['switchToBuffCast']>;
  readonly costs?: readonly Readonly<SkillCostDefinition>[];
  readonly scheduledSequences: readonly CompiledActiveSkillTimelineSequenceSource[];
};

export function compileOperatorActiveSkillRuntimeDefinitionSource(input: {
  readonly key: string;
  readonly skillType: OperatorActiveSkillTypeSource;
  readonly value: unknown;
  readonly sourcePath: string;
  readonly patch: SkillPatchSource | null;
  readonly context: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly extensions?: CombatActionProjectionExtensionsSource;
}): CompiledOperatorActiveSkillRuntimeDefinitionSource {
  const runtime = compileActiveSkillRuntimeProjectionSource({
    ...input,
    context: {
      ...input.context,
      preserveSkillOperableBoundary: input.skillType === 'basicAttack',
    },
  });
  if (runtime.skillId !== input.key) {
    throw new Error(`${input.sourcePath}: skill identity does not match SkillData.skillId`);
  }
  const root = requireRecord(input.value, input.sourcePath);
  const cast = requireRecord(root.castData, `${input.sourcePath}.castData`);
  const costFrame = requireNonNegativeInteger(
    cast.startCdFrame,
    `${input.sourcePath}.castData.startCdFrame`,
  );
  const definition: CompiledOperatorActiveSkillRuntimeDefinitionSource = {
    key: input.key,
    blackboard: Object.fromEntries(
      Object.entries(runtime.blackboard).map(([key, values]) => [key, collapse(values)]),
    ),
    timelineBlockFrames: runtime.timelineBlockFrames,
    // SkillData.duration getter 使用 max(durationFrame, 1) / 30；正式契约保存运行时帧语义。
    naturalDurationFrames: Math.max(runtime.durationFrame, 1),
    exclusiveFrame: runtime.exclusiveFrame,
    offsetRecordFrame: runtime.offsetRecordFrame,
    allowNextSkillTransitions: runtime.allowNextSkillTransitions,
    ...(runtime.inputWindows === undefined ? {} : { inputWindows: runtime.inputWindows }),
    costFrame,
    scheduledSequences: runtime.scheduledSequences.map(item => ({
      startFrame: item.startFrame,
      endFrame: item.endFrame,
      sequence: item.sequence,
    })),
    ...(runtime.smartTarget === undefined ? {} : { smartTarget: runtime.smartTarget }),
    ...(runtime.switchToBuffCast === undefined
      ? {}
      : { switchToBuffCast: runtime.switchToBuffCast }),
  };
  const patch = input.patch;
  if (!patch) return definition;
  if (patch.cooldownSeconds.some(value => value !== 0)) {
    const frames = patch.cooldownSeconds.map((value, index) => {
      const frame = value * 30;
      if (!Number.isInteger(frame) || frame < 0)
        throw new Error(
          `${input.sourcePath}: cooldown level ${patch.levels[index]} is not frame-exact`,
        );
      return frame;
    });
    Object.assign(definition, { cooldownFrames: collapse(frames) });
  }
  if (patch.costValues.some(value => value !== 0)) {
    const expected =
      input.skillType === 'battleSkill'
        ? ({ type: 1, resource: 'sp' } as const)
        : input.skillType === 'ultimate'
          ? ({ type: 0, resource: 'ultimateEnergy' } as const)
          : null;
    if (!expected || patch.costTypes.some(value => value !== expected.type))
      throw new Error(`${input.sourcePath}: non-zero cost does not match stable skill type`);
    Object.assign(definition, {
      costs: [{ resource: expected.resource, value: collapse(patch.costValues) }],
    });
  }
  return definition;
}

export function renderOperatorActiveSkillRuntimeDefinitionSource(input: {
  readonly operatorSlug: string;
  readonly definition: CompiledOperatorActiveSkillRuntimeDefinitionSource;
  readonly supplementalBuffDefinitions?: Readonly<Record<string, CompiledBuffDefinitionSource>>;
}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.operatorSlug))
    throw new Error('operatorSlug: expected stable kebab-case identity');
  const supplementalBuffDefinitions = input.supplementalBuffDefinitions ?? {};
  const hydrate = createPhysicalInflictionDefinitionHydrator(supplementalBuffDefinitions);
  const { allowNextSkillTransitions: _allowNextSkillTransitions, ...runtimeDefinition } =
    input.definition;
  const definition = hydrate(runtimeDefinition);
  const hydratedSupplementalBuffDefinitions = hydrate(supplementalBuffDefinitions);
  const renderedBuffs = renderTypeScriptData(hydratedSupplementalBuffDefinitions);
  const renderedDefinition = renderTypeScriptData(definition);
  return {
    relativePath: `${input.operatorSlug}.${input.definition.key}.runtime.generated.ts`,
    content: `/** 由 tools/game-data-compiler 从完整主动 SkillData 动作图生成；不要手工编辑。 */\nimport type {\n  OperatorBuffDefinitions,\n  SkillDefinition,\n} from '../../../../core/game-data/operatorDefinition';\n\n// prettier-ignore\nexport const supplementalBuffDefinitions = ${renderedBuffs} as const satisfies OperatorBuffDefinitions;\n\n// prettier-ignore\nexport default ${renderedDefinition} as const satisfies SkillDefinition;\n`,
  };
}

/** JSON 数据形状的 TypeScript 字面量；Unity 阶梯曲线允许无穷切线，不能被序列化成 null。 */
function renderTypeScriptData(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, item) =>
      item === Number.POSITIVE_INFINITY
        ? '__ENDAXIS_POSITIVE_INFINITY__'
        : item === Number.NEGATIVE_INFINITY
          ? '__ENDAXIS_NEGATIVE_INFINITY__'
          : item,
    2,
  )
    .replaceAll('"__ENDAXIS_POSITIVE_INFINITY__"', 'Number.POSITIVE_INFINITY')
    .replaceAll('"__ENDAXIS_NEGATIVE_INFINITY__"', 'Number.NEGATIVE_INFINITY');
}

function collapse(values: LevelValues): LevelValues {
  if (typeof values === 'number') return values;
  return values.every(value => value === values[0]) ? values[0]! : [...values];
}
