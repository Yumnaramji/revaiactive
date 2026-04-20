"""
Standardize the order of About / Stories / Technology links in the
mobile menu across every page. Canonical order is:
  About  ->  Stories  ->  Technology
(matching the desktop nav and the majority of pages).

Currently, ~16 pages have Technology -> About -> Stories which
makes the links appear to "switch places" depending on the page.

Safe / idempotent — only reorders when the three mlink lines are
present and consecutive; otherwise leaves the file alone.

Run:  python fix_mobile_menu_order.py
"""
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

# Match a single <a ...> link whose href targets one of the three pages
# AND is tagged with the `mlink` class (mobile-menu link marker).
LINK_RE = re.compile(
    r'[ \t]*<a[^>]*\bmlink\b[^>]*\bhref="(about|stories|technology)\.html"[^>]*>[^<]*</a>\s*\n'
    r'|'
    r'[ \t]*<a[^>]*\bhref="(about|stories|technology)\.html"[^>]*\bmlink\b[^>]*>[^<]*</a>\s*\n',
    re.IGNORECASE,
)

# Find three consecutive qualifying links (any order), return the whole block.
BLOCK_RE = re.compile(
    r'(' + LINK_RE.pattern + r'){3}',
    re.IGNORECASE | re.VERBOSE,
)

CANONICAL_ORDER = ["about", "stories", "technology"]


def reorder_block(block_text: str) -> str:
    """Given three lines of <a> tags, sort them into About / Stories / Tech order."""
    lines = [ln for ln in block_text.splitlines(keepends=True) if ln.strip()]
    if len(lines) != 3:
        return block_text

    def key_of(line):
        m = re.search(r'href="(about|stories|technology)\.html"', line, re.IGNORECASE)
        return m.group(1).lower() if m else "zzz"

    sorted_lines = sorted(lines, key=lambda ln: CANONICAL_ORDER.index(key_of(ln))
                          if key_of(ln) in CANONICAL_ORDER else 99)
    # Preserve trailing newline if original had one
    if block_text.endswith("\n") and not sorted_lines[-1].endswith("\n"):
        sorted_lines[-1] = sorted_lines[-1] + "\n"
    return "".join(sorted_lines)


results = {}
for fname in sorted(os.listdir(BASE)):
    if not fname.endswith(".html"):
        continue
    fpath = os.path.join(BASE, fname)
    with open(fpath, "rb") as f:
        raw = f.read()
    content = raw.decode("utf-8", errors="surrogateescape")
    original = content

    match = BLOCK_RE.search(content)
    if not match:
        continue

    block = match.group(0)
    reordered = reorder_block(block)

    if reordered == block:
        results[fname] = "already-correct"
        continue

    content = content[: match.start()] + reordered + content[match.end():]
    with open(fpath, "wb") as f:
        f.write(content.encode("utf-8", errors="surrogateescape"))
    results[fname] = "reordered"

print("\nMobile-menu reorder report:")
print("-" * 60)
for fname, status in results.items():
    print(f"{fname:36s}  {status}")
print("-" * 60)
reordered_count = sum(1 for v in results.values() if v == "reordered")
print(f"Reordered {reordered_count} files, already-correct {len(results) - reordered_count}.")
