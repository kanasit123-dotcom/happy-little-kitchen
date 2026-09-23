// ตั้งบวก/ตั้งลบแนวตั้งสำหรับร้าน — ปรับจาก game-lilly/js/games/column.js
// ต่างจากของเดิม: รับโจทย์ที่ร้านกำหนด (ไม่สุ่มเอง), ตัวตั้ง/คำตอบหลักเดียวไม่มีศูนย์นำหน้า, ไทย/อังกฤษ,
// มีโหมดคิดเอง (independent) กับโหมดตั้งเลขช่วย (guided), ตอบไม่ตรงแบบนุ่มนวลตาม RESTAURANT-MATH-PLAN.md หัวข้อ 0
// ส่วนบน (normalizeProblem, buildSteps, layout) เป็น logic ล้วน ทดสอบด้วย node --test ได้

export const MINUS = '−';

export function normalizeProblem({ a, op, b }) {
  const sign = op === '+' ? '+' : MINUS;
  const result = sign === '+' ? a + b : a - b;
  if (![a, b].every((n) => Number.isInteger(n) && n >= 0 && n <= 99) || result < 0 || result > 99) throw new Error(`unsupported problem ${a} ${op} ${b}`);
  return { a, op: sign, b, result };
}

const split = (n) => ({ t: Math.floor(n / 10), u: n % 10 });

// หน้าตาตาราง: ช่องไหนมีเลข ช่องไหนเว้นว่าง (ไม่แสดง 0 หน้าเลขหลักเดียว)
export function layout(problem) {
  const p = normalizeProblem(problem);
  return {
    ...p,
    top: split(p.a),
    bottom: split(p.b),
    showTopTens: p.a >= 10,
    showBottomTens: p.b >= 10,
    showAnswerTens: p.result >= 10
  };
}

// ขั้นตอนทีละหลัก แบบที่สอนในโรงเรียน: หน่วยก่อน สิบทีหลัง
// ask = ถามให้กดตัวเลข, write = แตะช่องเพื่อเขียน, borrow = แตะเลขหลักสิบเพื่อยืม, zero = หลักสิบเหลือ 0 ไม่ต้องเขียน
export function buildSteps(problem) {
  const p = normalizeProblem(problem);
  const top = split(p.a);
  const bottom = split(p.b);
  const steps = [];
  if (p.op === '+') {
    const sumU = top.u + bottom.u;
    steps.push({ type: 'ask', col: 'units', terms: [top.u, bottom.u], op: '+', answer: sumU });
    const carry = sumU >= 10 ? 1 : 0;
    if (carry) {
      steps.push({ type: 'write', col: 'units', slot: 'answer', value: sumU % 10, why: 'bundle', sum: sumU });
      steps.push({ type: 'write', col: 'tens', slot: 'carry', value: 1, why: 'carry' });
    } else {
      steps.push({ type: 'write', col: 'units', slot: 'answer', value: sumU, why: 'write' });
    }
    const terms = [carry, top.t, bottom.t].filter((n) => n > 0);
    const sumT = terms.reduce((sum, n) => sum + n, 0);
    if (!sumT) return steps;
    if (terms.length === 1) {
      // มีตัวเดียวในหลักสิบ: ยกลงมาเลย (8 + 7 → ทด 1 ยกลงมาเป็น 1, ไม่ถาม 1 + 0)
      steps.push({ type: 'write', col: 'tens', slot: 'answer', value: sumT, why: carry ? 'carryDown' : 'bring' });
      return steps;
    }
    steps.push({ type: 'ask', col: 'tens', terms, op: '+', answer: sumT });
    steps.push({ type: 'write', col: 'tens', slot: 'answer', value: sumT, why: 'write' });
    return steps;
  }
  const borrow = top.u < bottom.u;
  if (borrow) steps.push({ type: 'borrow', from: top.t, to: top.t - 1, units: top.u + 10, u: top.u, need: bottom.u });
  const topU = borrow ? top.u + 10 : top.u;
  const topT = borrow ? top.t - 1 : top.t;
  steps.push({ type: 'ask', col: 'units', terms: [topU, bottom.u], op: MINUS, answer: topU - bottom.u });
  steps.push({ type: 'write', col: 'units', slot: 'answer', value: topU - bottom.u, why: 'write' });
  const diffT = topT - bottom.t;
  if (diffT === 0) {
    // 12 − 5, 20 − 13: หลักสิบเหลือ 0 → ไม่เขียน 0 ข้างหน้า
    if (p.a >= 10) steps.push({ type: 'zero', terms: [topT, bottom.t] });
    return steps;
  }
  if (bottom.t === 0) {
    steps.push({ type: 'write', col: 'tens', slot: 'answer', value: topT, why: 'bring' });
    return steps;
  }
  steps.push({ type: 'ask', col: 'tens', terms: [topT, bottom.t], op: MINUS, answer: diffT });
  steps.push({ type: 'write', col: 'tens', slot: 'answer', value: diffT, why: 'write' });
  return steps;
}

