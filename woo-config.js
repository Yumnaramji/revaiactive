// REVAÍ — WooCommerce shop configuration (shop.revaiactive.com)
// Generated 2026-10-01 from the live WooCommerce catalogue. Variation IDs map each
// site product + size to the WooCommerce variation that holds its SKU, price and stock.
// Switch REVAI_CHECKOUT to 'shopify' to fall back to the old Shopify checkout.
window.REVAI_CHECKOUT = 'woo';
window.REVAI_WOO = {
  base: 'https://shop.revaiactive.com',
  // Accounts stay on revaiactive.com (login.html, orders.html, ...) via js/woo-customer.js -> /wp-json/revai/v1/customer
  api: 'https://shop.revaiactive.com/wp-json/revai/v1/customer',
  variations: {
    "gym-bag": { product: 129, sizes: { "One Size":130 } },
    "lifestyle-cap": { product: 126, sizes: { "One Size":127 } },
    "ankle-socks": { product: 120, sizes: { "S/M":121, "L/XL":122 } },
    "training-pants-m": { product: 113, sizes: { "S":114, "M":115, "L":116, "XL":117, "XXL":118 } },
    "shorts-m": { product: 104, sizes: { "S":105, "M":106, "L":107, "XL":108, "XXL":109 } },
    "quarter-zip-m": { product: 95, sizes: { "S":96, "M":97, "L":98, "XL":99, "XXL":100 } },
    "tshirt-m": { product: 85, sizes: { "S":86, "M":87, "L":88, "XL":89, "XXL":90 } },
    "jacket-w": { product: 76, sizes: { "S":77, "M":78, "L":79, "XL":80, "XXL":81 } },
    "tshirt-w": { product: 66, sizes: { "S":67, "M":68, "L":69, "XL":70, "XXL":71 } },
    "low-impact-bra": { product: 55, sizes: { "S":56, "M":57, "L":58, "XL":59, "XXL":60 } },
    "high-impact-bra": { product: 45, sizes: { "S":46, "M":47, "L":48, "XL":49, "XXL":50 } },
    "flared-leggings-w": { product: 28, sizes: { "S":29, "M":30, "L":31, "XL":32, "XXL":33, "S (Tall)":34, "M (Tall)":35, "L (Tall)":36, "XL (Tall)":37, "XXL (Tall)":38 } },
    "running-leggings-w": { product: 20, sizes: { "S":21, "M":22, "L":23, "XL":24, "XXL":25 } }
  }
};

// Wishlist is an account feature (Yumna, 1 Oct 2026; revised 2 Oct 2026). The heart sits
// next to the bag in the header on every page, phone and desktop, for guests too. A guest
// who taps it gets this sign-in / create-account prompt (same look as the product page's
// Save prompt); a signed-in customer goes straight to wishlist.html. There is no
// "Wishlist" line in the phone menu any more. The prompt is built here, not in the page
// markup, so one script covers all 31 pages.
(function () {
  function signedIn() {
    try {
      var t = JSON.parse(localStorage.getItem('revai_customer_token_v1') || 'null');
      return !!(t && t.accessToken && (!t.expiresAt || new Date(t.expiresAt) > new Date()));
    } catch (e) { return false; }
  }
  var box = null;
  var btn = 'display:flex;justify-content:center;align-items:center;width:100%;box-sizing:border-box;font-size:14px;font-weight:500;border-radius:9px;padding:11px 24px;text-decoration:none;font-family:inherit;';
  function build() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'revai-wish-auth';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'revai-wish-auth-title');
    box.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif';
    box.innerHTML =
      '<div data-close style="position:absolute;inset:0;background:rgba(0,0,0,.4)"></div>' +
      '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:calc(100% - 32px);max-width:24rem;background:#fff;padding:28px;border:1px solid #e5e7eb;box-sizing:border-box">' +
        '<p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af">Wishlist</p>' +
        '<h2 id="revai-wish-auth-title" style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-.015em;color:#0a0a0a">Sign in to see your wishlist</h2>' +
        '<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563">Your wishlist lives on your REVAÍ account. Sign in or create a free account to save pieces for later.</p>' +
        '<a href="login.html?next=wishlist.html" style="' + btn + 'background:#000;color:#fff;margin-bottom:8px">Sign in</a>' +
        '<a href="signup.html?next=wishlist.html" style="' + btn + 'background:#fff;color:#000;border:1px solid #000">Create account</a>' +
        '<button type="button" data-close style="display:block;width:100%;margin-top:16px;background:none;border:0;padding:0;font:inherit;font-size:12px;color:#6b7280;text-decoration:underline;text-underline-offset:2px;cursor:pointer">Not now</button>' +
      '</div>';
    box.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.style.display !== 'none') close(); });
    document.body.appendChild(box);
    return box;
  }
  function open() {
    build().style.display = 'block';
    var b = box.querySelector('button[data-close]');
    if (b) b.focus();
  }
  function close() { if (box) box.style.display = 'none'; }
  function wire() {
    var hearts = document.querySelectorAll('a[aria-label="Wishlist"]');
    for (var i = 0; i < hearts.length; i++) {
      hearts[i].addEventListener('click', function (e) {
        if (signedIn()) return;   // the link opens wishlist.html as normal
        e.preventDefault();
        open();
      });
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', wire); } else { wire(); }
  window.REVAI_WISHLIST_PROMPT = { open: open, close: close };
})();
