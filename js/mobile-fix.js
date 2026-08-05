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
  //    a) .scrolled — the frosted/bordered state. On a page with a .chero
  //       photo hero the nav sits transparent over the image, so this must
  //       wait until the hero has scrolled past rather than firing at 20px.
  //    b) .nav-hidden — the bar slides away on scroll-down and returns on any
  //       scroll-up, so it never permanently covers the page. Scroll-up
  //       rather than hover, so it behaves the same on touch.
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
    var lastY = window.pageYOffset;
    var ticking = false;

    function threshold() {
      return hero
        ? Math.max(20, hero.offsetHeight - nav.offsetHeight)
        : 20;
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

    function update() {
      var y = window.pageYOffset;
      if (menuOpen()) {
        nav.classList.remove('nav-hidden');
        ticking = false;
        return;
      }
      if (y > threshold()) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      // Ignore sub-pixel jitter and iOS rubber-banding past the top.
      if (Math.abs(y - lastY) > 6) {
        // Only start hiding once clear of the bar itself, so it doesn't
        // vanish on the first flick of a scroll.
        if (y > lastY && y > nav.offsetHeight * 1.5) {
          nav.classList.add('nav-hidden');
        } else if (y < lastY) {
          nav.classList.remove('nav-hidden');
        }
        lastY = y;
      }
      if (y <= 0) nav.classList.remove('nav-hidden');
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }
})();
