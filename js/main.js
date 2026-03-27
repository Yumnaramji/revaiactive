// Nav scroll border
const nav = document.getElementById('nav');
if(nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20), {passive:true});

// Mobile menu
const hbg = document.getElementById('hbg');
const mmenu = document.getElementById('mmenu');
const moverlay = document.getElementById('moverlay');
const mclose = document.getElementById('mclose');
function openM(){ if(!mmenu) return; mmenu.classList.add('open'); moverlay.classList.remove('hidden'); hbg.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; }
function closeM(){ if(!mmenu) return; mmenu.classList.remove('open'); moverlay.classList.add('hidden'); hbg.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
if(hbg) hbg.addEventListener('click', openM);
if(mclose) mclose.addEventListener('click', closeM);
if(moverlay) moverlay.addEventListener('click', closeM);
document.querySelectorAll('.mlink').forEach(l => l.addEventListener('click', closeM));

// Scroll reveal
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
}, {threshold:0.1, rootMargin:'0px 0px -50px 0px'});
document.querySelectorAll('.fu').forEach(el => obs.observe(el));

// Stat counters
function countUp(el){
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const dec = el.dataset.decimal === 'true';
  const dur = 1800; const t0 = performance.now();
  function tick(now){
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const val = target * ease;
    el.textContent = (dec ? val.toFixed(1) : (target >= 1000 ? Math.round(val).toLocaleString() : Math.round(val))) + suffix;
    if(p < 1) requestAnimationFrame(tick);
    else el.textContent = (dec ? target.toFixed(1) : (target >= 1000 ? target.toLocaleString() : target)) + suffix;
  }
  requestAnimationFrame(tick);
}
const sobs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting){ countUp(e.target); sobs.unobserve(e.target); } });
}, {threshold:0.5});
document.querySelectorAll('.stat').forEach(el => sobs.observe(el));

// FAQ accordion
document.querySelectorAll('.faq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.parentElement;
    const body = row.querySelector('.faq-body');
    const isOpen = row.classList.contains('open');
    document.querySelectorAll('.faq-row').forEach(r => { r.classList.remove('open'); r.querySelector('.faq-body').classList.remove('open'); r.querySelector('.faq-btn').setAttribute('aria-expanded','false'); });
    if(!isOpen){ row.classList.add('open'); body.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  });
});

// Size selector
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const product = btn.dataset.product;
    document.querySelectorAll(`.size-btn[data-product="${product}"]`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Category filter
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    document.querySelectorAll('#product-grid > div').forEach(card => {
      const cats = card.dataset.category || '';
      card.style.display = (filter === 'all' || cats.includes(filter)) ? '' : 'none';
    });
  });
});

// Cart state
let cart = [];
function cartTotal(){ return cart.reduce((s,i) => s + i.price * i.qty, 0); }
function cartCount(){ return cart.reduce((s,i) => s + i.qty, 0); }

function updateCartBadges(){
  const n = cartCount();
  ['cart-count','cart-count-m'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
  });
  const cci = document.getElementById('cart-item-count');
  const cs = document.getElementById('cart-subtotal');
  const cf = document.getElementById('cart-footer');
  if(cci) cci.textContent = n;
  if(cs) cs.textContent = '$' + cartTotal().toLocaleString();
  if(cf) cf.classList.toggle('hidden', n === 0);
}

function renderCartItems(){
  const container = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  if(!container) return;
  if(cart.length === 0){ if(empty) empty.style.display = ''; return; }
  if(empty) empty.style.display = 'none';
  container.querySelectorAll('.cart-row').forEach(r => r.remove());
  cart.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'cart-row flex gap-4 py-4 border-b border-gray-50';
    row.innerHTML = `<div class="cart-item-img"><div class="w-10 h-10 rounded-lg bg-black flex items-center justify-center"><span class="text-white text-sm font-bold">R</span></div></div><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-black leading-tight mb-1">${item.name}</p><p class="text-xs text-gray-400 mb-3">Size: ${item.size}</p><div class="flex items-center justify-between"><div class="flex items-center gap-2"><button class="qty-btn" data-idx="${idx}" data-action="dec">−</button><span class="text-sm font-medium w-5 text-center">${item.qty}</span><button class="qty-btn" data-idx="${idx}" data-action="inc">+</button></div><span class="text-sm font-bold text-black">$${(item.price * item.qty).toLocaleString()}</span></div></div><button class="self-start text-gray-300 hover:text-black transition-colors ml-1 mt-0.5" data-idx="${idx}" data-action="remove" aria-label="Remove"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg></button>`;
    container.appendChild(row);
  });
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      if(btn.dataset.action === 'inc') cart[i].qty++;
      else if(btn.dataset.action === 'dec'){ cart[i].qty--; if(cart[i].qty <= 0) cart.splice(i,1); }
      else if(btn.dataset.action === 'remove') cart.splice(i,1);
      renderCartItems(); updateCartBadges();
    });
  });
}

document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.prod-card');
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const activeSize = card ? card.querySelector('.size-btn.active') : null;
    const size = activeSize ? activeSize.textContent.trim() : 'M';
    const existing = cart.find(i => i.name === name && i.size === size);
    if(existing) existing.qty++;
    else cart.push({name, price, size, qty:1});
    btn.textContent = '✓ Added';
    btn.style.background = '#166534';
    setTimeout(() => { btn.textContent = 'Add to Cart'; btn.style.background = ''; }, 1200);
    renderCartItems(); updateCartBadges();
    openCart();
  });
});

const cartDrawer = document.getElementById('cart-drawer');
const cartOvl = document.getElementById('cart-overlay');
function openCart(){ if(!cartDrawer) return; cartDrawer.classList.add('open'); cartOvl.classList.remove('hidden'); document.body.style.overflow='hidden'; }
function closeCart(){ if(!cartDrawer) return; cartDrawer.classList.remove('open'); cartOvl.classList.add('hidden'); document.body.style.overflow=''; }
['cart-btn','cart-btn-m'].forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('click', openCart); });
const cc = document.getElementById('cart-close');
const ccont = document.getElementById('cart-continue');
if(cc) cc.addEventListener('click', closeCart);
if(ccont) ccont.addEventListener('click', closeCart);
if(cartOvl) cartOvl.addEventListener('click', closeCart);

// Smooth scroll (anchor links only)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
  });
});

// Reduced motion
if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
  document.querySelectorAll('.fu').forEach(el => el.classList.add('in'));
}

// URL param filter for shop page
(function(){
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if(cat){
    const tab = document.querySelector(`.filter-tab[data-filter="${cat}"]`);
    if(tab){
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('#product-grid > div').forEach(card => {
        const cats = card.dataset.category || '';
        card.style.display = (cats.includes(cat)) ? '' : 'none';
      });
    }
  }
})();
