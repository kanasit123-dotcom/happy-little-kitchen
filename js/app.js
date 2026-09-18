const STORE_KEY = 'happy-little-kitchen-v1';
const LEGACY_STORE_KEY = 'lilly-playhouse-v1';

// ชื่อ key ทุกตาราง = ชื่อไฟล์รูปใน assets/<กลุ่ม>/<key>.png
// prep = ต้องเตรียมก่อนใส่ชาม: 'cut' ปาดนิ้วหั่น 3 ครั้ง, 'crack' แตะ 2 ครั้งให้แตก → รูปเปลี่ยนเป็น assets/ingredients/<key>-cut.png / egg-cracked.png
const INGREDIENTS = {
  flour: { th: 'แป้ง', en: 'flour' },
  egg: { th: 'ไข่', en: 'egg', prep: 'crack', prepared: 'egg-cracked' },
  milk: { th: 'นม', en: 'milk' },
  dough: { th: 'แป้งโด', en: 'dough' },
  tomato: { th: 'มะเขือเทศ', en: 'tomato', prep: 'cut', prepared: 'tomato-cut' },
  cheese: { th: 'ชีส', en: 'cheese' },
  strawberry: { th: 'สตรอว์เบอร์รี', en: 'strawberry', prep: 'cut', prepared: 'strawberry-cut' },
  banana: { th: 'กล้วย', en: 'banana', prep: 'cut', prepared: 'banana-cut' },
  springonion: { th: 'ต้นหอม', en: 'spring onion', prep: 'cut', prepared: 'springonion-cut' },
  noodles: { th: 'เส้นก๋วยเตี๋ยว', en: 'noodles' },
  bokchoy: { th: 'ผักกวางตุ้ง', en: 'bok choy', prep: 'cut', prepared: 'bokchoy-cut' },
  fishball: { th: 'ลูกชิ้นปลา', en: 'fish balls' },
  butter: { th: 'เนย', en: 'butter', prep: 'cut', prepared: 'butter-cut' },
  sugar: { th: 'น้ำตาล', en: 'sugar' },
  bread: { th: 'ขนมปัง', en: 'bread', prep: 'cut', prepared: 'bread-cut' },
  honey: { th: 'น้ำผึ้ง', en: 'honey' },
  chocchips: { th: 'ช็อกโกแลตชิป', en: 'chocolate chips' }
};
const CUT_SWIPES = 3;
const CRACK_TAPS = 2;
const STEPS = ['prep', 'add', 'mix', 'cook', 'decorate', 'serve'];

// motion = ท่าลากตอนผสม: stir ลากวน, whisk ลากไปมาเร็วๆ, roll ลากซ้ายขวา, spread ลากให้ทั่ว
const TOOLS = {
  spoon: { th: 'ช้อน', en: 'spoon', motion: 'stir' },
  whisk: { th: 'ตะกร้อ', en: 'whisk', motion: 'whisk' },
  ladle: { th: 'ทัพพี', en: 'ladle', motion: 'stir' },
  rollingpin: { th: 'ไม้นวดแป้ง', en: 'rolling pin', motion: 'roll' },
  knife: { th: 'มีดทาเนย', en: 'butter knife', motion: 'spread' }
};
// ระยะที่ต้องลากจนแถบเต็ม: stir = จำนวนรอบ, อื่นๆ = พิกเซล
const MIX_GOAL = { stir: 3, whisk: 2000, roll: 1800, spread: 2000 };
const MIX_TAP_GAIN = 5;
const MAX_TOPPINGS = 30;

const APPLIANCES = {
  oven: { cook: { th: 'กดเตาอบค้างไว้จนแถบเต็ม', en: 'Press and hold the oven until the bar is full' }, done: { th: 'สุกกำลังดีเลย', en: 'Baked just right' }, tone: 430 },
  blender: { cook: { th: 'กดเครื่องปั่นค้างไว้จนแถบเต็ม', en: 'Press and hold the blender until the bar is full' }, done: { th: 'เนียนกำลังดี', en: 'Smooth and creamy' }, tone: 210 },
  pan: { cook: { th: 'กดกระทะค้างไว้จนแถบเต็ม', en: 'Press and hold the pan until the bar is full' }, done: { th: 'สุกหอมเลย', en: 'Fried golden' }, tone: 380 },
  pot: { cook: { th: 'กดหม้อค้างไว้จนแถบเต็ม', en: 'Press and hold the pot until the bar is full' }, done: { th: 'ร้อนๆ ได้ที่แล้ว', en: 'Hot and ready' }, tone: 300 },
  freezer: { cook: { th: 'กดตู้แช่แข็งค้างไว้จนแถบเต็ม', en: 'Press and hold the freezer until the bar is full' }, done: { th: 'เย็นเจี๊ยบแล้ว', en: 'Frozen and ready' }, tone: 620 },
  toaster: { cook: { th: 'กดเครื่องปิ้งค้างไว้จนแถบเต็ม', en: 'Press and hold the toaster until the bar is full' }, done: { th: 'กรอบกำลังดี', en: 'Toasted golden' }, tone: 500 }
};

// ท็อปปิ้ง = ชื่อไฟล์ใน assets/toppings/ (ผลงานเก่าเก็บเป็น emoji)
const LEGACY_TOPPINGS = { '⭐': 'star', '🍓': 'strawberry', '🌈': 'rainbow', '🫐': 'blueberry', '🍒': 'cherry' };

