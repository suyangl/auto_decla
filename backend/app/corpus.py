from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path


TOKEN_RE = re.compile(r"[a-zA-ZÀ-ÿ0-9']+")


@dataclass(frozen=True)
class SourceDoc:
    id: str
    title: str
    publisher: str
    url: str
    checked_at: str
    content: str


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_RE.findall(text)]


class LocalCorpus:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.docs = self._load_docs()
        self.doc_tokens = [tokenize(doc.title + " " + doc.content) for doc in self.docs]
        self.avgdl = sum(len(tokens) for tokens in self.doc_tokens) / max(len(self.doc_tokens), 1)
        self.df: dict[str, int] = defaultdict(int)
        for tokens in self.doc_tokens:
            for token in set(tokens):
                self.df[token] += 1

    def _load_docs(self) -> list[SourceDoc]:
        docs: list[SourceDoc] = []
        for filename in ("official_corpus.seed.json", "official_corpus.local.json"):
            path = self.data_dir / filename
            if not path.exists():
                continue
            raw = json.loads(path.read_text(encoding="utf-8"))
            docs.extend(SourceDoc(**item) for item in raw)
        return docs

    def list_sources(self) -> list[dict[str, str]]:
        return [
            {
                "id": doc.id,
                "title": doc.title,
                "publisher": doc.publisher,
                "url": doc.url,
                "checked_at": doc.checked_at,
            }
            for doc in self.docs
        ]

    def search(self, query: str, limit: int = 5) -> list[dict[str, object]]:
        q_tokens = tokenize(query)
        scores: list[tuple[float, int]] = []
        for index, tokens in enumerate(self.doc_tokens):
            score = self._bm25(q_tokens, tokens)
            if score > 0:
                scores.append((score, index))
        scores.sort(reverse=True)
        return [self._hit(index, score, q_tokens) for score, index in scores[:limit]]

    def _bm25(self, q_tokens: list[str], tokens: list[str]) -> float:
        if not q_tokens or not tokens:
            return 0
        counts = Counter(tokens)
        score = 0.0
        k1 = 1.5
        b = 0.75
        n_docs = max(len(self.docs), 1)
        for token in q_tokens:
            tf = counts[token]
            if not tf:
                continue
            idf = math.log(1 + (n_docs - self.df[token] + 0.5) / (self.df[token] + 0.5))
            denom = tf + k1 * (1 - b + b * len(tokens) / max(self.avgdl, 1))
            score += idf * (tf * (k1 + 1)) / denom
        return round(score, 4)

    def _hit(self, index: int, score: float, q_tokens: list[str]) -> dict[str, object]:
        doc = self.docs[index]
        lower = doc.content.lower()
        positions = [lower.find(token) for token in q_tokens if lower.find(token) >= 0]
        start = max(min(positions) - 120, 0) if positions else 0
        excerpt = doc.content[start : start + 420].replace("\n", " ").strip()
        return {
            "id": doc.id,
            "title": doc.title,
            "publisher": doc.publisher,
            "url": doc.url,
            "checked_at": doc.checked_at,
            "score": score,
            "excerpt": excerpt,
        }
