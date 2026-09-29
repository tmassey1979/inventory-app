#!/usr/bin/env python3
"""Write Dragon Inventory icon PNGs (stdlib only)."""
import struct
import zlib
from pathlib import Path

def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

def dragon_png(w: int, h: int) -> bytes:
    bg = (15, 12, 28)
    body = (34, 197, 94)
    accent = (250, 204, 21)
    wing = (22, 163, 74)
    rows = []
    for y in range(h):
        row = bytearray([0])
        for x in range(w):
            nx, ny = x / w, y / h
            r, g, b = bg
            cx, cy, rx, ry = 0.48, 0.55, 0.22, 0.28
            in_body = ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2 <= 1.0
            hx, hy, hr = 0.62, 0.32, 0.14
            in_head = (nx - hx) ** 2 + (ny - hy) ** 2 <= hr ** 2
            in_wing = (
                0.18 < nx < 0.48
                and 0.28 < ny < 0.55
                and (nx - 0.18) < (0.55 - ny) * 0.9
            )
            in_tail = (
                0.22 < nx < 0.40
                and 0.62 < ny < 0.88
                and abs((nx - 0.28) - (ny - 0.75) * 0.4) < 0.06
            )
            in_eye = (nx - 0.66) ** 2 + (ny - 0.30) ** 2 <= (0.025) ** 2
            in_horn = (
                0.58 < nx < 0.68
                and 0.16 < ny < 0.28
                and abs(nx - 0.63) < 0.03 - (0.28 - ny) * 0.15
            )
            if in_eye or in_horn:
                r, g, b = accent
            elif in_wing:
                r, g, b = wing
            elif in_head or in_body or in_tail:
                r, g, b = body
            row.extend((r, g, b))
        rows.append(bytes(row))
    raw = b"".join(rows)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")

def main() -> None:
    root = Path("assets")
    root.mkdir(exist_ok=True)
    for name, size in {
        "icon.png": 1024,
        "adaptive-icon.png": 1024,
        "splash-icon.png": 512,
        "favicon.png": 48,
    }.items():
        data = dragon_png(size, size)
        path = root / name
        path.write_bytes(data)
        print(f"wrote {path} ({len(data)} bytes)")

if __name__ == "__main__":
    main()
