from __future__ import annotations

import html
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen


SOURCES = [
    {
        "id": "live-impots-locations-meublees",
        "title": "Les locations meublees",
        "publisher": "impots.gouv.fr",
        "url": "https://www.impots.gouv.fr/particulier/les-locations-meublees",
    },
    {
        "id": "live-service-public-cotisations-meuble",
        "title": "Cotisations sociales pour la mise en location d'un meuble",
        "publisher": "service-public.gouv.fr",
        "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F34102",
    },
    {
        "id": "live-bofip-location-meublee",
        "title": "BOI-BIC-CHAMP-40-20 Location meublee",
        "publisher": "bofip.impots.gouv.fr",
        "url": "https://bofip.impots.gouv.fr/bofip/3610-PGP.html/identifiant=BOI-BIC-CHAMP-40-20",
    },
]


TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": "auto-decla-lmnp-local-corpus/0.1"})
    with urlopen(request, timeout=30) as response:
        raw = response.read()
        encoding = response.headers.get_content_charset() or "utf-8"
    text = raw.decode(encoding, errors="replace")
    text = re.sub(r"(?is)<script.*?</script>|<style.*?</style>", " ", text)
    text = TAG_RE.sub(" ", text)
    return SPACE_RE.sub(" ", html.unescape(text)).strip()


def main() -> int:
    output = Path(__file__).resolve().parents[1] / "data" / "official_corpus.local.json"
    docs = []
    for source in SOURCES:
        print(f"Fetching {source['url']}", file=sys.stderr)
        docs.append(
            {
                **source,
                "checked_at": date.today().isoformat(),
                "content": fetch_text(source["url"]),
            }
        )
    output.write_text(json.dumps(docs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
