// ร้านของหนู — หน้าจอร้าน (โหลดเฉพาะตอนแตะปุ่มร้าน) ของที่ต้องใช้จากเกมครัวส่งมาทาง api จาก app.js
// หนึ่งออร์เดอร์: ลูกค้าเข้าร้าน → หยิบขนมใส่ถาด → บอกราคา → รับเงิน/ทอนเงิน → ลูกค้าขอบคุณ → ตัดสต็อก + เงินลงกระปุก
// แต่ละออร์เดอร์ฝึกคณิตศาสตร์แค่ 1 จุด (count / collect / change) ตามระดับ — ดู RESTAURANT-MATH-PLAN.md หัวข้อ 0
// ตอบไม่ตรง: สั่นเบาๆ + คำใบ้ (ไม่มีสีแดง ไม่มี ✕ ไม่หักอะไร) ครั้งที่สองเปิดโหมดช่วย (guided) ให้เอง
const V = new URL(import.meta.url).search;
const core = await import(`./core.js${V}`);
const column = await import(`./column.js${V}`);
const { SHOP_KEY, PRODUCTS, CHANGE_COINS, DECOR } = core;
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
  // ระดับ 4–6
  and: { th: 'กับ', en: 'and' },
  thinkPrice: { th: 'คิดราคารวมกันนะ', en: 'Let us add up the price' },
  lookPrice: { th: 'ดูป้ายราคาบนขนมนะ', en: 'Look at the price tags' },
  have: { th: 'มี', en: 'There are' },
  sold: { th: 'ขายไป', en: 'we sold' },
  leftQ: { th: 'เหลือกี่ชิ้น', en: 'how many are left?' },
  left: { th: 'เหลือ', en: 'Left:' },
  altogetherQ: { th: 'รวมเป็นกี่ชิ้น', en: 'how many altogether?' },
  altogether: { th: 'รวมเป็น', en: 'Altogether:' },
  madeMore: { th: 'ทำเพิ่ม', en: 'we made' },
  columnHelp: { th: 'ตั้งลบช่วย', en: 'Work it out' },
  mustGive: { th: 'ต้องทอน', en: 'The change is' },
  one: { th: 'เอ็ด', en: 'one' },
  // ตลาด (เด็กเป็นคนซื้อ)
  market: { th: 'ตลาด', en: 'Market' },
  marketHello: { th: 'สวัสดีจ้า มาซื้อของแต่งร้านกันไหม', en: 'Hello! Would you like something for your shop?' },
  pickGoods: { th: 'แตะของที่อยากได้', en: 'Tap what you would like' },
  priceWord: { th: 'ราคา', en: 'costs' },
  saveMore: { th: 'เก็บเงินอีก', en: 'Save up' },
  myPurse: { th: 'กระเป๋าของหนู', en: 'My purse' },
  payAny: { th: 'แตะเหรียญจ่ายเงินได้เลย', en: 'Tap coins to pay' },
  payExact: { th: 'หยิบเหรียญจ่ายให้พอดี', en: 'Pay exactly' },
  payWith: { th: 'จ่ายด้วย', en: 'Pay with' },
  iGive: { th: 'บาท หนูให้', en: 'baht. I give' },
  howMuch: { th: 'ต้องได้เงินทอนกี่บาทนะ', en: 'How much change should I get?' },
  gotChange: { th: 'ทอน', en: 'Your change is' },
  pay: { th: 'จ่ายเงิน', en: 'Pay' },
  thanksBuy: { th: 'ขอบคุณที่มาซื้อนะ', en: 'Thank you for shopping!' },
  placed: { th: 'เอาไปแต่งร้านแล้ว', en: 'It is in your shop now' },
  stored: { th: 'เก็บเข้ากล่องแล้ว', en: 'Put away in the box' },
  allBought: { th: 'ซื้อครบทุกอย่างแล้ว เก่งมาก', en: 'You bought everything. Well done!' },
  buyMore: { th: 'ซื้ออีก', en: 'Buy more' },
  backShop: { th: 'กลับร้าน', en: 'Back to the shop' }
};
// ชื่อของแต่งร้าน (ต้องมี th ของตัวเองให้ voice.py อัดเสียง)
const DECOR_NAMES = {
  balloons: { th: 'ลูกโป่ง', en: 'Balloons' },
  flowers: { th: 'แจกันดอกไม้', en: 'Flowers' },
  bunting: { th: 'ธงราว', en: 'Bunting' },
  plant: { th: 'ต้นไม้', en: 'Plant' },
  rug: { th: 'พรม', en: 'Rug' },
  lamp: { th: 'โคมไฟ', en: 'Lamp' },
  tablecloth: { th: 'โต๊ะ', en: 'Table' },
  chair: { th: 'เก้าอี้', en: 'Chair' },
  sign: { th: 'ป้ายร้าน', en: 'Shop sign' },
  awning: { th: 'กันสาด', en: 'Awning' }
};
const SELLER = 'squirrel';
// ชื่อสินค้าภาษาอังกฤษแบบหลายชิ้น (ภาษาไทยใช้ชื่อเมนูเดิมของเกมครัว)
const MANY = { cookie: 'cookies', cupcake: 'cupcakes', pizza: 'slices of pizza' };
const ONE = { cookie: 'cookie', cupcake: 'cupcake', pizza: 'slice of pizza' };

