#!/usr/bin/env python3
import json
import os
import re
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


SHOP_URL = "https://hhauto.olx.ba/aktivni"
READER_URL = "https://r.jina.ai/http://hhauto.olx.ba/aktivni"
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


def extract_prices(block):
    price_spans = re.findall(
        r'<span class="([^"]*\bsmaller\b[^"]*)"[^>]*>(.*?)</span>',
        block,
        re.S | re.I,
    )
    regular_price = ""
    original_price = ""
    discounted_price = ""

    for classes, value in price_spans:
        price = clean_text(value)
        class_names = classes.lower().split()
        if not price:
            continue
        if "discounted-price" in class_names:
            discounted_price = price
        elif "discount" in class_names:
            original_price = price
        elif not regular_price:
            regular_price = price

    if discounted_price:
        return discounted_price, original_price
    return regular_price or "Na upit", ""


def fetch_url(url, headers):
    request = Request(
        url,
        headers=headers,
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def fetch_html():
    return fetch_url(
        SHOP_URL,
        {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "bs-BA,hr-HR;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
        },
    )


def fetch_reader_markdown():
    return fetch_url(
        READER_URL,
        {
            "User-Agent": "HHAutoVehicleSync/2.0",
            "Accept": "text/plain",
        },
    )


def parse_listings(html):
    blocks = re.findall(
        r'(<a href="/artikal/\d+" class="rounded-5 wrap.*?</a>)',
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
        price, original_price = extract_prices(block)

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
            "price": price,
            "originalPrice": original_price,
            "updated": extract(r'<div class="text-xs"[^>]*>(.*?)</div>', block),
            "labels": [label for label in labels if label and label.upper() != "PIK SHOP"],
        }

        if vehicle["name"]:
            vehicles.append(vehicle)

    return vehicles


def parse_markdown_listings(markdown):
    listing_pattern = re.compile(
        r'\[(?P<labels>[^\[\]]*?)!\[[^\]]*?: (?P<name>[^\]]+)\]'
        r'\((?P<image>https://d4n0y8dshd77z\.cloudfront\.net/[^)]+)\)\s*'
        r'#\s*(?P<details>.*?)\]\('
        r'(?P<url>https?://hhauto\.olx\.ba/artikal/(?P<id>\d+))\)',
        re.S | re.I,
    )
    price_pattern = re.compile(r'\b\d{1,3}(?:\.\d{3})* KM\b|(?i:\bNa upit\b)')
    vehicles = []

    for match in listing_pattern.finditer(markdown):
        name = clean_text(match.group("name"))
        details = clean_text(match.group("details"))
        if details.startswith(name):
            details = details[len(name):].strip()

        updated_match = re.search(r'\bprije\s+.+$', details, re.I)
        updated = updated_match.group(0) if updated_match else ""
        if updated_match:
            details = details[:updated_match.start()].strip()

        prices = ["Na upit" if price.lower() == "na upit" else price for price in price_pattern.findall(details)]
        price = prices[-1] if prices else "Na upit"
        original_price = prices[-2] if len(prices) > 1 else ""

        condition_match = re.search(r'\b(Polovno|Novo)\b', details, re.I)
        fuel_match = re.search(r'\b(dizel|benzin|elektro|hibrid|plin|LPG)\b', details, re.I)
        km_match = re.search(r'\b\d{1,3}(?:\.\d{3})* km\b', details)
        year_match = re.search(r'\b(?:19|20)\d{2}\b', details)
        labels_text = clean_text(match.group("labels"))
        labels = [
            label
            for label in ("Izdvojeno", "Dostupno odmah")
            if label.lower() in labels_text.lower()
        ]

        vehicles.append(
            {
                "id": match.group("id"),
                "name": name,
                "url": re.sub(r'^http://', 'https://', match.group("url")),
                "image": match.group("image"),
                "condition": condition_match.group(1).capitalize() if condition_match else "Polovno",
                "fuel": fuel_match.group(1).lower() if fuel_match else "",
                "km": km_match.group(0) if km_match else "",
                "year": year_match.group(0) if year_match else "",
                "price": price,
                "originalPrice": original_price,
                "updated": updated,
                "labels": labels,
            }
        )

    return vehicles


def load_vehicles():
    direct_error = None

    if os.environ.get("OLX_FORCE_READER") != "1":
        try:
            vehicles = parse_listings(fetch_html())
            if vehicles:
                print(f"OLX direktni izvor: {len(vehicles)} oglasa.")
                return vehicles
            direct_error = "direktni odgovor nije sadržavao oglase"
        except (HTTPError, URLError, TimeoutError) as error:
            direct_error = str(error)

    if direct_error:
        print(f"Direktni OLX izvor nije dostupan ({direct_error}); koristim reader fallback.")

    vehicles = parse_markdown_listings(fetch_reader_markdown())
    if vehicles:
        print(f"OLX reader fallback: {len(vehicles)} oglasa.")
    return vehicles


def main():
    try:
        vehicles = load_vehicles()
    except (HTTPError, URLError, TimeoutError) as error:
        if OUTPUT_PATH.exists():
            print(f"UPOZORENJE: OLX trenutno nije dostupan ({error}). Zadržavam postojeće podatke.")
            return
        raise SystemExit(f"Ne mogu dohvatiti OLX oglase: {error}") from error

    if not vehicles:
        if OUTPUT_PATH.exists():
            print("UPOZORENJE: nije pronađen nijedan oglas. Zadržavam postojeće podatke.")
            return
        raise SystemExit("Nije pronađen nijedan aktivan OLX oglas.")

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