const RECIPES = {
  cupcake: {
    name: { th: 'คัพเค้ก', en: 'Cupcake' }, ingredients: ['flour', 'egg', 'milk'], tool: 'spoon', appliance: 'oven',
    action: { th: 'คนให้เข้ากัน', en: 'Mix it together' }, toppings: ['star', 'strawberry', 'rainbow', 'blueberry', 'cherry', 'sprinkles', 'chocsauce', 'heart', 'marshmallow', 'kiwi']
  },
  pizza: {
    name: { th: 'พิซซ่า', en: 'Pizza' }, ingredients: ['dough', 'tomato', 'cheese'], tool: 'spoon', appliance: 'oven',
    action: { th: 'เกลี่ยซอสให้ทั่ว', en: 'Spread the sauce' }, toppings: ['mushroom', 'olive', 'corn', 'pineapple', 'pepper', 'tomatoslice', 'shrimp', 'chili', 'mint', 'sesame']
  },
  smoothie: {
    name: { th: 'สมูทตี', en: 'Smoothie' }, ingredients: ['strawberry', 'banana', 'milk'], tool: 'spoon', appliance: 'blender',
    action: { th: 'คนผลไม้กับนม', en: 'Stir the fruit and milk' }, toppings: ['cream', 'cherry', 'strawberry', 'banana', 'marshmallow', 'kiwi', 'orange', 'mint', 'sprinkles', 'chocsauce']
  },
  omelet: {
    name: { th: 'ไข่เจียว', en: 'Omelet' }, ingredients: ['egg', 'springonion', 'tomato'], tool: 'whisk', appliance: 'pan',
    action: { th: 'ตีไข่ให้ฟู', en: 'Whisk the eggs' }, toppings: ['ketchup', 'springonion', 'corn', 'carrot', 'peas', 'chili', 'tomatoslice', 'cucumber', 'shrimp', 'sesame']
  },
  noodles: {
    name: { th: 'ก๋วยเตี๋ยว', en: 'Noodle soup' }, ingredients: ['noodles', 'bokchoy', 'fishball'], tool: 'ladle', appliance: 'pot',
    action: { th: 'คนให้เข้ากัน', en: 'Stir it together' }, toppings: ['egg', 'springonion', 'coriander', 'corn', 'carrot', 'chili', 'lime', 'shrimp', 'seaweed', 'sesame']
  },
  cookie: {
    name: { th: 'คุกกี้', en: 'Cookie' }, ingredients: ['flour', 'butter', 'chocchips'], tool: 'rollingpin', appliance: 'oven',
    action: { th: 'คลึงแป้งให้แบน', en: 'Roll the dough flat' }, toppings: ['chocchip', 'star', 'heart', 'rainbow', 'marshmallow', 'sprinkles', 'chocsauce', 'honeydrizzle', 'starcookie', 'banana']
  },
  icecream: {
    name: { th: 'ไอศกรีม', en: 'Ice cream' }, ingredients: ['milk', 'strawberry', 'sugar'], tool: 'whisk', appliance: 'freezer',
    action: { th: 'ตีให้เนียน', en: 'Whisk until smooth' }, toppings: ['cherry', 'wafer', 'chocchip', 'star', 'banana', 'sprinkles', 'chocsauce', 'kiwi', 'orange', 'mint']
  },
  toast: {
    name: { th: 'ขนมปังปิ้ง', en: 'Toast' }, ingredients: ['bread', 'butter', 'honey'], tool: 'knife', appliance: 'toaster',
    action: { th: 'ทาเนยให้ทั่ว', en: 'Spread the butter' }, toppings: ['banana', 'strawberry', 'blueberry', 'chocchip', 'heart', 'honeydrizzle', 'chocsauce', 'kiwi', 'orange', 'sprinkles']
  },
  cake: {
    name: { th: 'เค้กวันเกิด', en: 'Birthday cake' }, ingredients: ['flour', 'egg', 'sugar'], tool: 'whisk', appliance: 'oven',
    action: { th: 'ตีให้ฟู', en: 'Whisk until fluffy' }, toppings: ['candle', 'cream', 'strawberry', 'star', 'heart', 'sprinkles', 'chocsauce', 'cherry', 'starcookie', 'blueberry']
  }
};

const COLORS = ['#ef6f61', '#f4bd3f', '#54b99a', '#67bde3', '#9a78bd'];
const POSITIONS = [[25,24], [68,28], [48,48], [28,66], [70,68], [48,20], [18,46], [78,48]];

// likes = เมนูโปรด (กินแล้วดีใจสุดๆ) · unlock = จำนวนครั้งที่ป้อนเพื่อนสะสม ก่อนตัวนี้จะมาเล่นด้วย
const FRIENDS = {
  seal: { name: { th: 'แมวน้ำ', en: 'Seal' }, likes: ['icecream', 'smoothie', 'noodles'], unlock: 0 },
  turtle: { name: { th: 'เต่า', en: 'Turtle' }, likes: ['noodles', 'omelet', 'pizza'], unlock: 0 },
  rabbit: { name: { th: 'กระต่าย', en: 'Rabbit' }, likes: ['cake', 'cupcake', 'cookie'], unlock: 0 },
  cat: { name: { th: 'แมว', en: 'Cat' }, likes: ['omelet', 'toast', 'noodles'], unlock: 3 },
  penguin: { name: { th: 'เพนกวิน', en: 'Penguin' }, likes: ['icecream', 'smoothie', 'toast'], unlock: 6 },
  fox: { name: { th: 'จิ้งจอก', en: 'Fox' }, likes: ['pizza', 'cookie', 'omelet'], unlock: 10 },
  unicorn: { name: { th: 'ยูนิคอร์น', en: 'Unicorn' }, likes: ['cake', 'cupcake', 'icecream'], unlock: 14 },
  dolphin: { name: { th: 'โลมา', en: 'Dolphin' }, likes: ['smoothie', 'noodles', 'toast'], unlock: 18 },
  butterfly: { name: { th: 'ผีเสื้อ', en: 'Butterfly' }, likes: ['cupcake', 'cake', 'smoothie'], unlock: 22 },
  octopus: { name: { th: 'หมึกยักษ์', en: 'Octopus' }, likes: ['noodles', 'pizza', 'omelet'], unlock: 26 },
  squirrel: { name: { th: 'กระรอก', en: 'Squirrel' }, likes: ['cookie', 'toast', 'cake'], unlock: 30 }
};
// รูปหน้าตาที่วาดแล้ว: assets/friends/<id>-<อารมณ์>.png (ตัว/อารมณ์ที่ยังไม่มีใช้ท่า CSS + รูปปกติ)
const FRIEND_ART = {
  seal: ['love', 'yum', 'sneeze', 'full'],
  turtle: ['love', 'yum', 'sneeze', 'full'],
  rabbit: ['love', 'yum', 'sneeze', 'full']
};
const FRIEND_MAX_ON_SCREEN = 4;
// ปฏิกิริยาตอนกิน เรียงตามลำดับที่เช็ก: จาม (มีพริกหวาน) > อิ่มแปล้ (ท็อปปิ้ง 10+) > ชอบสุดๆ (เมนูโปรด/ตามสั่ง) > อร่อย
const REACTIONS = {
  sneeze: { th: 'ฮัดเช้ย! จี๊ดจ๊าดจัง', en: 'Achoo! So zingy!', tone: 300, particle: '💨' },
  full: { th: 'อิ่มแปล้เลย', en: 'So full!', tone: 380, particle: '💤' },
  love: { th: 'ชอบที่สุดเลย!', en: 'My favorite!', tone: 980, particle: '💗' },
  yum: { th: 'อร่อยมาก ขอบคุณนะ', en: 'Yummy! Thank you!', tone: 880, particle: '✨' }
};
const SNEEZE_TOPPINGS = ['pepper', 'chili'];
const FULL_TOPPINGS = 10;

