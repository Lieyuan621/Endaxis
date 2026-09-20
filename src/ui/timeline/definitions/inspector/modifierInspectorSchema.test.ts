import { expect, it } from 'vitest';
import { modifierInspectorFields } from './modifierInspectorSchema';
import type { EquipmentModifierDefinition } from '../../../../core/game-data/equipmentDefinition';
import graphSource from '../equipment/EquipmentContributionGraphEditor.vue?raw';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import InspectorFields from './InspectorFields.vue';

it('契约枚举与等级值直接复用公共字段，修改不重建其他字段', () => {
  const value: EquipmentModifierDefinition = {
    kind: 'attribute',
    attribute: 'strength',
    operation: 'flat',
    value: [1, 2, 3],
  };
  const fields = modifierInspectorFields(value);
  expect(fields.map(field => field.key)).toEqual(['attribute', 'operation', 'value']);
  expect(fields[0]!.options).toContain('secondary');
  expect(fields[2]!.editor).toBe('levelValues');
  const next = fields[0]!.write(value, 'main');
  expect(next).toEqual({ ...value, attribute: 'main' });
  expect(next.value).toBe(value.value);
  expect(fields[2]!.write(value, [4, 5])).toEqual({ ...value, value: [4, 5] });
  expect(
    modifierInspectorFields({ kind: 'panelStat', stat: 'defenseFlat', value: 1 }).find(
      field => field.key === 'stat',
    )!.options,
  ).toContain('defensePercent');
  expect(
    modifierInspectorFields({ kind: 'staticHealingIncrease', target: 'output', value: 1 }).find(
      field => field.key === 'target',
    )!.options,
  ).toEqual(['output', 'taken']);
});

it('公式槽省略与启用保留兼容行为，所有筛选字段均可编辑', () => {
  const value: EquipmentModifierDefinition = { kind: 'damageScale', target: 'heat', value: 0.1 };
  const slot = modifierInspectorFields(value).find(field => field.key === 'slot')!;
  expect(slot.optional).toBe(true);
  const enabled = slot.toggle(value, true);
  expect(enabled).toEqual({ ...value, slot: 'baseAddition' });
  expect(slot.toggle(enabled, false)).toEqual(value);
  expect(
    modifierInspectorFields({ kind: 'damageBonus', damageTypes: ['heat'], value: 1 }).map(
      field => field.key,
    ),
  ).toEqual(['damageTypes', 'skillTypes', 'value']);
  expect(
    modifierInspectorFields({
      kind: 'skillCooldownMultiplier',
      skillTypes: 'ultimate',
      value: 1,
    }).map(field => field.key),
  ).toEqual(['skillTypes', 'value']);
  expect(graphSource).not.toContain('function setModifier');
  expect(graphSource).not.toContain('function parseLevelValues');
});

it('集合视图保留必选、空选省略和单值写回规则，读取不修改原数组', () => {
  const value: EquipmentModifierDefinition = {
    kind: 'damageBonus',
    damageTypes: ['heat', 'heat'],
    value: [1, 2],
  };
  const fields = modifierInspectorFields(value);
  const damage = fields.find(field => field.key === 'damageTypes')!;
  const skills = fields.find(field => field.key === 'skillTypes')!;
  expect(damage.widget).toBe('enumSelection');
  expect(damage.editor).toBe('union');
  expect(damage.read(value)).toBe(value.damageTypes);
  expect(damage.write(value, [])).toBe(value);
  expect(damage.write(value, ['unknown'])).toBe(value);
  expect(damage.write(value, ['cryo'])).toEqual({ ...value, damageTypes: 'cryo' });
  expect(skills.read(value)).toEqual([]);
  expect(skills.selection?.allowEmpty).toBe(true);
  const selected = skills.write(value, ['ultimate', 'battleSkill']);
  expect(selected).toEqual({ ...value, skillTypes: ['ultimate', 'battleSkill'] });
  expect(skills.write(selected, [])).toEqual(value);
  const cooldown: EquipmentModifierDefinition = {
    kind: 'skillCooldownMultiplier',
    skillTypes: 'ultimate',
    value: 1,
  };
  const cooldownField = modifierInspectorFields(cooldown)[0]!;
  expect(cooldownField.selection?.allowEmpty).toBe(false);
  expect(cooldownField.write(cooldown, [])).toBe(cooldown);
});

it('真实字段注册表渲染集合按钮：必选最后一项锁定，可选集合展示全部', async () => {
  const value: EquipmentModifierDefinition = { kind: 'damageBonus', damageTypes: 'heat', value: 1 };
  const app = createSSRApp({
    render: () =>
      h(InspectorFields<EquipmentModifierDefinition>, {
        value,
        fields: modifierInspectorFields(value),
      }),
  });
  app.use(
    createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: { common: { all: 'All' } } },
      missingWarn: false,
      fallbackWarn: false,
    }),
  );
  const html = await renderToString(app);
  expect(html).toMatch(/<button[^>]*disabled[^>]*aria-pressed="true"[^>]*>heat<\/button>/);
  expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>All<\/button>/);
  expect(html).not.toContain('inspector-union');
  expect(value).toEqual({ kind: 'damageBonus', damageTypes: 'heat', value: 1 });
});
