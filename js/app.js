const STORE_KEY = 'happy-little-kitchen-v1';
const LEGACY_STORE_KEY = 'lilly-playhouse-v1';
const SHOP_KEY = 'happy-little-kitchen-shop-v1';   // ร้านของหนูเก็บแยก key (js/shop/core.js) ไม่ปนกับเซฟครัว
const RETURN_KEY = 'happy-little-kitchen-return';   // sessionStorage: เปิดมาจากโลกของลิลลี่ → กลับไปที่นั่น

// เปิดจากห้องพักเล่นของโลกของลิลลี่: ?mode=restaurant&return=<หน้าโลกของลิลลี่>
// กลับได้เฉพาะหน้าโลกของลิลลี่ (whitelist) กันลิงก์แปลกๆ พาเด็กออกไปเว็บอื่น
function allowedReturn(value) {
  if (!value) return null;
  try {
    const url = new URL(value, location.href);
    const local = (host) => host === '127.0.0.1' || host === 'localhost';
    const sameSite = url.origin === location.origin && url.pathname.startsWith('/game-lilly/');
    const devServer = local(url.hostname) && local(location.hostname) && url.port === '5173' && url.protocol === 'http:';
    return sameSite || devServer ? `${url.origin}${url.pathname}` : null;
  } catch {
    return null;
  }
}
const launchParams = new URLSearchParams(location.search);
const launchMode = launchParams.get('mode');
let returnUrl = allowedReturn(launchParams.get('return'));
// จำที่อยู่กลับไว้เฉพาะตอนโหลดหน้าเดิมซ้ำ (อัปเดตเกม/รีเฟรช) หรือกดย้อน — ถ้าเข้าเกมครัวตรงๆ ในแท็บเดิม ต้องลืม
const navigationType = performance.getEntriesByType?.('navigation')?.[0]?.type || 'navigate';
try {
  if (returnUrl) sessionStorage.setItem(RETURN_KEY, returnUrl);
  else if (navigationType === 'reload' || navigationType === 'back_forward') returnUrl = allowedReturn(sessionStorage.getItem(RETURN_KEY));
  else sessionStorage.removeItem(RETURN_KEY);
} catch {}
if (launchParams.has('mode') || launchParams.has('return')) history.replaceState(null, '', location.pathname);
function backToLilly() {
  stopSpeech();
  location.assign(returnUrl);
}

// ชื่อ key ทุกตาราง = ชื่อไฟล์รูปใน assets/<กลุ่ม>/<key>.png
// prep = ต้องเตรียมก่อนใส่: 'cut' ปาดนิ้วหั่น 3 ครั้ง, 'crack' แตะ 2 ครั้งให้แตก → รูปเปลี่ยนเป็น prepared
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
  chocchips: { th: 'ช็อกโกแลตชิป', en: 'chocolate chips' },
  jam: { th: 'แยม', en: 'jam' },
  'cheese-shreds': { th: 'ชีสขูด', en: 'shredded cheese' },
  sauce: { th: 'ซอสมะเขือเทศ', en: 'tomato sauce' },
  yogurt: { th: 'โยเกิร์ต', en: 'yogurt' },
  oil: { th: 'น้ำมัน', en: 'oil' }
};
const CUT_SWIPES = 3;
const CRACK_TAPS = 2;

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
const GALLERY_MAX = 12;
const PHOTO_SIZE = 384;

const APPLIANCES = {
  oven: { cook: { th: 'กดเตาอบค้างไว้จนแถบเต็ม', en: 'Press and hold the oven until the bar is full' }, done: { th: 'สุกกำลังดีเลย', en: 'Baked just right' }, tone: 430 },
  blender: { cook: { th: 'กดเครื่องปั่นค้างไว้จนแถบเต็ม', en: 'Press and hold the blender until the bar is full' }, done: { th: 'เนียนกำลังดี', en: 'Smooth and creamy' }, tone: 210 },
  pan: { cook: { th: 'กดกระทะค้างไว้จนแถบเต็ม', en: 'Press and hold the pan until the bar is full' }, done: { th: 'สุกหอมเลย', en: 'Fried golden' }, tone: 380 },
  pot: { cook: { th: 'กดหม้อค้างไว้จนแถบเต็ม', en: 'Press and hold the pot until the bar is full' }, done: { th: 'ร้อนๆ ได้ที่แล้ว', en: 'Hot and ready' }, tone: 300 },
  freezer: { cook: { th: 'กดตู้แช่แข็งค้างไว้จนแถบเต็ม', en: 'Press and hold the freezer until the bar is full' }, done: { th: 'เย็นเจี๊ยบแล้ว', en: 'Frozen and ready' }, tone: 620 },
  toaster: { cook: { th: 'กดเครื่องปิ้งค้างไว้จนแถบเต็ม', en: 'Press and hold the toaster until the bar is full' }, done: { th: 'กรอบกำลังดี', en: 'Toasted golden' }, tone: 500 }
};
// รูปเครื่องแบบอื่น (เช่น เครื่องปั่นเปิดฝา) ใช้เอฟเฟกต์/ตำแหน่งของเครื่องหลัก
const APPLIANCE_BASE = { 'blender-open': 'blender', 'blender-full': 'blender' };

// ท็อปปิ้ง = ชื่อไฟล์ใน assets/toppings/ (ผลงานเก่าเก็บเป็น emoji)
const LEGACY_TOPPINGS = { '⭐': 'star', '🍓': 'strawberry', '🌈': 'rainbow', '🫐': 'blueberry', '🍒': 'cherry' };

// ปากกาสำหรับขั้นทา/บีบ: art = รูปที่โชว์บนปุ่ม, color = สีที่ทาลงจาน
const PENS = {
  ketchup: { art: 'tool:ketchup', color: '#e0332b', th: 'ซอสมะเขือเทศ', en: 'ketchup' },
  mayo: { art: 'tool:mayo', color: '#fff3d1', th: 'มายองเนส', en: 'mayonnaise' },
  jam: { art: 'ing:jam', color: 'rgba(201,49,61,.9)', th: 'แยม', en: 'jam' },
  honey: { art: 'ing:honey', color: 'rgba(242,177,52,.85)', th: 'น้ำผึ้ง', en: 'honey' },
  butter: { art: 'ing:butter-cut', color: 'rgba(246,211,91,.85)', th: 'เนย', en: 'butter' },
  sauce: { art: 'ing:sauce', color: 'rgba(217,67,47,.9)', th: 'ซอสมะเขือเทศ', en: 'tomato sauce' },
  cream: { art: 'top:cream', color: '#f7b8c4', th: 'ครีม', en: 'frosting' }
};
const COLORS = ['#ef6f61', '#f4bd3f', '#54b99a', '#67bde3', '#9a78bd'];
const POSITIONS = [[25,24], [68,28], [48,48], [28,66], [70,68], [48,20], [18,46], [78,48]];

// ---- เมนู: แต่ละเมนูมีลำดับขั้นของตัวเองตามการทำอาหารจริง
// ชนิดขั้น: prep, add, mix, cook, pour, flip, move, dip, spread, sprinkle, shape, lid, slice, candles, decorate, serve
// รูปอ้างอิงในขั้น: 'state:x' (assets/states) — ถ้าไม่ใส่คำนำหน้าถือเป็น state, 'dish:x', 'ing:x', 'tool:x', 'appliance:x', 'top:x'
const RECIPES = {
  omelet: {
    name: { th: 'ไข่เจียว', en: 'Omelet' }, ingredients: ['egg', 'egg', 'springonion', 'tomato', 'oil'],
    toppings: ['ketchup', 'rice', 'springonion', 'corn', 'carrot', 'peas', 'chili', 'tomatoslice', 'cucumber', 'sesame'],
    steps: [
      { type: 'prep', items: ['egg', 'egg'] },
      { type: 'add', items: ['egg', 'egg'], into: 'dish:bowl' },
      { type: 'mix', tool: 'whisk', action: { th: 'ตีไข่ให้ฟู', en: 'Whisk the eggs' }, fill: 'bowl-egg' },
      { type: 'prep', items: ['springonion', 'tomato'] },
      { type: 'add', items: ['springonion', 'tomato'], into: 'bowl-egg', result: 'bowl-eggveg' },
      { type: 'pour', from: 'ing:oil', into: 'appliance:pan', color: '#f6d35b', say: { th: 'กดขวดค้างไว้ เทน้ำมันลงกระทะ', en: 'Hold the bottle to pour oil into the pan' } },
      { type: 'pour', from: 'bowl-eggveg', into: 'appliance:pan', result: 'omelet-raw', color: '#f5d76e', say: { th: 'กดชามค้างไว้ เทไข่ลงกระทะ', en: 'Hold the bowl to pour the egg into the pan' } },
      { type: 'cook', appliance: 'pan', inside: 'omelet-raw', result: 'omelet-half', done: { th: 'ข้างล่างสุกแล้ว', en: 'The bottom is done' } },
      { type: 'flip', appliance: 'pan', before: 'omelet-half', after: 'dish:omelet', say: { th: 'ปาดนิ้วขึ้น พลิกไข่เจียว', en: 'Swipe up to flip the omelet' } },
      { type: 'move', from: 'appliance:pan', carry: 'dish:omelet', to: 'dish:plate', count: 1, result: 'dish:omelet', say: { th: 'ลากไข่เจียวใส่จาน', en: 'Drag the omelet onto the plate' } },
      { type: 'decorate', pens: ['ketchup', 'mayo'] },
      { type: 'serve' }
    ]
  },
  pizza: {
    name: { th: 'พิซซ่า', en: 'Pizza' }, ingredients: ['dough', 'sauce', 'cheese-shreds'],
    toppings: ['mushroom', 'olive', 'corn', 'pineapple', 'pepper', 'tomatoslice', 'shrimp', 'chili', 'mint', 'sesame'],
    steps: [
      { type: 'mix', tool: 'rollingpin', action: { th: 'คลึงแป้งให้แบน', en: 'Roll the dough flat' }, fill: 'ing:dough', result: 'pizza-base' },
      { type: 'spread', base: 'pizza-base', pens: ['sauce'], goal: .55, say: { th: 'ถูนิ้วทาซอสให้ทั่วแผ่น', en: 'Rub the sauce all over the base' } },
      { type: 'sprinkle', item: 'ing:cheese-shreds', tool: 'tool:grater', count: 5, say: { th: 'แตะที่ขูดชีส ให้ชีสตกลงบนพิซซ่า', en: 'Tap the grater so cheese falls onto the pizza' } },
      { type: 'decorate', before: true, say: { th: 'วางหน้าพิซซ่าตามใจ แล้วแตะเสร็จแล้ว', en: 'Add toppings, then tap done' } },
      { type: 'cook', appliance: 'oven', inside: 'stage', result: 'dish:pizza', keep: 'toppings' },
      { type: 'slice', count: 2, say: { th: 'ปาดนิ้วตัดพิซซ่าเป็นชิ้น', en: 'Swipe to slice the pizza' } },
      { type: 'serve' }
    ]
  },
  noodles: {
    name: { th: 'ก๋วยเตี๋ยว', en: 'Noodle soup' }, ingredients: ['noodles', 'bokchoy', 'fishball'],
    toppings: ['garlic', 'egg', 'springonion', 'coriander', 'corn', 'chili', 'lime', 'shrimp', 'seaweed', 'sesame'],
    steps: [
      { type: 'cook', appliance: 'pot', seconds: 3, say: { th: 'กดหม้อค้างไว้ ต้มน้ำซุปให้เดือด', en: 'Hold the pot to boil the broth' }, done: { th: 'น้ำเดือดแล้ว', en: 'It is boiling' } },
      { type: 'add', items: ['fishball'], into: 'appliance:pot', say: { th: 'ใส่ลูกชิ้นลงหม้อ', en: 'Put the fish balls in the pot' } },
      { type: 'dip', appliance: 'pot', carry: 'basket-noodles', say: { th: 'กดค้างไว้ จุ่มเส้นลวกในหม้อ', en: 'Hold to dip the noodles in the pot' } },
      { type: 'prep', items: ['bokchoy'] },
      { type: 'dip', appliance: 'pot', carry: 'basket-veg', say: { th: 'กดค้างไว้ ลวกผัก', en: 'Hold to blanch the greens' } },
      { type: 'move', from: 'appliance:pot', carry: 'ladle-broth', to: 'bowl-noodles-dry', count: 2, result: 'dish:noodles', say: { th: 'ตักน้ำซุปราดลงชาม 2 ทัพพี', en: 'Ladle broth into the bowl, two scoops' } },
      { type: 'decorate' },
      { type: 'serve' }
    ]
  },
  cupcake: {
    name: { th: 'คัพเค้ก', en: 'Cupcake' }, ingredients: ['butter', 'sugar', 'egg', 'flour', 'milk'],
    toppings: ['star', 'strawberry', 'rainbow', 'blueberry', 'cherry', 'sprinkles', 'chocsauce', 'heart', 'marshmallow', 'kiwi'],
    steps: [
      { type: 'prep', items: ['butter'] },
      { type: 'add', items: ['butter', 'sugar'], into: 'dish:bowl' },
      { type: 'mix', tool: 'whisk', action: { th: 'ตีเนยกับน้ำตาล', en: 'Cream the butter and sugar' }, fill: 'bowl-batter' },
      { type: 'prep', items: ['egg'] },
      { type: 'add', items: ['egg', 'flour', 'milk'], into: 'bowl-batter' },
      { type: 'mix', tool: 'spoon', action: { th: 'คนให้เข้ากัน', en: 'Stir it together' }, fill: 'bowl-batter' },
      { type: 'pour', from: 'bowl-batter', into: 'liners-empty', result: 'liners-filled', color: '#f3e2b3', say: { th: 'กดชามค้างไว้ เทแป้งลงถ้วย', en: 'Hold the bowl to pour batter into the cups' } },
      { type: 'cook', appliance: 'oven', inside: 'liners-filled', result: 'cupcakes-baked' },
      { type: 'spread', base: 'cupcake-plain', pens: ['cream'], swatches: true, result: 'dish:cupcake', say: { th: 'เลือกสีครีม แล้วถูนิ้วทาให้ทั่ว', en: 'Pick a frosting colour and rub it all over' } },
      { type: 'decorate' },
      { type: 'serve' }
    ]
  },
  cookie: {
    name: { th: 'คุกกี้', en: 'Cookie' }, ingredients: ['butter', 'sugar', 'egg', 'flour', 'chocchips'],
    toppings: ['chocchip', 'star', 'heart', 'rainbow', 'marshmallow', 'sprinkles', 'chocsauce', 'honeydrizzle', 'starcookie', 'banana'],
    steps: [
      { type: 'prep', items: ['butter'] },
      { type: 'add', items: ['butter', 'sugar'], into: 'dish:bowl' },
      { type: 'mix', tool: 'whisk', action: { th: 'ตีเนยกับน้ำตาล', en: 'Cream the butter and sugar' }, fill: 'bowl-batter' },
      { type: 'prep', items: ['egg'] },
      { type: 'add', items: ['egg', 'flour', 'chocchips'], into: 'bowl-batter', result: 'bowl-dough' },
      { type: 'mix', tool: 'spoon', action: { th: 'คนให้เข้ากัน', en: 'Stir it together' }, fill: 'bowl-dough' },
      { type: 'shape', tray: 'tray-empty', piece: 'dough-ball', count: 6, say: { th: 'แตะบนถาด ปั้นก้อนคุกกี้ 6 ก้อน', en: 'Tap the tray to make six cookie balls' } },
      { type: 'cook', appliance: 'oven', inside: 'stage', result: 'cookies-tray' },
      { type: 'decorate', base: 'dish:cookie' },
      { type: 'serve' }
    ]
  },
  cake: {
    name: { th: 'เค้กวันเกิด', en: 'Birthday cake' }, ingredients: ['egg', 'egg', 'sugar', 'butter', 'flour', 'milk'],
    toppings: ['cream', 'strawberry', 'star', 'heart', 'sprinkles', 'chocsauce', 'cherry', 'starcookie', 'blueberry', 'rainbow'],
    steps: [
      { type: 'prep', items: ['egg', 'egg'] },
      { type: 'add', items: ['egg', 'egg', 'sugar'], into: 'dish:bowl' },
      { type: 'mix', tool: 'whisk', action: { th: 'ตีไข่กับน้ำตาลให้ฟู', en: 'Whisk the eggs and sugar' }, fill: 'bowl-batter' },
      { type: 'prep', items: ['butter'] },
      { type: 'add', items: ['butter', 'flour', 'milk'], into: 'bowl-batter' },
      { type: 'mix', tool: 'spoon', action: { th: 'คนให้เข้ากัน', en: 'Stir it together' }, fill: 'bowl-batter' },
      { type: 'pour', from: 'bowl-batter', into: 'tin-empty', result: 'tin-filled', color: '#f3e2b3', say: { th: 'กดชามค้างไว้ เทแป้งลงพิมพ์', en: 'Hold the bowl to pour batter into the tin' } },
      { type: 'cook', appliance: 'oven', inside: 'tin-filled', result: 'cake-plain' },
      { type: 'spread', base: 'cake-plain', pens: ['cream'], swatches: true, result: 'dish:cake', say: { th: 'เลือกสีครีม แล้วถูนิ้วทาให้ทั่วก้อน', en: 'Pick a frosting colour and rub it all over the cake' } },
      { type: 'decorate' },
      { type: 'candles', count: 3 },
      { type: 'serve' }
    ]
  },
  icecream: {
    name: { th: 'ไอศกรีม', en: 'Ice cream' }, ingredients: ['strawberry', 'milk', 'yogurt', 'sugar'],
    toppings: ['cherry', 'wafer', 'chocchip', 'star', 'banana', 'sprinkles', 'chocsauce', 'kiwi', 'orange', 'mint'],
    steps: [
      { type: 'prep', items: ['strawberry'] },
      { type: 'add', items: ['strawberry', 'milk', 'yogurt', 'sugar'], into: 'appliance:blender-open', say: { th: 'ใส่ทุกอย่างลงโถปั่น', en: 'Put everything into the blender' } },
      { type: 'lid', lid: 'tool:blender-lid', target: 'appliance:blender-open', result: 'appliance:blender', say: { th: 'ลากฝามาปิดโถ', en: 'Drag the lid onto the jar' } },
      { type: 'cook', appliance: 'blender', result: 'appliance:blender-full' },
      { type: 'pour', from: 'appliance:blender-full', into: 'tub-empty', result: 'tub-liquid', color: '#f4a6b8', say: { th: 'กดโถค้างไว้ เทลงกล่อง', en: 'Hold the jar to pour into the tub' } },
      { type: 'cook', appliance: 'freezer', inside: 'tub-liquid', result: 'tub-frozen' },
      { type: 'move', from: 'tub-frozen', carry: 'scoop-ball', tool: 'tool:scoop', to: 'cone-empty', count: 2, result: 'dish:icecream', say: { th: 'ตักไอศกรีมใส่โคน 2 ลูก', en: 'Scoop ice cream onto the cone, two scoops' } },
      { type: 'decorate' },
      { type: 'serve' }
    ]
  },
  toast: {
    name: { th: 'ขนมปังปิ้ง', en: 'Toast' }, ingredients: ['bread', 'butter', 'jam', 'honey'],
    toppings: ['banana', 'strawberry', 'blueberry', 'chocchip', 'heart', 'honeydrizzle', 'chocsauce', 'kiwi', 'orange', 'sprinkles'],
    steps: [
      { type: 'cook', appliance: 'toaster', inside: 'ing:bread', result: 'toast-plain' },
      { type: 'spread', base: 'toast-plain', pens: ['butter'], goal: .45, result: 'dish:toast', say: { th: 'ถูนิ้วทาเนยให้ทั่ว', en: 'Rub butter all over the toast' } },
      { type: 'spread', base: 'dish:toast', pens: ['jam', 'honey'], goal: .35, say: { th: 'เลือกแยมหรือน้ำผึ้ง แล้วทาให้ทั่ว', en: 'Pick jam or honey and spread it' } },
      { type: 'decorate' },
      { type: 'serve' }
    ]
  },
  smoothie: {
    name: { th: 'สมูทตี', en: 'Smoothie' }, ingredients: ['strawberry', 'banana', 'yogurt', 'milk', 'honey'],
    toppings: ['straw', 'cream', 'cherry', 'strawberry', 'banana', 'kiwi', 'orange', 'mint', 'sprinkles', 'marshmallow'],
    steps: [
      { type: 'prep', items: ['strawberry', 'banana'] },
      { type: 'add', items: ['strawberry', 'banana', 'yogurt', 'milk', 'honey'], into: 'appliance:blender-open', say: { th: 'ใส่ทุกอย่างลงโถปั่น', en: 'Put everything into the blender' } },
      { type: 'lid', lid: 'tool:blender-lid', target: 'appliance:blender-open', result: 'appliance:blender', say: { th: 'ลากฝามาปิดโถ', en: 'Drag the lid onto the jar' } },
      { type: 'cook', appliance: 'blender', result: 'appliance:blender-full' },
      { type: 'pour', from: 'appliance:blender-full', into: 'dish:glass', result: 'dish:smoothie', color: '#f4a6b8', say: { th: 'กดโถค้างไว้ เทใส่แก้ว', en: 'Hold the jar to pour into the glass' } },
      { type: 'decorate' },
      { type: 'serve' }
    ]
  }
};

