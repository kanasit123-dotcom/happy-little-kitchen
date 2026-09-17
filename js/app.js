const STORE_KEY = 'happy-little-kitchen-v1';
const LEGACY_STORE_KEY = 'lilly-playhouse-v1';

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
    cook: { th: 'แตะปุ่มอบหลายครั้งจนแถบเต็ม', en: 'Tap the bake button until the bar is full' }
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
    cook: { th: 'แตะปุ่มอบหลายครั้งจนแถบเต็ม', en: 'Tap the bake button until the bar is full' }
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
    cook: { th: 'แตะปุ่มปั่นหลายครั้งจนแถบเต็ม', en: 'Tap the blend button until the bar is full' }
  }
};

const FRIENDS = {
  seal: { src: 'assets/friends/seal.png', name: { th: 'แมวน้ำ', en: 'Seal' } },
  turtle: { src: 'assets/friends/turtle.png', name: { th: 'เต่า', en: 'Turtle' } },
  rabbit: { src: 'assets/friends/rabbit.png', name: { th: 'กระต่าย', en: 'Rabbit' } }
};

const COPY = {
  th: {
    title: 'ครัวจิ๋วแสนสนุก', subtitle: 'เลือกของอร่อย แล้วลงมือทำเลย', language: '🇹🇭 ไทย',
    home: 'กลับหน้าครัว', listen: 'ฟังอีกครั้ง', add: 'ลากวัตถุดิบลงชาม หรือแตะของแล้วแตะชาม',
    mixHint: 'แตะปุ่มคนหลายครั้งจนแถบเต็ม', start: 'เริ่มเลย', tapMix: 'แตะเพื่อคน', tapBake: 'แตะเพื่ออบ', tapBlend: 'แตะเพื่อปั่น', decorate: 'ตกแต่งได้ตามใจ',
    done: 'เสร็จแล้ว', serve: 'เลือกเพื่อนที่จะชิม', again: 'ทำอีกจาน', gallery: 'ผลงานของฉัน', place: 'แตะจุดบนอาหาร หรือลากไปวาง',
    praise: ['น่ากินมาก!', 'หอมจังเลย!', 'ทำเก่งมาก!'],
    friendHappy: 'อร่อยมาก ขอบคุณนะ', ready: 'พร้อมแล้ว ไปตกแต่งกัน', mixed: 'เข้ากันดีแล้ว', cooked: 'สุกกำลังดีเลย'
  },
  en: {
    title: 'Happy Little Kitchen', subtitle: 'Pick a treat and make it your way', language: '🇬🇧 ENG',
    home: 'Back to the kitchen', listen: 'Listen again', add: 'Drag into the bowl, or tap an item then tap the bowl',
    mixHint: 'Tap the mix button until the bar is full', start: 'Start', tapMix: 'Tap to mix', tapBake: 'Tap to bake', tapBlend: 'Tap to blend', decorate: 'Decorate it your way',
    done: 'All done', serve: 'Choose a friend to taste it', again: 'Make another', gallery: 'My creations', place: 'Tap the food or drag to place it',
    praise: ['That looks delicious!', 'It smells wonderful!', 'Great cooking!'],
    friendHappy: 'Yummy! Thank you!', ready: 'Ready! Let us decorate it', mixed: 'Perfectly mixed', cooked: 'Cooked just right'
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
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_STORE_KEY));
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

function bindDragChoice(button, options) {
  let active = null;
  let ignoreClick = false;

  const clear = () => {
    if (!active) return;
    window.removeEventListener('pointermove', active.move);
    window.removeEventListener('pointerup', active.up);
    window.removeEventListener('pointercancel', active.cancel);
    active.ghost?.remove();
    button.classList.remove('drag-source');
    options.onHover?.(false);
    active = null;
  };

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (button.disabled || button.classList.contains('used')) return;
    event.preventDefault();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;

    const move = (moveEvent) => {
      if (!active || moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!active.moved && distance >= 8) {
        active.moved = true;
        const ghost = button.cloneNode(true);
        ghost.className = `${button.className} drag-ghost`;
        ghost.removeAttribute('data-index');
        ghost.removeAttribute('data-top');
        ghost.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ghost);
        active.ghost = ghost;
        button.classList.add('drag-source');
      }
      if (!active.moved) return;
      active.ghost.style.left = `${moveEvent.clientX}px`;
      active.ghost.style.top = `${moveEvent.clientY}px`;
      options.onHover?.(options.isOverTarget(moveEvent.clientX, moveEvent.clientY));
    };

    const up = (upEvent) => {
      if (!active || upEvent.pointerId !== pointerId) return;
      const moved = active.moved;
      const overTarget = moved && options.isOverTarget(upEvent.clientX, upEvent.clientY);
      ignoreClick = true;
      clear();
      if (!moved) options.onTap();
      else if (overTarget) options.onDrop(upEvent.clientX, upEvent.clientY);
      else options.onMiss?.();
      setTimeout(() => { ignoreClick = false; }, 0);
    };

    const cancel = (cancelEvent) => {
      if (active && cancelEvent.pointerId === pointerId) clear();
    };

    active = { moved: false, ghost: null, move, up, cancel };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  });

  button.addEventListener('click', () => {
    if (!ignoreClick) options.onTap();
  });
}

