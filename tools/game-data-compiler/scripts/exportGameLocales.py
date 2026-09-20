"""
Export Endaxis game locale files from AKEDB CDN TableCfg data.

This script intentionally fails fast when AKEDB introduces an unknown rich-text
tag, image asset, placeholder expression, or blackboard shape. Silent data loss
is worse than a failed export: generated locale JSON is used by UI tooltips.

Typical usage:
    python3 tools/game-data-compiler/scripts/exportGameLocales.py
    python3 tools/game-data-compiler/scripts/exportGameLocales.py --refresh-cache
    python3 tools/game-data-compiler/scripts/exportGameLocales.py --output /tmp/game-locales

The unified rebuild uses strict local mode with an explicit TableCfg root,
candidate definition roots, operator manifest, and self-owned enum labels. That
mode never accesses the network or merges a previous locale directory.
"""

import argparse
import ast
import copy
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
LOCALE_EXPORTS = [('CN', 'zh'), ('EN', 'en')]
RICH_TEXT_TAG_RE = re.compile(r'<[^>]*>')
RICH_TEXT_OPEN_TAG_RE = re.compile(r'<([@#])([A-Za-z0-9_.-]+)>')
RICH_TEXT_IMAGE_TAG_RE = re.compile(r'<image="([^"]+)"(?:\s+scale=[0-9.]+)?>')
PLACEHOLDER_RE = re.compile(r'\{([^}]+)\}')
GEAR_ICON_SUIT_RE = re.compile(r'icon:\s*[\'"]/equipment/([^/]+)/')
GEAR_SET_SLUG_RE = re.compile(r'setSlug:\s*[\'"]([^\'"]+)[\'"]')
WEAPON_ICON_ID_RE = re.compile(
    r'icon:\s*[\'"][^\'"]*/(wpn_[A-Za-z0-9]+_[0-9]+)\.[A-Za-z0-9]+[\'"]'
)
GENERATED_STRING_FIELD_RE = re.compile(
    r'\b(?P<field>slug|assetSlug)\s*:\s*[\'\"](?P<value>[^\'\"]+)[\'\"]'
    r'|[\'\"](?P<quoted_field>slug|assetSlug)[\'\"]\s*:\s*[\'\"](?P<quoted_value>[^\'\"]+)[\'\"]'
)
WEAPON_PREFIX_ALIASES = [
    ('wpn_claym_', 'wpn_greatsword_'),
    ('wpn_lance_', 'wpn_polearm_'),
    ('wpn_pistol_', 'wpn_handcannon_'),
    ('wpn_funnel_', 'wpn_artsunit_'),
]
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


def parse_placeholder(inner, context):
    parts = inner.split(':')
    expr = parts[0].strip()
    fmt = parts[1].strip() if len(parts) > 1 else ''
    if len(parts) > 2:
        data_error(context, f'unexpected placeholder syntax: {{{inner}}}')
    if not re.search(r'[a-zA-Z_][a-zA-Z0-9_]*', expr):
        data_error(context, f'placeholder has no blackboard variable: {{{inner}}}')
    return expr, fmt


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
        expr, fmt = parse_placeholder(match.group(1), context)
        result = evaluate_placeholder_expression(expr, lower_values, context)
        return format_placeholder_value(result, fmt, context)

    return PLACEHOLDER_RE.sub(replacer, desc)


def normalize_formatted_placeholder(text):
    value = str(text)
    if value.endswith('%'):
        return f'{normalize_formatted_placeholder(value[:-1])}%'
    return re.sub(r'(\.\d*?)0+$', r'\1', value).rstrip('.')


def json_scalar_from_text(text):
    value = normalize_formatted_placeholder(text)
    try:
        number = float(value)
    except ValueError:
        return value
    if number.is_integer():
        return int(number)
    return number


def lower_value_map(values, context):
    lowered = {}
    for key, value in values.items():
        if not isinstance(key, str) or not key:
            data_error(context, f'unexpected value key: {key!r}')
        lower_key = key.lower()
        if lower_key in lowered and lowered[lower_key] != value:
            data_error(context, f'conflicting case-insensitive blackboard key: {key}')
        lowered[lower_key] = require_number(value, context, key)
    return lowered


def evaluate_placeholder_text(inner, values, context):
    expr, fmt = parse_placeholder(inner, context)
    result = evaluate_placeholder_expression(expr, lower_value_map(values, context), context)
    return normalize_formatted_placeholder(format_placeholder_value(result, fmt, context))


def canonicalize_placeholder_template(text, context):
    def replacer(match):
        expr, fmt = parse_placeholder(match.group(1), context)
        return f'{{{expr}:{fmt}}}'

    return PLACEHOLDER_RE.sub(replacer, text)


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


