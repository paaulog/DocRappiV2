# One-off: create pt-br / en / es trees from current root index + pages/, wire lang switcher.
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "pages"
SRC_INDEX = ROOT / "index.html"

SIDEBAR_INJECT = """            <div class="sidebar__top">
              <div class="docs-lang-switch sidebar__langs" data-docs-lang-switch aria-label="Idioma"></div>
              <button type="button" class="btn btn--theme" data-theme-toggle aria-label="Alternar tema">
"""

SIDEBAR_OLD = """            <div class="sidebar__top">
              <button type="button" class="btn btn--theme" data-theme-toggle aria-label="Alternar tema">
"""

LANDING_INJECT = """        <div class="landing__header-bar">
          <span class="landing__header-spacer" aria-hidden="true"></span>
          <div class="docs-lang-switch docs-lang-switch--landing" data-docs-lang-switch aria-label="Idioma"></div>
          <button type="button" class="btn btn--theme" data-theme-toggle aria-label="Alternar tema">
"""

LANDING_OLD = """        <div class="landing__header-bar">
          <span class="landing__header-spacer" aria-hidden="true"></span>
          <button type="button" class="btn btn--theme" data-theme-toggle aria-label="Alternar tema">
"""


def patch_landing_index(html: str) -> str:
    html = html.replace('href="assets/', 'href="../assets/')
    html = html.replace('src="assets/', 'src="../assets/')
    html = html.replace("<html lang=\"en\"", "<html lang=\"pt-BR\"")
    html = html.replace(LANDING_OLD, LANDING_INJECT, 1)
    html = html.replace(
        '<script src="../assets/js/main.js"></script>',
        '<script defer src="../assets/js/lang-switcher.js"></script>\n    <script src="../assets/js/main.js"></script>',
        1,
    )
    return html


def patch_api_page(html: str) -> str:
    if SIDEBAR_OLD not in html:
        raise ValueError("sidebar pattern not found")
    html = html.replace(SIDEBAR_OLD, SIDEBAR_INJECT, 1)
    html = html.replace('"../assets/', '"../../assets/')
    html = html.replace("'../assets/", "'../../assets/")
    html = html.replace(
        '<script src="../../assets/js/main.js"></script>',
        '<script defer src="../../assets/js/lang-switcher.js"></script>\n    <script src="../../assets/js/main.js"></script>',
        1,
    )
    return html


def write_root_lang_picker():
    html = """<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rappi — Idioma / Language / Idioma</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="assets/css/style.css" />
  </head>
  <body data-page="lang-picker">
    <div class="page-shell page-shell--visible" id="page-shell">
      <main class="lang-picker">
        <img class="landing__logo" src="assets/img/logo.png" alt="Rappi" />
        <h1 class="lang-picker__title">Documentação Open APIs</h1>
        <p class="lead lang-picker__lead">Escolha o idioma da documentação. O conteúdo por enquanto está em português nas três versões.</p>
        <nav class="lang-picker__grid" aria-label="Idioma">
          <a class="api-card lang-picker__card" href="pt-br/index.html">
            <span class="api-card__name">Português (Brasil)</span>
            <span class="api-card__note">pt-BR</span>
          </a>
          <a class="api-card lang-picker__card" href="en/index.html">
            <span class="api-card__name">English</span>
            <span class="api-card__note">en</span>
          </a>
          <a class="api-card lang-picker__card" href="es/index.html">
            <span class="api-card__name">Español</span>
            <span class="api-card__note">es</span>
          </a>
        </nav>
      </main>
    </div>
  </body>
</html>
"""
    (ROOT / "index.html").write_text(html, encoding="utf-8")


def main():
    if not PAGES.is_dir():
        raise SystemExit("missing pages/")

    for loc in ("pt-br", "en", "es"):
        (ROOT / loc / "pages").mkdir(parents=True, exist_ok=True)

    # pt-br landing
    raw = SRC_INDEX.read_text(encoding="utf-8")
    (ROOT / "pt-br" / "index.html").write_text(patch_landing_index(raw), encoding="utf-8")

    # pt-br pages
    for f in PAGES.glob("*.html"):
        src = f.read_text(encoding="utf-8")
        (ROOT / "pt-br" / "pages" / f.name).write_text(patch_api_page(src), encoding="utf-8")

    # clone to en + es (same PT content; html lang tag for route)
    for loc, lang_attr in (("en", "en"), ("es", "es")):
        shutil.copyfile(ROOT / "pt-br" / "index.html", ROOT / loc / "index.html")
        text = (ROOT / loc / "index.html").read_text(encoding="utf-8")
        text = re.sub(r"<html lang=\"pt-BR\"", f'<html lang="{lang_attr}"', text, count=1)
        (ROOT / loc / "index.html").write_text(text, encoding="utf-8")

        for f in (ROOT / "pt-br" / "pages").glob("*.html"):
            dest = ROOT / loc / "pages" / f.name
            shutil.copyfile(f, dest)
            t = dest.read_text(encoding="utf-8")
            t = re.sub(r"<html lang=\"pt-BR\"", f'<html lang="{lang_attr}"', t, count=1)
            dest.write_text(t, encoding="utf-8")

    write_root_lang_picker()

    # remove legacy
    shutil.rmtree(PAGES, ignore_errors=False)
    print("OK: pt-br, en, es created; root index is language picker; removed legacy pages/.")


if __name__ == "__main__":
    main()
