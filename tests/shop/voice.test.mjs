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