def export_enemies(table_dir, locale='CN'):
    """Export native display names for selectable eny_* templates only."""
    global TEXT_LOOKUP
    TEXT_LOOKUP = load_text_table(table_dir, locale)
    display_table = load_json(os.path.join(table_dir, 'EnemyTemplateDisplayInfoTable.json'))
    if not isinstance(display_table, dict):
        data_error('EnemyTemplateDisplayInfoTable', 'expected object')
    result = {}
    for game_id in sorted(display_table):
        # tatget_* rows are training targets without EnemyTemplateData assets. They are not
        # selectable enemy definitions and therefore do not share the enemy locale boundary.
        if not game_id.startswith('eny_'):
            continue
        entry = display_table[game_id]
        if not isinstance(entry, dict):
            data_error(f'EnemyTemplateDisplayInfoTable {game_id}', 'expected object')
        if entry.get('templateId') != game_id:
            data_error(f'EnemyTemplateDisplayInfoTable {game_id}', 'templateId mismatch')
        name = resolve_text(entry.get('name'))
        if not name:
            data_error(f'EnemyTemplateDisplayInfoTable {game_id}', 'missing localized name')
        result[game_id] = {'name': name}
    if not result:
        data_error('EnemyTemplateDisplayInfoTable', 'no selectable eny_* templates')
    return result


def export_consumables(table_dir, locale='CN'):
    """Export the active 300-second operator Buff consumables published by Endaxis."""
    load_text_table(table_dir, locale)
    item_table = load_json(os.path.join(table_dir, 'ItemTable.json'))
    use_item_table = load_json(os.path.join(table_dir, 'UseItemTable.json'))
    result = {}
    for item_id, use in sorted(use_item_table.items()):
        if not isinstance(use, dict):
            data_error(f'UseItemTable {item_id}', 'expected object')
        supported = (
            use.get('isPersistentBuff') is True
            and use.get('duration') == 300
            and use.get('effectType') == 2
            and use.get('targetNumType') == 0
            and use.get('uiType') == 3
            and use.get('stackingKey') == 'buff'
        )
        if not supported:
            continue
        item = item_table.get(item_id)
        if not isinstance(item, dict):
            data_error(f'ItemTable {item_id}', 'missing consumable identity')
        name = resolve_text(item.get('name'))
        description = resolve_text(use.get('itemUseDesc')) or resolve_text(item.get('desc'))
        if not name:
            data_error(f'ItemTable {item_id}', 'missing localized name')
        if not description:
            data_error(f'UseItemTable {item_id}', 'missing localized use description')
        values = {}
        unqualified = {}
        conflicts = set()
        for action_index, action in enumerate(use.get('useActions', [])):
            buff = action.get('buffBBData', {})
            buff_id = buff.get('buffId')
            for pair in buff.get('blackboard', []):
                key = pair.get('key')
                value = pair.get('value')
                require_non_empty_string(key, f'UseItemTable {item_id}', 'blackboard key')
                require_number(value, f'UseItemTable {item_id}', key)
                values[f'{buff_id}\\{key}'.lower()] = value
                if key in unqualified and unqualified[key] != value:
                    conflicts.add(key)
                else:
                    unqualified[key] = value
        values.update({key.lower(): value for key, value in unqualified.items() if key not in conflicts})

        def replace_consumable(match):
            expr, fmt = parse_placeholder(match.group(1), f'UseItemTable {item_id}')
            namespaced = re.compile(r'[A-Za-z0-9_]+\\[A-Za-z0-9_]+')
            synthetic = {}
            def replace_name(value_match):
                key = value_match.group(0).lower()
                if key not in values:
                    data_error(f'UseItemTable {item_id}', f'unknown consumable value {key}')
                name = f'v{len(synthetic)}'
                synthetic[name] = values[key]
                return name
            safe_expr = namespaced.sub(replace_name, expr)
            evaluated = evaluate_placeholder_expression(
                safe_expr,
                {**values, **synthetic},
                f'UseItemTable {item_id}',
            )
            return format_placeholder_value(evaluated, fmt, f'UseItemTable {item_id}')

        description = PLACEHOLDER_RE.sub(replace_consumable, description)
        description = strip_rich_text_tags(description, f'UseItemTable {item_id}')
        result[item_id] = {'name': name, 'description': description}
    if not result:
        data_error('UseItemTable', 'no active operator Buff consumables')
    return result


# ─── Operator locale export ─────────────────────────────────────────────────

def build_operator_slug(char_id, char_data, en_text, old_slugs=None, char_slug_map=None):
    if char_slug_map and char_id in char_slug_map:
        return char_slug_map[char_id]
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


def export_operators(table_dir, locale='CN', old_slugs=None, char_slug_map=None, excluded_char_ids=()):
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
        if char_id.startswith('chr_') and char_id not in excluded_char_ids
    ]

    for index, (char_id, char_data) in enumerate(char_items, start=1):
        slug = build_operator_slug(char_id, char_data, en_text, old_slugs, char_slug_map)
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


def build_existing_gear_set_slug_map(repo_root):
    """Map AKEDB suit IDs to Endaxis gear set slugs from existing gear piece sheets."""
    gearpieces_dir = os.path.join(repo_root, 'src', 'data', 'gearpieces')
    suit_slug_map = {}
    if not os.path.isdir(gearpieces_dir):
        return suit_slug_map

    for root, _, files in os.walk(gearpieces_dir):
        for filename in files:
            if not filename.endswith('.ts'):
                continue
            path = os.path.join(root, filename)
            with open(path, 'r', encoding='utf-8') as f:
                source = f.read()
            icon_match = GEAR_ICON_SUIT_RE.search(source)
            slug_match = GEAR_SET_SLUG_RE.search(source)
            if not icon_match or not slug_match:
                continue
            suit_id = f'suit_{icon_match.group(1)}'
            slug = slug_match.group(1)
            existing = suit_slug_map.get(suit_id)
            if existing and existing != slug:
                data_error(
                    f'gear piece slug map {path}',
                    f'conflicting setSlug for {suit_id}: {existing!r} vs {slug!r}',
                )
            suit_slug_map[suit_id] = slug

    return suit_slug_map


