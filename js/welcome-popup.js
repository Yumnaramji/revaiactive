/* REVAÍ welcome pop-up (14 Oct 2026, Yumna).
   Logo on the left (desktop only; phones get a small centred card without it, Yumna), "The next chapter starts with you." + 5% first-order offer + email on the right.
   Shown once per visitor, a few seconds after the page loads; closing it keeps it away for 14 days,
   signing up keeps it away for good. Skipped on sign-in / account / bag pages.
   Add ?popup=1 to any URL to force it open for testing.

   NO BACKEND YET: set WELCOME_ENDPOINT (Mailchimp or similar) before main goes live. While it is empty
   the form says "Sign-up opens soon." It must never show a fake success. */
(function () {
  var WELCOME_ENDPOINT = '';
  var KEY = 'revai_welcome_v1';          // {state:'closed'|'joined', t:<ms>}
  var DELAY_MS = 4000;
  var SNOOZE_DAYS = 14;
  var SKIP = /(login|signup|forgot-password|profile|orders|addresses|wishlist|cart|privacy|terms|accessibility)\.html$/;

  var force = /[?&]popup=1\b/.test(location.search);
  if (!force && SKIP.test(location.pathname)) return;

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function write(state) { try { localStorage.setItem(KEY, JSON.stringify({ state: state, t: Date.now() })); } catch (e) {} }

  if (!force) {
    var r = read();
    if (r && (r.state === 'joined' || (Date.now() - r.t) < SNOOZE_DAYS * 864e5)) return;
  }

  var css =
    '.rwp{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;' +
      'background:rgba(10,10,10,.55);opacity:0;transition:opacity .35s ease}' +
    '.rwp.on{opacity:1}' +
    '.rwp-box{position:relative;display:grid;grid-template-columns:1fr 1.15fr;width:100%;max-width:760px;background:#fff;' +
      'font-family:Inter,system-ui,sans-serif;color:#0a0a0a;transform:translateY(12px);transition:transform .35s ease;overflow:hidden}' +
    '.rwp.on .rwp-box{transform:none}' +
    '.rwp-img{background:#0a0a0a url(/images/story-logo.jpg) center/cover no-repeat;min-height:100%}' +
    '.rwp-body{padding:44px 40px 40px;display:flex;flex-direction:column;justify-content:center}' +
    '.rwp-eyeb{font-size:10px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:#0a0a0a;display:flex;align-items:center;gap:12px}' +
    '.rwp-eyeb i{width:6px;height:6px;border-radius:50%;background:#0a0a0a;display:block}' +
    '.rwp h2{margin:14px 0 0;font-size:26px;font-weight:600;letter-spacing:-.03em;line-height:1.08}' +
    '.rwp-lede{margin:12px 0 0;font-size:14px;line-height:1.65;color:#6b6b6b}' +
    '.rwp-offer{margin-top:22px;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}' +
    '.rwp-offer svg{flex:none}' +
    '.rwp form{margin-top:12px;display:flex;align-items:center;border-bottom:1px solid #0a0a0a}' +
    '.rwp input{flex:1;min-width:0;border:0;outline:0;padding:0;height:42px;font:inherit;font-size:14px;background:transparent;color:#0a0a0a}' +
    '.rwp input::placeholder{color:#9a9a9a}' +
    '.rwp-go{border:0;background:none;color:#0a0a0a;padding:0 0 0 16px;height:42px;display:flex;align-items:center;cursor:pointer}' +
    '.rwp-go:disabled{opacity:.4;cursor:default}' +
    '.rwp-msg{margin:10px 0 0;font-size:12.5px;color:#5a5a5a;min-height:1.2em}' +
    '.rwp-no{margin-top:14px;align-self:flex-start;border:0;background:none;padding:0;font:inherit;font-size:12px;color:#9a9a9a;' +
      'text-decoration:underline;text-underline-offset:3px;cursor:pointer}' +
    '.rwp-no:hover{color:#0a0a0a}' +
    '.rwp-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;background:none;color:#0a0a0a;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center}' +
    '@media(max-width:640px){' +
      '.rwp{padding:16px}' +
      '.rwp-box{grid-template-columns:1fr;max-width:420px}' +
      '.rwp-img{display:none}' +
      '.rwp-body{padding:36px 22px 24px}' +
      '.rwp h2{font-size:22px}' +
    '}' +
    '@media(prefers-reduced-motion:reduce){.rwp,.rwp-box{transition:none}}';

  var html =
    '<div class="rwp-box" role="dialog" aria-modal="true" aria-labelledby="rwp-title">' +
      '<div class="rwp-img" role="img" aria-label="REVAÍ"></div>' +
      '<div class="rwp-body">' +
        '<div class="rwp-eyeb"><i aria-hidden="true"></i>Be here from the beginning</div>' +
        '<h2 id="rwp-title">Be part of REVAÍ.</h2>' +
        '<p class="rwp-lede">Get launch updates, the first look at our collections, and a little something for your first order.</p>' +
        '<div class="rwp-offer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/></svg>5% off your first order.</div>' +
        '<form novalidate>' +
          '<input type="email" name="email" placeholder="Email address" aria-label="Email address" autocomplete="email" required>' +
          '<button type="submit" class="rwp-go" aria-label="Sign up for 5% off"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg></button>' +
        '</form>' +
        '<p class="rwp-msg" role="status" aria-live="polite"></p>' +
        '<button type="button" class="rwp-no">No thanks</button>' +
      '</div>' +
      '<button type="button" class="rwp-x" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '</div>';

  var root, lastFocus, prevOverflow;

  function close(state) {
    if (!root) return;
    write(state || 'closed');
    root.classList.remove('on');
    document.removeEventListener('keydown', onKey);
    document.documentElement.style.overflow = prevOverflow;
    var r = root; root = null;
    setTimeout(function () { r.remove(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }, 350);
  }
  function onKey(e) { if (e.key === 'Escape') close('closed'); }

  function open() {
    if (root || document.querySelector('.rwp')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    root = document.createElement('div'); root.className = 'rwp'; root.innerHTML = html;
    document.body.appendChild(root);
    lastFocus = document.activeElement;
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { root && root.classList.add('on'); });

    var f = root.querySelector('form'), m = root.querySelector('.rwp-msg'), btn = root.querySelector('.rwp-go');
    root.addEventListener('click', function (e) { if (e.target === root) close('closed'); });
    root.querySelector('.rwp-x').addEventListener('click', function () { close('closed'); });
    root.querySelector('.rwp-no').addEventListener('click', function () { close('closed'); });
    document.addEventListener('keydown', onKey);

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = (f.email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { m.textContent = 'Please enter a valid email address.'; return; }
      if (!WELCOME_ENDPOINT) { m.textContent = 'Sign-up opens soon.'; return; }
      btn.disabled = true; m.textContent = '';
      fetch(WELCOME_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em }) })
        .then(function (r) {
          if (!r.ok) throw 0;
          m.textContent = 'You’re in. Check your inbox for your 5% code.';
          write('joined'); f.reset();
          setTimeout(function () { close('joined'); }, 2400);
        })
        .catch(function () { m.textContent = 'Something went wrong. Please try again.'; })
        .then(function () { btn.disabled = false; });
    });
    setTimeout(function () { var i = root && root.querySelector('input'); if (i && window.matchMedia('(min-width:641px)').matches) i.focus({ preventScroll: true }); }, 360);
  }

  function schedule() { setTimeout(open, force ? 300 : DELAY_MS); }
  if (document.readyState === 'complete') schedule(); else window.addEventListener('load', schedule);
})();
