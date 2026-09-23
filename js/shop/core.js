// ร้านของหนู — logic ล้วน: ออร์เดอร์ เงิน เหรียญ สต็อก ธุรกรรม
// ไม่แตะหน้าจอและไม่แตะ localStorage เอง จึงทดสอบด้วย node --test ได้ (tests/shop/core.test.mjs)
// ค่าตั้งต้น (ราคา จำนวนต่อรอบ ระดับ) อยู่ในไฟล์นี้เลย ไม่แยก config.js เพื่อไม่ต้อง import ต่อกันหลายชั้น
// (ทุกโมดูลต้องโหลดพร้อม ?v= เดียวกับ app.js ไม่งั้น cache ของ GitHub Pages อาจให้ไฟล์เก่าปนไฟล์ใหม่)

export const SHOP_KEY = 'happy-little-kitchen-shop-v1';
export const SCHEMA = 1;

// จำนวนต่อรอบต้องเท่ากับที่เด็กเห็นตอนทำอาหาร: ปั้นคุกกี้ 6 ก้อน, ถาดคัพเค้ก 6 หลุม, พิซซ่าตัด 2 ครั้ง = 4 ชิ้น
export const PRODUCTS = {
  cookie: { price: 5, batch: 6 },
  cupcake: { price: 7, batch: 6 },
  pizza: { price: 8, batch: 4 }
};
export const STOCK_MAX = 12;
export const SEED_STOCK = { cookie: 6, cupcake: 0, pizza: 0 };
export const TRANSACTIONS_MAX = 100;
export const COIN_VALUES = [1, 2, 5, 10];
export const CHANGE_COINS = [1, 2, 5];     // ลิ้นชักเหรียญทอน (มีไม่จำกัด)

// ของแต่งร้านที่ตลาด: ราคา 5–20 บาท ขาย 1–3 ออร์เดอร์ก็ซื้อได้ 1 ชิ้น มีขายตลอด ไม่มีสุ่ม ไม่หมดอายุ
export const DECOR = {
  balloons: { price: 5 },
  flowers: { price: 6 },
  bunting: { price: 7 },
  plant: { price: 8 },
  rug: { price: 9 },
  lamp: { price: 10 },
  tablecloth: { price: 12 },
  chair: { price: 14 },
  sign: { price: 15 },
  awning: { price: 18 }
};

// ปลดล็อกตามจำนวนออร์เดอร์ที่ขายสำเร็จ ไม่ลดระดับ ไม่อิงความแม่นยำ
// count = นับของ, collect = รับเงินพอดี, change = ทอนแบบนับต่อ, price = บวกราคา (ตั้งเลข), remaining = ของบนชั้นเหลือกี่ชิ้น
export const LEVELS = [
  { level: 1, unlock: 0, checkpoints: ['count'] },
  { level: 2, unlock: 5, checkpoints: ['collect', 'count'] },
  { level: 3, unlock: 10, checkpoints: ['change', 'collect'] },
  { level: 4, unlock: 16, checkpoints: ['price', 'remaining'] },
  { level: 5, unlock: 24, checkpoints: ['price', 'change', 'remaining'] },
  { level: 6, unlock: 32, checkpoints: ['count', 'collect', 'change', 'price', 'remaining'] }
];
export const CHECKPOINTS = ['count', 'collect', 'change', 'price', 'remaining'];

const clone = (value) => JSON.parse(JSON.stringify(value));
const isInt = (value) => Number.isInteger(value);
const nonNeg = (value) => (isInt(value) && value >= 0 ? value : 0);
const randInt = (random, min, max) => min + Math.floor(random() * (max - min + 1));
const pickFrom = (random, list) => list[Math.floor(random() * list.length)];

export function coinSum(coins) {
  return (coins || []).reduce((sum, coin) => sum + coin, 0);
}

// แตกเงินเป็นเหรียญ/แบงก์ใหญ่ก่อน
export function greedyCoins(amount, values = [20, 10, 5, 2, 1]) {
  const out = [];
  let left = amount;
  for (const value of values) {
    while (left >= value) { out.push(value); left -= value; }
  }
  return out;
}