// ---------------------------------------------------------------- ข้อความ (ทุกคำไทยเป็น th: '…' ให้ voice.py อัดเสียง)
const TXT = {
  units: { th: 'หลักหน่วย', en: 'Ones' },
  tens: { th: 'หลักสิบ', en: 'Tens' },
  plus: { th: 'บวก', en: 'plus' },
  minus: { th: 'ลบ', en: 'minus' },
  equals: { th: 'เท่ากับ', en: 'equals' },
  what: { th: 'เท่ากับเท่าไร', en: 'equals what?' },
  write: { th: 'แตะช่องเขียน', en: 'Tap the box to write' },
  bundle: { th: 'ครบสิบแล้ว มัดเป็นหนึ่งสิบ', en: 'That makes ten. Bundle it into one ten' },
  carry: { th: 'แตะช่องทดข้างบน ทดหนึ่ง', en: 'Tap the little box on top to carry one' },
  carryDown: { th: 'ทดหนึ่ง ยกลงมาเป็นหนึ่ง', en: 'Bring the carried one down' },
  bringPlus: { th: 'หลักสิบไม่มีอะไรบวก ยกลงมาเลย', en: 'Nothing to add in the tens. Bring it down' },
  bringMinus: { th: 'หลักสิบไม่มีอะไรลบ ยกลงมาเลย', en: 'Nothing to take away in the tens. Bring it down' },
  cannot: { th: 'ไม่พอ ต้องยืมหนึ่งสิบ แตะเลขหลักสิบ', en: 'is not enough. Borrow one ten: tap the tens number' },
  borrowed: { th: 'ยืมหนึ่งสิบ มาเป็นสิบหน่วย', en: 'Borrow one ten. That is ten more ones' },
  zero: { th: 'หลักสิบเหลือศูนย์ ไม่ต้องเขียน', en: 'The tens are zero, so we do not write them' },
  tryAgain: { th: 'ลองอีกทีนะ', en: 'Try again' },
  glowKey: { th: 'กดเลขที่เรืองแสงนะ', en: 'Press the glowing number' },
  help: { th: 'ตั้งเลขช่วย', en: 'Show me' },
  great: { th: 'เก่งมาก', en: 'Well done!' }
};

