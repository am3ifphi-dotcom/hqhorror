#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# fetch_lpc.sh — pull the exact source spritesheets we use out of the
# "LPC Revised" collection (OGA-BY 3.0) on GitHub, without downloading the
# whole 300 MB repository.
#
#   repo : https://github.com/ElizaWy/LPC   (curated by Eliza Wyatt / DeathsDarling)
#   lic  : OGA-BY 3.0  (see vendor_raw/lpc/CREDITS-LPC-REVISED.txt)
#
# Blobs are fetched lazily through a --filter=blob:none clone, so only the
# files listed below ever hit the network.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_URL="https://github.com/ElizaWy/LPC.git"
SRC=".vendor/lpc-repo"
OUT="vendor_raw/lpc"

mkdir -p "$OUT"

if [ ! -d "$SRC/.git" ]; then
  echo ">> cloning (blobless) $REPO_URL"
  git clone --depth 1 --filter=blob:none --no-checkout -q "$REPO_URL" "$SRC"
fi

# get <repo-relative-path> <destination-relative-path>
get() {
  local src="$1" dst="$2"
  mkdir -p "$OUT/$(dirname "$dst")"
  if git -C "$SRC" show "HEAD:$src" > "$OUT/$dst" 2>/dev/null; then
    printf '  ok   %-70s -> %s\n' "$src" "$dst"
  else
    printf '  MISS %s\n' "$src" >&2
    rm -f "$OUT/$dst"
  fi
}

git -C "$SRC" show "HEAD:Credits.txt"      > "$OUT/CREDITS-LPC-REVISED.txt"
git -C "$SRC" show "HEAD:README.md"        > "$OUT/README-LPC-REVISED.md" || true
for f in \
  "Characters/Credits.txt" \
  "Characters/Clothing/Credits.txt" \
  "Characters/Hair/Credits.txt" \
  "Objects/Furniture/Credits.txt" \
  "Objects/Furniture/Beds/Credits.txt" \
  "Objects/Furniture/Rugs/Credits.txt" \
  "Objects/Furniture/Seating/Credits.txt" \
  "Objects/Small Items/Credits.txt" \
  "Objects/Wall Items/Credits.txt" \
  "Structure/Walls/Credits.txt" \
  "Structure/Floor/Credits.txt" \
  "Structure/Doors/Credits.txt" \
  "Structure/Windows/Credits.txt" \
  "Structure/Stairs/Credits.txt" \
  "Structure/Wall Borders/Credits.txt" \
  "Structure/Roofing/Credits.txt" \
  "Objects/Moveable/Credits.txt" \
  "Objects/Small Items/Fabric/Credits.txt" \
  "Objects/Small Items/Food/Credits.txt" \
  "FX/Credits.txt" ; do
  base=$(basename "$f"); sub=$(dirname "$f")
  get "$f" "credits/${sub//\//_}__$base"
done

ANIMS="Walk Idle Run Emotes Expressions Sitting Jump Climb"

# --- protagonist: quiet schoolgirl -----------------------------------------
BODY="Characters/Body/Body 01 - Feminine, Thin/Ivory"
HEAD="Characters/Head/Head 01 - Feminine/Ivory"
HEADB="Characters/Head/Head 01 - Feminine"
HAIR="Characters/Hair/Medium 08 - Bob, Bangs/Black"
BROW="Characters/Hair/Eyebrows 01 - Thin Eyebrows/Black"
TORSO="Characters/Clothing/Feminine, Thin/Torso/Shirt 01 - Longsleeve Shirt/White"
LEGS="Characters/Clothing/Feminine, Thin/Legs/Pants 02 - Leggings/Navy"
FEET="Characters/Clothing/Feminine, Thin/Feet/Shoes 01 - Shoes/Black"

for a in $ANIMS; do
  get "$BODY/$a.png"  "char/body_$a.png"
  get "$HEAD/$a.png"  "char/head_$a.png"
  get "$HAIR/$a.png"  "char/hair_$a.png"
  get "$BROW/$a.png"  "char/brow_$a.png"
  get "$TORSO/$a.png" "char/torso_$a.png"
  get "$LEGS/$a.png"  "char/legs_$a.png"
  get "$FEET/$a.png"  "char/feet_$a.png"
done

# --- wraith: same body, bleached palette ------------------------------------
for a in $ANIMS; do
  get "Characters/Body/Body 01 - Feminine, Thin/_Alternate Colors/White/$a.png" "wraith/body_$a.png"
  get "$HEADB/_Alternate Colors/White/$a.png" "wraith/head_$a.png"
  get "Characters/Hair/Medium 02 - Curly/White/$a.png" "wraith/hair_$a.png"
  get "Characters/Clothing/Feminine, Thin/Torso/Shirt 01 - Longsleeve Shirt/White/$a.png" "wraith/torso_$a.png"
  get "Characters/Clothing/Feminine, Thin/Legs/Pants 02 - Leggings/White/$a.png"  "wraith/legs_$a.png"
