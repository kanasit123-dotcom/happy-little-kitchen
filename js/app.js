const STORE_KEY = 'lilly-playhouse-v1';

const RECIPES = {
  cupcake: {
    icon: '🧁',
    name: { th: 'คัพเค้ก', en: 'Cupcake' },
    ingredients: [
      { icon: '🌾', name: { th: 'แป้ง', en: 'flour' } },
      { icon: '🥚', name: { th: 'ไข่', en: 'egg' } },
      { icon: '🥛', name: { th: 'นม', en: 'milk' } }
    ],
    tool: '🥄', appliance: '🔥', applianceClass: '', action: { th: 'คนให้เข้ากัน', en: 'Mix it together' },
    cook: { th: 'เอาเข้าเตาอบ', en: 'Bake it in the oven' }
  },
  pizza: {
    icon: '🍕',
    name: { th: 'พิซซ่า', en: 'Pizza' },
    ingredients: [
      { icon: '🍞', name: { th: 'แป้งโด', en: 'dough' } },
      { icon: '🍅', name: { th: 'มะเขือเทศ', en: 'tomato' } },
      { icon: '🧀', name: { th: 'ชีส', en: 'cheese' } }
    ],
    tool: '🥄', appliance: '🔥', applianceClass: '', action: { th: 'เกลี่ยซอสให้ทั่ว', en: 'Spread the sauce' },
    cook: { th: 'อบพิซซ่ากัน', en: 'Bake the pizza' }
  },
  smoothie: {
    icon: '🥤',
    name: { th: 'สมูทตี', en: 'Smoothie' },
    ingredients: [
      { icon: '🍓', name: { th: 'สตรอว์เบอร์รี', en: 'strawberry' } },
      { icon: '🍌', name: { th: 'กล้วย', en: 'banana' } },
      { icon: '🥛', name: { th: 'นม', en: 'milk' } }
    ],
    tool: '⚙️', appliance: '🫙', applianceClass: 'blender', action: { th: 'ปั่นผลไม้ให้เนียน', en: 'Blend it smooth' },
    cook: { th: 'กดเครื่องปั่น', en: 'Start the blender' }
  }
};

const FRIENDS = {
  seal: { src: 'assets/friends/seal.png', name: { th: 'แมวน้ำ', en: 'Seal' } },
  turtle: { src: 'assets/friends/turtle.png', name: { th: 'เต่า', en: 'Turtle' } },
  rabbit: { src: 'assets/friends/rabbit.png', name: { th: 'กระต่าย', en: 'Rabbit' } }
};

const COPY = {
  th: {
    title: 'ครัวของลิลลี่', subtitle: 'เลือกของอร่อย แล้วลงมือทำเลย', language: '🇹🇭 ไทย',
    home: 'กลับหน้าครัว', listen: 'ฟังอีกครั้ง', add: 'ลากหรือแตะวัตถุดิบใส่ชาม',
    mixHint: 'กดค้างหรือวนช้อนให้เต็ม', start: 'เริ่มเลย', decorate: 'ตกแต่งได้ตามใจ',
    done: 'เสร็จแล้ว', serve: 'เลือกเพื่อนที่จะชิม', again: 'ทำอีกจาน', gallery: 'ผลงานของลิลลี่',
    praise: ['น่ากินมาก!', 'หอมจังเลย!', 'ลิลลี่ทำเก่งมาก!'],
    friendHappy: 'อร่อยมาก ขอบคุณนะลิลลี่', ready: 'พร้อมแล้ว ไปตกแต่งกัน', mixed: 'เข้ากันดีแล้ว', cooked: 'สุกกำลังดีเลย'
  },
  en: {
    title: "Lilly's Kitchen", subtitle: 'Pick a treat and make it your way', language: '🇬🇧 ENG',
    home: 'Back to the kitchen', listen: 'Listen again', add: 'Drag or tap the ingredients into the bowl',
    mixHint: 'Hold or stir until the bar is full', start: 'Start', decorate: 'Decorate it your way',
    done: 'All done', serve: 'Choose a friend to taste it', again: 'Make another', gallery: "Lilly's creations",
    praise: ['That looks delicious!', 'It smells wonderful!', 'Great cooking, Lilly!'],
    friendHappy: 'Yummy! Thank you, Lilly!', ready: 'Ready! Let us decorate it', mixed: 'Perfectly mixed', cooked: 'Cooked just right'
  }
};

