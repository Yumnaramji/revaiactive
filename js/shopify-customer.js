/* ─────────────────────────────────────────────────────────────────
   REVAÍ — Shopify Customer Account module
   Centralises every Storefront-API customer interaction so individual
   pages only need to call high-level helpers (login, signup, etc.).

   Depends on: shopify-config.js (must load first — provides
   window.REVAI_SHOPIFY.{domain, storefrontToken, apiVersion, endpoint})

   Token storage: localStorage key `revai_customer_token_v1`
     { accessToken: string, expiresAt: ISO date string }

   Exposed as window.REVAI_CUSTOMER.
   ───────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  const TOKEN_KEY = 'revai_customer_token_v1';
  const cfg = () => window.REVAI_SHOPIFY;

  /* ── Storage helpers ──────────────────────────────────────────── */
  function getToken(){
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if(!raw) return null;
      const t = JSON.parse(raw);
      if(!t || !t.accessToken) return null;
      if(t.expiresAt && new Date(t.expiresAt) < new Date()){
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return t;
    } catch(e){ return null; }
  }
  function setToken(t){ localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); }
  function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
  function isAuthed(){ return !!getToken(); }

  /* ── Low-level GraphQL caller ─────────────────────────────────── */
  async function gql(query, variables){
    const c = cfg();
    if(!c) throw new Error('shopify-config.js must load before shopify-customer.js');
    const res = await fetch(c.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Storefront-Access-Token': c.storefrontToken
      },
      body: JSON.stringify({ query, variables })
    });
    if(!res.ok) throw new Error('Network error ('+res.status+')');
    const json = await res.json();
    if(json.errors && json.errors.length){
      throw new Error(json.errors[0].message || 'Request failed');
    }
    return json.data;
  }

  function firstUserError(arr){
    if(!arr || !arr.length) return null;
    return arr[0].message || 'Something went wrong.';
  }

  /* ── Auth: signup ─────────────────────────────────────────────── */
  async function signup({ firstName, lastName, email, password, acceptsMarketing }){
    const data = await gql(`
      mutation($input: CustomerCreateInput!){
        customerCreate(input: $input){
          customer { id email firstName lastName }
          customerUserErrors { code field message }
        }
      }
    `, { input: { firstName, lastName, email, password, acceptsMarketing: !!acceptsMarketing } });

    const err = firstUserError(data.customerCreate.customerUserErrors);
    if(err) throw new Error(err);

    // Auto-login after signup
    return await login({ email, password });
  }

  /* ── Auth: login ──────────────────────────────────────────────── */
  async function login({ email, password }){
    const data = await gql(`
      mutation($input: CustomerAccessTokenCreateInput!){
        customerAccessTokenCreate(input: $input){
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { code field message }
        }
      }
    `, { input: { email, password } });

    const err = firstUserError(data.customerAccessTokenCreate.customerUserErrors);
    if(err) throw new Error(err);

    const tok = data.customerAccessTokenCreate.customerAccessToken;
    if(!tok) throw new Error('Login failed — please try again.');
    setToken(tok);
    return tok;
  }

  /* ── Auth: logout ─────────────────────────────────────────────── */
  async function logout(){
    const t = getToken();
    if(!t){ return; }
    try {
      await gql(`
        mutation($customerAccessToken: String!){
          customerAccessTokenDelete(customerAccessToken: $customerAccessToken){
            deletedAccessToken
            userErrors { field message }
          }
        }
      `, { customerAccessToken: t.accessToken });
    } catch(e){ /* swallow — still clear locally */ }
    clearToken();
  }

  /* ── Auth: forgot password ────────────────────────────────────── */
  async function recover(email){
    const data = await gql(`
      mutation($email: String!){
        customerRecover(email: $email){
          customerUserErrors { code field message }
        }
      }
    `, { email });
    const err = firstUserError(data.customerRecover.customerUserErrors);
    if(err) throw new Error(err);
    return true;
  }

  /* ── Customer fetch ───────────────────────────────────────────── */
  async function getCustomer(){
    const t = getToken();
    if(!t) return null;
    const data = await gql(`
      query($t: String!){
        customer(customerAccessToken: $t){
          id
          firstName
          lastName
          email
          phone
          acceptsMarketing
          createdAt
          defaultAddress {
            id firstName lastName address1 address2
            city province zip country countryCodeV2 phone
          }
          addresses(first: 20){
            edges { node {
              id firstName lastName address1 address2
              city province zip country countryCodeV2 phone
            } }
          }
          orders(first: 50, sortKey: PROCESSED_AT, reverse: true){
            edges { node {
              id orderNumber name processedAt financialStatus fulfillmentStatus
              totalPrice { amount currencyCode }
              statusUrl
              lineItems(first: 20){
                edges { node {
                  title quantity
                  variant {
                    id title
                    image { url altText }
                    price { amount currencyCode }
                  }
                } }
              }
            } }
          }
        }
      }
    `, { t: t.accessToken });

    if(!data.customer){
      // Token expired or invalid
      clearToken();
      return null;
    }
    return data.customer;
  }

  /* ── Update customer profile (name, email, phone, password) ──── */
  async function updateCustomer(updates){
    const t = getToken();
    if(!t) throw new Error('Not signed in.');
    const data = await gql(`
      mutation($t: String!, $c: CustomerUpdateInput!){
        customerUpdate(customerAccessToken: $t, customer: $c){
          customer { id firstName lastName email phone }
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { code field message }
        }
      }
    `, { t: t.accessToken, c: updates });
    const err = firstUserError(data.customerUpdate.customerUserErrors);
    if(err) throw new Error(err);
    // Shopify may rotate the access token (e.g. on email/password change)
    if(data.customerUpdate.customerAccessToken){
      setToken(data.customerUpdate.customerAccessToken);
    }
    return data.customerUpdate.customer;
  }

  /* ── Addresses CRUD ───────────────────────────────────────────── */
  async function addAddress(address){
    const t = getToken();
    if(!t) throw new Error('Not signed in.');
    const data = await gql(`
      mutation($t: String!, $a: MailingAddressInput!){
        customerAddressCreate(customerAccessToken: $t, address: $a){
          customerAddress { id }
          customerUserErrors { code field message }
        }
      }
    `, { t: t.accessToken, a: address });
    const err = firstUserError(data.customerAddressCreate.customerUserErrors);
    if(err) throw new Error(err);
    return data.customerAddressCreate.customerAddress;
  }

  async function updateAddress(id, address){
    const t = getToken();
    if(!t) throw new Error('Not signed in.');
    const data = await gql(`
      mutation($t: String!, $id: ID!, $a: MailingAddressInput!){
        customerAddressUpdate(customerAccessToken: $t, id: $id, address: $a){
          customerAddress { id }
          customerUserErrors { code field message }
        }
      }
    `, { t: t.accessToken, id, a: address });
    const err = firstUserError(data.customerAddressUpdate.customerUserErrors);
    if(err) throw new Error(err);
    return data.customerAddressUpdate.customerAddress;
  }

  async function deleteAddress(id){
    const t = getToken();
    if(!t) throw new Error('Not signed in.');
    const data = await gql(`
      mutation($t: String!, $id: ID!){
        customerAddressDelete(customerAccessToken: $t, id: $id){
          deletedCustomerAddressId
          customerUserErrors { code field message }
        }
      }
    `, { t: t.accessToken, id });
    const err = firstUserError(data.customerAddressDelete.customerUserErrors);
    if(err) throw new Error(err);
    return true;
  }

  async function setDefaultAddress(addressId){
    const t = getToken();
    if(!t) throw new Error('Not signed in.');
    const data = await gql(`
      mutation($t: String!, $id: ID!){
        customerDefaultAddressUpdate(customerAccessToken: $t, addressId: $id){
          customer { id }
          customerUserErrors { code field message }
        }
      }
    `, { t: t.accessToken, id: addressId });
    const err = firstUserError(data.customerDefaultAddressUpdate.customerUserErrors);
    if(err) throw new Error(err);
    return true;
  }

  /* ── Route guard helper ───────────────────────────────────────── */
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
    updateCustomer,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    requireAuth,
    redirectIfAuthed
  };
})();
