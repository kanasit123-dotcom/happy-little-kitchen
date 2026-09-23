// ทุกประโยคไทยที่ร้านพูดได้ ต้องต่อจากคลิปที่อัดไว้ได้ครบ (ไม่ตกไปใช้เสียงเครื่อง) — รัน: node --test "tests/shop/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRODUCTS, DECOR } from '../../js/shop/core.js';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('assets/voice/th/manifest.json', root), 'utf8'));
const ui = readFileSync(new URL('js/shop/ui.js', root), 'utf8');
const app = readFileSync(new URL('js/app.js', root), 'utf8');
const th = (key) => {
  const match = ui.match(new RegExp(`\\n  ${key}: \\{ th: '([^']*)'`));
  assert.ok(match, `TXT.${key}`);
  return match[1];
};
const copy = (key) => {
  const match = app.match(new RegExp(`[{ ]${key}: '([^']*[\\u0E00-\\u0E7F][^']*)'`));   // เอาเฉพาะคำไทยใน COPY.th
  assert.ok(match, `COPY.${key}`);
  return match[1];
};
const names = { cookie: 'คุกกี้', cupcake: 'คัพเค้ก', pizza: 'พิซซ่า' };

// เหมือน clipsFor() ใน js/app.js: ตรงทั้งประโยค หรือจับวลียาวสุดทีละช่วง
function covered(text) {
  if (manifest[text]) return true;
  const tokens = text.split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < tokens.length) {
    let used = 0;
    for (let n = tokens.length - i; n > 0; n--) {
      if (manifest[tokens.slice(i, i + n).join(' ')]) { used = n; break; }
    }
    if (!used) return false;
    i += used;
  }
  return true;
}

// เหมือน spokenNumber() ใน js/shop/ui.js
function spokenNumber(n) {
  if (n <= 100) return String(n);
  const parts = [];
  if (n >= 1000) parts.push(String(Math.floor(n / 1000) * 1000));
  if (n % 1000 >= 100) parts.push(String(Math.floor((n % 1000) / 100) * 100));
  const rest = n % 100;
  if (rest === 1) parts.push('เอ็ด');
  else if (rest) parts.push(String(rest));
  return parts.join(' ');
}

