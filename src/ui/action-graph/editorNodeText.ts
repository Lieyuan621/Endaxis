/** 编辑器文案仅从语言资源读取。 */
import { i18n } from '../../i18n';
import type { BlackboardScope } from '../../application/editor/graphBlackboard';

export function nodeName(kind: string): string {
  return i18n.global.t(`actionGraphEditor.nodes.${kind}.name`);
}
export function nodeHelp(kind: string): string {
  return i18n.global.t(`actionGraphEditor.nodes.${kind}.help`);
}
export function fieldName(path: readonly string[], kind?: string): string {
  return i18n.global.t(`actionGraphEditor.fields.${fieldKey(path, kind)}.name`);
}
export function fieldHelp(path: readonly string[], kind?: string): string {
  const key = `actionGraphEditor.fields.${fieldKey(path, kind)}.help`;
  return i18n.global.te(key) ? i18n.global.t(key) : '';
}
function fieldKey(path: readonly string[], kind?: string) {
  if (path.at(-1) === 'key' && (kind === 'blackboard' || path.join('.') === 'parameters.key'))
    return 'variableKey';
  return (
    [...path].reverse().find(part => i18n.global.te(`actionGraphEditor.fields.${part}.name`)) ??
    'value'
  );
}
export function optionName(value: string | number | boolean, fieldType?: string): string {
  if (typeof value === 'boolean')
    return i18n.global.t(`actionGraphEditor.${value ? 'enabled' : 'disabled'}`);
  if (typeof value === 'number') return String(value);
  if (value === 'caster' && fieldType?.includes('OperatorRole'))
    return i18n.global.t('actionGraphEditor.options.roleCaster');
  return i18n.global.t(`actionGraphEditor.options.${value}`);
}
export function scopeName(scope: BlackboardScope): string {
  if (!scope.parent) return scope.label;
  return i18n.global.t('actionGraphEditor.localScope', {
    name: scope.label,
  });
}
export function scopeHelp(scope: BlackboardScope): string {
  if (!scope.parent) return i18n.global.t('actionGraphEditor.currentScopeHelp');
  return [
    scope.copiesParent ? 'copyScopeHelp' : 'independentScopeHelp',
    scope.sharesEntity ? 'sharedEntityHelp' : 'ownEntityHelp',
  ]
    .map(key => i18n.global.t(`actionGraphEditor.${key}`))
    .join(' ');
}
