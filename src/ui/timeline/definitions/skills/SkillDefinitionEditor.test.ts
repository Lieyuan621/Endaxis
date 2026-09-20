import { expect, it } from 'vitest';
import {
  COMBAT_STEP_KINDS,
  DAMAGE_FEATURES,
  DAMAGE_TAGS,
} from '../../../../core/game-data/operatorDefinition';
import { EDITABLE_COMBAT_STEP_KINDS } from './skillDefinitionEditorViewModel';
import { STEP_TYPE_GROUPS } from '../actions/stepTypePickerCatalog';
import zhCN from '../../../../i18n/locales/zh-CN.json';
import en from '../../../../i18n/locales/en.json';
import ru from '../../../../i18n/locales/ru.json';

it('所有伤害标签和特征都具备本地化领域名称', () => {
  for (const locale of [zhCN, en, ru]) {
    const messages = locale.timeline.skillEditing;
    for (const tag of DAMAGE_TAGS) expect(messages.damageTagNames).toHaveProperty(tag);
    for (const feature of DAMAGE_FEATURES) {
      expect(messages.damageFeatureNames).toHaveProperty(feature);
    }
  }
});

it('步骤选单完整覆盖可编辑步骤且不重复', () => {
  const listedKinds = STEP_TYPE_GROUPS.flatMap(group => group.kinds);
  expect(new Set(listedKinds).size).toBe(listedKinds.length);
  expect([...listedKinds].sort()).toEqual([...EDITABLE_COMBAT_STEP_KINDS].sort());
});

it('步骤展开和折叠的翻译齐全', () => {
  for (const locale of [zhCN, en, ru]) {
    const messages = locale.timeline.skillEditing as Record<string, unknown>;
    expect(messages).toHaveProperty('collapseStep');
    expect(messages).toHaveProperty('expandStep');
  }
});

it('Buff 生命周期的翻译齐全', () => {
  for (const locale of [zhCN, en, ru]) {
    const messages = locale.timeline.skillEditing as Record<string, unknown>;
    expect(messages).toHaveProperty('buffLifecycle');
    expect(messages).toHaveProperty('enableBuffLifecycle');
    expect(messages).toHaveProperty('buffLifecycleKinds');
  }
});

it('高价值步骤编辑器使用的翻译在三种语言中齐全', () => {
  const keys = [
    'operandConstant',
    'operandBlackboard',
    'operandBlackboardKey',
    'operandConstantValue',
    'fixedValue',
    'blackboardKey',
    'operation',
    'operandLeft',
    'operandRight',
    'statusKey',
    'target',
    'durationFrames',
    'stacks',
    'maxStacks',
    'targets',
    'reaction',
    'reactions',
    'spellBurstType',
    'spellBurstTypes',
    'durationSeconds',
    'effectiveness',
    'markerId',
    'autoFinishByAction',
    'coefficient',
    'factor',
    'contextFlag',
    'contextValueType',
    'abilityEntityId',
    'abilityEntityDefinition',
    'abilityEntityChildTimeline',
    'abilityEntityTimeDilationQueries',
    'abilityEntityQueryKind',
    'abilityEntityQueryKinds',
    'abilityEntityQueryContextKey',
    'abilityEntityQueryIds',
    'abilityEntityQueryAllOwnerSpawned',
    'addAbilityEntityQuery',
    'deleteAbilityEntityQuery',
    'valueTypes',
    'booleanValues',
  ];
  for (const locale of [zhCN, en, ru]) {
    const messages = locale.timeline.skillEditing as Record<string, unknown>;
    for (const key of keys) expect(messages).toHaveProperty(key);
    const stepHelp = messages.stepHelp as Record<string, unknown>;
    for (const kind of COMBAT_STEP_KINDS) expect(stepHelp).toHaveProperty(kind);
    expect(messages).toHaveProperty('fieldHelp');
  }
});
