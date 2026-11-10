/* REVAÍ — Mobile Fix JS
   Runtime patches for mobile-specific bugs:
   - Guards against querySelector('#') SyntaxError when users click
     placeholder anchors (e.g. social media links with href="#")
   - Adds an explicit active-state hook for tap feedback
   ------------------------------------------------------------ */
(function () {
  'use strict';

  // 1. Prevent invalid-selector errors from the inline smooth-scroll handlers
  //    that many pages contain. Any <a href="#"> or href="#!" would throw
  //    SyntaxError inside querySelector, aborting the click. We intercept
  //    those early in the capture phase so they fall through to the default
  //    (or a no-op) instead of throwing.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '#' || href === '#!' || href === '') {
      // Stop the page from jumping to top on empty anchors
      e.preventDefault();
    }
  }, true); // capture phase — runs before the inline handlers

  // 2. Add an .is-touch class on the html element so CSS can target it
  //    explicitly. Matches hover:none / pointer:coarse devices.
  try {
    var mq = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)');
    if (mq && mq.matches) {
      document.documentElement.classList.add('is-touch');
    }
  } catch (err) { /* ignore */ }

  // 3. Nav behaviour — single source of truth for the whole site.
  //    Previously 23 pages carried their own inline scroll listener, product
  //    .html had a third variant and 10 pages relied on js/main.js. They have
  //    all been removed in favour of this, because the collection pages (the
  //    ones with a photo hero) never loaded main.js at all.
  //
  //    Two behaviours:
  //    a) .scrolled — the frosted/bordered state, for the brief overlap
  //       while the bar is still sliding out.
  //    b) .nav-hidden — the bar is visible only while the hero is still
  //       behind it, and slides away for the rest of the page. It is
  //       deliberately NOT restored on scroll-up: direction-based reveal
  //       meant a few pixels of reverse wheel movement popped the bar back
  //       over the product grid. Scroll back to the hero to get it.
  var nav = document.getElementById('nav');
  if (nav) {
    // On a page where the nav sits transparent over a dark hero, the
    // frosted state must wait until that hero has scrolled past - flipping
    // to white at 20px would drop a white bar on top of the photograph.
    // .chero is the photo-hero build; the others are flat dark sections,
    // reached either as <main><section> or as <section id="main">.
    var hero = document.querySelector('.chero');
    if (!hero && document.body.classList.contains('nav-over-hero')) {
      hero = document.querySelector('main > section') ||
             document.getElementById('main');
    }
    var ticking = false;

    // Hero pages: the bar is visible only while the hero is still behind it.
    // Pages with no hero (cart, FAQ, legal, product) used to keep the bar
    // pinned; they now collapse it too, so the header behaves the same way
    // everywhere (8 Aug 2026). Two bar-heights is far enough down that a
    // stray wheel nudge at the top of the page doesn't snap it away.
    function threshold() {
      return hero
        ? Math.max(20, hero.offsetHeight - nav.offsetHeight)
        : nav.offsetHeight * 2;
    }

    // Only 10 pages route the mobile menu through main.js and set
    // body.menu-open; the other 25 have their own inline open/close. What
    // they all share is locking body scroll, so test for that too.
    function menuOpen() {
      if (document.body.classList.contains('menu-open')) return true;
      if (document.body.style.overflow === 'hidden') return true;
      var m = document.getElementById('mmenu');
      return !!(m && m.classList.contains('open'));
    }


    // Header colour follows whatever sits directly behind it (7 Oct 2026, Yumna:
    // "make sure it blends into whatever colour is behind it"). Samples the
    // element just under the bar and copies the first solid background found
    // walking up from it - grey on the grey page tops, white elsewhere. Pages
    // whose bar sits transparent over a dark hero keep that until it scrolls past.
    function solidBg(el) {
      for (; el && el.nodeType === 1; el = el.parentElement) {
        var c = getComputedStyle(el).backgroundColor;
        if (c && c !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(c)) return c;
      }
      return 'rgb(255, 255, 255)';
    }
    // body[data-nav-clear] (homepage, 27 Oct 2026): the bar stays see-through over the top of the page, like
    // nav-over-hero but without the white-on-dark styling, so the hero logo can sit up behind it.
    function blend(past) {
      if ((document.body.classList.contains('nav-over-hero') || document.body.hasAttribute('data-nav-clear')) && !past) {
        nav.style.removeProperty('background-color');
        return;
      }
      var y = nav.offsetHeight + 1, x = Math.round(window.innerWidth / 2);
      var els = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
      var under = null;
      for (var i = 0; i < els.length; i++) {
        var e = els[i];
        if (nav.contains(e) || e.id === 'mmenu' || e.id === 'moverlay' ||
            (e.closest && (e.closest('#mmenu') || e.closest('#moverlay')))) continue;
        under = e; break;
      }
      var col = solidBg(under);
      if (col !== lastBlend) { lastBlend = col; nav.style.setProperty('background-color', col, 'important'); }
    }
    var lastBlend = null, lastBlendAt = 0;
    // Scrolling: sample the colour at most every 120ms (30 Oct 2026, "scrolling is slow"); elementsFromPoint forces layout.
    function blendThrottled(past) {
      var now = performance.now();
      if (now - lastBlendAt < 120) return;
      lastBlendAt = now; blend(past);
    }

    function update() {
      var y = window.pageYOffset;
      if (menuOpen()) {
        nav.classList.remove('nav-hidden');
        document.body.classList.remove('nav-collapsed');
        ticking = false;
        return;
      }
      // Position, not direction. Past the hero the bar is gone and stays
      // gone until the user returns to the hero.
      var past = y > threshold();
      if (past) {
        nav.classList.add('scrolled');
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('scrolled');
        nav.classList.remove('nav-hidden');
      }
      // Mirrored onto <body> so content that offsets itself against the bar
      // can close the gap when the bar leaves — product.html's sticky
      // gallery is the one that needs it.
      document.body.classList.toggle('nav-collapsed', past);
      blendThrottled(past);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener('resize', function () { blend(window.pageYOffset > threshold()); });
    window.addEventListener('load', function () { blend(window.pageYOffset > threshold()); });

    update();
  }
})();


