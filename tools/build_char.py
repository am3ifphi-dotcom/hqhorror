#!/usr/bin/env python3
"""Compose the protagonist's (and the wraith's) LPC part-sheets into ready to
use spritesheets.

Source parts come from the LPC Revised collection (OGA-BY 3.0) — see
tools/fetch_lpc.sh.  Every part sheet shares the same layout::

    <anim>.png  = 64x64 frames, 4 rows (facing up / left / down / right)
                  N columns (frames)

We alpha-composite the layers per frame and write one sheet per animation.
"""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "vendor_raw" / "lpc"
OUT = ROOT / "public" / "assets" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

FRAME = 64

# bottom -> top
GIRL_LAYERS = ["body", "legs", "feet", "torso", "head", "brow", "hair"]
WRAITH_LAYERS = ["body", "legs", "torso", "head", "hair"]

ANIMS = {
    "walk": "Walk",
    "run": "Run",
    "idle": "Idle",
    "emote": "Emotes",
    "sit": "Sitting",
    "climb": "Climb",
}


def load(part: str, anim: str, sub: str) -> Image.Image | None:
    p = SRC / sub / f"{part}_{anim}.png"
    if not p.exists():
        return None
    return Image.open(p).convert("RGBA")


def compose(sub: str, anim: str, layers: list[str]) -> Image.Image | None:
    sheets = [(n, load(n, anim, sub)) for n in layers]
    sheets = [(n, s) for n, s in sheets if s is not None]
    if not sheets:
        return None
    w, h = sheets[0][1].size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for _, s in sheets:
        out.alpha_composite(s)
    return out


def tint_ghost(img: Image.Image) -> Image.Image:
    """Bleach the wraith: desaturate, cool the shadows, drop opacity a little."""
    r, g, b, a = img.split()
    import PIL.ImageEnhance as IE

    rgb = Image.merge("RGB", (r, g, b))
    rgb = IE.Color(rgb).enhance(0.25)
    # push towards a cold cyan-white
    rr, gg, bb = rgb.split()
    rr = rr.point(lambda v: min(255, int(v * 0.72 + 26)))
    gg = gg.point(lambda v: min(255, int(v * 0.86 + 40)))
    bb = bb.point(lambda v: min(255, int(v * 0.95 + 56)))
    rgb = Image.merge("RGB", (rr, gg, bb))
    rgb = IE.Contrast(rgb).enhance(1.25)
    a = a.point(lambda v: int(v * 0.80))
    out = Image.merge("RGBA", (*rgb.split(), a))
    return out


def main() -> None:
    for sub, layers, prefix, post in (
        ("char", GIRL_LAYERS, "girl", None),
        ("wraith", WRAITH_LAYERS, "wraith", tint_ghost),
    ):
        for name, anim in ANIMS.items():
            sheet = compose(sub, anim, layers)
            if sheet is None:
                print(f"  skip {prefix}_{name}")
                continue
            if post:
                sheet = post(sheet)
            dst = OUT / f"{prefix}_{name}.png"
            sheet.save(dst)
            cols, rows = sheet.width // FRAME, sheet.height // FRAME
            print(f"  {dst.name:24s} {sheet.width}x{sheet.height}  ({cols}f x {rows}dir)")


if __name__ == "__main__":
    main()
