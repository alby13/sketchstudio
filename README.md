# Sketch Studio
## A whiteboard drawing production studio for Youtube videos

**Browser-based sketch / doodle animation studio** for explainer-style videos.

Build scenes by dragging assets onto a stage, time them on a timeline, and play a hand-drawn reveal animation. Use **Record Mode** with OBS, ShareX, Game Bar, or any screen recorder to capture clean 1080p or 1440p output.

> Inspired by tools like VideoScribe and Doodly — free to run locally, no account, no watermark.

Free for personal and non-commercial use only.

<br>

---

<img src="https://github.com/alby13/sketchstudio/blob/main/screenshot_video.jpg?raw=true">

<p align="center">Watch The YouTube Overview: https://www.youtube.com/watch?v=q6J8GASMeuU</p>

---

<br>

## Features

| Area | What you get |
|------|----------------|
| **Stage** | True **1080p** (1920×1080) or **1440p** (2560×1440) canvas |
| **Assets** | 90+ built-in doodles — people, business, tech, finance, shapes, arrows, text |
| **Custom images** | Upload PNG/JPG/WebP; brush-reveal paths (scan, wipe, spiral, radial) |
| **Draw animation** | Stroke-by-stroke vector reveal + image mask reveal |
| **Pointers** | Pen, marker, pencil, pointing hand, or paint brush (tools only — no fake “hand holding every tool”) |
| **Timeline** | Start time, draw duration, scrubbing, tail padding, playhead timer |
| **Record Mode** | Full-window stage only — ideal for screen capture |
| **Projects** | Auto-save to browser storage; export / import JSON |

<br>

## Quick start

**Requirements:** [Node.js](https://nodejs.org/) 18+ (recommended: current LTS)

```bash
git clone https://github.com/alby13/sketchstudio.git
cd sketchstudio
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

Static output is written to `dist/` and can be hosted on any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.), subject to the [license](#license).

---

<br>

## How to use

1. **Drag** an asset from the left panel onto the stage (or double-click to place centered).
2. **Move / resize** on the stage. Hold **Shift** while resizing to keep aspect ratio.
3. Set **draw start** and **duration** in the inspector or by dragging timeline clips.
4. New assets are placed at the **current playhead time**.
5. Pick a **pointer** style in the top bar (pen, marker, pencil, pointing hand, paint brush).
6. Click **Record Mode**, aim your screen recorder at the window, press **Space** to play.

<br>

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / pause |
| `R` | Restart to `0:00` |
| `Esc` | Exit record mode |
| `Delete` / `Backspace` | Remove selected object |
| `Ctrl`/`Cmd`+`S` | Save project to browser storage |
| `Shift` + resize | Lock aspect ratio |

<br>

### Custom images

- Use **Upload image** or drop image files onto the stage (Note: The word Upload is used as a general way of loading images, but it does not need internet access and is not saved on any web server).
- In the inspector: reveal style, brush size, draw timing, show/hide pointer.
- Large images are compressed for local storage; prefer **Export JSON** for big projects.

---

## Project structure

```
sketch-studio/
├── index.html              # App shell
├── hand-preview.html       # Large pointer style sheet (QA)
├── src/
│   ├── main.ts             # UI, canvas interaction, timeline
│   ├── state.ts            # Project state, save/load
│   ├── types.ts            # Shared types
│   ├── style.css           # Studio chrome
│   ├── assets/
│   │   ├── library.ts      # Core doodle library
│   │   └── library-pack.ts # Expanded asset pack
│   └── engine/
│       ├── renderer.ts     # Stage draw + selection
│       ├── path.ts         # SVG path sampling
│       ├── hand.ts         # Drawing pointers
│       ├── revealPaths.ts  # Image reveal paths
│       └── imageCache.ts   # Image load / compress
├── public/                 # Static assets
└── previews/               # Preview images
```

---

## Tech stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- Canvas 2D (no heavy animation framework)

---

## Improvement ideas

Contributions and ideas are welcome for **non-commercial** use and development under the license:

- [ ] Multi-scene projects  
- [ ] Audio / voiceover track  
- [ ] Built-in MP4 export (ffmpeg.wasm or similar)  
- [ ] More asset packs / themes  
- [ ] Undo / redo history  

---

## Contributing

1. Fork the repo and create a branch.
2. Keep changes focused and consistent with existing style.
3. Run `npm run build` before opening a PR.
4. By contributing, you agree your contributions are licensed under the same **PolyForm Noncommercial** terms as the project.

---

## License

This project is licensed under the **[PolyForm Noncommercial License 1.0.0](LICENSE)**.

### In plain language

| Allowed | Not allowed |
|---------|-------------|
| Personal projects, hobby, learning | Selling the software or hosting it as a paid product |
| Education, research, nonprofits (as defined in the license) | Commercial services, SaaS, client work for pay that relies on this software |
| Modify and share under the same noncommercial terms | Using it as part of any commercial product or revenue-generating activity |

**Non-commercial use only. Commercial use is not permitted.**

Full legal terms: see [`LICENSE`](LICENSE) or [polyformproject.org/licenses/noncommercial/1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0).

If you need a commercial license, contact the copyright holder alby13.

---

## Disclaimer

The software is provided **as is**, without warranty of any kind. Use at your own risk. See the license for liability terms.

---

## Acknowledgments

- Sketch / doodle explainer style popularized by tools such as VideoScribe and Doodly (this project is an independent open implementation, not affiliated with them).
- Built with Vite and TypeScript.
