#!/usr/bin/env python3
"""Write required Expo icon PNGs if missing (stdlib only)."""
import struct
import zlib
from pathlib import Path

def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

def solid_png(w: int, h: int, rgb=(26, 26, 46), accent=(59, 130, 246)) -> bytes:
    rows = []
    for y in range(h):
        row = bytearray([0])  # filter none
        for x in range(w):
            m = min(w, h) // 5
            if m <= x < w - m and m <= y < h - m:
                if w // 3 <= x < 2 * w // 3 and h // 3 <= y < 2 * h // 3:
                    row.extend(accent)
                else:
                    border = max(2, w // 64)
                    if x < m + border or x >= w - m - border or y < m + border or y >= h - m - border:
                        row.extend(accent)
                    else:
                        row.extend(rgb)
            else:
                row.extend(rgb)
        rows.append(bytes(row))
    raw = b"".join(rows)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8-bit RGB
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")

def main() -> None:
    root = Path("assets")
    root.mkdir(exist_ok=True)
    specs = {
        "icon.png": 1024,
        "adaptive-icon.png": 1024,
        "splash-icon.png": 512,
        "favicon.png": 48,
    }
    for name, size in specs.items():
        path = root / name
        data = solid_png(size, size)
        path.write_bytes(data)
        print(f"wrote {path} ({len(data)} bytes)")

if __name__ == "__main__":
    main()
