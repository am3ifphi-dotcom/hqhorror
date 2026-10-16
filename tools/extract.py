#!/usr/bin/env python3
"""Split a sprite sheet into its individual objects automatically.

Most LPC prop sheets contain several unrelated objects with transparent
padding between them, so a flood fill over the alpha channel isolates them
nicely.  Use ``--write DIR`` to dump the parts as individual PNGs.

    python3 tools/extract.py <sheet.png> [--cols 90] [--preview]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

RAMP = " .:-=+*#%@"


def components(im: Image.Image, pad: int = 1):
    """Connected components of the alpha channel, rectangles only."""
    W, H = im.size
    a = im.split()[3]
    mask = a.load()
    seen = [[False] * H for _ in range(W)]
    boxes = []
    for sy in range(H):
        for sx in range(W):
            if seen[sx][sy] or mask[sx, sy] < 8:
                continue
            stack = [(sx, sy)]
            seen[sx][sy] = True
            x0, y0, x1, y1 = sx, sy, sx, sy
            while stack:
                x, y = stack.pop()
                if x < x0:
                    x0 = x
                if x > x1:
                    x1 = x
                if y < y0:
                    y0 = y
                if y > y1:
                    y1 = y
                for dx in range(-pad, pad + 1):
                    for dy in range(-pad, pad + 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < W and 0 <= ny < H and not seen[nx][ny]:
                            if mask[nx, ny] >= 8:
                                seen[nx][ny] = True
                                stack.append((nx, ny))
            boxes.append((x0, y0, x1 - x0 + 1, y1 - y0 + 1))
    boxes.sort(key=lambda b: (b[1] // 24, b[0]))
    return boxes


def ascii_of(im: Image.Image, cols: int = 14) -> list[str]:
    w, h = im.size
    rows = max(1, int(cols * h / w * 0.5))
    small = im.resize((cols, rows), Image.LANCZOS)
    px = small.load()
    out = []
    for y in range(rows):
        line = ""
        for x in range(cols):
            r, g, b, al = px[x, y]
            if al < 24:
                line += " "
            else:
                lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                line += RAMP[min(len(RAMP) - 1, int(lum * len(RAMP)))]
        out.append(line)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("--cols", type=int, default=14)
    ap.add_argument("--per-row", type=int, default=5)
    ap.add_argument("--min-size", type=int, default=6)
    ap.add_argument("--pad", type=int, default=1)
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--write", default="")
    args = ap.parse_args()

    im = Image.open(args.sheet).convert("RGBA")
    boxes = [b for b in components(im) if b[2] >= args.min_size and b[3] >= args.min_size]
    print(f"# {args.sheet} {im.size[0]}x{im.size[1]}  ->  {len(boxes)} objects", file=sys.stderr)

    parts = []
    for i, (x, y, w, h) in enumerate(boxes):
        crop = im.crop((x, y, x + w, y + h))
        parts.append((i, (x, y, w, h), crop))
        if args.write:
            out = Path(args.write)
            out.mkdir(parents=True, exist_ok=True)
            crop.save(out / f"{Path(args.sheet).stem}_{i:02d}.png")

    if args.preview:
        for i in range(0, len(parts), args.per_row):
            chunk = parts[i : i + args.per_row]
            print("".join(f"[{idx}] {b[2]}x{b[3]} @{b[0]},{b[1]}".ljust(args.cols + 10) for idx, b, _ in chunk))
            height = max(len(ascii_of(c, args.cols)) for _, _, c in chunk)
            for r in range(height):
                line = ""
                for _, _, c in chunk:
                    art = ascii_of(c, args.cols)
                    line += (art[r] if r < len(art) else "").ljust(args.cols + 10)
                print(line.rstrip())
            print()
    else:
        for idx, b, _ in parts:
            print(f"{idx:3d}  {b[2]:4d}x{b[3]:4d}  @{b[0]:4d},{b[1]:4d}")


if __name__ == "__main__":
    main()
