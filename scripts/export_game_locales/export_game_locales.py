"""
Export Endaxis operator game text from AKEDatabase TableCfg raw files.

Usage:
    python3 scripts/export_game_locales/export_game_locales.py \
        /path/to/AKEDatabase/public/TableCfg \
        src/i18n/game-locales

Output:
    src/i18n/game-locales/zh/operators.json
    src/i18n/game-locales/zh/terms.json
    src/i18n/game-locales/en/operators.json
    src/i18n/game-locales/en/terms.json
"""

import json
import os
import re
import sys

TEXT_TABLE = {}
BATTLE_RICH_TEXT_PREFIX = 'ba.'
EXCLUDED_CHAR_IDS = {'chr_0002_endminm', 'chr_0003_endminf'}
RICH_TEXT_TAG_RE = re.compile(r'<[^>]*>')
RICH_TEXT_OPEN_TAG_RE = re.compile(r'<([@#])([A-Za-z0-9_.-]+)>')
RICH_TEXT_IMAGE_TAG_RE = re.compile(r'<image="([^"]+)"(?:\s+scale=[0-9.]+)?>')
ENDAXIS_ICON_PATH_MAP = {
    'bufficon/icon_energy_fusion_cryst': '/icons/icon_term_ba_crystinflict.webp',
    'bufficon/icon_energy_fusion_fire': '/icons/icon_term_ba_fireinflict.webp',
    'bufficon/icon_energy_fusion_pulse': '/icons/icon_term_ba_pulseinflict.webp',
    'bufficon/icon_infliction_nature': '/icons/icon_term_ba_naturalinflict.webp',
    'termicon/icon_term_ba_airborne': '/icons/icon_term_ba_airborne.webp',
    'termicon/icon_term_ba_burning': '/icons/icon_term_ba_burning.webp',
    'termicon/icon_term_ba_combo': '/icons/icon_term_ba_combo.webp',
    'termicon/icon_term_ba_conduct': '/icons/icon_term_ba_conduct.webp',
    'termicon/icon_term_ba_corrupt': '/icons/icon_term_ba_corrupt.webp',
    'termicon/icon_term_ba_crush': '/icons/icon_term_ba_crush.webp',
    'termicon/icon_term_ba_crystbreak': '/icons/icon_term_ba_crystbreak.webp',
    'termicon/icon_term_ba_crystenhance': '/icons/icon_term_ba_crystenhance.webp',
    'termicon/icon_term_ba_crystinflict': '/icons/icon_term_ba_crystinflict.webp',
    'termicon/icon_term_ba_crystvul': '/icons/icon_term_ba_crystvul.webp',
    'termicon/icon_term_ba_enhance': '/icons/icon_term_ba_enhance.webp',
    'termicon/icon_term_ba_fireenhance': '/icons/icon_term_ba_fireenhance.webp',
    'termicon/icon_term_ba_fireinflict': '/icons/icon_term_ba_fireinflict.webp',
    'termicon/icon_term_ba_firevul': '/icons/icon_term_ba_firevul.webp',
    'termicon/icon_term_ba_fracture': '/icons/icon_term_ba_fracture.webp',
    'termicon/icon_term_ba_frozen': '/icons/icon_term_ba_frozen.webp',
    'termicon/icon_term_ba_guard': '/icons/icon_term_ba_guard.webp',
    'termicon/icon_term_ba_knockdown': '/icons/icon_term_ba_knockdown.webp',
    'termicon/icon_term_ba_naturalenhance': '/icons/icon_term_ba_naturalenhance.webp',
    'termicon/icon_term_ba_naturalinflict': '/icons/icon_term_ba_naturalinflict.webp',
    'termicon/icon_term_ba_naturalvul': '/icons/icon_term_ba_naturalvul.webp',
    'termicon/icon_term_ba_noguard': '/icons/icon_term_ba_noguard.webp',
    'termicon/icon_term_ba_physicalenhance': '/icons/icon_term_ba_physicalenhance.webp',
    'termicon/icon_term_ba_physicalvul': '/icons/icon_term_ba_physicalvul.webp',
    'termicon/icon_term_ba_pulseenhance': '/icons/icon_term_ba_pulseenhance.webp',
    'termicon/icon_term_ba_pulseinflict': '/icons/icon_term_ba_pulseinflict.webp',
    'termicon/icon_term_ba_pulsevul': '/icons/icon_term_ba_pulsevul.webp',
    'termicon/icon_term_ba_slow': '/icons/icon_term_ba_slow.webp',
    'termicon/icon_term_ba_speedup': '/icons/icon_term_ba_speedup.webp',
    'termicon/icon_term_ba_spellenhance': '/icons/icon_term_ba_spellenhance.webp',
    'termicon/icon_term_ba_spellvul': '/icons/icon_term_ba_spellvul.webp',
    'termicon/icon_term_ba_vulnerable': '/icons/icon_term_ba_vulnerable.webp',
    'termicon/icon_term_ba_weak': '/icons/icon_term_ba_weak.webp',
}


