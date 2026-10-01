/**
 * REVAÍ customer accounts — WooCommerce edition.
 * Accounts, orders, addresses and password resets now live on shop.revaiactive.com
 * (WooCommerce "My account"). This shim keeps the old REVAI_CUSTOMER API shape so the
 * static pages don't break, and sends the customer to the right shop page.
 */
(function () {
  var W = (window.REVAI_WOO && window.REVAI_WOO.account) || {};
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var map = {
    'login.html': W.login, 'signup.html': W.signup, 'orders.html': W.orders,
    'addresses.html': W.addresses, 'profile.html': W.profile, 'forgot-password.html': W.recover
  };
  function go(url) { if (url) { location.replace(url); } }
  if (map[page]) { go(map[page]); }

  window.REVAI_CUSTOMER = {
    isAuthed: function () { return false; },           // wishlist stays local, no account needed
    requireAuth: function () { go(W.login); },
    redirectIfAuthed: function () {},
    login: function () { go(W.login); return Promise.resolve(); },
    signup: function () { go(W.signup); return Promise.resolve(); },
    logout: function () { go(W.logout); return Promise.resolve(); },
    recover: function () { go(W.recover); return Promise.resolve(); },
    getCustomer: function () { return Promise.resolve(null); },
    updateCustomer: function () { go(W.profile); return Promise.resolve(); },
    addAddress: function () { go(W.addresses); return Promise.resolve(); },
    updateAddress: function () { go(W.addresses); return Promise.resolve(); },
    deleteAddress: function () { go(W.addresses); return Promise.resolve(); },
    setDefaultAddress: function () { go(W.addresses); return Promise.resolve(); }
  };
})();
