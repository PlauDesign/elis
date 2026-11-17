"""Tests for i18n/build.py, the generator of en.html and es.html."""
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'i18n'))
import build  # noqa: E402

SOURCE = (ROOT / 'dist' / 'index.html').read_text(encoding='utf-8')
STORY = (ROOT / 'dist' / 'historia.html').read_text(encoding='utf-8')


class TranslateTest(unittest.TestCase):
    def test_translates_text_and_attributes(self):
        html, missing = build.translate('<html><head><title>Fechar</title></head><body><a aria-label="Idioma">PT</a></body></html>', 'en')
        self.assertIn('<title>Close</title>', html)
        self.assertIn('aria-label="Language"', html)
        self.assertEqual(missing, [])

    def test_reports_text_without_translation(self):
        _, missing = build.translate('<html><head></head><body><p>Um texto novo sem tradução</p></body></html>', 'es')
        self.assertEqual(missing, ['Um texto novo sem tradução'])

    def test_keeps_names_and_codes_without_warning(self):
        _, missing = build.translate('<html><head></head><body><p>Mariângela Estelita Barros</p><kbd>q</kbd><p>2.004</p></body></html>', 'en')
        self.assertEqual(missing, [])


class RenderTest(unittest.TestCase):
    def test_every_page_text_has_a_translation(self):
        for lang in build.LANGS:
            with self.subTest(lang=lang):
                _, missing = build.render(SOURCE, lang)
                self.assertEqual(missing, [])

    def test_marks_language_url_and_current_button(self):
        html, _ = build.render(SOURCE, 'en')
        self.assertIn('<html lang="en"', html)
        self.assertIn('content="https://elis-libras.com.br/en.html"', html)
        self.assertIn('aria-current="page">EN</a>', html)
        self.assertNotIn('aria-current="page">PT</a>', html)

    def test_video_captions_follow_the_page_language(self):
        self.assertIn('cc_lang_pref=pt-BR&amp;hl=pt-BR', SOURCE)
        for lang in build.LANGS:
            with self.subTest(lang=lang):
                html, _ = build.render(SOURCE, lang)
                self.assertIn(f'cc_lang_pref={lang}&amp;hl={lang}', html)
                self.assertNotIn('cc_lang_pref=pt-BR', html)

    def test_committed_pages_are_up_to_date(self):
        for lang, cfg in build.LANGS.items():
            with self.subTest(file=cfg['file']):
                html, _ = build.render(SOURCE, lang)
                committed = (ROOT / 'dist' / cfg['file']).read_text(encoding='utf-8')
                self.assertEqual(committed, html, f'Rode python3 i18n/build.py para atualizar {cfg["file"]}')


class StoryTest(unittest.TestCase):
    def test_every_story_text_has_a_translation(self):
        for lang in build.LANGS:
            with self.subTest(lang=lang):
                _, missing = build.render(STORY, lang, 'historia.html')
                self.assertEqual(missing, [])

    def test_story_marks_language_and_url(self):
        html, _ = build.render(STORY, 'es', 'historia.html')
        self.assertIn('<html lang="es"', html)
        self.assertIn('content="https://elis-libras.com.br/historia-es.html"', html)
        self.assertIn('aria-current="page">ES</a>', html)
        self.assertNotIn('aria-current="page">PT</a>', html)

    def test_links_between_guide_and_story_stay_in_the_same_language(self):
        guide, _ = build.render(SOURCE, 'en')
        self.assertIn('href="historia-en.html"', guide)
        story, _ = build.render(STORY, 'en', 'historia.html')
        self.assertIn('class="brand" href="en.html"', story)
        # The language switch keeps pointing to each language.
        self.assertIn('href="historia.html" aria-label="PT, Português" hreflang="pt-BR"', story)

    def test_committed_story_pages_are_up_to_date(self):
        for lang, file in build.PAGES['historia.html'].items():
            with self.subTest(file=file):
                html, _ = build.render(STORY, lang, 'historia.html')
                committed = (ROOT / 'dist' / file).read_text(encoding='utf-8')
                self.assertEqual(committed, html, 'Rode python3 i18n/build.py')


if __name__ == '__main__':
    unittest.main()
