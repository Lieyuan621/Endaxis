"""对象本地化排除项来自配置，不能在导出器内固定角色身份。"""
import json
from pathlib import Path
import runpy
import tempfile
import unittest

EXPORTER = runpy.run_path(str(Path(__file__).parents[1] / 'scripts' / 'exportGameLocales.py'))


class OperatorLocaleExclusionsTest(unittest.TestCase):
    def read(self, operators):
        with tempfile.TemporaryDirectory() as directory:
            manifest = Path(directory) / 'operators.json'
            manifest.write_text(json.dumps({'operators': operators}), encoding='utf-8')
            return EXPORTER['read_operator_locale_exclusions'](str(manifest))

    def test_exclusions_belong_to_the_configured_operator(self):
        self.assertEqual(self.read([
            {'slug': 'sample', 'charId': 'chr_main', 'excludedLocaleCharIds': ['chr_alternate']},
            {'slug': 'another', 'charId': 'chr_another'},
        ]), {'chr_alternate'})
        self.assertEqual(self.read([{'slug': 'sample', 'charId': 'chr_main'}]), set())

    def test_cannot_exclude_a_canonical_operator(self):
        with self.assertRaisesRegex(ValueError, 'canonical operator'):
            self.read([{'slug': 'sample', 'charId': 'chr_main', 'excludedLocaleCharIds': ['chr_main']}])

    def test_rejects_malformed_ids(self):
        with self.assertRaisesRegex(ValueError, 'string list'):
            self.read([{'slug': 'sample', 'excludedLocaleCharIds': [1]}])


if __name__ == '__main__':
    unittest.main()
