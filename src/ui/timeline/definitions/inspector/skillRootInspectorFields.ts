import {
  NATIVE_SKILL_TYPES,
  type SkillDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { inspectorField } from './inspectorFields';
const field = inspectorField<SkillDefinition>();

/** Only own scalar properties; windows, conditions and sequences belong in the structure graph. */
export const skillRuntimeIdentityFields = [
  field('nativeSkillType', {
    editor: 'enum',
    options: NATIVE_SKILL_TYPES,
    optionLabelPrefix: 'nativeSkillType.',
    labelKey: 'timeline.skillEditing.runtimeFields.nativeSkillType',
    helpKey: '技能实例创建时的原生类型；不是技能库分类，运行时仍可改变。',
    optional: true,
    create: () => 'attack',
  }),
  field('smartTarget', {
    editor: 'enum',
    options: ['enemy', 'input', 'trigger'],
    optionLabelPrefix: 'smartTarget.',
    labelKey: 'timeline.skillEditing.runtimeFields.smartTarget',
    helpKey:
      'enemy：敌人；input：输入目标；trigger：触发目标。未设置表示不执行此存储，不自动推断。',
    optional: true,
    create: () => 'enemy',
  }),
];
export const skillRuntimeTimingFields = [
  field('cooldownFrames', {
    editor: 'levelValues',
    labelKey: 'timeline.skillEditing.cooldownFrames',
    optional: true,
    create: () => 0,
  }),
  field('naturalDurationFrames', {
    editor: 'number',
    labelKey: 'timeline.skillEditing.runtimeFields.naturalDurationFrames',
    helpKey: '原生 durationFrame 对应的运行时周期；不决定技能块显示宽度。',
    optional: true,
    create: () => 1,
  }),
  field('exclusiveFrame', {
    editor: 'number',
    labelKey: 'timeline.skillEditing.runtimeFields.exclusiveFrame',
    helpKey: '原生 exclusiveFrame，用于判断技能是否可被中断，不等于自然结束帧。',
    optional: true,
    create: () => 0,
  }),
];