export function levelFor(ordersDone) {
  let current = LEVELS[0];
  for (const entry of LEVELS) if (ordersDone >= entry.unlock) current = entry;
  return current.level;
}

export function levelInfo(level) {
  return LEVELS.find((entry) => entry.level === level) || LEVELS[0];
}

// ordersDone ที่ต้องมีเพื่อปลดล็อกระดับถัดไป (null = ระดับสูงสุดแล้ว)
export function nextUnlock(ordersDone) {
  const next = LEVELS.find((entry) => entry.unlock > ordersDone);
  return next ? next.unlock : null;
}

export function freshShop() {
  return {
    schema: SCHEMA,
    seeded: true,
    level: 1,
    ordersDone: 0,
    purchasesDone: 0,
    preferredMode: 'independent',
    stock: { ...SEED_STOCK },
    piggy: 0,
    totals: { sales: 0, customerPaid: 0, changeGiven: 0, spent: 0 },
    activeOrder: null,
    activePurchase: null,
    lastRestockId: null,
    restockQuiz: null,
    lastOrderKey: null,
    lastCustomer: null,
    lastPurchaseMode: null,
    recent: [],
    transactions: [],
    decor: { owned: [], placed: {} }
  };
}

function validOrder(order) {
  if (!order || typeof order !== 'object' || typeof order.id !== 'string' || typeof order.customer !== 'string') return false;
  if (!Array.isArray(order.lines) || !order.lines.length) return false;
  if (!order.lines.every((line) => PRODUCTS[line.recipe] && isInt(line.qty) && line.qty > 0 && isInt(line.unitPrice))) return false;
  if (order.lines.length > 2 || new Set(order.lines.map((line) => line.recipe)).size !== order.lines.length) return false;
  if (!CHECKPOINTS.includes(order.checkpoint)) return false;
  if (!['arriving', 'picking', 'thinking', 'paying'].includes(order.status)) return false;
  const payment = order.payment;
  if (!payment || !['auto', 'collect', 'change'].includes(payment.mode) || !isInt(payment.paid) || !isInt(payment.change)) return false;
  return payment.paid - payment.change === orderTotal(order);
}

