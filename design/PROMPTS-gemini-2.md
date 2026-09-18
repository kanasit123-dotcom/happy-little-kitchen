# Prompt ชุดที่ 2 — หน้าตาเพื่อน / ของหั่นแล้ว / ท็อปปิ้งเพิ่ม / ภาชนะครัวอิสระ

> **สถานะ (2026-09-18):** A, C, D, E ทำแล้ว ใส่เกมแล้ว (A มาเป็นแผ่น 2×2 ต่อตัว → `blobs.py --grid 2x2`; C/D เป็นแผ่น → `--grow 9`; ชีสหั่นไม่ได้วาดมา เลยไม่ให้ชีสหั่น) — เหลือ **B** (หน้าตาเพื่ออีก 8 ตัว) ทำเมื่อไหร่ก็ได้
> รอบนี้ Gemini วาดชุดที่ 1 มาใหม่ที่ 1024px ด้วย (วัตถุดิบ/เครื่องมือ/ท็อปปิ้ง/เครื่องปั่น) เลยแทนของเดิมที่เล็กกว่าทั้งหมด

ใช้กับ Gemini / Antigravity (Nano Banana) ได้เหมือนกัน — วิธีเดิม: **แนบรูปอ้างอิง → วางบล็อกสไตล์ + prompt → เซฟชื่อไฟล์ตามที่ระบุลง `assets/incoming/`** พื้นขาวล้วน ไม่มีเงา ผมตัดพื้นให้เอง

ลำดับความสำคัญ: **A ก่อน** (ใช้ทันทีกับระบบปฏิกิริยาเพื่อนที่ทำเสร็จแล้ว) → C, D → B, E ทำทีหลังได้

| ชุด | ใช้กับฟีเจอร์ | จำนวน | วิธี |
|---|---|---|---|
| **A. หน้าตาเพื่อน 3 ตัวหลัก** | ปฏิกิริยาตอนกิน (ชอบสุดๆ / อร่อย / จาม / อิ่ม) | 12 รูป | รูปละ 1 prompt (แก้จากรูปเดิม) |
| B. หน้าตาเพื่อนที่ปลดล็อก 8 ตัว | เหมือน A แต่ตัวใหม่ — *ทำทีหลังได้* ตอนนี้ใช้ท่าเด้งแบบ CSS แทน | 32 รูป | รูปละ 1 prompt |
| **C. วัตถุดิบหั่นแล้ว + เขียง** | ขั้น "หั่น" ปาดนิ้วหั่นก่อนใส่ชาม | 1 แผ่น (10 ชิ้น) | 1 prompt |
| **D. ท็อปปิ้งเพิ่ม 14 ชิ้น** | แต่งหน้าลึกขึ้น (10 แบบ/เมนู) | 1 แผ่น | 1 prompt |
| E. ภาชนะครัวอิสระ | โหมด sandbox "จานลึกลับ" | 3 รูป | รูปละ 1 prompt |

---

## บล็อกสไตล์กลาง (วางนำหน้าทุก prompt ของชุด C / D / E)

```text
Use the attached images as the exact style reference: the pastel kitchen scene and the three characters (baby seal, turtle, rabbit). Create the illustration in the same art style: polished children's picture-book / softly shaded 2D game art, bright cheerful pastel palette matching the kitchen (coral red, mint green, butter yellow, sky blue, cream), tactile fine colored-pencil detailing, crisp clean silhouette, gentle dimensional shading, not emoji, not plastic 3D, not photorealistic, no heavy black outlines. Simple, chunky, rounded shapes that read clearly at small size on a phone screen. Food and objects have NO face, no eyes, no mouth. Appetizing, friendly and sweet, for children aged 4-6. Background uniformly pure flat white (#FFFFFF). No cast shadow on the ground, no table or counter surface, no text, no lettering, no labels, no numbers, no border, no logo, no watermark, no background scenery, no characters.
```

---

# A. หน้าตาเพื่อน 3 ตัวหลัก (12 รูป)

**สำคัญ: แนบรูปเพื่อนตัวนั้น** (`assets/friends/seal.png` / `turtle.png` / `rabbit.png`) **เป็นรูปแรกในแชต** แล้วบอกให้ "แก้เฉพาะสีหน้า/ท่าทาง ตัวละครต้องเป็นตัวเดิมเป๊ะ" — Nano Banana ทำแบบนี้ได้ดีมาก

4 อารมณ์ที่เกมใช้:

| อารมณ์ | เกมใช้ตอน | ชื่อไฟล์ (ตัวอย่างแมวน้ำ) |
|---|---|---|
| `love` — ชอบที่สุด | ได้กินเมนูโปรด / ทำตามที่สั่ง | `friend-seal-love.jpg` |
| `yum` — อร่อย | กินเมนูทั่วไป | `friend-seal-yum.jpg` |
| `sneeze` — จาม | มีพริกหวาน/ของจี๊ดจ๊าด | `friend-seal-sneeze.jpg` |
| `full` — อิ่มแปล้ | ท็อปปิ้งเยอะมาก (10+ ชิ้น) | `friend-seal-full.jpg` |

