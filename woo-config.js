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

// Wishlist is an account feature (Yumna, final rule 2 Oct 2026). The heart next to the bag in
// the header is hidden in the page markup (data-wish-nav, display:none) and only shown here
// once the customer is signed in. Guests never see it. The only heart a guest sees is the
// Save button on a product page, which opens the sign-in / create-account prompt there
// (#save-auth in product.html). There is no "Wishlist" line in the phone menu.
(function () {
  function signedIn() {
    try {
      var t = JSON.parse(localStorage.getItem("revai_customer_token_v1") || "null");
      return !!(t && t.accessToken && (!t.expiresAt || new Date(t.expiresAt) > new Date()));
    } catch (e) { return false; }
  }
  function apply() {
    if (!signedIn()) return;
    var els = document.querySelectorAll("a[data-wish-nav]");
    for (var i = 0; i < els.length; i++) { els[i].style.display = ""; }
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", apply); } else { apply(); }
})();
