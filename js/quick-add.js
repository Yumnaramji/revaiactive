/* REVAÍ — Quick add (2 Oct 2026)
   A round bag-plus button on every product card photo. It opens a small window
   (a sheet from the bottom on phones, a centred box from 768px up) where the
   shopper picks a size and adds to the bag without leaving the page.

   Loaded on the pages that have product cards: collections.html,
   collection-gym.html, index.html. Needs cart-drawer.js (window.REVAI_CART and
   window.REVAI_CATALOG). The sizes offered are the card's own size pills, which
   stay in the markup but are hidden by each page's CSS.
   Styles are injected here so the three pages only need the script tag. */
(function () {
  'use strict';

  var CSS = [
    '.qa-btn{position:absolute;left:10px;bottom:10px;z-index:4;width:40px;height:40px;border-radius:50%;border:0;padding:0;',
    'background:#fff;color:#0a0a0a;display:flex;align-items:center;justify-content:center;cursor:pointer;',
    'box-shadow:0 1px 4px rgba(0,0,0,.14);transition:transform .15s ease}',
    '.qa-btn:hover{transform:scale(1.06)}',
    '.qa-btn:focus-visible{outline:2px solid #0a0a0a;outline-offset:2px}',
    '@media(max-width:767px){.qa-btn{left:8px;bottom:8px;width:36px;height:36px}}',
    '#qa-overlay{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.45);display:none;align-items:flex-end;justify-content:center}',
    '#qa-overlay.open{display:flex}',
    '#qa-panel{position:relative;width:100%;max-height:92vh;overflow-y:auto;background:#fff;color:#0a0a0a;padding:22px 20px 24px;',
    'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;box-sizing:border-box}',
    '@media(min-width:768px){#qa-overlay{align-items:center}#qa-panel{width:420px;padding:28px}}',
    '#qa-close{position:absolute;top:10px;right:10px;width:40px;height:40px;border:0;background:none;color:#0a0a0a;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center}',
    '.qa-head{display:flex;gap:14px;align-items:flex-start;padding-right:36px}',
    '.qa-thumb{width:84px;aspect-ratio:3/4;object-fit:cover;background:#f4f4f4;flex-shrink:0;display:block}',
    '.qa-name{margin:0;font-size:15px;font-weight:600;line-height:1.3}',
    '.qa-colour,.qa-price{margin:6px 0 0;font-size:14px;color:#6b7280;line-height:1.3}',
    '.qa-price{margin-top:3px}',
    '.qa-label{margin:22px 0 10px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6b7280}',
    '.qa-sizes{display:flex;flex-wrap:wrap;gap:8px}',
    '.qa-size{min-width:52px;height:48px;padding:0 14px;border:1px solid #e5e7eb;border-radius:2px;background:#fff;color:#374151;',
    'font:500 13px Inter,-apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;transition:border-color .15s,background .15s,color .15s}',
    '.qa-size:hover{border-color:#0a0a0a}',
    '.qa-size.sel{background:#0a0a0a;border-color:#0a0a0a;color:#fff}',
    '.qa-error{display:none;margin:10px 0 0;font-size:13px;color:#dc2626}',
    '.qa-add{display:block;width:100%;height:50px;margin-top:20px;border:0;border-radius:2px;background:#0a0a0a;color:#fff;',
    'font:600 14px Inter,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:.02em;cursor:pointer}',
    '.qa-add:hover{background:#222}',
    '.qa-more{display:block;margin-top:14px;text-align:center;font-size:13px;color:#6b7280;text-decoration:underline;text-underline-offset:3px}',
    '.qa-more:hover{color:#0a0a0a}'
  ].join('');

  var ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="8" width="14" height="12.5" rx="1"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M12 11.5v5.5M9.25 14.25h5.5"/></svg>';

  var overlay, panel, lastFocus = null, current = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Everything the window needs, read from the card itself plus the bag's catalogue.
  function readCard(card) {
    var pills = card.querySelectorAll('.size-pill');
    if (!pills.length) return null;
    var id = pills[0].getAttribute('data-pid') || pills[0].getAttribute('data-product');
    if (!id) return null;
    var cat = (window.REVAI_CATALOG && window.REVAI_CATALOG.CATALOG && window.REVAI_CATALOG.CATALOG[id]) || null;
    var img = card.querySelector('img');
    var nameEl = card.querySelector('.pc-row p:first-child, .hp-name');
    var colourEl = card.querySelector('.pc-colour, .hp-colour');
    var priceEl = card.querySelector('.pc-row p:last-child, .hp-price');
    var price = cat ? cat.price : Number(String(priceEl ? priceEl.textContent : '').replace(/[^0-9]/g, ''));
    return {
      id: id,
      name: cat ? cat.name : (nameEl ? nameEl.textContent.trim() : id),
      price: price,
      colour: colourEl ? colourEl.textContent.trim() : '',
      image: img ? img.getAttribute('src') : 'images/' + id + '.jpg',
      sizes: Array.prototype.map.call(pills, function (p) { return p.getAttribute('data-size'); })
    };
  }

  function addStyles() {
    if (document.getElementById('qa-styles')) return;
    var style = document.createElement('style');
    style.id = 'qa-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'qa-overlay';
    overlay.innerHTML = '<div id="qa-panel" role="dialog" aria-modal="true" aria-labelledby="qa-name"></div>';
    document.body.appendChild(overlay);
    panel = overlay.firstChild;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      // keep the Tab key inside the window while it is open
      var f = panel.querySelectorAll('button, a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function open(p, opener) {
    build();
    current = { p: p, size: p.sizes.length === 0 ? '' : null };
    lastFocus = opener || null;
    panel.innerHTML =
      '<button id="qa-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/></svg></button>' +
      '<div class="qa-head"><img class="qa-thumb" src="' + esc(p.image) + '" alt="">' +
      '<div><p class="qa-name" id="qa-name">' + esc(p.name) + '</p>' +
      (p.colour ? '<p class="qa-colour">' + esc(p.colour) + '</p>' : '') +
      '<p class="qa-price">KES ' + Number(p.price).toLocaleString('en-KE') + '</p></div></div>' +
      '<p class="qa-label">Select size</p>' +
      '<div class="qa-sizes">' + p.sizes.map(function (s) {
        return '<button type="button" class="qa-size" data-size="' + esc(s) + '" aria-pressed="false">' + esc(s) + '</button>';
      }).join('') + '</div>' +
      '<p class="qa-error" role="alert">Please select a size to continue</p>' +
      '<button type="button" class="qa-add">Add to Bag</button>' +
      '<a class="qa-more" href="product.html?id=' + encodeURIComponent(p.id) + '">View full details</a>';
    panel.querySelector('#qa-close').addEventListener('click', close);
    Array.prototype.forEach.call(panel.querySelectorAll('.qa-size'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(panel.querySelectorAll('.qa-size'), function (x) { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-pressed', 'true');
        current.size = b.getAttribute('data-size');
        panel.querySelector('.qa-error').style.display = 'none';
      });
    });
    panel.querySelector('.qa-add').addEventListener('click', add);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    panel.querySelector('#qa-close').focus();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    current = null;
  }

  function add() {
    if (!current) return;
    if (!current.size) { panel.querySelector('.qa-error').style.display = 'block'; return; }
    var p = current.p, size = current.size;
    close();
    if (window.REVAI_CART && window.REVAI_CART.add) {
      window.REVAI_CART.add({ id: p.id, name: p.name, price: p.price, size: size, image: p.image });   // opens the bag
    }
  }

  function attach() {
    addStyles();   // the button needs them before the window is ever opened
    var cards = document.querySelectorAll('.prod-card, .hp-card');
    Array.prototype.forEach.call(cards, function (card) {
      if (card.querySelector('.qa-btn')) return;
      var p = readCard(card);
      var photo = card.querySelector('.hp-ph') || card.querySelector('.relative');
      if (!p || !photo) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qa-btn';
      btn.setAttribute('aria-label', 'Quick add ' + p.name);
      btn.innerHTML = ICON;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();   // the photo and the card both open the product page on click
        open(readCard(card) || p, btn);
      });
      photo.appendChild(btn);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();