def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_text_table(table_dir, locale):
    """Load I18nTextTable_{locale}.json into a global lookup dict."""
    global TEXT_TABLE
    path = os.path.join(table_dir, f'I18nTextTable_{locale}.json')
    TEXT_TABLE = load_json(path)


def resolve_text(obj):
    """Resolve {id: ..., text: ...} or plain string. Falls back to I18nTextTable."""
    if obj is None:
        return ''
    if isinstance(obj, str):
        return obj
    if isinstance(obj, dict):
        text = obj.get('text', '')
        if text:
            return text
        tid = obj.get('id', 0)
        if tid:
            val = TEXT_TABLE.get(str(tid), '')
            if val:
                return val
    return ''


def rich_text_error(context, message):
    raise ValueError(f'{context}: {message}')


def normalize_ake_image_path(path):
    return re.sub(r'\.[a-zA-Z0-9]+$', '', str(path or '')) \
        .replace('\\', '/') \
        .lstrip('/') \
        .removeprefix('public/images/') \
        .lower()


def map_icon_path(path):
    if not path:
        return ''
    if str(path).startswith('/icons/'):
        return str(path)
    return ENDAXIS_ICON_PATH_MAP.get(normalize_ake_image_path(path), '')


def require_icon_path(path, context):
    if not path:
        return ''
    mapped = map_icon_path(path)
    if not mapped:
        rich_text_error(context, f'unexpected image path: {path}')
    return mapped


def validate_rich_text_tags(text, context):
    stack = []
    for match in RICH_TEXT_TAG_RE.finditer(text):
        tag = match.group(0)
        if tag == '</>':
            if not stack:
                rich_text_error(context, f'unmatched closing tag at {match.start()}: {tag}')
            stack.pop()
            continue

        open_tag = RICH_TEXT_OPEN_TAG_RE.fullmatch(tag)
        if open_tag:
            stack.append((open_tag.group(1), open_tag.group(2), match.start()))
            continue

        image_tag = RICH_TEXT_IMAGE_TAG_RE.fullmatch(tag)
        if image_tag:
            require_icon_path(image_tag.group(1), context)
            continue

        rich_text_error(context, f'unexpected rich text tag at {match.start()}: {tag}')

    if stack:
        tag_type, tag_id, offset = stack[-1]
        rich_text_error(context, f'unclosed rich text tag at {offset}: <{tag_type}{tag_id}>')


def map_rich_text_images(text, context):
    validate_rich_text_tags(text, context)

    def replacer(match):
        return f'<image="{require_icon_path(match.group(1), context)}">'

    return RICH_TEXT_IMAGE_TAG_RE.sub(replacer, text)


def normalize_rich_text(text, context):
    """Keep rich-text tags but normalize line endings and Endaxis asset paths."""
    if not text:
        return ''
    normalized = str(text).replace('\r\n', '\n').replace('\r', '\n')
    return map_rich_text_images(normalized, context).strip()


def strip_rich_text_tags(text, context):
    """Remove validated AKEDatabase rich-text tags when a field must stay plain text."""
    if not text:
        return ''
    normalized = normalize_rich_text(text, context)
    normalized = re.sub(r'<(?:@|#)[A-Za-z0-9_.-]+>', '', normalized)
    normalized = normalized.replace('</>', '')
    normalized = re.sub(r'<image="/icons/[^"]+">', '', normalized)
    return normalized.strip()


def data_error(context, message):
    raise ValueError(f'{context}: {message}')


def require_number(value, context, field):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        data_error(context, f'unexpected blackboard {field} type: {type(value).__name__} ({value!r})')
    return value


def require_non_empty_string(value, context, field):
    if not isinstance(value, str) or not value:
        data_error(context, f'unexpected blackboard {field}: {value!r}')
    return value


