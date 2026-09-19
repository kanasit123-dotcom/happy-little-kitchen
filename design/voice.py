"""สร้างไฟล์เสียงพูดภาษาไทยล่วงหน้า (Microsoft Neural: th-TH-PremwadeeNeural ผ่าน edge-tts)
เก็บที่ assets/voice/th/<hash>.mp3 + manifest.json (ข้อความ → ไฟล์) เกมจะเล่นไฟล์นี้แทนเสียงในเครื่อง

ใช้:  pip install edge-tts   แล้ว   python design/voice.py
สร้างเฉพาะประโยคที่ยังไม่มีไฟล์ — เพิ่มข้อความไทยใน js/app.js แล้วรันซ้ำได้เลย
"""
import asyncio
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'voice' / 'th'
VOICE = 'th-TH-PremwadeeNeural'
RATE, PITCH = '-10%', '+10Hz'
STRING = r"'((?:[^'\\]|\\.)+)'"
THAI = re.compile('[฀-๿]')


def collect():
    src = (ROOT / 'js' / 'app.js').read_text(encoding='utf-8')
    texts = set(re.findall(r"th: " + STRING, src))
    block = src[src.index('const COPY = {'):]
    block = block[block.index('th: {'):block.index('\n  en: {')]
    texts.update(re.findall(STRING, block))
    return sorted(t.replace("\\'", "'") for t in texts if THAI.search(t))


def spoken(text):
    """ข้อความที่ส่งให้ TTS: ตัดอีโมจิ/สัญลักษณ์ออก"""
    chars = [' ' if (0x1F000 <= ord(c) <= 0x1FFFF or 0x2600 <= ord(c) <= 0x27BF or c in '️·') else c for c in text]
    return re.sub(r'\s+', ' ', ''.join(chars)).strip()


async def main():
    import edge_tts
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    todo = []
    for text in collect():
        name = hashlib.md5(text.encode('utf-8')).hexdigest()[:10] + '.mp3'
        manifest[text] = name
        if not (OUT / name).exists():
            todo.append((text, name))
    print(f'{len(manifest)} phrases, {len(todo)} to generate')
    for text, name in todo:
        await edge_tts.Communicate(spoken(text), VOICE, rate=RATE, pitch=PITCH).save(str(OUT / name))
        print(' ', name, text)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding='utf-8')
    # รายชื่อไฟล์ใน sw.js ให้เล่น offline ได้
    sw = ROOT / 'sw.js'
    text = sw.read_text(encoding='utf-8')
    start = text.index('  // voice-start')
    start = text.index('\n', start) + 1
    end = text.index('  // voice-end')
    lines = [f"  'assets/voice/th/{name}',\n" for name in ['manifest.json'] + sorted(manifest.values())]
    sw.write_text(text[:start] + ''.join(lines) + text[end:], encoding='utf-8', newline='\n')
    keep = set(manifest.values()) | {'manifest.json'}
    for f in OUT.iterdir():
        if f.name not in keep:
            f.unlink()
            print('  removed', f.name)


asyncio.run(main())