let api = null;
let shop = null;
let run = 0;          // เลขรอบของหน้าจอ — ออกจากร้าน/เปลี่ยนภาษาแล้วงาน async เก่าหยุดเอง
let busy = false;     // ระหว่างเล่นแอนิเมชันจบออร์เดอร์ ไม่รับแตะ
let pay = null;       // สิ่งที่วางบนเคาน์เตอร์ตอนรับเงิน/ทอน (ไม่ต้องเก็บ reload แล้วเริ่มขั้นนี้ใหม่)
let view = 'shop';    // 'shop' = ขายของ, 'market' = ไปซื้อของแต่งร้าน
let mathJob = null;   // ตั้งเลขที่เปิดค้างอยู่ (ยกเลิกเมื่อออกจากหน้า)
// งานคณิตที่กำลังทำอยู่ (ออร์เดอร์ในร้าน หรือการซื้อที่ตลาด) — ใช้ร่วมกันตอนตอบไม่ตรง/ขอความช่วยเหลือ
const task = () => (view === 'market' ? shop.activePurchase : shop.activeOrder);

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
const lineWords = (line) => (th() ? `${productName(line.recipe)} ${line.qty} ${tx('piece')}` : `${line.qty} ${productName(line.recipe, line.qty)}`);
const lines = {
  order: (order) => `${tx('want')} ${order.lines.map(lineWords).join(` ${tx('and')} `)}${th() ? '' : '?'}`,
  wrongItem: (order) => (th() ? `${tx('want')} ${order.lines.map((line) => productName(line.recipe)).join(` ${tx('and')} `)} ${tx('please')}` : `${order.lines.map((line) => productName(line.recipe, 2)).join(` ${tx('and')} `)}, ${tx('please')}`),
  remaining: (name, have, sold) => (th() ? `${tx('have')} ${name} ${have} ${tx('piece')} ${tx('sold')} ${sold} ${tx('piece')} ${tx('leftQ')}` : `${tx('have')} ${have} ${name}, ${tx('sold')} ${sold}. ${tx('leftQ')}`),
  restock: (name, before, added) => (th() ? `${tx('have')} ${name} ${before} ${tx('piece')} ${tx('madeMore')} ${added} ${tx('piece')} ${tx('altogetherQ')}` : `${tx('have')} ${before} ${name}, ${tx('madeMore')} ${added} more. ${tx('altogetherQ')}`),
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
  view = 'shop';
  renderShell();
  resume();
}

function stopMath() {
  mathJob?.cancel();
  mathJob = null;
  document.querySelector('.shop-layer')?.remove();
}

export function rerender() {
  if (!api) return;
  api.stopSpeech();
  stopMath();
  if (view === 'market') { openMarket(); return; }
  renderShell();
  resume();
}