def add_value(values, key, value, context):
    name = require_non_empty_string(key, context, 'key')
    values[name] = require_number(value, context, name)


def add_blackboard_entries(values, blackboard, context):
    if blackboard in (None, []):
        return
    if not isinstance(blackboard, list):
        data_error(context, f'unexpected blackboard container type: {type(blackboard).__name__}')
    for index, item in enumerate(blackboard):
        item_context = f'{context} blackboard[{index}]'
        if not isinstance(item, dict):
            data_error(item_context, f'unexpected blackboard entry type: {type(item).__name__}')
        unexpected_keys = set(item.keys()) - {'key', 'value', 'valueStr'}
        if unexpected_keys:
            data_error(item_context, f'unexpected blackboard fields: {sorted(unexpected_keys)}')
        key = require_non_empty_string(item.get('key'), item_context, 'key')
        if 'value' not in item:
            data_error(item_context, 'missing blackboard value')
        assert_empty_string_field(item, 'valueStr', item_context)
        add_value(values, key, item.get('value'), item_context)


def assert_empty_string_field(data, field, context):
    value = data.get(field, '')
    if value is None or value == '':
        return
    if not isinstance(value, str):
        data_error(context, f'unexpected {field} type: {type(value).__name__} ({value!r})')
    data_error(context, f'unexpected non-empty {field}: {value!r}')


def assert_ignored_modifier_zero(modifier, value_field, context):
    value = modifier.get(value_field, 0)
    if value not in (0, 0.0, None):
        data_error(context, f'unexpected {value_field} without a key/type: {value!r}')


def format_placeholder_value(result, fmt, context):
    require_number(result, context, 'placeholder result')
    if fmt == '':
        return str(result)
    if fmt == '0%':
        return f'{round(result * 100)}%'
    match = re.match(r'^0\.(0+)%$', fmt)
    if match:
        precision = len(match.group(1))
        return f'{result * 100:.{precision}f}%'
    match = re.match(r'^0\.(#+)%$', fmt)
    if match:
        precision = len(match.group(1))
        formatted = f'{result * 100:.{precision}f}'.rstrip('0').rstrip('.')
        return f'{formatted if formatted else "0"}%'
    if fmt == '0':
        return str(round(result))
    match = re.match(r'^0\.(0+)$', fmt)
    if match:
        precision = len(match.group(1))
        return f'{result:.{precision}f}'
    match = re.match(r'^0\.(#+)$', fmt)
    if match:
        precision = len(match.group(1))
        formatted = f'{result:.{precision}f}'.rstrip('0').rstrip('.')
        return formatted if formatted else '0'
    data_error(context, f'unexpected placeholder format: {fmt!r}')


def replace_placeholders(desc, values, context):
    """Replace {expr:format} with resolved numeric values from blackboard."""
    if not desc:
        return desc
    if not isinstance(desc, str):
        data_error(context, f'unexpected description type: {type(desc).__name__}')

    lower_values = {}
    for key, value in values.items():
        if not isinstance(key, str) or not key:
            data_error(context, f'unexpected value key: {key!r}')
        lower_key = key.lower()
        if lower_key in lower_values and lower_values[lower_key] != value:
            data_error(context, f'conflicting case-insensitive blackboard key: {key}')
        lower_values[lower_key] = require_number(value, context, key)

    def replacer(match):
        inner = match.group(1)
        parts = inner.split(':')
        expr = parts[0].strip()
        fmt = parts[1].strip() if len(parts) > 1 else ''
        if len(parts) > 2:
            data_error(context, f'unexpected placeholder syntax: {{{inner}}}')

        var_names = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', expr)
        if not var_names:
            data_error(context, f'placeholder has no blackboard variable: {{{inner}}}')

        eval_expr = expr
        for name in var_names:
            lower_name = name.lower()
            if lower_name not in lower_values:
                data_error(context, f'unknown blackboard variable {name!r} in {{{inner}}}')
            value = lower_values[lower_name]
            eval_expr = re.sub(r'\b' + re.escape(name) + r'\b', str(value), eval_expr)

        try:
            result = eval(eval_expr, {'__builtins__': {}}, {})
        except Exception as exc:
            data_error(context, f'failed to evaluate placeholder {{{inner}}}: {exc}')

        return format_placeholder_value(result, fmt, context)

    return re.sub(r'\{([^}]+)\}', replacer, desc)