def expand_weapon_id_aliases(weapon_id):
    raw = str(weapon_id or '').strip().lower()
    if not raw:
        return []

    aliases = {raw}
    for left, right in WEAPON_PREFIX_ALIASES:
        if raw.startswith(left):
            aliases.add(raw.replace(left, right, 1))
        if raw.startswith(right):
            aliases.add(raw.replace(right, left, 1))
    return sorted(aliases)


def build_existing_weapon_icon_slug_map(repo_root):
    """Map local weapon icon IDs to Endaxis weapon slugs from existing weapon sheets."""
    weapons_dir = os.path.join(repo_root, 'src', 'data', 'weapons')
    icon_slug_map = {}
    if not os.path.isdir(weapons_dir):
        return icon_slug_map

    for root, _, files in os.walk(weapons_dir):
        for filename in files:
            if not filename.endswith('.ts'):
                continue
            path = os.path.join(root, filename)
            with open(path, 'r', encoding='utf-8') as f:
                source = f.read()
            icon_match = WEAPON_ICON_ID_RE.search(source)
            if not icon_match:
                continue
            slug = filename[:-3]
            for icon_id in expand_weapon_id_aliases(icon_match.group(1)):
                existing = icon_slug_map.get(icon_id)
                if existing and existing != slug:
                    data_error(
                        f'weapon slug map {path}',
                        f'conflicting weapon icon slug for {icon_id}: {existing!r} vs {slug!r}',
                    )
                icon_slug_map[icon_id] = slug

    return icon_slug_map


def build_existing_weapon_slug_map(repo_root, item_table=None):
    """Map AKEDB weapon IDs to Endaxis weapon slugs.

    Endaxis sheets store the rendered icon path. Most AKEDB weapon IDs match
    their ItemTable iconId, but a few do not; for example 爆破单元 and 骑士精神
    intentionally swap icon IDs. Resolve local icon IDs through ItemTable first
    so skill descriptions follow the actual weapon row instead of the image ID.
    """
    icon_slug_map = build_existing_weapon_icon_slug_map(repo_root)
    weapon_slug_map = {}

    if isinstance(item_table, dict):
        for item_id, item_data in item_table.items():
            if not isinstance(item_id, str) or not isinstance(item_data, dict):
                continue
            icon_id = item_data.get('iconId')
            matching_slugs = {
                icon_slug_map[alias]
                for alias in expand_weapon_id_aliases(icon_id)
                if alias in icon_slug_map
            }
            if not matching_slugs:
                continue
            if len(matching_slugs) > 1:
                data_error(
                    f'weapon slug map ItemTable {item_id}',
                    f'iconId {icon_id!r} matches multiple Endaxis slugs: {sorted(matching_slugs)!r}',
                )
            weapon_slug_map[item_id] = next(iter(matching_slugs))

    for icon_id, slug in icon_slug_map.items():
        weapon_slug_map.setdefault(icon_id, slug)

    return weapon_slug_map


def read_operator_locale_exclusions(path):
    manifest = load_json(os.path.abspath(path))
    operators = manifest.get('operators') if isinstance(manifest, dict) else None
    if not isinstance(operators, list) or any(not isinstance(entry, dict) for entry in operators):
        data_error(f'operator manifest {path}', 'expected operators to be an object list')
    result = set()
    for entry in operators:
        ids = entry.get('excludedLocaleCharIds', [])
        if not isinstance(ids, list) or any(not isinstance(item, str) or not item for item in ids):
            data_error(f'operator {entry.get("slug")}', 'expected excludedLocaleCharIds to be a string list')
        result.update(ids)
    if result.intersection(entry.get('charId') for entry in operators):
        data_error(f'operator manifest {path}', 'cannot exclude a canonical operator charId')
    return result


def build_operator_slug_map_from_manifest(path):
    manifest = load_json(os.path.abspath(path))
    operators = manifest.get('operators') if isinstance(manifest, dict) else None
    if not isinstance(operators, list):
        data_error(f'operator manifest {path}', 'missing operators list')
    result = {}
    for index, entry in enumerate(operators):
        context = f'operator manifest {path} operators[{index}]'
        if not isinstance(entry, dict):
            data_error(context, f'unexpected entry type: {type(entry).__name__}')
        char_id = entry.get('charId')
        slug = entry.get('slug')
        if not isinstance(char_id, str) or not char_id or not isinstance(slug, str) or not slug:
            data_error(context, 'expected non-empty charId and slug')
        if char_id in result:
            data_error(context, f'duplicate charId: {char_id}')
        result[char_id] = slug
    return result


def read_generated_identity_fields(path):
    with open(path, 'r', encoding='utf-8') as f:
        source = f.read()
    fields = {}
    for match in GENERATED_STRING_FIELD_RE.finditer(source):
        field = match.group('field') or match.group('quoted_field')
        value = match.group('value') or match.group('quoted_value')
        fields.setdefault(field, value)
        if 'slug' in fields and 'assetSlug' in fields:
            break
    return fields


