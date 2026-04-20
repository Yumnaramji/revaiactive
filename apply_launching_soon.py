"""
Replace the products-grid section on sport-specific collection pages
with a 'launching soon' placeholder, matching the treatment already
used on collection-padel.html and collection-golf.html.

Safe / idempotent — skips files that already look converted.

Run from anywhere:  python apply_launching_soon.py
"""
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

# Pages we want to convert. Each entry: (filename, start_marker, end_marker, indent)
#   indent: number of spaces the surrounding <section> sits at in that file
TARGETS = [
    ("collection-running.html",   "<!-- PRODUCTS -->",      "<!-- TECH STRIP -->",       0),
    ("collection-gym.html",       "<!-- PRODUCTS -->",      "<!-- TECH STRIP -->",       0),
    ("collection-yoga.html",      "<!-- PRODUCTS -->",      "<!-- TECH STRIP -->",       0),
    ("collection-new.html",       "<!-- PRODUCTS -->",      "<!-- TECH STRIP -->",       0),
    ("collection-hiit.html",      "<!-- Products Grid -->", "<!-- Technology Strip -->", 2),
    ("collection-recovery.html",  "<!-- Products Grid -->", "<!-- Technology Strip -->", 2),
    ("collection-strength.html",  "<!-- Products Grid -->", "<!-- Technology Strip -->", 2),
    ("collection-triathlon.html", "<!-- Products Grid -->", "<!-- Technology Strip -->", 2),
]

# Launching-soon block templates — matches collection-padel.html exactly.
def launching_soon_block(indent_level):
    pad = " " * indent_level
    return (
        f"{pad}<!-- PRODUCTS -->\n"
        f"{pad}<section class=\"py-36 px-6 text-center\">\n"
        f"{pad}  <div class=\"max-w-xl mx-auto\">\n"
        f"{pad}    <p class=\"text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5\">Coming Soon</p>\n"
        f"{pad}    <h2 style=\"font-size:clamp(1.75rem,4vw,2.5rem);font-weight:700;letter-spacing:-.02em;line-height:1.1\" class=\"mb-6\">Products launching soon.</h2>\n"
        f"{pad}    <p class=\"text-gray-500 text-base leading-relaxed mb-10\">We're putting the finishing touches on this collection. In the meantime, browse all available products.</p>\n"
        f"{pad}    <a href=\"collections.html\" class=\"btn-p\">Shop All Products</a>\n"
        f"{pad}  </div>\n"
        f"{pad}</section>\n\n"
    )


results = {}

for fname, start_marker, end_marker, indent in TARGETS:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        results[fname] = "NOT FOUND"
        continue

    # Read as bytes -> decode latin-1 so stray nulls survive a roundtrip
    with open(fpath, "rb") as f:
        raw = f.read()
    content = raw.decode("utf-8", errors="surrogateescape")

    # Already launching-soon? (contains "Products launching soon" near the start marker)
    if "Products launching soon" in content:
        results[fname] = "already-converted"
        continue

    # Regex: match from start_marker up to (but not including) end_marker.
    # Non-greedy and allow any amount of whitespace/newlines between them.
    pattern = re.compile(
        re.escape(start_marker) + r"[\s\S]*?" + re.escape(end_marker),
        re.MULTILINE,
    )
    m = pattern.search(content)
    if not m:
        results[fname] = f"WARN: markers not found ({start_marker} ... {end_marker})"
        continue

    replacement = launching_soon_block(indent) + (" " * indent) + end_marker
    new_content = content[: m.start()] + replacement + content[m.end():]

    # Write back
    with open(fpath, "wb") as f:
        f.write(new_content.encode("utf-8", errors="surrogateescape"))

    results[fname] = "converted"

# Report
print("\nLaunching-soon conversion report:")
print("-" * 60)
for fname, status in results.items():
    print(f"{fname:32s}  {status}")
print("-" * 60)
print(f"Processed {len(results)} files.")
