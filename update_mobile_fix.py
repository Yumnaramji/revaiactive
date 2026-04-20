"""
Inject css/mobile-fix.css + js/mobile-fix.js references into every
HTML page. Safe / idempotent — skips files that already have them.

Run from anywhere:  python update_mobile_fix.py
"""
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

CSS_LINK = '<link rel="stylesheet" href="css/mobile-fix.css">'
JS_SCRIPT = '<script src="js/mobile-fix.js" defer></script>'

# We look for an anchor in the <head> to insert right before. The
# Tailwind CDN tag is present in every page, so we inject after it.
CSS_ANCHOR_RE = re.compile(
    r'(<script\s+src="https://cdn\.tailwindcss\.com"></script>)',
    re.IGNORECASE,
)

results = {}

for fname in sorted(os.listdir(BASE)):
    if not fname.endswith('.html'):
        continue
    fpath = os.path.join(BASE, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changes = []

    # --- Inject CSS link ---
    if CSS_LINK in content:
        changes.append('css-already')
    else:
        m = CSS_ANCHOR_RE.search(content)
        if m:
            insertion = m.group(1) + '\n  ' + CSS_LINK
            content = content.replace(m.group(1), insertion, 1)
            changes.append('css-added')
        else:
            # Fallback: insert before </head>
            if '</head>' in content:
                content = content.replace(
                    '</head>', '  ' + CSS_LINK + '\n</head>', 1
                )
                changes.append('css-added-fallback')
            else:
                changes.append('WARN:no-head')

    # --- Inject JS script ---
    if JS_SCRIPT in content or 'js/mobile-fix.js' in content:
        changes.append('js-already')
    else:
        if '</head>' in content:
            content = content.replace(
                '</head>', '  ' + JS_SCRIPT + '\n</head>', 1
            )
            changes.append('js-added')
        else:
            changes.append('WARN:no-head-for-js')

    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

    results[fname] = changes

# Report
print("\nMobile-fix injection report:")
print("-" * 60)
for fname, changes in results.items():
    print(f"{fname:40s}  {', '.join(changes)}")
print("-" * 60)
print(f"Processed {len(results)} HTML files.")
