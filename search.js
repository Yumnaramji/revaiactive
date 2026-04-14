/* REVAI — Search Overlay
   Exposes window.REVAI_SEARCH.open() / .close()
   ---------------------------------------------------------------- */
(function(){
  'use strict';

  const PRODUCTS = [
    {id:'running-leggings-w',  name:"Women's Running Leggings",    cat:'Running · Women',  price:'KES 6,050'},
    {id:'flared-leggings-w',   name:"Women's Flared Leggings",      cat:'Gym · Women',      price:'KES 6,050'},
    {id:'high-impact-bra',     name:"High-Impact Sports Bra",       cat:'Women',            price:'KES 4,950'},
    {id:'low-impact-bra',      name:"Low-Impact Sports Bra",        cat:'Yoga · Women',     price:'KES 4,950'},
    {id:'jacket-w',            name:"Women's Performance Jacket",   cat:'Running · Women',  price:'KES 7,700'},
    {id:'tshirt-w',            name:"Women's Training T-Shirt",     cat:'Gym · Women',      price:'KES 4,400'},
    {id:'tshirt-m',            name:"Men's Training T-Shirt",       cat:'Gym · Men',        price:'KES 4,400'},
    {id:'quarter-zip-m',       name:"Men's Quarter-Zip",            cat:'Running · Men',    price:'KES 6,050'},
    {id:'shorts-m',            name:"Men's Training Shorts",        cat:'Gym · Men',        price:'KES 6,050'},
    {id:'training-pants-m',  name:"Men's Training Pants",       cat:'Running · Men',    price:'KES 6,600'},
    {id:'crew-socks',          name:"Crew Socks",                   cat:'Accessories',      price:'KES 550'},
    {id:'no-show-socks',       name:"No-Show Socks",                cat:'Accessories',      price:'KES 550'},
    {id:'lifestyle-cap',       name:"Lifestyle Cap",                cat:'Accessories',      price:'KES 4,400'},
    {id:'running-cap',         name:"Running Cap",                  cat:'Accessories',      price:'KES 4,400'},
    {id:'gym-bag',             name:"30L Gym Bag",                  cat:'Accessories',      price:'KES 8,800'},
  ];

  const PAGES = [
    {label:'Collections',        url:'collections.html'},
    {label:'Running',            url:'collection-running.html'},
    {label:'Gym & Training',     url:'collection-gym.html'},
    {label:'Yoga & Pilates',     url:'collection-yoga.html'},
    {label:'Technology',         url:'technology.html'},
    {label:'About',              url:'about.html'},
    {label:'Sustainability',     url:'sustainability.html'},
    {label:'Fit Guide',          url:'fit-guide.html'},
    {label:'Shipping & Returns', url:'shipping-returns.html'},
    {label:'Team Orders',        url:'team-orders.html'},
    {label:'Athlete Program',    url:'athlete-program.html'},
  ];

  /* ── Build overlay DOM ──────────────────────────────────────── */
  function build(){
    if(document.getElementById('revai-search-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'revai-search-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Search');
    overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:9999',
      'background:#fff',
      'overflow-y:auto',
    ].join(';');

    overlay.innerHTML = `
      <style>
        #revai-search-overlay a { text-decoration: none; }
        .rs-row {
          display:flex;align-items:center;gap:20px;
          padding:16px 0;border-bottom:1px solid #f3f4f6;
          transition:opacity .15s;cursor:pointer;
        }
        .rs-row:last-child { border-bottom:none; }
        .rs-row:hover { opacity:.7; }
        .rs-row:hover .rs-arrow { transform:translateX(3px); }
        .rs-arrow { transition:transform .2s; flex-shrink:0; }
        .rs-page-row {
          display:flex;align-items:center;justify-content:space-between;
          padding:13px 0;border-bottom:1px solid #f3f4f6;
          transition:opacity .15s;
        }
        .rs-page-row:last-child { border-bottom:none; }
        .rs-page-row:hover { opacity:.7; }
        .rs-page-row:hover .rs-arrow { transform:translateX(3px); }
      </style>

      <!-- Header bar -->
      <div style="position:sticky;top:0;background:#fff;z-index:10;border-bottom:1px solid #f3f4f6">
        <div style="max-width:860px;margin:0 auto;padding:0 32px;display:flex;align-items:center;gap:16px;height:64px">
          <svg width="18" height="18" fill="none" stroke="#9ca3af" stroke-width="1.75" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input id="revai-search-input" type="search" autocomplete="off" spellcheck="false"
            placeholder="Search products, collections…"
            style="flex:1;border:none;outline:none;font-size:16px;font-family:inherit;font-weight:400;color:#0a0a0a;background:transparent">
          <span id="revai-search-count" style="font-size:12px;color:#9ca3af;white-space:nowrap;display:none;padding-right:8px"></span>
          <button id="revai-search-close" aria-label="Close"
            style="display:flex;align-items:center;gap:6px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:5px 10px;cursor:pointer;color:#6b7280;font-size:12px;font-family:inherit;white-space:nowrap;flex-shrink:0"
            onmouseenter="this.style.borderColor='#000';this.style.color='#000'"
            onmouseleave="this.style.borderColor='#e5e7eb';this.style.color='#6b7280'">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Esc
          </button>
        </div>
      </div>

      <!-- Body -->
      <div style="max-width:860px;margin:0 auto;padding:40px 32px 80px">
        <div id="revai-search-results"></div>
        <div id="revai-search-default">
          <p style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:14px">Popular searches</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['Leggings','Sports Bra','Running','Shorts','Accessories','Gym'].map(t=>
              `<button style="border:1px solid #e5e7eb;border-radius:999px;padding:7px 18px;font-size:13px;font-weight:500;background:#fff;cursor:pointer;font-family:inherit;color:#374151;transition:all .15s"
                onmouseenter="this.style.borderColor='#000';this.style.color='#000'"
                onmouseleave="this.style.borderColor='#e5e7eb';this.style.color='#374151'"
                onclick="document.getElementById('revai-search-input').value='${t}';window.REVAI_SEARCH._run()">${t}</button>`
            ).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('revai-search-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
    document.getElementById('revai-search-input').addEventListener('input', run);
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape') close();
      if((e.key==='k'||e.key==='K') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); open(); }
    });
  }

  /* ── Render results ─────────────────────────────────────────── */
  function run(){
    const q        = (document.getElementById('revai-search-input').value||'').trim().toLowerCase();
    const results  = document.getElementById('revai-search-results');
    const defaults = document.getElementById('revai-search-default');
    const countEl  = document.getElementById('revai-search-count');

    if(!q){
      results.innerHTML = '';
      defaults.style.display = '';
      countEl.style.display = 'none';
      return;
    }
    defaults.style.display = 'none';

    const matched = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q) || p.id.includes(q)
    );
    const pages = PAGES.filter(p => p.label.toLowerCase().includes(q));
    const total = matched.length + pages.length;

    countEl.textContent = total + ' result' + (total===1?'':'s');
    countEl.style.display = total > 0 ? '' : 'none';

    if(total === 0){
      results.innerHTML = `
        <div style="padding:80px 0;text-align:center">
          <p style="font-size:16px;font-weight:600;color:#0a0a0a;margin-bottom:6px">No results for "${escHtml(q)}"</p>
          <p style="font-size:14px;color:#9ca3af">Try searching for something else</p>
        </div>`;
      return;
    }

    let html = '';

    /* ── Products: clean row list ── */
    if(matched.length){
      html += `
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px">
          <p style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin:0">Products</p>
          <a href="collections.html" style="font-size:12px;font-weight:500;color:#9ca3af;text-decoration:none;transition:color .15s"
            onmouseenter="this.style.color='#000'" onmouseleave="this.style.color='#9ca3af'">View all →</a>
        </div>`;

      matched.forEach(p => {
        html += `
          <a href="product.html?id=${p.id}" class="rs-row">
            <div style="width:56px;height:72px;border-radius:8px;overflow:hidden;background:#f3f4f6;flex-shrink:0">
              <img src="images/${p.id}.jpg" alt="${escHtml(p.name)}"
                style="width:100%;height:100%;object-fit:cover;display:block"
                onerror="this.parentElement.style.background='#e5e7eb';this.style.display='none'">
            </div>
            <div style="flex:1;min-width:0">
              <p style="font-size:15px;font-weight:600;color:#0a0a0a;margin:0 0 3px;line-height:1.3">${highlight(p.name, q)}</p>
              <p style="font-size:12px;color:#9ca3af;margin:0">${p.cat}</p>
            </div>
            <p style="font-size:14px;font-weight:700;color:#0a0a0a;margin:0;flex-shrink:0">${p.price}</p>
            <svg class="rs-arrow" width="16" height="16" fill="none" stroke="#d1d5db" stroke-width="1.75" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>`;
      });

      if(pages.length) html += `<div style="height:36px"></div>`;
    }

    /* ── Pages: minimal link list ── */
    if(pages.length){
      html += `<p style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin:0 0 16px">Pages</p>`;
      pages.forEach(p => {
        html += `
          <a href="${p.url}" class="rs-page-row">
            <span style="font-size:14px;font-weight:500;color:#0a0a0a">${highlight(p.label, q)}</span>
            <svg class="rs-arrow" width="14" height="14" fill="none" stroke="#9ca3af" stroke-width="1.75" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>`;
      });
    }

    results.innerHTML = html;
  }

  function highlight(text, q){
    const re = new RegExp('('+escRe(q)+')','gi');
    return escHtml(text).replace(re,'<mark style="background:#fef08a;border-radius:2px;padding:0 1px;color:#0a0a0a">$1</mark>');
  }
  function escHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
  function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

  /* ── Open / Close ───────────────────────────────────────────── */
  function open(){
    build();
    const ol  = document.getElementById('revai-search-overlay');
    const inp = document.getElementById('revai-search-input');
    ol.style.display = 'block';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ inp.focus(); inp.select(); }); });
  }

  function close(){
    const ol = document.getElementById('revai-search-overlay');
    if(ol) ol.style.display = 'none';
    document.body.style.overflow = '';
  }

  window.REVAI_SEARCH = { open, close, _run: run };
})();