const COPY = {
  th: {
    title: 'ครัวจิ๋วแสนสนุก', subtitle: 'เลือกของอร่อย แล้วลงมือทำเลย', language: '🇹🇭 ไทย',
    home: 'กลับหน้าครัว', listen: 'ฟังอีกครั้ง', add: 'ลากวัตถุดิบลงชาม หรือแตะของแล้วแตะชาม',
    cut: 'ปาดนิ้วหั่น', crack: 'แตะให้แตก', cutDone: 'หั่นแล้ว', crackDone: 'แตกแล้ว', prepDone: 'เตรียมเสร็จแล้ว ไปใส่ชามกัน', draw: 'ลากนิ้วบนอาหารเพื่อวาดครีม',
    mixHint: { stir: 'ลากวนๆ ในชามจนแถบเต็ม', whisk: 'ลากไปมาเร็วๆ จนแถบเต็ม', roll: 'ลากซ้ายขวาจนแถบเต็ม', spread: 'ลากไปมาให้ทั่วจนแถบเต็ม' },
    start: 'เริ่มเลย', hold: 'กดค้าง', decorate: 'ตกแต่งได้ตามใจ',
    done: 'เสร็จแล้ว', serve: 'ลากอาหารไปหาเพื่อน ป้อนได้หลายคน', again: 'ทำอีกจาน', gallery: 'ผลงานของฉัน', place: 'แตะจุดบนอาหาร หรือลากไปวาง',
    praise: ['น่ากินมาก!', 'หอมจังเลย!', 'ทำเก่งมาก!'],
    ready: 'พร้อมแล้ว ไปตกแต่งกัน', wants: 'อยากกิน', orderDone: 'ตรงใจเลย ขอบคุณนะ!', newFriend: 'เพื่อนใหม่มาเล่นด้วย', nextFriend: 'เพื่อนคนต่อไป', ok: 'ตกลง',
    mixed: { stir: 'เข้ากันดีแล้ว', whisk: 'ฟูกำลังดี', roll: 'แบนสวยเลย', spread: 'ทาทั่วแล้ว' }
  },
  en: {
    title: 'Happy Little Kitchen', subtitle: 'Pick a treat and make it your way', language: '🇬🇧 ENG',
    home: 'Back to the kitchen', listen: 'Listen again', add: 'Drag into the bowl, or tap an item then tap the bowl',
    cut: 'Swipe to slice the', crack: 'Tap to crack the', cutDone: 'sliced', crackDone: 'cracked', prepDone: 'All prepped! Into the bowl', draw: 'Drag on the food to draw frosting',
    mixHint: { stir: 'Drag in circles until the bar is full', whisk: 'Drag back and forth until the bar is full', roll: 'Drag left and right until the bar is full', spread: 'Drag all over until the bar is full' },
    start: 'Start', hold: 'Hold', decorate: 'Decorate it your way',
    done: 'All done', serve: 'Drag food to friends. You can feed more than one', again: 'Make another', gallery: 'My creations', place: 'Tap the food or drag to place it',
    praise: ['That looks delicious!', 'It smells wonderful!', 'Great cooking!'],
    ready: 'Ready! Let us decorate it', wants: 'wants to eat', orderDone: 'Just what I wanted! Thank you!', newFriend: 'A new friend came to play', nextFriend: 'Next friend', ok: 'OK',
    mixed: { stir: 'Perfectly mixed', whisk: 'Nice and fluffy', roll: 'Rolled out nicely', spread: 'All spread out' }
  }
};

const app = document.querySelector('#app');
let state = loadState();
saveState(); // เขียนกลับทันที ผลงานเก่าจะได้อยู่ในรูปแบบใหม่
let activeRecipe = null;
let step = 0;
let creation = null;
let currentPrompt = '';
let audioCtx = null;
let speechQueue = Promise.resolve();
let speechGeneration = 0;

const dishSrc = (id) => `assets/dishes/${id}.png`;
const ingredientSrc = (id) => `assets/ingredients/${id}.png`;
const toolSrc = (id) => `assets/tools/${id}.png`;
const applianceSrc = (id) => `assets/appliances/${id}.png`;
const toppingSrc = (id) => `assets/toppings/${id}.png`;
const preparedSrc = (id) => INGREDIENTS[id].prepared ? `assets/ingredients/${INGREDIENTS[id].prepared}.png` : ingredientSrc(id);
const prepList = (recipe) => recipe.ingredients.filter((id) => INGREDIENTS[id].prep);

function normalizeTopping(top, index) {
  const fallback = POSITIONS[index % POSITIONS.length];
  if (typeof top === 'string') return { key: LEGACY_TOPPINGS[top] || 'star', x: fallback[0], y: fallback[1] };
  const key = top.key || LEGACY_TOPPINGS[top.icon] || 'star';
  return { key, x: Number.isFinite(top.x) ? top.x : fallback[0], y: Number.isFinite(top.y) ? top.y : fallback[1] };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_STORE_KEY));
    const gallery = Array.isArray(saved?.gallery) ? saved.gallery : [];
    const order = saved?.order && FRIENDS[saved.order.friend] && RECIPES[saved.order.recipe] ? saved.order : null;
    return {
      lang: saved?.lang === 'en' ? 'en' : 'th',
      sound: saved?.sound !== false,
      gallery: gallery
        .filter((item) => item && RECIPES[item.recipe])
        .slice(0, 6)
        .map((item) => ({ ...item, toppings: (Array.isArray(item.toppings) ? item.toppings : []).map(normalizeTopping) })),
      served: Number.isFinite(saved?.served) ? saved.served : 0,
      ordersDone: Number.isFinite(saved?.ordersDone) ? saved.ordersDone : 0,
      order
    };
  } catch {
    return { lang: 'th', sound: true, gallery: [], served: 0, ordersDone: 0, order: null };
  }
}

