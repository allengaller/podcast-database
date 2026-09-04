#!/usr/bin/env python3
"""Shared corpus utilities: entry discovery + frontmatter loading.

All corpus tooling (validate_corpus.py / stats.py / export.py) loads entries
through this module so parsing rules stay in exactly one place.
"""
import os
import sys

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("PyYAML is required: pip install pyyaml")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PODCASTS_DIR = os.path.join(ROOT, "podcasts")

LANGS = ("zh", "en")
STATUSES = ("active", "ended", "hiatus", "todo")
STUB_STATUS = "todo"

# Files that live under podcasts/ but are not corpus entries.
SKIP_BASENAMES = {"README.md", "INDEX.md"}
SKIP_PREFIX = "_"


def ensure_under_root(path, root=ROOT):
    """Raise if `path` resolves outside `root` (path-traversal guard for all writers)."""
    real = os.path.realpath(path)
    root_real = os.path.realpath(root)
    if real != root_real and not real.startswith(root_real + os.sep):
        raise ValueError(f"path escapes project root: {path}")
    return real


def safe_write(path, text):
    """Rebuild `path` under its own parent directory and write there (CWE-22 hardening)."""
    from pathlib import Path
    parent = Path(os.path.dirname(path)).resolve()
    target = parent / os.path.basename(path)
    if not str(target).startswith(str(parent) + os.sep):
        raise ValueError(f"path escapes allowed dir: {path}")
    target.write_text(text, encoding="utf-8")


def iter_entry_paths():
    """Yield absolute paths of corpus entry markdown files."""
    for lang in LANGS:
        lang_dir = os.path.join(PODCASTS_DIR, lang)
        if not os.path.isdir(lang_dir):
            continue
        for dirpath, _dirnames, filenames in os.walk(lang_dir):
            for name in sorted(filenames):
                if not name.endswith(".md"):
                    continue
                if name in SKIP_BASENAMES or name.startswith(SKIP_PREFIX):
                    continue
                yield os.path.join(dirpath, name)


def split_frontmatter(text, relpath):
    """Return (yaml_text, body_text); raise ValueError on malformed wrapper."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{relpath}: file must start with a '---' frontmatter fence")
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        raise ValueError(f"{relpath}: missing closing '---' for frontmatter")
    return "\n".join(lines[1:end]), "\n".join(lines[end + 1:])


class Entry:
    """One corpus entry: parsed frontmatter + filesystem metadata."""

    def __init__(self, path, data):
        self.path = path
        self.relpath = os.path.relpath(path, ROOT)
        self.data = data if isinstance(data, dict) else {}
        self.stem = os.path.splitext(os.path.basename(path))[0]

        parts = self.relpath.split(os.sep)  # podcasts/<lang>/<category>/<file>.md
        self.lang_dir = parts[1] if len(parts) > 3 else None
        self.cat_dir = parts[2] if len(parts) > 3 else None

    def get(self, key, default=None):
        return self.data.get(key, default)

    @property
    def status(self):
        return self.get("status")

    @property
    def is_stub(self):
        return self.status == STUB_STATUS

    @property
    def is_deep(self):
        return self.status in ("active", "ended", "hiatus")

    @property
    def hosts(self):
        v = self.get("hosts")
        return v if isinstance(v, list) else ([] if v in (None, "") else [v])


def load_corpus():
    """Load all entries. Returns (entries, parse_errors)."""
    entries, errors = [], []
    for path in iter_entry_paths():
        relpath = os.path.relpath(path, ROOT)
        try:
            with open(path, encoding="utf-8") as fh:
                text = fh.read()
            fm_text, _body = split_frontmatter(text, relpath)
            data = yaml.safe_load(fm_text)
            if not isinstance(data, dict):
                raise ValueError(f"{relpath}: frontmatter must be a YAML mapping")
            entries.append(Entry(path, data))
        except (ValueError, yaml.YAMLError) as exc:
            errors.append(str(exc))
    return entries, errors
