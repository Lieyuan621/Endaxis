"""
Export Endaxis game locale files from AKEDB CDN TableCfg data.

This script intentionally fails fast when AKEDB introduces an unknown rich-text
tag, image asset, placeholder expression, or blackboard shape. Silent data loss
is worse than a failed export: generated locale JSON is used by UI tooltips.

Typical usage:
    python3 scripts/export_game_locales/export_game_locales.py
    python3 scripts/export_game_locales/export_game_locales.py --refresh-cache
    python3 scripts/export_game_locales/export_game_locales.py --output /tmp/game-locales
"""

import argparse
import ast
import hashlib
import json
import os
import re
import time
from urllib.request import Request, urlopen

TEXT_TABLE = {}
DEFAULT_CDN_BASE = 'https://data.akedata.wiki'
FETCH_CACHE_DIR = os.path.join(os.path.expanduser('~'), '.cache', 'endaxis-export-game-locales')
USER_AGENT = 'Endaxis-export-game-locales/1.0'
FETCH_TIMEOUT = 120
FETCH_RETRIES = 3
REMOTE_BASE = DEFAULT_CDN_BASE
USE_FETCH_CACHE = True
REFRESH_FETCH_CACHE = False
BATTLE_RICH_TEXT_PREFIX = 'ba.'
EXCLUDED_CHAR_IDS = {'chr_0002_endminm', 'chr_0003_endminf'}
LOCALE_EXPORTS = [('CN', 'zh'), ('EN', 'en')]
RICH_TEXT_TAG_RE = re.compile(r'<[^>]*>')
RICH_TEXT_OPEN_TAG_RE = re.compile(r'<([@#])([A-Za-z0-9_.-]+)>')
RICH_TEXT_IMAGE_TAG_RE = re.compile(r'<image="([^"]+)"(?:\s+scale=[0-9.]+)?>')
SKILL_CONDITION_FIELD_RE = re.compile(
    r'^condition(Desc|DescInactive|Icon|Id|Name|PostDesc)([1-9][0-9]*)$'
)
FORM_KEY_BY_CONDITION_SUFFIX = {
    'str': 'strength',
    'agi': 'agility',
    'wisd': 'int',
    'will': 'will',
}

