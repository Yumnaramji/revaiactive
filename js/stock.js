/* REVAÍ — stock from the shop (10 Nov 2026)
   Asks shop.revaiactive.com once which sizes are in stock, so a product page or the quick-add
   window can strike a sold-out size and turn "Add to Bag" into "Out of stock".
   Needs woo-config.js first (window.REVAI_WOO). Loaded on product.html, collections.html, index.html.

   window.REVAI_STOCK.ready            a promise that always resolves (never rejects)
   window.REVAI_STOCK.forProduct(id)   { "S": true, "M": false, ... } for a site product id, or null if unknown
   window.REVAI_STOCK.isOut(id, size)  true only when the shop has said that size is out

   If the shop cannot be reached (offline, slow, or the site is opened from localhost, which the
   shop does not answer) nothing is marked and everything stays buyable, exactly as before.
   The answer is kept for 3 minutes per tab so moving between pages does not ask again.
   Sizes are matched by the variation id in woo-config.js and, failing that, by the size name,
   so a variation that is re-created in WooCommerce with a new id still gets its stock. */
(function () {
  'use strict';
  var W = window.REVAI_WOO, KEY = 'revai_stock_v1', TTL = 3 * 60 * 1000, map = null;

  function build(list) {
    if (!W || !W.variations || !Array.isArray(list)) return null;
    var byParent = {}, out = {}, k, s, i;
    for (k in W.variations) byParent[W.variations[k].product] = k;
    for (i = 0; i < list.length; i++) {
      var v = list[i], slug = byParent[v.parent];
      if (!slug) continue;
      var sizes = W.variations[slug].sizes, size = null;
      for (s in sizes) if (sizes[s] === v.id) { size = s; break; }
      if (!size && v.variation) {
        var label = String(v.variation).split(': ').pop().trim();
        if (Object.prototype.hasOwnProperty.call(sizes, label)) size = label;
      }
      if (!size) continue;
      (out[slug] = out[slug] || {})[size] = !!v.is_in_stock;
    }
    return out;
  }
  function cached() {
    try {
      var c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (c && c.t && Date.now() - c.t < TTL && Array.isArray(c.list)) return c.list;
    } catch (e) {}
    return null;
  }
  function load() {
    var c = cached();
    if (c) { map = build(c); return Promise.resolve(map); }
    if (!W || !W.base || !window.fetch) return Promise.resolve(null);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);
    return fetch(W.base + '/wp-json/wc/store/v1/products?type=variation&per_page=100&_fields=id,parent,variation,is_in_stock',
      { credentials: 'omit', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (list) {
        clearTimeout(timer);
        if (!Array.isArray(list)) return null;
        try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), list: list })); } catch (e) {}
        map = build(list);
        return map;
      })
      .catch(function () { clearTimeout(timer); return null; });
  }

  window.REVAI_STOCK = {
    ready: load(),
    forProduct: function (id) { return (map && map[id]) || null; },
    isOut: function (id, size) { return !!(map && map[id] && map[id][size] === false); },
    // for checking the "Out of stock" state by hand: REVAI_STOCK.set([{id:22,parent:20,is_in_stock:false}, ...])
    set: function (list) { map = build(list); return map; }
  };
})();