// อ่านข้อมูลร้านจาก localStorage (ที่ parse แล้ว) ให้อยู่ในรูปที่ถูกต้องเสมอ — ค่าแปลกๆ ใช้ค่าเริ่มต้นแทน
export function normalizeShop(raw) {
  if (!raw || typeof raw !== 'object') return freshShop();
  const shop = freshShop();
  shop.seeded = raw.seeded !== false;
  shop.ordersDone = nonNeg(raw.ordersDone);
  shop.purchasesDone = nonNeg(raw.purchasesDone);
  shop.level = levelFor(shop.ordersDone);
  shop.preferredMode = raw.preferredMode === 'guided' ? 'guided' : 'independent';
  for (const id of Object.keys(PRODUCTS)) {
    shop.stock[id] = Math.min(STOCK_MAX, nonNeg(raw.stock?.[id]));
  }
  shop.piggy = nonNeg(raw.piggy);
  for (const key of Object.keys(shop.totals)) shop.totals[key] = nonNeg(raw.totals?.[key]);
  shop.activeOrder = validOrder(raw.activeOrder) ? clone(raw.activeOrder) : null;
  if (shop.activeOrder) {
    const order = shop.activeOrder;
    order.picked = Array.isArray(order.picked) ? order.picked.filter((id) => PRODUCTS[id]).slice(0, 9) : [];
    order.payment.changeCoins = [];
    const saved = order.math || {};
    order.math = { attempts: nonNeg(saved.attempts), usedHelp: saved.usedHelp === true, guided: saved.guided === true };
    if (saved.problem && isInt(saved.problem.a) && isInt(saved.problem.b) && ['+', '-'].includes(saved.problem.op)) order.math.problem = { a: saved.problem.a, op: saved.problem.op, b: saved.problem.b };
    if (Array.isArray(saved.choices) && saved.choices.every(isInt)) order.math.choices = saved.choices.slice(0, 3);
    if (['price', 'remaining'].includes(order.checkpoint) && !order.math.problem) shop.activeOrder = null;
    order.payment.changeCoins = [];
  }
  shop.activePurchase = validPurchase(raw.activePurchase) ? clone(raw.activePurchase) : null;
  if (shop.activePurchase) shop.activePurchase.math = { attempts: nonNeg(raw.activePurchase.math?.attempts), usedHelp: raw.activePurchase.math?.usedHelp === true, guided: raw.activePurchase.math?.guided === true };
  shop.lastRestockId = typeof raw.lastRestockId === 'string' ? raw.lastRestockId : null;
  const quiz = raw.restockQuiz;
  shop.restockQuiz = quiz && PRODUCTS[quiz.recipe] && isInt(quiz.before) && isInt(quiz.added) && quiz.before > 0 && quiz.added > 0 ? { recipe: quiz.recipe, before: quiz.before, added: quiz.added } : null;
  shop.recent = Array.isArray(raw.recent) ? raw.recent.filter((kind) => typeof kind === 'string').slice(-2) : [];
  shop.lastOrderKey = typeof raw.lastOrderKey === 'string' ? raw.lastOrderKey : null;
  shop.lastCustomer = typeof raw.lastCustomer === 'string' ? raw.lastCustomer : null;
  shop.lastPurchaseMode = typeof raw.lastPurchaseMode === 'string' ? raw.lastPurchaseMode : null;
  shop.transactions = Array.isArray(raw.transactions)
    ? raw.transactions.filter((entry) => entry && typeof entry.id === 'string').slice(0, TRANSACTIONS_MAX)
    : [];
  const owned = Array.isArray(raw.decor?.owned) ? [...new Set(raw.decor.owned.filter((id) => DECOR[id]))] : [];
  const placed = {};
  for (const [slot, id] of Object.entries(raw.decor?.placed && typeof raw.decor.placed === 'object' ? raw.decor.placed : {})) {
    if (slot === id && owned.includes(id)) placed[slot] = id;
  }
  shop.decor = { owned, placed };
  if (shop.activePurchase && owned.includes(shop.activePurchase.item)) shop.activePurchase = null;
  return shop;
}

export function orderTotal(order) {
  return order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

export function orderQty(order) {
  return order.lines.reduce((sum, line) => sum + line.qty, 0);
}

export function sellable(shop) {
  return Object.keys(PRODUCTS).filter((id) => shop.stock[id] > 0);
}

// เลือกจุดคำนวณของออร์เดอร์นี้ 1 ชนิด ไม่ใช้ชนิดเดิมติดกันเกิน 2 ครั้ง
export function chooseCheckpoint(shop, random = Math.random) {
  const options = levelInfo(shop.level).checkpoints;
  const [a, b] = shop.recent.slice(-2);
  const allowed = a && a === b && options.length > 1 ? options.filter((kind) => kind !== a) : options;
  return pickFrom(random, allowed);
}

// กระเป๋าเงินของลูกค้าตอนจ่ายพอดี: มีชุดที่รวมได้พอดีเสมอ + เหรียญหลอกอีก 2–3 เหรียญ
export function purseFor(price, random = Math.random) {
  const exact = greedyCoins(price, [5, 2, 1]);
  const extras = [pickFrom(random, [1, 2, 5]), pickFrom(random, [1, 2])];
  if (random() < .5) extras.push(10);
  const purse = [...exact, ...extras].slice(0, 7);
  for (let i = purse.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [purse[i], purse[j]] = [purse[j], purse[i]];
  }
  return purse;
}

// ชุดเหรียญในกระเป๋าที่รวมได้พอดี (ไว้ไฮไลต์ตอนขอความช่วยเหลือ) คืน index ของเหรียญ หรือ null
export function exactSubset(purse, target) {
  const order = purse.map((value, index) => ({ value, index })).sort((x, y) => y.value - x.value);
  const pick = [];
  const search = (start, left) => {
    if (left === 0) return true;
    for (let i = start; i < order.length; i++) {
      if (order[i].value > left) continue;
      pick.push(order[i].index);
      if (search(i + 1, left - order[i].value)) return true;
      pick.pop();
    }
    return false;
  };
  return search(0, target) ? pick.sort((x, y) => x - y) : null;
}

// ทอนแบบนับต่อ: ยอดที่นับได้หลังวางเหรียญแต่ละเหรียญ เช่น ราคา 7 วาง [2, 1] → [9, 10]
export function countOn(price, coins) {
  const out = [];
  let at = price;
  for (const coin of coins) { at += coin; out.push(at); }
  return out;
}

// เทียบยอดที่เด็กทำได้กับเป้า
export function judge(target, total) {
  if (total === target) return 'exact';
  return total < target ? 'short' : 'over';
}

// เหรียญที่ควรวางต่อไปตอนขอความช่วยเหลือ (ใหญ่สุดที่ไม่เกินที่เหลือ)
export function suggestCoin(left, values = CHANGE_COINS) {
  return [...values].sort((x, y) => y - x).find((value) => value <= left) || null;
}

// ตัวเลือกคำตอบ 3 ตัว (ของเหลือ / รวมของ) มีคำตอบถูก 1 ตัว ไม่ติดลบ
export function numberChoices(answer, random = Math.random) {
  const options = new Set([answer]);
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3].filter((n) => n >= 0 && n !== answer);
  while (options.size < 3 && near.length) options.add(near.splice(Math.floor(random() * near.length), 1)[0]);
  return [...options].sort((x, y) => x - y);
}

