#!/usr/bin/env python3
"""Export corpus frontmatter to machine-readable dist/podcasts.{json,csv}.

Usage:
  python3 scripts/export.py          # write dist/podcasts.json + .csv
  python3 scripts/export.py --check  # exit 1 if files are stale
"""
import csv
import io
import json
import os
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from corpus import ROOT, ensure_under_root, load_corpus, safe_write  # noqa: E402

DIST_DIR = os.path.join(ROOT, "dist")
JSON_PATH = os.path.join(DIST_DIR, "podcasts.json")
CSV_PATH = os.path.join(DIST_DIR, "podcasts.csv")


def entry_dict(e):
    d = dict(e.data)
    d["_path"] = e.relpath
    d["_deep"] = e.is_deep
    return d


def build_payload(entries):
    as_of = max(str(e.get("updated_date", "1970-01-01")) for e in entries)
    return {
        "generated_at": as_of,
        "counts": {
            "total": len(entries),
            "zh": sum(1 for e in entries if e.get("language") == "zh"),
            "en": sum(1 for e in entries if e.get("language") == "en"),
            "deep": sum(1 for e in entries if e.is_deep),
            "stub": sum(1 for e in entries if e.is_stub),
        },
        "entries": sorted((entry_dict(e) for e in entries),
                          key=lambda d: (d.get("language", ""), d.get("category", ""),
                                         d.get("title", ""))),
    }


def flatten(d):
    def join(field):
        v = d.get(field)
        if isinstance(v, list):
            return " / ".join(str(x) for x in v)
        return "" if v is None else str(v)

    return {
        "slug": d.get("slug"),
        "title": d.get("title"),
        "language": d.get("language"),
        "category": d.get("category"),
        "status": d.get("status"),
        "deep": d.get("_deep"),
        "network": d.get("network", ""),
        "hosts": join("hosts"),
        "platforms": join("platforms"),
        "added_date": d.get("added_date"),
        "updated_date": d.get("updated_date"),
        "tags": join("tags"),
        "path": d.get("_path"),
    }


CSV_FIELDS = ["slug", "title", "language", "category", "status", "deep",
              "network", "hosts", "platforms", "added_date", "updated_date",
              "tags", "path"]


def main():
    check_only = "--check" in sys.argv
    entries, parse_errors = load_corpus()
    if parse_errors:
        print("\n".join(parse_errors))
        return 1

    payload = build_payload(entries)
    # YAML parses unquoted dates into datetime.date; serialize them as ISO strings.
    json_text = json.dumps(payload, ensure_ascii=False, indent=2, default=str) + "\n"
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_FIELDS, lineterminator="\n")
    writer.writeheader()
    for d in payload["entries"]:
        writer.writerow(flatten(d))
    csv_text = buf.getvalue()

    outputs = {JSON_PATH: json_text, CSV_PATH: csv_text}
    os.makedirs(DIST_DIR, exist_ok=True)
    stale = []
    for path, text in outputs.items():
        ensure_under_root(path)
        if check_only:
            if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
                stale.append(os.path.relpath(path, ROOT))
        else:
            safe_write(path, text)
            print(f"wrote {os.path.relpath(path, ROOT)} "
                  f"({len(payload['entries'])} entries)")
    if check_only:
        if stale:
            print("STALE (run scripts/export.py to refresh): " + ", ".join(stale))
            return 1
        print("exports fresh")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