const friendSrc = (id, expression) => (expression && FRIEND_ART[id]?.includes(expression)) ? `assets/friends/${id}-${expression}.png` : `assets/friends/${id}.png`;
const unlockedFriends = () => Object.keys(FRIENDS).filter((id) => FRIENDS[id].unlock <= state.served);
const nextLockedFriend = () => Object.keys(FRIENDS).find((id) => FRIENDS[id].unlock > state.served) || null;
const todayKey = () => new Date().toISOString().slice(0, 10);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// เพื่อนคนหนึ่งขออาหาร 1 เมนู (จากเมนูโปรดของตัวเอง) เปลี่ยนเมื่อทำสำเร็จหรือขึ้นวันใหม่
function ensureOrder() {
  if (state.order && state.order.date === todayKey() && FRIENDS[state.order.friend].unlock <= state.served) return state.order;
  const friend = pick(unlockedFriends());
  state.order = { friend, recipe: pick(FRIENDS[friend].likes), date: todayKey() };
  saveState();
  return state.order;
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {}
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
}

function galleryHTML() {
  if (!state.gallery.length) return '<div class="gallery-strip" hidden></div>';
  return `<div class="gallery-strip" aria-label="${t('gallery')}">
    <span class="gallery-title">🖼️</span>
    ${state.gallery.map((item) => `<img class="gallery-item" src="${dishSrc(item.recipe)}" alt="${local(RECIPES[item.recipe].name)}">`).join('')}
  </div>`;
}

function orderBubbleHTML(order, done = false) {
  return `<span class="bubble ${done ? 'done' : ''}" aria-hidden="true"><img src="${dishSrc(order.recipe)}" alt="">${done ? '<b>✓</b>' : ''}</span>`;
}

// แถวเพื่อนบนหน้าครัว: คนที่สั่งอาหาร (มีป้าย) + เพื่อนคนอื่นที่มาแล้ว + เงาของเพื่อนคนต่อไป
function friendsRowHTML() {
  const order = ensureOrder();
  const others = unlockedFriends().filter((id) => id !== order.friend).sort((a, b) => FRIENDS[b].unlock - FRIENDS[a].unlock).slice(0, 4).reverse();
  const next = nextLockedFriend();
  const orderLabel = `${local(FRIENDS[order.friend].name)} ${t('wants')} ${local(RECIPES[order.recipe].name)}`;
  return `<div class="friends-row">
    <button class="friend-peek order" id="order" data-order-friend="${order.friend}" data-order-recipe="${order.recipe}" aria-label="${orderLabel}">
      ${orderBubbleHTML(order)}<img src="${friendSrc(order.friend)}" alt="">
    </button>
    ${others.map((id) => `<img class="friend-peek" src="${friendSrc(id)}" alt="${local(FRIENDS[id].name)}">`).join('')}
    ${next ? `<span class="friend-peek next" title="${t('nextFriend')}" aria-label="${t('nextFriend')}"><img src="${friendSrc(next)}" alt=""><i style="--p:${Math.round(state.served / FRIENDS[next].unlock * 100)}%"></i></span>` : ''}
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
          <img class="recipe-icon" src="${dishSrc(id)}" alt=""><b>${local(recipe.name)}</b>
        </button>`).join('')}
      </div>
      ${galleryHTML()}
      ${friendsRowHTML()}
    </section>
  </div>`;
  bindTopbar(showHome);
  const orderButton = app.querySelector('#order');
  if (orderButton) {
    orderButton.onclick = async () => {
      unlockAudio();
      tone(620);
      const { friend, recipe } = state.order;
      await speak(`${local(FRIENDS[friend].name)} ${t('wants')} ${local(RECIPES[recipe].name)}`);
      startRecipe(recipe);
    };
  }
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
  creation = { recipe: id, color: '#ef6f61', toppings: [], strokes: [], friend: null, at: Date.now() };
  renderStep();
}

function dots() {
  return `<div class="progress-dots">${STEPS.map((_, i) => `<i class="${i < step ? 'done' : i === step ? 'now' : ''}"></i>`).join('')}</div>`;
}

function screen(content, prompt) {
  const recipe = RECIPES[activeRecipe];
  app.innerHTML = `<div class="app-shell play-screen">
    ${topbar(`<img class="title-icon" src="${dishSrc(activeRecipe)}" alt=""> ${local(recipe.name)}`, true)}
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
  const name = STEPS[step];
  if (name === 'prep') renderPrep();
  else if (name === 'add') renderIngredients();
  else if (name === 'mix') renderMix();
  else if (name === 'cook') renderCook();
  else if (name === 'decorate') renderDecorate();
  else renderServe();
}

// ขั้นเตรียม: วัตถุดิบที่ต้องหั่น/ตอกทีละอย่างบนเขียง ปาดนิ้วหั่น หรือแตะให้ไข่แตก
function renderPrep() {
  const recipe = RECIPES[activeRecipe];
  const queue = prepList(recipe);
  if (!queue.length) { step++; return renderStep(); }
  let index = 0;
  const promptFor = (id) => `${t(INGREDIENTS[id].prep)} ${local(INGREDIENTS[id])}`;
  screen(`<div class="stage-zone">
      <div class="board-zone">
        <img class="board" src="${toolSrc('board')}" alt="">
        <button class="prep-item" id="prep-item" data-action="${INGREDIENTS[queue[0]].prep}" aria-label="${promptFor(queue[0])}">
          <img src="${ingredientSrc(queue[0])}" alt="">
          <span class="cut-line" aria-hidden="true"></span>
        </button>
        <span class="touch-hint prep-hint" aria-hidden="true">☝</span>
      </div>
    </div>
    <div class="tray prep-queue" aria-hidden="true">
      ${queue.map((id, i) => `<span class="queue-item ${i === 0 ? 'now' : ''}" data-queue="${id}"><img src="${ingredientSrc(id)}" alt=""></span>`).join('')}
    </div>`, promptFor(queue[0]));
  const item = app.querySelector('#prep-item');
  const img = item.querySelector('img');
  const promptElement = app.querySelector('#prompt');
  const hint = app.querySelector('.prep-hint');
  let hits = 0;
  let busy = false;
  let pointerId = null;
  let start = null;
  let swiped = false;

  const setHint = () => {
    const action = INGREDIENTS[queue[index]].prep;
    item.dataset.action = action;
    hint.className = `touch-hint prep-hint ${action}`;
  };
  const hit = () => {
    hits++;
    item.classList.remove('hit');
    requestAnimationFrame(() => item.classList.add('hit'));
    tone(560 + hits * 90, .1);
  };
  const finishItem = async () => {
    busy = true;
    const id = queue[index];
    img.src = preparedSrc(id);
    item.classList.add('prepared');
    app.querySelector(`[data-queue="${id}"]`)?.classList.add('done');
    tone(900, .2);
    await speak(`${local(INGREDIENTS[id])} ${t(`${INGREDIENTS[id].prep}Done`)}`);
    index++;
    if (index >= queue.length) {
      await speak(t('prepDone'));
      step++;
      return renderStep();
    }
    hits = 0;
    const next = queue[index];
    img.src = ingredientSrc(next);
    item.classList.remove('prepared');
    item.setAttribute('aria-label', promptFor(next));
    app.querySelectorAll('.queue-item').forEach((element) => element.classList.toggle('now', element.dataset.queue === next));
    setHint();
    promptElement.textContent = promptFor(next);
    speak(promptFor(next));
    busy = false;
  };
  const progress = () => {
    if (busy) return;
    hit();
    const goal = INGREDIENTS[queue[index]].prep === 'crack' ? CRACK_TAPS : CUT_SWIPES;
    if (hits >= goal) finishItem();
  };

  setHint();
  item.addEventListener('pointerdown', (event) => {
    if (busy || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    pointerId = event.pointerId;
    start = { x: event.clientX, y: event.clientY };
    swiped = false;
    try { item.setPointerCapture?.(pointerId); } catch {}
  });
  item.addEventListener('pointermove', (event) => {
    if (!start || event.pointerId !== pointerId || swiped) return;
    event.preventDefault();
    if (INGREDIENTS[queue[index]].prep !== 'cut') return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 40) {
      swiped = true;
      progress();
    }
  });
  const release = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    start = null;
  };
  item.addEventListener('pointerup', release);
  item.addEventListener('pointercancel', release);
  item.addEventListener('click', () => {
    if (INGREDIENTS[queue[index]].prep === 'crack') progress();
    else if (!swiped) {
      // แตะเฉยๆ ตอนต้องหั่น: เขย่าบอกว่าให้ปาด
      item.classList.remove('nudge');
      requestAnimationFrame(() => item.classList.add('nudge'));
      tone(300, .1);
    }
  });
}

