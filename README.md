# 影の囁き - Whispers in the Shadow

A web-based atmospheric horror game built with HTML5 Canvas and JavaScript.

## Overview

**影の囁き** (Kage no Sasayaki) is a side-scrolling horror exploration game focused on atmosphere, visual effects, and sound design. The player controls a quiet girl exploring a dark, abandoned Japanese house with only a flashlight.

## Features

- **High-quality procedural sprite generation** - Characters, environments, and effects are all generated programmatically with Canvas API
- **Dynamic flashlight system** with realistic light falloff and cone
- **Advanced post-processing pipeline**: film grain, vignette, color grading, scanlines
- **Particle systems**: fog, dust, atmospheric haze
- **Dynamic darkness** with screen-space lighting
- **Procedural audio**: ambient drones, horror stings, footsteps, whispers, creaking
- **Character animations**: idle breathing, walk cycle, fear reactions
- **立ち絵 (standing portrait)** system with expression changes
- **Horror events**: jump scares, screen distortion, shadow entities
- **Multiple explorable rooms** with unique atmospheres
- **Mobile support** with touch controls

## Controls

- **Arrow keys / WASD** - Move left/right
- **Mouse** - Aim flashlight
- **E / Enter / Space** - Interact (open doors)
- **Shift** - Run
- **Click / Space** - Advance dialogue

## External Assets Used

### Fonts (Google Fonts - OFL License)
| Asset | Author | Source | License |
|-------|--------|--------|---------|
| Creepster | Font Diner, Jr. | [Google Fonts](https://fonts.google.com/specimen/Creepster) | OFL |
| Nosifer | Typographic | [Google Fonts](https://fonts.google.com/specimen/Nosifer) | OFL |
| Metal Mania | Open Window | [Google Fonts](https://fonts.google.com/specimen/Metal+Mania) | OFL |

All font files sourced from: https://github.com/google/fonts

### Light Masks (Flashlight Effects)
| Asset | Author | Source | License |
|-------|--------|--------|---------|
| Light Masks pack | Kenney | [GitHub (shorepine/kenney)](https://github.com/shorepine/kenney) | CC0 |

### Sound Effects
| Asset | Author | Source | License |
|-------|--------|--------|---------|
| Game Sound Effects library | Various | [GitHub (JimLynchCodes/Game-Sound-Effects)](https://github.com/JimLynchCodes/Game-Sound-Effects) | Royalty Free |

### UI Tile Reference
| Asset | Author | Source | License |
|-------|--------|--------|---------|
| UI Pack - Pixel Adventure | Kenney | [GitHub (shorepine/kenney)](https://github.com/shorepine/kenney) | CC0 |

## Self-Generated Assets

| Asset | Description | Reason |
|-------|-------------|--------|
| Character sprites (walk, idle, run, fear, back) | Pixel art protagonist animations | No suitable horror character assets available on GitHub; custom pixel art matches game aesthetic |
| Standing portraits (立ち絵) | Character portraits with expressions | Custom art needed for specific expressions (neutral, fear, sad) |
| Environment tiles (floor, wall, tatami, door, window, ceiling) | Dark Japanese house interior | No horror-themed tilesets on GitHub; custom tiles ensure visual consistency |
| Ghost and shadow entities | Horror creature sprites | Procedurally generated for ethereal/translucent appearance |
| All audio (ambient, SFX, music) | Web Audio API procedural generation | Horror-specific sounds generated at runtime using oscillators, noise, and filters |

## Technical Details

- **Resolution**: 800×450 internal, scaled to fit viewport
- **Rendering**: HTML5 Canvas 2D with custom post-processing pipeline
- **Audio**: Web Audio API with procedural sound synthesis
- **Frame rate**: 60fps target with delta-time physics
- **No external dependencies**: Pure vanilla JavaScript

## Running

Simply serve the project directory with any HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

## License

- Game code: MIT License
- Assets: See individual asset credits above
- Fonts: SIL Open Font License 1.1

## Constraints & Notes

- External assets were sourced exclusively from GitHub due to sandbox network restrictions
- Horror-specific sprite sheets (character, environment) were generated procedurally as no suitable horror assets were available on GitHub
- Audio is entirely procedural - no external audio files are used for the game's horror soundscape (the bundled SFX files from JimLynchCodes repo are available but not used in the core horror experience)
- The game is designed for desktop browsers with mouse support for flashlight aiming
- Mobile touch controls are provided as a fallback
