"""
Horizons APIから惑星の位置データ(XYZ座標)を取得し data/planets.json に保存する。
GitHub Actionsから日次で実行される。
"""

import json
import re
from datetime import datetime, timedelta

import requests

HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"

BODIES = [
    {"id": "10",  "name": "太陽",   "name_en": "Sun"},
    {"id": "199", "name": "水星",   "name_en": "Mercury"},
    {"id": "299", "name": "金星",   "name_en": "Venus"},
    {"id": "399", "name": "地球",   "name_en": "Earth"},
    {"id": "499", "name": "火星",   "name_en": "Mars"},
    {"id": "599", "name": "木星",   "name_en": "Jupiter"},
    {"id": "699", "name": "土星",   "name_en": "Saturn"},
    {"id": "799", "name": "天王星", "name_en": "Uranus"},
    {"id": "899", "name": "海王星", "name_en": "Neptune"},
]


def fetch_position(body_id: str, date_str: str) -> dict | None:
    """Horizons APIで指定天体の太陽中心XYZ座標(AU)を取得する。"""
    start = date_str
    stop_date = (datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "format": "json",
        "COMMAND": f"'{body_id}'",
        "OBJ_DATA": "NO",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "CENTER": "'500@10'",
        "START_TIME": f"'{start}'",
        "STOP_TIME": f"'{stop_date}'",
        "STEP_SIZE": "'1 d'",
        "OUT_UNITS": "'AU-D'",
    }

    resp = requests.get(HORIZONS_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    result_text = data.get("result", "")
    # $$SOE ... $$EOE の間にデータがある
    match = re.search(r"\$\$SOE(.*?)\$\$EOE", result_text, re.DOTALL)
    if not match:
        print(f"Warning: No ephemeris data for body {body_id}")
        return None

    block = match.group(1).strip()
    # X = ... Y = ... Z = ... を一括で抽出（複数行にまたがる場合も対応）
    parts = re.findall(r"[XYZ]\s*=\s*([Ee\d.+-]+)", block)
    if len(parts) >= 3:
        return {
            "x": float(parts[0]),
            "y": float(parts[1]),
            "z": float(parts[2]),
        }
    return None


def main():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    results = []

    for body in BODIES:
        print(f"Fetching {body['name_en']} ({body['id']})...")
        if body["id"] == "10":
            # 太陽は中心なので常に原点
            pos = {"x": 0, "y": 0, "z": 0}
        else:
            pos = fetch_position(body["id"], today)

        if pos is None:
            print(f"  -> Failed, using fallback (0,0,0)")
            pos = {"x": 0, "y": 0, "z": 0}

        results.append({
            "id": body["id"],
            "name": body["name"],
            "name_en": body["name_en"],
            **pos,
        })

    output = {"date": today, "bodies": results}

    with open("data/planets.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved data/planets.json for {today}")


if __name__ == "__main__":
    main()
