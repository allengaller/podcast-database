#!/usr/bin/env python3
"""Validate corpus entries under podcasts/{zh,en}/.

Checks (fail):
  - frontmatter parses as YAML and required fields exist
  - slug == filename stem; language/category == parent directories
  - status in {active, ended, hiatus, todo}
  - added_date/updated_date are valid ISO dates, updated >= added
  - deep entries (status != todo) must have non-empty network/hosts/platforms/tags
  - no duplicate slugs, no duplicate-title files, no "name 2.md" accident files
Warnings (informational): deep entries with rss/subscribe_links left as TODO.

Usage: python3 scripts/validate_corpus.py [--quiet]
Exit code 1 when any check fails.
"""
import datetime
import re
import sys
from collections import defaultdict

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from corpus import STATUSES, load_corpus  # noqa: E402

REQUIRED_ALL = ("title", "slug", "language", "category", "status",
                "added_date", "updated_date", "tags")
REQUIRED_DEEP = ("network", "hosts", "platforms")
DUP_NAME_RE = re.compile(r"\s\d+$")  # e.g. "the-tim-ferriss-show 2"


def iso_date_ok(value):
    if not isinstance(value, (str, datetime.date)):
        return False
    try:
        datetime.date.fromisoformat(str(value))
        return True
    except ValueError:
        return False


def main():
    quiet = "--quiet" in sys.argv
    entries, parse_errors = load_corpus()

    fails, warns = [], []
    for err in parse_errors:
        fails.append(err)

    by_slug = defaultdict(list)
    by_title = defaultdict(list)

    for e in entries:
        where = e.relpath

        def fail(msg):
            fails.append(f"{where}: {msg}")

        def warn(msg):
            warns.append(f"{where}: {msg}")

        for field in REQUIRED_ALL:
            if e.get(field) in (None, "", []):
                fail(f"missing required field '{field}'")

        title = e.get("title")
        if isinstance(title, str):
            by_title[title.strip()].append(where)
        by_slug[e.get("slug")].append(where)

        if e.stem != str(e.get("slug", "")):
            fail(f"slug '{e.get('slug')}' != filename stem '{e.stem}'")
        if DUP_NAME_RE.search(e.stem):
            fail(f"filename looks like a duplicate-copy artifact ('{e.stem}.md')")

        if e.lang_dir and e.get("language") != e.lang_dir:
            fail(f"language '{e.get('language')}' != directory '{e.lang_dir}'")
        if e.cat_dir and e.get("category") != e.cat_dir:
            fail(f"category '{e.get('category')}' != directory '{e.cat_dir}'")

        if e.status not in STATUSES:
            fail(f"status '{e.status}' not in {STATUSES}")

        for key in ("added_date", "updated_date"):
            if not iso_date_ok(e.get(key)):
                fail(f"'{key}' is not an ISO date: {e.get(key)!r}")
        if iso_date_ok(e.get("added_date")) and iso_date_ok(e.get("updated_date")):
            if str(e.get("updated_date")) < str(e.get("added_date")):
                fail(f"updated_date {e.get('updated_date')} < added_date {e.get('added_date')}")

        if e.is_deep:
            for field in REQUIRED_DEEP:
                v = e.get(field)
                if v in (None, "", []):
                    fail(f"deep entry missing '{field}'")
            tags = e.get("tags")
            if isinstance(tags, list) and any(str(t).strip() == "待收录" for t in tags):
                fail("deep entry still carries stub tag '待收录'")
            if not e.hosts:
                fail("deep entry has empty hosts")
            if str(e.get("rss", "TODO")).strip().upper() == "TODO":
                warn("deep entry with rss=TODO")
            links = e.get("subscribe_links")
            known = isinstance(links, dict) and any(
                str(v).strip().upper() not in ("", "TODO") for v in links.values())
            if not known:
                warn("deep entry without any verified subscribe link")

    for slug, paths in by_slug.items():
        if slug is not None and len(paths) > 1:
            fails.append(f"duplicate slug '{slug}' in: {', '.join(paths)}")
    for title, paths in by_title.items():
        if title and len(paths) > 1:
            fails.append(f"duplicate title '{title}' in: {', '.join(paths)}")

    if not quiet:
        for msg in fails:
            print(f"FAIL {msg}")
        for msg in warns:
            print(f"WARN {msg}")
    deep = sum(1 for e in entries if e.is_deep)
    print(f"entries={len(entries)} deep={deep} stub={len(entries) - deep} "
          f"fails={len(fails)} warns={len(warns)}")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