// รายการของในออร์เดอร์ตามชนิดจุดคำนวณ (null = สต็อกตอนนี้ทำจุดนี้ไม่ได้)
function linesFor(shop, checkpoint, random) {
  const available = sellable(shop);
  const line = (recipe, qty) => ({ recipe, qty, unitPrice: PRODUCTS[recipe].price });
  if (!available.length) return null;
  if (checkpoint === 'count') {
    const recipe = pickFrom(random, available);
    const stock = shop.stock[recipe];
    const low = shop.level >= 2 && stock >= 2 ? 2 : 1;
    return [line(recipe, randInt(random, low, Math.min(5, stock)))];
  }
  if (checkpoint === 'collect') return [line(pickFrom(random, available), 1)];
  if (checkpoint === 'remaining') {
    // ต้องเหลือบนชั้นอย่างน้อย 1 ชิ้น และไม่เกิน 10 ให้นับรูปได้
    const ok = available.filter((id) => shop.stock[id] >= 2 && shop.stock[id] <= 10);
    if (!ok.length) return null;
    const recipe = pickFrom(random, ok);
    return [line(recipe, randInt(random, 1, Math.min(3, shop.stock[recipe] - 1)))];
  }
  // price / change (ระดับ 5 ขึ้นไป): สองเมนูเมนูละชิ้น หรือเมนูเดียว 2 ชิ้น — ยอดรวม 10–16 จ่ายแบงก์ 20
  const twoItems = shop.level >= 5 || checkpoint === 'price';
  if (checkpoint === 'change' && !twoItems) return [line(pickFrom(random, available), 1)];
  if (shop.level >= 5 && available.length >= 2 && random() < .7) {
    const first = pickFrom(random, available);
    const second = pickFrom(random, available.filter((id) => id !== first));
    return [line(first, 1), line(second, 1)];
  }
  const doubles = available.filter((id) => shop.stock[id] >= 2);
  if (!doubles.length) return checkpoint === 'change' ? [line(pickFrom(random, available), 1)] : null;
  return [line(pickFrom(random, doubles), 2)];
}

// โจทย์ของจุดคำนวณที่ต้องคิด (ราคา = บวก, ของเหลือ = ลบ)
function problemFor(shop, checkpoint, lines) {
  if (checkpoint === 'price') {
    const prices = lines.flatMap((line) => Array.from({ length: line.qty }, () => line.unitPrice));
    return { a: prices[0], op: '+', b: prices[1] };
  }
  if (checkpoint === 'remaining') return { a: shop.stock[lines[0].recipe], op: '-', b: lines[0].qty };
  return null;
}

