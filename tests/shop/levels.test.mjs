// ระดับ 4–6: บวกราคา (ตั้งเลข), ของเหลือบนชั้น, สองเมนูจ่ายแบงก์ 20, คำถามตอนเติมของ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshShop, makeOrder, startOrder, commitSale, addStock, normalizeShop, greedyCoins, numberChoices, orderTotal } from '../../js/shop/core.js';
import { buildSteps } from '../../js/shop/column.js';

function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const customers = ['seal', 'turtle', 'rabbit'];
const stocked = (level, stock = { cookie: 6, cupcake: 6, pizza: 4 }) => ({ ...freshShop(), level, ordersDone: [0, 0, 5, 10, 16, 24, 32][level], stock: { ...stock } });

test('level 4 price orders are two of one food and the problem adds the two prices', () => {
  const random = seeded(4);
  for (let i = 0; i < 200; i++) {
    const order = makeOrder(stocked(4), { customers, random });
    if (order.checkpoint !== 'price') continue;
    assert.equal(order.lines.length, 1);
    assert.equal(order.lines[0].qty, 2);
    const { a, b, op } = order.math.problem;
    assert.equal(op, '+');
    assert.equal(a + b, orderTotal(order));
    assert.equal(order.payment.mode, 'auto');
  }
});

test('remaining orders leave at least one on the shelf and the answer is among the choices', () => {
  const random = seeded(8);
  let seen = 0;
  for (let i = 0; i < 300; i++) {
    const order = makeOrder(stocked(4), { customers, random });
    if (order.checkpoint !== 'remaining') continue;
    seen++;
    const { a, b, op } = order.math.problem;
    assert.equal(op, '-');
    assert.ok(a - b >= 1, 'something is left');
    assert.ok(a <= 10, 'few enough to count pictures');
    assert.ok(order.math.choices.includes(a - b));
    assert.equal(order.math.choices.length, 3);
  }
  assert.ok(seen > 20);
});

test('level 5 sells two foods and pays change from a 20-baht note', () => {
  const random = seeded(12);
  let twenty = 0;
  for (let i = 0; i < 300; i++) {
    const order = makeOrder(stocked(5), { customers, random });
    const total = orderTotal(order);
    if (['price', 'change'].includes(order.checkpoint)) assert.ok(total <= 20, 'money math stays within 20');
    if (order.checkpoint === 'change' && order.payment.paid === 20) {
      twenty++;
      assert.ok(total >= 10 && total < 20);
      assert.equal(order.payment.change, 20 - total);
      const settled = { ...order, status: 'paying', payment: { ...order.payment, changeCoins: greedyCoins(order.payment.change, [5, 2, 1]) } };
      assert.equal(commitSale(stocked(5), settled).committed, true);
    }
    if (order.lines.length === 2) assert.notEqual(order.lines[0].recipe, order.lines[1].recipe);
  }
  assert.ok(twenty > 20, 'twenty-baht notes appear');
});

test('the plan examples appear in real orders: 8 + 7 and 20 − 13', () => {
  const random = seeded(99);
  const problems = new Set();
  const changes = new Set();
  for (let i = 0; i < 2000; i++) {
    const order = makeOrder(stocked(5), { customers, random });
    if (order.checkpoint === 'price') problems.add([order.math.problem.a, order.math.problem.b].sort().join('+'));
    if (order.checkpoint === 'change') changes.add(`${order.payment.paid}-${orderTotal(order)}`);
  }
  assert.ok(problems.has('7+8'), [...problems].join(' '));
  assert.ok(changes.has('20-13'), [...changes].join(' '));
});

test('every price problem the shop makes is solvable by the column engine', () => {
  const random = seeded(5);
  for (let i = 0; i < 500; i++) {
    const order = makeOrder(stocked(6), { customers, random });
    if (!order.math.problem) continue;
    assert.doesNotThrow(() => buildSteps(order.math.problem));
  }
});

test('with too little stock a level-4 shop still makes a sellable order', () => {
  const random = seeded(6);
  for (let i = 0; i < 100; i++) {
    const order = makeOrder(stocked(4, { cookie: 1, cupcake: 0, pizza: 0 }), { customers, random });
    assert.ok(order);
    assert.equal(order.lines[0].qty, 1);
  }
});

test('restocking at level 4 asks how many there are altogether, only when some were left', () => {
  const low = addStock({ ...stocked(3), stock: { cookie: 2, cupcake: 0, pizza: 0 } }, 'cookie', 'r1').shop;
  assert.equal(low.restockQuiz, null, 'not before level 4');
  const quiz = addStock({ ...stocked(4), stock: { cookie: 2, cupcake: 0, pizza: 0 } }, 'cookie', 'r2').shop.restockQuiz;
  assert.deepEqual(quiz, { recipe: 'cookie', before: 2, added: 6 });
  assert.equal(addStock({ ...stocked(4), stock: { cookie: 0, cupcake: 0, pizza: 0 } }, 'cookie', 'r3').shop.restockQuiz, null, 'nothing to add to');
  assert.deepEqual(normalizeShop(JSON.parse(JSON.stringify({ ...stocked(4), restockQuiz: quiz }))).restockQuiz, quiz);
});

test('number choices contain the answer once and never go below zero', () => {
  for (let n = 0; n <= 12; n++) {
    const choices = numberChoices(n, seeded(n + 1));
    assert.equal(choices.length, 3);
    assert.equal(choices.filter((c) => c === n).length, 1);
    assert.ok(choices.every((c) => c >= 0));
  }
});

test('a saved thinking order survives reload with its problem', () => {
  const random = seeded(7);
  let order;
  do { order = makeOrder(stocked(4), { customers, random }); } while (order.checkpoint !== 'price');
  const shop = startOrder(stocked(4), { ...order, status: 'thinking' });
  const loaded = normalizeShop(JSON.parse(JSON.stringify(shop)));
  assert.equal(loaded.activeOrder.status, 'thinking');
  assert.deepEqual(loaded.activeOrder.math.problem, order.math.problem);
});