function bindDragChoice(button, options) {
  let active = null;
  let ignoreClick = false;

  const clear = () => {
    if (!active) return;
    try {
      if (button.hasPointerCapture?.(active.pointerId)) button.releasePointerCapture(active.pointerId);
    } catch {}
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
    window.getSelection()?.removeAllRanges();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;

    const move = (moveEvent) => {
      if (!active || moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!active.moved && distance >= 8) {
        active.moved = true;
        // ตัวที่ลอยตามนิ้ว = รูปอย่างเดียว (ไม่เอากรอบขาวของปุ่ม) ขนาดเท่าของจริงบนจอ
        const source = button.querySelector('img') || button;
        const rect = source.getBoundingClientRect();
        const ghost = source.cloneNode(true);
        ghost.className = 'drag-ghost';
        ghost.removeAttribute('id');
        ghost.removeAttribute('role');
        ghost.removeAttribute('tabindex');
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghost.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ghost);
        active.ghost = ghost;
        button.classList.add('drag-source');
      }
      if (!active.moved) return;
      active.ghost.style.left = `${moveEvent.clientX}px`;
      active.ghost.style.top = `${moveEvent.clientY}px`;
      options.onHover?.(options.isOverTarget(moveEvent.clientX, moveEvent.clientY), moveEvent.clientX, moveEvent.clientY);
    };

    const up = (upEvent) => {
      if (!active || upEvent.pointerId !== pointerId) return;
      const moved = active.moved;
      const overTarget = moved && options.isOverTarget(upEvent.clientX, upEvent.clientY);
      const dropData = overTarget ? options.getDropData?.() : null;
      ignoreClick = true;
      clear();
      if (!moved) options.onTap();
      else if (overTarget) options.onDrop(upEvent.clientX, upEvent.clientY, dropData);
      else options.onMiss?.();
      setTimeout(() => { ignoreClick = false; }, 0);
    };

    const cancel = (cancelEvent) => {
      if (active && cancelEvent.pointerId === pointerId) clear();
    };

    active = { moved: false, ghost: null, move, up, cancel, pointerId };
    try { button.setPointerCapture?.(pointerId); } catch {}
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
      ${recipe.ingredients.map((id, index) => `<button class="ingredient" data-index="${index}" aria-label="${local(INGREDIENTS[id])}"><img src="${preparedSrc(id)}" alt=""></button>`).join('')}
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
    const id = recipe.ingredients[Number(button.dataset.index)];
    bowl.insertAdjacentHTML('beforeend', `<img class="in-bowl" src="${preparedSrc(id)}" alt="">`);
    tone(520 + added * 80);
    added++;
    const isLast = added === recipe.ingredients.length;
    await speak(local(INGREDIENTS[id]));
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
  const tool = TOOLS[recipe.tool];
  const motion = tool.motion;
  const prompt = `${local(recipe.action)} · ${t('mixHint')[motion]}`;
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:16px">
      <button class="mix-tool invite-tool motion-${motion}" id="mix" data-motion="${motion}" aria-label="${local(recipe.action)}" style="--spread:0">
        <span class="mix-fill" id="mix-fill">${recipe.ingredients.map((id) => `<img src="${preparedSrc(id)}" alt="">`).join('')}</span>
        <img class="mix-icon" id="mix-icon" src="${toolSrc(recipe.tool)}" alt="${local(tool)}">
        <span class="touch-hint" aria-hidden="true">☝</span>
      </button>
      <div class="meter"><div class="meter-fill" id="meter"></div></div>
    </div>`, prompt);
  const button = app.querySelector('#mix');
  const fill = app.querySelector('#mix-fill');
  const icon = app.querySelector('#mix-icon');
  const meter = app.querySelector('#meter');
  let progress = 0;
  let finished = false;
  let nextChime = 10;
  let pointerId = null;
  let center = null;
  let last = null;
  let turned = 0;   // มุมสะสมตอนลากวน (เรเดียน)
  let moved = false;
  let ignoreClick = false;

  const finish = async () => {
    finished = true;
    button.disabled = true;
    button.classList.remove('mixing');
    icon.style.transform = '';
    tone(760, .22);
    await new Promise((resolve) => setTimeout(resolve, 700));
    await speak(t('mixed')[motion]);
    step++;
    renderStep();
  };
  const setProgress = (value) => {
    if (finished) return;
    progress = Math.min(100, value);
    meter.style.width = `${progress}%`;
    if (motion === 'roll') fill.style.transform = `scale(${.8 + progress / 100 * .35}, ${.8 - progress / 100 * .3})`;
    if (motion === 'spread') button.style.setProperty('--spread', progress);
    if (motion === 'whisk') fill.style.filter = `brightness(${1 + progress / 100 * .18})`;
    if (progress >= nextChime && progress < 100) {
      tone(430 + progress * 2, .07);
      nextChime += 10;
    }
    if (progress >= 100) finish();
  };
  const moveTool = (x, y) => {
    const max = button.clientWidth * .28;
    const radius = Math.hypot(x, y);
    if (radius > max) { x *= max / radius; y *= max / radius; }
    icon.style.transform = `translate(${x}px, ${y}px)`;
  };

  button.addEventListener('pointerdown', (event) => {
    if (finished || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    pointerId = event.pointerId;
    moved = false;
    try { button.setPointerCapture?.(pointerId); } catch {}
    const rect = button.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    last = { x: event.clientX, y: event.clientY, angle: Math.atan2(event.clientY - center.y, event.clientX - center.x) };
    button.classList.add('mixing');
  });
  button.addEventListener('pointermove', (event) => {
    if (finished || !last || event.pointerId !== pointerId) return;
    event.preventDefault();
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) return;
    moved = true;
    moveTool(event.clientX - center.x, event.clientY - center.y);
    let gain = 0;
    if (motion === 'stir') {
      const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x);
      let delta = angle - last.angle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      const fromCenter = Math.hypot(event.clientX - center.x, event.clientY - center.y);
      // วนใกล้กลางเกินไปมุมจะเปลี่ยนเร็วผิดปกติ ให้นับเป็นระยะแทน
      gain = fromCenter > 24 ? Math.abs(delta) / (Math.PI * 2 * MIX_GOAL.stir) * 100 : distance / MIX_GOAL.whisk * 100;
      if (fromCenter > 24) turned += delta;
      fill.style.transform = `scale(.8) rotate(${turned}rad)`;
      last.angle = angle;
    } else if (motion === 'roll') {
      gain = Math.abs(dx) / MIX_GOAL.roll * 100;
    } else {
      gain = distance / MIX_GOAL[motion] * 100;
      if (motion === 'whisk') fill.style.transform = `scale(.8) translate(${(Math.random() - .5) * 10}px, ${(Math.random() - .5) * 10}px)`;
    }
    last.x = event.clientX;
    last.y = event.clientY;
    setProgress(progress + gain);
  });
  const release = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    last = null;
    button.classList.remove('mixing');
    if (!finished) icon.style.transform = '';
    if (motion === 'whisk') fill.style.transform = '';
    if (moved) {
      ignoreClick = true;
      setTimeout(() => { ignoreClick = false; }, 0);
    }
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  // แตะเฉยๆ ก็ยังคืบหน้า แค่ช้ากว่าลาก (เด็กที่ยังลากไม่คล่องยังเล่นจบได้)
  button.addEventListener('click', () => {
    if (ignoreClick || finished) return;
    button.classList.remove('tap-once');
    requestAnimationFrame(() => button.classList.add('tap-once'));
    setTimeout(() => button.classList.remove('tap-once'), 360);
    setProgress(progress + MIX_TAP_GAIN);
  });
}

function renderCook() {
  const recipe = RECIPES[activeRecipe];
  const appliance = APPLIANCES[recipe.appliance];
  const prompt = local(appliance.cook);
  // ของที่โชว์ระหว่างปรุง: ส่วนใหญ่โชว์จานเสร็จ, เครื่องปั่นโชว์ผลไม้หมุนในโถ
  const inside = recipe.appliance === 'blender'
    ? `<span class="jar-fruit">${recipe.ingredients.slice(0, 2).map((id) => `<img src="${ingredientSrc(id)}" alt="">`).join('')}</span>`
    : `<img class="cooking-food" src="${dishSrc(activeRecipe)}" alt="">`;
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px">
      <div class="appliance ${recipe.appliance}" id="appliance" data-appliance="${recipe.appliance}" role="button" tabindex="0" aria-label="${prompt}">
        ${inside}
        <img class="machine" src="${applianceSrc(recipe.appliance)}" alt="">
        <span class="fx fx-glow"></span>
        <span class="fx fx-steam"><i></i><i></i><i></i></span>
        <span class="fx fx-snow"><i></i><i></i><i></i><i></i><i></i><i></i></span>
        <span class="fx fx-sparks"><i></i><i></i><i></i><i></i></span>
        <span class="hold-hint" aria-hidden="true"><b>☝</b><span>${t('hold')}</span></span>
      </div>
      <div class="meter"><div class="meter-fill" id="meter"></div></div>
    </div>`, prompt);
  const element = app.querySelector('#appliance');
  const meter = app.querySelector('#meter');
  let progress = 0;
  let finished = false;
  let holdTimer = null;
  let nextChime = 20;
  const finishCooking = async () => {
    if (finished) return;
    finished = true;
    clearInterval(holdTimer);
    element.removeAttribute('tabindex');
    element.classList.add('running');
    await new Promise((resolve) => setTimeout(resolve, 900));
    element.classList.remove('running', 'holding');
    element.classList.add('finished');
    tone(820, .25);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await speak(local(appliance.done));
    step++;
    renderStep();
  };
  const startHold = (event) => {
    if (finished || holdTimer) return;
    event?.preventDefault();
    element.classList.add('running', 'holding');
    tone(appliance.tone, .18);
    window.addEventListener('pointerup', stopHold, { once: true });
    window.addEventListener('pointercancel', stopHold, { once: true });
    holdTimer = setInterval(() => {
      progress = Math.min(100, progress + 2);
      meter.style.width = `${progress}%`;
      if (progress >= nextChime && progress < 100) {
        tone(400 + progress * 2, .08);
        nextChime += 20;
      }
      if (progress >= 100) finishCooking();
    }, 100);
  };
  const stopHold = () => {
    window.removeEventListener('pointerup', stopHold);
    window.removeEventListener('pointercancel', stopHold);
    if (finished) return;
    clearInterval(holdTimer);
    holdTimer = null;
    element.classList.remove('running', 'holding');
  };
  element.addEventListener('pointerdown', startHold);
  element.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) startHold(event);
  });
  element.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' || event.key === ' ') stopHold();
  });
}

