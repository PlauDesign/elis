"""Tests for what the public repository may and may not contain."""
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def tracked():
    return subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.splitlines()


class RepositoryContentsTest(unittest.TestCase):
    def test_only_elis_font_files_are_tracked(self):
        # Odisseia and Compasso are commercial Plau typefaces: the site uses them, the repository must not carry them.
        fonts = [p for p in tracked() if p.lower().endswith(('.woff', '.woff2', '.ttf', '.otf'))]
        self.assertTrue(fonts)
        self.assertEqual([p for p in fonts if not pathlib.PurePath(p).name.startswith('ELiS')], [])

    def test_commercial_fonts_are_ignored_by_git(self):
        for name in ('Compasso.woff2', 'Compasso-Italic.woff2', 'Odisseia.woff2', 'Odisseia-Italic.woff2'):
            with self.subTest(name=name):
                result = subprocess.run(['git', 'check-ignore', '-q', f'dist/fonts/{name}'], cwd=ROOT)
                self.assertEqual(result.returncode, 0)

    def test_license_at_the_root_matches_the_one_in_the_download(self):
        self.assertEqual((ROOT / 'OFL.txt').read_text(encoding='utf-8'), (ROOT / 'dist' / 'downloads' / 'OFL.txt').read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
