"""ตัดพื้นหลังขาวของรูปจาก Gemini ให้เป็น PNG โปร่งใส แล้วย่อให้พอดีใช้ในเกม

วิธีใช้ (จากโฟลเดอร์โปรเจกต์):
    python design/cutout.py                 # แปลงทุกไฟล์ใน assets/incoming/
    python design/cutout.py dish-omelet     # แปลงเฉพาะไฟล์ที่ระบุ (ไม่ต้องใส่นามสกุล)
    python design/cutout.py --shadow dish-cake   # รูปที่ Gemini แถมเงาจางๆ ที่พื้นมา: นับพิกเซลสว่างสีเทา/ฟ้าอ่อนเป็นพื้นด้วย

ปลายทางเลือกจากคำนำหน้าชื่อไฟล์ (ดูตาราง KINDS):
    dish-omelet.jpg      -> assets/dishes/omelet.png       512px
    appliance-pan.jpg    -> assets/appliances/pan.png      640px
    ing-egg.png          -> assets/ingredients/egg.png     320px
    tool-whisk.png       -> assets/tools/whisk.png         320px
    top-cherry.png       -> assets/toppings/cherry.png     192px
    friend-cat.jpg       -> assets/friends/cat.png         800px

หลักการ: flood fill จากขอบรูปเข้ามา เก็บเฉพาะพื้นที่สีขาวที่ "ต่อกับขอบ" เป็นพื้นหลัง
ส่วนสีขาวที่อยู่ในตัวละคร (ท้อง หน้า) ไม่โดนเพราะไม่ต่อกับขอบ
ต้องมี Pillow: python -m pip install pillow
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
INCOMING = ROOT / 'assets' / 'incoming'
SIZE = 800
# คำนำหน้า -> (โฟลเดอร์ปลายทาง, ขนาด px) — ขนาดเผื่อจอ 2x ของขนาดที่โชว์ในเกมแล้ว
KINDS = {
    'dish': ('dishes', 512),
    'appliance': ('appliances', 640),
    'ing': ('ingredients', 320),
    'tool': ('tools', 320),
    'top': ('toppings', 192),
    'friend': ('friends', 800),
}
WHITE = 238         # ทุก channel >= ค่านี้ถือว่าเป็นพื้นขาว (JPEG มี noise นิดหน่อย)
MARGIN = 0.04       # ขอบว่างรอบตัวละคร (สัดส่วนของด้าน)


SHADOW_MIN = 200    # โหมด --shadow: สว่างกว่านี้และเกือบไม่มีสี (max-min <= SHADOW_SAT) ถือเป็นเงาจางๆ = พื้น
SHADOW_SAT = 30


def background_mask(im, shadow=False):
    """คืน mask (L) 255 = พื้นหลัง โดย flood fill จากพิกเซลขอบที่เป็นสีขาว"""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    q = deque()

    def is_white(x, y):
        r, g, b = px[x, y][:3]
        if r >= WHITE and g >= WHITE and b >= WHITE:
            return True
        return shadow and min(r, g, b) >= SHADOW_MIN and max(r, g, b) - min(r, g, b) <= SHADOW_SAT

    for x in range(w):
        for y in (0, h - 1):
            if is_white(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_white(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_white(nx, ny):
                seen[ny * w + nx] = 1
                q.append((nx, ny))
    return Image.frombytes('L', (w, h), bytes(255 if s else 0 for s in seen))


def cutout(src: Path, dst: Path, size=SIZE, shadow=False):
    im = Image.open(src).convert('RGB')
    bg = background_mask(im, shadow)
    alpha = Image.eval(bg, lambda v: 255 - v)
    # ขอบนุ่มนิดหน่อยจะได้ไม่เป็นขั้นบันได แล้วกินขอบขาวที่ติดมา 1px
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    finish(out, dst, size)


def finish(out: Image.Image, dst: Path, size=SIZE):
    """ครอปให้พอดีตัว เติมขอบ ทำเป็นสี่เหลี่ยมจัตุรัส ย่อ แล้วเซฟ PNG"""
    box = out.getbbox()
    if box:
        out = out.crop(box)
    w, h = out.size
    side = int(max(w, h) * (1 + MARGIN * 2))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(out, ((side - w) // 2, (side - h) // 2))
    size = min(size, side)   # ไม่ขยายรูปเล็ก (เช่นชิ้นที่ตัดจากแผ่นรวม) ให้ใหญ่กว่าต้นฉบับ
    canvas = canvas.resize((size, size), Image.LANCZOS)
    # ลดเหลือ 256 สี (ยังมีความโปร่งใส) ไฟล์เล็กลง ~5 เท่า ตาเปล่าแยกไม่ออกกับงานสีไม้แบบนี้
    canvas = canvas.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, 'PNG', optimize=True)
    print(f'{dst.relative_to(ROOT)}  {size}x{size}  {dst.stat().st_size // 1024} KB')


def main(args):
    shadow = '--shadow' in args
    names = set(a for a in args if not a.startswith('--'))
    files = [p for p in sorted(INCOMING.iterdir()) if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp') and (not names or p.stem in names)]
    if not files:
        print('ไม่พบไฟล์ใน assets/incoming/')
        return
    for src in files:
        prefix, _, name = src.stem.partition('-')
        if prefix not in KINDS or not name:
            print(f'ข้าม {src.name}: ชื่อต้องขึ้นต้นด้วย {"/".join(KINDS)}-')
            continue
        folder, size = KINDS[prefix]
        cutout(src, ROOT / 'assets' / folder / f'{name}.png', size=size, shadow=shadow)


if __name__ == '__main__':
    main(sys.argv[1:])
