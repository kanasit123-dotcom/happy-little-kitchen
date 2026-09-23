// ร้านของหนู — หน้าจอร้าน (โหลดเฉพาะตอนแตะปุ่มร้าน) ของที่ต้องใช้จากเกมครัวส่งมาทาง api จาก app.js
// หนึ่งออร์เดอร์: ลูกค้าเข้าร้าน → หยิบขนมใส่ถาด → บอกราคา → รับเงิน/ทอนเงิน → ลูกค้าขอบคุณ → ตัดสต็อก + เงินลงกระปุก
// แต่ละออร์เดอร์ฝึกคณิตศาสตร์แค่ 1 จุด (count / collect / change) ตามระดับ — ดู RESTAURANT-MATH-PLAN.md หัวข้อ 0
// ตอบไม่ตรง: สั่นเบาๆ + คำใบ้ (ไม่มีสีแดง ไม่มี ✕ ไม่หักอะไร) ครั้งที่สองเปิดโหมดช่วย (guided) ให้เอง
const V = new URL(import.meta.url).search;
const core = await import(`./core.js${V}`);
const { SHOP_KEY, PRODUCTS, CHANGE_COINS } = core;
const BROKEN_KEY = 'happy-little-kitchen-shop-broken';

// ทุกคำที่ต้องพูดต้องเป็น th: '…' ของตัวเอง — design/voice.py อัดเสียงจากตรงนี้ แล้วเกมต่อคำเป็นประโยค
const TXT = {
  title: { th: 'ร้านของหนู', en: 'My shop' },
  hello: { th: 'สวัสดีจ้า', en: 'Hello!' },
  want: { th: 'ขอ', en: 'May I have' },
  piece: { th: 'ชิ้น', en: '' },
  please: { th: 'นะ', en: 'please' },
  total: { th: 'ทั้งหมด', en: 'That is' },
  baht: { th: 'บาท', en: 'baht' },
  got: { th: 'ได้เงิน', en: 'You got' },
  collect: { th: 'หยิบเหรียญจากกระเป๋า ให้ได้', en: 'Take coins from the purse to make' },
  costs: { th: 'ของราคา', en: 'It costs' },
  gives: { th: 'บาท ลูกค้าให้', en: 'baht. Here is' },
  countFrom: { th: 'นับต่อจาก', en: 'Count on from' },
  upTo: { th: 'ไปให้ถึง', en: 'up to' },
  pick: { th: 'แตะขนมบนชั้น ใส่ถาด', en: 'Tap the food on the shelf to put it on the tray' },
  pickCount: { th: 'แตะขนมบนชั้น ใส่ถาดให้ครบ แล้วแตะส่งให้ลูกค้า', en: 'Put the right number on the tray, then tap give' },
  give: { th: 'ส่งให้ลูกค้า', en: 'Give' },
  help: { th: 'ช่วยหน่อย', en: 'Help me' },
  letsCount: { th: 'มานับไปด้วยกันนะ', en: 'Let us count together' },
  short: { th: 'ยังไม่ครบนะ ลองนับอีกครั้ง', en: 'Not quite yet. Let us count again' },
  over: { th: 'เยอะไปนิด ลองนับอีกครั้งนะ', en: 'A little too many. Count again' },
  moneyShort: { th: 'เงินยังไม่ครบนะ ลองนับอีกครั้ง', en: 'Not enough yet. Count again' },
  moneyOver: { th: 'เยอะไปนิด แตะเหรียญเพื่อหยิบคืนได้นะ', en: 'A bit too much. Tap a coin to take it back' },
  exact: { th: 'พอดีเลย', en: 'Just right!' },
  full: { th: 'ครบแล้ว', en: 'That is all' },
  thanks: { th: 'ขอบคุณนะ', en: 'Thank you!' },
  next: { th: 'ลูกค้าคนต่อไป', en: 'Next customer' },
  welcomeBack: { th: 'มาต่อกันเลย', en: 'Let us carry on' },
  purse: { th: 'กระเป๋าลูกค้า', en: 'Purse' },
  paid: { th: 'ลูกค้าให้', en: 'Customer paid' },
  drawer: { th: 'เหรียญทอน', en: 'Change' },
  bank: { th: 'มีเงินในกระปุก', en: 'Money in the bank' },
  empty: { th: 'ของหมดแล้ว ไปทำเพิ่มกันนะ', en: 'Sold out! Let us cook some more' },
  cookMore: { th: 'ทำเพิ่ม', en: 'Cook more' },
  cookWhich: { th: 'จะทำอะไรเพิ่มดี', en: 'What shall we cook?' },
  shelfFull: { th: 'ชั้นเต็มแล้ว', en: 'The shelf is full' },
  levelUp: { th: 'ร้านเก่งขึ้นแล้ว', en: 'Your shop leveled up!' },
  close: { th: 'ปิด', en: 'Close' },
  one: { th: 'เอ็ด', en: 'one' }
};
// ชื่อสินค้าภาษาอังกฤษแบบหลายชิ้น (ภาษาไทยใช้ชื่อเมนูเดิมของเกมครัว)
const MANY = { cookie: 'cookies', cupcake: 'cupcakes', pizza: 'slices of pizza' };
const ONE = { cookie: 'cookie', cupcake: 'cupcake', pizza: 'slice of pizza' };

