import { ATTRIBUTE_TYPES } from '../../source/attributeModifiers.ts';
import {
  requireArray,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  type SourceRecord,
} from '../../source/primitives.ts';
import {
  addBlackboardEntries,
  hasTextReference,
  iconPath,
  normalizeRichText,
  parsePlaceholder,
  replacePlaceholders,
  resolveText,
} from './localeText.ts';

export interface LocaleIdentities {
  readonly operators: Readonly<Record<string, string>>;
  readonly excludedOperators: ReadonlySet<string>;
  readonly weapons: Readonly<Record<string, string>>;
  readonly gearSets: Readonly<Record<string, string>>;
  readonly gears: Readonly<Record<string, string>>;
}
export type LocaleTables = Readonly<Record<string, SourceRecord>>;
type Document = Record<string, SourceRecord>;
// 使用领域编译共用的原生属性枚举，避免文本占位符维护第二份编号表。
const attributeNames = ATTRIBUTE_TYPES.slice(0, -1);
const paramNames = ['', 'CostValue', 'CoolDown', 'MaxChargeTime', 'ConditionalComboCoolDown'];
const record = (value: unknown, context: string) => requireRecord(value ?? {}, context);
const array = (value: unknown, context: string) => requireArray(value ?? [], context);
const entries = (value: SourceRecord) =>
  Object.keys(value)
    .sort()
    .map(key => [key, requireRecord(value[key], key)] as const);
const joinDescriptions = (parts: string[]) => parts.filter(Boolean).join('\n').trim();

export function operatorLocaleIdentities(
  source: unknown,
): Pick<LocaleIdentities, 'operators' | 'excludedOperators'> {
  const manifest = requireRecord(source, 'operator manifest');
  const operators: Record<string, string> = {};
  const excludedOperators = new Set<string>();
  for (const value of requireArray(manifest.operators, 'operator manifest.operators')) {
    const row = requireRecord(value, 'operator manifest entry');
    for (const id of requireArray(
      row.excludedLocaleCharIds ?? [],
      'excludedLocaleCharIds string list',
    ))
      excludedOperators.add(requireNonEmptyString(id, 'excludedLocaleCharIds string list'));
    const id = requireNonEmptyString(row.charId, 'operator charId');
    if (Object.hasOwn(operators, id)) throw new Error(`duplicate charId: ${id}`);
    operators[id] = requireNonEmptyString(row.slug, 'operator slug');
  }
  for (const id of excludedOperators)
    if (Object.hasOwn(operators, id))
      throw new Error(`cannot exclude a canonical operator charId: ${id}`);
  return { operators, excludedOperators };
}

function effectValues(table: SourceRecord, id: string, context: string): Record<string, number> {
  const effect = requireRecord(table[id], `${context} effect ${id}`);
  const result: Record<string, number> = {};
  for (const value of array(effect.dataList, context)) {
    const row = requireRecord(value, context);
    for (const key of ['attachBuff', 'attachSkill']) {
      const attached = record(row[key], `${context}.${key}`);
      addBlackboardEntries(result, attached.blackboard, context);
    }
    const bb = record(row.skillBbModifier, context);
    if (bb.stringValue != null && bb.stringValue !== '')
      throw new Error(`${context}: non-empty stringValue`);
    if (bb.bbKey)
      result[requireNonEmptyString(bb.bbKey, context)] = requireNumber(bb.floatValue, context);
    else if (bb.floatValue != null && bb.floatValue !== 0)
      throw new Error(`${context}: floatValue without bbKey`);
    for (const [field, typeField, valueField, names] of [
      ['attrModifier', 'attrType', 'attrValue', attributeNames],
      ['skillParamModifier', 'paramType', 'paramValue', paramNames],
    ] as const) {
      const modifier = record(row[field], context);
      const type = requireInteger(modifier[typeField] ?? 0, context);
      if (type > 0) {
        const name = names[type];
        if (!name) throw new Error(`${context}: unmapped ${typeField}: ${type}`);
        result[name] = requireNumber(modifier[valueField], context);
      } else if (modifier[valueField] != null && modifier[valueField] !== 0)
        throw new Error(`${context}: ${valueField} without type`);
    }
  }
  return result;
}