done

# --- structure --------------------------------------------------------------
W="Structure/Walls"
for f in "Drywall.png" "Painted Walls.png" "Floral Wallpaper A.png" "Floral Wallpaper B.png" \
         "Striped Wallpaper A.png" "Striped Wallpaper B.png" "Panels A.png" "Half-Wall Paneling A.png" \
         "Brick Wall A.png" "Jagged Stone Walls.png" "Molding.png" "CutawayOverlay.png" \
         "Diamond Wallpaper.png" "Grainy Plain Wall.png" ; do
  get "$W/$f" "structure/wall_${f// /_}"
done

F="Structure/Floor"
for f in "Wood Floor A.png" "Wood Floor B.png" "Tile A.png" "Tile B.png" "Subfloor.png" \
         "Herringbone A.png" "Floral Carpet A.png" "Gritty Dirt.png" "Diamond Tile A.png" "Geometric Carpet A.png"; do
  get "$F/$f" "structure/floor_${f// /_}"
done

for f in "Structure/Doors/32x64px Doors/15 Panel Door A.png" \
         "Structure/Doors/32x64px Doors/Doorframe A.png" \
         "Structure/Doors/32x48px Doors/12 Panel Door A.png" \
         "Structure/Doors/32x48px Doors/12 Panel Door B.png" \
         "Structure/Doors/32x48px Doors/Barred Prison Door A.png" \
         "Structure/Doors/64x64px Arched Doors/Arched Double Doors A.png" \
         "Structure/Doors/64x64px Arched Doors/Arched Doorway A.png" \
         "Structure/Windows/Ornamental Windows A.png" \
         "Structure/Windows/Ornamental Windows A - Emission.png" \
         "Structure/Windows/Stone Windows A.png" \
         "Structure/Windows/Window Awnings A.png" \
         "Structure/Wall Borders/Plain Edged Border.png" \
         "Structure/Wall Borders/Formal Crown Molding.png" \
         "Structure/Wall Borders/Textured Wood Border.png" \
         "Structure/Stairs/Wood Interior Stairs A.png" \
         "Structure/Stairs/Formal Interior Stairs A.png" \
         "Structure/Stairs/Wood Interior Stairs Wall.png" \
         "Structure/Pillars/Stone Pillar A.png" ; do
  get "$f" "structure/$(basename "${f// /_}")"
done

# --- furniture & props ------------------------------------------------------
OF="Objects/Furniture"
for f in "Barrel.png" "Cabinet.png" "Chest.png" "Cauldron.png" "Clock, Grandfather.png" \
         "Fireplace.png" "Fireplace, Cast Iron.png" "Mirror, Standing.png" "Dresser.png" \
         "End Table.png" "Desk, Vanity.png" "Desk, Office.png" "Planter.png" "Bin.png" "Ladder.png" \
         "Lighting, Floor.png" "Countertop.png" "Crate.png" "Sawhorse.png" \
         "Beds/Beds, Double C.png" "Beds/Beds, Double Headboards.png" "Beds/Beds, Single  A.png" \
         "Beds/Beds, Single Headboards.png" "Beds/Beds, Single Mattresses.png" \
         "Seating/Chair, Dining A.png" "Seating/Chair, Dining C.png" "Seating/Chair, Sofa A.png" \
         "Seating/Chair, Office.png" "Seating/Bar Stools.png" \
         "Rugs/Rainbow Rug.png" "Rugs/Swirling Vine Rug.png" "Rugs/Diamond Rug, tiling.png" ; do
  get "$OF/$f" "furniture/$(basename "${f// /_}" | tr -d ',')"
done

WI="Objects/Wall Items"
for f in "Paintings, Portraits.png" "Paintings, Landscape.png" "Paintings, Abstract.png" \
         "Curtains.png" "Lighting, Wall.png" "Mirrors.png" ; do
  get "$WI/$f" "wallitems/$(basename "${f// /_}" | tr -d ',')"
done

SI="Objects/Small Items"
for f in "Boxes.png" "Buckets.png" "Dishes A.png" "Flowers.png" "Baskets A.png" \
         "Dungeon Elements.png" "Fire, Fireplace.png" "Fireplace, Accessories A.png" \
         "Fabric/Blankets, Crumpled.png" "Fabric/Fabric Rolls.png" ; do
  get "$SI/$f" "smallitems/$(basename "${f// /_}" | tr -d ',')"
done

echo ">> done. $(find "$OUT" -type f | wc -l) files in $OUT"