def build_weapon_slug_map_from_generated(root):
    result = {}
    for directory, _, files in os.walk(os.path.abspath(root)):
        for filename in files:
            if not filename.endswith('.generated.ts') or filename == 'index.generated.ts':
                continue
            path = os.path.join(directory, filename)
            fields = read_generated_identity_fields(path)
            slug = fields.get('slug')
            asset_slug = fields.get('assetSlug') or slug
            if not slug or not asset_slug:
                data_error(f'generated weapon {path}', 'missing slug or assetSlug')
            if slug in result and result[slug] != asset_slug:
                data_error(f'generated weapon {path}', f'conflicting identity for {slug}')
            result[slug] = asset_slug
    if not result:
        data_error(f'generated weapon root {root}', 'contains no weapon definitions')
    return result


def build_gear_slug_map_from_generated(root):
    result = {}
    for directory, _, files in os.walk(os.path.abspath(root)):
        for filename in files:
            if not filename.endswith('.generated.ts') or filename == 'index.generated.ts':
                continue
            path = os.path.join(directory, filename)
            fields = read_generated_identity_fields(path)
            slug = fields.get('slug')
            if not slug:
                data_error(f'generated gear {path}', 'missing slug')
            if slug in result:
                data_error(f'generated gear {path}', f'conflicting identity for {slug}')
            # Localization follows the unique definition identity. assetSlug is a visual-resource
            # identity and is intentionally non-unique for several native gear rows.
            result[slug] = slug
    if not result:
        data_error(f'generated gear root {root}', 'contains no gear definitions')
    return result


def build_gear_set_slug_map_from_generated(root):
    result = {}
    for directory, _, files in os.walk(os.path.abspath(root)):
        for filename in files:
            if not filename.endswith('.generated.ts') or filename == 'index.generated.ts':
                continue
            path = os.path.join(directory, filename)
            slug = read_generated_identity_fields(path).get('slug')
            if not slug:
                data_error(f'generated gear set {path}', 'missing slug')
            result[slug] = slug
    if not result:
        data_error(f'generated gear set root {root}', 'contains no gear set definitions')
    return result


def slugify_gear_set_id(suit_id):
    value = str(suit_id or '').removeprefix('suit_')
    value = re.sub(r'[^a-zA-Z0-9]+', '-', value).strip('-').lower()
    return value or str(suit_id or '').strip() or 'unknown-gear-set'


def read_gear_set_name(entry):
    if not isinstance(entry, dict):
        return ''
    for key in ('setName', 'name'):
        value = entry.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ''


def build_old_gear_set_name_map(old_data):
    result = {}
    if not isinstance(old_data, dict):
        return result
    for slug, entry in old_data.items():
        name = read_gear_set_name(entry)
        if name:
            result[name] = slug
    return result


def resolve_gear_set_slug(suit_id, suit_name, suit_slug_map, old_name_map):
    return (
        suit_slug_map.get(suit_id)
        or old_name_map.get(suit_name)
        or slugify_gear_set_id(suit_id)
    )


def resolve_skill_patch_description(skill_patch, skill_id, skill_level, context):
    skill_data = skill_patch.get(skill_id)
    if not isinstance(skill_data, dict):
        data_error(context, f'missing SkillPatchTable entry: {skill_id!r}')
    bundles = skill_data.get('SkillPatchDataBundle')
    if not isinstance(bundles, list):
        data_error(context, f'unexpected SkillPatchDataBundle type: {type(bundles).__name__}')

    selected = [bundle for bundle in bundles if bundle.get('level') == skill_level] if skill_level else bundles
    if not selected:
        data_error(context, f'missing skill level {skill_level} for {skill_id}')

    descriptions = []
    for bundle_index, bundle in enumerate(selected):
        bundle_context = f'{context} bundle[{bundle_index}]'
        if not isinstance(bundle, dict):
            data_error(bundle_context, f'unexpected bundle type: {type(bundle).__name__}')

        desc_ref = bundle.get('description')
        desc = resolve_text(desc_ref)
        if has_text_reference(desc_ref) and not desc:
            data_error(bundle_context, 'unresolved description')
        if not desc:
            continue

        values = {}
        add_blackboard_entries(values, bundle.get('blackboard', []), f'{bundle_context} blackboard')
        descriptions.append(
            normalize_rich_text(
                replace_placeholders(desc, values, f'{bundle_context} description'),
                f'{bundle_context} description',
            )
        )

    return combine_description_parts(descriptions)


