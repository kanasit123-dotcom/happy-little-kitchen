# Prompt ชุดที่ 4 — อาหารสำเร็จของ "ครัวอิสระ" (จานลึกลับ)

> **สถานะ: ทำแล้ว (2026-09-18)** — แผ่น 4×5 ครบ 20 ชิ้น ตัดด้วย `blobs.py --grid 4x5` ใส่เกมแล้ว (`FREE_ART`)

ครัวอิสระตอนนี้เอาไอคอนวัตถุดิบมาวางบนจาน ดูมั่ว → เปลี่ยนเป็น **อาหารจริงตามเครื่องที่ใช้** เช่น ปั่น = น้ำผลไม้สีตามของที่ใส่, ปิ้ง = ขนมปังปิ้ง (หรือไหม้ถ้าปิ้งนานไป), อบ = พาย/อบชีส, ทอด = แพนเค้ก/ผัด, ต้ม = ซุป, แช่แข็ง = ไอติมแท่ง
เกมเลือกรูปจาก **เครื่อง × หวาน/คาว × สี** ของที่ใส่ แล้ววางวัตถุดิบเล็กๆ 2–3 ชิ้นเป็นหน้าให้รู้ว่าใส่อะไร

**1 รูปจบ**: แผ่น 4 แถว × 5 ช่อง = 20 ชิ้น (ถ้าเลือกความละเอียดได้ ขอ 2K) — วิธีเดิม: แนบ `assets/kitchen.jpg` + เพื่อน 3 ตัว → วางบล็อกสไตล์กลาง (จาก `PROMPTS-gemini-3.md`) → ต่อด้วย prompt ด้านล่าง → เซฟเป็น `sheet-free.jpg` ลง `assets/incoming/`

```text
Create ONE square sheet containing exactly 20 separate objects arranged in a neat 4x5 grid (4 rows of 5), in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by clear white space, none touching or overlapping, all drawn at a similar size, each centered in its own invisible cell. No labels, no numbers, no text, no grid lines, no boxes. Dishes are seen from a three-quarter top-down angle; glasses and popsicles from the front.
1) a tall clear glass of smooth pink strawberry smoothie
2) a tall clear glass of smooth pale yellow banana smoothie
3) a tall clear glass of smooth light green smoothie
4) a tall clear glass of smooth light brown chocolate milkshake
5) a tall clear glass of creamy white milkshake
6) one thick square slice of toast with melted bubbly yellow cheese on top
7) one thick square slice of toast burnt very dark brown-black with a little grey smoke wisp, still cute not scary
8) a round golden fruit pie with a lattice top and a few pink berries peeking through
9) a small oval light grey baking dish of bubbly golden cheesy casserole with a few colorful vegetable pieces
10) a round baked dish burnt dark brown-black with a small grey smoke wisp, still cute not scary
11) a stack of three golden pancakes with a pat of butter on top, plain, no syrup
12) a plate of colorful stir-fried vegetables with a few pale pieces mixed in, glossy
13) a round fried patty burnt dark brown-black with a small grey smoke wisp, still cute not scary
14) a white ceramic bowl with a sky-blue rim of clear golden soup with green vegetable pieces and a few pale round pieces
15) a white ceramic bowl with a sky-blue rim of smooth pale pink sweet dessert soup with fruit pieces floating
16) one pink strawberry popsicle on a wooden stick
17) one pale yellow banana popsicle on a wooden stick
18) one light green popsicle on a wooden stick
19) one light brown chocolate popsicle on a wooden stick
20) a translucent light blue ice cube block with a few small colorful food pieces frozen inside, seen from the front
```

ชื่อชิ้นตอนตัด (ตามลำดับ):
`state-drink-pink state-drink-yellow state-drink-green state-drink-brown state-drink-white state-toast-cheese state-toast-burnt state-bake-pie state-bake-casserole state-bake-burnt state-fry-pancakes state-fry-stirfry state-fry-burnt state-soup-savory state-soup-sweet state-pop-pink state-pop-yellow state-pop-green state-pop-brown state-ice-block`

ตอนใส่เกม: `python design/blobs.py --grid 4x5 assets/incoming/sheet-free.jpg <ชื่อ 20 ชิ้น>` → `python design/cutout.py` → เพิ่มชื่อใน `FREE_ART` ของ `js/app.js` (ก่อนรูปมา เกมใช้รูปใกล้เคียงแทนไปก่อน)
