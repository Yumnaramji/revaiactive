/* REVAÍ launch layer: countdown bar + pre-order welcome pop-up (18 Nov 2026).
   One file, no dependencies. Add to a page with:
     <script src="js/launch.js?v=20261118a" defer></script>
   Everything you might want to change is in CONFIG below.
   Preview without the "already seen" memory:  ?rv-popup=1  ?rv-bar=1  (?rv-popup=0 hides it) */
(function () {
  'use strict';

  var CONFIG = {
    launch: '2026-11-27T10:00:00+03:00',   // Fri 27 Nov 2026, 10:00 Nairobi. The +03:00 makes it right in every visitor's time zone.
    launchLabel: 'Friday 27 November',
    popup: true,               // welcome pop-up on / off
    bar: true,                 // countdown bar on / off
    shopUrl: '/collections.html',
    ctaText: 'Shop now',
    signupUrl: '/signup.html',   // small "New here? Create an account" line under the button (Yumna, 18 Nov)
    cta: 'link',                // 'box' outlined button · 'link' underlined words + arrow · 'circle' words + arrow in a ring · 'rule' words between two fine lines
    delayMs: 2500,             // pop-up waits this long after the page loads
    snoozeDays: 3,             // closed with X: don't show again for this many days
    doneDays: 30,              // clicked Shop: don't show again for this many days
    skipPages: /(cart|checkout|login|signup|forgot-password|profile|orders|addresses|wishlist)\.html$/i,
    img: '/images/'            // where the pop-up photos live
  };
  if (window.RV_LAUNCH) for (var k in window.RV_LAUNCH) CONFIG[k] = window.RV_LAUNCH[k];

  var qs = new URLSearchParams(location.search);
  var preview = qs.has('rv-popup') || qs.has('rv-bar');
  if (qs.has('rv-popup')) CONFIG.popup = qs.get('rv-popup') !== '0' && qs.get('rv-popup') !== '';
  if (qs.has('rv-cta')) CONFIG.cta = qs.get('rv-cta');
  if (qs.has('rv-bar')) CONFIG.bar = qs.get('rv-bar') !== '0' && qs.get('rv-bar') !== '';

  var LAUNCH = Date.parse(CONFIG.launch);
  var KEY = 'rv_po_popup_v1';
  function now() { return Date.now(); }
  if (qs.has('rv-now')) { var f2 = Date.parse(qs.get('rv-now')); if (!isNaN(f2)) { var sk = f2 - Date.now(); now = function () { return Date.now() + sk; }; } } // preview only: pretend it is another time
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parts() {
    var ms = Math.max(0, LAUNCH - now());
    var s = Math.floor(ms / 1000);
    return { live: ms <= 0, d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
  }
  var CLOSE = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  /* ---------- styles ---------- */
  var css = '' +
  /* top bar: in the page flow above the fixed header; the header follows it up as you scroll */
  '.rvb{position:relative;z-index:60;height:36px;background:#0a0a0a;color:#fff;font:500 12px/36px Inter,system-ui,sans-serif;text-align:center;overflow:hidden;-webkit-font-smoothing:antialiased}' +
  '.rvb .cd{display:inline-block;letter-spacing:.14em}' +
  '.rvb .n{font-variant-numeric:tabular-nums}' +
  '.rvb .u{color:#8a8a92;margin:0 10px 0 2px}' +
  '.rvb .rv-sr,.rvp .rv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
  '@media(max-width:640px){.rvb{height:34px;line-height:34px;font-size:11.5px}.rvb .u{margin-right:8px}}' +
  /* pop-up: built on the approved WhatsApp image (1080x1080). Everything is sized in cqw (1cqw = 1% of the
     pop-up's width), so logo size, gaps and the 61% black / 39% photo split match that image at any size. */
  '.rvp-bg{position:fixed;inset:0;z-index:200;background:rgba(10,10,10,.55);opacity:0;transition:opacity .35s ease;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}' +
  '.rvp-bg.on{opacity:1}' +
  '.rvp{position:fixed;z-index:201;left:50%;top:50%;width:min(580px,calc(100vw - 48px),calc((100vh - 48px) * .94));container-type:inline-size;transform:translate(-50%,-46%);opacity:0;transition:opacity .4s ease,transform .5s cubic-bezier(.16,1,.3,1);background:#0a0a0a;color:#fff;text-align:center;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}' +
  '.rvp.on{opacity:1;transform:translate(-50%,-50%)}' +
  '.rvp:focus{outline:none}' +
  '.rvp a:focus-visible,.rvp button:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
  '.rvp-x{position:absolute;top:2.2cqw;right:2.2cqw;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:0;background:transparent;color:#fff;cursor:pointer;z-index:3}' +
  /* black part: 660/1080 of the width */
  '.rvp .top{height:61.1cqw;display:flex;flex-direction:column;align-items:center;padding-top:6.9cqw;box-sizing:border-box}' +
  '.rvp .logo{display:block;width:14.6cqw;height:auto}' +
  '.rvp .vl{width:1px;height:5.9cqw;background:#3a3a40;margin:2.5cqw 0 2.6cqw}' +
  '.rvp h2{font-size:max(15px,3.95cqw);font-weight:400;letter-spacing:.24em;margin:0 -.24em 0 0;line-height:1;text-transform:uppercase}' +
  '.rvp .sub{font-size:max(12.5px,2.15cqw);color:#a1a1aa;letter-spacing:.04em;margin:2.2cqw 0 0;line-height:1.3}' +
  '.rvp .steps{display:grid;grid-template-columns:repeat(3,1fr);width:72cqw;list-style:none;padding:0;margin:auto 0 6.5cqw}' +
  '.rvp .steps li{padding:0 1.5cqw;border-left:1px solid #2a2a30;opacity:0;animation:rvin .6s ease forwards}' +
  '.rvp .steps li:first-child{border-left:0}' +
  '.rvp .steps li:nth-child(1){animation-delay:.35s}.rvp .steps li:nth-child(2){animation-delay:.6s}.rvp .steps li:nth-child(3){animation-delay:.85s}' +
  '@keyframes rvin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
  '.rvp .steps small{display:block;font-size:max(9px,1.55cqw);color:#8a8a92;letter-spacing:.2em;margin-bottom:2.2cqw}' +
  '.rvp .steps span{display:block;font-size:max(9px,1.95cqw);letter-spacing:.2em;text-transform:uppercase;color:#e4e4e7;line-height:1.55}' +
  /* photo part: 420/1080 */
  '.rvp .fab{position:relative;height:38.9cqw;background:#111 center/cover no-repeat;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:7cqw;box-sizing:border-box}' +
  '.rvp .fab::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,10,10,.55) 0%,rgba(10,10,10,.25) 45%,rgba(10,10,10,.6) 100%);pointer-events:none}' +
  '.rvp .fab>*{position:relative;z-index:1}' +
  '.rvp .btn{display:inline-flex;align-items:center;justify-content:center;min-width:38cqw;height:max(40px,7.2cqw);padding:0 3.5cqw;box-sizing:border-box;font-size:max(10.5px,1.8cqw);font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.7);background:rgba(10,10,10,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:background .25s,border-color .25s}' +
  '.rvp .btn:hover{background:rgba(255,255,255,.14);border-color:#fff}' +
  /* ways to show the main action without a box */
  '.rvp .btn.cta-link,.rvp .btn.cta-circle,.rvp .btn.cta-rule{min-width:0;height:auto;padding:0;border:0;background:none;-webkit-backdrop-filter:none;backdrop-filter:none;font-size:max(13px,2.5cqw);letter-spacing:.26em;gap:2.2cqw;text-shadow:0 1px 12px rgba(0,0,0,.6)}' +
  '.rvp .btn.cta-link{padding-bottom:1.4cqw;border-bottom:1px solid rgba(255,255,255,.75)}' +
  '.rvp .btn.cta-link svg{transition:transform .25s}.rvp .btn.cta-link:hover{background:none;border-color:#fff}.rvp .btn.cta-link:hover svg{transform:translateX(4px)}' +
  '.rvp .btn.cta-circle i{display:inline-flex;align-items:center;justify-content:center;width:max(34px,6.4cqw);height:max(34px,6.4cqw);border:1px solid rgba(255,255,255,.75);border-radius:50%;transition:background .25s,color .25s}' +
  '.rvp .btn.cta-circle:hover{background:none}.rvp .btn.cta-circle:hover i{background:#fff;color:#0a0a0a}' +
  '.rvp .btn.cta-rule{gap:3cqw}.rvp .btn.cta-rule::before,.rvp .btn.cta-rule::after{content:"";width:9cqw;height:1px;background:rgba(255,255,255,.7);transition:width .25s}' +
  '.rvp .btn.cta-rule:hover{background:none}.rvp .btn.cta-rule:hover::before,.rvp .btn.cta-rule:hover::after{width:12cqw}' +
  '.rvp .acct{margin:2.8cqw 0 0;font-size:max(14px,2.5cqw);color:#d4d4d8;letter-spacing:.03em}' +
  '.rvp .acct a{color:#fff;text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(255,255,255,.5)}' +
  '.rvp .acct a:hover{text-decoration-color:#fff}' +
  '.rvp .base{position:absolute;z-index:1;left:4.4cqw;right:4.4cqw;bottom:4.6cqw;display:flex;justify-content:space-between;margin:0;font-size:max(8.5px,2.15cqw);letter-spacing:.2em;text-transform:uppercase;color:#fff}' +
  /* phones: same layout as a sheet from the bottom */
  '@media(max-width:640px){' +
    '.rvp{left:0;right:0;top:auto;bottom:0;width:100%;transform:translateY(100%)}.rvp.on{transform:none}' +
    '.rvp .top{height:auto;padding-top:7.5cqw}.rvp .logo{width:18cqw}.rvp .vl{height:6cqw;margin:3cqw 0}' +
    '.rvp .sub{margin-top:2.6cqw}.rvp .steps{width:90cqw;margin:6cqw 0 6.5cqw}.rvp .steps small{margin-bottom:2cqw}' +
    '.rvp .fab{height:auto;padding:10cqw 0 calc(19cqw + env(safe-area-inset-bottom))}.rvp .btn{min-width:52cqw}.rvp .acct{margin-top:3.6cqw}' +
    '.rvp .base{bottom:calc(5cqw + env(safe-area-inset-bottom))}' +
  '}' +
  /* laptops: same proportions as the phone sheet (Yumna, 18 Nov), as a centred card */
  '@media(min-width:641px){' +
    '.rvp{width:min(430px,calc(100vw - 48px),calc((100vh - 48px) * .86))}' +
    '.rvp .top{height:auto;padding-top:7.5cqw}.rvp .logo{width:18cqw}.rvp .vl{height:6cqw;margin:3cqw 0}' +
    '.rvp .sub{margin-top:2.6cqw}.rvp .steps{width:90cqw;margin:6cqw 0 6.5cqw}.rvp .steps small{margin-bottom:2cqw}' +
    '.rvp .fab{height:auto;padding:10cqw 0 19cqw}.rvp .base{bottom:5cqw}' +
  '}' +
  '@media(prefers-reduced-motion:reduce){.rvp,.rvp-bg{transition:opacity .2s ease}.rvp{transform:translate(-50%,-50%)}.rvp .steps li{animation:none;opacity:1}}' +
  '@media(prefers-reduced-motion:reduce) and (max-width:640px){.rvp{transform:none}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- countdown text ---------- */
  function barCount(p) {
    return '<span class="n">' + pad(p.d) + '</span><span class="u">D</span>' +
           '<span class="n">' + pad(p.h) + '</span><span class="u">H</span>' +
           '<span class="n">' + pad(p.m) + '</span><span class="u">M</span>' +
           '<span class="n">' + pad(p.s) + '</span><span class="u" style="margin-right:0">S</span>';
  }
  var ariaWhen = 'Countdown to ' + CONFIG.launchLabel + ', 10:00 Nairobi time';

  /* ---------- top bar ---------- */
  var bar = null;
  function buildBar() {
    if (!CONFIG.bar) return;
    var p = parts();
    bar = document.createElement('div');
    bar.className = 'rvb';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Countdown');
    if (p.live) { bar = null; return; }          /* at launch time the bar goes away */
    bar.innerHTML = '<div class="cd" aria-hidden="true">' + barCount(p) + '</div><span class="rv-sr">' + ariaWhen + '</span>';
    document.body.insertBefore(bar, document.body.firstChild);

    /* the site header is fixed at the top; push it below the bar and let it rise as the bar scrolls away */
    var nav = document.getElementById('nav');
    if (nav) {
      var ticking = false;
      var place = function () {
        var h = bar.offsetHeight, t = Math.max(0, h - window.pageYOffset);
        nav.style.top = t + 'px';
        ticking = false;
      };
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(place); } }, { passive: true });
      window.addEventListener('resize', place);
      place();
    }
  }

  /* ---------- pop-up ---------- */
  var pop = null, bg = null, lastFocus = null;
  function shouldShow() {
    if (!CONFIG.popup) return false;
    if (preview) return true;
    if (CONFIG.skipPages.test(location.pathname)) return false;
    if (parts().live) return false;
    var until = parseInt(store(KEY) || '0', 10);
    if (until && until > now()) return false;
    try { var bag = JSON.parse(localStorage.getItem('revai_cart_v1') || '[]'); if (bag && bag.length) return false; } catch (e) {}
    return true;
  }
  function snooze(days) { store(KEY, String(now() + days * 864e5)); }

  var STEPS = ['Place order', 'Pay before dispatch', 'Delivery'];
  function signedIn() { try { return !!localStorage.getItem('revai_customer_token_v1'); } catch (e) { return false; } }

  var ARROW = '<svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M1 5h14M11 1l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function buildPopup() {
    var CTA = CONFIG.ctaText + (CONFIG.cta === 'link' ? ' ' + ARROW : CONFIG.cta === 'circle' ? '<i>' + ARROW + '</i>' : '');
    var steps = STEPS.map(function (t, i) { return '<li><small>0' + (i + 1) + '</small><span>' + t + '</span></li>'; }).join('');
    var html =
      '<button type="button" class="rvp-x" aria-label="Close" data-close>' + CLOSE + '</button>' +
      '<div class="top">' +
        '<img class="logo" src="' + CONFIG.img + 'revai-logo-white.png" alt="REVAÍ" width="433" height="403">' +
        '<div class="vl"></div>' +
        '<h2 id="rvp-t">Welcome to REVAÍ</h2>' +
        '<p class="sub">Pre-orders for Collection 01 are now open</p>' +
        '<ol class="steps" aria-label="How pre-orders work">' + steps + '</ol>' +
      '</div>' +
      '<div class="fab" style="background-image:url(&quot;' + CONFIG.img + 'popup-fabric.jpg&quot;)">' +
        '<a class="btn cta-' + CONFIG.cta + '" data-go href="' + CONFIG.shopUrl + '">' + CTA + '</a>' +
        '<p class="acct">New here? <a href="' + CONFIG.signupUrl + '">Create an account</a></p>' +
        '<p class="base" aria-hidden="true"><span>Premium performance activewear</span><span>Men · Women</span></p>' +
      '</div>';

    bg = document.createElement('div');
    bg.className = 'rvp-bg';
    bg.addEventListener('click', function () { close(true); });
    document.body.appendChild(bg);
    pop = document.createElement('div');
    pop.className = 'rvp';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-labelledby', 'rvp-t');
    pop.tabIndex = -1;
    pop.innerHTML = html;
    document.body.appendChild(pop);

    pop.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close(true);
      else if (e.target.closest('[data-go]')) snooze(CONFIG.doneDays);
    });
    document.addEventListener('keydown', onKey);
    lastFocus = document.activeElement;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      bg.classList.add('on'); pop.classList.add('on'); pop.focus({ preventScroll: true });
    }); });
  }
  function onKey(e) {
    if (!pop) return;
    if (e.key === 'Escape') { close(true); return; }
    if (e.key === 'Tab' && pop.getAttribute('aria-modal')) {
      var f = pop.querySelectorAll('a[href],button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === pop)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function close(remember) {
    if (!pop) return;
    if (remember && !preview) snooze(CONFIG.snoozeDays);
    var p = pop, b = bg; pop = null; bg = null;
    p.classList.remove('on'); if (b) b.classList.remove('on');
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    setTimeout(function () { p.remove(); if (b) b.remove(); }, 450);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ---------- one clock for both ---------- */
  function tick() {
    var p = parts();
    if (bar) {
      if (p.live) { bar.remove(); bar = null; var nv = document.getElementById('nav'); if (nv) nv.style.top = '0px'; }
      else bar.querySelector('.cd').innerHTML = barCount(p);
    }
  }

  function start() {
    buildBar();
    if (shouldShow()) setTimeout(buildPopup, preview ? 300 : CONFIG.delayMs);
    tick();
    setInterval(function () { if (!document.hidden) tick(); }, 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