function toppingHTML(item) {
  return `<img class="topping" src="${toppingSrc(item.key)}" alt="" style="left:${item.x}%;top:${item.y}%">`;
}

function dishHTML() {
  const recipe = RECIPES[activeRecipe];
  return `<div class="dish" id="dish">
    <span class="food-color" id="food-color" style="background:${creation.color}"></span>
    <img class="food-icon" src="${dishSrc(activeRecipe)}" alt="${local(recipe.name)}">
    <canvas class="frosting" id="frosting" aria-hidden="true"></canvas>
    ${creation.toppings.map(toppingHTML).join('')}
  </div>`;
}

// ครีมที่วาดด้วยนิ้ว เก็บเป็น % ของจาน วาดใหม่ทุกครั้งที่จานถูก render
function paintStrokes(dish) {
  const canvas = dish.querySelector('#frosting');
  if (!canvas) return null;
  const rect = dish.getBoundingClientRect();
  const scale = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = canvas.width * .055;
  const drawStroke = (stroke) => {
    if (stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    stroke.points.forEach(([x, y], i) => {
      const px = x / 100 * canvas.width;
      const py = y / 100 * canvas.height;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
  };
  (creation.strokes || []).forEach(drawStroke);
  return { ctx, canvas, drawStroke };
}

function renderDecorate() {
  const recipe = RECIPES[activeRecipe];
  const prompt = `${t('decorate')} · ${t('draw')}`;
  screen(`<div class="stage-zone">${dishHTML()}</div>
    <div class="tray decorate-controls">
      ${COLORS.map((color) => `<button class="swatch ${color === creation.color ? 'selected' : ''}" data-color="${color}" style="background:${color}" aria-label="color"></button>`).join('')}
      ${recipe.toppings.map((key) => `<button class="topping-btn" data-top="${key}" aria-label="topping"><img src="${toppingSrc(key)}" alt=""></button>`).join('')}
      <button class="action-btn primary" id="done">✓ ${t('done')}</button>
    </div>`, prompt);
  const dish = app.querySelector('#dish');
  const promptElement = app.querySelector('#prompt');
  let selectedTop = null;
  const painter = paintStrokes(dish);
  // วาดครีม: ลากนิ้วบนจาน (แตะเฉยๆ = วางท็อปปิ้งที่เลือกไว้)
  let stroke = null;
  let strokePointer = null;
  let ignoreDishClick = false;
  const toDish = (event) => {
    const rect = dish.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100];
  };
  dish.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    strokePointer = event.pointerId;
    stroke = { color: creation.color, points: [toDish(event)], moved: false, startX: event.clientX, startY: event.clientY };
    try { dish.setPointerCapture?.(strokePointer); } catch {}
  });
  dish.addEventListener('pointermove', (event) => {
    if (!stroke || event.pointerId !== strokePointer) return;
    event.preventDefault();
    if (!stroke.moved && Math.hypot(event.clientX - stroke.startX, event.clientY - stroke.startY) < 6) return;
    if (!stroke.moved) {
      stroke.moved = true;
      creation.strokes ||= [];
      if (creation.strokes.length >= 40) creation.strokes.shift();
      creation.strokes.push(stroke);
      dish.classList.add('drawing');
    }
    stroke.points.push(toDish(event));
    if (stroke.points.length % 3 === 0) tone(700 + (stroke.points.length % 12) * 20, .04);
    painter?.drawStroke(stroke);
  });
  const endStroke = (event) => {
    if (!stroke || event.pointerId !== strokePointer) return;
    if (stroke.moved) {
      delete stroke.moved; delete stroke.startX; delete stroke.startY;
      dish.classList.remove('drawing');
      ignoreDishClick = true;
      setTimeout(() => { ignoreDishClick = false; }, 0);
    }
    stroke = null;
    strokePointer = null;
  };
  dish.addEventListener('pointerup', endStroke);
  dish.addEventListener('pointercancel', endStroke);
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
    promptElement.innerHTML = `<img class="prompt-icon" src="${toppingSrc(selectedTop)}" alt=""> ${t('place')}`;
    tone(560);
  };
  const placeTopping = (key, clientX, clientY) => {
    if (creation.toppings.length >= MAX_TOPPINGS) {
      // เต็มแล้วเอาชิ้นเก่าสุดออก จะได้วางต่อได้เรื่อยๆ ไม่มีตัน
      creation.toppings.shift();
      dish.querySelector('.topping')?.remove();
    }
    const rect = dish.getBoundingClientRect();
    const x = Math.max(15, Math.min(80, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(15, Math.min(80, ((clientY - rect.top) / rect.height) * 100));
    const item = { key, x, y };
    creation.toppings.push(item);
    dish.insertAdjacentHTML('beforeend', toppingHTML(item));
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
    if (ignoreDishClick) return;
    if (selectedTop) placeTopping(selectedTop, event.clientX, event.clientY);
  });
  app.querySelector('#done').onclick = async () => {
    await speak(COPY[state.lang].praise[Math.floor(Math.random() * COPY[state.lang].praise.length)]);
    step++;
    renderStep();
  };
}

