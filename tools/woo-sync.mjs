// REVAÍ · website -> WooCommerce sync
// The website is the master for product name, description, price and photos.
// This script reads the PRODUCTS block in product.html and the product map in
// woo-config.js, and makes WooCommerce match. It never touches stock, orders,
// sizes, or products that are not in the map, and it never deletes anything.
//
// Run by .github/workflows/woo-sync.yml on every push to main.
// Env: WOO_URL, WOO_KEY, WOO_SECRET (read/write REST key), GITHUB_SHA,
//      DRY_RUN=1 (report only), PARSE_ONLY=1 (no network, print what the site says)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SHOP = (process.env.WOO_URL || 'https://shop.revaiactive.com').replace(/\/$/, '');
const KEY = process.env.WOO_KEY || '';
const SECRET = process.env.WOO_SECRET || '';
const DRY = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const PARSE_ONLY = process.env.PARSE_ONLY === '1';
const SHA = process.env.GITHUB_SHA || 'main';
const RAW = `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY || 'Yumnaramji/revaiactive'}/${SHA}/`;
const MAX_PRICE_CHANGE = 0.25; // a price moving more than 25% is refused and reported

const log = [];
const problems = [];
const say = (s) => { console.log(s); log.push(s); };

// ---------- what the website says ----------
function readSiteProducts() {
  const html = fs.readFileSync(path.join(ROOT, 'product.html'), 'utf8');
  const start = html.indexOf('const PRODUCTS={');
  if (start < 0) throw new Error('product.html: "const PRODUCTS={" not found');
  const end = html.indexOf('\n};', start);
  if (end < 0) throw new Error('product.html: end of PRODUCTS block not found');
  const src = html.slice(start + 'const PRODUCTS='.length, end + 2);
  return vm.runInNewContext('(' + src + ')', {}, { timeout: 2000 });
}
function readWooMap() {
  const js = fs.readFileSync(path.join(ROOT, 'woo-config.js'), 'utf8');
  const map = {};
  const re = /"([a-z0-9-]+)":\s*\{\s*product:\s*(\d+),\s*sizes:\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(js))) {
    const sizes = {};
    for (const s of m[3].matchAll(/"([^"]+)":\s*(\d+)/g)) sizes[s[1]] = Number(s[2]);
    map[m[1]] = { product: Number(m[2]), sizes };
  }
  if (!Object.keys(map).length) throw new Error('woo-config.js: no product map found');
  return map;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function descriptionHtml(p) {
  const items = (p.details || []).map((d) => `<li>${esc(d)}</li>`).join('');
  return `<p>${esc(p.desc || '')}</p>` + (items ? `<ul>${items}</ul>` : '');
}
function fullName(p) {
  // the shop shows the gender in the name where the site name does not already carry it
  return p.name;
}
function imageTag(file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) throw new Error('missing image file: ' + file);
  const sha = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 10);
  return { file, tag: `${path.basename(file)}@${sha}`, src: RAW + file.split('/').map(encodeURIComponent).join('/') };
}
const norm = (s) => String(s || '')
  .replace(/&#8217;|&rsquo;|’/g, "'").replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—')
  .replace(/&amp;/g, '&').replace(/&quot;|&#8220;|&#8221;/g, '"').replace(/&#8243;|&#8242;/g, (x) => (x === '&#8243;' ? '"' : "'"))
  .replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

// ---------- WooCommerce REST ----------
let useQueryAuth = false;
async function woo(method, route, body) {
  const attempt = async () => {
    let url = `${SHOP}/wp-json/wc/v3/${route}`;
    const headers = { 'Content-Type': 'application/json', 'User-Agent': 'revai-woo-sync' };
    if (useQueryAuth) url += (url.includes('?') ? '&' : '?') + `consumer_key=${KEY}&consumer_secret=${SECRET}`;
    else headers.Authorization = 'Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64');
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(180000) });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = null; }
    return { res, json, text };
  };
  let r = await attempt();
  if (r.res.status === 401 && !useQueryAuth) { useQueryAuth = true; r = await attempt(); } // host dropped the Authorization header
  for (let i = 0; i < 2 && r.res.status >= 500; i++) { await new Promise((ok) => setTimeout(ok, 5000)); r = await attempt(); }
  if (!r.res.ok) throw new Error(`${method} ${route} -> ${r.res.status} ${(r.json && r.json.message) || r.text.slice(0, 200)}`);
  return r.json;
}