let api = null;
let shop = null;
let run = 0;          // เลขรอบของหน้าจอ — ออกจากร้าน/เปลี่ยนภาษาแล้วงาน async เก่าหยุดเอง
let busy = false;     // ระหว่างเล่นแอนิเมชันจบออร์เดอร์ ไม่รับแตะ
let pay = null;       // สิ่งที่วางบนเคาน์เตอร์ตอนรับเงิน/ทอน (ไม่ต้องเก็บ reload แล้วเริ่มขั้นนี้ใหม่)

const $ = (selector) => document.querySelector(`.shop ${selector}`);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const th = () => api.lang() === 'th';
const tx = (key) => TXT[key][api.lang()];
const say = (text) => api.speak(text);
const coinSrc = (value) => `assets/coins/${value === 20 ? 'note20' : value}.png`;
const productName = (id, qty = 1) => (th() ? api.recipeName(id) : (qty > 1 ? MANY[id] : ONE[id]));
// ตัวเลขสำหรับพูด: คลิปมี 0–100 และหลักร้อย/พันถ้วน — 135 พูดเป็น "100 35", 101 พูดเป็น "100 เอ็ด"
function spokenNumber(n) {
  if (!th() || n <= 100) return String(n);
  const parts = [];
  if (n >= 1000) parts.push(String(Math.floor(n / 1000) * 1000));
  if (n % 1000 >= 100) parts.push(String(Math.floor((n % 1000) / 100) * 100));
  const rest = n % 100;
  if (rest === 1) parts.push(TXT.one.th);
  else if (rest) parts.push(String(rest));
  return parts.join(' ');
}

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(SHOP_KEY);
    return core.normalizeShop(raw ? JSON.parse(raw) : null);
  } catch {
    // ข้อมูลร้านเสีย: เก็บของเดิมไว้ดูทีหลัง แล้วเริ่มร้านใหม่ — ไม่แตะเซฟของครัวเด็ดขาด
    try { if (raw) localStorage.setItem(BROKEN_KEY, raw); } catch {}
    return core.freshShop();
  }
}
function save() {
  try { localStorage.setItem(SHOP_KEY, JSON.stringify(shop)); } catch {}
}

// ---------------------------------------------------------------- ประโยค (ไทยต่อจากคลิปทีละวลี อังกฤษใช้เสียงเครื่อง)
const lines = {
  order: (order) => {
    const { recipe, qty } = order.lines[0];
    return th() ? `${tx('want')} ${productName(recipe)} ${qty} ${tx('piece')}` : `${tx('want')} ${qty} ${productName(recipe, qty)}?`;
  },
  wrongItem: (order) => (th() ? `${tx('want')} ${productName(order.lines[0].recipe)} ${tx('please')}` : `${productName(order.lines[0].recipe, 2)}, ${tx('please')}`),
  total: (n) => `${tx('total')} ${n} ${tx('baht')}`,
  got: (n) => `${tx('got')} ${n} ${tx('baht')}`,
  collect: (n) => `${tx('collect')} ${n} ${tx('baht')}`,
  changeIntro: (price, paid) => `${tx('costs')} ${price} ${tx('gives')} ${paid} ${tx('baht')}`,
  changeHow: (price, paid) => `${tx('countFrom')} ${price} ${tx('upTo')} ${paid}${th() ? ` ${tx('please')}` : ''}`,
  bank: (n) => (th() ? `${tx('bank')} ${spokenNumber(n)} ${tx('baht')}` : `${tx('bank')}: ${n} ${tx('baht')}`)
};

