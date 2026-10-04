import { expect, it } from 'vitest';
import zh from '../../i18n/locales/zh-CN.json';
import en from '../../i18n/locales/en.json';
import { i18n } from '../../i18n';
import { optionName } from './editorNodeText';
import { actionNodeSchemas, dataNodeSchemas } from './actionNodeSchemas.generated';

it.each([zh, en])('节点、参数和枚举都有完整的用户文案', locale => {
  const text = locale.actionGraphEditor;
  const nodeKeys = [
    ...Object.keys(actionNodeSchemas),
    ...Object.keys(dataNodeSchemas).map(key => key.split(':')[1]!),
  ];
  for (const key of nodeKeys) {
    const entry = text.nodes[key as keyof typeof text.nodes];
    expect(entry, key).toBeDefined();
    expect(entry.name.trim(), key).not.toBe('');
    expect(entry.help.trim(), key).not.toBe('');
  }
  for (const schema of [...Object.values(actionNodeSchemas), ...Object.values(dataNodeSchemas)]) {
    for (const field of schema.fields) {
      const entry = text.fields[field.path.at(-1) as keyof typeof text.fields];
      expect(entry, field.path.join('.')).toBeDefined();
      expect(entry.name.trim()).not.toBe('');
      for (const option of field.options ?? []) {
        if (typeof option === 'string')
          expect(text.options[option as keyof typeof text.options], option).toBeTruthy();
      }
    }
  }
});

it('only the verified role vocabulary disambiguates caster', () => {
  const fields = dataNodeSchemas['boolean:operatorRoleIn']!.fields;
  const roles = fields.find(field => field.path.at(-1) === 'roles')!;
  const target = fields.find(field => field.path.at(-1) === 'target')!;
  expect(roles.options).toContain('caster');
  expect(target.options).toContain('caster');
  expect(roles.optionLabels).toBe('operatorRole');
  expect(target.optionLabels).toBeUndefined();
  expect(optionName('caster', roles.optionLabels)).toBe(
    i18n.global.t('actionGraphEditor.options.roleCaster'),
  );
  expect(optionName('caster', target.optionLabels)).toBe(
    i18n.global.t('actionGraphEditor.options.caster'),
  );
  expect(optionName('caster', 'operatorRole')).not.toBe(optionName('caster'));
  expect(optionName('guard', 'operatorRole')).toBe(optionName('guard'));
  expect(optionName(true, 'operatorRole')).toBe(optionName(true));
  expect(optionName(0, 'operatorRole')).toBe('0');
});
