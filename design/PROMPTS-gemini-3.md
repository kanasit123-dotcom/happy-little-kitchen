# Prompt ชุดที่ 3 — รูป "ระหว่างทำ" สำหรับขั้นตอนตามจริง

เกมจะเปลี่ยนจาก "ทุกเมนู 6 ขั้นเหมือนกัน" เป็นขั้นตอนตามการทำอาหารจริง (เท พลิก ทา โรย ปั้น ตัก ลวก จุด/เป่าเทียน) เลยต้องมีรูปของ**สถานะระหว่างทาง** เช่น แป้งในถ้วยกระดาษ ไข่ดิบในกระทะ ก้อนคุกกี้บนถาด
วิธีเดิม: แนบ `assets/kitchen.jpg` + เพื่อน 3 ตัวเป็นตัวอย่างสไตล์ → วางบล็อกสไตล์กลาง + prompt → เซฟชื่อไฟล์ตามที่ระบุลง `assets/incoming/` (พื้นขาวล้วน ไม่มีเงา)

**รวม 9 รอบ**: แผ่นใหญ่ 2×3 จำนวน 5 แผ่น · แผ่นเล็ก 3×3 จำนวน 1 แผ่น · แก้รูปเครื่องปั่น 3 รูป

| ไฟล์ | ใช้กับ | ชิ้น |
|---|---|---|
| `sheet-s1-bowls.jpg` | ชามผสมสถานะต่างๆ + แผ่นพิซซ่า | 6 |
| `sheet-s2-omelet-noodles.jpg` | ไข่เจียว + ก๋วยเตี๋ยว | 6 |
| `sheet-s3-bakery.jpg` | คัพเค้ก + คุกกี้ | 6 |
| `sheet-s4-cake-icecream.jpg` | เค้ก + ไอศกรีม | 6 |
| `sheet-s5-scoop-toast.jpg` | ไอศกรีม (ตัก) + ขนมปังปิ้ง + คุกกี้ | 6 |
| `sheet-s6-pantry.jpg` | ของเล็กๆ ที่ใช้หลายเมนู | 9 |
| `appliance-blender-open.jpg` · `appliance-blender-full.jpg` · `tool-blender-lid.jpg` | สมูทตี (ปิดฝา / เทใส่แก้ว) | 3 รูปเดี่ยว แก้จากรูปเครื่องปั่นเดิม |

สำคัญ: **ชามทุกใบต้องเป็นชามมินต์ใบเดียวกับ `assets/dishes/bowl.png`** (แนบรูปนี้ด้วยตอนทำ S1) และของทุกชิ้นมองจากมุมเฉียงบน (three-quarter top-down) เหมือนรูปอาหารชุดแรก จะได้วางซ้อนกันในเกมได้

---

## บล็อกสไตล์กลาง (วางนำหน้าทุก prompt)

```text
Use the attached images as the exact style reference: the pastel kitchen scene and the three characters (baby seal, turtle, rabbit). Create the illustration in the same art style: polished children's picture-book / softly shaded 2D game art, bright cheerful pastel palette matching the kitchen (coral red, mint green, butter yellow, sky blue, cream), tactile fine colored-pencil detailing, crisp clean silhouette, gentle dimensional shading, not emoji, not plastic 3D, not photorealistic, no heavy black outlines. Simple, chunky, rounded shapes that read clearly at small size on a phone screen. Food and objects have NO face, no eyes, no mouth. Appetizing, friendly and sweet, for children aged 4-6. Background uniformly pure flat white (#FFFFFF). No cast shadow on the ground, no table or counter surface, no text, no lettering, no labels, no numbers, no border, no logo, no watermark, no background scenery, no characters.
```

## บล็อกสำหรับแผ่นรวม (วางต่อจากบล็อกสไตล์กลาง)

```text
Create ONE square sheet containing exactly the objects listed below, arranged in neat rows in exactly this reading order (left to right, then top to bottom). Every object is fully separated from the others by clear white space, none touching or overlapping, all drawn at a similar size, each centered in its own invisible cell. No labels, no numbers, no text, no grid lines, no boxes.
```

