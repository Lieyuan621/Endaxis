#!/usr/bin/env python3
"""Generate Endaxis enemy sheets and missing avatars from the AKEDB CDN."""

from __future__ import annotations

import argparse
import http.client
import io
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


DEFAULT_CDN_BASE = "https://data.akedata.wiki"
DEFAULT_LEVELS = (1, 20, 40, 60, 80, 90)
CONFIG_FORMAT = "EndaxisEnemyGenerationConfig"
CONFIG_VERSION = 1
OUTPUT_NEWLINE = "\r\n"
DISPLAY_TYPE_TO_TIER = {
    0: "normal",
    1: "elite",
    2: "leader",
    3: "advanced",
    4: "boss",
}


class GenerationError(RuntimeError):
    pass


def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise GenerationError(f"JSON contains duplicate key: {key}")
        result[key] = value
    return result


def download(url: str, attempts: int = 3) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Endaxis enemy generator"})
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except (OSError, urllib.error.HTTPError, http.client.HTTPException) as error:
            if attempt == attempts:
                raise GenerationError(f"failed to download {url}: {error}") from error
            time.sleep(attempt)
    raise AssertionError("unreachable")


def load_remote_json(url: str) -> Any:
    try:
        return json.loads(download(url), object_pairs_hook=reject_duplicate_keys)
    except json.JSONDecodeError as error:
        raise GenerationError(f"invalid JSON from {url}: {error}") from error


def load_local_json(path: Path) -> Any:
    try:
        return json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=reject_duplicate_keys,
        )
    except (OSError, json.JSONDecodeError) as error:
        raise GenerationError(f"failed to read {path}: {error}") from error


def select_version(manifest: dict[str, Any], requested: str | None) -> dict[str, Any]:
    version_id = requested or manifest.get("latest")
    matches = [row for row in manifest.get("versions", []) if row.get("id") == version_id]
    if len(matches) != 1:
        raise GenerationError(f"expected exactly one AKEDB version {version_id!r}, found {len(matches)}")
    version = matches[0]
    if not version.get("tableCfgPath"):
        raise GenerationError(f"AKEDB version {version_id!r} has no tableCfgPath")
    return version


def require_exact_keys(value: dict[str, Any], expected: set[str], context: str) -> None:
    actual = set(value)
    if actual != expected:
        raise GenerationError(
            f"{context}: expected keys {sorted(expected)}, got {sorted(actual)}"
        )


def require_number(row: dict[str, Any], key: str, context: str) -> float | int:
    value = row.get(key)
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise GenerationError(f"{context}: {key} is not numeric: {value!r}")
    return value


def load_config(path: Path) -> tuple[float | int, list[dict[str, str]]]:
    config = load_local_json(path)
    if not isinstance(config, dict):
        raise GenerationError(f"{path}: root must be an object")
    require_exact_keys(config, {"format", "version", "defaults", "enemies"}, str(path))
    if config["format"] != CONFIG_FORMAT or config["version"] != CONFIG_VERSION:
        raise GenerationError(
            f"{path}: expected {CONFIG_FORMAT} version {CONFIG_VERSION}"
        )

    defaults = config["defaults"]
    if not isinstance(defaults, dict):
        raise GenerationError(f"{path}: defaults must be an object")
    require_exact_keys(defaults, {"staggerNodeDuration"}, f"{path}: defaults")
    stagger_node_duration = require_number(
        defaults,
        "staggerNodeDuration",
        f"{path}: defaults",
    )

    entries = config["enemies"]
    if not isinstance(entries, list) or not entries:
        raise GenerationError(f"{path}: enemies must be a non-empty array")
    seen_ids: set[str] = set()
    parsed: list[dict[str, str]] = []
    for index, entry in enumerate(entries):
        context = f"{path}: enemies[{index}]"
        if not isinstance(entry, dict):
            raise GenerationError(f"{context} must be an object")
        require_exact_keys(entry, {"gameId", "category"}, context)
        game_id = entry["gameId"]
        category = entry["category"]
        if not isinstance(game_id, str) or not game_id.startswith("eny_"):
            raise GenerationError(f"{context}: invalid gameId {game_id!r}")
        if not isinstance(category, str) or not category.strip():
            raise GenerationError(f"{context}: category must be a non-empty string")
        if game_id in seen_ids:
            raise GenerationError(f"{context}: duplicate gameId {game_id}")
        seen_ids.add(game_id)
        parsed.append({"gameId": game_id, "category": category})
    return stagger_node_duration, parsed