ATTR_MAP_EN = {
    '0': 'Level',
    '1': 'MaxHp',
    '2': 'Atk',
    '3': 'Def',
    '4': 'PhysicalDamageTakenScalar',
    '5': 'FireDamageTakenScalar',
    '6': 'PulseDamageTakenScalar',
    '7': 'CrystDamageTakenScalar',
    '8': 'Weight',
    '9': 'CriticalRate',
    '10': 'CriticalDamageIncrease',
    '11': 'Hatred',
    '12': 'NormalAttackRange',
    '13': 'MoveSpeedScalar',
    '14': 'TurnRateScalar',
    '15': 'AttackRate',
    '16': 'SkillCooldownScalar',
    '17': 'NormalAttackDamageIncrease',
    '18': 'HpRecoveryPerSec',
    '19': 'HpRecoveryPerSecByMaxHpRatio',
    '20': 'MaxPoise',
    '21': 'PoiseRecTime',
    '22': 'MaxUltimateSp',
    '23': 'ComboSkillCooldownFinalAddition',
    '24': 'PoiseDamageTakenScalar',
    '25': 'PhysicalInflictionDamageScalar',
    '26': 'PoiseDamageOutputScalar',
    '27': 'BreakingAttackDamageTakenScalar',
    '28': 'UltimateSkillDamageIncrease',
    '29': 'HealOutputIncrease',
    '30': 'HealTakenIncrease',
    '31': 'PoiseRecTimeScalar',
    '32': 'NormalSkillDamageIncrease',
    '33': 'ComboSkillDamageIncrease',
    '34': 'KnockDownTimeAddition',
    '35': 'FireBurstDamageIncrease',
    '36': 'PulseBurstDamageIncrease',
    '37': 'CrystBurstDamageIncrease',
    '38': 'NaturalBurstDamageIncrease',
    '39': 'Str',
    '40': 'Agi',
    '41': 'Wisd',
    '42': 'Will',
    '43': 'LifeSteal',
    '44': 'UltimateSpGainScalar',
    '45': 'AtbCostAddition',
    '46': 'NormalSkillCooldownAddition',
    '47': 'ComboSkillCooldownScalar',
    '48': 'NaturalDamageTakenScalar',
    '49': 'IgniteDamageScalar',
    '50': 'PhysicalDamageIncrease',
    '51': 'FireDamageIncrease',
    '52': 'PulseDamageIncrease',
    '53': 'CrystDamageIncrease',
    '54': 'NaturalDamageIncrease',
    '55': 'EtherDamageIncrease',
    '56': 'FireAbnormalDamageIncrease',
    '57': 'PulseAbnormalDamageIncrease',
    '58': 'CrystAbnormalDamageIncrease',
    '59': 'NaturalAbnormalDamageIncrease',
    '60': 'EtherDamageTakenScalar',
    '61': 'DamageToBrokenUnitIncrease',
    '62': 'WeaknessDmgScalar',
    '63': 'ShelterDmgScalar',
    '64': 'PhysicalEnhancedDmgIncrease',
    '65': 'FireEnhancedDmgIncrease',
    '66': 'PulseEnhancedDmgIncrease',
    '67': 'CrystEnhancedDmgIncrease',
    '68': 'NaturalEnhancedDmgIncrease',
    '69': 'EtherEnhancedDmgIncrease',
    '70': 'PhysicalVulnerableDmgIncrease',
    '71': 'FireVulnerableDmgIncrease',
    '72': 'PulseVulnerableDmgIncrease',
    '73': 'CrystVulnerableDmgIncrease',
    '74': 'NaturalVulnerableDmgIncrease',
    '75': 'EtherVulnerableDmgIncrease',
    '76': 'AtkIncreaseFactorFromStr',
    '77': 'AtkIncreaseFactorFromAgi',
    '78': 'AtkIncreaseFactorFromWisd',
    '79': 'AtkIncreaseFactorFromWill',
    '80': 'PhysicalDmgResistScalar',
    '81': 'NaturalDmgResistScalar',
    '82': 'CrystDmgResistScalar',
    '83': 'PulseDmgResistScalar',
    '84': 'FireDmgResistScalar',
    '85': 'EtherDmgResistScalar',
    '86': 'SlowActionSpeedScalar',
    '87': 'PhysicalAndSpellInflictionEnhance',
    '88': 'ShieldOutputIncrease',
    '89': 'ShieldTakenIncrease',
    '90': 'NormalAttackStartRange',
    '91': 'InAirMoveSpeedScalar',
    '92': 'KeywordSpeedUpScalar',
    '93': 'ComboSkillCooldownRecoveryScalar',
    '94': 'PhysicalResistance',
    '95': 'NaturalResistance',
    '96': 'CrystResistance',
    '97': 'PulseResistance',
    '98': 'FireResistance',
    '99': 'EtherResistance',
    '100': 'ComboSkillCooldownDecrease',
}

PARAM_TYPE_MAP = {
    '1': 'CostValue',
    '2': 'CoolDown',
    '3': 'MaxChargeTime',
    # AKEDB renders this as a condition-specific combo-skill cooldown adjustment.
    '4': 'ConditionalComboCoolDown',
}

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


# ─── Remote AKEDB loading ────────────────────────────────────────────────────

def configure_remote(base_url, use_cache=True, refresh_cache=False):
    global REMOTE_BASE, USE_FETCH_CACHE, REFRESH_FETCH_CACHE
    REMOTE_BASE = base_url.rstrip('/')
    USE_FETCH_CACHE = use_cache
    REFRESH_FETCH_CACHE = refresh_cache
    os.makedirs(FETCH_CACHE_DIR, exist_ok=True)


def format_size(size):
    if size < 1024:
        return f'{size}B'
    if size < 1024 * 1024:
        return f'{size / 1024:.1f}KB'
    return f'{size / (1024 * 1024):.1f}MB'


def remote_url(path):
    return f'{REMOTE_BASE}/{path.lstrip("/")}'


def cache_path_for_url(url):
    name = hashlib.sha256(url.encode('utf-8')).hexdigest()[:32]
    return os.path.join(FETCH_CACHE_DIR, name)


