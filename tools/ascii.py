#!/usr/bin/env python3
"""Print an image as ASCII so it can be inspected without a viewer.

    python3 tools/ascii.py vendor_raw/lpc/furniture/Chest.png [cols] [crop:x,y,w,h]
"""
from __future__ import annotations

import sys

from PIL import Image

RAMP = " .:-=+*#%@"


def main() -> None:
    path = sys.argv[1]
    crop = None
    cols = 64
    for arg in sys.argv[2:]:
        if arg.startswith("crop:"):
            crop = tuple(int(v) for v in arg[5:].split(","))
        else:
            cols = int(arg)
    im = Image.open(path).convert("RGBA")
    if crop:
        im = im.crop((crop[0], crop[1], crop[0] + crop[2], crop[1] + crop[3]))
    w, h = im.size
    rows = max(1, int(cols * h / w * 0.5))
    small = im.resize((cols, rows), Image.LANCZOS)
    px = small.load()
    print(f"# {path}  {w}x{h}  -> {cols}x{rows}")
    for y in range(rows):
        line = ""
        for x in range(cols):
            r, g, b, a = px[x, y]
            if a < 24:
                line += " "
            else:
                lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                line += RAMP[min(len(RAMP) - 1, int(lum * len(RAMP)))]
        print(line)


if __name__ == "__main__":
    main()