function setPrompt(text) {
  const prompt = $('#prompt');
  if (prompt) prompt.textContent = text;
}

// ---------------------------------------------------------------- เปิด/ปิดร้าน
export function open(apiIn) {
  api = apiIn;
  shop = load();
  save();
  renderShell();
  resume();
}

export function rerender() {
  if (!api) return;
  api.stopSpeech();
  renderShell();
  resume();
}

export function leave() {
  run++;
  pay = null;
  busy = false;
  api?.stopSpeech();
  document.querySelector('.shop-layer')?.remove();
}

// เติมสต็อกหลังทำอาหารเสร็จ (เรียกจาก app.js) ครั้งเดียวต่อ restockId
export function restock(recipe, restockId) {
  shop = load();
  const result = core.addStock(shop, recipe, restockId);
  shop = result.shop;
  save();
  return { added: result.added, reason: result.reason, stock: shop.stock[recipe] };
}

export const isProduct = (recipe) => !!PRODUCTS[recipe];

function renderShell() {
  api.app.innerHTML = `<div class="app-shell play-screen shop">
    ${api.topbar(`<img class="title-icon" src="assets/shop/bank.png" alt=""> ${tx('title')}`, true)}
    <div class="prompt" id="prompt"></div>
    <section class="shop-stage">
      <button class="bank" id="bank" aria-label="${tx('bank')}"><img src="assets/shop/bank.png" alt=""><b id="piggy">${shop.piggy}</b></button>
      <div class="customer-spot" id="spot"></div>
    </section>
    <section class="shop-desk" id="desk"></section>
  </div>`;
  api.bindTopbar(() => { leave(); api.showHome(); });
  $('#bank').onclick = () => {
    api.unlockAudio();
    api.tone(700, .12);
    api.flash($('#bank'), 'wave', 600);
    api.stopSpeech();
    say(lines.bank(shop.piggy));
  };
}

function drawCustomer(order, { arrive = false, face = null } = {}) {
  $('#spot').innerHTML = `
    <div class="order-bubble" id="bubble"></div>
    <div class="customer-wrap"><img class="customer ${arrive ? 'arrive' : ''}" id="customer" src="${api.friendSrc(order.customer, face)}" alt="${api.friendName(order.customer)}"><span class="mark" id="mark"></span></div>`;
  drawBubble(order);
}

function drawBubble(order, { price = false, done = false } = {}) {
  const { recipe, qty } = order.lines[0];
  const bubble = $('#bubble');
  if (!bubble) return;
  bubble.classList.toggle('done', done);
  bubble.innerHTML = done
    ? '<span class="heart">♥</span>'
    : `<span class="want">${Array.from({ length: qty }, () => `<img src="${api.dishSrc(recipe)}" alt="">`).join('')}</span>
       <b class="qty">×${qty}</b>
       ${price ? `<span class="price-tag"><img src="assets/shop/pricetag.png" alt=""><b>${order.total}</b></span>` : ''}`;
}

// ปฏิกิริยาลูกค้าเมื่อยังไม่ตรง: ? = ยังขาด, ! = เกิน (ไม่มีหน้าเศร้า ไม่มีสีแดง)
function react(kind) {
  const customer = $('#customer');
  const mark = $('#mark');
  if (!customer || !mark) return;
  mark.textContent = kind === 'over' ? '!' : '?';
  mark.className = `mark show ${kind}`;
  customer.classList.remove('puzzled', 'surprised');
  void customer.offsetWidth;
  customer.classList.add(kind === 'over' ? 'surprised' : 'puzzled');
  setTimeout(() => { mark.className = 'mark'; }, 1800);
}