// ครัวอิสระ: ใส่อะไรก็ได้ เลือกเครื่องเอง ได้ "จานลึกลับ" — ไม่มีสูตร ไม่มีผิด
const ALL_TOPPINGS = ['star', 'strawberry', 'rainbow', 'blueberry', 'cherry', 'chocchip', 'cream', 'candle', 'marshmallow', 'banana', 'wafer', 'heart', 'sprinkles', 'chocsauce', 'honeydrizzle', 'kiwi', 'orange', 'mint', 'starcookie',
  'mushroom', 'olive', 'corn', 'pineapple', 'pepper', 'ketchup', 'springonion', 'carrot', 'peas', 'egg', 'coriander', 'chili', 'lime', 'cucumber', 'shrimp', 'seaweed', 'sesame', 'tomatoslice', 'garlic', 'rice', 'straw'];
const FREE_INGREDIENTS = ['egg', 'milk', 'flour', 'sugar', 'butter', 'tomato', 'cheese', 'strawberry', 'banana', 'springonion', 'noodles', 'bokchoy', 'fishball', 'bread', 'honey', 'chocchips', 'dough', 'yogurt', 'jam'];
// สี/รสของวัตถุดิบ ใช้เลือกว่าจานลึกลับออกมาเป็นอะไร
const INGREDIENT_TRAITS = {
  egg: { color: 'yellow', taste: 'savory' }, milk: { color: 'white', taste: 'sweet' }, flour: { color: 'white', taste: 'sweet' }, sugar: { color: 'white', taste: 'sweet' },
  butter: { color: 'yellow', taste: 'sweet' }, tomato: { color: 'pink', taste: 'savory' }, cheese: { color: 'yellow', taste: 'savory' }, strawberry: { color: 'pink', taste: 'sweet' },
  banana: { color: 'yellow', taste: 'sweet' }, springonion: { color: 'green', taste: 'savory' }, noodles: { color: 'yellow', taste: 'savory' }, bokchoy: { color: 'green', taste: 'savory' },
  fishball: { color: 'white', taste: 'savory' }, bread: { color: 'brown', taste: 'sweet' }, honey: { color: 'yellow', taste: 'sweet' }, chocchips: { color: 'brown', taste: 'sweet' },
  dough: { color: 'white', taste: 'savory' }, yogurt: { color: 'white', taste: 'sweet' }, jam: { color: 'pink', taste: 'sweet' }
};
// อาหารสำเร็จตามเครื่อง (รูปใน assets/states/ — ชุดที่ 4) · ยังไม่มีรูปไหน ใช้ FREE_FALLBACK แทน
const FREE_RESULT = {
  blender: ({ color }) => `drink-${color}`,
  toaster: ({ taste, burnt }) => (burnt ? 'toast-burnt' : taste === 'savory' ? 'toast-cheese' : 'dish:toast'),
  oven: ({ taste, burnt }) => (burnt ? 'bake-burnt' : taste === 'savory' ? 'bake-casserole' : 'bake-pie'),
  pan: ({ taste, burnt }) => (burnt ? 'fry-burnt' : taste === 'savory' ? 'fry-stirfry' : 'fry-pancakes'),
  pot: ({ taste }) => (taste === 'savory' ? 'soup-savory' : 'soup-sweet'),
  freezer: ({ taste, color }) => (taste === 'savory' ? 'ice-block' : `pop-${color === 'white' ? 'yellow' : color}`)
};
const FREE_ART = ['drink-pink', 'drink-yellow', 'drink-green', 'drink-brown', 'drink-white', 'toast-cheese', 'toast-burnt', 'bake-pie', 'bake-casserole', 'bake-burnt',
  'fry-pancakes', 'fry-stirfry', 'fry-burnt', 'soup-savory', 'soup-sweet', 'pop-pink', 'pop-yellow', 'pop-green', 'pop-brown', 'ice-block'];   // รูปชุดที่ 4 ที่มีแล้ว
const FREE_FALLBACK = { blender: 'dish:smoothie', toaster: 'dish:toast', oven: 'bake-pie', pan: 'dish:omelet', pot: 'dish:noodles', freezer: 'dish:icecream' };
const FALLBACK_STATE = { 'bake-pie': 'dish:cookie', 'bake-casserole': 'dish:pizza', 'bake-burnt': 'dish:cookie', 'fry-pancakes': 'dish:omelet', 'fry-stirfry': 'dish:omelet', 'fry-burnt': 'dish:omelet',
  'soup-savory': 'dish:noodles', 'soup-sweet': 'dish:noodles', 'toast-cheese': 'dish:toast', 'toast-burnt': 'dish:toast', 'ice-block': 'dish:icecream' };