def unique_attr(attrs: list[dict[str, Any]], attr_type: int, context: str) -> float | int:
    values = [row.get("attrValue") for row in attrs if row.get("attrType") == attr_type]
    if len(values) != 1:
        raise GenerationError(
            f"{context}: expected exactly one attrType {attr_type}, found {len(values)}"
        )
    value = values[0]
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise GenerationError(f"{context}: attrType {attr_type} is not numeric: {value!r}")
    return value


def level_attributes(row: dict[str, Any], enemy_id: str) -> dict[int, dict[int, float | int]]:
    result: dict[int, dict[int, float | int]] = {}
    for index, level_row in enumerate(row.get("levelDependentAttributes", [])):
        attrs = level_row.get("attrs")
        if not isinstance(attrs, list):
            raise GenerationError(f"{enemy_id}: level row {index} has no attrs list")
        level = unique_attr(attrs, 0, f"{enemy_id} level row {index}")
        if not isinstance(level, int) or level in result:
            raise GenerationError(f"{enemy_id}: invalid or duplicate level {level!r}")
        values: dict[int, float | int] = {}
        for attr in attrs:
            attr_type = attr.get("attrType")
            if not isinstance(attr_type, int) or attr_type in values:
                raise GenerationError(
                    f"{enemy_id} level {level}: duplicate/invalid attrType {attr_type!r}"
                )
            values[attr_type] = require_number(attr, "attrValue", f"{enemy_id} level {level}")
        result[level] = values
    return result


def localized_text(ref: Any, text_map: dict[str, Any], context: str) -> str:
    if not isinstance(ref, dict) or set(ref) != {"id", "text"}:
        raise GenerationError(f"{context}: expected an i18n text reference")
    text_id = ref["id"]
    text = ref["text"] or text_map.get(str(text_id))
    if not isinstance(text, str) or not text:
        raise GenerationError(f"{context}: missing localized text for id {text_id}")
    return text


def format_number(value: float | int) -> str:
    if isinstance(value, int) or float(value).is_integer():
        return str(int(value))
    return format(float(value), ".15g")


