# Prompt สำหรับสร้างรูปอาหาร/อุปกรณ์ครัวด้วย Gemini

> **สถานะ: ทำครบแล้ว (2026-09-17)** — A/B ได้เป็นรูปเดี่ยว 14 รูป ส่วน B6 + C/D/E Gemini วาดรวมมาเป็นแผ่นเดียว (`sheet-all.jpg`, 1408×768)
> แยกด้วย `python design/blobs.py assets/incoming/sheet-all.jpg <ชื่อ 49 ชิ้นตามลำดับ>` แล้ว `python design/cutout.py` ใส่เข้าเกมแล้ว
> ชิ้นที่เล็กไปหน่อยเพราะมาจากแผ่นรวม: เครื่องปั่น (349px) — ถ้าอยากคมขึ้นค่อยขอ B6 เป็นรูปเดี่ยวแล้วเซฟทับ `appliance-blender.jpg`
> ใช้ไฟล์นี้เป็นแม่แบบเวลาเพิ่มเมนูใหม่: เพิ่มหัวข้อ A/B/C/E ตามแบบ แล้วตั้งชื่อไฟล์ให้ตรง key ใน `js/app.js`

ชุดนี้ทำรูปประกอบให้ "ครัวจิ๋วแสนสนุก" ทั้งเกม — เมนูใหม่ 6 เมนู + เมนูเดิม 3 เมนู
(เมนูเดิมตอนนี้เป็น emoji ถ้าทำรูปเฉพาะเมนูใหม่จะดูไม่เข้ากัน เลยขอทำทั้ง 9 เมนูให้เป็นสไตล์เดียวกันทีเดียว)

---

## แผนเมนูทั้งหมด 9 เมนู (3 × 3 บนหน้าครัว)

ทุกเมนูเล่น 5 ขั้นเหมือนเดิม: **ใส่วัตถุดิบ 3 อย่าง → ผสม (แตะเครื่องมือ) → ปรุง (กดเครื่องค้าง) → ตกแต่ง → ป้อนเพื่อน**

| # | เมนู | วัตถุดิบ 3 อย่าง | ผสมด้วย | ปรุงด้วย (กดค้าง) | ท็อปปิ้งตกแต่ง |
|---|---|---|---|---|---|
| 1 | 🧁 คัพเค้ก *(เดิม)* | แป้ง ไข่ นม | ช้อนไม้ คน | เตาอบ | ชุดหวาน |
| 2 | 🍕 พิซซ่า *(เดิม)* | แป้งโด มะเขือเทศ ชีส | ช้อนไม้ เกลี่ยซอส | เตาอบ | ชุดคาว (เห็ด ข้าวโพด สับปะรด …) |
| 3 | 🥤 สมูทตี *(เดิม)* | สตรอว์เบอร์รี กล้วย นม | — (ปั่นในเครื่อง) | เครื่องปั่น | ชุดหวาน (วิปครีม เชอร์รี …) |
| 4 | 🍳 ไข่เจียว **ใหม่** | ไข่ ต้นหอม มะเขือเทศ | ตะกร้อ ตีไข่ | **กระทะบนเตา** | ชุดคาว (ซอสหัวใจ ต้นหอม ข้าวโพด …) |
| 5 | 🍜 ก๋วยเตี๋ยว **ใหม่** | เส้น ผักกวางตุ้ง ลูกชิ้นปลา | ทัพพี คน | **หม้อบนเตา** | ชุดคาว (ไข่ต้ม ต้นหอม ผักชี …) |
| 6 | 🍪 คุกกี้ **ใหม่** | แป้ง เนย ช็อกโกแลตชิป | ไม้นวดแป้ง คลึง | เตาอบ | ชุดหวาน (ช็อกชิป ดาว หัวใจ …) |
| 7 | 🍦 ไอศกรีม **ใหม่** | นม สตรอว์เบอร์รี น้ำตาล | ตะกร้อ คน | **ตู้แช่แข็ง** | ชุดหวาน (เชอร์รี เวเฟอร์ …) |
| 8 | 🍞 ขนมปังปิ้ง **ใหม่** | ขนมปัง เนย น้ำผึ้ง | มีดทาเนย ทา | **เครื่องปิ้งขนมปัง** (เด้งขึ้น!) | ชุดหวาน (กล้วย บลูเบอร์รี ช็อกชิปทำหน้ายิ้ม) |
| 9 | 🎂 เค้กวันเกิด **ใหม่** | แป้ง ไข่ น้ำตาล | ตะกร้อ ตี | เตาอบ | ชุดหวาน (เทียน วิปครีม สตรอว์เบอร์รี) |

