# Prompt ชุดที่ 5 — ร้านอาหาร เหรียญ และตลาดของตกแต่ง

> **สถานะ: ยังไม่ได้ทำ (เขียน 2026-09-23)** — ใช้กับฟีเจอร์ร้านอาหารตาม `RESTAURANT-MATH-PLAN.md` ระหว่างรอรูป เกมจะวาดเหรียญด้วย CSS ไปก่อน จึงไม่ต้องรีบ

**รวม 4 รูป**: แผ่น 4×4 หนึ่งแผ่น (ของในร้าน + เงิน) · แผ่น 2×5 หนึ่งแผ่น (ของตกแต่ง) · ฉากร้าน 1 รูป · ฉากตลาด 1 รูป
ถ้าเลือกความละเอียดได้ ขอ **2K** ชิ้นจะคมกว่า

| ไฟล์ | ชิ้น | ตัดด้วย |
|---|---|---|
| `sheet-shop-a.jpg` | 16 (เหรียญ 4 · แบงก์ 20 · กระปุก · ลิ้นชักเงิน · ถาด · ป้ายราคา · พิซซ่า 1 ชิ้น · ถุง · กระเป๋าเงิน · ชั้นวาง · กริ่ง · กล่อง · กระดานเมนู) | `blobs.py --grid 4x4` |
| `sheet-shop-b.jpg` | 10 ของตกแต่ง | `blobs.py --grid 2x5` |
| `shop.jpg` | ฉากหน้าร้าน (แนวนอน 3:2 เหมือน `kitchen.jpg`) | ไม่ต้องตัด |
| `market.jpg` | ฉากแผงตลาด (แนวนอน 3:2) | ไม่ต้องตัด |

วิธีเดิม: แนบ `assets/kitchen.jpg` + เพื่อน 3 ตัว (แมวน้ำ เต่า กระต่าย) เป็นตัวอย่างสไตล์ → วาง**บล็อกสไตล์กลาง** (ใน `PROMPTS-gemini-3.md`) → ต่อด้วย prompt ของแผ่น → เซฟชื่อตามตารางลง `assets/incoming/`
ฉากร้านและฉากตลาด **ไม่ต้อง**ใช้บล็อกสไตล์กลาง (เพราะบล็อกนั้นสั่งพื้นขาว) ให้ใช้ prompt ของฉากอย่างเดียว

## กติกาของชุดนี้

- **เหรียญ แบงก์ และป้ายราคาต้องไม่มีตัวเลขหรือตัวอักษร** — Gemini มักเขียนตัวเลขเพี้ยน เกมจะวางตัวเลขใหญ่ทับด้วย CSS เอง ให้วาดหน้าเหรียญเรียบตรงกลาง
- เหรียญต้องแยกกันได้ด้วย**ขนาดและสี**ตามของจริง: 1 บาท เงินเล็กสุด · 2 บาท สีทอง · 5 บาท เงินใหญ่ขึ้นขอบทองแดง · 10 บาท ใหญ่สุด ตรงกลางทองวงนอกเงิน · 20 บาท ธนบัตรสีเขียว
- ห้ามมีรูปคนหรือพระบรมฉายาลักษณ์ และห้ามลอกลายธนบัตรจริง
- **กระปุกออมสินห้ามเป็นรูปหมู** (กติกาเดิม: ไม่มีหมี หมู ฮิปโป หมา โคอาลา) ใช้กระปุกรูปแมวน้ำแทน
- อาหารและสิ่งของไม่มีหน้า ไม่มีตา

## A — `sheet-shop-a.jpg` (แนบ `assets/dishes/pizza.png` ด้วย สำหรับชิ้นที่ 10)

```text
Create ONE square sheet containing exactly 16 separate objects arranged in a neat 4x4 grid, in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by clear white space, none touching or overlapping, each centered in its own invisible cell. No labels, no numbers, no letters, no text, no symbols, no grid lines, no boxes. Coins and the banknote are seen from straight above; everything else from a three-quarter top-down angle.
1) a small shiny silver coin, plain smooth face with a thin raised rim, completely blank center (the smallest coin)
2) a slightly larger shiny golden-yellow coin, plain smooth face with a thin raised rim, completely blank center
3) a larger shiny silver coin with a thin copper-coloured outer edge, completely blank center
4) the largest coin: a golden-yellow center disc surrounded by a silver outer ring, completely blank, no engraving
5) one flat rectangular soft green paper banknote with a simple wavy pastel pattern and an empty light oval in the middle, no portrait, no numbers, no writing
6) a cute ceramic coin bank shaped like a round baby seal, pale grey-white, with a coin slot on its back (seal shape, NOT a pig)
7) an open shallow wooden cash tray with four round compartments, empty
8) an empty round pastel mint serving tray with a small raised rim
9) a small blank cream-coloured price tag with a rounded corner and a little string loop, nothing written on it
10) one triangular slice of the attached cheese pizza (same crust, tomato sauce and melted cheese), plain, no extra toppings
11) a small pastel coral paper shopping bag with two handles, empty
12) a small open butter-yellow coin purse with a clasp, empty
13) an empty two-tier pastel wooden display shelf, front view, with plenty of space on each tier
14) a small shiny silver counter bell (the kind you tap to ring) on a round base
15) an open empty cardboard box with the flaps folded out
16) a small blank chalkboard menu stand with a wooden frame, board completely empty
```