def quote_ts(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def render_sheet(
    entry: dict[str, str],
    display: dict[str, Any],
    attributes: dict[str, Any],
    text_map: dict[str, Any],
    stagger_node_duration: float | int,
) -> str:
    enemy_id = entry["gameId"]
    levels = level_attributes(attributes, enemy_id)
    missing_levels = [level for level in DEFAULT_LEVELS if level not in levels]
    if missing_levels:
        raise GenerationError(f"{enemy_id}: missing required levels {missing_levels}")

    defenses = {levels[level].get(3) for level in levels}
    if None in defenses or len(defenses) != 1:
        raise GenerationError(f"{enemy_id}: defense varies by level or is missing: {defenses}")

    independent = attributes.get("levelIndependentAttributes", {}).get("attrs")
    if not isinstance(independent, list):
        raise GenerationError(f"{enemy_id}: missing levelIndependentAttributes.attrs")
    poise_nodes = attributes.get("poiseKnotPctList")
    poise_buffs = attributes.get("poiseKnotBuffList")
    if not isinstance(poise_nodes, list) or not isinstance(poise_buffs, list):
        raise GenerationError(f"{enemy_id}: poise knot fields must be lists")
    if poise_nodes and len(poise_nodes) != len(poise_buffs):
        raise GenerationError(f"{enemy_id}: poise node and buff counts differ")
    if not poise_nodes and len(poise_buffs) > 1:
        raise GenerationError(f"{enemy_id}: unexpected buffs without poise nodes: {poise_buffs!r}")
    if any(not isinstance(value, (int, float)) or not 0 < value < 1 for value in poise_nodes):
        raise GenerationError(f"{enemy_id}: invalid poise node thresholds {poise_nodes!r}")

    display_type = display.get("displayType")
    tier = DISPLAY_TYPE_TO_TIER.get(display_type)
    if tier is None:
        raise GenerationError(f"{enemy_id}: unknown displayType {display_type!r}")
    name = localized_text(display.get("name"), text_map, f"{enemy_id}: name")
    slug = enemy_id.replace("_", "-")
    hp_lines = "\n".join(
        f"    {level}: {format_number(levels[level][1])}," for level in DEFAULT_LEVELS
    )

    return f"""import type {{ EnemySheet }} from '../types';

const sheet: EnemySheet = {{
  name: {quote_ts(name)},
  gameId: {quote_ts(enemy_id)},
  avatar: '/Icon_Enemy/{enemy_id}.webp',
  category: {quote_ts(entry['category'])},
  tier: '{tier}',
  levelHp: {{
{hp_lines}
  }},
  def: {format_number(next(iter(defenses)))},
  resistance: {{
    physical: {format_number(require_number(attributes, 'physicalResistance', enemy_id))},
    heat: {format_number(require_number(attributes, 'fireResistance', enemy_id))},
    cryo: {format_number(require_number(attributes, 'crystResistance', enemy_id))},
    electric: {format_number(require_number(attributes, 'pulseResistance', enemy_id))},
    nature: {format_number(require_number(attributes, 'naturalResistance', enemy_id))},
  }},
  superArmor: {format_number(require_number(attributes, 'initialSuperArmor', enemy_id))},
  maxStagger: {format_number(unique_attr(independent, 20, enemy_id))},
  staggerNodeCount: {len(poise_nodes)},
  staggerNodeDuration: {format_number(stagger_node_duration)},
  staggerBreakDuration: {format_number(unique_attr(independent, 21, enemy_id))},
  finisherRecovery: {format_number(require_number(attributes, 'breakingAttackedAtbObtain', enemy_id))},
  finisherMultiplier: {format_number(unique_attr(independent, 27, enemy_id))},
}};

export default sheet;
"""


def ensure_avatar(cdn_base: str, game_id: str, avatar_dir: Path, check: bool) -> bool:
    output = avatar_dir / f"{game_id}.webp"
    if output.is_file():
        return False
    if check:
        raise GenerationError(f"missing generated avatar: {output}")

    try:
        from PIL import Image
    except ImportError as error:
        raise GenerationError("Pillow is required to convert enemy avatars to WebP") from error

    url = (
        f"{cdn_base}/public/images/assets/beyond/dynamicassets/gameplay/ui/"
        f"sprites/monstericonbig/{game_id}.png"
    )
    source = download(url)
    try:
        with Image.open(io.BytesIO(source)) as image:
            image.load()
            converted = image.convert("RGBA")
            avatar_dir.mkdir(parents=True, exist_ok=True)
            converted.save(output, format="WEBP", quality=90, method=6)
    except (OSError, ValueError) as error:
        raise GenerationError(f"failed to convert avatar {url}: {error}") from error
    print(f"avatar: {game_id} -> {output}")
    return True


def generate(
    enemy_dir: Path,
    avatar_dir: Path,
    config_entries: list[dict[str, str]],
    stagger_node_duration: float | int,
    display_table: dict[str, Any],
    attribute_table: dict[str, Any],
    text_map: dict[str, Any],
    cdn_base: str,
    check: bool,
) -> tuple[int, int, int]:
    expected_paths = {
        enemy_dir / f"{entry['gameId'].replace('_', '-')}.ts" for entry in config_entries
    }
    actual_paths = set(enemy_dir.glob("*.ts")) if enemy_dir.exists() else set()
    extra_paths = sorted(actual_paths - expected_paths)
    if extra_paths:
        raise GenerationError(
            "enemy directory contains files not selected by config: "
            + ", ".join(path.name for path in extra_paths)
        )

    changed = 0
    avatars = 0
    enemy_dir.mkdir(parents=True, exist_ok=True)
    for index, entry in enumerate(config_entries, 1):
        enemy_id = entry["gameId"]
        display = display_table.get(enemy_id)
        attributes = attribute_table.get(enemy_id)
        if not isinstance(display, dict):
            raise GenerationError(f"{enemy_id}: missing from EnemyTemplateDisplayInfoTable")
        if not isinstance(attributes, dict):
            raise GenerationError(f"{enemy_id}: missing from EnemyAttributeTemplateTable")
        if display.get("templateId") != enemy_id or attributes.get("templateId") != enemy_id:
            raise GenerationError(f"{enemy_id}: source table key/templateId mismatch")

        rendered = render_sheet(
            entry,
            display,
            attributes,
            text_map,
            stagger_node_duration,
        ).replace("\n", OUTPUT_NEWLINE)
        path = enemy_dir / f"{enemy_id.replace('_', '-')}.ts"
        current = path.read_bytes().decode("utf-8") if path.exists() else None
        if current != rendered:
            changed += 1
            if not check:
                path.write_text(rendered, encoding="utf-8", newline="")
        avatars += int(ensure_avatar(cdn_base, enemy_id, avatar_dir, check))
        if index % 10 == 0 or index == len(config_entries):
            print(f"progress: {index}/{len(config_entries)} enemies")

    if check and changed:
        raise GenerationError(f"{changed} generated enemy sheet(s) are out of date")
    return len(config_entries), changed, avatars


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    project_dir = script_dir.parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cdn-base", default=DEFAULT_CDN_BASE)
    parser.add_argument("--version", help="AKEDB manifest version id; defaults to latest")
    parser.add_argument("--config", type=Path, default=script_dir / "enemies.json")
    parser.add_argument("--enemy-dir", type=Path, default=project_dir / "src" / "data" / "enemies")
    parser.add_argument("--avatar-dir", type=Path, default=project_dir / "public" / "Icon_Enemy")
    parser.add_argument("--check", action="store_true", help="fail instead of writing stale files")
    args = parser.parse_args()

    try:
        cdn_base = args.cdn_base.rstrip("/")
        stagger_node_duration, entries = load_config(args.config.resolve())
        manifest = load_remote_json(f"{cdn_base}/manifest.json")
        version = select_version(manifest, args.version)
        table_base = f"{cdn_base}/{version['tableCfgPath'].strip('/')}"
        print(f"source: {version['id']} ({table_base})")
        print("loading EnemyTemplateDisplayInfoTable...")
        display_table = load_remote_json(f"{table_base}/EnemyTemplateDisplayInfoTable.json")
        print("loading EnemyAttributeTemplateTable...")
        attribute_table = load_remote_json(f"{table_base}/EnemyAttributeTemplateTable.json")
        print("loading I18nTextTable_EN...")
        text_map = load_remote_json(f"{table_base}/I18nTextTable_EN.json")
        if not all(isinstance(value, dict) for value in (display_table, attribute_table, text_map)):
            raise GenerationError("AKEDB source table roots must be objects")

        count, changed, avatars = generate(
            args.enemy_dir.resolve(),
            args.avatar_dir.resolve(),
            entries,
            stagger_node_duration,
            display_table,
            attribute_table,
            text_map,
            cdn_base,
            args.check,
        )
        print(
            f"validated {count} configured enemies; {changed} sheet(s) "
            f"{'out of date' if args.check else 'updated'}; {avatars} avatar(s) generated"
        )
        return 0
    except GenerationError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
