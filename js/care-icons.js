/* REVAÍ care-label symbols — shared by product.html and care-instructions.html.
   Line-drawn to match the symbols printed on the physical care labels (Labels/ folder).
   Each product's set must mirror its own label: garments use GARMENT; accessories
   declare careIcons in product.html's PRODUCTS. */
(function(){
  var TUB='<path d="M3 8 L7.5 27 H32.5 L37 8"/><path d="M5 12 q3.75 -3 7.5 0 t7.5 0 t7.5 0 t7.5 0"/>';
  var TRI='<path d="M20 4 L36 28 H4 Z"/>';
  var SQUARE='<rect x="7" y="3" width="26" height="26"/><circle cx="20" cy="16" r="9"/>';
  var IRON='<path d="M4 26 L8.5 14 H30 C33 14 35 17 35 20 V26 Z"/><path d="M13 14 V9.5 H30 V14"/>';
  var CIRCLE='<circle cx="20" cy="16" r="12"/>';
  function num(n){return '<text x="20" y="24" text-anchor="middle" font-size="9" font-weight="600" font-family="Inter,Arial,sans-serif" fill="currentColor" stroke="none">'+n+'</text>';}

  var ICONS={
    'wash-30-mild':{label:'Machine wash at 30°C, mild cycle',svg:TUB+num(30)+'<path d="M8 30.5 H32"/>'},
    'wash-40':{label:'Machine wash at 40°C',svg:TUB+num(40)},
    'hand-wash':{label:'Hand wash',svg:TUB+'<path d="M13.5 25 V18 a1.5 1.5 0 0 1 3 0 V16 a1.5 1.5 0 0 1 3 0 V15.5 a1.5 1.5 0 0 1 3 0 V17 a1.5 1.5 0 0 1 3 0 V22.5 c0 1.5 -1 2.5 -2.5 2.5 Z"/>'},
    'no-wash':{label:'Do not wash',svg:TUB+'<path d="M5 4 L35 30 M35 4 L5 30"/>'},
    'no-bleach':{label:'Do not bleach',svg:TRI+'<path d="M8 6 L32 29 M32 6 L8 29"/>'},
    'no-tumble-dry':{label:'Do not tumble dry',svg:SQUARE+'<path d="M7 3 L33 29 M33 3 L7 29"/>'},
    'iron-low':{label:'Iron at low heat, maximum 110°C',svg:IRON+'<circle cx="20" cy="20.5" r="1.4" fill="currentColor" stroke="none"/>'},
    'no-iron':{label:'Do not iron',svg:IRON+'<path d="M6 6 L34 30 M34 6 L6 30"/>'},
    'no-dry-clean':{label:'Do not dry clean',svg:CIRCLE+'<path d="M11.5 7.5 L28.5 24.5 M28.5 7.5 L11.5 24.5"/>'}
  };

  function render(key){
    var i=ICONS[key]; if(!i) return '';
    return '<span class="care-icon inline-flex" role="img" aria-label="'+i.label+'" title="'+i.label+'">'+
      '<svg viewBox="0 0 40 32" width="40" height="32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+i.svg+'</svg></span>';
  }

  // Static pages: <span data-care-icon="no-bleach"></span> is filled in on load
  function fill(root){
    (root||document).querySelectorAll('[data-care-icon]').forEach(function(el){el.innerHTML=render(el.getAttribute('data-care-icon'));});
  }

  window.REVAI_CARE={
    icons:ICONS,
    render:render,
    fill:fill,
    // Garment care label (Labels/Care label.jpeg) — every apparel product
    GARMENT:['wash-30-mild','no-bleach','no-tumble-dry','iron-low','no-dry-clean']
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){fill();});
  else fill();
})();
