#!/usr/bin/env python3
"""Generate Inventory Manager app icons. Requires: pip install pillow"""
from pathlib import Path
try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit("Install pillow: pip install pillow")

OUT = Path(__file__).resolve().parent
BG, ACCENT, WHITE = (26, 26, 46), (59, 130, 246), (249, 250, 251)

def draw_box_icon(size: int, with_badge: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), (*BG, 255))
    d = ImageDraw.Draw(img)
    s = size
    box_m = int(s * 0.22)
    box_w = s - 2 * box_m
    box_h = int(box_w * 0.72)
    top = int(s * 0.28)
    d.rounded_rectangle([box_m + s // 40, top + s // 40, box_m + box_w + s // 40, top + box_h + s // 40], radius=s // 16, fill=(0, 0, 0, 60))
    d.rounded_rectangle([box_m, top, box_m + box_w, top + box_h], radius=s // 16, fill=ACCENT)
    lid_h = int(box_h * 0.28)
    d.rounded_rectangle([box_m, top, box_m + box_w, top + lid_h], radius=s // 16, fill=(37, 99, 235))
    cx = box_m + box_w // 2
    tape_w = max(2, s // 28)
    d.rectangle([cx - tape_w, top, cx + tape_w, top + box_h], fill=WHITE)
    d.rectangle([box_m + box_w // 5, top + lid_h // 2 - tape_w, box_m + box_w - box_w // 5, top + lid_h // 2 + tape_w], fill=WHITE)
    by = top + int(box_h * 0.55)
    for i in range(5):
        x = box_m + int(box_w * 0.55) + i * max(2, s // 40)
        h = int(box_h * 0.18) if i % 2 == 0 else int(box_h * 0.12)
        d.rectangle([x, by, x + max(1, s // 50), by + h], fill=(255, 255, 255, 180))
    if with_badge:
        r = s // 7
        d.ellipse([s - r * 2 - s // 16, s // 16, s - s // 16, s // 16 + r * 2], fill=WHITE)
        bx, by = s - r - s // 16, s // 16 + r
        for pts in [
            [(bx - r // 3, by - r // 3), (bx - r // 3, by + r // 3)],
            [(bx + r // 3, by - r // 3), (bx + r // 3, by + r // 3)],
            [(bx - r // 2, by - r // 4), (bx + r // 2, by - r // 4)],
            [(bx - r // 2, by + r // 4), (bx + r // 2, by + r // 4)],
        ]:
            d.line(pts, fill=ACCENT, width=max(2, s // 40))
    return img.convert("RGB")

draw_box_icon(1024, True).save(OUT / "icon.png", "PNG", optimize=True)
draw_box_icon(1024, False).save(OUT / "adaptive-icon.png", "PNG", optimize=True)
draw_box_icon(512, True).save(OUT / "splash-icon.png", "PNG", optimize=True)
draw_box_icon(48, True).save(OUT / "favicon.png", "PNG", optimize=True)
print("Generated icons in", OUT)
