// ตลาดของแต่งร้าน — node --test "tests/shop/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DECOR, freshShop, normalizeShop, marketPurse, changeChoices, makePurchase, startPurchase, commitPurchase, toggleDecor,
  exactSubset, coinSum
} from '../../js/shop/core.js';

function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const richShop = (level = 1, piggy = 60) => {
  const shop = freshShop();
  shop.level = level;
  shop.piggy = piggy;
  shop.totals.sales = piggy;
  return shop;
};

test('decorations cost 5 to 20 baht', () => {
  const prices = Object.values(DECOR).map((item) => item.price);
  assert.equal(prices.length, 20);
  assert.ok(prices.every((price) => price >= 5 && price <= 20));
});

test('the purse can always pay exactly when there is enough money', () => {
  for (const { price } of Object.values(DECOR)) {
    for (const piggy of [price, price + 1, price + 7, 45, 230]) {
      if (piggy < price) continue;
      const purse = marketPurse(piggy, price);
      assert.ok(exactSubset(purse, price), `pay ${price} from ${piggy}: ${purse}`);
      assert.ok(coinSum(purse) <= piggy, 'purse never shows more money than the bank has');
      assert.ok(purse.length <= 8, 'a few coins, not the whole bank');
    }
  }
});

test('change choices hold the right answer once and no negatives', () => {
  for (let change = 1; change <= 15; change++) {
    const choices = changeChoices(change, seeded(change));
    assert.equal(choices.length, 3);
    assert.equal(choices.filter((n) => n === change).length, 1);
    assert.ok(choices.every((n) => n > 0));
    assert.equal(new Set(choices).size, 3);
  }
});

test('purchase mode follows the shop level; level 3 alternates exact and change', () => {
  assert.equal(makePurchase(richShop(1), 'plant').mode, 'free');
  assert.equal(makePurchase(richShop(2), 'plant').mode, 'exact');
  const shop = richShop(3);
  const first = makePurchase(shop, 'plant', { random: seeded(2) });
  assert.equal(first.mode, 'change');
  assert.equal(first.paidWith, 10);
  assert.equal(first.change, 2);
  assert.ok(first.choices.includes(2));
  const after = commitPurchase(startPurchase(shop, first), first).shop;
  assert.equal(makePurchase(after, 'lamp').mode, 'exact', 'next purchase is exact');
  assert.equal(makePurchase(richShop(3), 'awning').paidWith, 20);
  assert.equal(makePurchase(richShop(3, 12), 'plant').mode, 'change');
  assert.equal(makePurchase(richShop(3, 16), 'chair').mode, 'exact', 'not enough for a 20 note → pay exact');
});

test('no purchase without enough money or for something already owned', () => {
  assert.equal(makePurchase(richShop(1, 4), 'balloons'), null);
  const shop = richShop(1);
  shop.decor.owned = ['balloons'];
  assert.equal(makePurchase(shop, 'balloons'), null);
  assert.equal(makePurchase(shop, 'teddy'), null);
});

test('buying moves money once, adds and shows the decoration', () => {
  let shop = richShop(2, 30);
  const purchase = makePurchase(shop, 'tablecloth');
  shop = startPurchase(shop, purchase);
  const short = commitPurchase(shop, purchase, { paid: 10 });
  assert.equal(short.committed, false);
  const over = commitPurchase(shop, purchase, { paid: 15 });
  assert.equal(over.committed, false, 'exact mode needs exact money');
  const done = commitPurchase(shop, purchase, { paid: 12 });
  assert.equal(done.committed, true);
  assert.equal(done.shop.piggy, 18);
  assert.equal(done.shop.totals.spent, 12);
  assert.deepEqual(done.shop.decor.owned, ['tablecloth']);
  assert.equal(done.shop.decor.placed.tablecloth, 'tablecloth');
  assert.equal(done.shop.activePurchase, null);
  assert.equal(done.shop.piggy, done.shop.totals.sales - done.shop.totals.spent);
  assert.equal(commitPurchase(done.shop, purchase, { paid: 12 }).reason, 'duplicate');
});

test('free mode may overpay (the seller gives change); change mode pays with the big coin', () => {
  const shop = richShop(1, 30);
  const free = makePurchase(shop, 'plant');
  const result = commitPurchase(startPurchase(shop, free), free, { paid: 10 });
  assert.equal(result.committed, true);
  assert.equal(result.shop.transactions[0].change, 2);
  assert.equal(result.shop.piggy, 22, 'only the price leaves the bank');
  const level3 = richShop(3, 30);
  const change = makePurchase(level3, 'bunting');
  const paid = commitPurchase(startPurchase(level3, change), change);
  assert.equal(paid.shop.transactions[0].paid, 10);
  assert.equal(paid.shop.transactions[0].change, 3);
});

test('decorations can be put away and brought back', () => {
  let shop = richShop(1, 30);
  const purchase = makePurchase(shop, 'lamp');
  shop = commitPurchase(startPurchase(shop, purchase), purchase, { paid: 10 }).shop;
  shop = toggleDecor(shop, 'lamp');
  assert.equal(shop.decor.placed.lamp, undefined);
  shop = toggleDecor(shop, 'lamp');
  assert.equal(shop.decor.placed.lamp, 'lamp');
  assert.equal(toggleDecor(shop, 'chair'), shop, 'cannot place what you do not own');
});

test('a saved purchase survives reload; bad decor data is cleaned', () => {
  let shop = richShop(2, 30);
  const purchase = makePurchase(shop, 'rug');
  shop = startPurchase(shop, purchase);
  const loaded = normalizeShop(JSON.parse(JSON.stringify(shop)));
  assert.equal(loaded.activePurchase.id, purchase.id);
  const odd = normalizeShop({ decor: { owned: ['rug', 'rug', 'teddy'], placed: { rug: 'rug', lamp: 'lamp', x: 'rug' } }, activePurchase: { id: 'x', item: 'rug', price: 1 } });
  assert.deepEqual(odd.decor.owned, ['rug']);
  assert.deepEqual(odd.decor.placed, { rug: 'rug' });
  assert.equal(odd.activePurchase, null);
});

test('the second set of decorations opens once the first set is complete', async () => {
  const { decorSetsOpen } = await import('../../js/shop/core.js');
  const shop = richShop(1, 100);
  assert.deepEqual(decorSetsOpen(shop), [1]);
  assert.equal(makePurchase(shop, 'teaset'), null, 'set 2 is not sold yet');
  shop.decor.owned = Object.keys(DECOR).filter((id) => DECOR[id].set === 1);
  assert.deepEqual(decorSetsOpen(shop), [1, 2]);
  assert.ok(makePurchase(shop, 'teaset'));
});