// เพื่อนที่มารอกินจานนี้: คนที่สั่งมาก่อน แล้วสุ่มคนอื่นที่มาแล้วจนครบ 4
function pickDiners() {
  const order = ensureOrder();
  const rest = unlockedFriends().filter((id) => id !== order.friend);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [order.friend, ...rest.slice(0, FRIEND_MAX_ON_SCREEN - 1)];
}

function reactionFor(friendId) {
  const keys = creation.toppings.map((item) => item.key);
  if (keys.some((key) => SNEEZE_TOPPINGS.includes(key))) return 'sneeze';
  if (keys.length >= FULL_TOPPINGS) return 'full';
  if (FRIENDS[friendId].likes.includes(activeRecipe)) return 'love';
  return 'yum';
}

function popup(html, spoken) {
  const layer = document.createElement('div');
  layer.className = 'popup-layer';
  layer.innerHTML = `<div class="popup">${html}<button class="action-btn primary" id="popup-ok">👍 ${t('ok')}</button></div>`;
  document.body.appendChild(layer);
  return new Promise((resolve) => {
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      layer.remove();
      resolve();
    };
    layer.querySelector('#popup-ok').onclick = close;
    layer.addEventListener('click', (event) => { if (event.target === layer) close(); });
    setTimeout(close, 9000);
    if (spoken) speak(spoken);
  });
}