def resolve_weapon_skill_text(skill_patch, skill_id, context):
    skill_data = skill_patch.get(skill_id)
    if not isinstance(skill_data, dict):
        data_error(context, f'missing SkillPatchTable entry: {skill_id!r}')
    bundles = skill_data.get('SkillPatchDataBundle')
    if not isinstance(bundles, list) or not bundles:
        data_error(context, f'unexpected SkillPatchDataBundle type: {type(bundles).__name__}')

    sorted_bundles = sorted(bundles, key=lambda bundle: bundle.get('level', 0))
    base_template = None
    base_canonical = None
    placeholder_order = []
    values_by_placeholder = {}
    skill_name = ''

    for bundle_index, bundle in enumerate(sorted_bundles):
        bundle_context = f'{context} bundle[{bundle_index}]'
        if not isinstance(bundle, dict):
            data_error(bundle_context, f'unexpected bundle type: {type(bundle).__name__}')
        level = bundle.get('level')
        if isinstance(level, bool) or not isinstance(level, int) or level <= 0:
            data_error(bundle_context, f'unexpected level: {level!r}')

        if bundle_index == 0:
            skill_name_ref = bundle.get('skillName')
            skill_name = resolve_text(skill_name_ref)
            if has_text_reference(skill_name_ref) and not skill_name:
                data_error(bundle_context, 'unresolved skillName')

        desc_ref = bundle.get('description')
        desc = resolve_text(desc_ref)
        if has_text_reference(desc_ref) and not desc:
            data_error(bundle_context, 'unresolved description')
        if not desc:
            data_error(bundle_context, 'missing description')

        template = normalize_rich_text(desc, f'{bundle_context} description')
        canonical = canonicalize_placeholder_template(template, f'{bundle_context} description')
        if base_canonical is None:
            base_template = template
            base_canonical = canonical
        elif canonical != base_canonical:
            data_error(bundle_context, 'weapon skill description template changed between levels')

        blackboard = {}
        add_blackboard_entries(
            blackboard,
            bundle.get('blackboard', []),
            f'{bundle_context} blackboard',
        )

        bundle_values = {}
        for match in PLACEHOLDER_RE.finditer(template):
            expr, fmt = parse_placeholder(match.group(1), f'{bundle_context} description')
            placeholder = (expr, fmt)
            if placeholder not in placeholder_order:
                placeholder_order.append(placeholder)
            value = evaluate_placeholder_text(
                match.group(1),
                blackboard,
                f'{bundle_context} description',
            )
            existing = bundle_values.get(placeholder)
            if existing is not None and existing != value:
                data_error(
                    bundle_context,
                    f'conflicting value for placeholder {placeholder}: {existing!r} vs {value!r}',
                )
            bundle_values[placeholder] = value

        for placeholder in placeholder_order:
            if placeholder not in bundle_values:
                data_error(bundle_context, f'missing value for placeholder {placeholder}')
            values_by_placeholder.setdefault(placeholder, []).append(bundle_values[placeholder])

    variable_placeholders = [
        placeholder
        for placeholder in placeholder_order
        if len(set(values_by_placeholder.get(placeholder, []))) > 1
    ]
    placeholder_indexes = {placeholder: index for index, placeholder in enumerate(variable_placeholders)}

    def template_replacer(match):
        expr, fmt = parse_placeholder(match.group(1), context)
        placeholder = (expr, fmt)
        values = values_by_placeholder.get(placeholder, [])
        if placeholder not in placeholder_indexes:
            return values[0] if values else ''
        index = placeholder_indexes[placeholder]
        suffix = '%' if values and values[0].endswith('%') else ''
        return f'{{{index}}}{suffix}'

    description = PLACEHOLDER_RE.sub(template_replacer, base_template or '')
    entry = {
        'name': strip_rich_text_tags(skill_name, f'{context} name') or skill_id,
        'description': description,
    }

    if variable_placeholders:
        value_rows = []
        level_count = len(values_by_placeholder[variable_placeholders[0]])
        for level_index in range(level_count):
            row = []
            for placeholder in variable_placeholders:
                value = values_by_placeholder[placeholder][level_index]
                if value.endswith('%'):
                    value = value[:-1]
                row.append(json_scalar_from_text(value))
            value_rows.append(row[0] if len(row) == 1 else row)
        entry['values'] = value_rows

    return entry


def merge_weapon_skill_text(old_skill, generated_skill):
    merged = copy.deepcopy(old_skill) if isinstance(old_skill, dict) else {}
    if not merged.get('name') and generated_skill.get('name'):
        merged['name'] = generated_skill['name']
    if generated_skill.get('description'):
        merged['description'] = generated_skill['description']
    if 'values' in generated_skill:
        merged['values'] = generated_skill['values']
    elif 'values' in merged:
        merged.pop('values')
    return merged