function nudge(element) {
  if (!element) return;
  element.classList.remove('nudge');
  void element.offsetWidth;
  element.classList.add('nudge');
  api.tone(300, .1);
}

// ---------------------------------------------------------------- วงจรออร์เดอร์
async function resume() {
  const id = ++run;
  busy = false;
  pay = null;
  document.querySelectorAll('.flying-coin').forEach((coin) => coin.remove());
  if (!shop.activeOrder) {
    const order = core.makeOrder(shop, { customers: api.customers() });
    if (!order) return showEmpty(id);
    shop = core.startOrder(shop, order);
    save();
  }
  const order = shop.activeOrder;
  if (order.status === 'arriving') {
    drawCustomer(order, { arrive: true });
    api.sfx.ding();
    setPrompt(lines.order(order));
    await say(tx('hello'));
    if (id !== run) return;
    await say(lines.order(order));
    if (id !== run) return;
    order.status = 'picking';
    save();
  } else {
    drawCustomer(order);
    setPrompt(lines.order(order));
    await say(`${tx('welcomeBack')}`);
    if (id !== run) return;
    await say(lines.order(order));
    if (id !== run) return;
  }
  if (order.status === 'picking') enterPicking(id);
  else enterPaying(id);
}

function enterPicking(id) {
  if (id !== run) return;
  const order = shop.activeOrder;
  renderPicking();
  const prompt = order.checkpoint === 'count' && !order.math.guided ? tx('pickCount') : tx('pick');
  setPrompt(prompt);
  say(prompt);
}

function renderPicking() {
  const order = shop.activeOrder;
  const { recipe, qty } = order.lines[0];
  const counting = order.checkpoint === 'count';
  const slots = !counting || order.math.guided;
  const picked = order.picked;
  const trayItems = slots
    ? Array.from({ length: Math.max(qty, picked.length) }, (_, i) => (picked[i]
      ? `<button class="tray-item slot filled ${i >= qty ? 'extra' : ''}" data-index="${i}" aria-label="${i + 1}"><img src="${api.dishSrc(picked[i])}" alt=""><i>${i + 1}</i></button>`
      : `<span class="slot ${i === picked.length ? 'next' : ''}"><i>${i + 1}</i></span>`)).join('')
    : picked.map((item, i) => `<button class="tray-item" data-index="${i}" aria-label="${i + 1}"><img src="${api.dishSrc(item)}" alt=""></button>`).join('');
  $('#desk').innerHTML = `
    <div class="desk-row">
      <div class="shelf" id="shelf">
        ${Object.keys(PRODUCTS).map((product) => {
          const left = shop.stock[product] - picked.filter((item) => item === product).length;
          return `<button class="stock-card ${left <= 0 ? 'empty' : ''} ${product === recipe ? 'wanted' : ''}" data-product="${product}" aria-label="${productName(product)} ${left}">
            <img src="${api.dishSrc(product)}" alt=""><b>${left}</b></button>`;
        }).join('')}
        <button class="stock-card more" id="cook-more" aria-label="${tx('cookMore')}"><span>＋</span><small>${tx('cookMore')}</small></button>
      </div>
      <div class="tray ${slots ? 'with-slots' : ''}" id="tray"><div class="tray-items">${trayItems}</div></div>
    </div>
    <div class="desk-actions">
      ${counting && !order.math.guided ? `<button class="action-btn help-btn" id="help">💡 ${tx('help')}</button>` : ''}
      ${counting ? `<button class="action-btn primary" id="give" ${picked.length ? '' : 'disabled'}>🤲 ${tx('give')}</button>` : ''}
    </div>`;
  $('#desk').querySelectorAll('[data-product]').forEach((button) => { button.onclick = () => tapProduct(button); });
  $('#desk').querySelectorAll('.tray-item').forEach((button) => { button.onclick = () => takeBack(Number(button.dataset.index)); });
  $('#cook-more').onclick = showCookChoices;
  if ($('#help')) $('#help').onclick = () => askHelp(renderPicking);
  if ($('#give')) $('#give').onclick = giveCounted;
}