// Slide-in menu, Women / Men categories (5 Nov 2026). On touch screens there is no hover:
// the first tap on Women / Men opens its list, a second tap goes to the whole range.
(function () {
  var touch = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)');
  document.addEventListener('click', function (e) {
    var head = e.target.closest && e.target.closest('.mgrp-head');
    if (!head || !touch || !touch.matches) return;
    var grp = head.parentNode;
    if (grp.classList.contains('open')) return;
    e.preventDefault();
    document.querySelectorAll('.mgrp.open').forEach(function (g) { g.classList.remove('open'); g.firstElementChild.setAttribute('aria-expanded', 'false'); });
    grp.classList.add('open');
    head.setAttribute('aria-expanded', 'true');
  });
})();


// Slide-in menu, keyboard and screen-reader behaviour (10 Nov 2026, UI review). One place for all pages,
// whichever script opens the menu (each page's inline openM/closeM, or js/main.js):
//  - Esc closes it (the bag and search already did)
//  - opening moves focus to the close button; closing hands it back to the menu button
//  - Tab stays inside the menu while it is open
//  - while it is closed its links cannot be reached by Tab or a screen reader (they sit off-screen)
(function () {
  var m = document.getElementById('mmenu'), h = document.getElementById('hbg'), c = document.getElementById('mclose');
  if (!m || !h || !c) return;
  m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Menu');
  // "Open" is read three ways because the pages differ: some add .open, some set aria-expanded on the button,
  // and four (Shop All, Shipping & Returns, Sustainability, Gift Cards) only slide it in with an inline transform.
  function isOpen() {
    return m.classList.contains('open') || h.getAttribute('aria-expanded') === 'true' ||
           /translateX\(0(px)?\)/.test(m.style.transform || '');
  }
  var wasOpen = isOpen();
  function sync() {
    var open = isOpen(), hadFocus = m.contains(document.activeElement);
    if ('inert' in m) m.inert = !open;
    if (open && !wasOpen) setTimeout(function () { if (isOpen()) c.focus(); }, 80);
    if (!open && wasOpen && (hadFocus || document.activeElement === document.body)) h.focus();
    wasOpen = open;
  }
  if (window.MutationObserver) {
    new MutationObserver(sync).observe(m, { attributes: true, attributeFilter: ['class', 'style'] });
    new MutationObserver(sync).observe(h, { attributes: true, attributeFilter: ['aria-expanded'] });
  }
  sync();
  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') { c.click(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(m.querySelectorAll('a[href], button'), function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
