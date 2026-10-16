#!/usr/bin/env python3
"""Convert the CC0 Kenney one-shot SFX we use into 44.1 kHz mono wav files.

Source: Kenney "Asset Pack 1" (CC0 1.0) — https://kenney.nl/assets
The pack ships .ogg only; we re-encode to wav so every browser can play them
without a codec gamble.  Everything is normalised to -3 dBFS peak and trimmed
so there is no leading silence.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "audio"
SRC = Path("/tmp/kenney_sfx")

# destination name -> source file
USE = {
    "step_00": "footstep00.ogg",
    "step_01": "footstep01.ogg",
    "step_02": "footstep02.ogg",
    "step_03": "footstep03.ogg",
    "step_04": "footstep04.ogg",
    "step_05": "footstep05.ogg",
    "step_06": "footstep06.ogg",
    "step_07": "footstep07.ogg",
    "creak_01": "creak1.ogg",
    "creak_02": "creak2.ogg",
    "door_open": "doorOpen_1.ogg",
    "door_close": "doorClose_1.ogg",
    "page": "bookFlip1.ogg",
    "cloth": "cloth1.ogg",
    "metal": "metalClick.ogg",
    "latch": "metalLatch.ogg",
    "thud": "dropLeather.ogg",
    "ui_move": "rollover1.ogg",
    "ui_ok": "click1.ogg",
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if not SRC.exists():
        print(f"source dir {SRC} missing — run the fetch step first", file=sys.stderr)
        return
    for dst, src in USE.items():
        data, sr = sf.read(SRC / src, always_2d=True)
        mono = data.mean(axis=1)
        # trim silence
        peak = np.abs(mono).max()
        if peak > 0:
            mono = mono / peak * 0.7
        nz = np.nonzero(np.abs(mono) > 0.004)[0]
        if len(nz):
            mono = mono[nz[0] : nz[-1] + 1]
        sf.write(OUT / f"{dst}.wav", mono.astype(np.float32), 44100, subtype="PCM_16")
        print(f"  {dst:10s} <- {src:20s} {len(mono)/44100:.2f}s")
    print(f"{len(USE)} clips -> {OUT}")


if __name__ == "__main__":
    main()