function tapProduct(button) {
  if (busy) return;
  api.unlockAudio();
  const order = shop.activeOrder;
  const { recipe, qty } = order.lines[0];
  const product = button.dataset.product;
  if (product !== recipe) {
    nudge(button);
    api.stopSpeech();
    say(lines.wrongItem(order));
    return;
  }
  const left = shop.stock[product] - order.picked.filter((item) => item === product).length;
  if (left <= 0) { nudge(button); return; }
  const cap = order.checkpoint === 'count' && !order.math.guided ? 9 : qty;
  if (order.picked.length >= cap) { nudge($('#tray')); return; }
  order.picked.push(product);
  save();
  api.sfx.plip();
  renderPicking();
  $('#tray .tray-item:last-of-type, #tray .slot.filled:last-of-type')?.classList.add('pop');
  api.stopSpeech();
  const counted = order.picked.length;
  // ถ้าไม่ใช่จุดนับ (หรือเปิดโหมดช่วยแล้ว) ช่องเต็ม = หยิบครบ ไปต่อเอง
  if (order.checkpoint !== 'count' || order.math.guided) {
    if (counted === qty) { say(String(counted)); pickedAll(run); return; }
  }
  say(String(counted));
}

function takeBack(index) {
  if (busy) return;
  const order = shop.activeOrder;
  order.picked.splice(index, 1);
  save();
  api.sfx.swish();
  renderPicking();
  // โหมดช่วย: หยิบของที่เกินคืนจนพอดีช่อง ก็ไปต่อได้เลย
  if (order.math.guided && order.picked.length === order.lines[0].qty) pickedAll(run);
}

function giveCounted() {
  if (busy) return;
  const order = shop.activeOrder;
  const verdict = core.judge(order.lines[0].qty, order.picked.length);
  if (verdict === 'exact') { pickedAll(run); return; }
  miss(verdict, verdict === 'over' ? tx('over') : tx('short'), renderPicking);
}

// ตอบไม่ตรง: ลูกค้าทำหน้าสงสัย/ตกใจ + คำใบ้ ครั้งที่สองเปิดโหมดช่วยให้เอง
function miss(kind, text, redraw) {
  const order = shop.activeOrder;
  order.math.attempts++;
  react(kind);
  api.stopSpeech();
  if (order.math.attempts >= 2 && !order.math.guided) {
    order.math.guided = true;
    save();
    redraw();
    say(`${text} ${tx('letsCount')}`);
    return;
  }
  save();
  redraw();
  say(text);
}

function askHelp(redraw) {
  const order = shop.activeOrder;
  order.math.guided = true;
  order.math.usedHelp = true;
  save();
  api.tone(620, .12);
  redraw();
  api.stopSpeech();
  say(tx('letsCount'));
}

async function pickedAll(id) {
  if (busy) return;
  busy = true;
  const order = shop.activeOrder;
  api.sfx.ding();
  $('#tray')?.classList.add('ready');
  await wait(450);
  if (id !== run) return;
  order.status = 'paying';
  save();
  busy = false;
  enterPaying(id);
}

async function enterPaying(id) {
  if (id !== run) return;
  const order = shop.activeOrder;
  drawBubble(order, { price: true });
  pay = { placed: [], coins: [] };
  const { mode } = order.payment;
  if (mode === 'auto') {
    renderAutoPay(order);
    setPrompt(lines.total(order.total));
    await say(lines.total(order.total));
    if (id !== run) return;
    await wait(300 + order.payment.offered.length * 220);
    if (id !== run) return;
    setPrompt(lines.got(order.total));
    await say(lines.got(order.total));
    if (id !== run) return;
    finish(id);
    return;
  }
  if (mode === 'collect') {
    renderCollect();
    setPrompt(lines.collect(order.total));
    await say(lines.total(order.total));
    if (id !== run) return;
    say(lines.collect(order.total));
    return;
  }
  renderChange();
  setPrompt(lines.changeHow(order.total, order.payment.paid));
  await say(lines.changeIntro(order.total, order.payment.paid));
  if (id !== run) return;
  say(lines.changeHow(order.total, order.payment.paid));
}

const coinHTML = (value, attrs = '') => `<button class="coin v${value}" data-v="${value}" ${attrs} aria-label="${value} ${tx('baht')}"><img src="${coinSrc(value)}" alt=""><b>${value}</b></button>`;