def export_weapons(table_dir, locale='CN', weapon_slug_map=None, old_data=None):
    """Merge AKEDB weapon skill descriptions into the existing weapon locale file."""
    load_text_table(table_dir, locale)

    weapon_slug_map = weapon_slug_map or {}
    old_data = old_data if isinstance(old_data, dict) else {}
    weapon_table = load_json(os.path.join(table_dir, 'WeaponBasicTable.json'))
    item_table = load_json(os.path.join(table_dir, 'ItemTable.json'))
    skill_patch = load_json(os.path.join(table_dir, 'SkillPatchTable.json'))

    generated = {}
    weapon_items = [
        (weapon_id, weapon_data)
        for weapon_id, weapon_data in sorted(weapon_table.items())
        if weapon_id in weapon_slug_map
    ]

    for index, (weapon_id, weapon_data) in enumerate(weapon_items, start=1):
        slug = weapon_slug_map[weapon_id]
        print(f'  [{locale}] weapon {index}/{len(weapon_items)}: {slug}')
        context = f'{locale} weapon {weapon_id}'
        if not isinstance(weapon_data, dict):
            data_error(context, f'unexpected WeaponBasicTable row type: {type(weapon_data).__name__}')

        skill_ids = weapon_data.get('weaponSkillList')
        if not isinstance(skill_ids, list) or len(skill_ids) not in (2, 3):
            data_error(context, f'unexpected weaponSkillList: {skill_ids!r}')
        skill_keys = ['skill1', 'skill3'] if len(skill_ids) == 2 else ['skill1', 'skill2', 'skill3']

        item = item_table.get(weapon_id, {})
        weapon_name = resolve_text(item.get('name')) or resolve_text(weapon_data.get('engName')) or slug
        entry = {
            'name': strip_rich_text_tags(weapon_name, f'{context} name'),
        }

        for skill_key, skill_id in zip(skill_keys, skill_ids):
            if not isinstance(skill_id, str) or not skill_id:
                data_error(context, f'unexpected skill id for {skill_key}: {skill_id!r}')
            entry[skill_key] = resolve_weapon_skill_text(
                skill_patch,
                skill_id,
                f'{context} {skill_key} {skill_id}',
            )

        if slug in generated:
            data_error(context, f'duplicate Endaxis weapon slug: {slug}')
        generated[slug] = entry

    ordered = {}
    for slug, old_entry in old_data.items():
        if slug not in generated:
            ordered[slug] = old_entry
            continue
        generated_entry = generated[slug]
        merged = copy.deepcopy(old_entry) if isinstance(old_entry, dict) else {}
        if not merged.get('name'):
            merged['name'] = generated_entry.get('name') or slug
        for skill_key in ['skill1', 'skill2', 'skill3']:
            if skill_key in generated_entry:
                merged[skill_key] = merge_weapon_skill_text(
                    merged.get(skill_key),
                    generated_entry[skill_key],
                )
        ordered[slug] = merged

    for slug, generated_entry in generated.items():
        if slug in ordered:
            continue
        ordered[slug] = generated_entry

    return ordered


def export_gearsets(table_dir, locale='CN', suit_slug_map=None, old_data=None):
    """Export localized gear set names and active set bonus descriptions."""
    load_text_table(table_dir, locale)

    suit_slug_map = suit_slug_map or {}
    old_name_map = build_old_gear_set_name_map(old_data)
    suit_table = load_json(os.path.join(table_dir, 'EquipSuitTable.json'))
    skill_patch = load_json(os.path.join(table_dir, 'SkillPatchTable.json'))

    gearsets = {}
    for suit_id, suit_data in sorted(suit_table.items()):
        context = f'{locale} gear set {suit_id}'
        if not isinstance(suit_data, dict):
            data_error(context, f'unexpected EquipSuitTable row type: {type(suit_data).__name__}')
        entries = suit_data.get('list', [])
        if not isinstance(entries, list):
            data_error(context, f'unexpected list type: {type(entries).__name__}')
        if not entries:
            continue

        first_entry = entries[0]
        if not isinstance(first_entry, dict):
            data_error(context, f'unexpected list[0] type: {type(first_entry).__name__}')
        suit_name = resolve_text(first_entry.get('suitName')) or suit_id
        slug = resolve_gear_set_slug(suit_id, suit_name, suit_slug_map, old_name_map)

        if len(entries) != 1:
            data_error(context, f'unexpected gear set bonus count: {len(entries)}')

        entry_context = f'{context} list[0]'
        entry = entries[0]
        if not isinstance(entry, dict):
            data_error(entry_context, f'unexpected entry type: {type(entry).__name__}')
        equip_count = entry.get('equipCnt')
        if equip_count != 3:
            data_error(entry_context, f'unexpected equipCnt: {equip_count!r}')
        skill_id = entry.get('skillID')
        if not isinstance(skill_id, str) or not skill_id:
            data_error(entry_context, f'unexpected skillID: {skill_id!r}')
        skill_level = entry.get('skillLv')
        if isinstance(skill_level, bool) or not isinstance(skill_level, int):
            data_error(entry_context, f'unexpected skillLv: {skill_level!r}')

        description = resolve_skill_patch_description(
            skill_patch,
            skill_id,
            skill_level,
            f'{entry_context} {skill_id}',
        )
        if not description:
            data_error(entry_context, 'missing gear set description')

        if slug in gearsets:
            data_error(context, f'duplicate Endaxis gear set slug: {slug}')
        gearsets[slug] = {
            'setName': strip_rich_text_tags(suit_name, f'{context} name'),
            'description': description,
        }

    ordered = {}
    if isinstance(old_data, dict):
        for slug in old_data:
            if slug in gearsets:
                ordered[slug] = gearsets[slug]
            elif slug == 'no-set-bonuses':
                ordered[slug] = old_data[slug]

    for slug, data in gearsets.items():
        if slug not in ordered:
            ordered[slug] = data

    return ordered