// สร้างออร์เดอร์จากสต็อกที่มีจริง คืน null ถ้าไม่มีของขาย
export function makeOrder(shop, { customers, random = Math.random, now = Date.now() } = {}) {
  if (!sellable(shop).length || !customers?.length) return null;
  let best = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const first = chooseCheckpoint(shop, random);
    // ถ้าสต็อกไม่พอสำหรับจุดที่สุ่มได้ ลองจุดอื่นของระดับเดียวกัน สุดท้ายค่อยเป็นนับของ 1 ชิ้น
    const order = [first, ...levelInfo(shop.level).checkpoints.filter((kind) => kind !== first), 'count'];
    let checkpoint = null;
    let lines = null;
    for (const kind of order) {
      lines = linesFor(shop, kind, random);
      if (lines) { checkpoint = kind; break; }
    }
    const others = customers.filter((id) => id !== shop.lastCustomer);
    const customer = pickFrom(random, others.length ? others : customers);
    const key = `${lines.map((line) => `${line.recipe}x${line.qty}`).join('+')}:${checkpoint}`;
    best = { checkpoint, lines, customer, key };
    if (key !== shop.lastOrderKey) break;
  }
  const total = best.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
  let payment;
  if (best.checkpoint === 'collect') payment = { mode: 'collect', offered: [], purse: purseFor(total, random), paid: total, change: 0 };
  else if (best.checkpoint === 'change') {
    const note = total < 10 ? 10 : 20;
    payment = { mode: 'change', offered: [note], paid: note, change: note - total };
  } else payment = { mode: 'auto', offered: greedyCoins(total), paid: total, change: 0 };
  payment.changeCoins = [];
  const problem = problemFor(shop, best.checkpoint, best.lines);
  const math = { attempts: 0, usedHelp: false, guided: shop.preferredMode === 'guided' };
  if (problem) math.problem = problem;
  if (best.checkpoint === 'remaining') math.choices = numberChoices(problem.a - problem.b, random);
  return {
    id: `order-${now.toString(36)}-${Math.floor(random() * 1e6).toString(36)}`,
    customer: best.customer,
    lines: best.lines,
    total,
    checkpoint: best.checkpoint,
    status: 'arriving',
    picked: [],
    payment,
    math,
    createdAt: now
  };
}

// ตั้งออร์เดอร์ใหม่ให้ร้าน (จำไว้ว่าลูกค้า/จุดคำนวณล่าสุดคืออะไร จะได้ไม่ซ้ำติดกัน)
export function startOrder(shop, order) {
  const next = clone(shop);
  next.activeOrder = order ? clone(order) : null;
  if (order) {
    next.lastOrderKey = `${order.lines.map((line) => `${line.recipe}x${line.qty}`).join('+')}:${order.checkpoint}`;
    next.lastCustomer = order.customer;
    next.recent = [...(shop.recent || []), order.checkpoint].slice(-2);
  }
  return next;
}

