#!/usr/bin/env python3
import json
import re
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen


SHOP_URL = "https://hhauto.olx.ba/aktivni"
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "fronted" / "data" / "vozila.json"


def clean_text(value):
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    return " ".join(value.split())


def extract(pattern, source, default=""):
    match = re.search(pattern, source, re.S | re.I)
    if not match:
        return default
    return clean_text(match.group(1))


def fetch_html():
    request = Request(
        SHOP_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; HHAutoVehicleSync/1.0)",
            "Accept-Language": "bs-BA,hr-HR;q=0.9,en;q=0.8",
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def parse_listings(html):
    blocks = re.findall(
        r'(<a href="/artikal/\d+" class="rounded-5 wrap.*?</a>)(?=<a href="/artikal/|\s*</div>\s*</div>\s*</div>\s*</div>\s*<div class="w-full flex sm:justify-center)',
        html,
        re.S,
    )

    vehicles = []
    seen = set()

    for block in blocks:
        href = extract(r'<a href="([^"]+)"', block)
        if not href or href in seen:
            continue

        seen.add(href)
        tags = [clean_text(tag) for tag in re.findall(r'<span class="standard-tag"[^>]*>(.*?)</span>', block, re.S)]
        labels = [
            clean_text(label)
            for label in re.findall(r'<div class="highlighted-label[^"]*"[^>]*>(.*?)</div>', block, re.S)
        ]

        vehicle = {
            "id": href.rsplit("/", 1)[-1],
            "name": extract(r'<h1 class="main-heading[^"]*"[^>]*>(.*?)</h1>', block)
            or extract(r'<img[^>]+alt="([^"]+)"', block),
            "url": f"https://hhauto.olx.ba{href}",
            "image": extract(r'<img[^>]+src="([^"]+)"[^>]+class="listing-image-main', block),
            "condition": extract(r'<span class="state"[^>]*>(.*?)</span>', block, "Polovno"),
            "fuel": tags[0] if len(tags) > 0 else "",
            "km": f"{tags[1]} km" if len(tags) > 1 and not tags[1].endswith("km") else (tags[1] if len(tags) > 1 else ""),
            "year": tags[2] if len(tags) > 2 else "",
            "price": extract(r'<span class="smaller"[^>]*>(.*?)</span>', block, "Na upit"),
            "updated": extract(r'<div class="text-xs"[^>]*>(.*?)</div>', block),
            "labels": [label for label in labels if label and label.upper() != "PIK SHOP"],
        }

        if vehicle["name"]:
            vehicles.append(vehicle)

    return vehicles


def main():
    try:
        html = fetch_html()
        vehicles = parse_listings(html)
    except URLError as error:
        raise SystemExit(f"Ne mogu dohvatiti OLX oglase: {error}") from error

    if not vehicles:
        raise SystemExit("Nije pronadjen nijedan aktivan OLX oglas.")

    payload = {
        "source": SHOP_URL,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "count": len(vehicles),
        "vehicles": vehicles,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Upisano {len(vehicles)} aktivnih oglasa u {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