def export_gearpieces(table_dir, locale, gear_slug_map, enum_terms):
    """Export only localized presentation fields; numeric traits stay in GearDefinition."""
    load_text_table(table_dir, locale)
    item_table = load_json(os.path.join(table_dir, 'ItemTable.json'))
    equip_table = load_json(os.path.join(table_dir, 'EquipTable.json'))
    suit_table = load_json(os.path.join(table_dir, 'EquipSuitTable.json'))
    slot_labels = enum_terms.get('slotType') if isinstance(enum_terms, dict) else None
    if not isinstance(slot_labels, dict):
        data_error(f'{locale} enum terms', 'missing slotType labels')
    part_types = {0: 'armor', 1: 'gloves', 2: 'accessory'}
    result = {}
    for gear_id, asset_slug in sorted(gear_slug_map.items()):
        context = f'{locale} gear piece {gear_id}'
        item = item_table.get(gear_id)
        equip = equip_table.get(gear_id)
        if not isinstance(item, dict) or not isinstance(equip, dict):
            data_error(context, 'missing ItemTable or EquipTable row')
        name = resolve_text(item.get('name'))
        if not name:
            data_error(context, 'missing localized item name')
        slot_key = part_types.get(equip.get('partType'))
        if slot_key is None:
            data_error(context, f'unexpected partType: {equip.get("partType")!r}')
        suit_id = equip.get('suitID')
        set_name = ''
        if isinstance(suit_id, str) and suit_id:
            suit = suit_table.get(suit_id)
            entries = suit.get('list') if isinstance(suit, dict) else None
            if isinstance(entries, list) and entries and isinstance(entries[0], dict):
                set_name = resolve_text(entries[0].get('suitName'))
        entry = {
            'name': strip_rich_text_tags(name, f'{context} name'),
            'slotType': slot_labels.get(slot_key) or slot_key,
            'setName': strip_rich_text_tags(set_name, f'{context} set name') if set_name else '',
        }
        base = equip.get('displayBaseAttrModifier')
        if isinstance(base, dict) and isinstance(base.get('attrValue'), (int, float)):
            entry['defense'] = base['attrValue']
        if asset_slug in result:
            data_error(context, f'duplicate assetSlug: {asset_slug}')
        result[asset_slug] = entry
    return result


