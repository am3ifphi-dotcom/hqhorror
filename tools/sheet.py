#!/usr/bin/env python3
"""Dump a tile sheet tile-by-tile as ASCII, so the layout can be inspected
without opening an image viewer.

    python3 tools/sheet.py <image.png> <tileSize> [maxTiles] [perRow]

Every tile is rendered as a small ASCII block with its index above it.
"""
from __future__ import annotations

import sys

from PIL import Image

RAMP = " .:-=+*#%@"


def tile_ascii(im: Image.Image, tw: int, th: int, cols: int = 16) -> list[str]:
    rows = max(1, int(cols * th / tw * 0.5))
    small = im.resize((cols, rows), Image.LANCZOS)
    px = small.load()
    out = []
    for y in range(rows):
        line = ""
        for x in range(cols):
            r, g, b, a = px[x, y]
            if a < 24:
                line += " "
            else:
                lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                line += RAMP[min(len(RAMP) - 1, int(lum * len(RAMP)))]
        out.append(line)
    return out


def main() -> None:
    path = sys.argv[1]
    ts = int(sys.argv[2]) if len(sys.argv) > 2 else 32
    maxt = int(sys.argv[3]) if len(sys.argv) > 3 else 40
    per_row = int(sys.argv[4]) if len(sys.argv) > 4 else 6
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    n = 0
    blocks = []
    for ty in range(0, H, ts):
        for tx in range(0, W, ts):
            if n >= maxt:
                break
            crop = im.crop((tx, ty, min(tx + ts, W), min(ty + ts, H)))
            a = crop.split()[3]
            if a.getextrema()[1] == 0:
                blocks.append((n, ["(empty)"] + [""] * 7))
            else:
                blocks.append((n, tile_ascii(crop, ts, ts, 16)))
            n += 1
    print(f"# {path}  {W}x{H}  tile={ts}  ({W//ts} x {H//ts})")
    for i in range(0, len(blocks), per_row):
        chunk = blocks[i : i + per_row]
        header = "".join(("#" + str(idx)).ljust(18)[:18] for idx, _ in chunk)
        print(header)
        height = max(len(b) for _, b in chunk)
        for r in range(height):
            line = ""
            for _, b in chunk:
                line += (b[r] if r < len(b) else "").ljust(18)
            print(line.rstrip())
        print()


if __name__ == "__main__":
    main()