function freeResultArt(kind, traits) {
  const key = FREE_RESULT[kind](traits);
  if (key.includes(':')) return key;
  if (FREE_ART.includes(key)) return key;
  if (key.startsWith('drink-')) return 'dish:smoothie';
  if (key.startsWith('pop-')) return 'dish:icecream';
  return FALLBACK_STATE[key] || FREE_FALLBACK[kind];
}
// สรุปว่าของที่ใส่หวานหรือคาว และสีไหนเยอะสุด
function freeTraits(items) {
  const count = (field) => items.reduce((acc, id) => { const v = INGREDIENT_TRAITS[id]?.[field] || 'white'; acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  const top = (map, order) => order.reduce((best, key) => ((map[key] || 0) > (map[best] || 0) ? key : best), order[0]);
  return { taste: top(count('taste'), ['sweet', 'savory']), color: top(count('color'), ['pink', 'yellow', 'green', 'brown', 'white']) };
}
RECIPES.free = {
  name: { th: 'ครัวอิสระ', en: 'Free kitchen' }, ingredients: [], toppings: ALL_TOPPINGS, free: true,
  steps: [
    { type: 'freeadd', say: { th: 'แตะของที่อยากใส่ลงชาม กี่อย่างก็ได้ แล้วแตะเสร็จแล้ว', en: 'Tap anything you want to put in the bowl, then tap done' } },
    { type: 'freecook', say: { th: 'เลือกเครื่องที่อยากใช้', en: 'Pick a machine to cook with' } },
    { type: 'decorate', scroll: true, nodraw: true },
    { type: 'serve' }
  ]
};

// likes = เมนูโปรด (กินแล้วดีใจสุดๆ) · unlock = จำนวนครั้งที่ป้อนเพื่อนสะสม ก่อนตัวนี้จะมาเล่นด้วย
// likes = เมนูโปรด · loves = ท็อปปิ้งที่ชอบมาก (ใส่แล้วดีใจสุดๆ) · hates = ของที่ไม่ชอบ (ใส่แล้วทำหน้าอี๋ — ขำๆ ไม่มีโทษ)
const FRIENDS = {
  seal: { name: { th: 'แมวน้ำ', en: 'Seal' }, likes: ['icecream', 'smoothie', 'noodles'], loves: ['shrimp', 'cherry'], hates: ['chili', 'mushroom'], unlock: 0 },
  turtle: { name: { th: 'เต่า', en: 'Turtle' }, likes: ['noodles', 'omelet', 'pizza'], loves: ['mint', 'cucumber'], hates: ['chocsauce', 'marshmallow'], unlock: 0 },
  rabbit: { name: { th: 'กระต่าย', en: 'Rabbit' }, likes: ['cake', 'cupcake', 'cookie'], loves: ['carrot', 'strawberry'], hates: ['shrimp', 'seaweed', 'fishball'], unlock: 0 },
  cat: { name: { th: 'แมว', en: 'Cat' }, likes: ['omelet', 'toast', 'noodles'], loves: ['shrimp', 'cream'], hates: ['lime', 'cucumber'], unlock: 3 },
  penguin: { name: { th: 'เพนกวิน', en: 'Penguin' }, likes: ['icecream', 'smoothie', 'toast'], loves: ['shrimp', 'seaweed'], hates: ['chili', 'honeydrizzle'], unlock: 6 },
  fox: { name: { th: 'จิ้งจอก', en: 'Fox' }, likes: ['pizza', 'cookie', 'omelet'], loves: ['blueberry', 'corn'], hates: ['lime', 'olive'], unlock: 10 },
  unicorn: { name: { th: 'ยูนิคอร์น', en: 'Unicorn' }, likes: ['cake', 'cupcake', 'icecream'], loves: ['rainbow', 'sprinkles'], hates: ['garlic', 'seaweed', 'fishball'], unlock: 14 },
  dolphin: { name: { th: 'โลมา', en: 'Dolphin' }, likes: ['smoothie', 'noodles', 'toast'], loves: ['seaweed', 'kiwi'], hates: ['chocsauce', 'pepper'], unlock: 18 },
  butterfly: { name: { th: 'ผีเสื้อ', en: 'Butterfly' }, likes: ['cupcake', 'cake', 'smoothie'], loves: ['honeydrizzle', 'mint'], hates: ['garlic', 'egg'], unlock: 22 },
  octopus: { name: { th: 'หมึกยักษ์', en: 'Octopus' }, likes: ['noodles', 'pizza', 'omelet'], loves: ['sesame', 'corn'], hates: ['lime', 'marshmallow'], unlock: 26 },
  squirrel: { name: { th: 'กระรอก', en: 'Squirrel' }, likes: ['cookie', 'toast', 'cake'], loves: ['chocchip', 'corn'], hates: ['shrimp', 'fishball'], unlock: 30 }
};
const THING_NAMES = { ...INGREDIENTS };   // ชื่อท็อปปิ้งสำหรับพูด (เฉพาะที่ใช้ในความชอบ)
Object.assign(THING_NAMES, {
  shrimp: { th: 'กุ้ง', en: 'shrimp' }, cherry: { th: 'เชอร์รี', en: 'cherry' }, mint: { th: 'ใบมินต์', en: 'mint' }, cucumber: { th: 'แตงกวา', en: 'cucumber' },
  chocsauce: { th: 'ซอสช็อกโกแลต', en: 'chocolate sauce' }, marshmallow: { th: 'มาร์ชเมลโล่', en: 'marshmallow' }, carrot: { th: 'แครอท', en: 'carrot' },
  seaweed: { th: 'สาหร่าย', en: 'seaweed' }, cream: { th: 'วิปครีม', en: 'whipped cream' }, lime: { th: 'มะนาว', en: 'lime' }, chili: { th: 'พริก', en: 'chili' },
  mushroom: { th: 'เห็ด', en: 'mushroom' }, honeydrizzle: { th: 'น้ำผึ้ง', en: 'honey' }, blueberry: { th: 'บลูเบอร์รี', en: 'blueberry' }, corn: { th: 'ข้าวโพด', en: 'corn' },
  olive: { th: 'มะกอก', en: 'olive' }, rainbow: { th: 'สายรุ้ง', en: 'rainbow' }, sprinkles: { th: 'สปริงเกิล', en: 'sprinkles' }, garlic: { th: 'กระเทียมเจียว', en: 'fried garlic' },
  kiwi: { th: 'กีวี', en: 'kiwi' }, pepper: { th: 'พริกหวาน', en: 'bell pepper' }, sesame: { th: 'งา', en: 'sesame' }, chocchip: { th: 'ช็อกโกแลตชิป', en: 'chocolate chip' }
});
const thingSrc = (key) => (INGREDIENTS[key] ? preparedSrc(key) : toppingSrc(key));
const thingName = (key) => local(THING_NAMES[key] || INGREDIENTS[key] || { th: key, en: key });
// รูปหน้าตาที่วาดแล้ว: assets/friends/<id>-<อารมณ์>.png (ตัว/อารมณ์ที่ยังไม่มีใช้ท่า CSS + รูปปกติ)
const FRIEND_ART = Object.fromEntries(['seal', 'turtle', 'rabbit', 'cat', 'penguin', 'fox', 'unicorn', 'dolphin', 'butterfly', 'octopus', 'squirrel'].map((id) => [id, ['love', 'yum', 'sneeze', 'full']]));
const FRIEND_MAX_ON_SCREEN = 4;
// ปฏิกิริยาตอนกิน เรียงตามลำดับที่เช็ก: จาม (มีพริก) > อิ่มแปล้ (ท็อปปิ้ง 10+) > ชอบสุดๆ (เมนูโปรด/ตามสั่ง) > อร่อย
const REACTIONS = {
  yuck: { th: 'อี๋ ไม่ชอบอันนี้เลย', en: 'Eww, not this one!', tone: 260, particle: '💦' },
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
    home: 'กลับหน้าครัว', listen: 'ฟังอีกครั้ง', add: 'ลากของลงไป หรือแตะของแล้วแตะเป้าหมาย',
    cut: 'ปาดนิ้วหั่น', crack: 'แตะให้แตก', cutDone: 'หั่นแล้ว', crackDone: 'แตกแล้ว', prepDone: 'เตรียมเสร็จแล้ว', draw: 'ลากนิ้วบนอาหารเพื่อทาซอส',
    mixHint: { stir: 'ลากวนๆ ในชามจนแถบเต็ม', whisk: 'ลากไปมาเร็วๆ จนแถบเต็ม', roll: 'ลากซ้ายขวาจนแถบเต็ม', spread: 'ลากไปมาให้ทั่วจนแถบเต็ม' },
    start: 'เริ่มเลย', hold: 'กดค้าง', decorate: 'ตกแต่งได้ตามใจ',
    done: 'เสร็จแล้ว', serve: 'ลากอาหารไปหาเพื่อน ป้อนได้หลายคน', again: 'ทำอีกจาน', gallery: 'สมุดผลงาน', place: 'แตะจุดบนอาหาร หรือลากไปวาง',
    bookIntro: 'นี่คือของอร่อยที่หนูทำเอง แตะดูได้เลย', gaveTo: 'ให้', and: 'กับ', makeAgain: 'ทำอีก',
    praise: ['น่ากินมาก!', 'หอมจังเลย!', 'ทำเก่งมาก!'],
    poured: 'เทเรียบร้อย', flipped: 'พลิกสวยเลย!', spreadDone: 'ทาทั่วแล้ว', sprinkled: 'โรยทั่วแล้ว', shaped: 'ครบแล้ว', lidOn: 'ปิดฝาแล้ว', sliced: 'ตัดเรียบร้อย', dipped: 'ลวกได้ที่แล้ว', moved: 'เรียบร้อย',
    candlePlace: 'แตะบนเค้ก ปักเทียน', candleLight: 'แตะเทียนให้ติดไฟ', candleBlow: 'ปาดนิ้วผ่านเทียน เป่าเลย!', birthday: 'สุขสันต์วันเกิด!',
    ready: 'พร้อมแล้ว ไปตกแต่งกัน', wants: 'อยากกิน', orderDone: 'ตรงใจเลย ขอบคุณนะ!', newFriend: 'เพื่อนใหม่มาเล่นด้วย', nextFriend: 'เพื่อนคนต่อไป', ok: 'ตกลง',
    likesWord: 'ชอบ', hatesWord: 'ไม่ชอบ', parent: 'ผู้ปกครอง', parentHold: 'กดค้าง 2 วินาที', stats: 'สถิติ', madeCount: 'จานที่ทำ', servedCount: 'ป้อนเพื่อน', friendsCount: 'เพื่อนที่มาแล้ว', ordersCount: 'ทำตามที่เพื่อนขอ',
    resetAll: 'รีเซ็ตทั้งหมด (กดค้าง)', resetBook: 'ล้างสมุดผลงาน (กดค้าง)', resetDone: 'รีเซ็ตแล้ว เริ่มใหม่ได้เลย', resetNote: 'รีเซ็ตแล้วเพื่อนจะกลับไปเหลือ 3 ตัว สมุดผลงานว่าง', version: 'เวอร์ชัน',
    mixed: { stir: 'เข้ากันดีแล้ว', whisk: 'ฟูกำลังดี', roll: 'แบนสวยเลย', spread: 'ทาทั่วแล้ว' },
    toLilly: 'กลับโลกของลิลลี่',
    freeTitle: 'ครัวอิสระ ✨ ทำอะไรก็ได้', mystery: 'ได้จานลึกลับแล้ว!', pickMachine: 'กดค้างให้เครื่องทำงาน ปล่อยเมื่อแถบเต็ม', burnt: 'โอ๊ะ ไหม้แล้ว! ก็ยังกินได้นะ', freeAdd: 'แตะของที่อยากใส่ ลงชามได้เลย',
    shop: 'ร้านของหนู', toShop: 'เอาไปวางขายที่ร้านกัน', gotStock: 'ได้', piece: 'ชิ้น', shelfFull: 'ชั้นเต็มแล้ว',
    shopSold: 'ขายของ', shopBank: 'เงินในกระปุก', resetShop: 'ล้างร้าน (กดค้าง)',
    shopLevel: 'ระดับร้าน', shopSales: 'ยอดขาย (บาท)', shopDecor: 'ของแต่งที่ซื้อ', skillTitle: 'ร้านของหนู: ทักษะคณิต (100 รายการล่าสุด)',
    skillTimes: 'ครั้ง', skillFirst: 'ถูกครั้งแรก', skillHelp: 'ใช้ตัวช่วย', skillNone: 'ยังไม่ได้ขายของ',
    skills: { count: 'นับของ', collect: 'รับเงินพอดี', change: 'ทอนเงิน', price: 'บวกราคา', remaining: 'ของเหลือ', buy: 'ซื้อของที่ตลาด' }
  },
  en: {
    title: 'Happy Little Kitchen', subtitle: 'Pick a treat and make it your way', language: '🇬🇧 ENG',
    home: 'Back to the kitchen', listen: 'Listen again', add: 'Drag it in, or tap an item then tap the target',
    cut: 'Swipe to slice the', crack: 'Tap to crack the', cutDone: 'sliced', crackDone: 'cracked', prepDone: 'All prepped', draw: 'Drag on the food to add sauce',
    mixHint: { stir: 'Drag in circles until the bar is full', whisk: 'Drag back and forth until the bar is full', roll: 'Drag left and right until the bar is full', spread: 'Drag all over until the bar is full' },
    start: 'Start', hold: 'Hold', decorate: 'Decorate it your way',
    done: 'All done', serve: 'Drag food to friends. You can feed more than one', again: 'Make another', gallery: 'My cookbook', place: 'Tap the food or drag to place it',
    bookIntro: 'These are the treats you made. Tap one to see it', gaveTo: 'for', and: 'and', makeAgain: 'Make again',
    praise: ['That looks delicious!', 'It smells wonderful!', 'Great cooking!'],
    poured: 'All poured', flipped: 'Perfect flip!', spreadDone: 'All covered', sprinkled: 'Nicely sprinkled', shaped: 'All done', lidOn: 'Lid is on', sliced: 'Sliced up', dipped: 'Cooked just right', moved: 'Done',
    candlePlace: 'Tap the cake to add candles', candleLight: 'Tap the candles to light them', candleBlow: 'Swipe across the candles to blow!', birthday: 'Happy birthday!',
    ready: 'Ready! Let us decorate it', wants: 'wants to eat', orderDone: 'Just what I wanted! Thank you!', newFriend: 'A new friend came to play', nextFriend: 'Next friend', ok: 'OK',
    likesWord: 'likes', hatesWord: 'does not like', parent: 'Parents', parentHold: 'Hold for 2 seconds', stats: 'Stats', madeCount: 'Dishes made', servedCount: 'Friends fed', friendsCount: 'Friends unlocked', ordersCount: 'Orders completed',
    resetAll: 'Reset everything (hold)', resetBook: 'Clear the cookbook (hold)', resetDone: 'Reset done, start fresh', resetNote: 'Resetting goes back to three friends and an empty cookbook', version: 'Version',
    mixed: { stir: 'Perfectly mixed', whisk: 'Nice and fluffy', roll: 'Rolled out nicely', spread: 'All spread out' },
    toLilly: 'Back to Lilly’s world',
    freeTitle: 'Free kitchen ✨ make anything', mystery: 'A mystery dish!', pickMachine: 'Hold to run the machine, let go when the bar is full', burnt: 'Oops, it burned! Still tasty', freeAdd: 'Tap anything you want to put in the bowl',
    shop: 'My shop', toShop: 'Let us sell them in the shop', gotStock: 'We made', piece: '', shelfFull: 'The shelf is full',
    shopSold: 'Orders sold', shopBank: 'Money in the bank', resetShop: 'Clear the shop (hold)',
    shopLevel: 'Shop level', shopSales: 'Sales (baht)', shopDecor: 'Decorations bought', skillTitle: 'My shop: math skills (last 100)',
    skillTimes: 'Times', skillFirst: 'First try', skillHelp: 'Used help', skillNone: 'Nothing sold yet',
    skills: { count: 'Counting food', collect: 'Taking exact money', change: 'Giving change', price: 'Adding prices', remaining: 'How many left', buy: 'Buying at the market' }
  }
};

const app = document.querySelector('#app');
let state = loadState();
saveState(); // เขียนกลับทันที ผลงานเก่าจะได้อยู่ในรูปแบบใหม่
let activeRecipe = null;
let session = null;      // บริบทของการทำอาหารรอบนี้ เช่น { destination: 'stock', restockId } ตอนทำไปเติมร้าน
let step = 0;
let creation = null;
let stage = null;        // ของบนเวทีระหว่างทำ: { base, bits, slices, candles }
let paint = null;        // canvas เก็บสี/ครีมที่เด็กทาไว้ (ใช้ซ้ำทุกขั้น)
let currentPrompt = '';
let audioCtx = null;
let speechQueue = Promise.resolve();
let speechGeneration = 0;
let speechCancelledAt = 0;
let speechWarmed = false;
let voices = [];
function refreshVoices() { if ('speechSynthesis' in window) voices = window.speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}
// iPhone/iPad ไม่สนใจ utterance.lang ถ้าไม่ได้ตั้ง voice เอง — ข้อความไทยเลยถูกส่งให้เสียงอังกฤษแล้วเงียบ
// ต้องเลือกเสียงให้ตรงภาษาเอง (เอาเสียงที่ติดมากับเครื่องก่อน ไม่ต้องรอโหลด)
function findVoice(lang) {
  if (!voices.length) refreshVoices();
  const norm = (value) => value.toLowerCase().replace('_', '-');
  const same = voices.filter((voice) => norm(voice.lang).startsWith(lang.slice(0, 2).toLowerCase()));
  const exact = same.filter((voice) => norm(voice.lang) === lang.toLowerCase());
  return exact.find((voice) => voice.localService) || exact[0] || same.find((voice) => voice.localService) || same[0] || null;
}

const FOLDERS = { state: 'states', dish: 'dishes', ing: 'ingredients', tool: 'tools', appliance: 'appliances', top: 'toppings', friend: 'friends' };
// แปลง 'kind:key' (ไม่มีคำนำหน้า = state) เป็นที่อยู่รูป
function art(ref) {
  if (!ref) return '';
  const [kind, key] = ref.includes(':') ? ref.split(':') : ['state', ref];
  return `assets/${FOLDERS[kind]}/${key}.png`;
}
// url() ใน custom property ถูกแปลงเทียบกับไฟล์ CSS ไม่ใช่หน้าเว็บ เลยต้องใช้ที่อยู่เต็ม
const absolute = (src) => new URL(src, location.href).href;
const dishSrc = (id) => art(`dish:${id}`);
const ingredientSrc = (id) => art(`ing:${id}`);
const toolSrc = (id) => art(`tool:${id}`);
const toppingSrc = (id) => art(`top:${id}`);
const preparedSrc = (id) => INGREDIENTS[id].prepared ? art(`ing:${INGREDIENTS[id].prepared}`) : ingredientSrc(id);
const applianceKind = (key) => APPLIANCE_BASE[key] || key;

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
        .slice(0, GALLERY_MAX)
        .map((item) => ({ ...item, toppings: (Array.isArray(item.toppings) ? item.toppings : []).map(normalizeTopping) })),
      served: Number.isFinite(saved?.served) ? saved.served : 0,
      made: Number.isFinite(saved?.made) ? saved.made : (Array.isArray(saved?.gallery) ? saved.gallery.length : 0),
      ordersDone: Number.isFinite(saved?.ordersDone) ? saved.ordersDone : 0,
      order
    };
  } catch {
    return { lang: 'th', sound: true, gallery: [], served: 0, made: 0, ordersDone: 0, order: null };
  }
}

const friendSrc = (id, expression) => (expression && FRIEND_ART[id]?.includes(expression)) ? `assets/friends/${id}-${expression}.png` : `assets/friends/${id}.png`;
const unlockedFriends = () => Object.keys(FRIENDS).filter((id) => FRIENDS[id].unlock <= state.served);
const nextLockedFriend = () => Object.keys(FRIENDS).find((id) => FRIENDS[id].unlock > state.served) || null;
const todayKey = () => new Date().toISOString().slice(0, 10);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  // iOS ยอมให้พูดได้ก็ต่อเมื่อ speak() ครั้งแรกเกิดตอนผู้ใช้แตะ — พูดประโยคเงียบๆ ไว้ก่อน แล้วรายชื่อเสียงจะโหลดตามมา
  if (!speechWarmed && 'speechSynthesis' in window) {
    speechWarmed = true;
    try {
      const warm = new SpeechSynthesisUtterance(' ');
      warm.volume = 0;
      window.speechSynthesis.speak(warm);
    } catch {}
    refreshVoices();
  }
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


// ---------------------------------------------------------------- เสียงประกอบ (สังเคราะห์ด้วย WebAudio ไม่ต้องมีไฟล์เสียง เล่นออฟไลน์ได้)
let noiseBuffer = null;
function noiseSource() {
  if (!noiseBuffer) {
    const length = audioCtx.sampleRate * 2;
    noiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  return source;
}
function sfxReady() {
  if (!state.sound) return false;
  unlockAudio();
  return Boolean(audioCtx);
}
// เสียงสั้นๆ: noise ผ่าน filter + envelope
function noiseBurst({ type = 'bandpass', freq = 1500, q = 1, gain = .12, attack = .005, length = .15, sweepTo = null } = {}) {
  if (!sfxReady()) return;
  const now = audioCtx.currentTime;
  const source = noiseSource();
  const filter = audioCtx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, now);
  filter.Q.value = q;
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, now + length);
  const amp = audioCtx.createGain();
  amp.gain.setValueAtTime(.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + attack);
  amp.gain.exponentialRampToValueAtTime(.0001, now + length);
  source.connect(filter).connect(amp).connect(audioCtx.destination);
  source.start(now);
  source.stop(now + length + .05);
}
function chirp(from, to, { type = 'sine', gain = .07, length = .18, delay = 0 } = {}) {
  if (!sfxReady()) return;
  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + length);
  amp.gain.setValueAtTime(.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + .02);
  amp.gain.exponentialRampToValueAtTime(.0001, now + length);
  osc.connect(amp).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + length + .05);
}
const SFX = {
  chop: () => { noiseBurst({ type: 'lowpass', freq: 900, gain: .18, length: .09 }); chirp(220, 90, { gain: .05, length: .08 }); },
  crack: () => { noiseBurst({ type: 'highpass', freq: 2500, gain: .14, length: .07 }); chirp(900, 300, { gain: .04, length: .1 }); },
  plip: () => chirp(700, 1100, { gain: .06, length: .09 }),
  swish: () => noiseBurst({ type: 'bandpass', freq: 1800, q: .7, gain: .05, length: .14, sweepTo: 2600 }),
  whoosh: () => noiseBurst({ type: 'bandpass', freq: 600, q: .8, gain: .12, length: .32, sweepTo: 2400 }),
  tick: () => noiseBurst({ type: 'highpass', freq: 4000, gain: .06, length: .04 }),
  clunk: () => { noiseBurst({ type: 'lowpass', freq: 400, gain: .16, length: .1 }); chirp(160, 120, { type: 'triangle', gain: .06, length: .12 }); },
  ding: () => { chirp(1568, 1560, { gain: .09, length: .5 }); chirp(2349, 2340, { gain: .05, length: .35, delay: .02 }); },
  giggle: () => [0, .12, .24, .36].forEach((d, i) => chirp(600 + i * 120, 900 + i * 120, { gain: .06, length: .1, delay: d })),
  yum: () => chirp(420, 520, { gain: .06, length: .35 }),
  achoo: () => { chirp(500, 900, { gain: .05, length: .25 }); noiseBurst({ type: 'bandpass', freq: 1200, q: .6, gain: .16, length: .3, sweepTo: 500 }); },
  snore: () => { chirp(180, 120, { type: 'triangle', gain: .05, length: .5 }); chirp(140, 200, { type: 'triangle', gain: .04, length: .5, delay: .55 }); },
  yuck: () => { chirp(520, 260, { type: 'triangle', gain: .06, length: .45 }); noiseBurst({ type: 'lowpass', freq: 700, gain: .08, length: .25 }); },
  // เพลงแฮปปี้เบิร์ธเดย์ ท่อนแรก
  birthday: () => {
    const notes = [[392, .3], [392, .2], [440, .5], [392, .5], [523, .5], [494, .9], [392, .3], [392, .2], [440, .5], [392, .5], [587, .5], [523, .9]];
    let at = 0;
    notes.forEach(([freq, length]) => { chirp(freq, freq, { type: 'triangle', gain: .07, length: length * .9, delay: at }); at += length; });
  }
};
// เสียงยาวระหว่างกดค้าง คืน stop()
const LOOPS = {
  sizzle: () => ({ noise: { type: 'bandpass', freq: 3800, q: .5, gain: .07 }, crackle: 14 }),
  boil: () => ({ noise: { type: 'lowpass', freq: 420, q: .8, gain: .07 }, blips: [140, 260, 240] }),
  whirr: () => ({ osc: { type: 'sawtooth', freq: 95, gain: .045, lowpass: 900, vibrato: 7 } }),
  hum: () => ({ osc: { type: 'triangle', freq: 60, gain: .04, lowpass: 400, vibrato: 0 }, noise: { type: 'lowpass', freq: 700, q: .5, gain: .02 } }),
  freeze: () => ({ noise: { type: 'lowpass', freq: 260, q: .5, gain: .035 }, blips: [1900, 2400, 400] }),
  pour: () => ({ noise: { type: 'bandpass', freq: 650, q: 1.2, gain: .06 }, wobble: 5 })
};
const APPLIANCE_LOOP = { pan: 'sizzle', pot: 'boil', blender: 'whirr', oven: 'hum', toaster: 'hum', freezer: 'freeze' };
function startLoop(name) {
  if (!sfxReady() || !LOOPS[name]) return () => {};
  const spec = LOOPS[name]();
  const now = audioCtx.currentTime;
  const master = audioCtx.createGain();
  master.gain.setValueAtTime(.0001, now);
  master.gain.exponentialRampToValueAtTime(1, now + .15);
  master.connect(audioCtx.destination);
  const nodes = [];
  let timer = null;
  if (spec.noise) {
    const source = noiseSource();
    const filter = audioCtx.createBiquadFilter();
    filter.type = spec.noise.type;
    filter.frequency.value = spec.noise.freq;
    filter.Q.value = spec.noise.q;
    const amp = audioCtx.createGain();
    amp.gain.value = spec.noise.gain;
    if (spec.crackle || spec.wobble) {
      const lfo = audioCtx.createOscillator();
      const depth = audioCtx.createGain();
      lfo.frequency.value = spec.crackle || spec.wobble;
      depth.gain.value = spec.noise.gain * .8;
      lfo.connect(depth).connect(amp.gain);
      lfo.start(now);
      nodes.push(lfo);
    }
    source.connect(filter).connect(amp).connect(master);
    source.start(now);
    nodes.push(source);
  }
  if (spec.osc) {
    const osc = audioCtx.createOscillator();
    osc.type = spec.osc.type;
    osc.frequency.value = spec.osc.freq;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spec.osc.lowpass;
    const amp = audioCtx.createGain();
    amp.gain.value = spec.osc.gain;
    if (spec.osc.vibrato) {
      const lfo = audioCtx.createOscillator();
      const depth = audioCtx.createGain();
      lfo.frequency.value = spec.osc.vibrato;
      depth.gain.value = spec.osc.freq * .04;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(now);
      nodes.push(lfo);
    }
    osc.connect(filter).connect(amp).connect(master);
    osc.start(now);
    nodes.push(osc);
  }
  if (spec.blips) {
    const [low, high, every] = spec.blips;
    timer = setInterval(() => chirp(low + Math.random() * (high - low), low, { gain: .035, length: .12 }), every);
  }
  return () => {
    clearInterval(timer);
    const end = audioCtx.currentTime;
    master.gain.cancelScheduledValues(end);
    master.gain.setValueAtTime(master.gain.value, end);
    master.gain.exponentialRampToValueAtTime(.0001, end + .2);
    setTimeout(() => { nodes.forEach((node) => { try { node.stop(); } catch {} }); master.disconnect(); }, 260);
  };
}