---

# S1. ชามผสม + แผ่นพิซซ่า (2 แถว × 3) — `sheet-s1-bowls.jpg`

แนบ `assets/dishes/bowl.png` เพิ่มด้วย

```text
6 objects, 2 rows of 3, all seen from a three-quarter top-down angle so the contents are clearly visible. Objects 1-5 are the SAME mint-green ceramic mixing bowl with a white stripe as the attached bowl image, each with different contents:
1) the bowl holding smooth pale yellow beaten egg
2) the bowl holding beaten egg with small green spring onion rings and little red tomato pieces floating in it
3) the bowl holding smooth pale cream cake batter with a wooden spoon resting in it
4) the bowl holding pale golden cookie dough dotted with dark chocolate chips
5) the bowl (a white ceramic bowl with a sky-blue rim this time) holding cooked yellow noodles, green bok choy and three white fish balls with NO broth
6) a round flat pizza dough base, pale beige, rolled out and plain with a slightly thicker rim, no sauce, no toppings
```
ชื่อชิ้น: `state-bowl-egg state-bowl-eggveg state-bowl-batter state-bowl-dough state-bowl-noodles-dry state-pizza-base`

---

# S2. ไข่เจียว + ก๋วยเตี๋ยว (2 แถว × 3) — `sheet-s2-omelet-noodles.jpg`

```text
6 objects, 2 rows of 3, seen from a three-quarter top-down angle:
1) raw beaten egg just poured into a dark grey frying pan: a glossy pale yellow liquid disc with small green spring onion rings and red tomato bits, edges still wet, the pan drawn small around it
2) a half-cooked omelet in the same dark grey frying pan: the underside golden and set, the top still slightly glossy and pale, edges starting to ruffle
3) a Thai noodle-blanching basket: a round wire mesh basket with a long wooden handle, empty
4) the same wire basket holding a nest of pale yellow noodles
5) the same wire basket holding green bok choy leaves
6) a silver soup ladle with a mint-green handle, filled with clear golden broth, tilted slightly as if about to pour
```
ชื่อชิ้น: `state-omelet-raw state-omelet-half tool-basket state-basket-noodles state-basket-veg state-ladle-broth`

---

# S3. คัพเค้ก + คุกกี้ (2 แถว × 3) — `sheet-s3-bakery.jpg`

```text
6 objects, 2 rows of 3, seen from a three-quarter top-down angle:
1) a small light grey muffin tray with six empty pleated sky-blue paper cupcake liners
2) the same muffin tray with the six sky-blue liners filled with pale cream batter
3) the same muffin tray with six baked golden cupcakes rising out of the sky-blue liners, no frosting
4) one baked golden cupcake in a pleated sky-blue paper liner, seen from a three-quarter front angle, completely plain with no frosting
5) an empty light grey rectangular baking tray with rounded corners, lined with a sheet of cream baking paper
6) the same baking tray with six round golden chocolate-chip cookies baked on it
```
ชื่อชิ้น: `state-liners-empty state-liners-filled state-cupcakes-baked state-cupcake-plain state-tray-empty state-cookies-tray`

---

# S4. เค้ก + ไอศกรีม (2 แถว × 3) — `sheet-s4-cake-icecream.jpg`

```text
6 objects, 2 rows of 3, seen from a three-quarter top-down angle:
1) an empty round light grey cake tin with straight sides
2) the same round cake tin filled with smooth pale cream batter
3) a baked round two-layer sponge cake, golden brown, completely plain with no frosting and no decorations, seen from a three-quarter front angle
4) an empty pastel pink ice cream tub with rounded corners, lid off, inside visible
5) the same pink tub filled with smooth liquid pink strawberry cream (not yet frozen), a few small strawberry pieces on top
6) the same pink tub filled with frozen pale pink strawberry ice cream, its surface showing two round scoop marks and a light frosty sparkle
```
ชื่อชิ้น: `state-tin-empty state-tin-filled state-cake-plain state-tub-empty state-tub-liquid state-tub-frozen`