ตัวอื่นเปลี่ยนชื่อเป็น `friend-turtle-…` และ `friend-rabbit-…` (รวม 12 ไฟล์)

## บล็อกสไตล์สำหรับชุด A (วางนำหน้าทุก prompt ของ A)

```text
Use the attached character image as the exact reference. Redraw THE SAME character — identical species, colors, outfit, proportions, art style (children's picture-book, soft colored-pencil shading, big bright eyes, rosy cheeks) — changing ONLY the facial expression and pose as described. Same size and framing as the reference: full body, centered, facing the viewer, feet or base visible, generous white margin, square 1:1 image. Background uniformly pure flat white (#FFFFFF). No cast shadow, no food, no props unless described, no text, no border, no other characters. Keep it sweet and funny, for children aged 4-6.
```

## A1. แมวน้ำ (แนบ `seal.png`)

`friend-seal-love.jpg`
```text
Expression: overjoyed — eyes squeezed shut into happy arcs, huge open smile, cheeks extra rosy, both flippers raised high in celebration, slightly bouncing up, three small pink hearts floating just above the head.
```
`friend-seal-yum.jpg`
```text
Expression: happily eating — cheeks puffed full, small content smile, eyes soft and half-closed, one flipper touching the tummy, a tiny sparkle near the cheek.
```
`friend-seal-sneeze.jpg`
```text
Expression: mid-sneeze — eyes shut tight, mouth wide open in an "ah-choo", head tilted back, whiskers flying out, both flippers spread, two tiny motion lines and a small puff of air, cute and harmless.
```
`friend-seal-full.jpg`
```text
Expression: stuffed and sleepy — round bulging tummy, leaning back, eyes half-closed and dreamy, tiny satisfied smile, one flipper patting the belly, a small "zzz" made of three tiny circles floating above.
```

## A2. เต่า (แนบ `turtle.png`)

`friend-turtle-love.jpg`
```text
Expression: overjoyed — eyes squeezed shut into happy arcs, huge open smile, cheeks extra rosy, both arms raised high, jumping a little off the ground, three small pink hearts floating above the head.
```
`friend-turtle-yum.jpg`
```text
Expression: happily eating — cheeks puffed full, small content smile, eyes soft and half-closed, one hand touching the tummy, a tiny sparkle near the cheek.
```
`friend-turtle-sneeze.jpg`
```text
Expression: mid-sneeze — eyes shut tight, mouth wide open in an "ah-choo", head pulled slightly toward the shell, both arms spread, two tiny motion lines and a small puff of air, cute and harmless.
```
`friend-turtle-full.jpg`
```text
Expression: stuffed and sleepy — round bulging tummy under the shell, leaning back, eyes half-closed and dreamy, tiny satisfied smile, one hand patting the belly, a small "zzz" made of three tiny circles floating above.
```

## A3. กระต่าย (แนบ `rabbit.png`)

`friend-rabbit-love.jpg`
```text
Expression: overjoyed — eyes squeezed shut into happy arcs, huge open smile, cheeks extra rosy, both paws raised high, ears standing straight up, jumping a little off the ground, three small pink hearts floating above the head.
```
`friend-rabbit-yum.jpg`
```text
Expression: happily eating — cheeks puffed full, small content smile, eyes soft and half-closed, one paw touching the tummy, ears relaxed, a tiny sparkle near the cheek.
```
`friend-rabbit-sneeze.jpg`
```text
Expression: mid-sneeze — eyes shut tight, mouth wide open in an "ah-choo", ears flung backwards, both paws spread, two tiny motion lines and a small puff of air, cute and harmless.
```
`friend-rabbit-full.jpg`
```text
Expression: stuffed and sleepy — round bulging tummy, leaning back, ears drooping down, eyes half-closed and dreamy, tiny satisfied smile, one paw patting the belly, a small "zzz" made of three tiny circles floating above.
```

---

# B. หน้าตาเพื่อนที่ปลดล็อก 8 ตัว (32 รูป — ทำทีหลังได้)

ตัวละคร: แมว เพนกวิน จิ้งจอก ยูนิคอร์น โลมา ผีเสื้อ หมึกยักษ์ กระรอก (รูปต้นฉบับอยู่ใน `assets/friends/<ชื่อ>.png` แล้ว)
ใช้บล็อกสไตล์ A + prompt 4 อารมณ์เดียวกับข้างบน เปลี่ยนคำว่า flippers/paws ให้ตรงตัว (ปีกเพนกวิน, หนวดหมึก, ปีกผีเสื้อ, กีบยูนิคอร์น, ครีบโลมา)
ชื่อไฟล์ `friend-cat-love.jpg`, `friend-penguin-yum.jpg`, … ตามรูปแบบเดิม — ทำตัวไหนเสร็จเกมจะใช้รูปตัวนั้นทันที ตัวที่ยังไม่มีใช้ท่า CSS

---