/** 纯领域编译：所有输入由同一冻结来源提供，不联网、不读取旧本地化。 */
export function compileGameLocales(
  tables: LocaleTables,
  texts: SourceRecord,
  identities: LocaleIdentities,
  enumTerms: SourceRecord,
): Record<string, Document> {
  const table = (name: string) => requireRecord(tables[name], name);
  const text = (value: unknown) => resolveText(value, texts);
  const plain = (value: string, context: string) => normalizeRichText(value, context, true);
  const description = (value: string, values: Record<string, number>, context: string) =>
    normalizeRichText(replacePlaceholders(value, values, context), context);
  const requiredText = (value: unknown, context: string, required = false) => {
    const result = text(value);
    if (!result && (required || hasTextReference(value)))
      throw new Error(`${context}: unresolved or missing text`);
    return result;
  };
  const patches = table('SkillPatchTable');
  const bundles = (id: string) =>
    array(record(patches[id], id).SkillPatchDataBundle, id).map(value => requireRecord(value, id));
  const operators: Document = {};
  const effects = table('PotentialTalentEffectTable');
  const effectDescription = (id: string, name: string, context: string) => {
    const effect = record(effects[id], context);
    const desc = text(effect.desc) || text(bundles(id)[0]?.description);
    return {
      name: plain(name, context),
      description: description(desc, effectValues(effects, id, context), context),
    };
  };
  for (const [id, char] of entries(table('CharacterTable'))) {
    if (!id.startsWith('chr_') || identities.excludedOperators.has(id)) continue;
    // Unregistered native characters retain the native English-name fallback; canonical characters
    // always use the compiler manifest's identity, never identities inferred from old locale files.
    const english = resolveText(char.name, table('I18nTextTable_EN'));
    const fallback =
      english
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '') ||
      id.split('_')[2] ||
      id;
    const slug = identities.operators[id] ?? (fallback === 'mi-fu' ? 'mifu' : fallback);
    const growth = record(table('CharGrowthTable')[id], id);
    const talentInfos = Object.values(record(growth.talentNodeMap, id))
      .map(value => requireRecord(value, id))
      .filter(node => node.nodeType === 4)
      .map(node => record(node.passiveSkillNodeInfo, id))
      .filter(info => info.talentEffectId)
      .sort(
        (a, b) =>
          Number(a.index ?? 0) - Number(b.index ?? 0) ||
          Number(a.level ?? 0) - Number(b.level ?? 0),
      );
    const talents: SourceRecord[] = [];
    for (const info of talentInfos) {
      const eid = requireNonEmptyString(info.talentEffectId, id);
      const name = text(info.name) || text(record(effects[eid], eid).name);
      if (name) talents.push(effectDescription(eid, name, `${slug} talent ${eid}`));
    }
    const potentials: SourceRecord[] = [];
    for (const value of array(
      record(table('CharacterPotentialTable')[id], id).potentialUnlockBundle,
      id,
    )) {
      const potential = requireRecord(value, id);
      const name = text(potential.name);
      if (name)
        potentials.push(
          effectDescription(
            requireNonEmptyString(potential.potentialEffectId, id),
            name,
            `${slug} potential`,
          ),
        );
    }
    const combatSkills: Document = {},
      formLabels: Record<string, string> = {};
    const addLabel = (key: string, name: string) => {
      if (formLabels[key] && formLabels[key] !== name)
        throw new Error(`${slug}: conflicting form label ${key}`);
      formLabels[key] = name;
    };
    for (const value of Object.values(record(growth.skillGroupMap, id))) {
      const group = requireRecord(value, id);
      const key = (
        { 0: 'basicAttack', 1: 'battleSkill', 2: 'ultimate', 3: 'comboSkill' } as Record<
          string,
          string
        >
      )[String(group.skillGroupType)];
      if (!key || !text(group.name)) continue;
      const context = `${slug} ${key}`;
      const values: Record<string, number> = {};
      for (const skillId of array(group.skillIdList, context))
        for (const bundle of bundles(requireNonEmptyString(skillId, context)))
          addBlackboardEntries(values, bundle.blackboard, context);
      if (group.skillGroupId)
        for (const bundle of bundles(requireNonEmptyString(group.skillGroupId, context))) {
          const defaults: Record<string, number> = {};
          addBlackboardEntries(defaults, bundle.blackboard, context);
          for (const [key, value] of Object.entries(defaults))
            if (!Object.hasOwn(values, key)) values[key] = value;
        }
      const baseDescription = description(text(group.desc), values, context);
      const indexes = new Set<number>();
      for (const field of Object.keys(group).filter(key => key.startsWith('condition'))) {
        const match = /^condition(Desc|DescInactive|Icon|Id|Name|PostDesc)([1-9][0-9]*)$/.exec(
          field,
        );
        if (!match) throw new Error(`${context}: unexpected skill condition field ${field}`);
        indexes.add(Number(match[2]));
      }
      const forms: Document = {};
      for (const index of [...indexes].sort((a, b) => a - b)) {
        if (
          !['Desc', 'DescInactive', 'Icon', 'Id', 'Name', 'PostDesc'].some(field =>
            hasTextReference(group[`condition${field}${index}`]),
          )
        )
          continue;
        const conditionId = requireNonEmptyString(group[`conditionId${index}`], context);
        const formKey = (
          { str: 'strength', agi: 'agility', wisd: 'int', will: 'will' } as Record<string, string>
        )[conditionId.split('_').at(-1)!.toLowerCase()];
        if (!formKey) throw new Error(`${context}: unmapped condition id ${conditionId}`);
        const name = plain(requiredText(group[`conditionName${index}`], context, true), context);
        const post = requiredText(group[`conditionPostDesc${index}`], context, true);
        for (const field of ['Desc', 'DescInactive'])
          requiredText(group[`condition${field}${index}`], context);
        const icon = group[`conditionIcon${index}`];
        if (icon) requireNonEmptyString(icon, context);
        forms[formKey] = {
          description: joinDescriptions([baseDescription, description(post, values, context)]),
        };
        addLabel(formKey, name);
      }
      if (!baseDescription && !Object.keys(forms).length)
        throw new Error(`${context}: missing skill description`);
      combatSkills[key] = {
        name: plain(text(group.name), context),
        description: baseDescription,
        ...(Object.keys(forms).length ? { forms } : {}),
      };
    }
    operators[slug] = {
      name: plain(text(char.name) || slug, id),
      ...(Object.keys(formLabels).length ? { forms: formLabels } : {}),
      talents,
      potentials,
      combatSkills: Object.fromEntries(
        ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate']
          .filter(key => key in combatSkills)
          .map(key => [key, combatSkills[key]]),
      ),
    };
  }

  const terms: Document = {};
  for (const [id, term] of entries(table('HyperlinkTextTable')))
    if (id.startsWith('ba.'))
      terms[id] = {
        name: normalizeRichText(text(term.name), id),
        description: normalizeRichText(text(term.desc), id),
        styleId: term.richTextId || '',
        iconPath: iconPath(term.iconPath, id),
      };

  const weapons: Document = {};
  for (const [id, weapon] of entries(table('WeaponBasicTable'))) {
    const slug = identities.weapons[id];
    if (!slug) continue;
    const skillIds = requireArray(weapon.weaponSkillList, id);
    if (![2, 3].includes(skillIds.length)) throw new Error(`${id}: unexpected weaponSkillList`);
    const result: SourceRecord = {
      name: plain(
        text(record(table('ItemTable')[id], id).name) || text(weapon.engName) || slug,
        id,
      ),
    };
    for (const [index, value] of skillIds.entries()) {
      const sid = requireNonEmptyString(value, id);
      result[
        (skillIds.length === 2 ? ['skill1', 'skill3'] : ['skill1', 'skill2', 'skill3'])[index]
      ] = compileWeaponSkillText(bundles(sid), texts, sid);
    }
    if (weapons[slug]) throw new Error(`${id}: duplicate weapon slug ${slug}`);
    weapons[slug] = result;
  }

  const gearsets: Document = {};
  for (const [id, suit] of entries(table('EquipSuitTable'))) {
    const rows = array(suit.list, id);
    if (!rows.length) continue;
    if (rows.length !== 1) throw new Error(`${id}: unexpected gear set bonus count`);
    const row = requireRecord(rows[0], id);
    if (row.equipCnt !== 3) throw new Error(`${id}: unexpected equipCnt`);
    const sid = requireNonEmptyString(row.skillID, id),
      level = requireInteger(row.skillLv, id);
    const selected = bundles(sid).filter(bundle => !level || bundle.level === level);
    if (!selected.length) throw new Error(`${id}: missing skill level ${level}`);
    const parts = selected.map(bundle => {
      const desc = requiredText(bundle.description, sid);
      const values: Record<string, number> = {};
      addBlackboardEntries(values, bundle.blackboard, sid);
      return description(desc, values, sid);
    });
    const desc = joinDescriptions(parts);
    if (!desc) throw new Error(`${id}: missing gear set description`);
    const slug =
      identities.gearSets[id] ??
      id
        .replace(/^suit_/, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    if (gearsets[slug]) throw new Error(`${id}: duplicate gear set slug ${slug}`);
    gearsets[slug] = { setName: plain(text(row.suitName) || id, id), description: desc };
  }

  const gearpieces: Document = {};
  const slots = requireRecord(enumTerms.slotType, 'enumTerms.slotType');
  for (const id of Object.keys(identities.gears).sort()) {
    const item = requireRecord(table('ItemTable')[id], id),
      equip = requireRecord(table('EquipTable')[id], id);
    const name = requiredText(item.name, id, true);
    const slot = ({ 0: 'armor', 1: 'gloves', 2: 'accessory' } as Record<string, string>)[
      String(equip.partType)
    ];
    if (!slot) throw new Error(`${id}: unexpected partType`);
    const suit = record(table('EquipSuitTable')[String(equip.suitID)], id);
    const first = array(suit.list, id)[0];
    const base = record(equip.displayBaseAttrModifier, id);
    gearpieces[identities.gears[id]] = {
      name: plain(name, id),
      slotType: slots[slot] || slot,
      setName: first ? plain(text(requireRecord(first, id).suitName), id) : '',
      ...(typeof base.attrValue === 'number' ? { defense: base.attrValue } : {}),
    };
  }

  const enemies: Document = {};
  for (const [id, enemy] of entries(table('EnemyTemplateDisplayInfoTable')))
    if (id.startsWith('eny_')) {
      if (enemy.templateId !== id) throw new Error(`${id}: templateId mismatch`);
      enemies[id] = { name: requiredText(enemy.name, id, true) };
    }
  if (!Object.keys(enemies).length)
    throw new Error('EnemyTemplateDisplayInfoTable: no selectable eny_* templates');

  const consumables: Document = {};
  for (const [id, use] of entries(table('UseItemTable'))) {
    if (!(
      use.isPersistentBuff === true &&
      use.duration === 300 &&
      use.effectType === 2 &&
      use.targetNumType === 0 &&
      use.uiType === 3 &&
      use.stackingKey === 'buff'
    ))
      continue;
    const item = requireRecord(table('ItemTable')[id], id);
    const name = requiredText(item.name, id, true),
      desc = text(use.itemUseDesc) || requiredText(item.desc, id, true);
    const values: Record<string, number> = {},
      unqualified: Record<string, number> = {};
    const conflicts = new Set<string>();
    for (const action of array(use.useActions, id)) {
      const buff = record(requireRecord(action, id).buffBBData, id);
      for (const pair of array(buff.blackboard, id)) {
        const row = requireRecord(pair, id),
          key = requireNonEmptyString(row.key, id),
          value = requireNumber(row.value, id);
        values[`${buff.buffId}\\${key}`.toLowerCase()] = value;
        if (key in unqualified && unqualified[key] !== value) conflicts.add(key);
        else unqualified[key] = value;
      }
    }
    for (const [key, value] of Object.entries(unqualified))
      if (!conflicts.has(key)) values[key.toLowerCase()] = value;
    consumables[id] = { name, description: plain(replacePlaceholders(desc, values, id), id) };
  }
  if (!Object.keys(consumables).length)
    throw new Error('UseItemTable: no active operator Buff consumables');
  return { operators, terms, weapons, gearsets, gearpieces, enemies, consumables };
}