const app = document.querySelector('#app');
let state = loadState();
let activeRecipe = null;
let step = 0;
let creation = null;
let currentPrompt = '';
let audioCtx = null;
let speechQueue = Promise.resolve();
let speechGeneration = 0;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return {
      lang: saved?.lang === 'en' ? 'en' : 'th',
      sound: saved?.sound !== false,
      gallery: Array.isArray(saved?.gallery) ? saved.gallery.slice(0, 6) : []
    };
  } catch {
    return { lang: 'th', sound: true, gallery: [] };
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function t(key) { return COPY[state.lang][key]; }
function local(value) { return value[state.lang]; }

function unlockAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioCtx) audioCtx = new AudioContextClass();
  audioCtx.resume?.();
}

function tone(freq = 540, length = .12) {
  if (!state.sound) return;
  unlockAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + length);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + length);
}

function speak(text) {
  currentPrompt = text;
  if (!state.sound || !('speechSynthesis' in window)) return Promise.resolve();
  const generation = speechGeneration;
  const language = state.lang;
  speechQueue = speechQueue.then(() => new Promise((resolve) => {
    if (!state.sound || generation !== speechGeneration) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'th' ? 'th-TH' : 'en-US';
    utterance.rate = language === 'th' ? .88 : .9;
    utterance.pitch = 1.08;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(finish, Math.max(3000, text.length * 220));
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }));
  return speechQueue;
}

function stopSpeech() {
  speechGeneration++;
  window.speechSynthesis?.cancel();
  speechQueue = Promise.resolve();
}

function topbar(title, canBack = false) {
  return `<div class="topbar">
    ${canBack ? `<button class="round-btn" id="back" aria-label="${t('home')}">←</button>` : '<span class="home-spacer" style="width:58px"></span>'}
    <div class="topbar-title">${title}</div>
    <button class="language-btn" id="language" aria-label="Language">${t('language')}</button>
    <button class="round-btn" id="sound" aria-label="${t('listen')}">${state.sound ? '🔊' : '🔇'}</button>
  </div>`;
}

function bindTopbar(onBack) {
  app.querySelector('#back')?.addEventListener('click', () => { tone(360); onBack(); });
  app.querySelector('#language').onclick = () => {
    stopSpeech();
    state.lang = state.lang === 'th' ? 'en' : 'th';
    saveState();
    if (activeRecipe) renderStep(); else showHome();
  };
  app.querySelector('#sound').onclick = () => {
    state.sound = !state.sound;
    saveState();
    if (!state.sound) stopSpeech();
    if (activeRecipe) renderStep(); else showHome();
  };
  app.querySelector('#sound').addEventListener('dblclick', () => {});
}

function galleryHTML() {
  if (!state.gallery.length) return '<div class="gallery-strip" hidden></div>';
  return `<div class="gallery-strip" aria-label="${t('gallery')}">
    <span class="gallery-title">🖼️</span>
    ${state.gallery.map((item) => `<span class="gallery-item" title="${local(RECIPES[item.recipe].name)}">${RECIPES[item.recipe].icon}</span>`).join('')}
  </div>`;
}

function showHome() {
  if (activeRecipe) stopSpeech();
  activeRecipe = null;
  step = 0;
  app.innerHTML = `<div class="app-shell">
    ${topbar(t('title'))}
    <section class="home">
      <div class="brand"><h1>${t('title')}</h1><p>${t('subtitle')}</p></div>
      <div class="recipes">
        ${Object.entries(RECIPES).map(([id, recipe]) => `<button class="recipe-card" data-recipe="${id}" aria-label="${local(recipe.name)}">
          <span class="recipe-icon">${recipe.icon}</span><b>${local(recipe.name)}</b>
        </button>`).join('')}
      </div>
      ${galleryHTML()}
      <div class="friends-row" aria-hidden="true">
        ${Object.values(FRIENDS).map((friend) => `<img class="friend-peek" src="${friend.src}" alt="">`).join('')}
      </div>
    </section>
  </div>`;
  bindTopbar(showHome);
  app.querySelectorAll('[data-recipe]').forEach((button) => {
    button.onclick = async () => {
      unlockAudio();
      tone(620);
      const id = button.dataset.recipe;
      await speak(local(RECIPES[id].name));
      startRecipe(id);
    };
  });
}

function startRecipe(id) {
  activeRecipe = id;
  step = 0;
  creation = { recipe: id, color: '#ef6f61', toppings: [], friend: null, at: Date.now() };
  renderStep();
}

function dots() {
  return `<div class="progress-dots">${Array.from({ length: 5 }, (_, i) => `<i class="${i < step ? 'done' : i === step ? 'now' : ''}"></i>`).join('')}</div>`;
}

function screen(content, prompt) {
  const recipe = RECIPES[activeRecipe];
  app.innerHTML = `<div class="app-shell play-screen">
    ${topbar(`${recipe.icon} ${local(recipe.name)}`, true)}
    ${dots()}
    <div class="prompt" id="prompt">${prompt}</div>
    <section class="workbench">${content}</section>
  </div>`;
  bindTopbar(showHome);
  const sound = app.querySelector('#sound');
  sound.onclick = () => {
    state.sound = !state.sound;
    saveState();
    sound.textContent = state.sound ? '🔊' : '🔇';
    if (state.sound) speak(prompt); else stopSpeech();
  };
  if (state.sound) speak(prompt);
}

