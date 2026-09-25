# Prompt ชุดที่ 6 — แบงก์ 50/100, ของขายเพิ่ม และของแต่งร้านชุดที่ 2

> **สถานะ: แผ่น C ทำแล้ว (2026-09-25)** ตัดเป็น `assets/coins/note50.png`, `note100.png`, `assets/shop/cakeslice.png`, `basket.png`, `cup.png`, `register.png` (แบงก์ 50 แก้วน้ำ และตะกร้าเกินช่องนิดหน่อย จึงตัดตามขอบจริง และลบพื้นขาวในหูตะกร้าเอง) — **แผ่น D ยังไม่ได้ทำ**; เกมยังไม่ได้ใช้รูปชุดนี้

**รวม 2 รูป**: แผ่น 2×3 (เงิน + ของขาย) · แผ่น 2×5 (ของแต่งร้านชุดที่ 2)
ถ้าเลือกความละเอียดได้ ขอ **2K** ชิ้นจะคมกว่า

| ไฟล์ | ชิ้น | ใช้ทำอะไร |
|---|---|---|
| `sheet-shop-c.jpg` | 6 (แบงก์ 50 · แบงก์ 100 · เค้ก 1 ชิ้น · ตะกร้าจ่ายตลาด · แก้วน้ำมีฝา · เครื่องคิดเงิน) | ลูกค้าจ่ายแบงก์ใหญ่ ยอดถึง 99 บาท, ขายเค้กเป็นชิ้น/เครื่องดื่ม |
| `sheet-shop-d.jpg` | 10 ของแต่งร้านชุดที่ 2 | ตลาดมีของให้ซื้อเพิ่มหลังซื้อชุดแรกครบ |

วิธีเดิม: แนบ `assets/kitchen.jpg` + เพื่อน 3 ตัว (แมวน้ำ เต่า กระต่าย) เป็นตัวอย่างสไตล์ → วาง**บล็อกสไตล์กลาง** (ใน `PROMPTS-gemini-3.md`) → ต่อด้วย prompt ของแผ่น → เซฟชื่อตามตารางลง `assets/incoming/`

## กติกาของชุดนี้

- **แบงก์ต้องไม่มีตัวเลข ตัวอักษร หรือรูปคน** (เกมวางตัวเลขทับเองเหมือนแบงก์ 20) ห้ามพระบรมฉายาลักษณ์ และห้ามลอกลายธนบัตรจริง
- แบงก์ทุกใบ**ขนาดและแบบเดียวกับแบงก์ 20 เดิม** ต่างกันแค่สีตามของจริง: 50 = ฟ้า/น้ำเงิน, 100 = แดง/ชมพู — แนบ `assets/coins/note20.png` ไปด้วย
- นาฬิกาห้ามมีตัวเลข ใช้จุดแทน, รูปในกรอบภาพห้ามมีตัวหนังสือ, ป้ายทุกอันว่างเปล่า
- ไม่มีหมี หมู ฮิปโป หมา โคอาลา ตุ๊กตาหมี; อาหารและสิ่งของไม่มีหน้า ไม่มีตา
- **เว้นที่ว่างรอบแต่ละชิ้นเยอะๆ** — ชุดที่แล้วหลายชิ้นวาดเกินช่องตาราง (ชั้นวาง แบงก์ 20 กันสาด) ต้องตัดใหม่เอง

## C — `sheet-shop-c.jpg` (แนบ `assets/coins/note20.png` และ `assets/dishes/cake.png` ด้วย)

```text
Create ONE landscape sheet containing exactly 6 separate objects arranged in a neat grid of 2 rows of 3, in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by wide clear white space, none touching or overlapping, each drawn well inside its own invisible cell with a generous empty margin. No labels, no numbers, no letters, no text, no symbols, no portraits, no grid lines, no boxes. The banknotes are seen from straight above; everything else from a three-quarter top-down angle.
1) one flat rectangular soft sky-blue paper banknote, exactly the same size, shape and style as the attached green banknote, with a simple wavy pastel pattern and an empty light oval in the middle, no portrait, no numbers, no writing
2) one flat rectangular soft coral-red paper banknote, exactly the same size, shape and style as the attached green banknote, with a simple wavy pastel pattern and an empty light oval in the middle, no portrait, no numbers, no writing
3) one triangular slice of the attached pink birthday cake on its own, showing the soft sponge layers and cream, plain, no candles
4) a small woven pastel shopping basket with one handle, empty
5) a pastel paper cup with a dome lid and a striped straw, plain, no logo
6) a small cute pastel mint cash register with round buttons and a small drawer, the little screen and buttons completely blank
```

ชื่อชิ้นตอนตัด (ตามลำดับ):
`coin-note50 coin-note100 shop-cakeslice shop-basket shop-cup shop-register`

ตอนใส่เกม: `python design/blobs.py --grid 2x3 assets/incoming/sheet-shop-c.jpg <ชื่อ 6 ชิ้น>` → `python design/cutout.py` (ถ้าชิ้นไหนเกินช่อง ให้ตัดตามขอบของชิ้นจริงแบบชุดที่ 5)

## D — `sheet-shop-d.jpg` ของแต่งร้านชุดที่ 2

```text
Create ONE landscape sheet containing exactly 10 separate objects arranged in a neat grid of 2 rows of 5, in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by wide clear white space, none touching or overlapping, all drawn at a similar size, each drawn well inside its own invisible cell with a generous empty margin. No labels, no numbers, no letters, no text, no grid lines, no boxes. Each object is a single standalone shop decoration seen from the front or a slight three-quarter angle.
1) a round pastel wall clock with small dots instead of numbers and two simple hands
2) a gently curved string of small warm fairy lights with round bulbs
3) a wooden window flower box full of small pink and yellow flowers
4) a glass cake dome on a pastel cake stand, empty inside
5) a small wooden picture frame holding a simple pastel landscape painting of hills and a sun, no text
6) a small round wooden stool with a mint cushion
7) a hanging plant in a macrame holder with trailing green leaves
8) a string of three round paper lanterns in coral, butter yellow and sky blue
9) a garland of small pastel paper stars on a string, gently curved
10) a small pastel tea set on a tray: a teapot and two cups, no faces
```

ชื่อชิ้นตอนตัด (ตามลำดับ):
`decor-clock decor-fairylights decor-flowerbox decor-cakedome decor-picture decor-stool decor-hangingplant decor-lanterns decor-stars decor-teaset`

ตอนใส่เกม: `python design/blobs.py --grid 2x5 assets/incoming/sheet-shop-d.jpg <ชื่อ 10 ชิ้น>` → `python design/cutout.py` แล้วเพิ่มราคาใน `DECOR` (`js/shop/core.js`) ชื่อใน `DECOR_NAMES` (`js/shop/ui.js`) และจุดวางใน `css/shop.css` (พิกัดเป็น % ของรูปห้องร้าน: ผนังหลัง x 23–83% y 7–62%, พื้น y 62–70%, ประตู x 28–50%, หน้าต่าง x 54–80%)

## ยังไม่ได้ใส่ในชุดนี้ (ถ้าอยากได้บอกได้)

- หน้าเพื่อน 11 ตัวแบบสงสัย/ตกใจ (ตอนนี้ใช้ท่าทาง + เครื่องหมาย ? ! แทน) — ต้องแนบรูปเพื่อนทีละตัว จึงแยกเป็นอีกชุด
- แบงก์ 500/1000 — ร้านตอนนี้ยอดไม่เกิน 99 บาท ยังไม่จำเป็น
