import type { CombatEventTrigger } from '../../../../core/game-data/operatorDefinition';
import { eventStructure, eventOwnerStructures } from './eventStructure.generated';
import {
  createCombatEventTriggerDraft,
  EDITABLE_COMBAT_EVENT_TRIGGER_KINDS,
} from '../actions/combatEventTriggerCatalog';
import {
  createInspectorField,
  matchesInspectorValue,
  type InspectorValueShape,
} from './inspectorFields';
import { parameterInspectorField } from './parameterInspectorSchema';
import { enumSelectionField } from './inspectorEnumSelection';

const prefix = 'timeline.skillEditing.';
/** 两类响应分别取自身契约；图拥有的条件、序列不进入参数视图。 */
export function eventOwnerInspectorFields<T extends object>(scheduled: boolean) {
  return [
    parameterInspectorField<T>(
      'key',
      eventOwnerStructures[scheduled ? 'handler' : 'response'].key,
      'handlerKey',
    ),
  ];
}
const kindField = createInspectorField<CombatEventTrigger>('kind', {
  editor: 'enum',
  options: EDITABLE_COMBAT_EVENT_TRIGGER_KINDS,
  labelKey: prefix + 'triggerKind',
  helpKey: prefix + 'fieldHelp.eventTrigger',
  optionLabelPrefix: prefix + 'triggerKinds.',
  replace: (_, kind) => createCombatEventTriggerDraft(kind as CombatEventTrigger['kind']),
});
/** 注解仅补展示语义；字段、可选性与候选值从公共 CombatEventTrigger 契约提取。 */
const labels: Record<string, string> = {
  event: 'nativeTriggerEvent',
  scope: 'triggerScope',
  role: 'eventRole',
  source: 'spGainSource',
  gainKind: 'spGainKind',
  tag: 'damageTag',
  elements: 'element',
  types: 'physicalInflictionType',
};
const options: Record<string, string> = {
  event: 'nativeTriggerEvents',
  scope: 'triggerScopes',
  role: 'eventRoles',
  source: 'spGainSources',
  gainKind: 'spGainKinds',
  tag: 'damageTagNames',
  elements: 'damageTypes',
  types: 'physicalInflictionTypes',
  target: 'targets',
};
export function eventInspectorFields(event: CombatEventTrigger) {
  const structure = eventStructure as InspectorValueShape;
  const variant = structure.variants?.find(shape => matchesInspectorValue(shape, event));
  return [
    kindField,
    ...Object.entries(variant?.properties ?? {})
      .filter(([key]) => key !== 'kind')
      .map(([key, shape]) => {
        const field = {
          ...parameterInspectorField<CombatEventTrigger>(key, shape, labels[key]),
          optionLabelPrefix: prefix + (options[key] ?? key) + '.',
          helpKey:
            key === 'skillGroupKey'
              ? prefix + 'fieldHelp.eventSkillGroupKey'
              : key === 'statusKey'
                ? prefix + 'fieldHelp.eventStatusKey'
                : undefined,
        };
        if (key === 'elements' || key === 'types') return enumSelectionField(field);
        // 目标方是旧编辑器的省略语义；显式 source 才写入 role。
        if (key === 'role')
          return {
            ...field,
            optional: false,
            read: (value: CombatEventTrigger) => field.read(value) ?? 'target',
            write: (value: CombatEventTrigger, input: unknown) =>
              input === 'target' ? field.toggle(value, false) : field.write(value, input),
          };
        // 列表采用公共逐项输入；删除最后一项仍表示不限 Buff ID。
        if (key === 'buffIds')
          return {
            ...field,
            optional: false,
            read: (value: CombatEventTrigger) => field.read(value) ?? [],
            write: (value: CombatEventTrigger, input: unknown) =>
              Array.isArray(input) && !input.length
                ? field.toggle(value, false)
                : field.write(value, input),
          };
        return field;
      }),
  ];
}
