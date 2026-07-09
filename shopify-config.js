// Shopify store: revai-518.myshopify.com
window.REVAI_SHOPIFY = {
  // ── Storefront API config (used by shopify-customer.js, cart, checkout) ──
  domain:           'revai-518.myshopify.com',
  storefrontToken:  'd247325e39b051aeface7e573e550d37',
  apiVersion:       '2024-10',
  get endpoint(){ return `https://${this.domain}/api/${this.apiVersion}/graphql.json`; },

  variants: {
    'running-leggings-w':  { S:'gid://shopify/ProductVariant/47230532223154', M:'gid://shopify/ProductVariant/47230532255922', L:'gid://shopify/ProductVariant/47230532288690', XL:'gid://shopify/ProductVariant/47230532321458', XXL:'gid://shopify/ProductVariant/47230532354226' },
    'flared-leggings-w':   { S:'gid://shopify/ProductVariant/47230532419762', M:'gid://shopify/ProductVariant/47230532452530', L:'gid://shopify/ProductVariant/47230532485298', XL:'gid://shopify/ProductVariant/47230532518066', XXL:'gid://shopify/ProductVariant/47230532550834', 'S (Tall)':'gid://shopify/ProductVariant/47409559371954', 'M (Tall)':'gid://shopify/ProductVariant/47409560027314', 'L (Tall)':'gid://shopify/ProductVariant/47409560780978', 'XL (Tall)':'gid://shopify/ProductVariant/47409561796786', 'XXL (Tall)':'gid://shopify/ProductVariant/47409561895090' },
    'high-impact-bra':     { S:'gid://shopify/ProductVariant/47230532616370', M:'gid://shopify/ProductVariant/47230532649138', L:'gid://shopify/ProductVariant/47230532681906', XL:'gid://shopify/ProductVariant/47230532714674', XXL:'gid://shopify/ProductVariant/47230532747442' },
    'low-impact-bra':      { S:'gid://shopify/ProductVariant/47230532812978', M:'gid://shopify/ProductVariant/47230532845746', L:'gid://shopify/ProductVariant/47230532878514', XL:'gid://shopify/ProductVariant/47230532911282', XXL:'gid://shopify/ProductVariant/47230532944050' },
    'tshirt-w':            { S:'gid://shopify/ProductVariant/47230532976818', M:'gid://shopify/ProductVariant/47230533009586', L:'gid://shopify/ProductVariant/47230533042354', XL:'gid://shopify/ProductVariant/47230533075122', XXL:'gid://shopify/ProductVariant/47230533107890' },
    'jacket-w':            { S:'gid://shopify/ProductVariant/47230533173426', M:'gid://shopify/ProductVariant/47230533206194', L:'gid://shopify/ProductVariant/47230533238962', XL:'gid://shopify/ProductVariant/47230533271730', XXL:'gid://shopify/ProductVariant/47230533304498' },
    'tshirt-m':            { S:'gid://shopify/ProductVariant/47230533370034', M:'gid://shopify/ProductVariant/47230533402802', L:'gid://shopify/ProductVariant/47230533435570', XL:'gid://shopify/ProductVariant/47230533468338', XXL:'gid://shopify/ProductVariant/47230533501106' },
    'quarter-zip-m':       { S:'gid://shopify/ProductVariant/47230533566642', M:'gid://shopify/ProductVariant/47230533599410', L:'gid://shopify/ProductVariant/47230533632178', XL:'gid://shopify/ProductVariant/47230533664946', XXL:'gid://shopify/ProductVariant/47230533697714' },
    'shorts-m':            { S:'gid://shopify/ProductVariant/47230533763250', M:'gid://shopify/ProductVariant/47230533796018', L:'gid://shopify/ProductVariant/47230533828786', XL:'gid://shopify/ProductVariant/47230533861554', XXL:'gid://shopify/ProductVariant/47230533894322' },
    'training-pants-m':    { S:'gid://shopify/ProductVariant/47311661662386', M:'gid://shopify/ProductVariant/47311661695154', L:'gid://shopify/ProductVariant/47311661727922', XL:'gid://shopify/ProductVariant/47311661760690', XXL:'gid://shopify/ProductVariant/47311661793458' },
    'ankle-socks':         { 'S/M':'gid://shopify/ProductVariant/47230793810098', 'L/XL':'gid://shopify/ProductVariant/47230794530994' }
  }
};