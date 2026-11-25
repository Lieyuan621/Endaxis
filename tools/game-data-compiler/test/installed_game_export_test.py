import importlib.util
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest

FILE = Path(__file__).resolve().parents[1] / 'scripts/exportInstalledGame.py'
spec = importlib.util.spec_from_file_location('export_installed', FILE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class InstalledExportTests(unittest.TestCase):
    def fixture(self, root):
        for block in module.BLOCKS:
            directory = root / 'Endfield_Data/StreamingAssets/VFS' / block
            directory.mkdir(parents=True)
            (directory / (block + '.blc')).write_bytes(b'base index')
            (directory / 'data.chk').write_bytes(b'base data')

    def test_persistent_overrides_headers_without_dropping_base_chunks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); game = root / 'game'; self.fixture(game)
            block = module.BLOCKS[0]
            patch = game / 'Endfield_Data/Persistent/VFS' / block; patch.mkdir(parents=True)
            (patch / (block + '.blc')).write_bytes(b'patch index')
            (patch / 'patch.chk').write_bytes(b'patch data')
            files = module.installed_files(game)
            self.assertEqual(files[f'{block}/{block}.blc'].read_bytes(), b'patch index')
            self.assertIn(f'{block}/data.chk', files)
            cache = root / 'cache'; module.copy_vfs(files, cache)
            before = module.index_identity(files)
            (cache / 'VFS' / block / 'data.chk').write_bytes(b'cache edit')
            self.assertEqual(files[f'{block}/data.chk'].read_bytes(), b'base data')
            self.assertEqual(module.index_identity(files), before)

    def test_missing_required_block_is_not_silently_ignored(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'Missing installed VFS block'):
                module.installed_files(Path(directory))

    def test_native_worker_preserves_success_and_failure_exit_codes(self):
        worker = FILE.with_name('akeJsonWorker.py')
        with tempfile.TemporaryDirectory() as directory:
            package = Path(directory) / 'ake_tool/json_host'
            package.mkdir(parents=True)
            (package / 'export_json.py').write_text(
                'def worker(args):\n'
                '    print("worker output", flush=True)\n'
                '    if args == "exception": raise RuntimeError("decode failed")\n'
                '    return int(args)\n'
                'def main(args):\n'
                '    return run_worker_with_stack(args[0])\n',
                encoding='utf-8',
            )
            for argument, expected in [('0', 0), ('7', 7), ('exception', 1)]:
                with self.subTest(argument=argument):
                    result = subprocess.run(
                        [sys.executable, str(worker), directory, argument],
                        capture_output=True, text=True, timeout=15,
                    )
                    self.assertEqual(result.returncode, expected, result.stderr)
                    self.assertIn('worker output', result.stdout)
                    if argument == 'exception':
                        self.assertIn('decode failed', result.stderr)

if __name__ == '__main__': unittest.main()
