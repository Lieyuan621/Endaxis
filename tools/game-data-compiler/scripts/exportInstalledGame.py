"""Use AKE's readers to export installed-game inputs for rebuildLocalGameData.ts.

The installation is read-only. Persistent VFS files override StreamingAssets;
only independent copies are passed to the readers. Outputs belong to this run.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import queue
import threading
import time


BLOCKS = ('42A8FCA6', '775A31D1', 'D6E622F7', '3C9D9D2D',
          '7064D8E2', '0CE8FA57', '1CDDBF1F')


def export_json(work: Path, output: Path, game: Path, ake: Path) -> None:
    from ake_tool.json_host.export_json import RESULT_PREFIX
    output.mkdir()
    command = [sys.executable, '-u', str(Path(__file__).with_name('akeJsonWorker.py')),
               str(ake.resolve()), '-i', str(work), '-o', str(output),
               '--runtime-root', str(game), '--include-lip-sync',
               '--worker-index', '0', '--worker-count', '1']
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding='utf-8', errors='replace',
        creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        env={**os.environ, 'PYTHONIOENCODING': 'utf-8'},
    )
    lines = queue.Queue()
    def read_lines():
        try:
            for line in process.stdout:
                lines.put(line)
        finally:
            lines.put(None)
    reader = threading.Thread(target=read_lines, daemon=True)
    reader.start()
    started = last_progress = time.monotonic()
    report = None
    try:
        with (output / 'parser.log').open('w', encoding='utf-8') as log:
            while True:
                now = time.monotonic()
                if now - started > 1800 or now - last_progress > 300:
                    raise TimeoutError(f'AKE Json worker timed out: {output / "parser.log"}')
                try:
                    line = lines.get(timeout=0.2)
                except queue.Empty:
                    continue
                if line is None:
                    break
                last_progress = now
                log.write(line)
                log.flush()
                if line.startswith(RESULT_PREFIX):
                    report = json.loads(line[len(RESULT_PREFIX):])
                else:
                    print(line, end='', flush=True)
        code = process.wait(timeout=5)
        if code != 0 or not isinstance(report, dict) or report.get('failed'):
            raise RuntimeError(f'AKE Json worker failed ({code}): {output / "parser.log"}')
        selected = report.get('selected', 0)
        written = sum(row['written'] for row in report['datasets'].values())
        actual = sum(file.is_file() for file in (output / 'data/Json').rglob('*'))
        if selected <= 0 or selected != written or actual != written:
            raise RuntimeError(f'Incomplete AKE Json export: selected={selected}, written={written}, files={actual}')
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        reader.join(timeout=5)
        process.stdout.close()


def installed_files(game: Path) -> dict[str, Path]:
    files: dict[str, Path] = {}
    for directory in ('StreamingAssets', 'Persistent'):
        root = game / 'Endfield_Data' / directory / 'VFS'
        for block in BLOCKS:
            folder = root / block
            if not folder.is_dir():
                continue
            for file in sorted(folder.iterdir()):
                if file.is_file() and file.suffix.lower() in ('.blc', '.chk'):
                    if file.is_symlink():
                        raise ValueError(f'Linked game input is not supported: {file}')
                    files[f'{block}/{file.name}'] = file
    for block in BLOCKS:
        if f'{block}/{block}.blc' not in files:
            raise ValueError(f'Missing installed VFS block: {block}')
    return files


def index_identity(files: dict[str, Path]) -> str:
    digest = hashlib.sha256()
    for name, file in sorted(files.items()):
        if file.suffix.lower() == '.blc':
            digest.update(name.encode())
            digest.update(file.read_bytes())
    return digest.hexdigest()


def copy_vfs(files: dict[str, Path], destination: Path) -> None:
    for index, (name, source) in enumerate(sorted(files.items()), 1):
        target = destination / 'VFS' / name
        if not target.resolve().is_relative_to(destination.resolve()):
            raise ValueError(f'Cache target escapes work directory: {target}')
        target.parent.mkdir(parents=True, exist_ok=True)
        stat = source.stat()
        current = target.stat() if target.exists() else None
        if target.is_symlink():
            raise ValueError(f'Linked cache file is not supported: {target}')
        if current is None or (current.st_size, current.st_mtime_ns) != (stat.st_size, stat.st_mtime_ns):
            temporary = target.with_suffix(target.suffix + '.copying')
            shutil.copy2(source, temporary)
            temporary.replace(target)
        if index == len(files) or index % 25 == 0:
            print(f'VFS: {index}/{len(files)}', flush=True)


def run(args: argparse.Namespace) -> None:
    game, work, output = args.game_root.resolve(), args.work_root.resolve(), args.output.resolve()
    if work == game or game in work.parents or output == game or game in output.parents:
        raise ValueError('Work and output directories must be outside the game installation')
    if output.exists():
        raise ValueError(f'Output already exists: {output}')
    files = installed_files(game)
    identity = index_identity(files)
    output.mkdir(parents=True)
    copy_vfs(files, work)
    sys.path.insert(0, str(args.ake_tool_root.resolve()))
    from ake_tool.tablecfg_parser import PC_KEY
    from ake_tool.unpacker import PythonTableUnpacker
    from ake_tool.models import CancellationToken
    from ake_tool.image_paths import IMAGE_SOURCE_ROOTS, build_image_source_filter

    token = CancellationToken()
    print('AKE: TableCfg', flush=True)
    table_input = output / 'table-input'
    shutil.copytree(work / 'VFS' / BLOCKS[0], table_input / 'VFS' / BLOCKS[0])
    tables = PythonTableUnpacker().unpack(
        table_input, output / 'tables', token,
        lambda event: print(event.message, flush=True),
    ) / 'TableCfg'
    print('AKE: Json', flush=True)
    export_json(work, output / 'json', game, args.ake_tool_root)
    print('AKE: images', flush=True)
    images = output / 'images'
    images.mkdir()
    image_run = output / 'image-run'
    image_run.mkdir()
    extra = [f'assets/beyond/dynamicassets/gameplay/ui/sprites/{name}'
             for name in ('itemicon', 'monstericon', 'attributeicon', 'wiki/groupicon')]
    environment = {
        **os.environ,
        'PYTHONPATH': str(args.ake_tool_root.resolve()),
        'PYTHONIOENCODING': 'utf-8',
        'PERLICA_VFS_KEY_BASE64': base64.b64encode(PC_KEY).decode(),
        'AKE_IMAGE_PARSE_WORKERS': str(args.workers),
        'AKE_IMAGE_BUNDLE_CACHE_GIB': '2',
    }
    subprocess.run([
        sys.executable, '-u', '-m', 'ake_tool.python_image_runner', str(work),
        str(image_run), str(images), build_image_source_filter([*IMAGE_SOURCE_ROOTS, *extra]),
        '-', str(image_run / 'assets.remote.map'), '0',
        '--unity-resources', str(game / 'Endfield_Data/Resources'),
    ], cwd=args.ake_tool_root, env=environment, check=True)
    if index_identity(installed_files(game)) != identity:
        raise ValueError('Game VFS changed during export; retry after the update finishes')
    key = output / 'vfs.key'
    key.write_bytes(PC_KEY)
    config = {
        'version': f'installed-{identity[:16]}', 'python': sys.executable,
        'akeToolRoot': str(args.ake_tool_root.resolve()), 'vfsRoot': str(work),
        'keyFile': str(key), 'jsonRoot': str(output / 'json/data/Json'),
        'tableRoot': str(tables), 'imageRoot': str(images),
        'sourceMode': 'local-only', 'workers': args.workers,
    }
    (output / 'compiler-inputs.json').write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8',
    )


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game-root', type=Path, required=True)
    parser.add_argument('--ake-tool-root', type=Path, required=True)
    parser.add_argument('--work-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--workers', type=int, default=2)
    run(parser.parse_args())