function renderStep() {
  if (!activeRecipe) return showHome();
  if (step === 0) renderIngredients();
  else if (step === 1) renderMix();
  else if (step === 2) renderCook();
  else if (step === 3) renderDecorate();
  else renderServe();
}

function renderIngredients() {
  const recipe = RECIPES[activeRecipe];
  const prompt = t('add');
  screen(`<div class="stage-zone"><div class="bowl ready" id="bowl" aria-label="bowl"></div></div>
    <div class="tray" id="ingredients">
      ${recipe.ingredients.map((item, index) => `<button class="ingredient" data-index="${index}" aria-label="${local(item.name)}">${item.icon}</button>`).join('')}
    </div>`, prompt);

  const bowl = app.querySelector('#bowl');
  let added = 0;
  const useIngredient = async (button) => {
    if (button.classList.contains('used')) return;
    button.classList.add('used');
    const item = recipe.ingredients[Number(button.dataset.index)];
    bowl.insertAdjacentHTML('beforeend', `<span class="in-bowl">${item.icon}</span>`);
    tone(520 + added * 80);
    added++;
    const isLast = added === recipe.ingredients.length;
    await speak(local(item.name));
    if (isLast) {
      bowl.classList.remove('ready');
      await speak(t('ready'));
      step++;
      renderStep();
    }
  };

  app.querySelectorAll('.ingredient').forEach((button) => {
    let drag = null;
    let suppressClick = false;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      drag = { x: event.clientX, y: event.clientY, moved: false };
      button.classList.add('dragging');
      try { button.setPointerCapture(event.pointerId); } catch {}
    });
    button.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.moved ||= Math.hypot(dx, dy) > 8;
      button.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
    });
    button.addEventListener('pointerup', (event) => {
      if (!drag) return;
      const wasDrag = drag.moved;
      drag = null;
      suppressClick = wasDrag;
      button.classList.remove('dragging');
      button.style.transform = '';
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      if (!wasDrag || hit?.closest('#bowl')) useIngredient(button);
      setTimeout(() => { suppressClick = false; }, 0);
    });
    button.addEventListener('pointercancel', () => {
      drag = null;
      button.classList.remove('dragging');
      button.style.transform = '';
    });
    button.addEventListener('click', () => {
      if (!suppressClick) useIngredient(button);
    });
  });
}

function renderMix() {
  const recipe = RECIPES[activeRecipe];
  const prompt = `${local(recipe.action)} · ${t('mixHint')}`;
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px">
      <button class="mix-tool" id="mix" aria-label="${local(recipe.action)}"><span class="mix-fill"></span><span class="spoon">${recipe.tool}</span></button>
      <div class="meter"><div class="meter-fill" id="meter"></div></div>
    </div>`, prompt);
  const tool = app.querySelector('#mix');
  const meter = app.querySelector('#meter');
  let progress = 0;
  let timer = null;
  let finished = false;
  const advance = async (amount = 4) => {
    if (finished) return;
    progress = Math.min(100, progress + amount);
    meter.style.width = `${progress}%`;
    if (progress >= 100) {
      finished = true;
      clearInterval(timer);
      tool.classList.remove('active');
      tone(760, .22);
      await speak(t('mixed'));
      step++;
      renderStep();
    }
  };
  const start = (event) => {
    event?.preventDefault();
    tool.classList.add('active');
    clearInterval(timer);
    timer = setInterval(() => advance(5), 90);
  };
  const stop = () => { clearInterval(timer); tool.classList.remove('active'); };
  tool.addEventListener('pointerdown', start);
  tool.addEventListener('pointermove', () => advance(2));
  tool.addEventListener('pointerup', stop);
  tool.addEventListener('pointercancel', stop);
  tool.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') advance(25); });
}

function renderCook() {
  const recipe = RECIPES[activeRecipe];
  const prompt = local(recipe.cook);
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px">
      <div class="appliance ${recipe.applianceClass}" id="appliance">
        <span class="appliance-icon">${recipe.appliance}</span><span class="cook-light"></span>
        <button class="action-btn" id="cook">▶ ${t('start')}</button>
      </div>
      <div class="meter"><div class="meter-fill" id="meter"></div></div>
    </div>`, prompt);
  app.querySelector('#cook').onclick = async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const appliance = app.querySelector('#appliance');
    const meter = app.querySelector('#meter');
    appliance.classList.add('running');
    tone(activeRecipe === 'smoothie' ? 190 : 430, .35);
    for (let value = 0; value <= 100; value += 4) {
      meter.style.width = `${value}%`;
      await new Promise((resolve) => setTimeout(resolve, 55));
    }
    appliance.classList.remove('running');
    tone(820, .25);
    await speak(t('cooked'));
    step++;
    renderStep();
  };
}