export function leave() {
  run++;
  pay = null;
  busy = false;
  stopMath();
  api?.stopSpeech();
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
      <div class="decor-layer" id="decor" aria-hidden="true">${decorHTML()}</div>
      <button class="bank" id="bank" aria-label="${tx('market')}"><img src="assets/shop/bank.png" alt=""><b id="piggy">${shop.piggy}</b><i class="bag"><img src="assets/shop/bag.png" alt=""></i></button>
      <div class="customer-spot" id="spot"></div>
    </section>
    <section class="shop-desk" id="desk"></section>
  </div>`;
  api.bindTopbar(() => { leave(); api.exit(); });
  // กระปุก = ประตูไปตลาด (ซื้อของแต่งร้านด้วยเงินที่ขายได้)
  $('#bank').onclick = () => {
    if (busy) return;
    api.unlockAudio();
    api.tone(700, .12);
    openMarket();
  };
}

function drawCustomer(order, { arrive = false, face = null } = {}) {
  $('#spot').innerHTML = `
    <div class="order-bubble" id="bubble"></div>
    <div class="customer-wrap"><img class="customer ${arrive ? 'arrive' : ''}" id="customer" src="${api.friendSrc(order.customer, face)}" alt="${api.friendName(order.customer)}"><span class="mark" id="mark"></span></div>`;
  drawBubble(order);
}

function drawBubble(order, { price = false, done = false, unitPrices = false } = {}) {
  const bubble = $('#bubble');
  if (!bubble) return;
  bubble.classList.toggle('bubble-done', done);
  if (done) { bubble.innerHTML = '<span class="heart">♥</span>'; return; }
  // คิดราคา: ขนมทุกชิ้นมีป้ายราคาของตัวเอง ให้เห็นว่าบวกอะไรกับอะไร
  const items = order.lines.flatMap((line) => Array.from({ length: line.qty }, () => line));
  bubble.innerHTML = unitPrices
    ? `<span class="want priced">${items.map((line) => `<span class="priced-item"><img src="${api.dishSrc(line.recipe)}" alt=""><b>${line.unitPrice}</b></span>`).join('')}</span>`
    : `${order.lines.map((line) => `<span class="want">${Array.from({ length: line.qty }, () => `<img src="${api.dishSrc(line.recipe)}" alt="">`).join('')}</span><b class="qty">×${line.qty}</b>`).join('')}
       ${price ? `<span class="price-tag"><img src="assets/shop/pricetag.png" alt=""><b>${order.total}</b></span>` : ''}`;
}

// ปฏิกิริยาลูกค้าเมื่อยังไม่ตรง: ? = ยังขาด, ! = เกิน (ไม่มีหน้าเศร้า ไม่มีสีแดง)
function react(kind) {
  const customer = $('#customer');
  const mark = $('#mark');
  if (!customer || !mark) return;
  mark.textContent = kind === 'over' ? '!' : '?';
  mark.className = `mark show mark-${kind}`;
  customer.classList.remove('puzzled', 'surprised');
  void customer.offsetWidth;
  customer.classList.add(kind === 'over' ? 'surprised' : 'puzzled');
  setTimeout(() => { mark.className = 'mark'; }, 1800);
}

function nudge(element) {
  if (!element) return;
  element.classList.remove('shop-nudge');
  void element.offsetWidth;
  element.classList.add('shop-nudge');
  api.tone(300, .1);
}

// ---------------------------------------------------------------- วงจรออร์เดอร์
async function resume() {
  const id = ++run;
  busy = false;
  pay = null;
  document.querySelectorAll('.flying-coin').forEach((coin) => coin.remove());
  if (shop.restockQuiz) { restockQuiz(id); return; }
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
  else if (order.status === 'thinking') enterThinking(id);
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

const wantedCount = (order, product) => order.lines.find((line) => line.recipe === product)?.qty || 0;
const pickedCount = (order, product) => order.picked.filter((item) => item === product).length;
const allPicked = (order) => order.lines.every((line) => pickedCount(order, line.recipe) === line.qty) && order.picked.length === core.orderQty(order);

function renderPicking() {
  const order = shop.activeOrder;
  const qty = core.orderQty(order);
  const counting = order.checkpoint === 'count';
  const slots = !counting || order.math.guided;
  const picked = order.picked;
  const trayItems = slots
    ? Array.from({ length: Math.max(qty, picked.length) }, (_, i) => (picked[i]
      ? `<button class="tray-item tray-slot filled ${i >= qty ? 'extra' : ''}" data-index="${i}" aria-label="${i + 1}"><img src="${api.dishSrc(picked[i])}" alt=""><i>${i + 1}</i></button>`
      : `<span class="tray-slot ${i === picked.length ? 'slot-next' : ''}"><i>${i + 1}</i></span>`)).join('')
    : picked.map((item, i) => `<button class="tray-item" data-index="${i}" aria-label="${i + 1}"><img src="${api.dishSrc(item)}" alt=""></button>`).join('');
  $('#desk').innerHTML = `
    <div class="desk-row">
      <div class="shelf" id="shelf">
        ${Object.keys(PRODUCTS).map((product) => {
          const left = shop.stock[product] - picked.filter((item) => item === product).length;
          return `<button class="stock-card ${left <= 0 ? 'stock-empty' : ''} ${wantedCount(order, product) ? 'wanted' : ''}" data-product="${product}" aria-label="${productName(product)} ${left}">
            <img src="${api.dishSrc(product)}" alt=""><b>${left}</b></button>`;
        }).join('')}
        <button class="stock-card more" id="cook-more" aria-label="${tx('cookMore')}"><span>＋</span><small>${tx('cookMore')}</small></button>
      </div>
      <div class="serve-tray ${slots ? 'with-slots' : ''}" id="tray"><div class="tray-items">${trayItems}</div></div>
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
  const product = button.dataset.product;
  if (!wantedCount(order, product)) {
    nudge(button);
    api.stopSpeech();
    say(lines.wrongItem(order));
    return;
  }
  const left = shop.stock[product] - pickedCount(order, product);
  if (left <= 0) { nudge(button); return; }
  const freeCount = order.checkpoint === 'count' && !order.math.guided;
  if (freeCount ? order.picked.length >= 9 : pickedCount(order, product) >= wantedCount(order, product)) { nudge($('#tray')); return; }
  order.picked.push(product);
  save();
  api.sfx.plip();
  renderPicking();
  $('#tray .tray-item:last-of-type')?.classList.add('shop-bump');
  api.stopSpeech();
  const counted = order.picked.length;
  // ถ้าไม่ใช่จุดนับ (หรือเปิดโหมดช่วยแล้ว) ช่องเต็ม = หยิบครบ ไปต่อเอง
  if (order.checkpoint !== 'count' || order.math.guided) {
    if (allPicked(order)) { say(String(counted)); pickedAll(run); return; }
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
  if (order.math.guided && allPicked(order)) pickedAll(run);
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
  const order = task();
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
  const order = task();
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
  $('#tray')?.classList.add('tray-ready');
  await wait(450);
  if (id !== run) return;
  order.status = ['price', 'remaining'].includes(order.checkpoint) ? 'thinking' : 'paying';
  save();
  busy = false;
  if (order.status === 'thinking') enterThinking(id);
  else enterPaying(id);
}

// ---------------------------------------------------------------- ระดับ 4–6: คิดราคา (ตั้งเลข) / ของเหลือบนชั้น (นับรูป)
async function enterThinking(id) {
  if (id !== run) return;
  const order = shop.activeOrder;
  if (order.checkpoint === 'remaining') {
    renderRemaining();
    say(lines.remaining(productName(order.lines[0].recipe, 2), order.math.problem.a, order.math.problem.b));
    return;
  }
  drawBubble(order, { unitPrices: true });
  setPrompt(tx('thinkPrice'));
  $('#desk').innerHTML = '';
  await say(tx('thinkPrice'));
  if (id !== run) return;
  mathJob = column.solveColumn($('#desk'), { problem: order.math.problem, mode: order.math.guided ? 'guided' : 'independent' }, mathHooks());
  const result = await mathJob.done;
  mathJob = null;
  if (id !== run || !result.completed) return;
  order.math.usedHelp = order.math.usedHelp || result.usedHelp;
  order.math.attempts = Math.max(order.math.attempts, result.attempts);
  order.status = 'paying';
  save();
  enterPaying(id);
}

// ของที่ตั้งเลขต้องใช้จากร้าน (เสียง ข้อความ เสียงประกอบ และปฏิกิริยาลูกค้าตอนตอบไม่ตรง)
function mathHooks() {
  return {
    lang: api.lang,
    speak: say,
    stopSpeech: api.stopSpeech,
    setPrompt,
    tone: api.tone,
    sfx: { tap: api.sfx.tick, ding: api.sfx.ding, clunk: api.sfx.clunk, plip: api.sfx.plip, swish: api.sfx.swish },
    onMiss: (kind, attempts) => {
      react(kind);
      const order = task();
      if (order) { order.math.attempts = Math.max(order.math.attempts, attempts); save(); }
      return attempts === 1 && order?.checkpoint === 'price' ? tx('lookPrice') : null;
    }
  };
}

// รูปของบนชั้น: ชิ้นที่ขายไปจางลง (อยู่บนถาดแล้ว) โหมดช่วยมีเลขกำกับชิ้นที่เหลือ
function picturesHTML(recipe, count, { faded = 0, fresh = 0, numbered = false } = {}) {
  let n = 0;
  return `<div class="count-row">${Array.from({ length: count }, (_, i) => {
    const gone = i < faded;
    const isNew = i >= count - fresh;
    const label = numbered && !gone ? `<i>${++n}</i>` : '';
    return `<span class="pic ${gone ? 'gone' : ''} ${isNew ? 'fresh' : ''}"><img src="${api.dishSrc(recipe)}" alt="">${label}</span>`;
  }).join('')}</div>`;
}

function renderRemaining() {
  const order = shop.activeOrder;
  const { a: have, b: sold } = order.math.problem;
  const recipe = order.lines[0].recipe;
  setPrompt(`${have} − ${sold} = ?`);
  $('#desk').innerHTML = `
    ${picturesHTML(recipe, have, { faded: sold, numbered: order.math.guided })}
    <div class="choices" id="choices">${order.math.choices.map((n) => `<button class="choice" data-n="${n}">${n}</button>`).join('')}</div>`;
  $('#desk').querySelectorAll('[data-n]').forEach((button) => { button.onclick = () => answerRemaining(Number(button.dataset.n), button); });
}

async function answerRemaining(n, button) {
  if (busy) return;
  const order = shop.activeOrder;
  const answer = order.math.problem.a - order.math.problem.b;
  api.stopSpeech();
  if (n !== answer) {
    nudge(button);
    miss(n < answer ? 'short' : 'over', tx('short'), renderRemaining);
    return;
  }
  busy = true;
  const id = run;
  api.sfx.ding();
  button.classList.add('right');
  await say(`${tx('left')} ${answer} ${tx('piece')}`);
  if (id !== run) return;
  order.status = 'paying';
  save();
  busy = false;
  enterPaying(id);
}

// ระดับ 4 ขึ้นไป: กลับจากทำอาหาร ถามว่ารวมเป็นกี่ชิ้น (ไม่ใช่ออร์เดอร์ จึงไม่นับเป็นจุดคำนวณของลูกค้า)
function restockQuiz(id) {
  const quiz = shop.restockQuiz;
  const total = quiz.before + quiz.added;
  const choices = core.numberChoices(total);
  let misses = 0;
  $('#spot').innerHTML = `<div class="order-bubble"><img class="bubble-item" src="${api.dishSrc(quiz.recipe)}" alt=""><b class="qty">+${quiz.added}</b></div>`;
  const draw = () => {
    $('#desk').innerHTML = `
      ${picturesHTML(quiz.recipe, total, { fresh: quiz.added, numbered: misses >= 2 })}
      <div class="choices" id="choices">${choices.map((n) => `<button class="choice" data-n="${n}">${n}</button>`).join('')}</div>`;
    $('#desk').querySelectorAll('[data-n]').forEach((button) => {
      button.onclick = async () => {
        if (busy || id !== run) return;
        const n = Number(button.dataset.n);
        api.stopSpeech();
        if (n !== total) {
          misses++;
          nudge(button);
          draw();
          say(misses >= 2 ? `${tx('short')} ${tx('letsCount')}` : tx('short'));
          return;
        }
        busy = true;
        api.sfx.ding();
        button.classList.add('right');
        await say(`${tx('altogether')} ${total} ${tx('piece')}`);
        busy = false;
        if (id !== run) return;
        shop.restockQuiz = null;
        save();
        resume();
      };
    });
  };
  draw();
  const question = lines.restock(productName(quiz.recipe, 2), quiz.before, quiz.added);
  setPrompt(`${quiz.before} + ${quiz.added} = ?`);
  say(question);
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
      <div class="counter-zone"><div class="shop-running" id="running">${sum}<small>/${order.total}</small></div><div class="coins" id="counter">
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
  $('#counter .coin:last-child')?.classList.add('shop-bump');
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
  const suggestion = order.math.guided && running < target ? core.suggestCoin(target - running, drawerCoins(order)) : null;
  $('#desk').innerHTML = `
    <div class="money-row">
      <div class="paid-zone"><span class="zone-label">${tx('paid')}</span><div class="coins">${order.payment.offered.map((value) => coinHTML(value, 'tabindex="-1" disabled')).join('')}</div></div>
      <div class="counter-zone"><div class="shop-running" id="running">${running}<small>/${target}</small></div><div class="coins" id="counter">
        ${pay.coins.map((value, k) => coinHTML(value, `data-k="${k}"`)).join('')}
      </div></div>
    </div>
    ${order.math.guided ? `<div class="numberline" id="line" aria-hidden="true"><b>${price}</b>${Array.from({ length: target - price }, (_, i) => `<i class="${price + i + 1 <= running ? 'on' : ''}">${price + i + 1}</i>`).join('')}</div>` : ''}
    <div class="drawer" id="drawer"><span class="zone-label">${tx('drawer')}</span>${drawerCoins(order).map((value) => coinHTML(value)).join('')}</div>
    <div class="desk-actions">
      ${order.math.guided ? '' : `<button class="action-btn help-btn" id="help">💡 ${tx('help')}</button>`}
      ${order.math.guided && target >= 20 ? `<button class="action-btn help-btn" id="col-sub">✏️ ${tx('columnHelp')}</button>` : ''}
      <button class="action-btn primary" id="give" ${pay.coins.length ? '' : 'disabled'}>🤲 ${tx('full')}</button>
    </div>`;
  $('#drawer').querySelectorAll('.coin').forEach((coin) => {
    if (Number(coin.dataset.v) === suggestion) coin.classList.add('hint');
    coin.onclick = () => addChange(Number(coin.dataset.v));
  });
  $('#counter').querySelectorAll('.coin').forEach((coin) => { coin.onclick = () => removeChange(Number(coin.dataset.k)); });
  if ($('#help')) $('#help').onclick = () => askHelp(renderChange);
  if ($('#col-sub')) $('#col-sub').onclick = () => columnPopup({ a: target, op: '-', b: price });
  $('#give').onclick = () => {
    if (busy) return;
    const verdict = core.judge(target, price + core.coinSum(pay.coins));
    if (verdict === 'exact') return paid(run);
    miss(verdict, verdict === 'over' ? tx('moneyOver') : tx('moneyShort'), renderChange);
  };
}

// ลิ้นชักทอน: เหรียญ 1 2 5 (ลูกค้าให้แบงก์ 20 มีเหรียญ 10 ด้วย)
const drawerCoins = (order) => (order.payment.paid >= 20 ? [...CHANGE_COINS, 10] : CHANGE_COINS);

// ตั้งลบช่วย (ระดับ 5 ขึ้นไป): เปิดตั้งเลขแบบทีละหลักในหน้าต่างซ้อน แล้วกลับมาทอนต่อ
async function columnPopup(problem) {
  if (busy || mathJob) return;
  api.tone(620);
  const layer = document.createElement('div');
  layer.className = 'popup-layer shop-layer';
  layer.innerHTML = '<div class="popup column-popup"><div id="col-host"></div></div>';
  document.body.appendChild(layer);
  api.stopSpeech();
  const id = run;
  mathJob = column.solveColumn(layer.querySelector('#col-host'), { problem, mode: 'guided' }, mathHooks());
  const result = await mathJob.done;
  mathJob = null;
  layer.remove();
  if (id !== run || !result.completed) return;
  const order = shop.activeOrder;
  order.math.usedHelp = true;
  save();
  setPrompt(lines.changeHow(order.total, order.payment.paid));
  say(`${tx('mustGive')} ${result.answer} ${tx('baht')}`);
}

function addChange(value) {
  if (busy) return;
  api.unlockAudio();
  const order = shop.activeOrder;
  pay.coins.push(value);
  api.sfx.clunk();
  renderChange();
  $('#counter .coin:last-child')?.classList.add('shop-bump');
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
  $('#desk').innerHTML = `<div class="desk-actions"><button class="action-btn primary btn-big" id="next">▶ ${tx('next')}</button></div>`;
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
    bank.classList.remove('shop-bump');
    void bank.offsetWidth;
    bank.classList.add('shop-bump');
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

// ---------------------------------------------------------------- ของแต่งร้าน (วางตามจุดที่กำหนดของแต่ละชิ้น)
function decorHTML() {
  return Object.keys(DECOR).filter((id) => shop.decor.placed[id]).map((id) => `<img class="decor decor-${id}" src="assets/decor/${id}.png" alt="">`).join('');
}
const decorName = (id) => DECOR_NAMES[id][api.lang()];

// ---------------------------------------------------------------- ตลาด: เด็กเป็นคนซื้อ จ่ายเงิน รับเงินทอน
function openMarket() {
  stopMath();
  run++;
  pay = null;
  busy = false;
  view = 'market';
  api.stopSpeech();
  document.querySelectorAll('.flying-coin').forEach((coin) => coin.remove());
  api.app.innerHTML = `<div class="app-shell play-screen shop market">
    ${api.topbar(`<img class="title-icon" src="assets/shop/bag.png" alt=""> ${tx('market')}`, true)}
    <div class="prompt" id="prompt"></div>
    <section class="shop-stage">
      <div class="bank" aria-hidden="true"><img src="assets/shop/bank.png" alt=""><b id="piggy">${shop.piggy}</b></div>
      <div class="customer-spot" id="spot">
        <div class="order-bubble" id="bubble"></div>
        <div class="customer-wrap"><img class="customer arrive" id="customer" src="${api.friendSrc(SELLER)}" alt=""><span class="mark" id="mark"></span></div>
      </div>
    </section>
    <section class="shop-desk" id="desk"></section>
  </div>`;
  api.bindTopbar(backToShop);
  if (shop.activePurchase) enterPurchase(run);
  else showGoods(run, true);
}

function backToShop() {
  run++;
  pay = null;
  busy = false;
  view = 'shop';
  api.stopSpeech();
  renderShell();
  resume();
}

async function showGoods(id, greet = false) {
  if (id !== run) return;
  busy = false;
  pay = null;
  $('#customer').src = api.friendSrc(SELLER);
  $('#bubble').innerHTML = '<img class="bubble-icon" src="assets/shop/bag.png" alt="">';
  const everything = Object.keys(DECOR).every((item) => shop.decor.owned.includes(item));
  $('#desk').innerHTML = `<div class="goods">${Object.entries(DECOR).map(([item, { price }]) => {
    const owned = shop.decor.owned.includes(item);
    return `<button class="goods-card ${owned ? 'owned' : ''} ${owned && !shop.decor.placed[item] ? 'stored' : ''} ${!owned && shop.piggy < price ? 'dear' : ''}" data-item="${item}" aria-label="${decorName(item)}">
      <img src="assets/decor/${item}.png" alt="">${owned ? '<i class="owned-mark">✓</i>' : `<span class="price-chip">${price}</span>`}</button>`;
  }).join('')}</div>
    <div class="desk-actions"><button class="action-btn" id="to-shop">🏪 ${tx('backShop')}</button></div>`;
  $('#desk').querySelectorAll('[data-item]').forEach((button) => { button.onclick = () => tapGoods(button); });
  $('#to-shop').onclick = () => { api.tone(620); backToShop(); };
  const prompt = everything ? tx('allBought') : tx('pickGoods');
  setPrompt(prompt);
  if (greet) {
    await say(tx('marketHello'));
    if (id !== run) return;
    await say(lines.bank(shop.piggy));
    if (id !== run) return;
  }
  say(prompt);
}

function tapGoods(button) {
  if (busy) return;
  api.unlockAudio();
  const item = button.dataset.item;
  const { price } = DECOR[item];
  api.stopSpeech();
  if (shop.decor.owned.includes(item)) {
    // ของที่มีแล้ว: แตะเพื่อเอาออกมาแต่ง / เก็บเข้ากล่อง
    shop = core.toggleDecor(shop, item);
    save();
    api.sfx.plip();
    showGoods(run);
    say(`${decorName(item)} ${shop.decor.placed[item] ? tx('placed') : tx('stored')}`);
    return;
  }
  if (shop.piggy < price) {
    // เงินยังไม่พอ: บอกเบาๆ ว่าต้องเก็บอีกเท่าไร (ไม่มีนาฬิกา ไม่เร่ง)
    nudge(button);
    const missing = price - shop.piggy;
    $('#bubble').innerHTML = `<img class="bubble-item" src="assets/decor/${item}.png" alt=""><span class="need">${core.greedyCoins(missing, [10, 5, 2, 1]).map((value) => `<img src="${coinSrc(value)}" alt="">`).join('')}</span><b class="qty">+${missing}</b>`;
    say(`${decorName(item)} ${tx('priceWord')} ${price} ${tx('baht')} ${tx('saveMore')} ${missing} ${tx('baht')} ${tx('please')}`);
    return;
  }
  const purchase = core.makePurchase(shop, item);
  if (!purchase) return;
  shop = core.startPurchase(shop, purchase);
  save();
  api.tone(620);
  enterPurchase(run);
}

async function enterPurchase(id) {
  if (id !== run) return;
  const purchase = shop.activePurchase;
  const name = decorName(purchase.item);
  pay = { placed: [], answered: false, change: [] };
  $('#bubble').innerHTML = `<img class="bubble-item" src="assets/decor/${purchase.item}.png" alt=""><span class="price-tag"><img src="assets/shop/pricetag.png" alt=""><b>${purchase.price}</b></span>`;
  if (purchase.mode === 'change') {
    renderPayBig();
    const prompt = `${tx('payWith')} ${purchase.paidWith} ${tx('baht')}`;
    setPrompt(prompt);
    await say(`${name} ${tx('priceWord')} ${purchase.price} ${tx('baht')}`);
    if (id !== run) return;
    say(prompt);
    return;
  }
  renderPay();
  const prompt = purchase.mode === 'exact' ? `${tx('payExact')} ${purchase.price} ${tx('baht')}` : tx('payAny');
  setPrompt(prompt);
  await say(`${name} ${tx('priceWord')} ${purchase.price} ${tx('baht')}`);
  if (id !== run) return;
  say(prompt);
}

// จ่ายจากกระเป๋าของหนู: ระดับ 1 จ่ายเกินได้ (คนขายทอนให้), ระดับ 2–3 ต้องพอดี
function renderPay() {
  const purchase = shop.activePurchase;
  const purse = purchase.purse;
  const sum = core.coinSum(pay.placed.map((i) => purse[i]));
  const free = purse.map((_, i) => i).filter((i) => !pay.placed.includes(i));
  const hint = purchase.math.guided ? (core.exactSubset(free.map((i) => purse[i]), purchase.price - sum) || []) : [];
  const hinted = new Set(hint.map((k) => free[k]));
  const exact = purchase.mode === 'exact';
  $('#desk').innerHTML = `
    <div class="money-row">
      <div class="purse-zone"><span class="zone-label"><img src="assets/shop/purse.png" alt="">${tx('myPurse')}</span><div class="coins" id="purse">
        ${purse.map((value, i) => (pay.placed.includes(i) ? '<span class="coin-gap"></span>' : coinHTML(value, `data-i="${i}"`))).join('')}
      </div></div>
      <div class="counter-zone"><div class="shop-running" id="running">${sum}<small>/${purchase.price}</small></div><div class="coins" id="counter">
        ${pay.placed.map((i, k) => coinHTML(purse[i], `data-k="${k}"`)).join('')}
      </div></div>
    </div>
    <div class="desk-actions">
      ${exact && !purchase.math.guided ? `<button class="action-btn help-btn" id="help">💡 ${tx('help')}</button>` : ''}
      <button class="action-btn primary" id="give" ${pay.placed.length ? '' : 'disabled'}>🤲 ${tx('pay')}</button>
    </div>`;
  $('#purse').querySelectorAll('.coin').forEach((coin) => {
    if (hinted.has(Number(coin.dataset.i))) coin.classList.add('hint');
    coin.onclick = () => payCoin(Number(coin.dataset.i));
  });
  $('#counter').querySelectorAll('.coin').forEach((coin) => {
    coin.onclick = () => {
      if (busy) return;
      pay.placed.splice(Number(coin.dataset.k), 1);
      api.sfx.swish();
      renderPay();
    };
  });
  if ($('#help')) $('#help').onclick = () => askHelp(renderPay);
  $('#give').onclick = () => {
    if (busy) return;
    const now = core.coinSum(pay.placed.map((i) => purse[i]));
    if (now >= purchase.price && (!exact || now === purchase.price)) return paidMarket(run, now);
    if (!exact) { api.stopSpeech(); react('short'); say(tx('moneyShort')); return; }
    const verdict = core.judge(purchase.price, now);
    miss(verdict, verdict === 'over' ? tx('moneyOver') : tx('moneyShort'), renderPay);
  };
}

function payCoin(index) {
  if (busy || pay.placed.includes(index)) return;
  api.unlockAudio();
  const purchase = shop.activePurchase;
  pay.placed.push(index);
  api.sfx.clunk();
  renderPay();
  $('#counter .coin:last-child')?.classList.add('shop-bump');
  const sum = core.coinSum(pay.placed.map((i) => purchase.purse[i]));
  api.stopSpeech();
  if (purchase.mode === 'free') {
    say(String(sum));
    if (sum >= purchase.price) paidMarket(run, sum);
    return;
  }
  const verdict = core.judge(purchase.price, sum);
  if (verdict === 'exact') { say(String(sum)); paidMarket(run, sum); return; }
  if (verdict === 'over') { miss('over', `${sum} ${tx('moneyOver')}`, renderPay); return; }
  say(String(sum));
}

// ระดับ 3: จ่ายเหรียญ 10 / แบงก์ 20 แล้วตอบว่าต้องได้เงินทอนกี่บาท
function renderPayBig() {
  const purchase = shop.activePurchase;
  const { price, paidWith } = purchase;
  if (!pay.answered && !pay.given) {
    $('#desk').innerHTML = `
      <div class="money-row single">
        <div class="purse-zone"><span class="zone-label"><img src="assets/shop/purse.png" alt="">${tx('myPurse')}</span><div class="coins" id="purse">${coinHTML(paidWith, 'data-big="1"')}</div></div>
      </div>`;
    const big = $('#purse .coin');
    big.classList.add('hint');
    big.onclick = () => giveBig();
    return;
  }
  $('#desk').innerHTML = `
    <div class="money-row">
      <div class="paid-zone"><span class="zone-label">${tx('pay')}</span><div class="coins">${coinHTML(paidWith, 'tabindex="-1" disabled')}</div></div>
      <div class="counter-zone"><span class="zone-label">${tx('gotChange')}</span><div class="coins" id="counter">${pay.change.map((value) => coinHTML(value, 'tabindex="-1" disabled')).join('')}</div></div>
    </div>
    ${purchase.math.guided && !pay.answered ? `<div class="numberline" id="line" aria-hidden="true"><b>${price}</b>${Array.from({ length: paidWith - price }, (_, i) => `<i>${price + i + 1}</i>`).join('')}</div>` : ''}
    ${pay.answered ? '' : `<div class="choices" id="choices">${purchase.choices.map((n) => `<button class="choice" data-n="${n}">${n}</button>`).join('')}</div>`}
    <div class="desk-actions">${!pay.answered && !purchase.math.guided ? `<button class="action-btn help-btn" id="help">💡 ${tx('help')}</button>` : ''}</div>`;
  $('#desk').querySelectorAll('[data-n]').forEach((button) => { button.onclick = () => chooseChange(Number(button.dataset.n), button); });
  if ($('#help')) $('#help').onclick = () => askHelp(renderPayBig);
}

async function giveBig() {
  if (busy) return;
  api.unlockAudio();
  const purchase = shop.activePurchase;
  pay.given = true;
  api.sfx.clunk();
  renderPayBig();
  api.stopSpeech();
  const id = run;
  await say(`${tx('costs')} ${purchase.price} ${tx('iGive')} ${purchase.paidWith} ${tx('baht')}`);
  if (id !== run) return;
  setPrompt(tx('howMuch'));
  say(tx('howMuch'));
}

async function chooseChange(n, button) {
  if (busy) return;
  const purchase = shop.activePurchase;
  api.stopSpeech();
  if (n !== purchase.change) {
    nudge(button);
    miss(n < purchase.change ? 'short' : 'over', lines.changeHow(purchase.price, purchase.paidWith), renderPayBig);
    return;
  }
  busy = true;
  const id = run;
  pay.answered = true;
  api.sfx.ding();
  renderPayBig();
  await say(`${tx('gotChange')} ${n} ${tx('baht')}`);
  // คนขายวางเงินทอนทีละเหรียญ พร้อมนับต่อจากราคา
  let running = purchase.price;
  for (const value of core.greedyCoins(purchase.change, [5, 2, 1])) {
    if (id !== run) return;
    pay.change.push(value);
    running += value;
    api.sfx.clunk();
    renderPayBig();
    $('#counter .coin:last-child')?.classList.add('shop-bump');
    await Promise.all([wait(350), say(String(running))]);
  }
  if (id !== run) return;
  busy = false;
  finishPurchase(id, purchase.paidWith);
}

async function paidMarket(id, given) {
  if (busy) return;
  busy = true;
  const purchase = shop.activePurchase;
  await wait(250);
  if (id !== run) return;
  api.sfx.ding();
  if (given > purchase.price) {
    // ระดับ 1 จ่ายเกิน: คนขายทอนให้เอง นับต่อให้ฟัง
    const change = given - purchase.price;
    await say(`${tx('gotChange')} ${change} ${tx('baht')}`);
    if (id !== run) return;
  } else {
    await say(tx('exact'));
    if (id !== run) return;
  }
  busy = false;
  finishPurchase(id, given);
}

async function finishPurchase(id, given) {
  if (id !== run || busy) return;
  busy = true;
  const purchase = shop.activePurchase;
  const result = core.commitPurchase(shop, purchase, { paid: given });
  if (!result.committed) {
    shop.activePurchase = null;
    save();
    showGoods(run);
    return;
  }
  shop = result.shop;
  save();
  $('#piggy').textContent = shop.piggy;
  $('#customer').src = api.friendSrc(SELLER, 'love');
  $('#customer').classList.add('happy');
  $('#bubble').innerHTML = `<img class="bubble-item" src="assets/decor/${purchase.item}.png" alt=""><span class="heart">♥</span>`;
  api.confetti();
  setPrompt(`${decorName(purchase.item)} ${tx('placed')}`);
  $('#desk').innerHTML = `<div class="bought"><img class="bought-item" src="assets/decor/${purchase.item}.png" alt=""></div>
    <div class="desk-actions">
      <button class="action-btn" id="buy-more">🛍️ ${tx('buyMore')}</button>
      <button class="action-btn primary" id="to-shop">🏪 ${tx('backShop')}</button>
    </div>`;
  $('#buy-more').onclick = () => { api.tone(620); showGoods(run); };
  $('#to-shop').onclick = () => { api.tone(620); backToShop(); };
  await say(tx('thanksBuy'));
  if (id !== run) return;
  say(`${decorName(purchase.item)} ${tx('placed')}`);
  busy = false;
}