เครื่องปรุงใหม่ 4 อย่าง (กระทะ หม้อ ตู้แช่แข็ง เครื่องปิ้ง) + เครื่องมือใหม่ 4 อย่าง (ตะกร้อ ทัพพี ไม้นวด มีดทาเนย) — ทำให้แต่ละเมนูให้ความรู้สึกต่างกัน
ท็อปปิ้งแยกเป็น 2 ชุด (หวาน/คาว) ใช้ร่วมกันหลายเมนู จะได้ไม่ต้องวาดเยอะ

**อยากเปลี่ยนเมนูไหน บอกได้เลย** ตัวเลือกสำรองที่คิดไว้: ข้าวผัด, ป๊อปคอร์น (หม้อเขย่า), โกโก้ร้อน, โดนัท, ข้าวปั้น

---

## รูปที่ต้องสร้าง — รวม 20 รูป

| กลุ่ม | จำนวน | วิธี | ขนาดที่ใช้ในเกม |
|---|---|---|---|
| A. อาหารเสร็จแล้ว (ยังไม่ตกแต่ง) | 9 รูป | รูปละ 1 prompt | ใหญ่สุด ~160 px |
| B. เครื่องปรุง | 6 รูป | รูปละ 1 prompt | ~260 px |
| C. วัตถุดิบ 17 ชิ้น | 2 แผ่น | แผ่นละ 1 prompt (9 + 8 ชิ้น) | ~80 px |
| D. เครื่องมือ + ชาม + จาน | 1 แผ่น | 1 prompt (7 ชิ้น) | ~100 px |
| E. ท็อปปิ้ง 23 ชิ้น | 2 แผ่น | แผ่นละ 1 prompt (12 + 11 ชิ้น) | ~48 px |

รูปแผ่น (C/D/E) ผมมีสคริปต์แยกชิ้นให้เอง (`blobs.py` จากเกมลิลลี่) ไม่ต้องตัดเอง
ถ้าแผ่นไหน Gemini วาดชิ้นทับกัน/ติดกัน ให้ขอใหม่ด้วยประโยค Redo ด้านล่าง หรือถ้าไม่ไหวค่อยแยกเป็นรูปละ prompt (บรรทัดชิ้นเดียวใช้ได้เลย)

---

## วิธีใช้

1. เปิด Gemini แล้ว**อัปโหลด 4 ไฟล์นี้ก่อน**เป็นตัวอย่างสไตล์ (แนบไว้ในแชตเดียวกันตลอด)
   - `assets/kitchen.jpg` (ฉากครัว — ให้โทนสีเข้ากัน: แดงคอรัล เขียวมินต์ เหลืองเนย ฟ้า)
   - `assets/friends/seal.png`, `assets/friends/turtle.png`, `assets/friends/rabbit.png`
2. ก๊อป **บล็อกสไตล์กลาง** + **prompt ของรูปนั้น** วางต่อกันเป็นข้อความเดียว แล้วส่ง
3. ได้รูปแล้วดาวน์โหลด เซฟชื่อไฟล์ตามที่ระบุ ลงโฟลเดอร์ `assets/incoming/` (ผมสร้างโฟลเดอร์ไว้ให้แล้ว)
   ขอแค่ **พื้นขาวล้วน ไม่มีเงาที่พื้น** ผมตัดพื้นหลังให้ทีหลัง
4. ประโยคแก้ ถ้ารูปไม่ได้ดั่งใจ:
   - สไตล์ไม่เข้า → `Redo. Match the reference images more closely: same soft shading, same line quality, same pastel palette as the kitchen scene.`
   - มีเงา/พื้นไม่ขาว/มีโต๊ะ → `Redo with a pure flat white background, no table surface, no cast shadow.`
   - มีตัวหนังสือ/ป้ายชื่อ → `Redo with absolutely no text, labels or numbers anywhere.`
   - แผ่นรวมชิ้นติดกัน → `Redo. Keep every object fully separated by clear white space, none touching or overlapping, same order.`
   - อาหารมีหน้า/ตา → `Redo. The food must not have a face or eyes.`
5. เสร็จแล้วบอกผมว่าไฟล์ไหนอยู่ในโฟลเดอร์แล้ว ผมตัดพื้น ย่อขนาด ใส่เข้าเกม และเทสให้