export function compileWeaponSkillText(
  bundles: readonly SourceRecord[],
  texts: SourceRecord,
  context: string,
): SourceRecord {
  if (!bundles.length) throw new Error(`${context}: missing skill bundles`);
  let template: string | undefined,
    canonical: string | undefined,
    name = '';
  const valuesByPlaceholder = new Map<string, string[]>();
  const canonicalKey = (inner: string) => JSON.stringify(parsePlaceholder(inner, context));
  for (const [index, bundle] of [...bundles]
    .sort((a, b) => Number(a.level ?? 0) - Number(b.level ?? 0))
    .entries()) {
    if (requireInteger(bundle.level, context) <= 0) throw new Error(`${context}: invalid level`);
    if (index === 0) {
      name = resolveText(bundle.skillName, texts);
      if (!name && hasTextReference(bundle.skillName))
        throw new Error(`${context}: unresolved skillName`);
    }
    const desc = resolveText(bundle.description, texts);
    if (!desc) throw new Error(`${context}: missing description`);
    const current = normalizeRichText(desc, context);
    const normalized = current.replace(
      /\{([^}]+)\}/g,
      (_, inner: string) => `{${parsePlaceholder(inner, context).join(':')}}`,
    );
    if (canonical !== undefined && canonical !== normalized)
      throw new Error(`${context}: weapon skill description template changed between levels`);
    template ??= current;
    canonical ??= normalized;
    const values: Record<string, number> = {};
    addBlackboardEntries(values, bundle.blackboard, context);
    const row = new Map<string, string>();
    for (const match of current.matchAll(/\{([^}]+)\}/g)) {
      const rendered = replacePlaceholders(match[0], values, context)
        .replace(/(\.\d*?)0+(%?)$/, '$1$2')
        .replace(/\.(%?)$/, '$1');
      row.set(canonicalKey(match[1]), rendered);
    }
    for (const [key, value] of row) {
      const values = valuesByPlaceholder.get(key) ?? [];
      values.push(value);
      valuesByPlaceholder.set(key, values);
    }
  }
  const variables = [...valuesByPlaceholder.keys()].filter(
    key => new Set(valuesByPlaceholder.get(key)).size > 1,
  );
  const desc = template!.replace(/\{([^}]+)\}/g, (_, inner: string) => {
    const key = canonicalKey(inner),
      values = valuesByPlaceholder.get(key)!;
    const index = variables.indexOf(key);
    return index < 0 ? values[0] : `{${index}}${values[0].endsWith('%') ? '%' : ''}`;
  });
  const rows = bundles.map((_, index) => {
    const row = variables.map(key => {
      const text = valuesByPlaceholder.get(key)![index].replace(/%$/, '');
      return text.trim() && Number.isFinite(Number(text)) ? Number(text) : text;
    });
    return row.length === 1 ? row[0] : row;
  });
  return {
    name: normalizeRichText(name, context, true) || context,
    description: desc,
    ...(variables.length ? { values: rows } : {}),
  };
}
