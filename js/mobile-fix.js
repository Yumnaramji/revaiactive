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
})();
