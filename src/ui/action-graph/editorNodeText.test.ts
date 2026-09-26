import { expect, it } from 'vitest';
import zh from '../../i18n/locales/zh-CN.json';
import en from '../../i18n/locales/en.json';
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
      const entry = text.fields[field.label as keyof typeof text.fields];
      expect(entry, field.label).toBeDefined();
      expect(entry.name.trim()).not.toBe('');
      for (const option of field.options ?? []) {
        if (typeof option === 'string')
          expect(text.options[option as keyof typeof text.options], option).toBeTruthy();
      }
    }
  }
});