def fetch_remote_bytes(path, label=None, use_cache=True):
    url = path if path.startswith(('http://', 'https://')) else remote_url(path)
    label = label or path
    cache_file = cache_path_for_url(url)
    cache_enabled = USE_FETCH_CACHE and use_cache and not REFRESH_FETCH_CACHE

    if cache_enabled and os.path.exists(cache_file):
        size = os.path.getsize(cache_file)
        print(f'  [cache] {label} ({format_size(size)})')
        with open(cache_file, 'rb') as f:
            return f.read()

    last_error = None
    for attempt in range(1, FETCH_RETRIES + 1):
        try:
            print(f'  [fetch] {label} ...', end='', flush=True)
            request = Request(url, headers={'User-Agent': USER_AGENT})
            with urlopen(request, timeout=FETCH_TIMEOUT) as response:
                data = response.read()
            print(f' {format_size(len(data))}')
            if USE_FETCH_CACHE and use_cache:
                tmp_file = f'{cache_file}.tmp'
                with open(tmp_file, 'wb') as f:
                    f.write(data)
                os.replace(tmp_file, cache_file)
            return data
        except Exception as exc:
            last_error = exc
            print(f' failed ({exc})')
            if attempt < FETCH_RETRIES:
                time.sleep(attempt * 2)

    raise RuntimeError(f'failed to fetch {label} from {url}') from last_error


def fetch_remote_json(path, label=None, use_cache=True):
    data = fetch_remote_bytes(path, label=label, use_cache=use_cache)
    try:
        return json.loads(data)
    except json.JSONDecodeError as exc:
        raise ValueError(f'failed to parse JSON from {label or path}: {exc}') from exc


def load_json(path):
    if path.startswith(('http://', 'https://')):
        return fetch_remote_json(path, label=path, use_cache=True)
    if not os.path.isabs(path):
        return fetch_remote_json(path, label=path, use_cache=True)
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ─── Text table and rich text helpers ────────────────────────────────────────

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


def has_text_reference(value):
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value)
    if isinstance(value, dict):
        return bool(value.get('text')) or bool(value.get('id'))
    return True


def resolve_condition_text(skill_group, field, context, required=False):
    value = skill_group.get(field)
    text = resolve_text(value)
    if has_text_reference(value) and not text:
        data_error(context, f'unresolved {field}')
    if required and not text:
        data_error(context, f'missing {field}')
    return text


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


def combine_description_parts(parts):
    return '\n'.join(part for part in parts if part).strip()


# ─── Blackboard and placeholder evaluation ──────────────────────────────────

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