**เทสก่อน 1 รูป** — ทำ `dish-omelet.jpg` (ไข่เจียว) อันเดียวก่อน ดูว่าเข้ากับฉากครัวไหม ค่อยทำที่เหลือ

---

## บล็อกสไตล์กลาง (วางนำหน้าทุก prompt)

```text
Use the attached images as the exact style reference: the pastel kitchen scene and the three characters (baby seal, turtle, rabbit). Create the illustration in the same art style: polished children's picture-book / softly shaded 2D game art, bright cheerful pastel palette matching the kitchen (coral red, mint green, butter yellow, sky blue, cream), tactile fine colored-pencil detailing, crisp clean silhouette, gentle dimensional shading, not emoji, not plastic 3D, not photorealistic, no heavy black outlines. Simple, chunky, rounded shapes that read clearly at small size on a phone screen. Food and objects have NO face, no eyes, no mouth. Appetizing, friendly and sweet, for children aged 4-6. Background uniformly pure flat white (#FFFFFF). No cast shadow on the ground, no table or counter surface, no text, no lettering, no labels, no numbers, no border, no logo, no watermark, no background scenery, no characters.
```

---

# A. อาหารเสร็จแล้ว (9 รูป — รูปละ 1 prompt)

สำคัญ: อาหารต้อง **ยังไม่มีท็อปปิ้ง** เพราะเด็กจะเป็นคนวางเอง (ไม่มีเทียน ไม่มีสปริงเกิล ไม่มีหลอด ฯลฯ)