# C. วัตถุดิบหั่นแล้ว + เขียง (1 แผ่น, 10 ชิ้น) — เซฟเป็น `sheet-cut.jpg`

ใช้ในขั้น "หั่น": ปาดนิ้วบนวัตถุดิบ 3 ครั้ง → เปลี่ยนเป็นรูปหั่นแล้ว → ค่อยใส่ชาม (ไข่ = แตะให้แตก)
วางแนบบล็อกสไตล์กลาง แล้วต่อด้วย:

```text
Create ONE square sheet containing exactly 10 separate objects arranged in neat rows in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by clear white space, none touching or overlapping, all drawn at a similar size, each centered in its own invisible cell. No labels, no numbers, no text, no grid lines, no boxes.
10 objects, 2 rows of 5:
1) a red tomato cut into four round slices fanned out slightly, seeds visible
2) a banana cut into five round slices
3) a strawberry cut in half showing the pale pink inside
4) bok choy chopped into chunky green pieces with white stem bits
5) a wedge of yellow cheese cut into small cubes
6) a slice of white bread cut diagonally into two triangles
7) a block of butter cut into four thin square pats
8) a cracked egg: two eggshell halves beside a puddle of clear egg white with a round yellow yolk
9) spring onions chopped into small green rings in a little pile
10) a light wooden cutting board with rounded corners and a small hole in one corner, seen from a three-quarter top-down angle, empty
```

---

# D. ท็อปปิ้งเพิ่ม 14 ชิ้น (1 แผ่น) — เซฟเป็น `sheet-toppings-2.jpg`

วางแนบบล็อกสไตล์กลาง แล้วต่อด้วย:

```text
Create ONE square sheet containing exactly 14 separate objects arranged in neat rows in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by clear white space, none touching or overlapping, all drawn at a similar size, each centered in its own invisible cell. No labels, no numbers, no text, no grid lines, no boxes.
14 objects, 2 rows of 7, each one small, chunky and simple:
1) a small pile of colorful rainbow sugar sprinkles (tiny rods in pink, yellow, mint, sky blue)
2) a squiggle of dark chocolate sauce drizzle
3) a squiggle of golden honey drizzle
4) one round slice of green kiwi with tiny black seeds
5) one round slice of orange
6) one sprig of two fresh mint leaves
7) one small star-shaped golden cookie
8) one small red chili pepper with a green stem
9) one wedge of green lime
10) one round slice of cucumber
11) one cooked pink shrimp, curled
12) one small dark green strip of seaweed
13) a small pinch of white sesame seeds
14) one round red tomato slice
```

ชื่อชิ้นตอนตัด (ตามลำดับ): `top-sprinkles top-chocsauce top-honeydrizzle top-kiwi top-orange top-mint top-starcookie top-chili top-lime top-cucumber top-shrimp top-seaweed top-sesame top-tomatoslice`

---

# E. ภาชนะครัวอิสระ (3 รูป — รูปละ prompt, ทำทีหลังได้)

โหมด sandbox: เด็กเอาวัตถุดิบอะไรก็ได้ใส่เครื่องไหนก็ได้ ออกมาเป็น "จานลึกลับ" — เกมเอารูปวัตถุดิบมาวางบนภาชนะเหล่านี้
วางแนบบล็อกสไตล์กลาง แล้วต่อด้วย:

`dish-plate.jpg`
```text
ONE object, centered, generous white margin, square 1:1 image. Subject: a round white ceramic plate with a sky-blue rim and small blue hearts around the edge, completely empty, seen from a three-quarter top-down angle so the whole inner surface is visible.
```
`dish-bowl.jpg`
```text
ONE object, centered, generous white margin, square 1:1 image. Subject: a mint-green ceramic bowl with a white stripe around the rim, completely empty, seen from a three-quarter top-down angle so the inside is clearly visible.
```
`dish-glass.jpg`
```text
ONE object, centered, generous white margin, square 1:1 image. Subject: a tall clear empty drinking glass with a slightly wider top, seen from the front, with soft light-blue glass shading and a small white highlight.
```

---

## หมายเหตุตอนใส่เข้าเกม (สำหรับ AI)

- ชุด A/B: `python design/cutout.py friend-seal-love …` → `assets/friends/seal-love.png` แล้วเพิ่ม `'love'` ใน `FRIEND_ART.seal` ของ `js/app.js` (เกมจะใช้รูปแทนท่า CSS) + เพิ่มไฟล์ใน `sw.js`
- ชุด C: `python design/blobs.py assets/incoming/sheet-cut.jpg ing-tomato-cut ing-banana-cut ing-strawberry-cut ing-bokchoy-cut ing-cheese-cut ing-bread-cut ing-butter-cut ing-egg-cracked ing-springonion-cut tool-board` แล้ว `cutout.py`
- ชุด D: `python design/blobs.py assets/incoming/sheet-toppings-2.jpg <ชื่อ 14 ชิ้นด้านบน>` แล้ว `cutout.py`
- ชุด E: `cutout.py dish-plate dish-bowl dish-glass`
