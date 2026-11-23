"""Generate the English and Spanish pages from the Portuguese ones in dist/.

dist/index.html (the guide) -> en.html, es.html
dist/historia.html (the story of ELiS) -> historia-en.html, historia-es.html

Run after any change to a Portuguese page:  python3 i18n/build.py
Page texts come from i18n/strings.json (Portuguese text -> translation).
Texts created by the scripts live in dist/i18n.js.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
STRINGS = json.loads((ROOT / 'i18n' / 'strings.json').read_text(encoding='utf-8'))
LANGS = {
    'en': {'html': 'en', 'locale': 'en_US', 'file': 'en.html'},
    'es': {'html': 'es', 'locale': 'es_LA', 'file': 'es.html'},
}
# Portuguese source page -> generated page per language.
PAGES = {
    'index.html': {lang: cfg['file'] for lang, cfg in LANGS.items()},
    'historia.html': {'en': 'historia-en.html', 'es': 'historia-es.html'},
}
SITE = 'https://elis-libras.com.br/'
# Links between pages of the site, without hreflang (the language switch keeps its own links).
LINK_TAG = re.compile(r'<a [^>]*>')
LOCAL_HREF = re.compile(r'href="(\./|historia\.html)(#[^"]*)?"')
# Text that stays the same in every language: names, codes, keys and ELiS samples.
KEEP = re.compile(r'^\s*([\d\s./·:–-]*|[^A-Za-zÀ-ÿ]*|.{0,3})\s*$')
# Proper names, product names, file names and codes are the same in every language.
KEEP_TEXTS = {
    'ELiS: do básico ao acabamento',
    'ELiS', 'Mariângela Estelita Barros', '64 px', 'qgçQà', 'tgçQÄ', 'Regular · ELiS', 'Windows', 'Ctrl + V',
    'Windows/Mac:', '.ttf', '.woff2', 'Site', 'MAC / macOS', 'PC / WINDOWS', 'Jornal UFG',
    'Um texto escrito em Libras/ELiS', 'Libras_ELiS.pdf', 'Teclas detalhadas beta.pdf', 'Compasso', 'Odisseia',
    'SIL Open Font License 1.1', 'Plau', 'Rodrigo Saiani', 'Aline Caruso', 'Noo Works', 'André Quelhas / Bárbara Abbês',
    'Marcio Sal', 'William Dimas', 'Valter Vinícius Costa', 'Rainer Erich Scheichelbauer (Glyphs)', 'Mariângela Estelita Barros (UFG)', 'João Muri / Camila Inácio', 'Mayara Gomes', 'Analu Rodrigues', 'Kathlyn Giaccomini', 'Etc Filmes',
    'pro bono', 'Unicode', 'SignWriting', 'GitHub', '0,5×',
}


def translate(html, lang):
    missing = []

    def text(match):
        value = match.group(1)
        if value in STRINGS:
            return '>' + STRINGS[value][lang] + '<'
        if not KEEP.match(value) and value not in KEEP_TEXTS:
            missing.append(value)
        return match.group(0)

    def attr(match):
        name, value = match.group(1), match.group(2)
        if value in STRINGS:
            return f'{name}="{STRINGS[value][lang]}"'
        return match.group(0)

    head, body = html.split('<body', 1)
    head = re.sub(r'>([^<]+)<', text, head)
    body = re.sub(r'>([^<]+)<', text, body)
    html = head + '<body' + body
    html = re.sub(r'\b(alt|title|aria-label|placeholder|content)="([^"]*)"', attr, html)
    return html, missing


def render(source, lang, page='index.html'):
    """Return the translated page for one language and the texts left without translation."""
    cfg = LANGS[lang]
    html, missing = translate(source, lang)
    html = html.replace('<html lang="pt-BR"', f'<html lang="{cfg["html"]}"', 1)
    url = '' if page == 'index.html' else page
    html = html.replace(f'<meta property="og:url" content="{SITE}{url}">', f'<meta property="og:url" content="{SITE}{PAGES[page][lang]}">', 1)
    targets = {'./': PAGES['index.html'][lang], 'historia.html': PAGES['historia.html'][lang]}

    def localize(tag):
        if 'hreflang=' in tag.group(0):
            return tag.group(0)
        return LOCAL_HREF.sub(lambda m: f'href="{targets[m.group(1)]}{m.group(2) or ""}"', tag.group(0))

    html = LINK_TAG.sub(localize, html)
    html = html.replace('<meta property="og:locale" content="pt_BR">', f'<meta property="og:locale" content="{cfg["locale"]}">', 1)
    # Video captions open in the page language.
    html = html.replace('cc_lang_pref=pt-BR&amp;hl=pt-BR', f'cc_lang_pref={lang}&amp;hl={lang}', 1)
    html = html.replace(' aria-current="page">PT</a>', '>PT</a>', 1)
    html = html.replace(f'hreflang="{lang}" lang="{lang}">', f'hreflang="{lang}" lang="{lang}" aria-current="page">', 1)
    return html, list(dict.fromkeys(missing))


def build(check=False):
    """Write en.html and es.html. With check=True, only report whether they are up to date."""
    sources = {page: (DIST / page).read_text(encoding='utf-8') for page in PAGES}
    problems = 0
    for page, files in PAGES.items():
        for lang, file in files.items():
            html, missing = render(sources[page], lang, page)
            target = DIST / file
            if check:
                if not target.exists() or target.read_text(encoding='utf-8') != html:
                    print(f'{file} está desatualizado: rode python3 i18n/build.py')
                    problems += 1
            else:
                target.write_text(html, encoding='utf-8')
            for value in missing:
                print(f'[{page} {lang}] sem tradução: {value!r}')
                problems += 1
    for key in STRINGS:
        if not any(key in source for source in sources.values()):
            print(f'aviso: texto não encontrado na página: {key[:60]!r}')
    return problems


if __name__ == '__main__':
    sys.exit(1 if build(check='--check' in sys.argv) else 0)
