"""Post-process en/es open-orders.html after machine translation."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def fix(path: Path) -> None:
    s = path.read_text(encoding="utf-8")
    # Broken DOCTYPE / root from lxml serializer
    s = re.sub(r"^html\s*<html", "<!DOCTYPE html>\n<html", s, flags=re.I)
    s = re.sub(r"^HTML\s*<html", "<!DOCTYPE html>\n<html", s, flags=re.I)
    # Credentials modal must match credentials.js
    s = s.replace('id="field-Webhook"', 'id="field-webhook"')
    s = s.replace('for="field-Webhook"', 'for="field-webhook"')
    s = s.replace('name="WebhookUrl"', 'name="webhookUrl"')
    # Common MT: missing spaces around inline code
    s = re.sub(r"([a-zA-Z0-9)])<code>", r"\1 <code>", s)
    s = re.sub(r"</code>([a-zA-Z(])", r"</code> \1", s)
    # EN-specific garbled phrase
    s = s.replace(
        "<code>status</code> how <code>finished</code>",
        "<code>status</code> as <code>finished</code>",
    )
    s = s.replace(
        "<code>status</code> how <code>finished</code>",
        "<code>status</code> as <code>finished</code>",
    )
    s = s.replace("via Webhook:<code>status</code> how <code>finished</code>", "via Webhook: <code>status</code> as <code>finished</code>")
    s = s.replace(
        "The recommendation remains:<strong>Webhook</strong>how",
        "The recommendation remains: <strong>Webhook</strong> as",
    )
    s = s.replace(
        "recommendation remains:<strong>Webhook</strong>how",
        "recommendation remains: <strong>Webhook</strong> as",
    )
    # ES nav: keep product terms
    s = s.replace(">Apretón de manos<", ">Handshake<")
    s = s.replace(">Pedidos COMPLETOS<", ">Orders FULL<")
    s = s.replace('aria-label="En esta pagina"', 'aria-label="En esta página"')
    path.write_text(s, encoding="utf-8")
    print("fixed", path)


def main():
    fix(ROOT / "en" / "pages" / "open-orders.html")
    fix(ROOT / "es" / "pages" / "open-orders.html")


if __name__ == "__main__":
    main()