// ---------------------------------------------------------------- เสียงพูดไทยที่อัดไว้ล่วงหน้า
// เสียงไทยในเครื่อง (iOS Kanya) ไม่ชัด เลยอัดทุกประโยคด้วยเสียง Microsoft Neural (design/voice.py) ไว้ใน assets/voice/th/
// ประโยคที่ประกอบสดๆ (เช่น "แมวน้ำ ชอบ กุ้ง กับ พริก") ต่อจากคลิปย่อยเป็นคำๆ ถ้าหาไม่ครบค่อยใช้เสียงในเครื่อง
const VOICE_DIR = 'assets/voice/th/';
let voiceClips = null;       // ข้อความ → ชื่อไฟล์
const voiceBuffers = new Map();   // ชื่อไฟล์ → AudioBuffer (ถอดรหัสแล้ว)
let voiceSource = null;      // คลิปที่กำลังเล่น
fetch(`${VOICE_DIR}manifest.json`).then((response) => response.json()).then((clips) => { voiceClips = clips; }).catch(() => {});

// เล่นคลิปผ่าน Web Audio ตัวเดียวกับเสียงเอฟเฟกต์ — ถ้าใช้ <audio> แยก iOS จะสลับโหมดเสียงแล้วเอฟเฟกต์ (ปั่น/อบ) เงียบไป
// และ AudioContext ปลดล็อกแล้วตั้งแต่แตะครั้งแรก ไม่ต้องปลดล็อกเพิ่ม
// ตัดความเงียบหัวท้ายคลิป — ไฟล์จาก TTS มีช่วงเงียบราว 0.5 วิ ทั้งสองข้าง ต่อคำเป็นประโยคแล้วจะได้ไม่เว้นวรรคยาว
function trimmedClip(buffer) {
  const data = buffer.getChannelData(0);
  const threshold = .012;
  let start = 0;
  let end = data.length - 1;
  while (start < end && Math.abs(data[start]) < threshold) start++;
  while (end > start && Math.abs(data[end]) < threshold) end--;
  const pad = Math.round(buffer.sampleRate * .04);
  const from = Math.max(0, start - pad) / buffer.sampleRate;
  const to = Math.min(data.length, end + pad) / buffer.sampleRate;
  return { buffer, offset: from, duration: Math.max(.05, to - from) };
}
async function voiceBuffer(file) {
  if (voiceBuffers.has(file)) return voiceBuffers.get(file);
  const promise = fetch(VOICE_DIR + file).then((response) => response.arrayBuffer()).then((bytes) => new Promise((resolve, reject) => {
    // iOS Safari รุ่นเก่าใช้ decodeAudioData แบบ callback เท่านั้น
    const result = audioCtx.decodeAudioData(bytes, resolve, reject);
    if (result && result.then) result.then(resolve, reject);
  })).then(trimmedClip).catch((error) => { voiceBuffers.delete(file); throw error; });
  voiceBuffers.set(file, promise);
  return promise;
}

// หาคลิปให้ทั้งประโยค: ตรงทั้งข้อความก่อน ไม่งั้นแบ่งตามช่องว่างแล้วจับคู่วลีที่ยาวที่สุดไปเรื่อยๆ
function clipsFor(text) {
  if (!voiceClips) return null;
  if (voiceClips[text]) return [voiceClips[text]];
  const tokens = text.split(/\s+/).filter((token) => token && token !== '·');
  const files = [];
  let i = 0;
  while (i < tokens.length) {
    let used = 0;
    for (let n = tokens.length - i; n > 0; n--) {
      const file = voiceClips[tokens.slice(i, i + n).join(' ')];
      if (file) { files.push(file); used = n; break; }
    }
    if (!used) return null;
    i += used;
  }
  return files;
}

// เล่นคลิปต่อกัน คืน true เมื่อเล่นจบ / false เมื่อเล่นไม่ได้ (ให้ไปใช้เสียงในเครื่องแทน)
async function playClips(files, generation) {
  unlockAudio();
  if (!audioCtx) return false;
  let clips;
  try { clips = await Promise.all(files.map(voiceBuffer)); } catch { return false; }   // โหลดทุกคำก่อน จะได้ต่อกันไม่สะดุด
  if (generation !== speechGeneration) return true;
  if (audioCtx.state !== 'running') { try { await audioCtx.resume(); } catch {} }
  const gap = files.length > 1 ? .09 : 0;
  let at = audioCtx.currentTime + .02;
  const sources = clips.map((clip) => {
    const source = audioCtx.createBufferSource();
    source.buffer = clip.buffer;
    source.connect(audioCtx.destination);
    source.start(at, clip.offset, clip.duration);
    at += clip.duration + gap;
    return source;
  });
  voiceSource = { stop() { sources.forEach((source) => { try { source.stop(); } catch {} }); } };
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, (at - audioCtx.currentTime) * 1000 + 300);
    sources[sources.length - 1].onended = () => { clearTimeout(timer); resolve(); };
  });
  return true;
}

function speak(text) {
  currentPrompt = text;
  if (!state.sound || !('speechSynthesis' in window)) return Promise.resolve();
  const generation = speechGeneration;
  const language = state.lang;
  speechQueue = speechQueue.then(async () => {
    if (!state.sound || generation !== speechGeneration) return;
    if (language === 'th') {
      const files = clipsFor(text);
      if (files && await playClips(files, generation)) return;
      if (generation !== speechGeneration) return;
    }
    await synthesize(text, language, generation);
  });
  return speechQueue;
}

function synthesize(text, language, generation) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = language === 'th' ? 'th-TH' : 'en-US';
    const voice = findVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || lang;
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
    // เรียก speak() ติดกับ cancel() ทันที iOS/Chrome จะทำประโยคหาย → เว้นนิดหนึ่ง
    setTimeout(() => {
      if (generation !== speechGeneration) return finish();
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch { finish(); }
    }, Math.max(0, 60 - (Date.now() - speechCancelledAt)));
  });
}

function stopSpeech() {
  speechGeneration++;
  speechCancelledAt = Date.now();
  window.speechSynthesis?.cancel();
  if (voiceSource) { try { voiceSource.stop(); } catch {} voiceSource = null; }
  speechQueue = Promise.resolve();
}

function topbar(title, canBack = false) {
  return `<div class="topbar">
    ${canBack ? `<button class="round-btn" id="back" aria-label="${t('home')}">←</button>` : `<button class="round-btn parent-btn" id="parent" aria-label="${t('parent')} — ${t('parentHold')}"><span>👪</span><i></i></button>`}
    <div class="topbar-title">${title}</div>
    <button class="language-btn" id="language" aria-label="Language">${t('language')}</button>
    <button class="round-btn" id="sound" aria-label="${t('listen')}">${state.sound ? '🔊' : '🔇'}</button>
  </div>`;
}

function bindTopbar(onBack) {
  app.querySelector('#back')?.addEventListener('click', () => { tone(360); onBack(); });
  const rerender = () => {
    if (activeRecipe) renderStep();
    else if (app.querySelector('.book')) showBook();
    else if (app.querySelector('.parent')) showParent();
    else if (app.querySelector('.shop')) loadShop().then((shop) => shop.rerender());
    else showHome();
  };
  app.querySelector('#language').onclick = () => {
    stopSpeech();
    state.lang = state.lang === 'th' ? 'en' : 'th';
    saveState();
    rerender();
  };
  app.querySelector('#sound').onclick = () => {
    state.sound = !state.sound;
    saveState();
    if (!state.sound) stopSpeech();
    rerender();
  };
}

function galleryHTML() {
  if (!state.gallery.length) return '<div class="gallery-strip" hidden></div>';
  return `<button class="gallery-strip" id="book" aria-label="${t('gallery')}">
    <span class="gallery-title">📖</span>
    ${state.gallery.slice(0, 6).map((item) => `<img class="gallery-item" src="${item.photo || dishSrc(item.recipe)}" alt="${local(RECIPES[item.recipe].name)}">`).join('')}
  </button>`;
}

// ถ่ายรูปจานบนจอ (ฐาน + สีที่ทา + ของโรย + ท็อปปิ้ง + เทียน) เก็บเป็น JPEG เล็กๆ ไว้ในสมุดผลงาน
function snapshot(dish) {
  try {
    const rect = dish.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = PHOTO_SIZE;
    const ctx = canvas.getContext('2d');
    const k = PHOTO_SIZE / rect.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
    // ซูมเข้าหน่อยให้อาหารเต็มรูป (บนจอมีขอบจานกว้าง)
    ctx.translate(PHOTO_SIZE / 2, PHOTO_SIZE / 2);
    ctx.scale(1.35, 1.35);
    ctx.translate(-PHOTO_SIZE / 2, -PHOTO_SIZE / 2);
    const plate = dish.querySelector('.food-color');
    if (plate) {
      ctx.fillStyle = plate.style.background;
      ctx.globalAlpha = .45;
      ctx.beginPath();
      ctx.arc(PHOTO_SIZE / 2, PHOTO_SIZE / 2, PHOTO_SIZE * .31, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const drawImage = (img) => {
      if (!img.complete || !img.naturalWidth) return;
      const r = img.getBoundingClientRect();
      // วาดแบบ object-fit: contain ในกล่องของรูป
      const scale = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (r.left - rect.left + (r.width - w) / 2) * k, (r.top - rect.top + (r.height - h) / 2) * k, w * k, h * k);
    };
    const base = dish.querySelector('.food-icon');
    drawImage(base);
    // สีที่ทา: ตัดให้อยู่ในรูปฐานเหมือนบนจอ
    const layer = document.createElement('canvas');
    layer.width = layer.height = PHOTO_SIZE;
    const lctx = layer.getContext('2d');
    lctx.drawImage(paint, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
    lctx.globalCompositeOperation = 'destination-in';
    const br = base.getBoundingClientRect();
    const scale = Math.min(br.width / base.naturalWidth, br.height / base.naturalHeight);
    lctx.drawImage(base, (br.left - rect.left + (br.width - base.naturalWidth * scale) / 2) * k, (br.top - rect.top + (br.height - base.naturalHeight * scale) / 2) * k, base.naturalWidth * scale * k, base.naturalHeight * scale * k);
    ctx.drawImage(layer, 0, 0);
    dish.querySelectorAll('.bit, .topping, .candle img').forEach(drawImage);
    return canvas.toDataURL('image/jpeg', .82);
  } catch {
    return null;
  }
}

// ปุ่มกันเด็ก: ต้องกดค้าง 2 วินาที (มีวงแหวนโหลดให้เห็น) ถึงจะทำงาน
function bindHold(button, action, ms = 2000) {
  if (!button) return;
  let timer = null;
  const start = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    button.classList.add('holding');
    button.style.setProperty('--hold', `${ms}ms`);
    timer = setTimeout(() => { button.classList.remove('holding'); timer = null; tone(700, .2); action(); }, ms);
  };
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } button.classList.remove('holding'); };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', cancel);
  button.addEventListener('pointercancel', cancel);
  button.addEventListener('pointerleave', cancel);
  button.addEventListener('click', (event) => event.preventDefault());
}

const version = () => (document.querySelector('script[src*="v="]')?.getAttribute('src').match(/v=(\d+)/) || [])[1] || '?';

// หน้าผู้ปกครอง: สถิติ + รีเซ็ต (ไม่มีอะไรที่เด็กกดพลาดได้ ทุกปุ่มต้องกดค้าง)
function showParent() {
  activeRecipe = null;
  const unlocked = unlockedFriends().length;
  const shopData = readShop();
  const skills = shopSkills(shopData);
  // ระดับร้านคิดจากจำนวนออร์เดอร์ (ตรงกับ js/shop/core.js LEVELS)
  const shopLevel = [0, 5, 10, 16, 24, 32].filter((unlock) => (shopData?.ordersDone || 0) >= unlock).length;
  app.innerHTML = `<div class="app-shell play-screen">
    ${topbar(`👪 ${t('parent')}`, true)}
    <section class="parent">
      <div class="stats">
        <div class="stat"><b>${state.made}</b><span>${t('madeCount')}</span></div>
        <div class="stat"><b>${state.served}</b><span>${t('servedCount')}</span></div>
        <div class="stat"><b>${unlocked} / ${Object.keys(FRIENDS).length}</b><span>${t('friendsCount')}</span></div>
        <div class="stat"><b>${state.ordersDone}</b><span>${t('ordersCount')}</span></div>
        <div class="stat"><b>${shopData?.ordersDone || 0}</b><span>🏪 ${t('shopSold')}</span></div>
        <div class="stat"><b>${shopData?.piggy || 0}</b><span>🪙 ${t('shopBank')}</span></div>
        <div class="stat"><b>${shopLevel}</b><span>⭐ ${t('shopLevel')}</span></div>
        <div class="stat"><b>${shopData?.totals?.sales || 0}</b><span>💰 ${t('shopSales')}</span></div>
        <div class="stat"><b>${(shopData?.decor?.owned || []).length} / 10</b><span>🎈 ${t('shopDecor')}</span></div>
      </div>
      <div class="parent-skills">
        <h3>${t('skillTitle')}</h3>
        ${skills.length ? `<table><thead><tr><th></th><th>${t('skillTimes')}</th><th>${t('skillFirst')}</th><th>${t('skillHelp')}</th></tr></thead><tbody>
          ${skills.map((row) => `<tr data-skill="${row.skill}"><td>${t('skills')[row.skill]}</td><td>${row.times}</td><td>${Math.round((row.first / row.times) * 100)}%</td><td>${row.help}</td></tr>`).join('')}
        </tbody></table>` : `<p>${t('skillNone')}</p>`}
      </div>
      <p class="note">${t('resetNote')}</p>
      <button class="action-btn hold-btn" id="reset-book"><i></i><span>🖼️ ${t('resetBook')}</span></button>
      <button class="action-btn hold-btn" id="reset-shop"><i></i><span>🏪 ${t('resetShop')}</span></button>
      <button class="action-btn danger hold-btn" id="reset-all"><i></i><span>🔄 ${t('resetAll')}</span></button>
      <p class="note small">${t('version')} v${version()} · ${t('parentHold')}</p>
    </section>
  </div>`;
  bindTopbar(showHome);
  bindHold(app.querySelector('#reset-book'), () => {
    state.gallery = [];
    saveState();
    showParent();
    speak(t('resetDone'));
  });
  bindHold(app.querySelector('#reset-shop'), () => {
    try { localStorage.removeItem(SHOP_KEY); } catch {}
    showParent();
    speak(t('resetDone'));
  });
  bindHold(app.querySelector('#reset-all'), () => {
    state = { lang: state.lang, sound: state.sound, gallery: [], served: 0, made: 0, ordersDone: 0, order: null };
    saveState();
    try { localStorage.removeItem(SHOP_KEY); } catch {}
    showParent();
    speak(t('resetDone'));
  });
}

