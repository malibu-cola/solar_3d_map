"""
JPL SBDB APIから彗星の軌道要素を取得し data/comets.json に保存する。
GitHub Actionsから週次で実行される。
"""

import json
from datetime import datetime

import requests

SBDB_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"

COMETS = [
    {"id": "1P", "name": "ハレー彗星", "name_en": "Halley"},
    {"id": "2P", "name": "エンケ彗星", "name_en": "Encke"},
    {"id": "17P", "name": "ホームズ彗星", "name_en": "Holmes"},
]


def fetch_comet(sstr: str) -> dict | None:
    """SBDB APIで彗星の軌道要素を取得する。"""
    params = {"sstr": sstr, "full-prec": "true"}

    resp = requests.get(SBDB_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    orbit = data.get("orbit", {})
    elements = orbit.get("elements", [])

    elem_dict = {}
    for el in elements:
        elem_dict[el["name"]] = el["value"]

    # epochはelementsの外にある
    epoch_str = orbit.get("epoch", "0")

    # 必要な軌道要素を抽出
    try:
        return {
            "a": float(elem_dict.get("a", 0)),
            "e": float(elem_dict.get("e", 0)),
            "i": float(elem_dict.get("i", 0)),
            "node": float(elem_dict.get("om", 0)),
            "peri": float(elem_dict.get("w", 0)),
            "M": float(elem_dict.get("ma", 0)),
            "epoch": float(epoch_str),
        }
    except (ValueError, TypeError) as exc:
        print(f"  -> Parse error: {exc}")
        return None


def main():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    results = []

    for comet in COMETS:
        print(f"Fetching {comet['name_en']} ({comet['id']})...")
        elements = fetch_comet(comet["id"])

        if elements is None:
            print(f"  -> Failed, skipping")
            continue

        results.append({
            "id": comet["id"],
            "name": comet["name"],
            "name_en": comet["name_en"],
            "elements": elements,
        })

    output = {"date": today, "comets": results}

    with open("data/comets.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved data/comets.json for {today}")


if __name__ == "__main__":
    main()
