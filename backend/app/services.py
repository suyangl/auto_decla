from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class LocalServices:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.services = self._load_services()

    def _load_services(self) -> list[dict[str, Any]]:
        path = self.data_dir / "services.seed.json"
        if not path.exists():
            return []
        return json.loads(path.read_text(encoding="utf-8"))

    def list_services(self) -> list[dict[str, Any]]:
        return self.services

    def get_service(self, service_id: str) -> dict[str, Any] | None:
        return next((item for item in self.services if item["id"] == service_id), None)