ชื่อชิ้นตอนตัด (ตามลำดับ):
`coin-1 coin-2 coin-5 coin-10 coin-note20 shop-bank shop-cashtray shop-tray shop-pricetag shop-pizzaslice shop-bag shop-purse shop-shelf shop-bell shop-box shop-menu`

ตอนใส่เกม: `python design/blobs.py --grid 4x4 assets/incoming/sheet-shop-a.jpg <ชื่อ 16 ชิ้น>` → `python design/cutout.py`

## B — `sheet-shop-b.jpg` ของตกแต่งร้าน

```text
Create ONE landscape sheet containing exactly 10 separate objects arranged in a neat grid of 2 rows of 5, in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by clear white space, none touching or overlapping, all drawn at a similar size, each centered in its own invisible cell. No labels, no numbers, no letters, no text, no grid lines, no boxes. Each object is a single standalone shop decoration seen from the front or a slight three-quarter angle.
1) a small round café table covered with a coral-and-white gingham tablecloth
2) a small glass vase with a bunch of pastel pink and yellow flowers
3) a hanging wooden shop sign board on two short chains, the board completely blank
4) a leafy green potted plant in a cream ceramic pot
5) a hanging pastel lamp with a scalloped butter-yellow shade
6) a short striped shop awning in mint green and white with a scalloped edge, front view
7) a string of small triangle bunting flags in coral, mint, butter yellow and sky blue, gently curved
8) a bunch of three shiny balloons (coral, sky blue, butter yellow) tied with ribbons
9) a small oval doormat rug in sky blue with a cream border
10) a small wooden chair with a round coral cushion on the seat
```

ชื่อชิ้นตอนตัด (ตามลำดับ):
`decor-tablecloth decor-flowers decor-sign decor-plant decor-lamp decor-awning decor-bunting decor-balloons decor-rug decor-chair`

ตอนใส่เกม: `python design/blobs.py --grid 2x5 assets/incoming/sheet-shop-b.jpg <ชื่อ 10 ชิ้น>` → `python design/cutout.py`

## C — `shop.jpg` ฉากหน้าร้าน (ไม่ใช้บล็อกสไตล์กลาง)

```text
Use the attached kitchen image and the three characters as the exact style reference: polished children's picture-book / softly shaded 2D game art, bright cheerful pastel palette (coral red, mint green, butter yellow, sky blue, cream), tactile fine colored-pencil detailing, gentle shading, no heavy black outlines, not photorealistic, not 3D.
Draw a landscape 3:2 background of the inside of a tiny cozy bakery shop, seen from behind the shop counter looking out toward the customers. In the lower third, a wide empty pastel wooden shop counter runs across the whole picture, its top surface clear and flat so items can be placed on it. Behind the counter, the customer side shows a soft cream floor and a big open doorway in the middle where a customer can walk in. The back wall has a few plain empty spots (upper left and upper right) where decorations could hang later, and a window with soft daylight. Keep the scene simple and uncluttered, with calm areas where game items will sit on top. No characters, no people, no animals, no food, no text, no lettering, no signs with writing, no numbers, no logo.
```

## D — `market.jpg` ฉากแผงตลาด (ไม่ใช้บล็อกสไตล์กลาง)

```text
Use the attached kitchen image and the three characters as the exact style reference: polished children's picture-book / softly shaded 2D game art, bright cheerful pastel palette (coral red, mint green, butter yellow, sky blue, cream), tactile fine colored-pencil detailing, gentle shading, no heavy black outlines, not photorealistic, not 3D.
Draw a landscape 3:2 background of a small friendly outdoor market stall on a sunny day, seen from the front as a shopper. A wooden stall with a mint-and-white striped awning fills the middle; it has two empty wooden shelves and an empty flat front counter so game items can be placed on them. Soft green trees and a pale sky behind. Keep it simple and uncluttered with calm empty areas. No characters, no people, no animals, no goods on the shelves, no text, no lettering, no price signs, no numbers, no logo.
```

ตอนใส่เกม: ย่อเป็นกว้าง 1536 px แบบเดียวกับ `kitchen.jpg` แล้ววางที่ `assets/shop.jpg` และ `assets/market.jpg`