def build_value_map(effect_table, eid, attr_en_map=None, param_type_map=None, context=None):
    """Extract validated numeric blackboard values from an effect's dataList."""
    values = {}
    context = context or f'effect {eid}'
    effect = effect_table.get(eid)
    if not isinstance(effect, dict):
        data_error(context, f'missing effect data for {eid!r}')
    data_list = effect.get('dataList', [])
    if not isinstance(data_list, list):
        data_error(context, f'unexpected dataList type: {type(data_list).__name__}')
    for item_index, item in enumerate(data_list):
        item_context = f'{context} dataList[{item_index}]'
        if not isinstance(item, dict):
            data_error(item_context, f'unexpected dataList item type: {type(item).__name__}')
        attach_buff = item.get('attachBuff', {})
        if attach_buff:
            if not isinstance(attach_buff, dict):
                data_error(item_context, f'unexpected attachBuff type: {type(attach_buff).__name__}')
            add_blackboard_entries(values, attach_buff.get('blackboard', []), f'{item_context} attachBuff')
        attach_skill = item.get('attachSkill', {})
        if attach_skill:
            if not isinstance(attach_skill, dict):
                data_error(item_context, f'unexpected attachSkill type: {type(attach_skill).__name__}')
            add_blackboard_entries(values, attach_skill.get('blackboard', []), f'{item_context} attachSkill')

        modifier = item.get('skillBbModifier', {})
        if modifier:
            if not isinstance(modifier, dict):
                data_error(item_context, f'unexpected skillBbModifier type: {type(modifier).__name__}')
            modifier_context = f'{item_context} skillBbModifier'
            assert_empty_string_field(modifier, 'stringValue', modifier_context)
            key = modifier.get('bbKey', '')
            if key:
                add_value(values, key, modifier.get('floatValue'), modifier_context)
            else:
                assert_ignored_modifier_zero(modifier, 'floatValue', modifier_context)

        attr_modifier = item.get('attrModifier', {})
        if attr_modifier:
            if not isinstance(attr_modifier, dict):
                data_error(item_context, f'unexpected attrModifier type: {type(attr_modifier).__name__}')
            attr_type = attr_modifier.get('attrType', 0)
            if isinstance(attr_type, bool) or not isinstance(attr_type, int):
                data_error(item_context, f'unexpected attrType: {attr_type!r}')
            if attr_type > 0:
                name = (attr_en_map or {}).get(str(attr_type), '')
                if not name:
                    data_error(item_context, f'unmapped attrType: {attr_type}')
                add_value(values, name, attr_modifier.get('attrValue'), f'{item_context} attrModifier')
            else:
                assert_ignored_modifier_zero(attr_modifier, 'attrValue', f'{item_context} attrModifier')

        param_modifier = item.get('skillParamModifier', {})
        if param_modifier:
            if not isinstance(param_modifier, dict):
                data_error(item_context, f'unexpected skillParamModifier type: {type(param_modifier).__name__}')
            param_type = param_modifier.get('paramType', 0)
            if isinstance(param_type, bool) or not isinstance(param_type, int):
                data_error(item_context, f'unexpected paramType: {param_type!r}')
            if param_type > 0:
                name = (param_type_map or {}).get(str(param_type), '')
                if not name:
                    data_error(item_context, f'unmapped paramType: {param_type}')
                add_value(values, name, param_modifier.get('paramValue'), f'{item_context} skillParamModifier')
            else:
                assert_ignored_modifier_zero(param_modifier, 'paramValue', f'{item_context} skillParamModifier')
    return values


def resolve_with_text_table(obj, text_table):
    if obj is None:
        return ''
    if isinstance(obj, str):
        return obj
    if isinstance(obj, dict):
        text = obj.get('text', '')
        if text:
            return text
        tid = obj.get('id', 0)
        if tid:
            return text_table.get(str(tid), '')
    return ''


def build_operator_slug(char_id, char_data, en_text, old_slugs=None):
    en_name = resolve_with_text_table(char_data.get('name', ''), en_text)
    slug = re.sub(r'\s+', '-', en_name.lower()) if en_name else ''
    slug = re.sub(r'[^a-z0-9-]', '', slug).strip('-')
    if not slug:
        parts = char_id.split('_')
        slug = parts[2] if len(parts) >= 3 else char_id
    if old_slugs and slug not in old_slugs:
        undashed = slug.replace('-', '')
        if undashed in old_slugs:
            slug = undashed
    return {'mi-fu': 'mifu'}.get(slug, slug)