function friendChipsHTML(ids) {
  return `<span class="chips">${(ids || []).map((id) => `<img src="${friendSrc(id)}" alt="${local(FRIENDS[id].name)}">`).join('')}</span>`;
}

// สมุดผลงาน: รูปจานที่ทำแล้ว แตะเพื่อฟังชื่อ + ดูใหญ่
function showBook() {
  activeRecipe = null;
  const items = state.gallery;
  app.innerHTML = `<div class="app-shell play-screen">
    ${topbar(`📖 ${t('gallery')}`, true)}
    <div class="prompt">${t('bookIntro')}</div>
    <section class="book">
      ${items.map((item, index) => `<button class="book-card" data-book="${index}" aria-label="${local(RECIPES[item.recipe].name)}">
        <img class="photo" src="${item.photo || dishSrc(item.recipe)}" alt="">
        <span class="book-meta"><img class="mini" src="${dishSrc(item.recipe)}" alt="">${friendChipsHTML(item.friends)}</span>
      </button>`).join('')}
    </section>
  </div>`;
  bindTopbar(showHome);
  speak(t('bookIntro'));
  app.querySelectorAll('[data-book]').forEach((button) => {
    button.onclick = async () => {
      const item = items[Number(button.dataset.book)];
      const names = (item.friends || []).map((id) => local(FRIENDS[id].name)).join(` ${t('and')} `);
      tone(620);
      flash(button, 'pop', 500);
      const layer = document.createElement('div');
      layer.className = 'popup-layer';
      layer.innerHTML = `<div class="popup book-popup">
        <img class="photo big" src="${item.photo || dishSrc(item.recipe)}" alt="">
        <p><img class="mini" src="${dishSrc(item.recipe)}" alt=""> ${local(RECIPES[item.recipe].name)}</p>
        ${friendChipsHTML(item.friends)}
        <span class="popup-actions"><button class="action-btn primary" id="book-again">↻ ${t('makeAgain')}</button><button class="action-btn" id="popup-ok">👍 ${t('ok')}</button></span>
      </div>`;
      document.body.appendChild(layer);
      layer.querySelector('#popup-ok').onclick = () => layer.remove();
      layer.addEventListener('click', (event) => { if (event.target === layer) layer.remove(); });
      layer.querySelector('#book-again').onclick = () => { layer.remove(); startRecipe(item.recipe); };
      await speak(`${local(RECIPES[item.recipe].name)}${names ? ` ${t('gaveTo')} ${names}` : ''}`);
    };
  });
}

function orderBubbleHTML(order, done = false) {
  return `<span class="bubble ${done ? 'done' : ''}" aria-hidden="true"><img src="${dishSrc(order.recipe)}" alt="">${done ? '<b>✓</b>' : ''}</span>`;
}

// แถวเพื่อนบนหน้าครัว: คนที่สั่งอาหาร (มีป้าย) + เพื่อนทุกคนที่มาแล้ว + เงาของเพื่อนคนต่อไป — เลื่อนซ้ายขวาได้เมื่อเพื่อนเยอะ
function friendsRowHTML() {
  const order = ensureOrder();
  const others = unlockedFriends().filter((id) => id !== order.friend);
  const next = nextLockedFriend();
  const orderLabel = `${local(FRIENDS[order.friend].name)} ${t('wants')} ${local(RECIPES[order.recipe].name)}`;
  return `<div class="friends-row scroll-x"><div class="friends-track">
    <button class="friend-peek order" id="order" data-order-friend="${order.friend}" data-order-recipe="${order.recipe}" aria-label="${orderLabel}">
      ${orderBubbleHTML(order)}<img src="${friendSrc(order.friend)}" alt="">
    </button>
    ${others.map((id) => `<button class="friend-peek buddy" data-buddy="${id}" aria-label="${prefsSpeech(id)}"><img src="${friendSrc(id)}" alt=""></button>`).join('')}
    ${next ? `<span class="friend-peek next" title="${t('nextFriend')}" aria-label="${t('nextFriend')}"><img src="${friendSrc(next)}" alt=""><i style="--p:${Math.round(state.served / FRIENDS[next].unlock * 100)}%"></i></span>` : ''}
  </div></div>`;
}

function showHome() {
  if (activeRecipe) stopSpeech();
  activeRecipe = null;
  session = null;
  step = 0;
  removeGhosts();
  app.innerHTML = `<div class="app-shell">
    ${topbar(t('title'))}
    <section class="home">
      ${returnUrl
        ? `<button class="lilly-return" id="to-lilly" aria-label="${t('toLilly')}">🌈 <b>${t('toLilly')}</b></button>`
        : `<div class="brand"><h1>${t('title')}</h1><p>${t('subtitle')}</p></div>`}
      <div class="recipes">
        ${Object.entries(RECIPES).filter(([, recipe]) => !recipe.free).map(([id, recipe]) => `<button class="recipe-card" data-recipe="${id}" aria-label="${local(recipe.name)}">
          <img class="recipe-icon" src="${dishSrc(id)}" alt=""><b>${local(recipe.name)}</b>
        </button>`).join('')}
      </div>
      <div class="home-extras">
        <button class="free-card" data-recipe="free" aria-label="${local(RECIPES.free.name)}"><img src="${dishSrc('free')}" alt=""><b>${t('freeTitle')}</b></button>
        <button class="free-card shop-card" id="shop" aria-label="${t('shop')}"><img src="assets/shop/bank.png" alt=""><b>${t('shop')}</b></button>
      </div>
      ${galleryHTML()}
      ${friendsRowHTML()}
    </section>
  </div>`;
  bindTopbar(showHome);
  bindHold(app.querySelector('#parent'), showParent);
  const book = app.querySelector('#book');
  if (book) book.onclick = () => { tone(620); showBook(); };
  const toLilly = app.querySelector('#to-lilly');
  if (toLilly) toLilly.onclick = () => { tone(620); backToLilly(); };
  app.querySelector('#shop').onclick = async () => {
    unlockAudio();
    tone(620);
    loadShop().catch(() => {});   // โหลดโมดูลระหว่างพูด
    await speak(t('shop'));
    openShop();
  };
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
  // แถบเพื่อนเลื่อนได้: จางขอบด้านที่ยังมีเพื่อนซ่อนอยู่
  const row = app.querySelector('.friends-row');
  const updateEdges = () => {
    row.classList.toggle('more-right', row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
    row.classList.toggle('more-left', row.scrollLeft > 4);
  };
  row.addEventListener('scroll', updateEdges, { passive: true });
  requestAnimationFrame(updateEdges);
  // แตะเพื่อน = พูดชื่อ + เด้ง
  app.querySelectorAll('[data-buddy]').forEach((button) => {
    button.onclick = () => {
      unlockAudio();
      tone(700, .15);
      flash(button, 'wave', 700);
      speak(prefsSpeech(button.dataset.buddy));
    };
  });
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

function startRecipe(id, context = null) {
  activeRecipe = id;
  session = context;
  step = 0;
  creation = { recipe: id, color: '#ef6f61', toppings: [], friend: null, at: Date.now() };
  stage = { base: dishSrc(id), bits: [], slices: 0, candles: [], free: [], tint: null };
  paint = document.createElement('canvas');
  paint.width = paint.height = 512;
  renderStep();
}

// ---------------------------------------------------------------- ร้านของหนู (js/shop/)
// โหลดเฉพาะตอนเปิดร้าน ต่อ ?v= เดียวกับไฟล์นี้ — sw.js ตอบจาก cache ก่อน ถ้าไม่มี ?v= อาจได้ไฟล์ร้านรุ่นเก่าปนกับ app.js รุ่นใหม่
const MODULE_VERSION = new URL(import.meta.url).search;
let shopModule = null;
function loadShop() {
  if (!shopModule) shopModule = import(`./shop/ui.js${MODULE_VERSION}`).catch((error) => { shopModule = null; throw error; });
  return shopModule;
}
function shopApi() {
  return {
    app, lang: () => state.lang, speak, stopSpeech, tone, sfx: SFX, confetti, popup, flash, unlockAudio,
    topbar, bindTopbar, friendSrc, dishSrc, showHome, startRecipe,
    exit: returnUrl ? backToLilly : showHome,   // ปุ่มย้อนในร้าน: เปิดมาจากโลกของลิลลี่ก็กลับไปที่นั่น
    friendName: (id) => local(FRIENDS[id].name),
    recipeName: (id) => local(RECIPES[id].name),
    customers: () => unlockedFriends()
  };
}
async function openShop() {
  if (activeRecipe) stopSpeech();
  activeRecipe = null;
  session = null;
  removeGhosts();
  const shop = await loadShop();
  shop.open(shopApi());
}
function readShop() {
  try { return JSON.parse(localStorage.getItem(SHOP_KEY)) || null; } catch { return null; }
}
// สถิติสำหรับผู้ปกครอง: แต่ละทักษะทำไปกี่ครั้ง ถูกตั้งแต่ครั้งแรกกี่ % ใช้ตัวช่วยกี่ครั้ง (จากธุรกรรมล่าสุดในร้าน)
function shopSkills(shopData) {
  const rows = {};
  for (const entry of Array.isArray(shopData?.transactions) ? shopData.transactions : []) {
    const skill = entry.type === 'buy' ? 'buy' : entry.checkpoint;
    if (!COPY.th.skills[skill]) continue;
    const row = rows[skill] ||= { times: 0, first: 0, help: 0 };
    row.times++;
    if (!entry.attempts) row.first++;
    if (entry.usedHelp) row.help++;
  }
  return Object.keys(COPY.th.skills).filter((skill) => rows[skill]).map((skill) => ({ skill, ...rows[skill] }));
}

function currentSteps() { return RECIPES[activeRecipe].steps; }
function currentStep() { return currentSteps()[step]; }
function next() { step++; renderStep(); }

function dots() {
  const total = currentSteps().length;
  return `<div class="progress-dots" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i < step ? 'done' : i === step ? 'now' : ''}"></i>`).join('')}</div>`;
}

function screen(content, prompt) {
  const recipe = RECIPES[activeRecipe];
  const current = currentStep();
  removeGhosts();
  app.innerHTML = `<div class="app-shell play-screen">
    ${topbar(`<img class="title-icon" src="${dishSrc(activeRecipe)}" alt=""> ${local(recipe.name)}`, true)}
    ${dots()}
    <div class="prompt" id="prompt">${prompt}</div>
    <section class="workbench" id="step" data-type="${current?.type || ''}" data-index="${step}">${content}</section>
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

const RENDERERS = {};
function renderStep() {
  if (!activeRecipe) return showHome();
  const current = currentStep();
  if (!current) return showHome();
  RENDERERS[current.type](current);
}

// ---------------------------------------------------------------- ท่าพื้นฐาน: ลาก/แตะของไปวาง
// รูปที่ลอยตามนิ้วอยู่บน body ไม่ใช่ใน #app — ถ้าจอเปลี่ยนหรือ pointerup หายไป (iPad) ต้องเก็บกวาดเอง
const DRAG_STALE_MS = 15000;
function removeGhosts(all = true) {
  document.querySelectorAll('.drag-ghost').forEach((ghost) => {
    if (all || Date.now() - Number(ghost.dataset.at || 0) > DRAG_STALE_MS) ghost.remove();
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
    if (active) {
      // นิ้วที่สอง (หรือฝ่ามือ) แตะซ้ำระหว่างลาก: ไม่เริ่มใหม่ ไม่งั้นรูปที่ลอยตามนิ้วแรกจะค้างอยู่บนจอ
      if (event.pointerId === active.pointerId || Date.now() - active.at < DRAG_STALE_MS) return;
      clear();
    }
    removeGhosts(false);
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
        const source = options.ghostSource?.() || button.querySelector('img') || button;
        const rect = source.getBoundingClientRect();
        const ghost = source.cloneNode(true);
        ghost.className = 'drag-ghost';
        ghost.removeAttribute('id');
        ghost.removeAttribute('role');
        ghost.removeAttribute('tabindex');
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghost.setAttribute('aria-hidden', 'true');
        ghost.dataset.at = active.at;
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

    active = { moved: false, ghost: null, move, up, cancel, pointerId, at: Date.now() };
    try { button.setPointerCapture?.(pointerId); } catch {}
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  });

  button.addEventListener('click', () => {
    if (!ignoreClick) options.onTap();
  });
}

const within = (element, x, y, padding = 20) => {
  const rect = element.getBoundingClientRect();
  return x >= rect.left - padding && x <= rect.right + padding && y >= rect.top - padding && y <= rect.bottom + padding;
};
const flash = (element, className, ms = 400) => {
  element.classList.add(className);
  setTimeout(() => element.isConnected && element.classList.remove(className), ms);
};
// กดค้าง: คืน promise เมื่อแถบเต็ม (ปล่อยแล้วแถบหยุด)
function holdMeter(element, meter, { seconds = 5, tone: freq = 430, loop = null, overhold = 0, onStart, onStop, onTick } = {}) {
  return new Promise((resolve) => {
    let progress = 0;
    let timer = null;
    let finished = false;
    let nextChime = 20;
    let stopLoop = () => {};
    let extra = 0;   // วินาทีที่ยังกดค้างหลังแถบเต็ม (ครัวอิสระ: นานไป = ไหม้)
    const done = (burnt) => {
      finished = true;
      clearInterval(timer);
      timer = null;
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      setTimeout(() => { stopLoop(); stopLoop = () => {}; }, 700);
      resolve({ burnt });
    };
    const stop = () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      if (finished) return;
      if (progress >= 100) return done(false);
      stopLoop();
      stopLoop = () => {};
      clearInterval(timer);
      timer = null;
      element.classList.remove('running', 'holding');
      onStop?.();
    };
    const start = (event) => {
      if (finished || timer) return;
      event?.preventDefault();
      element.classList.add('running', 'holding');
      tone(freq, .18);
      if (loop) stopLoop = startLoop(loop);
      onStart?.();
      window.addEventListener('pointerup', stop, { once: true });
      window.addEventListener('pointercancel', stop, { once: true });
      timer = setInterval(() => {
        progress = Math.min(100, progress + 100 / (seconds * 10));
        meter.style.width = `${progress}%`;
        onTick?.(progress);
        if (progress >= nextChime && progress < 100) {
          tone(400 + progress * 2, .08);
          nextChime += 20;
        }
        if (progress >= 100) {
          if (!overhold) return done(false);
          // แถบเต็มแล้วยังกดอยู่: ไหม้ถ้ากดต่ออีก overhold วินาที
          extra += .1;
          meter.parentElement.classList.add('over');
          if (extra >= overhold) done(true);
        }
      }, 100);
    };
    element.addEventListener('pointerdown', start);
    element.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) start(event);
    });
    element.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' || event.key === ' ') stop();
    });
  });
}
const meterHTML = () => '<div class="meter"><div class="meter-fill" id="meter"></div></div>';
const hintHTML = (motion = '') => `<span class="touch-hint ${motion}" aria-hidden="true">☝</span>`;
const holdHintHTML = () => `<span class="hold-hint" aria-hidden="true"><b>☝</b><span>${t('hold')}</span></span>`;