function renderServe() {
  const prompt = t('serve');
  const order = ensureOrder();
  const diners = pickDiners();
  screen(`<div class="stage-zone">
      <div class="serve-layout">${dishHTML()}<div class="customer-grid">
        ${diners.map((id) => `<button class="friend-btn" data-friend="${id}" aria-label="${local(FRIENDS[id].name)}">
          <img class="portrait" src="${friendSrc(id)}" alt="${local(FRIENDS[id].name)}">${id === order.friend ? orderBubbleHTML(order) : ''}
        </button>`).join('')}
      </div></div>
    </div>
    <div class="finish-actions" id="finish-actions" hidden>
      <button class="action-btn primary" id="again">↻ ${t('again')}</button>
      <button class="action-btn" id="home">⌂ ${t('home')}</button>
    </div>`, prompt);
  const dish = app.querySelector('#dish');
  paintStrokes(dish);
  const food = dish.querySelector('.food-icon');
  const friendButtons = [...app.querySelectorAll('.friend-btn')];
  let feeding = false;
  let hoveredFriend = null;
  let gallerySaved = false;
  food.id = 'feed-food';
  food.classList.add('feed-handle');
  food.setAttribute('role', 'button');
  food.setAttribute('tabindex', '0');
  food.setAttribute('draggable', 'false');

  const friendAt = (x, y) => {
    hoveredFriend = friendButtons.find((button) => {
      if (button.classList.contains('fed')) return false;
      const rect = button.getBoundingClientRect();
      const padding = 20;
      return x >= rect.left - padding && x <= rect.right + padding
        && y >= rect.top - padding && y <= rect.bottom + padding;
    }) || null;
    return Boolean(hoveredFriend);
  };

  const animateFeeding = async (friendButton) => {
    const start = food.getBoundingClientRect();
    const target = friendButton.getBoundingClientRect();
    const bite = document.createElement('img');
    bite.className = 'feed-bite';
    bite.src = dishSrc(activeRecipe);
    bite.alt = '';
    bite.style.left = `${start.left + start.width / 2}px`;
    bite.style.top = `${start.top + start.height / 2}px`;
    document.body.appendChild(bite);
    friendButton.classList.add('feeding');
    requestAnimationFrame(() => {
      bite.style.transform = `translate(-50%, -50%) translate(${target.left + target.width / 2 - start.left - start.width / 2}px, ${target.top + target.height / 2 - start.top - start.height / 2}px) scale(.38) rotate(14deg)`;
    });
    await new Promise((resolve) => setTimeout(resolve, 720));
    bite.remove();
    friendButton.classList.remove('feeding');
  };

  // เพื่อนแสดงปฏิกิริยา: สลับรูปหน้าตา (ถ้ามี) + ท่า CSS + อนุภาคลอย + พูด แล้วกลับเป็นรูปปกติ
  const react = async (button, reaction) => {
    const id = button.dataset.friend;
    const img = button.querySelector('img.portrait');
    const info = REACTIONS[reaction];
    img.src = friendSrc(id, reaction);
    button.classList.add('reacting', `react-${reaction}`);
    button.dataset.reaction = reaction;
    const burst = document.createElement('span');
    burst.className = 'burst';
    burst.innerHTML = Array.from({ length: reaction === 'yum' ? 3 : 5 }, (_, i) => `<i style="left:${18 + i * 16}%;animation-delay:${i * .12}s">${info.particle}</i>`).join('');
    button.appendChild(burst);
    tone(info.tone, .35);
    await speak(local(info));
    await new Promise((resolve) => setTimeout(resolve, 400));
    burst.remove();
    button.classList.remove('reacting', `react-${reaction}`);
    img.src = friendSrc(id);
  };

  const feedFriend = async (button) => {
    if (feeding || button.classList.contains('fed')) return;
    feeding = true;
    friendButtons.forEach((item) => item.classList.remove('feed-target'));
    dish.classList.remove('awaiting-drop');
    await animateFeeding(button);
    const friendId = button.dataset.friend;
    creation.friends ||= [];
    creation.friends.push(friendId);
    creation.friend ||= friendId;
    button.classList.add('fed');
    if (!gallerySaved) {
      state.gallery.unshift({ ...creation, friends: [...creation.friends], strokes: (creation.strokes || []).map((item) => ({ color: item.color, points: item.points })) });
      gallerySaved = true;
    } else {
      state.gallery[0] = { ...creation, friends: [...creation.friends] };
    }
    state.gallery = state.gallery.slice(0, 6);
    const orderMatched = state.order && state.order.friend === friendId && state.order.recipe === activeRecipe;
    const unlockedBefore = unlockedFriends();
    state.served++;
    if (orderMatched) {
      state.ordersDone++;
      state.order = null;
      button.querySelector('.bubble')?.classList.add('done');
      button.querySelector('.bubble')?.insertAdjacentHTML('beforeend', '<b>✓</b>');
    }
    saveState();
    confetti();
    await react(button, orderMatched ? 'love' : reactionFor(friendId));
    if (orderMatched) await speak(t('orderDone'));
    const actions = app.querySelector('#finish-actions');
    actions.hidden = false;
    app.querySelector('#again').onclick = () => startRecipe(activeRecipe);
    app.querySelector('#home').onclick = showHome;
    const newFriend = unlockedFriends().find((id) => !unlockedBefore.includes(id));
    if (newFriend) {
      tone(1046, .4);
      confetti();
      await popup(`<img class="popup-friend" src="${friendSrc(newFriend)}" alt=""><h2>${t('newFriend')}</h2><p>${local(FRIENDS[newFriend].name)}</p>`,
        `${t('newFriend')} ${local(FRIENDS[newFriend].name)}`);
    }
    feeding = false;
  };

  bindDragChoice(food, {
    onTap: () => {
      dish.classList.add('awaiting-drop');
      tone(520);
    },
    isOverTarget: friendAt,
    onHover: (over) => friendButtons.forEach((button) => button.classList.toggle('feed-target', over && button === hoveredFriend)),
    getDropData: () => hoveredFriend,
    onDrop: (x, y, friend) => friend && feedFriend(friend),
    onMiss: () => {
      dish.classList.add('drop-miss');
      setTimeout(() => dish.isConnected && dish.classList.remove('drop-miss'), 380);
    }
  });
  food.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dish.classList.add('awaiting-drop');
    }
  });
  friendButtons.forEach((button) => {
    button.onclick = () => feedFriend(button);
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
document.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('dragstart', (event) => event.preventDefault());
document.addEventListener('selectstart', (event) => event.preventDefault());
document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
// iOS Safari เด้งหน้าขึ้นลงตอนลาก (rubber band) — กันไว้ ยกเว้นตอนเนื้อหาล้นจอจริงๆ ให้เลื่อนได้
document.addEventListener('touchmove', (event) => {
  if (app.scrollHeight <= app.clientHeight + 1) event.preventDefault();
}, { passive: false });
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) selection.removeAllRanges();
});
showHome();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