def export_operators(table_dir, locale='CN', old_slugs=None):
    load_text_table(table_dir, locale)

    char_table = load_json(os.path.join(table_dir, 'CharacterTable.json'))
    pot_table = load_json(os.path.join(table_dir, 'CharacterPotentialTable.json'))
    effect_table = load_json(os.path.join(table_dir, 'PotentialTalentEffectTable.json'))
    grow_table = load_json(os.path.join(table_dir, 'CharGrowthTable.json'))
    skill_patch = load_json(os.path.join(table_dir, 'SkillPatchTable.json'))

    en_text = load_json(os.path.join(table_dir, 'I18nTextTable_EN.json'))

    maps_path = os.path.join(os.path.dirname(table_dir), 'CH', 'maps.json')
    maps_data = load_json(maps_path)
    attr_en_map = maps_data.get('ATTR_MAP_EN', {})
    param_type_map = maps_data.get('param_type_map', {})

    operators = {}

    for char_id, char_data in sorted(char_table.items()):
        if not char_id.startswith('chr_') or char_id in EXCLUDED_CHAR_IDS:
            continue

        slug = build_operator_slug(char_id, char_data, en_text, old_slugs)
        name = resolve_text(char_data.get('name', '')) or slug
        growth = grow_table.get(char_id, {})

        talents = []
        talent_items = []
        for node in growth.get('talentNodeMap', {}).values():
            if node.get('nodeType') != 4:
                continue
            info = node.get('passiveSkillNodeInfo', {})
            eid = info.get('talentEffectId')
            if eid:
                talent_items.append((info.get('index', 0), info.get('level', 0), info, eid))
        talent_items.sort(key=lambda x: (x[0], x[1]))

        for _, _, info, eid in talent_items:
            effect = effect_table.get(eid, {})
            desc = resolve_text(effect.get('desc', ''))
            if not desc:
                patch = skill_patch.get(eid, {})
                bundles = patch.get('SkillPatchDataBundle', [])
                if bundles:
                    desc = resolve_text(bundles[0].get('description', ''))
            talent_name = resolve_text(info.get('name')) or resolve_text(effect.get('name', ''))
            if talent_name:
                desc_context = f'{locale} {slug} talent description {eid}'
                values = build_value_map(
                    effect_table,
                    eid,
                    attr_en_map,
                    param_type_map,
                    context=f'{locale} {slug} talent effect {eid}',
                )
                talents.append({
                    'name': strip_rich_text_tags(talent_name, f'{locale} {slug} talent name {eid}'),
                    'description': normalize_rich_text(replace_placeholders(desc, values, desc_context), desc_context),
                })

        potentials = []
        for potential in pot_table.get(char_id, {}).get('potentialUnlockBundle', []):
            eid = potential.get('potentialEffectId')
            effect = effect_table.get(eid, {})
            desc = resolve_text(effect.get('desc', ''))
            if not desc:
                patch = skill_patch.get(eid, {})
                bundles = patch.get('SkillPatchDataBundle', [])
                if bundles:
                    desc = resolve_text(bundles[0].get('description', ''))
            potential_name = resolve_text(potential.get('name', ''))
            if potential_name:
                desc_context = f'{locale} {slug} potential description {eid}'
                values = build_value_map(
                    effect_table,
                    eid,
                    attr_en_map,
                    param_type_map,
                    context=f'{locale} {slug} potential effect {eid}',
                )
                potentials.append({
                    'name': strip_rich_text_tags(potential_name, f'{locale} {slug} potential name {eid}'),
                    'description': normalize_rich_text(replace_placeholders(desc, values, desc_context), desc_context),
                })

        skill_type_map = {0: 'basicAttack', 1: 'battleSkill', 2: 'ultimate', 3: 'comboSkill'}
        combat_skills = {}
        for skill_group in growth.get('skillGroupMap', {}).values():
            key = skill_type_map.get(skill_group.get('skillGroupType'))
            if not key:
                continue
            skill_name = resolve_text(skill_group.get('name', ''))
            desc = resolve_text(skill_group.get('desc', ''))
            if not skill_name:
                continue

            values = {}
            gid = skill_group.get('skillGroupId', '')
            for sid in skill_group.get('skillIdList', []):
                patch = skill_patch.get(sid, {})
                for bundle_index, bundle in enumerate(patch.get('SkillPatchDataBundle', [])):
                    add_blackboard_entries(
                        values,
                        bundle.get('blackboard', []),
                        f'{locale} {slug} {key} skill {sid} bundle[{bundle_index}]',
                    )
            if gid:
                patch = skill_patch.get(gid, {})
                for bundle_index, bundle in enumerate(patch.get('SkillPatchDataBundle', [])):
                    group_values = {}
                    add_blackboard_entries(
                        group_values,
                        bundle.get('blackboard', []),
                        f'{locale} {slug} {key} skill group {gid} bundle[{bundle_index}]',
                    )
                    for value_key, value in group_values.items():
                        values.setdefault(value_key, value)

            desc_context = f'{locale} {slug} {key} skill description {gid or skill_group.get("skillGroupType")}'
            combat_skills[key] = {
                'name': strip_rich_text_tags(skill_name, f'{locale} {slug} {key} skill name'),
                'description': normalize_rich_text(replace_placeholders(desc, values, desc_context), desc_context),
            }

        operators[slug] = {
            'name': strip_rich_text_tags(name, f'{locale} {slug} operator name'),
            'talents': talents,
            'potentials': potentials,
            'combatSkills': combat_skills,
        }

    return operators