// ระดับ 1: ลูกค้าจ่ายพอดี เงินวางบนเคาน์เตอร์ให้เห็นเฉยๆ
function renderAutoPay(order) {
  $('#desk').innerHTML = `
    <div class="counter-zone wide"><div class="coins" id="counter">
      ${order.payment.offered.map((value, i) => coinHTML(value, `tabindex="-1" style="--d:${i * 220}ms"`)).join('')}
    </div></div>`;
  $('#counter').querySelectorAll('.coin').forEach((coin) => coin.classList.add('drop-in'));
  order.payment.offered.forEach((_, i) => setTimeout(() => api.sfx.clunk(), i * 220));
}

// จ่ายพอดี: หยิบเหรียญจากกระเป๋าลูกค้ามาวางบนเคาน์เตอร์ให้รวมได้เท่าราคา
function renderCollect() {
  const order = shop.activeOrder;
  const purse = order.payment.purse;
  const sum = core.coinSum(pay.placed.map((i) => purse[i]));
  const hint = order.math.guided ? (core.exactSubset(purse.filter((_, i) => !pay.placed.includes(i)), order.total - sum) || []) : [];
  // hint คืน index ในรายการที่ยังไม่ถูกหยิบ → แปลงกลับเป็น index ในกระเป๋า
  const free = purse.map((_, i) => i).filter((i) => !pay.placed.includes(i));
  const hinted = new Set(hint.map((k) => free[k]));
  $('#desk').innerHTML = `
    <div class="money-row">
      <div class="purse-zone"><span class="zone-label"><img src="assets/shop/purse.png" alt="">${tx('purse')}</span><div class="coins" id="purse">
        ${purse.map((value, i) => (pay.placed.includes(i) ? '<span class="coin-gap"></span>' : coinHTML(value, `data-i="${i}"`))).join('')}
      </div></div>
      <div class="counter-zone"><div class="running" id="running">${sum}<small>/${order.total}</small></div><div class="coins" id="counter">
        ${pay.placed.map((i, k) => coinHTML(purse[i], `data-k="${k}"`)).join('')}
      </div></div>
    </div>
    <div class="desk-actions">
      ${order.math.guided ? '' : `<button class="action-btn help-btn" id="help">💡 ${tx('help')}</button>`}
      <button class="action-btn primary" id="give" ${pay.placed.length ? '' : 'disabled'}>🤲 ${tx('full')}</button>
    </div>`;
  $('#purse').querySelectorAll('.coin').forEach((coin) => {
    if (hinted.has(Number(coin.dataset.i))) coin.classList.add('hint');
    coin.onclick = () => placeCoin(Number(coin.dataset.i));
  });
  $('#counter').querySelectorAll('.coin').forEach((coin) => { coin.onclick = () => unplaceCoin(Number(coin.dataset.k)); });
  if ($('#help')) $('#help').onclick = () => askHelp(renderCollect);
  $('#give').onclick = () => {
    if (busy) return;
    const now = core.coinSum(pay.placed.map((i) => purse[i]));
    const verdict = core.judge(order.total, now);
    if (verdict === 'exact') return paid(run);
    miss(verdict, verdict === 'over' ? tx('moneyOver') : tx('moneyShort'), renderCollect);
  };
}

function placeCoin(index) {
  if (busy || pay.placed.includes(index)) return;
  api.unlockAudio();
  const order = shop.activeOrder;
  pay.placed.push(index);
  api.sfx.clunk();
  renderCollect();
  $('#counter .coin:last-child')?.classList.add('pop');
  const sum = core.coinSum(pay.placed.map((i) => order.payment.purse[i]));
  api.stopSpeech();
  const verdict = core.judge(order.total, sum);
  if (verdict === 'exact') { say(String(sum)); paid(run); return; }
  if (verdict === 'over') { miss('over', `${sum} ${tx('moneyOver')}`, renderCollect); return; }
  say(String(sum));
}

function unplaceCoin(k) {
  if (busy) return;
  pay.placed.splice(k, 1);
  api.sfx.swish();
  renderCollect();
}