def evaluate_placeholder_expression(expr, lower_values, context):
    """Evaluate AKEDB numeric placeholders with a small arithmetic-only AST."""

    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant):
            if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
                data_error(context, f'unexpected placeholder literal: {node.value!r}')
            return node.value
        if isinstance(node, ast.Name):
            lower_name = node.id.lower()
            if lower_name not in lower_values:
                data_error(context, f'unknown blackboard variable {node.id!r} in {{{expr}}}')
            return lower_values[lower_name]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = visit(node.operand)
            return value if isinstance(node.op, ast.UAdd) else -value
        if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div)):
            left = visit(node.left)
            right = visit(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            try:
                return left / right
            except ZeroDivisionError as exc:
                data_error(context, f'division by zero in placeholder {{{expr}}}: {exc}')
        data_error(context, f'unexpected placeholder expression node: {type(node).__name__}')

    try:
        tree = ast.parse(expr, mode='eval')
    except SyntaxError as exc:
        data_error(context, f'invalid placeholder expression {{{expr}}}: {exc}')
    return require_number(visit(tree), context, 'placeholder result')


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

        if not re.search(r'[a-zA-Z_][a-zA-Z0-9_]*', expr):
            data_error(context, f'placeholder has no blackboard variable: {{{inner}}}')

        result = evaluate_placeholder_expression(expr, lower_values, context)
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


# ─── Operator locale export ─────────────────────────────────────────────────

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


def condition_id_to_form_key(condition_id, context):
    if not isinstance(condition_id, str) or not condition_id:
        data_error(context, f'unexpected condition id: {condition_id!r}')
    suffix = condition_id.rsplit('_', 1)[-1].lower()
    form_key = FORM_KEY_BY_CONDITION_SUFFIX.get(suffix)
    if not form_key:
        data_error(context, f'unmapped condition id for form text: {condition_id}')
    return form_key


def collect_skill_condition_indexes(skill_group, context):
    indexes = set()
    for field in skill_group:
        if not field.startswith('condition'):
            continue
        match = SKILL_CONDITION_FIELD_RE.fullmatch(field)
        if not match:
            data_error(context, f'unexpected skill condition field: {field}')
        indexes.add(int(match.group(2)))
    return sorted(indexes)


def add_form_label(form_labels, form_key, form_name, context):
    existing = form_labels.get(form_key)
    if existing and existing != form_name:
        data_error(context, f'conflicting form label for {form_key}: {existing!r} vs {form_name!r}')
    form_labels[form_key] = form_name


def build_skill_form_descriptions(skill_group, base_description, values, context):
    forms = {}
    form_labels = {}

    for index in collect_skill_condition_indexes(skill_group, context):
        fields = {
            name: f'condition{name}{index}'
            for name in ['Desc', 'DescInactive', 'Icon', 'Id', 'Name', 'PostDesc']
        }
        if not any(has_text_reference(skill_group.get(field)) for field in fields.values()):
            continue

        condition_id = skill_group.get(fields['Id'])
        if not condition_id:
            data_error(context, f'missing {fields["Id"]}')
        form_key = condition_id_to_form_key(condition_id, context)
        form_name = strip_rich_text_tags(
            resolve_condition_text(skill_group, fields['Name'], context, required=True),
            f'{context} {fields["Name"]}',
        )
        post_desc = resolve_condition_text(skill_group, fields['PostDesc'], context, required=True)

        for desc_field in [fields['Desc'], fields['DescInactive']]:
            resolve_condition_text(skill_group, desc_field, context)

        icon = skill_group.get(fields['Icon'])
        if icon and not isinstance(icon, str):
            data_error(context, f'unexpected {fields["Icon"]} type: {type(icon).__name__}')

        post_context = f'{context} {fields["PostDesc"]}'
        description = normalize_rich_text(
            replace_placeholders(post_desc, values, post_context),
            post_context,
        )
        forms[form_key] = {
            'description': combine_description_parts([base_description, description]),
        }
        add_form_label(form_labels, form_key, form_name, context)

    return forms, form_labels


def export_operators(table_dir, locale='CN', old_slugs=None):
    load_text_table(table_dir, locale)

    char_table = load_json(os.path.join(table_dir, 'CharacterTable.json'))
    pot_table = load_json(os.path.join(table_dir, 'CharacterPotentialTable.json'))
    effect_table = load_json(os.path.join(table_dir, 'PotentialTalentEffectTable.json'))
    grow_table = load_json(os.path.join(table_dir, 'CharGrowthTable.json'))
    skill_patch = load_json(os.path.join(table_dir, 'SkillPatchTable.json'))

    en_text = load_json(os.path.join(table_dir, 'I18nTextTable_EN.json'))

    attr_en_map = ATTR_MAP_EN
    param_type_map = PARAM_TYPE_MAP

    operators = {}

    char_items = [
        (char_id, char_data)
        for char_id, char_data in sorted(char_table.items())
        if char_id.startswith('chr_') and char_id not in EXCLUDED_CHAR_IDS
    ]

    for index, (char_id, char_data) in enumerate(char_items, start=1):
        slug = build_operator_slug(char_id, char_data, en_text, old_slugs)
        print(f'  [{locale}] operator {index}/{len(char_items)}: {slug}')
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
        operator_form_labels = {}
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
            base_description = normalize_rich_text(replace_placeholders(desc, values, desc_context), desc_context)
            form_descriptions, form_labels = build_skill_form_descriptions(
                skill_group,
                base_description,
                values,
                f'{locale} {slug} {key} skill conditions {gid or skill_group.get("skillGroupType")}',
            )
            if not base_description and not form_descriptions:
                data_error(desc_context, 'missing skill description')
            for form_key, form_name in form_labels.items():
                add_form_label(operator_form_labels, form_key, form_name, desc_context)

            skill_entry = {
                'name': strip_rich_text_tags(skill_name, f'{locale} {slug} {key} skill name'),
                'description': base_description,
            }
            if form_descriptions:
                skill_entry['forms'] = form_descriptions
            combat_skills[key] = skill_entry

        operator_entry = {'name': strip_rich_text_tags(name, f'{locale} {slug} operator name')}
        if operator_form_labels:
            operator_entry['forms'] = operator_form_labels
        operator_entry.update({
            'talents': talents,
            'potentials': potentials,
            'combatSkills': combat_skills,
        })
        operators[slug] = operator_entry

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
    """Keep existing operator order and manually maintained fields.

    `subSkills` currently has no AKEDB exporter and is copied as-is. `forms`
    is copied only as a fallback: generated form labels should win when AKEDB
    provides them, otherwise stale old labels could mask updated game data.
    """
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
            if 'forms' in old_data[slug]:
                old_forms = old_data[slug]['forms']
                if not isinstance(old_forms, dict):
                    data_error(f'old locale operator {slug}', f'unexpected forms type: {type(old_forms).__name__}')
                if entry.get('forms'):
                    entry['forms'] = {**old_forms, **entry['forms']}
                else:
                    entry['forms'] = old_forms
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


# ─── CLI entrypoint ─────────────────────────────────────────────────────────

def parse_args(repo_root):
    parser = argparse.ArgumentParser(
        description='Export Endaxis game locale files from the AKEDB CDN.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            'Examples:\n'
            '  python3 scripts/export_game_locales/export_game_locales.py\n'
            '  python3 scripts/export_game_locales/export_game_locales.py --refresh-cache\n'
            '  python3 scripts/export_game_locales/export_game_locales.py --version latest --output /tmp/game-locales\n'
        ),
    )
    parser.add_argument(
        '--output',
        default=os.path.join(repo_root, 'src', 'i18n', 'game-locales'),
        help='Output directory for game locale JSON files. Defaults to src/i18n/game-locales.',
    )
    parser.add_argument(
        '--base-url',
        default=DEFAULT_CDN_BASE,
        help=f'AKEDB data CDN base URL. Defaults to {DEFAULT_CDN_BASE}.',
    )
    parser.add_argument(
        '--version',
        default='latest',
        help='AKEDB manifest version id to export, or latest. Defaults to latest.',
    )
    parser.add_argument(
        '--no-cache',
        action='store_true',
        help='Disable the local download cache for TableCfg files.',
    )
    parser.add_argument(
        '--refresh-cache',
        action='store_true',
        help='Refetch TableCfg files and overwrite existing cached copies.',
    )
    return parser.parse_args()


