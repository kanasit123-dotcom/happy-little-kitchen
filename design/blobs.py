"""แยกของหลายชิ้นที่วาดรวมกันในแผ่นเดียว (พื้นขาว วางไม่เป็นตารางก็ได้) ออกเป็นไฟล์ละชิ้น

วิธีใช้:
    python design/blobs.py <ไฟล์แผ่น>                      # แค่ดูว่าเจอกี่ชิ้น อยู่ตรงไหน (เรียงบน→ล่าง ซ้าย→ขวา)
    python design/blobs.py <ไฟล์แผ่น> item-tophat item-sunhat ... # ตั้งชื่อตามลำดับที่พิมพ์ (ใส่ - เพื่อข้าม)
    python design/blobs.py --grid 2x2 <ไฟล์แผ่น> a b c d       # แผ่นที่วางเป็นตารางเป๊ะ: ตัดตามช่อง (แถวxคอลัมน์)
                                                              ใช้กับชิ้นที่มีเศษลอยแยกกัน เช่น หัวใจรอบตัวละคร สปริงเกิล
    python design/blobs.py --grow 8 <ไฟล์แผ่น> ...             # ชิ้นที่เป็นเม็ดเล็กๆ กระจาย (งา สปริงเกิล) ให้ขยายหมึกมากขึ้นจนรวมเป็นก้อนเดียว
    ผลลัพธ์อยู่ใน assets/incoming/<ชื่อ>.png แล้วค่อยรัน python design/cutout.py

หลักการ: หาก้อนหมึกที่ติดกัน (ขยายหมึกออกก่อนนิดหน่อยให้ชิ้นส่วนใกล้ๆ เช่น แว่นสองข้าง รวมเป็นก้อนเดียว)
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
INCOMING = ROOT / 'assets' / 'incoming'
WHITE = 235
SCALE = 4          # หาก้อนบนภาพย่อ 4 เท่า เร็วกว่ามาก ตำแหน่งคูณกลับทีหลัง
GROW = 3           # ขยายหมึก (พิกเซลบนภาพย่อ) ให้ชิ้นส่วนที่ห่างกันเล็กน้อยรวมกัน
MIN_AREA = 150     # ก้อนเล็กกว่านี้ (บนภาพย่อ) ถือว่าเป็นเศษ ไม่เอา
PAD = 12           # ขอบเผื่อรอบก้อนตอนครอป (พิกเซลจริง)


def find_blobs(im):
    small = im.convert('L').resize((im.width // SCALE, im.height // SCALE), Image.BOX)
    mask = small.point(lambda v: 255 if v < WHITE else 0).filter(ImageFilter.MaxFilter(GROW))
    w, h = mask.size
    px = mask.load()
    seen = bytearray(w * h)
    blobs = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0 * w + x0] or not px[x0, y0]:
                continue
            q = deque([(x0, y0)])
            seen[y0 * w + x0] = 1
            xs, ys, area = [x0], [y0], 0
            while q:
                x, y = q.popleft()
                area += 1
                xs.append(x); ys.append(y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny]:
                        seen[ny * w + nx] = 1
                        q.append((nx, ny))
            if area >= MIN_AREA:
                blobs.append((min(xs) * SCALE - PAD, min(ys) * SCALE - PAD, (max(xs) + 1) * SCALE + PAD, (max(ys) + 1) * SCALE + PAD, list(zip(xs, ys))))
    # เรียงเป็นแถวก่อน (ก้อนที่จุดกึ่งกลาง y ใกล้กันถือว่าแถวเดียวกัน) แล้วซ้าย→ขวา
    blobs.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows, band = [], []
    for b in blobs:
        cy = (b[1] + b[3]) / 2
        if band and abs(cy - (band[0][1] + band[0][3]) / 2) > im.height * 0.08:
            rows.append(sorted(band, key=lambda b: b[0]))
            band = []
        band.append(b)
    if band:
        rows.append(sorted(band, key=lambda b: b[0]))
    return [b for row in rows for b in row]


if __name__ == '__main__':
    args = sys.argv[1:]
    grid = None
    while args and args[0].startswith('--'):
        flag = args.pop(0)
        if flag == '--grid':
            rows, cols = map(int, args.pop(0).lower().split('x'))
            grid = (rows, cols)
        elif flag == '--grow':
            GROW = int(args.pop(0)) | 1   # MaxFilter ต้องเป็นเลขคี่
    src = Path(args[0])
    if not src.is_absolute():
        src = ROOT / src
    names = args[1:]
    im = Image.open(src).convert('RGB')
    if grid:
        rows, cols = grid
        cw, ch = im.width / cols, im.height / rows
        for i, name in enumerate(names[:rows * cols]):
            r, c = divmod(i, cols)
            box = (int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch))
            print(f'{i + 1:2}. ช่อง แถว {r + 1} คอลัมน์ {c + 1}' + (f' -> {name}' if name != '-' else ' (ข้าม)'))
            if name != '-':
                im.crop(box).save(INCOMING / f'{name}.png')
        sys.exit()
    blobs = find_blobs(im)
    for i, b in enumerate(blobs):
        box = (max(0, b[0]), max(0, b[1]), min(im.width, b[2]), min(im.height, b[3]))
        name = names[i] if i < len(names) else None
        print(f'{i + 1:2}. กึ่งกลาง ({(box[0] + box[2]) // 2}, {(box[1] + box[3]) // 2}) ขนาด {box[2] - box[0]}x{box[3] - box[1]}' + (f' -> {name}' if name else ''))
        if name and name != '-':
            # ทาสีขาวทับทุกอย่างนอกก้อนนี้ จะได้ไม่ติดเศษของชิ้นข้างๆ ที่โผล่เข้ามาในกรอบครอป
            keep = Image.new('L', (im.width // SCALE, im.height // SCALE), 0)
            keep.putdata([0] * (keep.width * keep.height))
            kp = keep.load()
            for x, y in b[4]:
                kp[x, y] = 255
            keep = keep.resize(im.size, Image.NEAREST).filter(ImageFilter.MaxFilter(2 * SCALE + 1))
            piece = Image.composite(im, Image.new('RGB', im.size, (255, 255, 255)), keep)
            piece.crop(box).save(INCOMING / f'{name}.png')
