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

    // Pages with no hero (cart, FAQ, legal, product) keep the bar pinned:
    // there is no imagery to protect there, and hiding the only navigation
    // for the length of a long page would cost more than it gains.
    function threshold() {
      return hero
        ? Math.max(20, hero.offsetHeight - nav.offsetHeight)
        : Infinity;
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
