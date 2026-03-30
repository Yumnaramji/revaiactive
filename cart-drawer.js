/**
 * REVAÍ Cart Drawer
 * Provides window.REVAI_CART with add(), remove(), openDrawer(), closeDrawer()
 * Persists to localStorage key 'revai_cart_v1'
 */
(function () {
  const STORAGE_KEY = 'revai_cart_v1';

  // ── Persistence ──────────────────────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function save(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // ── Badge ─────────────────────────────────────────────────────────────────────
  function updateBadge() {
    const cart = load();
    const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('#cart-badge').forEach(el => {
      el.textContent = total;
      el.classList.toggle('hidden', total === 0);
      el.style.display = total === 0 ? 'none' : 'flex';
    });
  }

  // ── Drawer HTML ───────────────────────────────────────────────────────────────
  function buildDrawer() {
    if (document.getElementById('revai-cart-drawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'revai-cart-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998;backdrop-filter:blur(2px)';
    overlay.addEventListener('click', closeDrawer);

    const drawer = document.createElement('div');
    drawer.id = 'revai-cart-drawer';
    drawer.style.cssText = [
      'position:fixed;top:0;right:0;bottom:0;width:100%;max-width:420px',
      'background:#fff;z-index:9999;display:flex;flex-direction:column',
      'transform:translateX(100%);transition:transform .35s cubic-bezier(.16,1,.3,1)',
      'box-shadow:-4px 0 40px rgba(0,0,0,.12)'
    ].join(';');

    drawer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6">
        <span style="font-size:16px;font-weight:700;color:#000;letter-spacing:-.01em">Your Bag</span>
        <button id="revai-cart-close" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;color:#6b7280;display:flex;align-items:center" aria-label="Close cart">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="revai-cart-items" style="flex:1;overflow-y:auto;padding:0 24px"></div>
      <div id="revai-cart-footer" style="padding:20px 24px;border-top:1px solid #f3f4f6"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.getElementById('revai-cart-close').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  }

  // ── Render items ──────────────────────────────────────────────────────────────
  function renderDrawer() {
    const cart = load();
    const itemsEl = document.getElementById('revai-cart-items');
    const footerEl = document.getElementById('revai-cart-footer');
    if (!itemsEl || !footerEl) return;

    if (cart.length === 0) {
      itemsEl.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px 0;gap:16px">
          <svg width="40" height="40" fill="none" stroke="#d1d5db" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <p style="font-size:15px;font-weight:600;color:#374151;margin:0">Your bag is empty</p>
          <p style="font-size:13px;color:#9ca3af;margin:0">Add something to get started</p>
          <button onclick="window.REVAI_CART.closeDrawer()" style="margin-top:8px;padding:10px 24px;background:#000;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:.02em">Continue Shopping</button>
        </div>`;
      footerEl.innerHTML = '';
      return;
    }

    const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);

    itemsEl.innerHTML = cart.map((item, idx) => `
      <div style="display:flex;gap:14px;padding:18px 0;border-bottom:1px solid #f3f4f6;align-items:flex-start">
        <a href="product.html?id=${item.id}" style="width:80px;height:96px;flex-shrink:0;border-radius:10px;overflow:hidden;background:#f3f4f6;display:block;text-decoration:none">
          <img src="${item.image || 'images/' + item.id + '.jpg'}" alt="${item.name}"
            style="width:100%;height:100%;object-fit:cover;object-position:top;display:block"
            onerror="this.style.display='none';this.parentElement.style.background='#e5e7eb'">
        </a>
        <div style="flex:1;min-width:0">
          <p style="font-size:14px;font-weight:600;color:#000;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</p>
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px">Size: ${item.size}</p>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="display:flex;align-items:center;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
              <button onclick="window.REVAI_CART.setQty(${idx},-1)" style="width:28px;height:28px;background:none;border:none;cursor:pointer;font-size:15px;color:#374151;display:flex;align-items:center;justify-content:center">−</button>
              <span style="width:28px;text-align:center;font-size:13px;font-weight:500">${item.qty || 1}</span>
              <button onclick="window.REVAI_CART.setQty(${idx},1)" style="width:28px;height:28px;background:none;border:none;cursor:pointer;font-size:15px;color:#374151;display:flex;align-items:center;justify-content:center">+</button>
            </div>
            <span style="font-size:13px;font-weight:600;color:#000">KES ${(item.price * (item.qty || 1)).toLocaleString()}</span>
          </div>
        </div>
        <button onclick="window.REVAI_CART.remove(${idx})" style="background:none;border:none;cursor:pointer;color:#9ca3af;padding:2px;display:flex;align-items:center;flex-shrink:0" aria-label="Remove item">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`).join('');

    footerEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="font-size:14px;color:#6b7280">Subtotal</span>
        <span style="font-size:16px;font-weight:700;color:#000">KES ${total.toLocaleString()}</span>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0 0 14px">Free delivery across Kenya. Taxes included.</p>
      <button id="revai-checkout-btn" onclick="window.REVAI_CART.checkout()" style="width:100%;padding:14px;background:#000;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;letter-spacing:.02em;margin-bottom:10px">Checkout</button>
      <button onclick="window.REVAI_CART.closeDrawer()" style="width:100%;padding:12px;background:transparent;color:#374151;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer">Continue Shopping</button>
    `;
  }

  // ── Open / Close ──────────────────────────────────────────────────────────────
  function openDrawer() {
    buildDrawer();
    renderDrawer();
    const drawer = document.getElementById('revai-cart-drawer');
    const overlay = document.getElementById('revai-cart-overlay');
    overlay.style.display = 'block';
    requestAnimationFrame(() => { drawer.style.transform = 'translateX(0)'; });
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const drawer = document.getElementById('revai-cart-drawer');
    const overlay = document.getElementById('revai-cart-overlay');
    if (!drawer) return;
    drawer.style.transform = 'translateX(100%)';
    setTimeout(() => { overlay.style.display = 'none'; }, 350);
    document.body.style.overflow = '';
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  window.REVAI_CART = {
    openDrawer,
    closeDrawer,

    add({ id, name, price, size, image }) {
      const cart = load();
      const key = id + '|' + size;
      const existing = cart.find(i => i.key === key);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        cart.push({ id, name, price, size, key, qty: 1, image: image || 'images/' + id + '.jpg' });
      }
      save(cart);
      updateBadge();
      openDrawer();
    },

    remove(idx) {
      const cart = load();
      cart.splice(idx, 1);
      save(cart);
      updateBadge();
      renderDrawer();
    },

    setQty(idx, delta) {
      const cart = load();
      if (!cart[idx]) return;
      cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + delta);
      save(cart);
      updateBadge();
      renderDrawer();
    },

    checkout: async function() {
      const cart = load();
      if (cart.length === 0) return;

      const TOKEN = 'd247325e39b051aeface7e573e550d37';
      const GQL   = 'https://revai-518.myshopify.com/api/2024-01/graphql.json';

      const btn = document.getElementById('revai-checkout-btn');
      if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }

      try {
        // Use pre-mapped variant IDs from shopify-config.js
        const variants = (window.REVAI_SHOPIFY && window.REVAI_SHOPIFY.variants) || {};

        const cartLines = cart.map(function(item) {
          const productVariants = variants[item.id] || {};
          const vid = productVariants[item.size];
          return vid ? { merchandiseId: vid, quantity: item.qty || 1 } : null;
        }).filter(Boolean);

        if (cartLines.length === 0) {
          if (btn) { btn.textContent = 'Checkout'; btn.disabled = false; }
          var notice = document.getElementById('revai-checkout-notice');
          if (!notice) {
            notice = document.createElement('p');
            notice.id = 'revai-checkout-notice';
            notice.style.cssText = 'font-size:12px;color:#6b7280;text-align:center;margin-top:8px';
            if (btn) btn.parentNode.insertBefore(notice, btn.nextSibling);
          }
          notice.textContent = 'Online checkout coming soon. To order, contact us directly.';
          return;
        }

        // Step 1: Check availability before creating checkout
        const variantIds = cartLines.map(function(l) { return l.merchandiseId; });
        const availRes = await fetch(GQL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
          body: JSON.stringify({
            query: 'query($ids:[ID!]!){nodes(ids:$ids){...on ProductVariant{id availableForSale quantityAvailable}}}',
            variables: { ids: variantIds }
          })
        });
        const availData = await availRes.json();
        const nodes = (availData.data && availData.data.nodes) || [];
        const unavailable = nodes.filter(function(n) { return n && !n.availableForSale; }).map(function(n) { return n.id; });

        if (unavailable.length > 0) {
          // Find which cart items are out of stock
          const currentCart = load();
          const variants = (window.REVAI_SHOPIFY && window.REVAI_SHOPIFY.variants) || {};
          const outOfStockItems = currentCart.filter(function(item) {
            const vid = (variants[item.id] || {})[item.size];
            return vid && unavailable.includes(vid);
          });
          const remaining = currentCart.filter(function(item) {
            const vid = (variants[item.id] || {})[item.size];
            return !(vid && unavailable.includes(vid));
          });
          // Remove out of stock items from cart and re-render
          save(remaining);
          window.REVAI_CART.render();
          if (btn) { btn.textContent = 'Checkout'; btn.disabled = false; }
          var notice = document.getElementById('revai-checkout-notice');
          if (!notice) {
            notice = document.createElement('p');
            notice.id = 'revai-checkout-notice';
            notice.style.cssText = 'font-size:13px;color:#dc2626;text-align:center;margin-top:8px;padding:8px;background:#fef2f2;border-radius:6px';
            if (btn) btn.parentNode.insertBefore(notice, btn.nextSibling);
          }
          const names = outOfStockItems.map(function(i) { return i.name + ' (' + i.size + ')'; }).join(', ');
          notice.textContent = 'Removed from bag — sold out: ' + names + '. Please update your bag and try again.';
          return;
        }

        // Step 2: All items available — create checkout
        const cartRes = await fetch(GQL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
          body: JSON.stringify({
            query: 'mutation cartCreate($input: CartInput!) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { field message } } }',
            variables: { input: { lines: cartLines } }
          })
        });
        const cartData = await cartRes.json();
        const checkoutUrl = cartData.data && cartData.data.cartCreate && cartData.data.cartCreate.cart && cartData.data.cartCreate.cart.checkoutUrl;

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          console.error('Shopify cart errors:', cartData);
          alert('Could not create checkout. Please try again.');
          if (btn) { btn.textContent = 'Checkout'; btn.disabled = false; }
        }
      } catch (e) {
        console.error('Checkout error:', e);
        alert('Something went wrong. Please try again.');
        if (btn) { btn.textContent = 'Checkout'; btn.disabled = false; }
      }
    },

    clear() {
      save([]);
      updateBadge();
      renderDrawer();
    }
  };

  // Init badge on load
  document.addEventListener('DOMContentLoaded', updateBadge);
  updateBadge();
})();