// ---------------------------------------------------------------- เวที (จาน/ถาด/ของที่กำลังทำ)
function toppingHTML(item) {
  return `<img class="topping" src="${toppingSrc(item.key)}" alt="" style="left:${item.x}%;top:${item.y}%">`;
}
function bitHTML(bit, extra = '', delay = 0) {
  return `<img class="bit ${extra}" src="${art(bit.art)}" alt="" style="left:${bit.x}%;top:${bit.y}%;width:${bit.size || 14}%;animation-delay:${delay}ms">`;
}
// เวที: รูปฐาน + สีที่ทา + ของโรย + ท็อปปิ้ง + รอยตัด + เทียน
function stageHTML({ base = stage.base, plate = false, id = 'dish', className = 'dish' } = {}) {
  return `<div class="${className} ${stage.tint ? `tint-${stage.tint}` : ''}" id="${id}" style="--mask:url('${absolute(base)}')">
    ${plate ? `<span class="food-color" id="food-color" style="background:${creation.color}"></span>` : ''}
    <img class="food-icon" src="${base}" alt="">
    <canvas class="frosting" aria-hidden="true"></canvas>
    ${stage.bits.map(bitHTML).join('')}
    ${creation.toppings.map(toppingHTML).join('')}
    ${Array.from({ length: stage.slices }, (_, i) => `<i class="slice-line" style="transform:translate(-50%,-50%) rotate(${i * 90 + 45}deg)"></i>`).join('')}
    ${stage.candles.map((candle) => `<span class="candle ${candle.lit ? 'lit' : ''} ${candle.out ? 'out' : ''}" data-candle style="left:${candle.x}%;top:${candle.y}%"><img src="${toppingSrc('candle')}" alt=""><i></i></span>`).join('')}
  </div>`;
}
// วาดสีที่ทาไว้ลง canvas ของเวทีที่เพิ่ง render (ขนาดตามจอ)
function syncPaint(element) {
  const canvas = element.querySelector('canvas.frosting');
  if (!canvas) return null;
  const rect = element.getBoundingClientRect();
  const scale = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(paint, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}
function clearPaint() {
  paint.getContext('2d').clearRect(0, 0, paint.width, paint.height);
}
const toStage = (element, event) => {
  const rect = element.getBoundingClientRect();
  return [((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100];
};
// ครีม/ซอสที่ลากด้วยนิ้ว: วาดลง paint (512) แล้วสะท้อนลง canvas บนจอ
function strokeTo(view, color, from, to, widthPct = 5.5) {
  const draw = (ctx, size) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = size * widthPct / 100;
    ctx.beginPath();
    ctx.moveTo(from[0] / 100 * size, from[1] / 100 * size);
    ctx.lineTo(to[0] / 100 * size, to[1] / 100 * size);
    ctx.stroke();
  };
  draw(paint.getContext('2d'), paint.width);
  if (view && view.canvas.isConnected) draw(view.ctx, view.canvas.width);
}
// ให้เด็กลากนิ้วบนเวทีเพื่อวาด/ทา; คืนฟังก์ชันที่บอกว่า click ล่าสุดเป็นปลายทางของการลากหรือไม่
function bindPainting(element, { color, onMove, onEnd, width }) {
  let stroke = null;
  let pointerId = null;
  let ignoreClick = false;
  let view = syncPaint(element);
  element.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerId = event.pointerId;
    stroke = { last: toStage(element, event), moved: false, startX: event.clientX, startY: event.clientY };
    try { element.setPointerCapture?.(pointerId); } catch {}
  });
  element.addEventListener('pointermove', (event) => {
    if (!stroke || event.pointerId !== pointerId) return;
    event.preventDefault();
    if (!stroke.moved && Math.hypot(event.clientX - stroke.startX, event.clientY - stroke.startY) < 6) return;
    if (!stroke.moved) {
      stroke.moved = true;
      element.classList.add('drawing');
      if (!view || !view.canvas.isConnected) view = syncPaint(element);
    }
    const point = toStage(element, event);
    strokeTo(view, typeof color === 'function' ? color() : color, stroke.last, point, width);
    onMove?.(stroke.last, point);
    stroke.last = point;
  });
  const end = (event) => {
    if (!stroke || event.pointerId !== pointerId) return;
    if (stroke.moved) {
      element.classList.remove('drawing');
      ignoreClick = true;
      setTimeout(() => { ignoreClick = false; }, 0);
      onEnd?.();
    }
    stroke = null;
    pointerId = null;
  };
  element.addEventListener('pointerup', end);
  element.addEventListener('pointercancel', end);
  return () => ignoreClick;
}
// สัดส่วนพื้นที่วงกลมกลางเวทีที่ถูกทาแล้ว (เช็กจาก paint แบบหยาบ)
function coverage() {
  const ctx = paint.getContext('2d');
  const size = 32;
  const data = ctx.getImageData(0, 0, paint.width, paint.height).data;
  const cell = paint.width / size;
  let inside = 0;
  let painted = 0;
  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      const dx = gx + .5 - size / 2;
      const dy = gy + .5 - size / 2;
      if (Math.hypot(dx, dy) > size * .32) continue;
      inside++;
      const index = ((Math.floor((gy + .5) * cell) * paint.width) + Math.floor((gx + .5) * cell)) * 4 + 3;
      if (data[index] > 40) painted++;
    }
  }
  return inside ? painted / inside : 0;
}

// ---------------------------------------------------------------- ขั้น: เตรียม (หั่น / ตอก)
RENDERERS.prep = (current) => {
  const queue = current.items;
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
      ${queue.map((id, i) => `<span class="queue-item ${i === 0 ? 'now' : ''}" data-queue="${id}" data-index="${i}"><img src="${ingredientSrc(id)}" alt=""></span>`).join('')}
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
    if (INGREDIENTS[queue[index]].prep === 'crack') SFX.crack(); else SFX.chop();
  };
  const finishItem = async () => {
    busy = true;
    const id = queue[index];
    img.src = preparedSrc(id);
    item.classList.add('prepared');
    app.querySelector(`.queue-item[data-index="${index}"]`)?.classList.add('done');
    SFX.plip();
    await speak(t(`${INGREDIENTS[id].prep}Done`));   // ชื่อของเพิ่งพูดไปตอนบอกโจทย์แล้ว ไม่ต้องซ้ำ
    index++;
    if (index >= queue.length) return next();
    hits = 0;
    const nextId = queue[index];
    img.src = ingredientSrc(nextId);
    item.classList.remove('prepared');
    item.setAttribute('aria-label', promptFor(nextId));
    app.querySelectorAll('.queue-item').forEach((element) => element.classList.toggle('now', Number(element.dataset.index) === index));
    setHint();
    promptElement.textContent = promptFor(nextId);
    speak(promptFor(nextId));
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
      flash(item, 'nudge');
      tone(300, .1);
    }
  });
};

// ---------------------------------------------------------------- ขั้น: ใส่ของ (ลงชาม / หม้อ / โถปั่น)
RENDERERS.add = (current) => {
  const intoAppliance = current.into.startsWith('appliance:');
  const applianceKey = intoAppliance ? current.into.split(':')[1] : null;
  const prompt = current.say ? local(current.say) : t('add');
  const targetHTML = intoAppliance
    ? `<div class="appliance ${applianceKind(applianceKey)} target" id="target" role="button" aria-label="${prompt}"><img class="machine" src="${art(current.into)}" alt=""></div>`
    : `<button class="bowl ready" id="target" aria-label="bowl"><img class="bowl-art" src="${art(current.into)}" alt=""></button>`;
  screen(`<div class="stage-zone">${targetHTML}</div>
    <div class="tray" id="ingredients">
      ${current.items.map((id, index) => `<button class="ingredient" data-index="${index}" aria-label="${local(INGREDIENTS[id])}"><img src="${preparedSrc(id)}" alt=""></button>`).join('')}
    </div>`, prompt);

  const target = app.querySelector('#target');
  let added = 0;
  let selected = null;
  const selectIngredient = (button) => {
    if (button.classList.contains('used')) return;
    selected?.classList.remove('selected');
    selected = button;
    selected.classList.add('selected');
    target.classList.add('awaiting-drop');
    tone(470);
  };
  const useIngredient = async (button) => {
    if (button.classList.contains('used')) return;
    button.classList.add('used');
    button.classList.remove('selected');
    if (selected === button) selected = null;
    target.classList.remove('awaiting-drop');
    flash(target, 'drop-target', 420);
    const id = current.items[Number(button.dataset.index)];
    const spot = intoAppliance ? '' : `style="left:${34 + (added % 3) * 16}%;top:${34 + Math.floor(added / 3) * 14}%"`;
    target.insertAdjacentHTML('beforeend', `<img class="in-bowl ${intoAppliance ? 'sink' : ''}" src="${preparedSrc(id)}" alt="" ${spot}>`);
    SFX.plip();
    tone(520 + added * 80);
    added++;
    const isLast = added === current.items.length;
    await speak(local(INGREDIENTS[id]));
    if (isLast) {
      target.classList.remove('ready');
      if (current.result) stage.base = art(current.result);
      await wait(300);
      next();
    }
  };
  app.querySelectorAll('.ingredient').forEach((button) => {
    bindDragChoice(button, {
      onTap: () => selectIngredient(button),
      isOverTarget: (x, y) => within(target, x, y, 54),
      onHover: (over) => target.classList.toggle('drop-target', over),
      onDrop: () => useIngredient(button),
      onMiss: () => flash(target, 'drop-miss', 380)
    });
  });
  target.addEventListener('click', () => {
    if (selected) useIngredient(selected);
  });
};

// ---------------------------------------------------------------- ขั้น: ผสม (ลากตามท่าของเครื่องมือ)
RENDERERS.mix = (current) => {
  const tool = TOOLS[current.tool];
  const motion = tool.motion;
  const prompt = `${local(current.action)} · ${t('mixHint')[motion]}`;
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:16px">
      <button class="mix-tool invite-tool motion-${motion}" id="mix" data-motion="${motion}" aria-label="${local(current.action)}">
        <span class="mix-fill art" id="mix-fill"><img class="fill-art" src="${art(current.fill)}" alt=""></span>
        <img class="mix-icon" id="mix-icon" src="${toolSrc(current.tool)}" alt="${local(tool)}">
        ${hintHTML()}
      </button>
      ${meterHTML()}
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
  let turned = 0;
  let moved = false;
  let ignoreClick = false;

  const finish = async () => {
    finished = true;
    button.disabled = true;
    button.classList.remove('mixing');
    icon.style.transform = '';
    tone(760, .22);
    if (current.result) {
      stage.base = art(current.result);
      fill.querySelector('.fill-art').src = stage.base;
      fill.style.transform = 'scale(1)';
    }
    await wait(700);
    await speak(t('mixed')[motion]);
    next();
  };
  const setProgress = (value) => {
    if (finished) return;
    progress = Math.min(100, value);
    meter.style.width = `${progress}%`;
    if (motion === 'roll') fill.style.transform = `scale(${.8 + progress / 100 * .35}, ${.8 - progress / 100 * .3})`;
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
    if (!last.swishAt || performance.now() - last.swishAt > 220) { SFX.swish(); last.swishAt = performance.now(); }
    let gain = 0;
    if (motion === 'stir') {
      const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x);
      let delta = angle - last.angle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      const fromCenter = Math.hypot(event.clientX - center.x, event.clientY - center.y);
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
  button.addEventListener('click', () => {
    if (ignoreClick || finished) return;
    button.classList.remove('tap-once');
    requestAnimationFrame(() => button.classList.add('tap-once'));
    setTimeout(() => button.classList.remove('tap-once'), 360);
    setProgress(progress + MIX_TAP_GAIN);
  });
};

// ---------------------------------------------------------------- ขั้น: ปรุง (กดเครื่องค้าง)
function applianceHTML(current, inner = '') {
  const kind = applianceKind(current.appliance);
  return `<div class="appliance ${kind}" id="appliance" data-appliance="${current.appliance}" role="button" tabindex="0" aria-label="${local(current.say || APPLIANCES[kind].cook)}">
      ${inner}
      <img class="machine" src="${art(`appliance:${current.appliance}`)}" alt="">
      <span class="fx fx-glow"></span>
      <span class="fx fx-steam"><i></i><i></i><i></i></span>
      <span class="fx fx-snow"><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <span class="fx fx-sparks"><i></i><i></i><i></i><i></i></span>
      ${holdHintHTML()}
    </div>`;
}
RENDERERS.cook = (current) => {
  const kind = applianceKind(current.appliance);
  const prompt = local(current.say || APPLIANCES[kind].cook);
  let inner = '';
  if (current.inside === 'stage') inner = stageHTML({ id: 'cooking-stage', className: 'cooking-food cooking-stage' });
  else if (current.inside) inner = `<img class="cooking-food" src="${art(current.inside)}" alt="">`;
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px">
      ${applianceHTML(current, inner)}
      ${meterHTML()}
    </div>`, prompt);
  const element = app.querySelector('#appliance');
  const cookingStage = app.querySelector('#cooking-stage');
  if (cookingStage) syncPaint(cookingStage);
  holdMeter(element, app.querySelector('#meter'), { seconds: current.seconds || 5, tone: APPLIANCES[kind].tone, loop: APPLIANCE_LOOP[kind] }).then(async () => {
    element.removeAttribute('tabindex');
    await wait(900);
    element.classList.remove('running', 'holding');
    element.classList.add('finished');
    SFX.ding();
    if (kind === 'toaster') SFX.clunk();
    if (current.result) {
      const resultSrc = art(current.result);
      if (current.result.startsWith('appliance:')) {
        element.querySelector('.machine').src = resultSrc;
      } else {
        stage.base = resultSrc;
        if (current.keep !== 'toppings') creation.toppings = [];
        stage.bits = [];
        clearPaint();
        const food = element.querySelector('.cooking-food');
        const img = document.createElement('img');
        img.className = 'cooking-food';
        img.src = resultSrc;
        img.alt = '';
        if (food) food.replaceWith(img); else element.prepend(img);
      }
    }
    await wait(500);
    await speak(local(current.done || APPLIANCES[kind].done));
    next();
  });
};

// ---------------------------------------------------------------- ขั้น: เท (กดค้างให้ภาชนะเอียง)
RENDERERS.pour = (current) => {
  const prompt = local(current.say);
  const intoAppliance = current.into.startsWith('appliance:');
  // สายที่เทอยู่ในเป้าหมาย (ตรงกลาง เหนือของที่รับ) ภาชนะที่เทเอียงจากด้านซ้ายบนลงมาหาสาย
  const stream = `<span class="stream" style="background:${current.color}"></span>`;
  const targetHTML = intoAppliance
    ? `<div class="appliance ${applianceKind(current.into.split(':')[1])} pour-target" id="pour-target">${stream}<img class="machine" src="${art(current.into)}" alt=""><img class="cooking-food pour-result" id="pour-result" src="" alt="" hidden></div>`
    : `<div class="pour-target plain" id="pour-target">${stream}<img class="target-art" id="pour-result" src="${art(current.into)}" alt=""></div>`;
  screen(`<div class="stage-zone pour-zone">
      <button class="pour-source" id="pour-source" aria-label="${prompt}">
        <img src="${art(current.from)}" alt="">
        ${holdHintHTML()}
      </button>
      ${targetHTML}
      ${meterHTML()}
    </div>`, prompt);
  const source = app.querySelector('#pour-source');
  const target = app.querySelector('#pour-target');
  const oilSheen = current.from === 'ing:oil';
  holdMeter(source, app.querySelector('#meter'), {
    seconds: current.seconds || 3, tone: 520, loop: 'pour',
    onStart: () => { source.classList.add('tilting'); target.classList.add('receiving'); },
    onStop: () => { source.classList.remove('tilting'); target.classList.remove('receiving'); },
    onTick: (progress) => { if (oilSheen) target.style.setProperty('--sheen', progress / 100); }
  }).then(async () => {
    source.classList.remove('tilting');
    source.classList.add('empty');
    target.classList.remove('receiving');
    tone(760, .22);
    if (current.result) {
      const result = app.querySelector('#pour-result');
      result.src = art(current.result);
      result.hidden = false;
      result.classList.add('pop');
      stage.base = art(current.result);
    }
    await wait(500);
    await speak(t('poured'));
    next();
  });
};

// ---------------------------------------------------------------- ขั้น: พลิก (ปาดนิ้วขึ้น)
RENDERERS.flip = (current) => {
  const prompt = local(current.say);
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px">
      ${applianceHTML(current, `<img class="cooking-food flip-food" id="flip-food" src="${art(current.before)}" alt="">`)}
      ${hintHTML('flip')}
    </div>`, prompt);
  const element = app.querySelector('#appliance');
  element.querySelector('.hold-hint')?.remove();
  const food = app.querySelector('#flip-food');
  let start = null;
  let done = false;
  element.addEventListener('pointerdown', (event) => {
    if (done) return;
    event.preventDefault();
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    try { element.setPointerCapture?.(start.id); } catch {}
  });
  element.addEventListener('pointermove', async (event) => {
    if (done || !start || event.pointerId !== start.id) return;
    event.preventDefault();
    if (start.y - event.clientY >= 60) {
      done = true;
      food.classList.add('flipping');
      SFX.whoosh();
      await wait(260);
      food.src = art(current.after);
      stage.base = art(current.after);
      await wait(320);
      tone(880, .2);
      await speak(t('flipped'));
      next();
    }
  });
  const release = () => { start = null; };
  element.addEventListener('pointerup', release);
  element.addEventListener('pointercancel', release);
  element.addEventListener('click', () => { if (!done) { flash(food, 'nudge'); tone(300, .1); } });
};

