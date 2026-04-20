"""
Fix the mobile hamburger-menu JS on pages that use the broken
pattern `mmenu.classList.add('open')` alone. That class-based
approach is overridden by the inline `style="transform:translateX(100%)"`
on the <div id="mmenu"> element, so the menu never slides in.

Patch: also mutate mmenu.style.transform directly, like about.html /
index.html already do. Safe / idempotent — skips files already fixed.

Run:  python fix_mobile_menu.py
"""
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

# Pairs of (old_pattern_substring, replacement_substring).
# We target the two lines that need updating in the page footer script.
REPLACEMENTS = [
    # openM
    (
        "function openM(){mmenu.classList.add('open');",
        "function openM(){mmenu.style.transform='translateX(0)';mmenu.classList.add('open');",
    ),
    # closeM
    (
        "function closeM(){mmenu.classList.remove('open');",
        "function closeM(){mmenu.style.transform='translateX(100%)';mmenu.classList.remove('open');",
    ),
    # Guarded attachment — only patch if the raw/unguarded version exists
    (
        "hbg.addEventListener('click',openM);mclose.addEventListener('click',closeM);moverlay.addEventListener('click',closeM);",
        "if(hbg)hbg.addEventListener('click',openM);if(mclose)mclose.addEventListener('click',closeM);if(moverlay)moverlay.addEventListener('click',closeM);",
    ),
]

results = {}
for fname in sorted(os.listdir(BASE)):
    if not fname.endswith(".html"):
        continue
    fpath = os.path.join(BASE, fname)
    with open(fpath, "rb") as f:
        raw = f.read()
    content = raw.decode("utf-8", errors="surrogateescape")
    original = content
    changes = []

    for old, new in REPLACEMENTS:
        if old in content:
            content = content.replace(old, new, 1)
            changes.append("patched")
        elif new in content:
            changes.append("already")
        # else: pattern not present — skip silently

    if content != original:
        with open(fpath, "wb") as f:
            f.write(content.encode("utf-8", errors="surrogateescape"))

    if changes:
        results[fname] = changes

# Report
print("\nMobile-menu fix report:")
print("-" * 60)
for fname, changes in results.items():
    print(f"{fname:36s}  {', '.join(changes)}")
print("-" * 60)
print(f"Updated {sum(1 for v in results.values() if 'patched' in v)} files.")