## A1. ไข่เจียว — เซฟเป็น `dish-omelet.jpg` ← ทำอันนี้ก่อน

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: a fluffy golden-yellow Thai-style fried omelet, round and puffy with soft ruffled slightly crispy edges, seen from a three-quarter top-down angle, plain with no garnish, no sauce, no plate.
```

## A2. ก๋วยเตี๋ยว — เซฟเป็น `dish-noodles.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: a bowl of noodle soup in a white ceramic bowl with a sky-blue rim, seen from a three-quarter top-down angle so the inside is clearly visible: clear golden broth, pale yellow noodles, a few green bok choy leaves and three round white fish balls. No garnish on top, no chopsticks, no spoon, no steam.
```

## A3. คุกกี้ — เซฟเป็น `dish-cookie.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: one big round golden-brown sugar cookie, soft and slightly puffy with gently cracked edges, seen from a three-quarter top-down angle, completely plain with no chocolate chips, no icing, no sprinkles, no plate.
```

## A4. ไอศกรีม — เซฟเป็น `dish-icecream.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: two round scoops of pale pink strawberry ice cream stacked in a crisp golden waffle cone, standing upright, seen from the front, plain with no sprinkles, no cherry, no sauce, no wafer.
```

## A5. ขนมปังปิ้ง — เซฟเป็น `dish-toast.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: one thick square slice of golden toasted bread with a soft brown crust and a small pat of melting yellow butter in the middle, seen from a three-quarter top-down angle, plain with no fruit, no jam, no plate.
```

## A6. เค้กวันเกิด — เซฟเป็น `dish-cake.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: a round two-layer birthday cake covered in smooth pale pink frosting with a soft white frosting band between the layers, seen from a three-quarter front angle, completely plain with no candles, no fruit, no writing, no decorations, no cake stand, no plate.
```

## A7. คัพเค้ก (เมนูเดิม) — เซฟเป็น `dish-cupcake.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: a cupcake in a pleated sky-blue paper cup with a tall soft swirl of pale pink frosting on top, seen from a three-quarter front angle, plain with no sprinkles, no cherry, no toppings.
```

## A8. พิซซ่า (เมนูเดิม) — เซฟเป็น `dish-pizza.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: a whole round pizza with a puffy golden crust, red tomato sauce and melted bubbly yellow cheese, seen from a three-quarter top-down angle, completely plain with no toppings, no slices cut, no plate, no board.
```

## A9. สมูทตี (เมนูเดิม) — เซฟเป็น `dish-smoothie.jpg`

```text
ONE finished dish, centered, generous white margin, square 1:1 image. Subject: a tall clear glass filled with thick pale pink strawberry-banana smoothie, seen from the front, plain with no straw, no whipped cream, no fruit garnish, no umbrella.
```

---

# B. เครื่องปรุง (6 รูป — รูปละ 1 prompt)

ทุกเครื่องเป็นรูป **ตอนปิดอยู่ / ไม่ทำงาน** (ไม่มีไฟ ไม่มีควัน ไม่มีไอน้ำ) — ตอนกดค้างเกมจะใส่แสง/สั่น/ควันให้เองด้วย CSS
สีให้เข้ากับครัว: เตา/กระทะ = แดงคอรัลเหมือนเตาในฉาก, เครื่องอื่นเป็นมินต์/ฟ้า/เหลืองเนย

## B1. กระทะบนเตา — เซฟเป็น `appliance-pan.jpg`

```text
ONE kitchen appliance, centered, generous white margin, square 1:1 image. Subject: a small round coral-red single-burner tabletop stove with one round silver knob on the front, and a dark grey frying pan with a wooden handle sitting on top of it, seen from a three-quarter front-top angle so the empty inside of the pan is clearly visible. Pan is empty. Stove is switched off, no flame, no smoke.
```

## B2. หม้อบนเตา — เซฟเป็น `appliance-pot.jpg`

```text
ONE kitchen appliance, centered, generous white margin, square 1:1 image. Subject: a small round coral-red single-burner tabletop stove with one round silver knob on the front, and a mint-green cooking pot with two little handles sitting on top, its matching lid resting slightly open so a sliver of the inside shows, seen from a three-quarter front angle. Pot is empty. Stove is switched off, no flame, no steam.
```

## B3. ตู้แช่แข็ง — เซฟเป็น `appliance-freezer.jpg`

```text
ONE kitchen appliance, centered, generous white margin, square 1:1 image. Subject: a small cute pastel sky-blue chest-height freezer with a single front door, a silver handle, rounded retro corners, and a few soft white snowflake shapes printed on the door, seen straight from the front, door closed. No frost effect, no glow.
```

## B4. เครื่องปิ้งขนมปัง — เซฟเป็น `appliance-toaster.jpg`

```text
ONE kitchen appliance, centered, generous white margin, square 1:1 image. Subject: a cute retro butter-yellow two-slot toaster with rounded corners, a silver lever on the right side, one round dial on the front, and two empty slots on top, seen from a three-quarter front-top angle so the slots are visible. Empty, switched off.
```

## B5. เตาอบ (เมนูเดิม) — เซฟเป็น `appliance-oven.jpg`

```text
ONE kitchen appliance, centered, generous white margin, square 1:1 image. Subject: a cute coral-red countertop oven with rounded corners, a big rectangular glass window door with a silver handle, and three round silver knobs plus one small round light on a panel above the door, seen straight from the front. The inside behind the glass is dim and empty with one wire rack. Switched off, no glow.
```

## B6. เครื่องปั่น (เมนูเดิม) — เซฟเป็น `appliance-blender.jpg`

```text
ONE kitchen appliance, centered, generous white margin, square 1:1 image. Subject: a cute mint-green blender with a rounded base, one big round button on the front, and a tall clear empty glass jar with a white lid on top, seen from a three-quarter front angle. Empty, switched off.
```

---

# C. วัตถุดิบ 17 ชิ้น (2 แผ่น)

## บล็อกสำหรับแผ่นรวม (ใช้กับกลุ่ม C / D / E — วางต่อจากบล็อกสไตล์กลาง)

```text
Create ONE square sheet containing exactly the objects listed below, arranged in neat rows in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by clear white space, none touching or overlapping, all drawn at a similar size, each centered in its own invisible cell. No labels, no numbers, no text, no grid lines, no boxes, no plates or bowls under the objects.
```

## C1. วัตถุดิบแผ่นที่ 1 (9 ชิ้น, 3 แถว × 3) — เซฟเป็น `sheet-ingredients-1.jpg`

```text
9 objects, 3 rows of 3:
1) a small cream-colored cloth sack of white flour tied at the top, with a little wooden scoop of flour leaning on it
2) one whole egg, cream-white with a few tiny light brown speckles
3) a small glass bottle of milk with a white cap and a plain sky-blue band around the middle
4) a round ball of soft pale-beige pizza dough
5) one plump red tomato with a green stem
6) a wedge of butter-yellow cheese with a few round holes
7) one plump red strawberry with a leafy green top
8) one ripe yellow banana, slightly curved
9) a small bunch of green spring onions tied together, with white bulb ends
```

## C2. วัตถุดิบแผ่นที่ 2 (8 ชิ้น, 2 แถว × 4) — เซฟเป็น `sheet-ingredients-2.jpg`

```text
8 objects, 2 rows of 4:
1) a small round nest of pale yellow dried noodles
2) one bunch of fresh green bok choy with white stems
3) three round white fish balls grouped together
4) a block of butter-yellow butter with one small pat cut off and placed beside it
5) a small clear glass jar of white sugar with a tiny wooden spoon in it
6) one thick square slice of soft white bread with a golden crust
7) a small glass jar of golden honey with a wooden honey dipper standing in it
8) a small pile of dark brown chocolate chips
```

---

# D. เครื่องมือ + ชาม + จาน (1 แผ่น, 7 ชิ้น) — เซฟเป็น `sheet-tools.jpg`

```text
7 objects, 2 rows (4 on the top row, 3 on the bottom row):
1) a wooden mixing spoon
2) a silver balloon whisk with a coral-red handle
3) a silver soup ladle with a mint-green handle
4) a wooden rolling pin with coral-red handles
5) a rounded blunt butter spreader knife with a wooden handle, safe-looking, no sharp edge
6) a mint-green ceramic mixing bowl with a white stripe around the rim, seen from a three-quarter top-down angle so the empty inside is visible
7) a round white ceramic plate with a sky-blue rim and small blue hearts around the edge, seen from a three-quarter top-down angle
```

---

# E. ท็อปปิ้ง 23 ชิ้น (2 แผ่น)

ท็อปปิ้งจะถูกวางบนอาหารเป็นชิ้นเล็กๆ (~48px) เลยขอให้แต่ละชิ้น **อ้วน กลม เห็นชัด** ไม่ต้องมีรายละเอียดเยอะ

## E1. ท็อปปิ้งชุดหวาน (12 ชิ้น, 3 แถว × 4) — เซฟเป็น `sheet-toppings-sweet.jpg`

```text
12 objects, 3 rows of 4, each one small, chunky and simple:
1) a golden-yellow sugar star sprinkle
2) one small red strawberry with a green top
3) a tiny candy rainbow arch in pastel pink, yellow, mint and sky blue
4) a cluster of three round blueberries
5) one red cherry with a stem
6) one big dark brown chocolate chip
7) a swirl of white whipped cream
8) a lit birthday candle with pink and white stripes and a small yellow flame
9) one fluffy pink-and-white marshmallow
10) one round slice of banana
11) one crispy golden wafer roll stick
12) a small pink candy heart
```

## E2. ท็อปปิ้งชุดคาว (11 ชิ้น, 3 แถว × 4 เว้นช่องสุดท้าย) — เซฟเป็น `sheet-toppings-savory.jpg`

```text
11 objects, 3 rows of 4 with the last cell empty, each one small, chunky and simple:
1) one slice of a light brown mushroom
2) two black olive rings
3) a small pile of yellow corn kernels
4) one small chunk of yellow pineapple
5) one ring of green bell pepper
6) a small heart-shaped dollop of red ketchup
7) a small pile of chopped green spring onion rings
8) one slice of orange carrot cut into a star shape
9) three round green peas
10) half of a boiled egg showing the yellow yolk
11) one small sprig of green coriander leaves
```

---

## หมายเหตุสำหรับตอนใส่เข้าเกม (สำหรับ AI)

- รูปเดี่ยว → `python design/cutout.py <ชื่อ>` (คัดลอกสคริปต์จาก `game-lilly/design/` แล้วปรับปลายทางเป็น `assets/dishes/`, `assets/appliances/`, `assets/ingredients/`, `assets/tools/`, `assets/toppings/`)
- รูปแผ่น → `python design/blobs.py <แผ่น> <ชื่อ1> <ชื่อ2> ...` ตามลำดับที่เขียนใน prompt แล้วค่อย `cutout.py`
- ชื่อไฟล์ = key ใน `RECIPES` / `INGREDIENTS` / `TOPPINGS` ของ `js/app.js` — ต้องเพิ่ม `ICONS` map ให้ render `<img>` แทน emoji
- เพิ่มไฟล์ทั้งหมดใน `FILES` ของ `sw.js` และ bump `CACHE` + `?v=`
- ท็อปปิ้งที่เซฟไว้ใน gallery เก่าเป็น emoji string → map emoji เดิม (⭐🍓🌈🫐🍒) ไปยัง key ใหม่ตอน load
