#!/usr/bin/env python3
"""Slice the LPC Revised source sheets into one packed atlas + json manifest.

Everything here is derived from the sheets pulled by tools/fetch_lpc.sh
(OGA-BY 3.0).  Tiles are 32x32 grid slices; props are explicit rectangles
``(sheet, x, y, w, h)`` or ``("auto", index)`` to take the n-th connected
component of a sheet.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageEnhance

sys.path.insert(0, str(Path(__file__).parent))
from extract import components  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "vendor_raw" / "lpc"
OUT = ROOT / "public" / "assets"

# --------------------------------------------------------------------------
# 32x32 tiles:  name -> (sheet, tileX, tileY)
# --------------------------------------------------------------------------
TILES: dict[str, tuple[str, int, int]] = {
    "floor_wood":   ("structure/floor_Wood_Floor_A.png", 1, 0),
    "floor_wood2":  ("structure/floor_Wood_Floor_A.png", 2, 0),
    "floor_wood3":  ("structure/floor_Wood_Floor_A.png", 3, 0),
    "floor_wood4":  ("structure/floor_Wood_Floor_A.png", 1, 1),
    "floor_wood5":  ("structure/floor_Wood_Floor_A.png", 2, 1),
    "floor_wood6":  ("structure/floor_Wood_Floor_A.png", 3, 2),
    "floor_plank":  ("structure/floor_Wood_Floor_B.png", 0, 0),
    "floor_plank2": ("structure/floor_Wood_Floor_B.png", 1, 0),
    "floor_herring":  ("structure/floor_Herringbone_A.png", 0, 0),
    "floor_herring2": ("structure/floor_Herringbone_A.png", 1, 0),
    "floor_tile":   ("structure/floor_Tile_A.png", 0, 0),
    "floor_tile2":  ("structure/floor_Tile_A.png", 1, 0),
    "floor_tile3":  ("structure/floor_Tile_A.png", 0, 1),
    "floor_tile_d": ("structure/floor_Tile_A.png", 0, 3),
    "floor_tile_d2":("structure/floor_Tile_A.png", 1, 3),
    "floor_dirt":   ("structure/floor_Gritty_Dirt.png", 0, 0),
    "floor_dirt2":  ("structure/floor_Gritty_Dirt.png", 1, 0),
    "floor_dirt3":  ("structure/floor_Gritty_Dirt.png", 0, 1),
    "floor_sub":    ("structure/floor_Subfloor.png", 0, 0),
    "wall_plaster":   ("structure/wall_Drywall.png", 0, 1),
    "wall_plaster2":  ("structure/wall_Drywall.png", 1, 1),
    "wall_plaster3":  ("structure/wall_Drywall.png", 2, 1),
    "wall_plaster_top": ("structure/wall_Drywall.png", 0, 0),
    "wall_panel":   ("structure/wall_Panels_A.png", 1, 0),
    "wall_panel2":  ("structure/wall_Panels_A.png", 2, 0),
    "wall_panel_b": ("structure/wall_Panels_A.png", 1, 1),
    "wall_panel_o": ("structure/wall_Panels_A.png", 0, 0),
    "wall_brick":   ("structure/wall_Brick_Wall_A.png", 0, 1),
    "wall_brick2":  ("structure/wall_Brick_Wall_A.png", 1, 1),
    "wall_brick_d": ("structure/wall_Brick_Wall_A.png", 3, 1),
    "wall_brick_d2":("structure/wall_Brick_Wall_A.png", 4, 1),
    "wall_stone":   ("structure/wall_Jagged_Stone_Walls.png", 0, 1),
    "wall_stone2":  ("structure/wall_Jagged_Stone_Walls.png", 1, 1),
    "wall_stone_d": ("structure/wall_Jagged_Stone_Walls.png", 3, 1),
}

# --------------------------------------------------------------------------
# Props: name -> (sheet, x, y, w, h, ax, ay, cw, ch)
#   ax/ay  = anchor as a fraction of the sprite (0.5/1.0 == bottom centre)
#   cw/ch  = collision footprint in pixels, centred on the anchor
# --------------------------------------------------------------------------
PROPS: dict[str, tuple] = {
    "clock":      ("furniture/Clock_Grandfather.png", 7, 22, 18, 71, .5, 1, 16, 10),
    "chest":      ("furniture/Chest.png", 0, 0, 64, 64, .5, 1, 56, 12),
    "mirror_s":   ("furniture/Mirror_Standing.png", 14, 2, 39, 62, .5, 1, 26, 8),
    "fireplace":  ("furniture/Fireplace.png", 1, 16, 94, 72, .5, 1, 84, 14),
    "barrel":     ("furniture/Barrel.png", 2, 10, 28, 37, .5, 1, 24, 10),
    "barrel_big": ("furniture/Barrel.png", 96, 2, 48, 61, .5, 1, 40, 14),
    "crate_stack":("furniture/Crate.png", 0, 0, 32, 64, .5, 1, 28, 12),
    "crate":      ("furniture/Crate.png", 69, 37, 22, 24, .5, 1, 20, 8),
    "table":      ("furniture/End_Table.png", 6, 163, 20, 24, .5, 1, 18, 8),
    "table2":     ("furniture/End_Table.png", 6, 3, 20, 24, .5, 1, 18, 8),
    "chair_f":    ("furniture/Chair_Dining_A.png", 128, 32, 32, 32, .5, .97, 16, 8),
    "chair_b":    ("furniture/Chair_Dining_A.png", 0, 0, 32, 32, .5, .97, 16, 8),
    "chair_s":    ("furniture/Chair_Dining_A.png", 32, 0, 32, 32, .5, .97, 16, 8),
    "sofa_f":     ("furniture/Chair_Sofa_A.png", 96, 32, 32, 32, .5, .97, 30, 10),
    "sofa_s":     ("furniture/Chair_Sofa_A.png", 36, 0, 32, 32, .5, .97, 30, 10),
    "stool":      ("furniture/Bar_Stools.png", 196, 0, 24, 32, .5, 1, 18, 8),
    "lamp":       ("furniture/Lighting_Floor.png", 0, 64, 31, 52, .5, 1, 18, 8),
    "candlestand":("furniture/Lighting_Floor.png", 7, 128, 18, 52, .5, 1, 12, 6),
    "desk":       ("furniture/Desk_Office.png", 198, 0, 52, 90, .5, 1, 48, 14),
    "counter":    ("furniture/Desk_Office.png", 0, 12, 96, 40, .5, 1, 90, 14),
    "cabinet":    ("furniture/Cabinet.png", 2, 208, 28, 56, .5, 1, 24, 10),
    "shelf":      ("furniture/Cabinet.png", 96, 208, 32, 27, .5, 1, 30, 8),
    "bed":        ("furniture/Beds_Single__A.png", 64, 0, 64, 64, .5, 1, 56, 14),
    "headboard":  ("furniture/Beds_Single_Headboards.png", 8, 0, 48, 32, .5, 1, 44, 8),
    "pillar":     ("structure/Stone_Pillar_A.png", 0, 0, 32, 96, .5, 1, 26, 12),
    "stairs":     ("structure/Wood_Interior_Stairs_A.png", 0, 0, 64, 64, .5, 1, 56, 16),
    "ladder":     ("furniture/Ladder.png", 3, 7, 26, 83, .5, 1, 20, 10),
    "door_closed":("structure/12_Panel_Door_B.png", 224, 16, 32, 48, .5, 1, 28, 10),
    "doorway":    ("structure/Arched_Doorway_A.png", 27, 26, 106, 70, .5, 1, 96, 12),
    "window":     ("structure/Ornamental_Windows_A.png", 0, 32, 96, 96, .5, 1, 88, 12),
    "portrait":   ("wallitems/Paintings_Portraits.png", 2, 8, 29, 49, .5, 1, 26, 6),
    "portrait2":  ("wallitems/Paintings_Portraits.png", 34, 8, 29, 49, .5, 1, 26, 6),
    "portrait_s": ("wallitems/Paintings_Portraits.png", 102, 1, 17, 25, .5, 1, 15, 5),
    "sconce":     ("wallitems/Lighting_Wall.png", 6, 4, 20, 28, .5, 1, 14, 5),
    "sconce2":    ("wallitems/Lighting_Wall.png", 38, 4, 20, 28, .5, 1, 14, 5),
    "wallcandle": ("wallitems/Lighting_Wall.png", 75, 31, 10, 33, .5, 1, 8, 4),
    "mirror_w":   ("wallitems/Mirrors.png", 0, 5, 64, 23, .5, 1, 56, 5),
    "mirror_r":   ("wallitems/Mirrors.png", 77, 13, 39, 39, .5, 1, 32, 5),
    "boxes":      ("smallitems/Boxes.png", 34, 4, 28, 22, .5, 1, 24, 8),
    "box_s":      ("smallitems/Boxes.png", 6, 37, 20, 21, .5, 1, 17, 7),
    "bucket":     ("smallitems/Buckets.png", 5, 5, 21, 24, .5, 1, 18, 8),
    "flowers":    ("smallitems/Flowers.png", 7, 34, 19, 15, .5, 1, 16, 6),
    "rug":        ("furniture/Rainbow_Rug.png", 2, 1, 92, 62, .5, 1, 0, 0),
    "rug2":       ("furniture/Rainbow_Rug.png", 102, 13, 83, 70, .5, 1, 0, 0),
    "rug_vine":   ("furniture/Swirling_Vine_Rug.png", 0, 0, 160, 128, .5, 1, 0, 0),
    "blanket":    ("smallitems/Blankets_Crumpled.png", 10, 2, 38, 28, .5, 1, 0, 0),
    "cauldron":   ("furniture/Cauldron.png", 3, 1, 27, 30, .5, 1, 22, 8),
    "planter":    ("furniture/Planter.png", 128, 10, 32, 74, .5, 1, 24, 10),
    "chains":     ("smallitems/Dungeon_Elements.png", 40, 0, 24, 32, .5, 1, 16, 5),
    "bones":      ("smallitems/Dungeon_Elements.png", 0, 67, 30, 20, .5, 1, 0, 0),
    "rubble":     ("smallitems/Dungeon_Elements.png", 32, 40, 32, 23, .5, 1, 0, 0),
    "junk":       ("smallitems/Dungeon_Elements.png", 0, 99, 25, 23, .5, 1, 0, 0),
}

# wall recolours so every room can have its own wallpaper without new art
WALL_VARIANTS = {
    "wall_sick":   ("wall_plaster", 0.62, 1.0, 0.55, 1.02),   # mouldy green
    "wall_rose":   ("wall_plaster", 1.05, 0.86, 0.92, 1.00),  # dusty rose
    "wall_cold":   ("wall_plaster", 0.80, 0.94, 1.12, 1.00),  # moonlit blue
    "wall_rot":    ("wall_plaster", 0.95, 0.88, 0.70, 0.96),  # nicotine yellow
}


def tint(im: Image.Image, r: float, g: float, b: float, lum: float) -> Image.Image:
    rr, gg, bb, aa = im.split()
    rr = rr.point(lambda v: min(255, int(v * r)))
    gg = gg.point(lambda v: min(255, int(v * g)))
    bb = bb.point(lambda v: min(255, int(v * b)))
    out = Image.merge("RGBA", (rr, gg, bb, aa))
    return ImageEnhance.Brightness(out).enhance(lum)


def main() -> None:
    parts: dict[str, Image.Image] = {}
    meta: dict[str, dict] = {}

    for name, (sheet, tx, ty) in TILES.items():
        im = Image.open(SRC / sheet).convert("RGBA")
        parts[name] = im.crop((tx * 32, ty * 32, tx * 32 + 32, ty * 32 + 32))
        meta[name] = {"tile": True}

    for name, (sheet, x, y, w, h, ax, ay, cw, ch) in PROPS.items():
        im = Image.open(SRC / sheet).convert("RGBA")
        parts[name] = im.crop((x, y, x + w, y + h))
        meta[name] = {"ax": ax, "ay": ay, "cw": cw, "ch": ch}

    for name, (base, r, g, b, lum) in WALL_VARIANTS.items():
        parts[name] = tint(parts[base], r, g, b, lum)
        meta[name] = {"tile": True}

    # ---- pack ------------------------------------------------------------
    pad = 2
    order = sorted(parts, key=lambda n: (-parts[n].height, -parts[n].width))
    max_w = 1024
    x = y = row_h = 0
    for name in order:
        im = parts[name]
        if x + im.width + pad > max_w:
            x = 0
            y += row_h + pad
            row_h = 0
        meta[name].update(x=x, y=y, w=im.width, h=im.height)
        x += im.width + pad
        row_h = max(row_h, im.height)
    atlas_h = 1
    while atlas_h < y + row_h:
        atlas_h *= 2
    atlas_w = max_w

    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
    for name, m in meta.items():
        atlas.alpha_composite(parts[name], (m["x"], m["y"]))

    OUT.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT / "atlas.png", optimize=True)
    (OUT / "atlas.json").write_text(json.dumps({"w": atlas_w, "h": atlas_h, "frames": meta}, indent=1))
    print(f"atlas {atlas_w}x{atlas_h}  {len(meta)} frames -> {OUT/'atlas.png'}")
    for name in sorted(meta):
        m = meta[name]
        print(f"  {name:16s} {m['w']:4d}x{m['h']:4d} @{m['x']:4d},{m['y']:4d}")


if __name__ == "__main__":
    main()