// ขายสำเร็จ: atomic — สร้าง object ร้านใหม่ทั้งก้อน แล้วค่อยบันทึกครั้งเดียว
// idempotency key = order.id (แตะยืนยันซ้ำหรือเรียกซ้ำไม่ขายซ้ำ)
export function commitSale(shop, order, { now = Date.now() } = {}) {
  if (!order || !validOrder({ ...order, status: order.status === 'done' ? 'paying' : order.status })) return { shop, committed: false, reason: 'invalid' };
  if (shop.transactions.some((entry) => entry.id === order.id)) return { shop, committed: false, reason: 'duplicate' };
  for (const line of order.lines) {
    if ((shop.stock[line.recipe] || 0) < line.qty) return { shop, committed: false, reason: 'stock' };
  }
  const total = orderTotal(order);
  const { paid, change, mode } = order.payment;
  const changeCoins = order.payment.changeCoins || [];
  if (paid - change !== total) return { shop, committed: false, reason: 'payment' };
  if (mode === 'change' && coinSum(changeCoins) !== change) return { shop, committed: false, reason: 'change' };
  const next = clone(shop);
  for (const line of order.lines) next.stock[line.recipe] -= line.qty;
  next.totals.sales += total;
  next.totals.customerPaid += paid;
  next.totals.changeGiven += change;
  next.piggy += total;
  next.ordersDone += 1;
  next.level = levelFor(next.ordersDone);
  next.transactions = [{
    id: order.id,
    type: 'sell',
    customer: order.customer,
    lines: clone(order.lines),
    total,
    paid,
    change,
    checkpoint: order.checkpoint,
    attempts: order.math?.attempts || 0,
    usedHelp: order.math?.usedHelp === true,
    at: now
  }, ...next.transactions].slice(0, TRANSACTIONS_MAX);
  next.activeOrder = null;
  return { shop: next, committed: true, levelUp: next.level > shop.level };
}

// เติมสต็อกจากการทำอาหาร ครั้งเดียวต่อ restockId (แตะซ้ำ/เรียกซ้ำไม่เพิ่มซ้ำ) ไม่เกิน STOCK_MAX
export function addStock(shop, recipe, restockId) {
  if (!PRODUCTS[recipe]) return { shop, added: 0, reason: 'product' };
  if (restockId && shop.lastRestockId === restockId) return { shop, added: 0, reason: 'duplicate' };
  const next = clone(shop);
  const room = STOCK_MAX - next.stock[recipe];
  const added = Math.max(0, Math.min(PRODUCTS[recipe].batch, room));
  const before = next.stock[recipe];
  next.stock[recipe] += added;
  if (restockId) next.lastRestockId = restockId;
  // ระดับ 4 ขึ้นไป: กลับเข้าร้านแล้วถามว่ารวมเป็นกี่ชิ้น (เฉพาะตอนที่มีของเดิมอยู่แล้ว)
  next.restockQuiz = shop.level >= 4 && before > 0 && added > 0 ? { recipe, before, added } : null;
  return { shop: next, added, reason: added ? null : 'full' };
}

// ---------------------------------------------------------------- ตลาด: เด็กเป็นคนซื้อ
function validPurchase(purchase) {
  if (!purchase || typeof purchase !== 'object' || typeof purchase.id !== 'string' || !DECOR[purchase.item]) return false;
  if (!['free', 'exact', 'change'].includes(purchase.mode) || !isInt(purchase.price) || purchase.price !== DECOR[purchase.item].price) return false;
  if (!Array.isArray(purchase.purse) || !purchase.purse.every((coin) => [1, 2, 5, 10, 20].includes(coin))) return false;
  if (purchase.mode === 'change') return [10, 20].includes(purchase.paidWith) && purchase.paidWith > purchase.price;
  return true;
}

// กระเป๋าเงินของเด็กที่ตลาด: เงินในกระปุกแตกเป็นเหรียญ โดยมีชุดที่จ่ายพอดีกับของชิ้นนี้ได้เสมอ
// (เงินเยอะก็โชว์แค่ไม่กี่เหรียญ ไม่ต้องเทกระปุกทั้งหมดออกมา)
export function marketPurse(piggy, price) {
  if (piggy < price) return greedyCoins(piggy);
  const exact = greedyCoins(price, [10, 5, 2, 1]);
  const extra = greedyCoins(piggy - price).slice(0, 3);
  return [...exact, ...extra].sort((x, y) => y - x);
}

// ตัวเลือกคำตอบ "ต้องได้เงินทอนกี่บาท" 3 ตัว มีคำตอบถูก 1 ตัว ไม่ซ้ำกัน ไม่ติดลบ
export function changeChoices(change, random = Math.random) {
  const options = new Set([change]);
  const near = [change - 1, change + 1, change - 2, change + 2, change + 3].filter((n) => n > 0 && n <= 19 && n !== change);
  while (options.size < 3 && near.length) options.add(near.splice(Math.floor(random() * near.length), 1)[0]);
  return [...options].sort((x, y) => x - y);
}

