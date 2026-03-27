import os

base = "C:/Users/yumna/Downloads/REVAI/Website"

# The 11 files with the Shop dropdown
files = [
    "collection-golf.html",
    "collection-padel.html",
    "collection-gym.html",
    "collection-running.html",
    "collections.html",
    "gift-cards.html",
    "sustainability.html",
    "athlete-program.html",
    "shipping-returns.html",
    "about.html",
    "index.html",
]

# ---- CHANGE 1a: Replace dropdown wrapper (two variants) ----

OLD_WRAP_NO_SPACE = '<div class="relative group">\n        <button class="text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1">Shop<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l4 4 4-4"/></svg></button>\n        <div class="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">'

OLD_WRAP_WITH_SPACE = '<div class="relative group">\n        <button class="text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1">Shop <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l4 4 4-4"/></svg></button>\n        <div class="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">'

NEW_WRAP = '<div class="relative" id="shop-dropdown-wrap">\n        <button id="shop-dropdown-btn" class="text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1">Shop<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l4 4 4-4"/></svg></button>\n        <div id="shop-dropdown-menu" class="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 transition-all duration-200 z-50" style="opacity:0;pointer-events:none">'

# ---- CHANGE 1b JS ----
NAV_SCROLL_LINE = "window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>20),{passive:true});"

DROPDOWN_JS = "(function(){\n  var btn=document.getElementById('shop-dropdown-btn');\n  var menu=document.getElementById('shop-dropdown-menu');\n  if(!btn||!menu)return;\n  btn.addEventListener('click',function(e){\n    e.stopPropagation();\n    var open=menu.style.opacity==='1';\n    menu.style.opacity=open?'0':'1';\n    menu.style.pointerEvents=open?'none':'auto';\n  });\n  document.addEventListener('click',function(){\n    menu.style.opacity='0';\n    menu.style.pointerEvents='none';\n  });\n})();"

# ---- CHANGE 2: Dropdown links ----

OLD_DROPDOWN_LINKS = '          <a href="collections.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">All Products</a>\n          <a href="collection-running.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Running</a>\n          <a href="collection-padel.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Padel</a>\n          <a href="collection-golf.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Golf</a>\n          <a href="collection-gym.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Gym &amp; Training</a>\n          <div class="my-1 border-t border-gray-100"></div>\n          <a href="collection-new.html" class="block px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50">New Arrivals</a>'

NEW_DROPDOWN_LINKS = '          <a href="collection-new.html" class="block px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50">New Arrivals</a>\n          <div class="my-1 border-t border-gray-100"></div>\n          <a href="collections.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">All Products</a>\n          <a href="collection-gym.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Gym &amp; Training</a>\n          <a href="collection-running.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Running</a>\n          <a href="collection-padel.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Padel</a>\n          <a href="collection-golf.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:text-black hover:bg-gray-50">Golf</a>'

# ---- CHANGE 3a: Mobile links ----
OLD_MOBILE_LINKS = '    <a href="collections.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">All Products</a>\n    <a href="collection-running.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Running</a>\n    <a href="collection-padel.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Padel</a>\n    <a href="collection-golf.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Golf</a>\n    <a href="collection-gym.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Gym &amp; Training</a>\n    <a href="collection-new.html" class="mlink block py-2 text-sm font-medium text-black">New Arrivals</a>'

NEW_MOBILE_LINKS = '    <a href="collection-new.html" class="mlink block py-2 text-sm font-medium text-black">New Arrivals</a>\n    <a href="collections.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">All Products</a>\n    <a href="collection-gym.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Gym &amp; Training</a>\n    <a href="collection-running.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Running</a>\n    <a href="collection-padel.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Padel</a>\n    <a href="collection-golf.html" class="mlink block py-2 text-sm text-gray-700 hover:text-black">Golf</a>'

# ---- CHANGE 3b: Footer links ----
OLD_FOOTER_LINKS = '          <li><a href="collection-running.html" class="text-sm text-gray-400 hover:text-white transition-colors">Running</a></li>\n          <li><a href="collection-padel.html" class="text-sm text-gray-400 hover:text-white transition-colors">Padel</a></li>\n          <li><a href="collection-golf.html" class="text-sm text-gray-400 hover:text-white transition-colors">Golf</a></li>\n          <li><a href="collection-gym.html" class="text-sm text-gray-400 hover:text-white transition-colors">Gym &amp; Training</a></li>\n          <li><a href="collection-new.html" class="text-sm text-gray-400 hover:text-white transition-colors">New Arrivals</a></li>'

NEW_FOOTER_LINKS = '          <li><a href="collection-new.html" class="text-sm text-gray-400 hover:text-white transition-colors">New Arrivals</a></li><li><a href="collection-gym.html" class="text-sm text-gray-400 hover:text-white transition-colors">Gym &amp; Training</a></li><li><a href="collection-running.html" class="text-sm text-gray-400 hover:text-white transition-colors">Running</a></li><li><a href="collection-padel.html" class="text-sm text-gray-400 hover:text-white transition-colors">Padel</a></li><li><a href="collection-golf.html" class="text-sm text-gray-400 hover:text-white transition-colors">Golf</a></li>'

results = {}

for fname in files:
    fpath = os.path.join(base, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changes = []

    # Change 1a: wrapper
    if OLD_WRAP_NO_SPACE in content:
        content = content.replace(OLD_WRAP_NO_SPACE, NEW_WRAP, 1)
        changes.append("wrap(no-space)")
    elif OLD_WRAP_WITH_SPACE in content:
        content = content.replace(OLD_WRAP_WITH_SPACE, NEW_WRAP, 1)
        changes.append("wrap(with-space)")
    else:
        changes.append("WARN:wrap-not-found")

    # Change 1b: JS dropdown
    if NAV_SCROLL_LINE in content and DROPDOWN_JS not in content:
        content = content.replace(NAV_SCROLL_LINE, NAV_SCROLL_LINE + "\n" + DROPDOWN_JS, 1)
        changes.append("js")
    elif DROPDOWN_JS in content:
        changes.append("js-already")
    else:
        changes.append("WARN:nav-scroll-not-found")

    # Change 2: dropdown links
    if OLD_DROPDOWN_LINKS in content:
        content = content.replace(OLD_DROPDOWN_LINKS, NEW_DROPDOWN_LINKS, 1)
        changes.append("dropdown-links")
    elif NEW_DROPDOWN_LINKS in content:
        changes.append("dropdown-links-already")
    else:
        changes.append("WARN:dropdown-links-not-found")

    # Change 3a: mobile links
    if OLD_MOBILE_LINKS in content:
        content = content.replace(OLD_MOBILE_LINKS, NEW_MOBILE_LINKS, 1)
        changes.append("mobile")
    elif NEW_MOBILE_LINKS in content:
        changes.append("mobile-already")
    else:
        changes.append("WARN:mobile-not-found")

    # Change 3b: footer links
    if OLD_FOOTER_LINKS in content:
        content = content.replace(OLD_FOOTER_LINKS, NEW_FOOTER_LINKS, 1)
        changes.append("footer")
    elif NEW_FOOTER_LINKS in content:
        changes.append("footer-already")
    else:
        changes.append("WARN:footer-not-found")

    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

    results[fname] = changes

for fname, changes in results.items():
    print(fname + ": " + ", ".join(changes))
