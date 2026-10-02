/* ─────────────────────────────────────────────────────────────────
   REVAÍ — Customer Account module (WooCommerce edition)
   Same public API as the old shopify-customer.js, so login.html,
   signup.html, orders.html, profile.html, addresses.html and
   forgot-password.html work unchanged. Talks to the REVAÍ customer
   API on shop.revaiactive.com (REVAÍ Shop plugin, /wp-json/revai/v1).

   Depends on: woo-config.js (window.REVAI_WOO.base)
   Token storage: localStorage key `revai_customer_token_v1`
     { accessToken: string, expiresAt: ISO date string }
   Customer cache: localStorage key `revai_customer_cache_v1` holds the last /me
     answer so profile, orders and addresses paint at once and refresh behind it
     (the shop takes 1-3 s per request). Cleared with the token.

   Exposed as window.REVAI_CUSTOMER.
   ───────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  const TOKEN_KEY = 'revai_customer_token_v1';
  const CACHE_KEY = 'revai_customer_cache_v1';
  const api = () => ((window.REVAI_WOO && window.REVAI_WOO.base) || 'https://shop.revaiactive.com') + '/wp-json/revai/v1/customer';

  /* ── Storage helpers ──────────────────────────────────────────── */
  function getToken(){
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if(!raw) return null;
      const t = JSON.parse(raw);
      if(!t || !t.accessToken) return null;
      if(t.expiresAt && new Date(t.expiresAt) < new Date()){
        clearToken();
        return null;
      }
      return t;
    } catch(e){ return null; }
  }
  function setToken(t){ localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken: t.accessToken, expiresAt: t.expiresAt })); }
  function clearToken(){ localStorage.removeItem(TOKEN_KEY); clearCache(); }
  function cacheCustomer(c){ try { if(c) localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch(e){} }
  function clearCache(){ try { localStorage.removeItem(CACHE_KEY); } catch(e){} }
  function getCachedCustomer(){
    if(!getToken()) return null;
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch(e){ return null; }
  }
  function isAuthed(){ return !!getToken(); }

  /* ── Low-level caller ─────────────────────────────────────────── */
  async function call(method, path, body, auth){
    const headers = { 'Accept': 'application/json' };
    if(body !== undefined) headers['Content-Type'] = 'application/json';
    const t = getToken();
    if(auth !== false && t) headers['X-Revai-Token'] = t.accessToken;
    let res;
    try {
      res = await fetch(api() + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch(e){ throw new Error('Could not reach the shop. Check your connection and try again.'); }
    let json = null;
    try { json = await res.json(); } catch(e){ json = null; }
    if(res.status === 401 && auth !== false){ clearToken(); }
    if(!res.ok){
      const msg = (json && (json.message || (json.data && json.data.message))) || ('Request failed (' + res.status + ')');
      throw new Error(msg);
    }
    return json;
  }

  /* ── Auth ─────────────────────────────────────────────────────── */
  async function signup({ firstName, lastName, email, password, acceptsMarketing }){
    const data = await call('POST', '/signup', { firstName, lastName, email, password, acceptsMarketing: !!acceptsMarketing }, false);
    setToken(data);
    return data.customer;
  }
  async function login({ email, password }){
    const data = await call('POST', '/login', { email, password }, false);
    setToken(data);
    return data.customer;
  }
  async function logout(){
    const t = getToken();
    clearToken();
    if(!t) return;
    try { await fetch(api() + '/logout', { method: 'POST', headers: { 'X-Revai-Token': t.accessToken } }); } catch(e){}
  }
  async function recover(email){
    await call('POST', '/recover', { email }, false);
    return true;
  }

  /* ── Customer ───────────────────────────────────────────────── */
  async function getCustomer(){
    if(!getToken()) return null;
    try {
      const c = await call('GET', '/me');
      cacheCustomer(c);
      return c;
    } catch(e){
      if(!getToken()) return null;   // token was rejected and cleared
      throw e;
    }
  }
  async function updateCustomer(updates){
    if(!getToken()) throw new Error('Not signed in.');
    const data = await call('PUT', '/me', updates);
    if(data.accessToken) setToken(data);   // password changes come back with a fresh token
    clearCache();
    return data.customer;
  }

  /* ── Addresses ────────────────────────────────────────────────── */
  async function addAddress(address){
    if(!getToken()) throw new Error('Not signed in.');
    clearCache();
    return await call('POST', '/addresses', { address });
  }
  async function updateAddress(id, address){
    if(!getToken()) throw new Error('Not signed in.');
    clearCache();
    return await call('PUT', '/addresses/' + encodeURIComponent(id), { address });
  }
  async function deleteAddress(id){
    if(!getToken()) throw new Error('Not signed in.');
    clearCache();
    await call('DELETE', '/addresses/' + encodeURIComponent(id));
    return true;
  }
  async function setDefaultAddress(id){
    if(!getToken()) throw new Error('Not signed in.');
    clearCache();
    await call('POST', '/addresses/' + encodeURIComponent(id) + '/default');
    return true;
  }

  /* ── Route guard helpers ──────────────────────────────────────── */
  function requireAuth(redirectTo){
    if(!isAuthed()){
      const target = redirectTo || 'login.html';
      const back = encodeURIComponent(location.pathname.split('/').pop() || '');
      window.location.href = back ? `${target}?next=${back}` : target;
      return false;
    }
    return true;
  }
  function redirectIfAuthed(target){
    if(isAuthed()){
      window.location.href = target || 'profile.html';
    }
  }

  /* ── Public API ───────────────────────────────────────────────── */
  window.REVAI_CUSTOMER = {
    isAuthed,
    getToken,
    signup,
    login,
    logout,
    recover,
    getCustomer,
    getCachedCustomer,
    updateCustomer,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    requireAuth,
    redirectIfAuthed
  };
})();