// เริ่มซื้อของ 1 ชิ้น: ระดับ 1 จ่ายอิสระ (จ่ายเกินคนขายทอนให้เอง), ระดับ 2 จ่ายพอดี,
// ระดับ 3 สลับจ่ายพอดี กับจ่ายเหรียญ 10/แบงก์ 20 แล้วตอบว่าต้องได้เงินทอนเท่าไร
export function makePurchase(shop, item, { random = Math.random, now = Date.now() } = {}) {
  const decor = DECOR[item];
  if (!decor || shop.decor.owned.includes(item) || shop.piggy < decor.price) return null;
  const price = decor.price;
  let mode = shop.level >= 3 ? 'change' : shop.level === 2 ? 'exact' : 'free';
  const paidWith = price < 10 ? 10 : 20;
  if (mode === 'change' && (shop.piggy < paidWith || price >= paidWith || shop.lastPurchaseMode === 'change')) mode = 'exact';
  const purchase = {
    id: `buy-${now.toString(36)}-${Math.floor(random() * 1e6).toString(36)}`,
    item,
    price,
    mode,
    purse: mode === 'change' ? [paidWith] : marketPurse(shop.piggy, price),
    math: { attempts: 0, usedHelp: false, guided: false },
    createdAt: now
  };
  if (mode === 'change') {
    purchase.paidWith = paidWith;
    purchase.change = paidWith - price;
    purchase.choices = changeChoices(purchase.change, random);
  }
  return purchase;
}

export function startPurchase(shop, purchase) {
  const next = clone(shop);
  next.activePurchase = purchase ? clone(purchase) : null;
  return next;
}

// ซื้อสำเร็จ: atomic เหมือนการขาย (idempotency key = purchase.id) เงินไม่ติดลบ ของชิ้นเดิมซื้อซ้ำไม่ได้
export function commitPurchase(shop, purchase, { paid, now = Date.now() } = {}) {
  if (!validPurchase(purchase)) return { shop, committed: false, reason: 'invalid' };
  if (shop.transactions.some((entry) => entry.id === purchase.id)) return { shop, committed: false, reason: 'duplicate' };
  if (shop.decor.owned.includes(purchase.item)) return { shop, committed: false, reason: 'owned' };
  if (shop.piggy < purchase.price) return { shop, committed: false, reason: 'money' };
  const given = purchase.mode === 'change' ? purchase.paidWith : paid;
  if (!isInt(given) || given < purchase.price) return { shop, committed: false, reason: 'payment' };
  if (purchase.mode === 'exact' && given !== purchase.price) return { shop, committed: false, reason: 'payment' };
  const next = clone(shop);
  next.piggy -= purchase.price;
  next.totals.spent += purchase.price;
  next.purchasesDone += 1;
  next.decor.owned = [...next.decor.owned, purchase.item];
  next.decor.placed = { ...next.decor.placed, [purchase.item]: purchase.item };
  next.lastPurchaseMode = purchase.mode;
  next.transactions = [{
    id: purchase.id,
    type: 'buy',
    item: purchase.item,
    price: purchase.price,
    paid: given,
    change: given - purchase.price,
    mode: purchase.mode,
    attempts: purchase.math?.attempts || 0,
    usedHelp: purchase.math?.usedHelp === true,
    at: now
  }, ...next.transactions].slice(0, TRANSACTIONS_MAX);
  next.activePurchase = null;
  return { shop: next, committed: true };
}

// เอาของแต่งออกมาวาง/เก็บเข้ากล่อง (ของที่ซื้อแล้วเท่านั้น)
export function toggleDecor(shop, item) {
  if (!shop.decor.owned.includes(item)) return shop;
  const next = clone(shop);
  if (next.decor.placed[item]) delete next.decor.placed[item];
  else next.decor.placed[item] = item;
  return next;
}

export function canRestock(shop, recipe) {
  return !!PRODUCTS[recipe] && shop.stock[recipe] < STOCK_MAX;
}