// ---------------------------------------------------------------- หน้าจอ
// solveColumn(host, { problem, mode: 'independent' | 'guided' }, hooks) → { done: Promise<result>, cancel() }
// hooks: { lang(), speak(text) → Promise, stopSpeech(), setPrompt(text), sfx: { tap, ding, clunk, swish }, tone(freq), onMiss(kind, attempts) → text|null }
// result: { answer, attempts, usedHelp, completed }
export function solveColumn(host, { problem, mode = 'independent' }, hooks) {
  const L = layout(problem);
  const steps = buildSteps(problem);
  const lang = () => hooks.lang();
  const tx = (key) => TXT[key][lang()];
  const opWord = (op) => (op === '+' ? tx('plus') : tx('minus'));
  const sentence = (terms, op) => terms.join(` ${opWord(op)} `);
  let cancelled = false;
  let guided = mode === 'guided';
  let usedHelp = guided;
  let attempts = 0;       // ตอบไม่ตรงรวมทั้งข้อ
  let stepMisses = 0;     // ตอบไม่ตรงในขั้นนี้ (ครั้งที่ 2 ให้แป้นเรืองแสงเป็นคำใบ้)
  let typed = '';
  let si = 0;
  let resolveDone;
  const state = { carry: null, struck: false, borrowUnits: null, answer: { tens: null, units: null }, pulse: null, active: null };
  const done = new Promise((resolve) => { resolveDone = resolve; });
  const say = (text) => (cancelled ? Promise.resolve() : hooks.speak(text));
  const prompt = (text) => { if (!cancelled) hooks.setPrompt(text); };

  const cell = (content, classes = '', attrs = '') => `<span class="col-cell ${classes}" ${attrs}>${content ?? ''}</span>`;
  function gridHTML() {
    const on = (col) => (state.active === col ? 'active' : '');
    const pulse = (col, slot) => (state.pulse && state.pulse.col === col && state.pulse.slot === slot ? 'pulse' : '');
    const answerCell = (col) => cell(state.answer[col], `col-slot ${state.answer[col] != null ? 'filled' : ''} ${on(col)} ${pulse(col, 'answer')}`, `data-slot="answer" data-col="${col}"`);
    return `
      ${cell('', 'col-spacer')}${cell(state.carry ?? '', `col-carry ${pulse('tens', 'carry')}`, 'data-slot="carry" data-col="tens"')}${cell(state.borrowUnits ?? '', 'col-carry borrowed')}
      ${cell('', 'col-spacer')}${L.showTopTens ? cell(L.top.t, `col-digit ${state.struck ? 'struck' : ''} ${on('tens')} ${pulse('tens', 'top')}`, 'data-slot="top" data-col="tens"') : cell('', 'col-blank')}${cell(L.top.u, `col-digit ${state.borrowUnits != null ? 'struck' : ''} ${on('units')}`)}
      ${cell(L.op, 'col-op')}${L.showBottomTens ? cell(L.bottom.t, `col-digit ${on('tens')}`) : cell('', 'col-blank')}${cell(L.bottom.u, `col-digit ${on('units')}`)}
      <div class="col-rule"></div>
      ${cell('', 'col-spacer')}${L.showAnswerTens ? answerCell('tens') : cell('', 'col-blank')}${answerCell('units')}`;
  }

  const keysHTML = (glow = '') => `<div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => `<button class="key ${glow.includes(String(n)) ? 'glow' : ''}" data-k="${n}">${n}</button>`).join('')}<button class="key del" data-k="del" aria-label="del">⌫</button></div>`;

  function render({ keypad = false, glow = '' } = {}) {
    if (cancelled) return;
    host.innerHTML = `
      <div class="col-wrap">
        ${guided
          ? `<div class="col-sum" id="col-grid">${gridHTML()}</div>`
          : `<div class="col-flat">${L.a} <span>${L.op}</span> ${L.b} <span>=</span> <b class="entry-box" id="entry">${typed || '?'}</b></div>`}
        ${guided && state.aid ? `<div class="col-aid">${state.aid}</div>` : ''}
      </div>
      ${keypad ? `${guided ? `<div class="entry"><b class="entry-box" id="entry">${typed || '?'}</b></div>` : ''}${keysHTML(glow)}` : ''}
      ${!guided ? `<div class="desk-actions"><button class="action-btn help-btn" id="col-help">💡 ${tx('help')}</button></div>` : ''}`;
    host.querySelectorAll('.key').forEach((key) => { key.onclick = () => onKey(key.dataset.k); });
    const help = host.querySelector('#col-help');
    if (help) help.onclick = () => { hooks.tone?.(620); usedHelp = true; switchToGuided(); };
    const grid = host.querySelector('#col-grid');
    if (grid) grid.onclick = (event) => onCell(event.target.closest('.col-cell'));
  }

  // ---------------- คิดเอง: เห็นโจทย์แนวนอน กดคำตอบทั้งจำนวน
  function startIndependent() {
    typed = '';
    render({ keypad: true });
    const text = `${sentence([L.a, L.b], L.op)} ${tx('what')}`;
    prompt(`${L.a} ${L.op} ${L.b} = ?`);
    say(text);
  }

  function switchToGuided() {
    if (cancelled || guided) return;
    guided = true;
    typed = '';
    hooks.stopSpeech();
    si = 0;
    runStep();
  }

  // ---------------- ตั้งเลขช่วย: ทีละหลัก
  async function runStep() {
    if (cancelled) return;
    const step = steps[si];
    stepMisses = 0;
    typed = '';
    state.pulse = null;
    if (!step) return finish();
    state.active = step.col || (step.type === 'borrow' || step.type === 'zero' ? 'tens' : null);
    if (step.type === 'ask') {
      state.aid = null;
      render({ keypad: true });
      const colName = step.col === 'units' ? tx('units') : tx('tens');
      prompt(`${colName}: ${step.terms.join(` ${step.op} `)} = ?`);
      say(`${colName} ${sentence(step.terms, step.op)} ${tx('what')}`);
      return;
    }
    if (step.type === 'borrow') {
      state.pulse = { col: 'tens', slot: 'top' };
      render();
      const text = `${step.u} ${tx('cannot')}`;
      prompt(lang() === 'th' ? `${step.u} ลบ ${step.need} ${tx('cannot')}` : `${step.u} minus ${step.need} ${tx('cannot')}`);
      say(lang() === 'th' ? `${step.u} ${tx('minus')} ${step.need} ${tx('cannot')}` : text);
      return;
    }
    if (step.type === 'zero') {
      state.aid = null;
      render();
      prompt(tx('zero'));
      await say(`${tx('tens')} ${sentence(step.terms, MINUS)} ${tx('equals')} 0`);
      if (cancelled) return;
      await say(tx('zero'));
      if (cancelled) return;
      si++;
      runStep();
      return;
    }
    // write: แตะช่องที่เรืองแสง
    let text = `${tx('write')} ${step.value}`;
    if (step.why === 'bundle') {
      state.aid = `<b>${step.sum}</b><span class="col-dots">${'<i></i>'.repeat(10)}</span><span class="col-dots rest">${'<i></i>'.repeat(step.sum - 10)}</span>`;
      text = `${tx('bundle')} ${tx('write')} ${step.value}`;
    } else if (step.why === 'carry') text = tx('carry');
    else if (step.why === 'carryDown') text = tx('carryDown');
    else if (step.why === 'bring') text = L.op === '+' ? tx('bringPlus') : tx('bringMinus');
    state.pulse = { col: step.col, slot: step.slot };
    render();
    prompt(text);
    say(text);
  }

  function onCell(target) {
    if (cancelled || !target) return;
    const step = steps[si];
    if (!step || !state.pulse) return;
    const matches = target.dataset.slot === state.pulse.slot && target.dataset.col === state.pulse.col;
    if (!matches) { hooks.tone?.(300); target.classList.remove('nope'); void target.offsetWidth; target.classList.add('nope'); return; }
    hooks.stopSpeech();
    if (step.type === 'borrow') {
      state.struck = true;
      state.carry = step.to;
      state.borrowUnits = step.units;
      state.pulse = null;
      hooks.sfx.clunk();
      render();
      say(tx('borrowed'));
      si++;
      setTimeout(runStep, 900);
      return;
    }
    if (step.slot === 'carry') state.carry = step.value;
    else state.answer[step.col] = step.value;
    state.pulse = null;
    hooks.sfx.plip();
    render();
    si++;
    setTimeout(runStep, 450);
  }

  function onKey(k) {
    if (cancelled) return;
    const step = guided ? steps[si] : null;
    const answer = guided ? step?.answer : L.result;
    if (answer == null) return;
    if (k === 'del') { typed = typed.slice(0, -1); hooks.sfx.tap?.(); updateEntry(); return; }
    const max = String(answer).length;
    if (typed.length >= max) return;
    typed += k;
    hooks.sfx.tap?.();
    updateEntry();
    if (typed.length < max) return;
    if (Number(typed) === answer) {
      hooks.stopSpeech();
      hooks.sfx.ding();
      updateEntry('correct');
      if (!guided) { setTimeout(finish, 500); return; }
      si++;
      setTimeout(runStep, 600);
      return;
    }
    // ตอบไม่ตรง (D1): สั่นเบาๆ + คำใบ้ ครั้งที่สองของข้อ (คิดเอง) เปิดตั้งเลขช่วย / ครั้งที่สองของขั้น (ตั้งเลข) แป้นเรืองแสง
    attempts++;
    stepMisses++;
    const kind = Number(typed) < answer ? 'short' : 'over';
    const wrong = typed;
    typed = '';   // กดใหม่ได้ทันที เลขที่ผิดแค่สั่นให้เห็นครู่เดียว (เด็กกดเร็ว เลขต้องไม่หาย)
    updateEntry('nope', wrong);
    hooks.stopSpeech();
    const hint = hooks.onMiss?.(kind, attempts);
    if (!guided && attempts >= 2) {
      usedHelp = true;
      setTimeout(() => { if (!cancelled) { say(tx('tryAgain')); switchToGuided(); } }, 650);
      return;
    }
    if (guided && stepMisses >= 2) {
      setTimeout(() => { if (!cancelled) { render({ keypad: true, glow: String(answer) }); say(tx('glowKey')); } }, 650);
      return;
    }
    say(!guided && hint ? hint : tx('tryAgain'));
    setTimeout(() => { if (!cancelled && !typed) updateEntry(); }, 650);
  }

  function updateEntry(className = '', text = typed) {
    const entry = host.querySelector('#entry');
    if (!entry) return;
    entry.textContent = text || '?';
    entry.className = `entry-box ${className}`;
  }

  async function finish() {
    if (cancelled) return;
    state.pulse = null;
    state.active = null;
    state.aid = null;
    if (guided) render();
    const eq = `${L.a} ${L.op} ${L.b} = ${L.result}`;
    prompt(eq);
    hooks.sfx.ding();
    await say(`${sentence([L.a, L.b], L.op)} ${tx('equals')} ${L.result}`);
    if (cancelled) return;
    resolveDone({ answer: L.result, attempts, usedHelp, completed: true });
  }

  if (guided) runStep(); else startIndependent();
  return {
    done,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      resolveDone({ answer: null, attempts, usedHelp, completed: false });
    }
  };
}