// ---------- one product ----------
async function syncProduct(key, site, map) {
  const id = map.product;
  const cur = await woo('GET', `products/${id}?context=edit`);
  const changes = [];
  const update = {};

  // name + description
  const wantName = fullName(site);
  if (norm(cur.name) !== norm(wantName)) { update.name = wantName; changes.push(`name: "${norm(cur.name)}" -> "${wantName}"`); }
  // the site owns the opening paragraph and the bullet list; anything the shop has after the list (the Care line) is kept
  const wantDesc = descriptionHtml(site);
  const curDesc = cur.description || '';
  const cut = curDesc.indexOf('</ul>');
  const curHead = cut < 0 ? curDesc : curDesc.slice(0, cut + 5);
  const curTail = cut < 0 ? '' : curDesc.slice(cut + 5);
  if (norm(curHead) !== norm(wantDesc)) { update.description = wantDesc + curTail; changes.push('description updated' + (curTail.trim() ? ' (Care line kept)' : '')); }

  // price
  const want = Number(site.priceVal);
  if (!(want > 0)) throw new Error('site price missing');
  const priceOk = (old) => {
    const o = Number(old);
    if (o > 0 && Math.abs(want - o) / o > MAX_PRICE_CHANGE) {
      problems.push(`${site.name}: price change ${o} -> ${want} is more than ${MAX_PRICE_CHANGE * 100}% and was NOT applied. If it is intended, change it in the shop by hand once.`);
      return false;
    }
    return true;
  };
  const variationUpdates = [];
  if (cur.type === 'variable') {
    const vars = await woo('GET', `products/${id}/variations?per_page=100&context=edit`);
    for (const v of vars) {
      if (Number(v.regular_price) !== want && priceOk(v.regular_price)) variationUpdates.push({ id: v.id, regular_price: String(want) });
    }
    const mapped = Object.values(map.sizes);
    const missing = mapped.filter((vid) => !vars.some((v) => v.id === vid));
    if (missing.length) problems.push(`${site.name}: the website sends sizes to shop variation(s) ${missing.join(', ')} which do not exist on product ${id}. Checkout for those sizes will fail.`);
    if (variationUpdates.length) changes.push(`price -> ${want} on ${variationUpdates.length} size(s)`);
  } else {
    if (Number(cur.regular_price) !== want && priceOk(cur.regular_price)) { update.regular_price = String(want); changes.push(`price: ${cur.regular_price} -> ${want}`); }
    if (Object.keys(map.sizes).length > 1) problems.push(`${site.name}: the website has ${Object.keys(map.sizes).length} sizes but shop product ${id} is type "${cur.type}", not "variable". Sizes cannot be bought until this is fixed in the shop.`);
  }

  // photos: same files, same order, cover first
  const wantImgs = (site.images && site.images.length ? site.images : [site.image]).map(imageTag);
  const have = cur.images || [];
  const byTag = new Map(have.map((im) => [im.name, im.id]));
  const sameOrder = have.length === wantImgs.length && wantImgs.every((w, i) => have[i].name === w.tag);
  const toUpload = wantImgs.filter((w) => !byTag.has(w.tag));
  if (!sameOrder) changes.push(`photos: ${have.length} -> ${wantImgs.length} (${toUpload.length} new upload(s), cover ${path.basename(wantImgs[0].file)})`);

  if (!changes.length) { say(`= ${site.name}: already matches`); return; }
  say(`${DRY ? '~' : '+'} ${site.name} (shop #${id}): ${changes.join('; ')}`);
  if (DRY) return;

  if (!sameOrder) {
    // upload one new photo per request so a slow server never times out, keeping the old gallery until the end
    let gallery = have.map((im) => ({ id: im.id }));
    for (const w of toUpload) {
      const res = await woo('PUT', `products/${id}`, { images: [...gallery, { src: w.src, name: w.tag, alt: site.name }] });
      const added = (res.images || []).find((im) => im.name === w.tag);
      if (!added) throw new Error(`${site.name}: upload of ${w.file} did not come back from the shop`);
      byTag.set(w.tag, added.id);
      gallery = res.images.map((im) => ({ id: im.id }));
    }
    update.images = wantImgs.map((w) => ({ id: byTag.get(w.tag) }));
  }
  if (Object.keys(update).length) await woo('PUT', `products/${id}`, update);
  if (variationUpdates.length) await woo('POST', `products/${id}/variations/batch`, { update: variationUpdates });
}

// ---------- run ----------
const site = readSiteProducts();
const map = readWooMap();
if (PARSE_ONLY) {
  for (const [k, p] of Object.entries(site)) {
    const imgs = (p.images || [p.image]).map(imageTag).map((x) => x.tag);
    console.log(`${k} | shop #${map[k] ? map[k].product : 'NOT MAPPED'} | ${fullName(p)} | ${p.priceVal} | ${imgs.join(', ')}`);
  }
  process.exit(0);
}
if (!KEY || !SECRET) { console.error('WOO_KEY / WOO_SECRET are not set (GitHub repository secrets).'); process.exit(1); }
say(`Website -> WooCommerce sync${DRY ? ' (DRY RUN: nothing is changed)' : ''} · commit ${SHA.slice(0, 7)}`);
for (const [key, p] of Object.entries(site)) {
  if (!map[key]) { say(`- ${p.name}: not in woo-config.js, skipped (new products are set up in the shop by hand first)`); continue; }
  try { await syncProduct(key, p, map[key]); }
  catch (e) { problems.push(`${p.name}: ${e.message}`); }
}
if (problems.length) { say('\nNEEDS ATTENTION:'); problems.forEach((x) => say('! ' + x)); }
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + log.join('\n') + '\n```\n');
process.exit(problems.length ? 1 : 0);