def select_manifest_version(manifest, version_id):
    versions = manifest.get('versions')
    if not isinstance(versions, list):
        raise ValueError('AKEDB manifest missing versions list')

    selected_id = manifest.get('latest') if version_id == 'latest' else version_id
    for version in versions:
        if version.get('id') == selected_id:
            table_cfg_path = version.get('tableCfgPath')
            if not table_cfg_path:
                raise ValueError(f'AKEDB manifest version {selected_id} missing tableCfgPath')
            return version

    raise ValueError(f'AKEDB manifest version not found: {selected_id}')


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
    default_output_base = os.path.abspath(os.path.join(repo_root, 'src', 'i18n', 'game-locales'))
    args = parse_args(repo_root)

    output_base = os.path.abspath(args.output)
    configure_remote(args.base_url, use_cache=not args.no_cache, refresh_cache=args.refresh_cache)

    print('Loading AKEDB manifest')
    manifest = fetch_remote_json('manifest.json', label='manifest.json', use_cache=False)
    version = select_manifest_version(manifest, args.version)
    table_dir = version['tableCfgPath']
    print(
        'Using AKEDB '
        f'{version.get("id", args.version)} '
        f'(game {version.get("gameVersion", "?")}, hotfix {version.get("hotfixVersion", "?")})'
    )
    print(f'TableCfg: {remote_url(table_dir)}')
    print(f'Output: {output_base}')
    print(f'Previous locale files: {default_output_base}')

    for locale, out_locale in LOCALE_EXPORTS:
        print(f'\nExporting {locale} -> {out_locale}')
        locale_dir = os.path.join(output_base, out_locale)
        os.makedirs(locale_dir, exist_ok=True)

        operators_file = os.path.join(locale_dir, 'operators.json')
        old_operators_file = os.path.join(default_output_base, out_locale, 'operators.json')
        old_data = load_json(old_operators_file)
        old_slugs = set(old_data.keys()) if old_data else None

        operators = export_operators(table_dir, locale=locale, old_slugs=old_slugs)
        operators = merge_old_order_and_subskills(operators, old_data)
        order_combat_skills(operators)
        battle_terms = export_battle_terms(table_dir, locale=locale)

        with open(operators_file, 'w', encoding='utf-8') as f:
            json.dump(operators, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {operators_file} ({len(operators)} operators)')

        battle_terms_file = os.path.join(locale_dir, 'terms.json')
        with open(battle_terms_file, 'w', encoding='utf-8') as f:
            json.dump(battle_terms, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {battle_terms_file} ({len(battle_terms)} terms)')


if __name__ == '__main__':
    main()