// ทอนเงินแบบนับต่อ: เริ่มจากราคา วางเหรียญทีละเหรียญ นับขึ้นไปจนถึงเงินที่ลูกค้าให้
function renderChange() {
  const order = shop.activeOrder;
  const price = order.total;
  const target = order.payment.paid;
  const running = price + core.coinSum(pay.coins);
  const suggestion = order.math.guided && running < target ? core.suggestCoin(target - running) : null;
  $('#desk').innerHTML = `
    <div class="money-row">
      <div class="paid-zone"><span class="zone-label">${tx('paid')}</span><div class="coins">${order.payment.offered.map((value) => coinHTML(value, 'tabindex="-1" disabled')).join('')}</div></div>
      <div class="counter-zone"><div class="running" id="running">${running}<small>/${target}</small></div><div class="coins" id="counter">
        ${pay.coins.map((value, k) => coinHTML(value, `data-k="${k}"`)).join('')}
      </div></div>
    </div>
    ${order.math.guided ? `<div class="numberline" id="line" aria-hidden="true"><b>${price}</b>${Array.from({ length: target - price }, (_, i) => `<i class="${price + i + 1 <= running ? 'on' : ''}">${price + i + 1}</i>`).join('')}</div>` : ''}
    <div class="drawer" id="drawer"><span class="zone-label">${tx('drawer')}</span>${CHANGE_COINS.map((value) => coinHTML(value)).join('')}</div>
    <div class="desk-actions">
      ${order.math.guided ? '' : `<button class="action-btn help-btn" id="help">💡 ${tx('help')}</button>`}
      <button class="action-btn primary" id="give" ${pay.coins.length ? '' : 'disabled'}>🤲 ${tx('full')}</button>
    </div>`;
  $('#drawer').querySelectorAll('.coin').forEach((coin) => {
    if (Number(coin.dataset.v) === suggestion) coin.classList.add('hint');
    coin.onclick = () => addChange(Number(coin.dataset.v));
  });
  $('#counter').querySelectorAll('.coin').forEach((coin) => { coin.onclick = () => removeChange(Number(coin.dataset.k)); });
  if ($('#help')) $('#help').onclick = () => askHelp(renderChange);
  $('#give').onclick = () => {
    if (busy) return;
    const verdict = core.judge(target, price + core.coinSum(pay.coins));
    if (verdict === 'exact') return paid(run);
    miss(verdict, verdict === 'over' ? tx('moneyOver') : tx('moneyShort'), renderChange);
  };
}

function addChange(value) {
  if (busy) return;
  api.unlockAudio();
  const order = shop.activeOrder;
  pay.coins.push(value);
  api.sfx.clunk();
  renderChange();
  $('#counter .coin:last-child')?.classList.add('pop');
  const running = order.total + core.coinSum(pay.coins);
  api.stopSpeech();
  const verdict = core.judge(order.payment.paid, running);
  if (verdict === 'exact') { say(String(running)); paid(run); return; }
  if (verdict === 'over') { miss('over', `${running} ${tx('moneyOver')}`, renderChange); return; }
  say(String(running));
}

function removeChange(k) {
  if (busy) return;
  pay.coins.splice(k, 1);
  api.sfx.swish();
  renderChange();
}

async function paid(id) {
  if (busy) return;
  busy = true;
  await wait(250);
  if (id !== run) return;
  api.sfx.ding();
  await say(shop.activeOrder.payment.mode === 'change' ? tx('full') : tx('exact'));
  if (id !== run) return;
  finish(id);
}

// ---------------------------------------------------------------- จบออร์เดอร์: บันทึกครั้งเดียว แล้วค่อยฉลอง
async function finish(id) {
  busy = true;
  const order = shop.activeOrder;
  if (!order) return;
  const settled = { ...order, payment: { ...order.payment, changeCoins: order.payment.mode === 'change' ? [...pay.coins] : [] } };
  const result = core.commitSale(shop, settled);
  if (!result.committed) {
    // สต็อกหายไประหว่างทาง (เช่น ล้างร้านจากหน้าผู้ปกครอง) หรือขายไปแล้ว: ปล่อยลูกค้าไปเงียบๆ แล้วเริ่มใหม่
    shop.activeOrder = null;
    save();
    resume();
    return;
  }
  shop = result.shop;
  save();
  drawCustomer(order, { face: 'love' });
  drawBubble(order, { done: true });
  $('#customer')?.classList.add('happy');
  flyToBank();
  api.confetti();
  setPrompt(tx('thanks'));
  await say(tx('thanks'));
  if (id !== run) return;
  if (result.levelUp) {
    await api.popup(`<img class="popup-friend" src="assets/shop/bank.png" alt=""><h2>⭐ ${tx('levelUp')}</h2>`, tx('levelUp'));
    if (id !== run) return;
  }
  $('#desk').innerHTML = `<div class="desk-actions"><button class="action-btn primary big" id="next">▶ ${tx('next')}</button></div>`;
  $('#next').onclick = () => { api.tone(620); resume(); };
  busy = false;
}