function renderIngredients() {
  const recipe = RECIPES[activeRecipe];
  const prompt = t('add');
  screen(`<div class="stage-zone"><button class="bowl ready" id="bowl" aria-label="bowl"></button></div>
    <div class="tray" id="ingredients">
      ${recipe.ingredients.map((item, index) => `<button class="ingredient" data-index="${index}" aria-label="${local(item.name)}">${item.icon}</button>`).join('')}
    </div>`, prompt);

  const bowl = app.querySelector('#bowl');
  let added = 0;
  let selected = null;
  const isOverBowl = (x, y) => {
    const rect = bowl.getBoundingClientRect();
    const padding = 54;
    return x >= rect.left - padding && x <= rect.right + padding
      && y >= rect.top - padding && y <= rect.bottom + padding;
  };
  const selectIngredient = (button) => {
    if (button.classList.contains('used')) return;
    selected?.classList.remove('selected');
    selected = button;
    selected.classList.add('selected');
    bowl.classList.add('awaiting-drop');
    tone(470);
  };
  const useIngredient = async (button) => {
    if (button.classList.contains('used')) return;
    button.classList.add('used');
    button.classList.remove('selected');
    if (selected === button) selected = null;
    bowl.classList.remove('awaiting-drop');
    bowl.classList.add('drop-target');
    setTimeout(() => bowl.isConnected && bowl.classList.remove('drop-target'), 420);
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
    bindDragChoice(button, {
      onTap: () => selectIngredient(button),
      isOverTarget: isOverBowl,
      onHover: (over) => bowl.classList.toggle('drop-target', over),
      onDrop: () => useIngredient(button),
      onMiss: () => {
        bowl.classList.add('drop-miss');
        setTimeout(() => bowl.isConnected && bowl.classList.remove('drop-miss'), 380);
      }
    });
  });
  bowl.addEventListener('click', () => {
    if (selected) useIngredient(selected);
  });
}