def export_battle_terms(table_dir, locale='CN'):
    """Export battle terms used by operator rich-text descriptions."""
    load_text_table(table_dir, locale)

    hyperlink_table = load_json(os.path.join(table_dir, 'HyperlinkTextTable.json'))

    terms = {}
    for term_id, term in sorted(hyperlink_table.items()):
        if not term_id.startswith(BATTLE_RICH_TEXT_PREFIX):
            continue
        terms[term_id] = {
            'name': normalize_rich_text(resolve_text(term.get('name')), f'{locale} {term_id} term name'),
            'description': normalize_rich_text(resolve_text(term.get('desc')), f'{locale} {term_id} term description'),
            'styleId': term.get('richTextId') or '',
            'iconPath': require_icon_path(term.get('iconPath') or '', f'{locale} {term_id} term icon'),
        }

    return terms


def merge_old_order_and_subskills(operators, old_data):
    if not old_data:
        return operators

    slug_remap = {}
    for new_slug in operators:
        undashed = new_slug.replace('-', '')
        for old_slug in old_data:
            if old_slug not in operators and old_slug.replace('-', '') == undashed:
                slug_remap[old_slug] = new_slug
                break

    ordered = {}
    for old_slug in old_data:
        slug = slug_remap.get(old_slug, old_slug)
        if slug in operators:
            entry = operators[slug]
            if 'subSkills' in old_data[slug]:
                entry['subSkills'] = old_data[slug]['subSkills']
            ordered[slug] = entry

    for slug, data in operators.items():
        if slug not in ordered:
            ordered[slug] = data
    return ordered


def order_combat_skills(operators):
    skill_order = ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate']
    for data in operators.values():
        combat_skills = data.get('combatSkills', {})
        if not combat_skills:
            continue
        data['combatSkills'] = {
            key: combat_skills[key]
            for key in skill_order
            if key in combat_skills
        }


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
    table_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(
        os.path.join(repo_root, '..', 'AKEDatabase', 'public', 'TableCfg')
    )
    output_base = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        repo_root, 'src', 'i18n', 'game-locales'
    )

    for locale, out_locale in [('CN', 'zh'), ('EN', 'en')]:
        locale_dir = os.path.join(output_base, out_locale)
        os.makedirs(locale_dir, exist_ok=True)

        operators_file = os.path.join(locale_dir, 'operators.json')
        old_data = load_json(operators_file)
        old_slugs = set(old_data.keys()) if old_data else None

        operators = export_operators(table_dir, locale=locale, old_slugs=old_slugs)
        operators = merge_old_order_and_subskills(operators, old_data)
        order_combat_skills(operators)
        battle_terms = export_battle_terms(table_dir, locale=locale)

        with open(operators_file, 'w', encoding='utf-8') as f:
            json.dump(operators, f, ensure_ascii=False, indent=2)
            f.write('\n')

        battle_terms_file = os.path.join(locale_dir, 'terms.json')
        with open(battle_terms_file, 'w', encoding='utf-8') as f:
            json.dump(battle_terms, f, ensure_ascii=False, indent=2)
            f.write('\n')

        print(
            f'{operators_file}: {len(operators)} operators; '
            f'{battle_terms_file}: {len(battle_terms)} terms'
        )


if __name__ == '__main__':
    main()