test('every sentence the shop can say is covered by recorded clips', () => {
  const sentences = [];
  for (const [id, product] of Object.entries(PRODUCTS)) {
    for (let qty = 1; qty <= 5; qty++) {
      sentences.push(`${th('want')} ${names[id]} ${qty} ${th('piece')}`);
      sentences.push(`${th('total')} ${qty * product.price} ${th('baht')}`);
      sentences.push(`${th('got')} ${qty * product.price} ${th('baht')}`);
    }
    sentences.push(`${th('want')} ${names[id]} ${th('please')}`);
    sentences.push(`${th('collect')} ${product.price} ${th('baht')}`);
    sentences.push(`${th('costs')} ${product.price} ${th('gives')} 10 ${th('baht')}`);
    sentences.push(`${th('countFrom')} ${product.price} ${th('upTo')} 10 ${th('please')}`);
    sentences.push(`${copy('gotStock')} ${names[id]} ${product.batch} ${copy('piece')}`);
  }
  for (let n = 0; n <= 20; n++) sentences.push(`${n} ${th('moneyOver')}`);
  for (const n of [0, 7, 99, 100, 101, 135, 200, 999, 1000, 1001, 2345, 9999]) sentences.push(`${th('bank')} ${spokenNumber(n)} ${th('baht')}`);
  for (const key of ['hello', 'pick', 'pickCount', 'letsCount', 'short', 'over', 'moneyShort', 'exact', 'full', 'thanks', 'welcomeBack', 'empty', 'cookWhich', 'levelUp']) sentences.push(th(key));
  sentences.push(`${th('short')} ${th('letsCount')}`);
  // ตลาด
  const decorName = (id) => {
    const match = ui.match(new RegExp(`\n  ${id}: \{ th: '([^']*)'`, 'g'));
    assert.ok(match && match.length, `DECOR_NAMES.${id}`);
    return match[match.length - 1].match(/th: '([^']*)'/)[1];
  };
  for (const [id, { price }] of Object.entries(DECOR)) {
    const name = decorName(id);
    sentences.push(`${name} ${th('priceWord')} ${price} ${th('baht')}`);
    sentences.push(`${name} ${th('placed')}`, `${name} ${th('stored')}`);
    for (let missing = 1; missing < price; missing++) sentences.push(`${name} ${th('priceWord')} ${price} ${th('baht')} ${th('saveMore')} ${missing} ${th('baht')} ${th('please')}`);
    sentences.push(`${th('payExact')} ${price} ${th('baht')}`);
    const paidWith = price < 10 ? 10 : 20;
    sentences.push(`${th('payWith')} ${paidWith} ${th('baht')}`, `${th('costs')} ${price} ${th('iGive')} ${paidWith} ${th('baht')}`);
    for (let n = 1; n <= 19; n++) sentences.push(`${th('gotChange')} ${n} ${th('baht')}`);
    sentences.push(`${th('countFrom')} ${price} ${th('upTo')} ${paidWith} ${th('please')}`);
  }
  for (const key of ['marketHello', 'pickGoods', 'payAny', 'howMuch', 'thanksBuy', 'allBought']) sentences.push(th(key));
  // ระดับ 4–6 + ตั้งเลข (js/shop/column.js)
  const col = readFileSync(new URL('js/shop/column.js', root), 'utf8');
  const ct = (key) => col.match(new RegExp(`\n  ${key}: \{ th: '([^']*)'`))[1];
  for (let a = 0; a <= 20; a++) {
    for (let b = 0; b <= 20; b++) {
      sentences.push(`${ct('units')} ${a} ${ct('plus')} ${b} ${ct('what')}`, `${ct('tens')} ${a} ${ct('minus')} ${b} ${ct('what')}`);
    }
  }
  for (const [a, b] of [[7, 7], [8, 7], [8, 5], [5, 5], [8, 8], [7, 5]]) sentences.push(`${a} ${ct('plus')} ${b} ${ct('what')}`, `${a} ${ct('plus')} ${b} ${ct('equals')} ${a + b}`);
  for (const [a, b] of [[20, 13], [20, 15], [20, 16], [20, 10], [12, 5]]) sentences.push(`${a} ${ct('minus')} ${b} ${ct('equals')} ${a - b}`, `${a % 10} ${ct('minus')} ${b % 10} ${ct('cannot')}`, `${ct('tens')} 1 ${ct('minus')} 1 ${ct('equals')} 0`);
  for (let n = 0; n <= 9; n++) sentences.push(`${ct('write')} ${n}`, `${ct('bundle')} ${ct('write')} ${n}`);
  for (const key of ['carry', 'carryDown', 'bringPlus', 'bringMinus', 'borrowed', 'zero', 'tryAgain', 'glowKey']) sentences.push(ct(key));
  for (const [id] of Object.entries(PRODUCTS)) {
    for (let have = 2; have <= 10; have++) for (let sold = 1; sold < have && sold <= 3; sold++) sentences.push(`${th('have')} ${names[id]} ${have} ${th('piece')} ${th('sold')} ${sold} ${th('piece')} ${th('leftQ')}`);
    for (let before = 1; before <= 11; before++) sentences.push(`${th('have')} ${names[id]} ${before} ${th('piece')} ${th('madeMore')} ${PRODUCTS[id].batch} ${th('piece')} ${th('altogetherQ')}`);
  }
  for (let n = 0; n <= 12; n++) sentences.push(`${th('left')} ${n} ${th('piece')}`, `${th('altogether')} ${n} ${th('piece')}`, `${th('mustGive')} ${n} ${th('baht')}`);
  sentences.push(`${th('want')} ${names.pizza} 1 ${th('piece')} ${th('and')} ${names.cupcake} 1 ${th('piece')}`, th('thinkPrice'), th('lookPrice'));
  sentences.push(copy('toShop'), copy('shelfFull'), copy('shop'));
  const missing = sentences.filter((text) => !covered(text));
  assert.deepEqual(missing, []);
});

test('large numbers are read the Thai way', () => {
  assert.equal(spokenNumber(101), '100 เอ็ด');
  assert.equal(spokenNumber(135), '100 35');
  assert.equal(spokenNumber(2345), '2000 300 45');
  assert.equal(spokenNumber(1000), '1000');
});