function renderMix() {
  const recipe = RECIPES[activeRecipe];
  const prompt = `${local(recipe.action)} · ${t('mixHint')}`;
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:16px">
      <button class="mix-tool" id="mix" aria-label="${t('tapMix')}"><span class="mix-fill"></span><span class="spoon">${recipe.tool}</span></button>
      <div class="meter"><div class="meter-fill" id="meter"></div></div>
      <button class="action-btn primary tap-action" id="mix-button">🥄 ${t('tapMix')}</button>
    </div>`, prompt);
  const tool = app.querySelector('#mix');
  const button = app.querySelector('#mix-button');
  const meter = app.querySelector('#meter');
  let progress = 0;
  let finished = false;
  const advance = async () => {
    if (finished) return;
    progress = Math.min(100, progress + 12.5);
    meter.style.width = `${progress}%`;
    tool.classList.remove('tap-once');
    button.classList.remove('tap-once');
    requestAnimationFrame(() => {
      tool.classList.add('tap-once');
      button.classList.add('tap-once');
    });
    setTimeout(() => {
      tool.classList.remove('tap-once');
      button.classList.remove('tap-once');
    }, 360);
    tone(430 + progress * 2, .09);
    if (progress >= 100) {
      finished = true;
      button.disabled = true;
      tool.disabled = true;
      tone(760, .22);
      await new Promise((resolve) => setTimeout(resolve, 700));
      await speak(t('mixed'));
      step++;
      renderStep();
    }
  };
  tool.addEventListener('click', advance);
  button.addEventListener('click', advance);
}

function renderCook() {
  const recipe = RECIPES[activeRecipe];
  const prompt = local(recipe.cook);
  const machine = activeRecipe === 'smoothie'
    ? `<div class="blender-machine">
        <div class="blender-lid"></div>
        <div class="blender-jar">
          <div class="blender-liquid"></div>
          <div class="blender-fruit">🍓 🍌</div>
          <div class="blender-blades">✦</div>
        </div>
        <div class="blender-base"><span class="cook-light"></span></div>
      </div>`
    : `<div class="oven-machine">
        <div class="oven-controls"><i></i><i></i><i></i><span class="cook-light"></span></div>
        <div class="oven-handle"></div>
        <div class="oven-window">
          <div class="heat-lines"><i></i><i></i><i></i></div>
          <div class="oven-rack"></div>
          <span class="oven-food">${recipe.icon}</span>
        </div>
      </div>`;
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px">
      <div class="appliance ${recipe.applianceClass}" id="appliance">
        ${machine}
        <button class="action-btn primary tap-action" id="cook">👆 ${activeRecipe === 'smoothie' ? t('tapBlend') : t('tapBake')}</button>
      </div>
      <div class="meter"><div class="meter-fill" id="meter"></div></div>
    </div>`, prompt);
  let progress = 0;
  let finished = false;
  let effectTimer = null;
  app.querySelector('#cook').onclick = async (event) => {
    if (finished) return;
    const button = event.currentTarget;
    const appliance = app.querySelector('#appliance');
    const meter = app.querySelector('#meter');
    progress = Math.min(100, progress + (100 / 12));
    meter.style.width = `${progress}%`;
    button.classList.remove('tap-once');
    appliance.classList.add('running');
    requestAnimationFrame(() => button.classList.add('tap-once'));
    setTimeout(() => button.classList.remove('tap-once'), 320);
    tone(activeRecipe === 'smoothie' ? 190 + progress : 390 + progress * 2, .13);
    clearTimeout(effectTimer);
    effectTimer = setTimeout(() => appliance.classList.remove('running'), 650);
    if (progress < 99.9) return;
    finished = true;
    button.disabled = true;
    clearTimeout(effectTimer);
    appliance.classList.add('running');
    await new Promise((resolve) => setTimeout(resolve, 1600));
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
    ${creation.toppings.map((top, index) => {
      const fallback = POSITIONS[index % POSITIONS.length];
      const item = typeof top === 'string' ? { icon: top, x: fallback[0], y: fallback[1] } : top;
      return `<span class="topping" style="left:${item.x}%;top:${item.y}%">${item.icon}</span>`;
    }).join('')}
  </div>`;
}

function renderDecorate() {
  const prompt = t('decorate');
  screen(`<div class="stage-zone">${dishHTML()}</div>
    <div class="tray decorate-controls">
      ${COLORS.map((color) => `<button class="swatch ${color === creation.color ? 'selected' : ''}" data-color="${color}" style="background:${color}" aria-label="color"></button>`).join('')}
      ${TOPPINGS.map((top) => `<button class="topping-btn" data-top="${top}" aria-label="topping">${top}</button>`).join('')}
      <button class="action-btn primary" id="done">✓ ${t('done')}</button>
    </div>`, prompt);
  const dish = app.querySelector('#dish');
  const promptElement = app.querySelector('#prompt');
  let selectedTop = null;
  const isOverDish = (x, y) => {
    const rect = dish.getBoundingClientRect();
    const padding = 20;
    return x >= rect.left - padding && x <= rect.right + padding
      && y >= rect.top - padding && y <= rect.bottom + padding;
  };
  const selectTopping = (button) => {
    selectedTop = button.dataset.top;
    app.querySelectorAll('.topping-btn').forEach((item) => item.classList.toggle('selected', item === button));
    dish.classList.add('awaiting-drop');
    promptElement.textContent = `${selectedTop} ${t('place')}`;
    tone(560);
  };
  const placeTopping = (icon, clientX, clientY) => {
    if (creation.toppings.length >= 8) return;
    const rect = dish.getBoundingClientRect();
    const x = Math.max(15, Math.min(80, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(15, Math.min(80, ((clientY - rect.top) / rect.height) * 100));
    creation.toppings.push({ icon, x, y });
    dish.insertAdjacentHTML('beforeend', `<span class="topping" style="left:${x}%;top:${y}%">${icon}</span>`);
    tone(680 + creation.toppings.length * 20);
  };
  app.querySelectorAll('.swatch').forEach((button) => {
    button.onclick = () => {
      creation.color = button.dataset.color;
      tone(580);
      app.querySelector('#food-color').style.background = creation.color;
      app.querySelectorAll('.swatch').forEach((swatch) => swatch.classList.toggle('selected', swatch === button));
    };
  });
  app.querySelectorAll('.topping-btn').forEach((button) => {
    bindDragChoice(button, {
      onTap: () => selectTopping(button),
      isOverTarget: isOverDish,
      onHover: (over) => dish.classList.toggle('drop-target', over),
      onDrop: (x, y) => placeTopping(button.dataset.top, x, y),
      onMiss: () => {
        dish.classList.add('drop-miss');
        setTimeout(() => dish.isConnected && dish.classList.remove('drop-miss'), 380);
      }
    });
  });
  dish.addEventListener('click', (event) => {
    if (selectedTop) placeTopping(selectedTop, event.clientX, event.clientY);
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
