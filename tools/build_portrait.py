#!/usr/bin/env python3
"""Key out the flat studio background of a generated portrait and crop it.

The portraits are produced with a deliberately flat mid-grey backdrop so it
can be removed cleanly: we flood fill from the border (so interior pixels of a
similar colour are never touched) and then build a soft, colour-decontaminated
alpha edge.
"""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "portrait"
OUT = ROOT / "public" / "assets" / "portrait"

TARGET_H = 1100


def process(path: Path, out: Path, feather: float = 7.0, ramp: float = 14.0) -> None:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()

    # background reference colour = median of the border
    samples = []
    for x in range(0, w, 5):
        samples.append(px[x, 1][:3])
        samples.append(px[x, h - 2][:3])
    for y in range(0, h, 5):
        samples.append(px[1, y][:3])
        samples.append(px[w - 2, y][:3])
    bg = tuple(sorted(s[i] for s in samples)[len(samples) // 2] for i in range(3))

    HARD = 10  # anything further than this from bg is definitely foreground
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))

    reach = bytearray(w * h)  # pixels connected to the background
    while q:
        x, y = q.popleft()
        r, g, b, _a = px[x, y]
        d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
        if d > HARD:
            continue
        reach[y * w + x] = 1
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                seen[ny * w + nx] = 1
                q.append((nx, ny))

    alpha = im.split()[3].load()
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not reach[i]:
                continue
            r, g, b, a = px[x, y]
            d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
            t = (d - feather) / ramp
            if t >= 1:
                continue
            t = max(0.0, t)
            # colour decontamination: un-mix the background
            if t > 0.02:
                r = int(min(255, max(0, (r - (1 - t) * bg[0]) / t)))
                g = int(min(255, max(0, (g - (1 - t) * bg[1]) / t)))
                b = int(min(255, max(0, (b - (1 - t) * bg[2]) / t)))
                px[x, y] = (r, g, b, a)
            px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], int(a * t))

    # drop specks / edge artefacts: keep only the largest connected blob
    w, h = im.size
    a = im.split()[3].load()
    seen = bytearray(w * h)
    best: list[tuple[int, int]] = []
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or a[sx, sy] < 30:
                continue
            seen[i] = 1
            stack = [(sx, sy)]
            blob = []
            while stack:
                x, y = stack.pop()
                blob.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    j = ny * w + nx
                    if 0 <= nx < w and 0 <= ny < h and not seen[j] and a[nx, ny] >= 30:
                        seen[j] = 1
                        stack.append((nx, ny))
            if len(blob) > len(best):
                best = blob
    if best:
        keep = set(best)
        for y in range(h):
            for x in range(w):
                if (x, y) not in keep:
                    r, g, b, _ = px[x, y]
                    px[x, y] = (r, g, b, 0)

    bbox = im.getbbox()
    im = im.crop(bbox)
    if im.height > TARGET_H:
        im = im.resize((int(im.width * TARGET_H / im.height), TARGET_H), Image.LANCZOS)
    # kill any remaining 1px halo
    a = im.split()[3].point(lambda v: 0 if v < 12 else v)
    im.putalpha(a.filter(ImageFilter.GaussianBlur(0.4)))
    im.save(out, optimize=True)
    print(f"{path.name} bg={bg} -> {out.name} {im.width}x{im.height}")


if __name__ == "__main__":
    names = sys.argv[1:] or [p.stem for p in SRC.glob("*_raw.png")]
    for n in names:
        p = SRC / (n if n.endswith(".png") else n + "_raw.png")
        process(p, OUT / (p.stem.replace("_raw", "") + ".png"))
