"""
update_nav.py — keep the Shop nav regions in sync across every page.

Run from the Website/ directory (no arguments). The script:
  * auto-discovers all *.html files next to itself
  * rewrites three Shop nav regions on each page that has them:
      1. Desktop Shop dropdown  (inside <div id="shop-dropdown-menu"> ... </div>)
      2. Mobile menu Shop section  (between <p>Shop</p> and the divider)
      3. Footer Shop column  (inside the Shop <ul class="space-y-3">)
  * skips pages that don't have a region (e.g. cart.html has no mobile menu,
    team-orders.html has no desktop dropdown)
  * is idempotent — running it twice produces no diff

Edit the THREE constants near the top to change nav content.
After editing, run:  python update_nav.py
"""

import os
import re
import sys

# --------------------------------------------------------------------------
# CANONICAL NAV CONTENT — edit these to change every page at once
# --------------------------------------------------------------------------

# Desktop Shop dropdown — full inner HTML between
#   <div id="shop-dropdown-menu" ...>   and   the matching </div>
DESKTOP_DROPDOWN_INNER = """
          <a href="collection-new.html" class="block px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50">New Arrivals</a>
          <div class="my-1 border-t border-gray-100"></div>
          <a href="collections.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">All Products</a>
          <a href="collection-gym.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Gym &amp; Training</a>
          <a href="collection-running.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Running</a>
          <a href="collection-golf.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Golf</a>
          <a href="collection-yoga.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Yoga &amp; Pilates</a>
        """  # trailing whitespace + indent matches existing close pattern

# Mobile menu Shop section — full inner HTML between
#   <p ...>Shop</p>   and   <div class="my-3 border-t border-gray-100"></div>
MOBILE_SHOP_INNER = """
    <a href="collection-new.html" class="mlink block py-2 text-sm font-medium text-black">New Arrivals</a>
    <a href="collections.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">All Products</a>
    <a href="collection-gym.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Gym &amp; Training</a>
    <a href="collection-running.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Running</a>
    <a href="collection-golf.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Golf</a>
    <a href="collection-yoga.html" class="mlink block py-2 text-sm font-medium text-gray-700 hover:text-black">Yoga &amp; Pilates</a>
    """  # trailing whitespace + indent matches existing close pattern

# Footer Shop column — inner HTML of <ul class="space-y-3"> ... </ul>
# (rendered on one line to match the existing footer compaction)
FOOTER_SHOP_INNER = (
    '<li><a href="collection-new.html" class="text-sm text-gray-400 hover:text-white transition-colors">New Arrivals</a></li>'
    '<li><a href="collections.html" class="text-sm text-gray-400 hover:text-white transition-colors">All Products</a></li>'
    '<li><a href="collection-gym.html" class="text-sm text-gray-400 hover:text-white transition-colors">Gym &amp; Training</a></li>'
    '<li><a href="collection-running.html" class="text-sm text-gray-400 hover:text-white transition-colors">Running</a></li>'
    '<li><a href="collection-golf.html" class="text-sm text-gray-400 hover:text-white transition-colors">Golf</a></li>'
    '<li><a href="collection-yoga.html" class="text-sm text-gray-400 hover:text-white transition-colors">Yoga &amp; Pilates</a></li>'
)

# --------------------------------------------------------------------------
# Patterns — captured groups: ($1 = opening marker, $2 = content, $3 = closing marker)
# --------------------------------------------------------------------------

# Desktop dropdown: the inner <div class="my-1 border-t..."></div> is the only
# nested div, and it's self-closing on one line — so a non-greedy .*? against
# the menu's close pattern (8-space-indented </div> followed by the wrapper
# close) is unambiguous.
DESKTOP_RE = re.compile(
    r'(<div id="shop-dropdown-menu"[^>]*>)(.*?)(\n        </div>\n      </div>)',
    re.DOTALL,
)

# Mobile Shop section: starts after <p ...>Shop</p>, ends at the section divider
MOBILE_RE = re.compile(
    r'(<p class="text-xs font-semibold uppercase tracking-widest text-gray-400[^"]*">Shop</p>)'
    r'(.*?)'
    r'(<div class="my-3 border-t border-gray-100"></div>)',
    re.DOTALL,
)

# Footer Shop column: <h3 ...>Shop</h3>\n        <ul ...>  ...  </ul>
FOOTER_RE = re.compile(
    r'(<h3 class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-5">Shop</h3>\s*<ul class="space-y-3">)'
    r'(.*?)'
    r'(</ul>)',
    re.DOTALL,
)

# --------------------------------------------------------------------------
# Sync logic
# --------------------------------------------------------------------------


def sync_region(content: str, regex: re.Pattern, new_inner: str) -> tuple[str, bool, bool]:
    """
    Returns (new_content, found, changed).
      found   = the region exists in this file
      changed = the content actually changed (False on idempotent re-runs)
    """
    m = regex.search(content)
    if not m:
        return content, False, False
    old_full = m.group(0)
    new_full = m.group(1) + new_inner + m.group(3)
    if old_full == new_full:
        return content, True, False
    return content.replace(old_full, new_full, 1), True, True


def main() -> int:
    here = os.path.dirname(os.path.abspath(__file__))
    html_files = sorted(f for f in os.listdir(here) if f.endswith(".html"))
    if not html_files:
        print(f"No .html files found in {here}", file=sys.stderr)
        return 1

    rows = []
    any_change = False

    for fname in html_files:
        fpath = os.path.join(here, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        original = content
        flags = []

        content, found, changed = sync_region(content, DESKTOP_RE, DESKTOP_DROPDOWN_INNER)
        flags.append("desktop:" + ("upd" if changed else "ok" if found else "skip"))

        content, found, changed = sync_region(content, MOBILE_RE, MOBILE_SHOP_INNER)
        flags.append("mobile:" + ("upd" if changed else "ok" if found else "skip"))

        content, found, changed = sync_region(content, FOOTER_RE, FOOTER_SHOP_INNER)
        flags.append("footer:" + ("upd" if changed else "ok" if found else "skip"))

        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            any_change = True

        rows.append((fname, flags))

    # Pretty-print summary
    width = max(len(f) for f, _ in rows) + 2
    print(f"Synced {len(rows)} files in {here}")
    print()
    for fname, flags in rows:
        print(f"  {fname:<{width}}  {'  '.join(flags)}")
    print()
    print("Legend: upd = updated, ok = already in sync, skip = region not in this file")
    if not any_change:
        print("No changes written — everything already in sync.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