---

# S5. ตักไอศกรีม + ขนมปังปิ้ง + คุกกี้ (2 แถว × 3) — `sheet-s5-scoop-toast.jpg`

```text
6 objects, 2 rows of 3:
1) a silver ice cream scoop with a mint-green handle, empty
2) one round scoop-shaped ball of pale pink strawberry ice cream on its own
3) an empty crisp golden waffle cone standing upright, seen from the front
4) one thick square slice of golden toasted bread, plain with NO butter and no toppings, seen from a three-quarter top-down angle
5) a small glass jar of red strawberry jam with a wooden spoon in it, a few tiny seeds visible in the jam
6) one round ball of pale golden raw cookie dough dotted with dark chocolate chips
```
ชื่อชิ้น: `tool-scoop state-scoop-ball state-cone-empty state-toast-plain ing-jam state-dough-ball`

---

# S6. ของเล็กๆ ที่ใช้หลายเมนู (3 แถว × 3) — `sheet-s6-pantry.jpg`

```text
9 objects, 3 rows of 3, each small, chunky and simple:
1) a silver box cheese grater with a mint-green handle, a few shreds of yellow cheese beside it
2) a small pile of shredded yellow cheese
3) a small glass jar of red tomato sauce with a wooden spoon in it
4) a small pile of golden fried garlic bits
5) a small white cup of plain yogurt with a spoon
6) a small clear bottle of golden cooking oil with a yellow cap
7) a red ketchup squeeze bottle with a white cap, slightly tilted as if squeezing
8) a small round mound of white steamed rice on a tiny white plate
9) one striped pink-and-white drinking straw, bent at the top
```
ชื่อชิ้น: `tool-grater ing-cheese-shreds ing-sauce top-garlic ing-yogurt ing-oil tool-ketchup top-rice top-straw`

---

# S7. เครื่องปั่น 3 แบบ — แก้จากรูปเดิม (รูปละ 1 prompt)

แนบ `assets/incoming/appliance-blender.jpg` (รูปเครื่องปั่นเดิม) แล้วบอกให้แก้เฉพาะจุด — ต้องได้เครื่องเดิมเป๊ะ ขนาดเท่าเดิม กลางภาพ

`appliance-blender-open.jpg`
```text
Use the attached blender image as the exact reference. Redraw the SAME mint-green blender, identical design, colors, size and framing, with ONE change: the white lid is removed so the top of the clear glass jar is open and empty. Pure flat white background, no shadow, no text.
```
`appliance-blender-full.jpg`
```text
Use the attached blender image as the exact reference. Redraw the SAME mint-green blender, identical design, colors, size and framing, with TWO changes: the white lid is removed so the top of the jar is open, and the clear jar is two-thirds full of smooth pale pink strawberry-banana smoothie. Pure flat white background, no shadow, no text.
```
`tool-blender-lid.jpg`
```text
Use the attached blender image as the exact reference. Draw ONLY the blender's white lid on its own — the same round white lid with the small cap in the middle, seen from a three-quarter top angle, centered, large, generous white margin, square 1:1 image. Pure flat white background, no shadow, no text, no blender body.
```

---

## หมายเหตุตอนใส่เข้าเกม (สำหรับ AI)

- แผ่น 2×3 / 3×3: `python design/blobs.py --grow 9 assets/incoming/<แผ่น> <ชื่อชิ้นตามลำดับ>` แล้ว `python design/cutout.py` (คำนำหน้า `state-` → `assets/states/` 512px)
- รูปเดี่ยว: `python design/cutout.py appliance-blender-open appliance-blender-full tool-blender-lid`
- ชื่อไฟล์ = key ที่อ้างในรายการ `steps` ของแต่ละเมนูใน `js/app.js` (ดู `RECIPES`)