const COLORS = ['#ef6f61', '#f4bd3f', '#54b99a', '#67bde3', '#9a78bd'];
const TOPPINGS = ['⭐', '🍓', '🌈', '🫐', '🍒'];
const POSITIONS = [[25,24], [68,28], [48,48], [28,66], [70,68], [48,20], [18,46], [78,48]];

function dishHTML() {
  const recipe = RECIPES[activeRecipe];
  return `<div class="dish" id="dish">
    <span class="food-color" id="food-color" style="background:${creation.color}"></span>
    <span class="food-icon">${recipe.icon}</span>
    ${creation.toppings.map((top, index) => `<span class="topping" style="left:${POSITIONS[index % POSITIONS.length][0]}%;top:${POSITIONS[index % POSITIONS.length][1]}%">${top}</span>`).join('')}
  </div>`;
}

function renderDecorate() {
  const prompt = t('decorate');
  screen(`<div class="stage-zone">${dishHTML()}</div>
    <div class="tray decorate-controls">
      ${COLORS.map((color) => `<button class="swatch ${color === creation.color ? 'selected' : ''}" data-color="${color}" style="background:${color}" aria-label="color"></button>`).join('')}
      ${TOPPINGS.map((top) => `<button class="topping-btn" data-top="${top}" aria-label="topping">${top}</button>`).join('')}
      <button class="action-btn primary" id="done" ${creation.toppings.length ? '' : 'disabled'}>✓ ${t('done')}</button>
    </div>`, prompt);
  app.querySelectorAll('.swatch').forEach((button) => {
    button.onclick = () => {
      creation.color = button.dataset.color;
      tone(580);
      app.querySelector('#food-color').style.background = creation.color;
      app.querySelectorAll('.swatch').forEach((swatch) => swatch.classList.toggle('selected', swatch === button));
    };
  });
  app.querySelectorAll('.topping-btn').forEach((button) => {
    button.onclick = () => {
      if (creation.toppings.length >= 8) return;
      creation.toppings.push(button.dataset.top);
      tone(680 + creation.toppings.length * 20);
      const [left, top] = POSITIONS[(creation.toppings.length - 1) % POSITIONS.length];
      app.querySelector('#dish').insertAdjacentHTML('beforeend', `<span class="topping" style="left:${left}%;top:${top}%">${button.dataset.top}</span>`);
      app.querySelector('#done').disabled = false;
    };
  });
  app.querySelector('#done').onclick = async () => {
    await speak(COPY[state.lang].praise[Math.floor(Math.random() * COPY[state.lang].praise.length)]);
    step++;
    renderStep();
  };
}

function renderServe() {
  const prompt = t('serve');
  screen(`<div class="stage-zone">
      <div class="serve-layout">${dishHTML()}<div class="customer-grid">
        ${Object.entries(FRIENDS).map(([id, friend]) => `<button class="friend-btn" data-friend="${id}" aria-label="${local(friend.name)}"><img src="${friend.src}" alt="${local(friend.name)}"></button>`).join('')}
      </div></div>
    </div>
    <div class="finish-actions" id="finish-actions" hidden>
      <button class="action-btn primary" id="again">↻ ${t('again')}</button>
      <button class="action-btn" id="home">⌂ ${t('home')}</button>
    </div>`, prompt);
  app.querySelectorAll('.friend-btn').forEach((button) => {
    button.onclick = async () => {
      if (creation.friend) return;
      creation.friend = button.dataset.friend;
      button.classList.add('happy');
      state.gallery.unshift({ ...creation });
      state.gallery = state.gallery.slice(0, 6);
      saveState();
      tone(880, .35);
      confetti();
      await speak(t('friendHappy'));
      const actions = app.querySelector('#finish-actions');
      actions.hidden = false;
      app.querySelector('#again').onclick = () => startRecipe(activeRecipe);
      app.querySelector('#home').onclick = showHome;
    };
  });
}

function confetti() {
  const layer = document.createElement('div');
  layer.className = 'celebration';
  const colors = ['#ef6f61', '#f4bd3f', '#54b99a', '#67bde3', '#9a78bd'];
  layer.innerHTML = Array.from({ length: 34 }, (_, i) => `<i class="confetti" style="left:${(i * 29) % 100}%;background:${colors[i % colors.length]};animation-delay:${(i % 8) * .05}s"></i>`).join('');
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2300);
}

document.addEventListener('pointerdown', unlockAudio, { once: true });
showHome();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