function flyToBank() {
  const bank = $('#bank');
  const from = $('#counter') || $('#desk');
  const piggy = $('#piggy');
  if (!bank || !from) { if (piggy) piggy.textContent = shop.piggy; return; }
  const a = from.getBoundingClientRect();
  const b = bank.getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const coin = document.createElement('img');
    coin.className = 'flying-coin';
    coin.src = coinSrc(i === 1 ? 5 : 1);
    coin.style.left = `${a.left + a.width / 2 - 20 + i * 14}px`;
    coin.style.top = `${a.top + a.height / 2 - 20}px`;
    document.body.appendChild(coin);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      coin.style.transitionDelay = `${i * 120}ms`;
      coin.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2 - i * 14}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.5)`;
      coin.style.opacity = '.3';
    }));
    setTimeout(() => coin.remove(), 1100 + i * 120);
  }
  setTimeout(() => {
    if (piggy) piggy.textContent = shop.piggy;
    bank.classList.remove('pop');
    void bank.offsetWidth;
    bank.classList.add('pop');
    api.sfx.ding();
  }, 900);
}

// ---------------------------------------------------------------- ของหมด / ทำเพิ่ม
function cookCardsHTML() {
  return Object.keys(PRODUCTS).map((product) => {
    const full = !core.canRestock(shop, product);
    return `<button class="cook-card" data-cook="${product}" ${full ? 'disabled' : ''} aria-label="${productName(product)}">
      <img src="${api.dishSrc(product)}" alt=""><b>${full ? tx('shelfFull') : `+${PRODUCTS[product].batch}`}</b><small>${productName(product)} · ${shop.stock[product]}</small></button>`;
  }).join('');
}

function bindCookCards(root) {
  root.querySelectorAll('[data-cook]').forEach((button) => {
    button.onclick = async () => {
      api.unlockAudio();
      api.tone(620);
      const recipe = button.dataset.cook;
      leave();
      await say(api.recipeName(recipe));
      api.startRecipe(recipe, { destination: 'stock', restockId: `restock-${Date.now().toString(36)}` });
    };
  });
}

async function showEmpty(id) {
  const friend = api.customers()[0];
  $('#spot').innerHTML = `
    <div class="order-bubble empty-bubble"><img src="assets/shop/shelf.png" alt=""></div>
    <div class="customer-wrap"><img class="customer arrive" id="customer" src="${api.friendSrc(friend)}" alt=""><span class="mark" id="mark"></span></div>`;
  $('#desk').innerHTML = `<div class="cook-cards">${cookCardsHTML()}</div>`;
  bindCookCards($('#desk'));
  setPrompt(tx('empty'));
  await say(tx('empty'));
  if (id !== run) return;
}

function showCookChoices() {
  if (busy) return;
  api.unlockAudio();
  api.tone(620);
  const layer = document.createElement('div');
  layer.className = 'popup-layer shop-layer';
  layer.innerHTML = `<div class="popup cook-popup"><h2>${tx('cookWhich')}</h2><div class="cook-cards">${cookCardsHTML()}</div>
    <button class="action-btn" id="cook-close">${tx('close')}</button></div>`;
  document.body.appendChild(layer);
  bindCookCards(layer);
  const close = () => layer.remove();
  layer.querySelector('#cook-close').onclick = close;
  layer.addEventListener('click', (event) => { if (event.target === layer) close(); });
  api.stopSpeech();
  say(tx('cookWhich'));
}