// ---------------------------------------------------------------- ขั้น: ตัก/ย้าย (ลากจาก → ไป N ครั้ง)
RENDERERS.move = (current) => {
  const prompt = local(current.say);
  const fromAppliance = current.from.startsWith('appliance:');
  const fromHTML = fromAppliance
    ? `<div class="appliance ${applianceKind(current.from.split(':')[1])} small move-from" id="move-from"><img class="machine" src="${art(current.from)}" alt=""></div>`
    : `<div class="move-from plain" id="move-from"><img class="target-art" src="${art(current.from)}" alt=""></div>`;
  screen(`<div class="stage-zone move-zone">
      ${fromHTML}
      <button class="carry" id="carry" aria-label="${prompt}"><img src="${art(current.tool || current.carry)}" alt="">${hintHTML('carry')}</button>
      <div class="move-to plain" id="move-to"><img class="target-art" id="move-to-art" src="${art(current.to)}" alt=""></div>
    </div>`, prompt);
  const carry = app.querySelector('#carry');
  const to = app.querySelector('#move-to');
  let count = 0;
  const stack = [[50, 40], [50, 22], [50, 6]];
  const drop = async () => {
    count++;
    SFX.plip();
    tone(600 + count * 80, .15);
    flash(to, 'drop-target', 420);
    if (count < current.count) {
      const [x, y] = stack[count - 1] || [50, 30];
      to.insertAdjacentHTML('beforeend', `<img class="piece" src="${art(current.carry)}" alt="" style="left:${x}%;top:${y}%">`);
      return;
    }
    carry.disabled = true;
    to.querySelectorAll('.piece').forEach((piece) => piece.remove());
    app.querySelector('#move-to-art').src = art(current.result);
    to.classList.add('pop');
    stage.base = art(current.result);
    tone(880, .25);
    await wait(500);
    await speak(t('moved'));
    next();
  };
  bindDragChoice(carry, {
    onTap: () => { to.classList.add('awaiting-drop'); tone(470); },
    isOverTarget: (x, y) => within(to, x, y, 30),
    onHover: (over) => to.classList.toggle('drop-target', over),
    onDrop: () => { to.classList.remove('awaiting-drop'); drop(); },
    onMiss: () => flash(to, 'drop-miss', 380)
  });
  to.addEventListener('click', () => {
    if (to.classList.contains('awaiting-drop') && !carry.disabled) { to.classList.remove('awaiting-drop'); drop(); }
  });
};

