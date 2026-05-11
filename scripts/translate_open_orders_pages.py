"""
One-off: build en/ and es/ open-orders.html from pt-br by translating visible text only.
Preserves tags, IDs, classes, pre/code content, and href/src.
"""
from __future__ import annotations

import re
import time
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString
from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "pt-br" / "pages" / "open-orders.html"

# Post-fixes for common MT glitches (apply to whole file text after translation)
FIXUPS_EN = [
    (r"Bearer\s+credentials", "Bearer credentials"),
    (r"web\s*hook", "webhook"),
    (r"Web\s*hook", "Webhook"),
]
FIXUPS_ES = [
    (r"web\s*hook", "webhook"),
    (r"Web\s*hook", "Webhook"),
]


def skip_text_node(node: NavigableString) -> bool:
    if isinstance(node, Comment):
        return True
    if not str(node).strip():
        return True
    p = node.parent
    while p is not None:
        name = getattr(p, "name", None) or ""
        if name in ("script", "style", "pre", "noscript"):
            return True
        if name == "code":
            return True
        p = getattr(p, "parent", None)
    return False


def collect_strings(soup: BeautifulSoup) -> list[NavigableString]:
    out: list[NavigableString] = []
    for node in soup.find_all(string=True):
        if not isinstance(node, NavigableString):
            continue
        if skip_text_node(node):
            continue
        out.append(node)
    return out


ATTRS = ("aria-label", "placeholder", "alt", "title")


def translate_chunks(texts: list[str], target: str, source: str = "pt") -> list[str]:
    t = GoogleTranslator(source=source, target=target)
    out: list[str] = []
    batch: list[str] = []
    batch_len = 0
    max_chunk = 4500

    def flush():
        nonlocal batch, batch_len
        if not batch:
            return
        joined = "\n<<<SPLIT>>>\n".join(batch)
        try:
            translated = t.translate(joined)
            if translated is None:
                translated = ""
        except Exception as e:
            print("translate error, smaller batches:", e)
            for single in batch:
                time.sleep(0.15)
                tr = t.translate(single)
                out.append(tr if tr is not None and str(tr).strip() else single)
            batch = []
            batch_len = 0
            return
        parts = translated.split("<<<SPLIT>>>")
        if len(parts) != len(batch):
            parts = translated.split("<<< SPLIT >>>")
        if len(parts) != len(batch):
            for single in batch:
                time.sleep(0.15)
                tr = t.translate(single)
                out.append(tr if tr is not None and str(tr).strip() else single)
        else:
            for p in parts:
                p = p.strip()
                out.append(p if p else "")
        batch = []
        batch_len = 0

    for s in texts:
        piece = s.replace("\r\n", "\n")
        if batch_len + len(piece) > max_chunk and batch:
            flush()
        batch.append(piece)
        batch_len += len(piece) + 20
    flush()
    return out


def apply_attr_translations(soup: BeautifulSoup, target: str) -> None:
    t = GoogleTranslator(source="pt", target=target)
    for tag in soup.find_all(True):
        for attr in ATTRS:
            if not tag.has_attr(attr):
                continue
            val = tag.get(attr)
            if not val or not str(val).strip():
                continue
            if attr == "alt" and tag.name == "img" and val.strip() in ("Rappi",):
                continue
            try:
                tr = t.translate(str(val))
                if tr is not None and str(tr).strip():
                    tag[attr] = tr
                time.sleep(0.05)
            except Exception:
                pass


def build(target: str, dest: Path, fixups: list[tuple[str, str]]) -> None:
    raw = SRC.read_text(encoding="utf-8")
    # html.parser avoids lxml mangling <!DOCTYPE html> into a broken root tag.
    soup = BeautifulSoup(raw, "html.parser")

    if target == "en":
        soup.html["lang"] = "en"
    else:
        soup.html["lang"] = "es"

    strings = collect_strings(soup)
    originals = [str(s) for s in strings]
    translated = translate_chunks(originals, target=target)

    if len(translated) != len(strings):
        raise RuntimeError(f"count mismatch: {len(translated)} vs {len(strings)}")

    for node, orig, new in zip(strings, originals, translated):
        safe = new if new is not None and str(new).strip() else orig
        node.replace_with(safe)

    apply_attr_translations(soup, target)

    out = str(soup)
    if soup.html and not str(soup.html).startswith("<html"):
        out = soup.prettify()

    # Use serializer that keeps html5-ish; lxml may add xmlns — strip if present
    out = out.replace(' xmlns="http://www.w3.org/1999/xhtml"', "")
    for pat, rep in fixups:
        out = re.sub(pat, rep, out, flags=re.I)

    dest.write_text(out, encoding="utf-8")
    print("Wrote", dest, "chars", len(out))


def main():
    if not SRC.is_file():
        raise SystemExit("missing " + str(SRC))
    import sys

    if len(sys.argv) > 1:
        lang = sys.argv[1].lower()
        if lang == "es":
            build("es", ROOT / "es" / "pages" / "open-orders.html", FIXUPS_ES)
        elif lang == "en":
            build("en", ROOT / "en" / "pages" / "open-orders.html", FIXUPS_EN)
        else:
            raise SystemExit("usage: translate_open_orders_pages.py [en|es]")
    else:
        build("en", ROOT / "en" / "pages" / "open-orders.html", FIXUPS_EN)
        time.sleep(1.5)
        build("es", ROOT / "es" / "pages" / "open-orders.html", FIXUPS_ES)
    print("OK")


if __name__ == "__main__":
    main()