def merge_old_order_and_forms(operators, old_data):
    """Keep existing operator order and form-label compatibility only.

    Generic variant names such as enhanced basic/battle/combo skills belong to
    the shared `skillType` messages, so `subSkills` is deliberately not copied
    from an old operator locale. `forms` is copied only as a fallback: generated
    form labels should win when AKEDB provides them.
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
            '  python3 tools/game-data-compiler/scripts/exportGameLocales.py\n'
            '  python3 tools/game-data-compiler/scripts/exportGameLocales.py --refresh-cache\n'
            '  python3 tools/game-data-compiler/scripts/exportGameLocales.py --version latest --output /tmp/game-locales\n'
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
        '--table-root',
        help='Absolute local TableCfg-current directory. Disables manifest/table downloads.',
    )
    parser.add_argument(
        '--operator-manifest',
        help='Operator compiler manifest used as the charId -> slug authority in local mode.',
    )
    parser.add_argument(
        '--weapon-definition-root',
        help='Candidate generated-weapons directory used as the weapon -> assetSlug authority.',
    )
    parser.add_argument(
        '--gear-set-definition-root',
        help='Candidate generated-gear-sets directory used as the suit ID -> slug authority.',
    )
    parser.add_argument(
        '--gear-definition-root',
        help='Candidate generated gear directory used as the gear ID -> assetSlug authority.',
    )
    parser.add_argument(
        '--ui-locale-root',
        help='Directory containing zh-CN.json and en.json with project-owned enumTerms.',
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
    parser.add_argument(
        '--icon-source-manifest',
        help=(
            'Optional JSON output that maps emitted public icon paths back to their '
            'native Unity sprite paths. Used by the referenced-asset export pipeline.'
        ),
    )
    parser.add_argument(
        '--icon-source-manifest-only',
        action='store_true',
        help='Write --icon-source-manifest without downloading or rewriting locale files.',
    )
    return parser.parse_args()


def write_icon_source_manifest(output_path):
    icon_source_manifest = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(icon_source_manifest), exist_ok=True)
    source_by_public_path = {}
    for native_path, public_path in ENDAXIS_ICON_PATH_MAP.items():
        source_by_public_path.setdefault(public_path, []).append(native_path)
    source_by_public_path = {
        public_path: sorted(set(native_paths))
        for public_path, native_paths in source_by_public_path.items()
    }
    with open(icon_source_manifest, 'w', encoding='utf-8') as f:
        json.dump(source_by_public_path, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write('\n')
    print(
        f'  [write] {icon_source_manifest} '
        f'({len(source_by_public_path)} rich text icon sources)'
    )


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
    repo_root = os.path.abspath(os.path.join(script_dir, '..', '..', '..'))
    default_output_base = os.path.abspath(os.path.join(repo_root, 'src', 'i18n', 'game-locales'))
    args = parse_args(repo_root)

    if args.icon_source_manifest_only:
        if not args.icon_source_manifest:
            raise ValueError('--icon-source-manifest-only requires --icon-source-manifest')
        write_icon_source_manifest(args.icon_source_manifest)
        return

    output_base = os.path.abspath(args.output)
    excluded_char_ids = read_operator_locale_exclusions(
        args.operator_manifest or os.path.join(repo_root, 'tools/game-data-compiler/config/operators.json')
    )
    local_mode = args.table_root is not None
    if local_mode:
        required = {
            '--operator-manifest': args.operator_manifest,
            '--weapon-definition-root': args.weapon_definition_root,
            '--gear-set-definition-root': args.gear_set_definition_root,
            '--gear-definition-root': args.gear_definition_root,
            '--ui-locale-root': args.ui_locale_root,
        }
        missing = [flag for flag, value in required.items() if not value]
        if missing:
            raise ValueError(f'--table-root requires {", ".join(missing)}')
        table_dir = os.path.abspath(args.table_root)
        if not os.path.isdir(table_dir):
            raise ValueError(f'--table-root is not a directory: {table_dir}')
        char_slug_map = build_operator_slug_map_from_manifest(args.operator_manifest)
        weapon_slug_map = build_weapon_slug_map_from_generated(args.weapon_definition_root)
        gear_set_slug_map = build_gear_set_slug_map_from_generated(args.gear_set_definition_root)
        gear_slug_map = build_gear_slug_map_from_generated(args.gear_definition_root)
        print('Using fixed local candidate inputs; network and previous locale merge are disabled')
        print(f'TableCfg: {table_dir}')
    else:
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
        char_slug_map = None
        gear_set_slug_map = build_existing_gear_set_slug_map(repo_root)
        item_table = load_json(os.path.join(table_dir, 'ItemTable.json'))
        weapon_slug_map = build_existing_weapon_slug_map(repo_root, item_table)
        gear_slug_map = None
    print(f'Output: {output_base}')
    print(f'Previous locale merge: {"disabled" if local_mode else default_output_base}')
    print(f'Gear set slug map: {len(gear_set_slug_map)} identities')
    print(f'Weapon slug map: {len(weapon_slug_map)} identities')
    if gear_slug_map is not None:
        print(f'Gear slug map: {len(gear_slug_map)} identities')

    for locale, out_locale in LOCALE_EXPORTS:
        print(f'\nExporting {locale} -> {out_locale}')
        locale_dir = os.path.join(output_base, out_locale)
        os.makedirs(locale_dir, exist_ok=True)

        operators_file = os.path.join(locale_dir, 'operators.json')
        old_operators_file = os.path.join(default_output_base, out_locale, 'operators.json')
        old_data = {} if local_mode else load_json(old_operators_file)
        old_slugs = set(old_data.keys()) if old_data else None
        weapons_file = os.path.join(locale_dir, 'weapons.json')
        old_weapons_file = os.path.join(default_output_base, out_locale, 'weapons.json')
        old_weapons = {} if local_mode else load_json(old_weapons_file)
        gearsets_file = os.path.join(locale_dir, 'gearsets.json')
        enemies_file = os.path.join(locale_dir, 'enemies.json')
        consumables_file = os.path.join(locale_dir, 'consumables.json')
        old_gearsets_file = os.path.join(default_output_base, out_locale, 'gearsets.json')
        old_gearsets = {} if local_mode else load_json(old_gearsets_file)
        ui_locale_root = os.path.abspath(
            args.ui_locale_root or os.path.join(repo_root, 'src', 'i18n', 'locales')
        )
        ui_locale = load_json(os.path.join(ui_locale_root, 'zh-CN.json' if out_locale == 'zh' else 'en.json'))
        enum_terms = ui_locale.get('enumTerms') if isinstance(ui_locale, dict) else None
        if not isinstance(enum_terms, dict):
            data_error(f'{out_locale} UI locale', 'missing enumTerms')

        operators = export_operators(
            table_dir,
            locale=locale,
            old_slugs=old_slugs,
            char_slug_map=char_slug_map,
            excluded_char_ids=excluded_char_ids,
        )
        operators = merge_old_order_and_forms(operators, old_data)
        order_combat_skills(operators)
        battle_terms = export_battle_terms(table_dir, locale=locale)
        weapons = export_weapons(
            table_dir,
            locale=locale,
            weapon_slug_map=weapon_slug_map,
            old_data=old_weapons,
        )
        gearsets = export_gearsets(
            table_dir,
            locale=locale,
            suit_slug_map=gear_set_slug_map,
            old_data=old_gearsets,
        )
        gearpieces = (
            export_gearpieces(table_dir, locale, gear_slug_map, enum_terms)
            if local_mode
            else load_json(os.path.join(default_output_base, out_locale, 'gearpieces.json'))
        )
        enemies = export_enemies(table_dir, locale=locale)
        consumables = export_consumables(table_dir, locale=locale)

        with open(operators_file, 'w', encoding='utf-8') as f:
            json.dump(operators, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {operators_file} ({len(operators)} operators)')

        battle_terms_file = os.path.join(locale_dir, 'terms.json')
        with open(battle_terms_file, 'w', encoding='utf-8') as f:
            json.dump(battle_terms, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {battle_terms_file} ({len(battle_terms)} terms)')

        with open(weapons_file, 'w', encoding='utf-8') as f:
            json.dump(weapons, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {weapons_file} ({len(weapons)} weapons)')

        with open(gearsets_file, 'w', encoding='utf-8') as f:
            json.dump(gearsets, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {gearsets_file} ({len(gearsets)} gear sets)')

        gearpieces_file = os.path.join(locale_dir, 'gearpieces.json')
        with open(gearpieces_file, 'w', encoding='utf-8') as f:
            json.dump(gearpieces, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {gearpieces_file} ({len(gearpieces)} gear pieces)')

        with open(enemies_file, 'w', encoding='utf-8') as f:
            json.dump(enemies, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {enemies_file} ({len(enemies)} enemies)')

        with open(consumables_file, 'w', encoding='utf-8') as f:
            json.dump(consumables, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  [write] {consumables_file} ({len(consumables)} consumables)')

    if args.icon_source_manifest:
        write_icon_source_manifest(args.icon_source_manifest)


if __name__ == '__main__':
    main()