// ---------------------------------------------------------------- ขั้น: ลวก (กดค้าง ตะกร้อจุ่มลงหม้อ)
RENDERERS.dip = (current) => {
  const prompt = local(current.say);
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px">
      ${applianceHTML(current, `<img class="cooking-food dip-basket" id="dip-basket" src="${art(current.carry)}" alt="">`)}
      ${meterHTML()}
    </div>`, prompt);
  const element = app.querySelector('#appliance');
  const basket = app.querySelector('#dip-basket');
  holdMeter(element, app.querySelector('#meter'), {
    seconds: current.seconds || 3, tone: 300, loop: 'boil',
    onStart: () => basket.classList.add('down'),
    onStop: () => basket.classList.remove('down')
  }).then(async () => {
    element.classList.remove('running', 'holding');
    basket.classList.remove('down');
    basket.classList.add('lifted');
    tone(820, .25);
    await wait(500);
    await speak(t('dipped'));
    next();
  });
};

// ---------------------------------------------------------------- ขั้น: ทา (ถูนิ้วให้ทั่ว)
RENDERERS.spread = (current) => {
  const prompt = local(current.say);
  stage.base = art(current.base);
  let pen = current.pens[0];
  let color = current.swatches ? creation.color : PENS[pen].color;
  const showPens = current.pens.length > 1 || !current.swatches;
  screen(`<div class="stage-zone">${stageHTML()}</div>
    <div class="tray decorate-controls">
      ${current.swatches ? COLORS.map((swatch) => `<button class="swatch ${swatch === creation.color ? 'selected' : ''}" data-color="${swatch}" style="background:${swatch}" aria-label="color"></button>`).join('') : ''}
      ${showPens ? current.pens.map((key, i) => `<button class="topping-btn pen-btn ${i === 0 ? 'selected' : ''}" data-pen="${key}" aria-label="${local(PENS[key])}"><img src="${art(PENS[key].art)}" alt=""></button>`).join('') : ''}
      ${hintHTML('spread')}
    </div>`, prompt);
  const dish = app.querySelector('#dish');
  let done = false;
  const finish = async () => {
    done = true;
    tone(760, .22);
    if (current.result) {
      stage.base = art(current.result);
      dish.querySelector('.food-icon').src = stage.base;
      dish.style.setProperty('--mask', `url('${absolute(stage.base)}')`);
      clearPaint();
      syncPaint(dish);
      dish.classList.add('pop');
    }
    await wait(500);
    await speak(t('spreadDone'));
    next();
  };
  bindPainting(dish, {
    color: () => color,
    width: 9,
    onMove: () => { if (!done && coverage() >= (current.goal || .5)) finish(); }
  });
  app.querySelectorAll('.swatch').forEach((button) => {
    button.onclick = () => {
      creation.color = button.dataset.color;
      color = creation.color;
      tone(580);
      app.querySelectorAll('.swatch').forEach((swatch) => swatch.classList.toggle('selected', swatch === button));
    };
  });
  app.querySelectorAll('.pen-btn').forEach((button) => {
    button.onclick = () => {
      pen = button.dataset.pen;
      color = PENS[pen].color;
      tone(560);
      app.querySelectorAll('.pen-btn').forEach((item) => item.classList.toggle('selected', item === button));
      speak(local(PENS[pen]));
    };
  });
};

// ---------------------------------------------------------------- ขั้น: โรย (แตะที่ขูด/ขวดโรยของลงเวที)
RENDERERS.sprinkle = (current) => {
  const prompt = local(current.say);
  screen(`<div class="stage-zone"><div class="sprinkle-wrap">${stageHTML()}
      <button class="shaker" id="shaker" aria-label="${prompt}"><img src="${art(current.tool)}" alt="">${hintHTML('tap')}</button>
    </div></div>`, prompt);
  const dish = app.querySelector('#dish');
  syncPaint(dish);
  const shaker = app.querySelector('#shaker');
  let taps = 0;
  shaker.onclick = async () => {
    if (shaker.disabled) return;
    taps++;
    flash(shaker, 'shake', 300);
    SFX.tick(); setTimeout(SFX.tick, 60); setTimeout(SFX.tick, 130);
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 28;
      const bit = { art: current.item, x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius, size: 12 + Math.random() * 6 };
      stage.bits.push(bit);
      dish.insertAdjacentHTML('beforeend', bitHTML(bit, 'fall', i * 70));
    }
    if (taps >= current.count) {
      shaker.disabled = true;
      await wait(400);
      await speak(t('sprinkled'));
      next();
    }
  };
};

// ---------------------------------------------------------------- ขั้น: ปั้นวางถาด (แตะบนถาด N ครั้ง)
RENDERERS.shape = (current) => {
  const prompt = local(current.say);
  stage.base = art(current.tray);
  stage.bits = [];
  screen(`<div class="stage-zone">${stageHTML({ className: 'dish tray-stage' })}${hintHTML('tap')}</div>
    <div class="tray"><span class="count-badge" id="count">0 / ${current.count}</span></div>`, prompt);
  const dish = app.querySelector('#dish');
  const badge = app.querySelector('#count');
  dish.addEventListener('click', async (event) => {
    if (stage.bits.length >= current.count) return;
    const [x, y] = toStage(dish, event);
    const bit = { art: current.piece, x: Math.max(14, Math.min(86, x)), y: Math.max(18, Math.min(82, y)), size: 22 };
    stage.bits.push(bit);
    dish.insertAdjacentHTML('beforeend', bitHTML(bit));
    SFX.plip();
    badge.textContent = `${stage.bits.length} / ${current.count}`;
    if (stage.bits.length >= current.count) {
      await wait(400);
      await speak(t('shaped'));
      next();
    }
  });
};

// ---------------------------------------------------------------- ขั้น: ปิดฝา (ลากฝาไปวางบนโถ)
RENDERERS.lid = (current) => {
  const prompt = local(current.say);
  const kind = applianceKind(current.target.split(':')[1]);
  screen(`<div class="stage-zone lid-zone">
      <div class="appliance ${kind}" id="lid-target"><img class="machine" src="${art(current.target)}" alt=""></div>
      <button class="carry lid" id="lid" aria-label="${prompt}"><img src="${art(current.lid)}" alt="">${hintHTML('carry')}</button>
    </div>`, prompt);
  const lid = app.querySelector('#lid');
  const target = app.querySelector('#lid-target');
  let done = false;
  const place = async () => {
    if (done) return;
    done = true;
    lid.disabled = true;
    lid.classList.add('used');
    target.querySelector('.machine').src = art(current.result);
    flash(target, 'pop', 500);
    SFX.clunk();
    await wait(400);
    await speak(t('lidOn'));
    next();
  };
  bindDragChoice(lid, {
    onTap: () => { target.classList.add('awaiting-drop'); tone(470); },
    isOverTarget: (x, y) => within(target, x, y, 40),
    onHover: (over) => target.classList.toggle('drop-target', over),
    onDrop: place,
    onMiss: () => flash(target, 'drop-miss', 380)
  });
  target.addEventListener('click', () => { if (target.classList.contains('awaiting-drop')) place(); });
};

// ---------------------------------------------------------------- ขั้น: ตัด (ปาดนิ้วผ่านเวที)
RENDERERS.slice = (current) => {
  const prompt = local(current.say);
  screen(`<div class="stage-zone">${stageHTML()}${hintHTML('cut')}</div>`, prompt);
  const dish = app.querySelector('#dish');
  syncPaint(dish);
  let start = null;
  let done = false;
  dish.addEventListener('pointerdown', (event) => {
    if (done) return;
    event.preventDefault();
    start = { id: event.pointerId, x: event.clientX, y: event.clientY, cut: false };
    try { dish.setPointerCapture?.(start.id); } catch {}
  });
  dish.addEventListener('pointermove', async (event) => {
    if (done || !start || start.cut || event.pointerId !== start.id) return;
    event.preventDefault();
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 70) {
      start.cut = true;
      stage.slices++;
      dish.insertAdjacentHTML('beforeend', `<i class="slice-line" style="transform:translate(-50%,-50%) rotate(${(stage.slices - 1) * 90 + 45}deg)"></i>`);
      SFX.chop();
      if (stage.slices >= current.count) {
        done = true;
        await wait(400);
        await speak(t('sliced'));
        next();
      }
    }
  });
  const release = () => { start = null; };
  dish.addEventListener('pointerup', release);
  dish.addEventListener('pointercancel', release);
};

// ---------------------------------------------------------------- ขั้น: เทียน (ปัก → จุด → เป่า)
RENDERERS.candles = (current) => {
  stage.candles = [];
  screen(`<div class="stage-zone">${stageHTML({ plate: true })}${hintHTML('tap')}</div>
    <div class="tray"><span class="count-badge" id="count">🕯️ 0 / ${current.count}</span></div>`, t('candlePlace'));
  const dish = app.querySelector('#dish');
  syncPaint(dish);
  const badge = app.querySelector('#count');
  const promptElement = app.querySelector('#prompt');
  const hint = app.querySelector('.touch-hint');
  let phase = 'place';
  let start = null;
  const setPhase = (name, text) => {
    phase = name;
    dish.dataset.phase = name;
    promptElement.textContent = text;
    speak(text);
  };
  dish.dataset.phase = phase;
  dish.addEventListener('click', async (event) => {
    if (phase === 'place') {
      if (event.target.closest('[data-candle]')) return;
      const [x, y] = toStage(dish, event);
      const candle = { x: Math.max(22, Math.min(78, x)), y: Math.max(18, Math.min(60, y)), lit: false };
      stage.candles.push(candle);
      dish.insertAdjacentHTML('beforeend', `<span class="candle" data-candle data-index="${stage.candles.length - 1}" style="left:${candle.x}%;top:${candle.y}%"><img src="${toppingSrc('candle')}" alt=""><i></i></span>`);
      tone(600 + stage.candles.length * 70, .12);
      badge.textContent = `🕯️ ${stage.candles.length} / ${current.count}`;
      if (stage.candles.length >= current.count) {
        await wait(300);
        hint.className = 'touch-hint tap';
        setPhase('light', t('candleLight'));
      }
    } else if (phase === 'light') {
      const element = event.target.closest('[data-candle]');
      if (!element || element.classList.contains('lit')) return;
      element.classList.add('lit');
      stage.candles[Number(element.dataset.index)].lit = true;
      SFX.tick();
      chirp(1200, 1800, { gain: .04, length: .12 });
      if (stage.candles.every((candle) => candle.lit)) {
        await wait(300);
        hint.className = 'touch-hint blow';
        setPhase('blow', t('candleBlow'));
      }
    }
  });
  dish.addEventListener('pointerdown', (event) => {
    if (phase !== 'blow') return;
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    try { dish.setPointerCapture?.(start.id); } catch {}
  });
  dish.addEventListener('pointermove', async (event) => {
    if (phase !== 'blow' || !start || event.pointerId !== start.id) return;
    event.preventDefault();
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 70) {
      phase = 'done';
      dish.dataset.phase = phase;
      dish.querySelectorAll('[data-candle]').forEach((element) => { element.classList.remove('lit'); element.classList.add('out'); });
      stage.candles.forEach((candle) => { candle.lit = false; candle.out = true; });
      SFX.whoosh();
      confetti();
      setTimeout(SFX.birthday, 300);
      await speak(t('birthday'));
      next();
    }
  });
  const release = () => { start = null; };
  dish.addEventListener('pointerup', release);
  dish.addEventListener('pointercancel', release);
};

// ---------------------------------------------------------------- ครัวอิสระ: ใส่อะไรก็ได้ลงชาม
RENDERERS.freeadd = (current) => {
  const prompt = local(current.say);
  stage.free = [];
  screen(`<div class="stage-zone"><div class="bowl ready" id="target" aria-hidden="true"><img class="bowl-art" src="${art('dish:bowl')}" alt=""></div></div>
    <div class="tray scroll-x free-tray" id="ingredients">
      ${FREE_INGREDIENTS.map((id) => `<button class="ingredient tap-only" data-id="${id}" aria-label="${local(INGREDIENTS[id])}"><img src="${preparedSrc(id)}" alt=""></button>`).join('')}
    </div>
    <div class="finish-actions"><button class="action-btn primary" id="done" disabled>✓ ${t('done')}</button></div>`, prompt);
  const target = app.querySelector('#target');
  const done = app.querySelector('#done');
  const add = (id) => {
    stage.free.push(id);
    flash(target, 'drop-target', 420);
    const n = stage.free.length - 1;
    target.insertAdjacentHTML('beforeend', `<img class="in-bowl" src="${preparedSrc(id)}" alt="" style="left:${30 + (n % 4) * 13}%;top:${30 + Math.floor(n / 4) % 3 * 12}%">`);
    SFX.plip();
    tone(520 + (n % 6) * 60);
    speak(local(INGREDIENTS[id]));
    done.disabled = false;
    if (stage.free.length >= 3) target.classList.remove('ready');
  };
  // แตะ = ของลอยจากถาดลงชาม · ลากขึ้นไปวางในชามก็ได้ · ปาดซ้ายขวา = เลื่อนถาด (touch-action: pan-x ให้เบราว์เซอร์จัดการ)
  app.querySelectorAll('.ingredient').forEach((button) => {
    const fly = () => {
      const id = button.dataset.id;
      const from = button.querySelector('img').getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const flyer = document.createElement('img');
      flyer.className = 'flyer';
      flyer.src = preparedSrc(id);
      flyer.style.left = `${from.left + from.width / 2}px`;
      flyer.style.top = `${from.top + from.height / 2}px`;
      flyer.style.width = `${from.width}px`;
      document.body.appendChild(flyer);
      requestAnimationFrame(() => {
        flyer.style.transform = `translate(-50%, -50%) translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + to.height * .45 - from.top - from.height / 2}px) scale(.9)`;
      });
      flash(button, 'tapped', 300);
      SFX.swish();
      setTimeout(() => { flyer.remove(); add(id); }, 420);
    };
    bindDragChoice(button, {
      onTap: fly,
      isOverTarget: (x, y) => within(target, x, y, 54),
      onHover: (over) => target.classList.toggle('drop-target', over),
      onDrop: () => add(button.dataset.id),
      onMiss: () => flash(target, 'drop-miss', 380)
    });
  });
  done.onclick = () => { if (stage.free.length) next(); };
};

// ครัวอิสระ: เลือกเครื่อง แล้วกดค้าง → จานลึกลับ (ภาชนะตามเครื่อง + ของที่ใส่ + สีตามวิธีปรุง)
RENDERERS.freecook = (current) => {
  const prompt = local(current.say);
  const kinds = Object.keys(APPLIANCES);
  const applianceKey = (kind) => (kind === 'blender' ? 'blender-open' : kind);
  screen(`<div class="stage-zone" style="display:flex;flex-direction:column;gap:18px" id="free-stage">
      <div class="tray machine-tray" id="machines">
        ${kinds.map((kind) => `<button class="machine-btn" data-kind="${kind}" aria-label="${kind}"><img src="${art(`appliance:${applianceKey(kind)}`)}" alt=""></button>`).join('')}
      </div>
    </div>`, prompt);
  const stageZone = app.querySelector('#free-stage');
  app.querySelectorAll('.machine-btn').forEach((button) => {
    button.onclick = () => {
      const kind = button.dataset.kind;
      tone(620);
      const inner = `<span class="cooking-food free-inside">${stage.free.map((id, i) => `<img src="${preparedSrc(id)}" alt="" style="left:${30 + (i % 3) * 20}%;top:${30 + Math.floor(i / 3) % 3 * 20}%">`).join('')}</span>`;
      stageZone.innerHTML = `${applianceHTML({ appliance: applianceKey(kind), say: { th: COPY.th.pickMachine, en: COPY.en.pickMachine } }, inner)}${meterHTML()}`;
      app.querySelector('#prompt').textContent = t('pickMachine');
      speak(t('pickMachine'));
      const element = app.querySelector('#appliance');
      const canBurn = ['oven', 'pan', 'toaster'].includes(kind);
      holdMeter(element, app.querySelector('#meter'), { seconds: 4, tone: APPLIANCES[kind].tone, loop: APPLIANCE_LOOP[kind], overhold: canBurn ? 2.5 : 0 }).then(async ({ burnt }) => {
        element.removeAttribute('tabindex');
        await wait(600);
        element.classList.remove('running', 'holding');
        element.classList.add('finished');
        if (burnt) { element.classList.add('burnt'); SFX.achoo(); } else SFX.ding();
        // จานลึกลับ: อาหารจริงตามเครื่อง × หวาน/คาว × สี (ไม่วางวัตถุดิบบนอาหาร — เด็กไปแต่งหน้าเองในขั้นถัดไป)
        const traits = { ...freeTraits(stage.free), burnt };
        stage.base = art(freeResultArt(kind, traits));
        stage.tint = burnt ? 'burnt' : null;
        stage.bits = [];
        creation.free = { items: [...stage.free], machine: kind, taste: traits.taste, color: traits.color, burnt };
        await wait(400);
        confetti();
        await speak(burnt ? t('burnt') : t('mystery'));
        next();
      });
    };
  });
};

// ---------------------------------------------------------------- ขั้น: ตกแต่ง (ท็อปปิ้ง + วาดครีม/บีบซอส)
RENDERERS.decorate = (current) => {
  const recipe = RECIPES[activeRecipe];
  if (current.base) stage.base = art(current.base);
  const pens = current.pens || [];
  // ลากนิ้ววาดได้เฉพาะเมื่อมีซอส/ปากกาให้ทา (ไข่เจียว) — ขั้นตกแต่งทั่วไปแค่วางท็อปปิ้งกับเลือกสีจาน
  const drawing = pens.length > 0 && !current.before && !current.nodraw;
  const prompt = current.say ? local(current.say) : drawing ? `${t('decorate')} · ${t('draw')}` : t('decorate');
  let pen = pens[0] || null;
  const swatchesHTML = pens.length ? pens.map((key, i) => `<button class="topping-btn pen-btn ${i === 0 ? 'selected' : ''}" data-pen="${key}" aria-label="${local(PENS[key])}"><img src="${art(PENS[key].art)}" alt=""></button>`).join('')
    : current.before ? '' : COLORS.map((color) => `<button class="swatch ${color === creation.color ? 'selected' : ''}" data-color="${color}" style="background:${color}" aria-label="color"></button>`).join('');
  const toppingsHTML = recipe.toppings.map((key) => `<button class="topping-btn" data-top="${key}" aria-label="topping"><img src="${toppingSrc(key)}" alt=""></button>`).join('');
  const controls = current.scroll
    ? `<div class="tray decorate-controls">${swatchesHTML}<button class="action-btn primary" id="done">✓ ${t('done')}</button></div>
       <div class="tray scroll-x topping-scroll">${toppingsHTML}</div>`
    : `<div class="tray decorate-controls">${swatchesHTML}${toppingsHTML}<button class="action-btn primary" id="done">✓ ${t('done')}</button></div>`;
  screen(`<div class="stage-zone">${stageHTML({ plate: !current.before })}</div>${controls}`, prompt);
  const dish = app.querySelector('#dish');
  const promptElement = app.querySelector('#prompt');
  let selectedTop = null;
  const isDrawing = drawing ? bindPainting(dish, { color: () => PENS[pen].color, width: 5.5 }) : (() => { syncPaint(dish); return () => false; })();
  const selectTopping = (button) => {
    selectedTop = button.dataset.top;
    app.querySelectorAll('.topping-btn').forEach((item) => item.classList.toggle('selected', item === button));
    dish.classList.add('awaiting-drop');
    promptElement.innerHTML = `<img class="prompt-icon" src="${toppingSrc(selectedTop)}" alt=""> ${t('place')}`;
    tone(560);
  };
  const placeTopping = (key, clientX, clientY) => {
    if (creation.toppings.length >= MAX_TOPPINGS) {
      creation.toppings.shift();
      dish.querySelector('.topping')?.remove();
    }
    const rect = dish.getBoundingClientRect();
    const x = Math.max(15, Math.min(80, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(15, Math.min(80, ((clientY - rect.top) / rect.height) * 100));
    const item = { key, x, y };
    creation.toppings.push(item);
    dish.insertAdjacentHTML('beforeend', toppingHTML(item));
    SFX.plip();
  };
  app.querySelectorAll('.swatch').forEach((button) => {
    button.onclick = () => {
      creation.color = button.dataset.color;
      tone(580);
      const plate = app.querySelector('#food-color');
      if (plate) plate.style.background = creation.color;
      app.querySelectorAll('.swatch').forEach((swatch) => swatch.classList.toggle('selected', swatch === button));
    };
  });
  app.querySelectorAll('.pen-btn').forEach((button) => {
    button.onclick = () => {
      pen = button.dataset.pen;
      tone(560);
      app.querySelectorAll('.pen-btn').forEach((item) => item.classList.toggle('selected', item === button));
      speak(local(PENS[pen]));
    };
  });
  app.querySelectorAll('.topping-btn:not(.pen-btn)').forEach((button) => {
    bindDragChoice(button, {
      onTap: () => selectTopping(button),
      isOverTarget: (x, y) => within(dish, x, y, 20),
      onHover: (over) => dish.classList.toggle('drop-target', over),
      onDrop: (x, y) => placeTopping(button.dataset.top, x, y),
      onMiss: () => flash(dish, 'drop-miss', 380)
    });
  });
  dish.addEventListener('click', (event) => {
    if (isDrawing()) return;
    if (selectedTop) placeTopping(selectedTop, event.clientX, event.clientY);
  });
  app.querySelector('#done').onclick = async () => {
    await speak(COPY[state.lang].praise[Math.floor(Math.random() * COPY[state.lang].praise.length)]);
    next();
  };
};

// ---------------------------------------------------------------- เสิร์ฟ
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

// ปฏิกิริยา: ของที่ไม่ชอบ/ไหม้ → อี๋ · พริก → จาม · ของโปรด/เมนูโปรด → ชอบสุดๆ · เยอะเกิน → อิ่มแปล้ · ที่เหลือ → อร่อย
function reactionFor(friendId) {
  const friend = FRIENDS[friendId];
  const keys = [...creation.toppings.map((item) => item.key), ...(creation.free?.items || [])];
  if (creation.free?.burnt || keys.some((key) => friend.hates.includes(key))) return 'yuck';
  if (keys.some((key) => SNEEZE_TOPPINGS.includes(key))) return 'sneeze';
  if (keys.some((key) => friend.loves.includes(key)) || (!creation.free && friend.likes.includes(activeRecipe))) return 'love';
  if (keys.length >= FULL_TOPPINGS) return 'full';
  return 'yum';
}
// ป้ายเล็กใต้เพื่อน: ของที่ชอบ ❤ กับของที่ไม่ชอบ ✖ (เด็กจะได้รู้ว่าให้อะไรแล้วเพื่อนจะทำหน้ายังไง)
function prefsHTML(id) {
  const friend = FRIENDS[id];
  return `<span class="prefs" aria-hidden="true"><i class="love"><img src="${thingSrc(friend.loves[0])}" alt=""></i><i class="hate"><img src="${thingSrc(friend.hates[0])}" alt=""></i></span>`;
}
function prefsSpeech(id) {
  const friend = FRIENDS[id];
  return `${local(friend.name)} ${t('likesWord')} ${friend.loves.map(thingName).join(` ${t('and')} `)} ${t('hatesWord')} ${friend.hates.slice(0, 2).map(thingName).join(` ${t('and')} `)}`;
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

// ทำอาหารไปเติมร้าน: จบแล้วเอาขึ้นชั้นขาย แทนหน้าป้อนเพื่อน (ขั้นตอนทำอาหารเหมือนเดิมทุกอย่าง)
let stockSavedFor = null;
async function finishForStock() {
  const recipe = activeRecipe;
  const { restockId } = session;
  let result;
  try { result = (await loadShop()).restock(recipe, restockId); } catch { return showHome(); }
  if (activeRecipe !== recipe) return;
  const prompt = result.added ? `${t('gotStock')} ${local(RECIPES[recipe].name)} ${result.added} ${t('piece')}`.trim() : t('shelfFull');
  screen(`<div class="stage-zone stock-zone">
      ${stageHTML({ plate: true })}
      <div class="stock-batch" aria-hidden="true">${Array.from({ length: result.added }, (_, i) => `<img src="${dishSrc(recipe)}" alt="" style="--i:${i}">`).join('')}</div>
      <button class="action-btn primary" id="to-shop" hidden>🏪 ${t('toShop')}</button>
    </div>`, prompt);
  const dish = app.querySelector('#dish');
  syncPaint(dish);
  const toShop = app.querySelector('#to-shop');
  toShop.onclick = () => { tone(620); openShop(); };
  // เก็บรูปลงสมุดผลงานครั้งเดียว (ไม่นับเป็นการป้อนเพื่อน)
  if (stockSavedFor !== creation) {
    stockSavedFor = creation;
    await Promise.all([...dish.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((resolve) => { img.onload = img.onerror = resolve; }))));
    state.gallery.unshift({ ...creation, friends: [], photo: snapshot(dish) });
    state.gallery = state.gallery.slice(0, GALLERY_MAX);
    state.made++;
    saveState();
  }
  // ปุ่มไปร้านโผล่หลังเสียง "ได้ … ชิ้น" และ "เอาไปวางขายที่ร้านกัน" จบ
  await speak(t('toShop'));
  if (app.contains(toShop)) toShop.hidden = false;
}

RENDERERS.serve = () => {
  if (session?.destination === 'stock') return finishForStock();
  const prompt = t('serve');
  const order = ensureOrder();
  const diners = pickDiners();
  screen(`<div class="stage-zone serve-zone">
      <div class="serve-layout">${stageHTML({ plate: true })}<div class="customer-grid">
        ${diners.map((id) => `<button class="friend-btn" data-friend="${id}" aria-label="${prefsSpeech(id)}">
          <img class="portrait" src="${friendSrc(id)}" alt="${local(FRIENDS[id].name)}">${id === order.friend ? orderBubbleHTML(order) : ''}${prefsHTML(id)}
        </button>`).join('')}
      </div></div>
    </div>
    <div class="finish-actions" id="finish-actions" hidden>
      <button class="action-btn primary" id="again">↻ ${t('again')}</button>
      <button class="action-btn" id="home">⌂ ${t('home')}</button>
    </div>`, prompt);
  const dish = app.querySelector('#dish');
  syncPaint(dish);
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

  // ปล่อยใกล้ๆ เพื่อนคนไหน (ยังไม่ได้กิน) ก็นับให้คนนั้น — ไม่ต้องวางตรงเป๊ะ
  const friendAt = (x, y) => {
    const free = friendButtons.filter((button) => !button.classList.contains('fed'));
    hoveredFriend = free.find((button) => within(button, x, y, 40)) || null;
    if (!hoveredFriend) {
      const grid = app.querySelector('.customer-grid');
      if (grid && within(grid, x, y, 30) && free.length) {
        hoveredFriend = free.reduce((best, button) => {
          const r = button.getBoundingClientRect();
          const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
          return !best || d < best.d ? { button, d } : best;
        }, null).button;
      }
    }
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
    await wait(720);
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
    ({ love: SFX.giggle, yum: SFX.yum, sneeze: SFX.achoo, full: SFX.snore, yuck: SFX.yuck })[reaction]?.();
    await speak(local(info));
    await wait(400);
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
      state.gallery.unshift({ ...creation, friends: [...creation.friends], photo: snapshot(dish) });
      state.made++;
      gallerySaved = true;
    } else {
      state.gallery[0] = { ...state.gallery[0], ...creation, friends: [...creation.friends] };
    }
    state.gallery = state.gallery.slice(0, GALLERY_MAX);
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

  bindDragChoice(dish, {
    ghostSource: () => food,
    onTap: () => {
      dish.classList.add('awaiting-drop');
      tone(520);
    },
    isOverTarget: friendAt,
    onHover: (over) => friendButtons.forEach((button) => button.classList.toggle('feed-target', over && button === hoveredFriend)),
    getDropData: () => hoveredFriend,
    onDrop: (x, y, friend) => friend && feedFriend(friend),
    onMiss: () => flash(dish, 'drop-miss', 380)
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
};

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
// กันซูม: pinch สองนิ้ว (gesture* + touch ที่มีมากกว่า 1 นิ้ว) — เด็กเล่นแล้วจอไม่ขยายเอง
['gesturestart', 'gesturechange', 'gestureend'].forEach((name) => document.addEventListener(name, (event) => event.preventDefault(), { passive: false }));
document.addEventListener('touchstart', (event) => {
  if (event.touches.length > 1) event.preventDefault();
}, { passive: false });
// แตะรัวสองครั้ง = Safari ซูม (double-tap zoom) → ยกเลิก default ของแตะที่สอง แล้วยิง click ให้เองปุ่มจะได้ยังติด
let lastTap = { at: 0, x: 0, y: 0 };
document.addEventListener('touchend', (event) => {
  if (event.touches.length) return;
  const touch = event.changedTouches[0];
  const now = Date.now();
  const quick = now - lastTap.at < 350 && Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 40;
  lastTap = { at: now, x: touch.clientX, y: touch.clientY };
  if (!quick || event.cancelable === false) return;
  event.preventDefault();
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  target?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: touch.clientX, clientY: touch.clientY }));
}, { passive: false });
// iOS Safari เด้งหน้าขึ้นลงตอนลาก (rubber band) — กันไว้ ยกเว้นตอนเนื้อหาล้นจอจริงๆ ให้เลื่อนได้
document.addEventListener('touchmove', (event) => {
  if (event.touches.length > 1) { event.preventDefault(); return; }
  if (event.target.closest?.('.scroll-x')) return;
  if (app.scrollHeight <= app.clientHeight + 1) event.preventDefault();
}, { passive: false });
// ถ้าเผลอซูมไปแล้ว ดึงกลับเป็น 1 เท่าเมื่อปล่อยนิ้ว (Safari ให้ตั้ง scale ผ่าน visualViewport ไม่ได้ตรงๆ เลยรีเซ็ตด้วยการโฟกัสหน้า)
window.visualViewport?.addEventListener('resize', () => {
  if (window.visualViewport.scale > 1.02) document.documentElement.classList.add('zoomed'); else document.documentElement.classList.remove('zoomed');
});
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) selection.removeAllRanges();
});
if (launchMode === 'restaurant') openShop(); else showHome();

// อัปเดตเกม: เช็กเวอร์ชันใหม่ทุกครั้งที่เปิด และพอตัวใหม่พร้อมก็โหลดหน้าใหม่ให้เองตอนอยู่หน้าครัว (ไม่ขัดจังหวะตอนกำลังทำอาหาร)
if ('serviceWorker' in navigator) {
  let reloadWhenIdle = false;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((registration) => registration.update().catch(() => {})).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!navigator.serviceWorker.controller) return;   // ครั้งแรกที่ติดตั้ง ไม่ต้องโหลดใหม่
    if (activeRecipe || app.querySelector('.shop')) reloadWhenIdle = true; else location.reload();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && reloadWhenIdle && !activeRecipe && !app.querySelector('.shop')) location.reload();
  });
  const originalShowHome = showHome;
  showHome = () => { if (reloadWhenIdle) { location.reload(); return; } originalShowHome(); };
}
