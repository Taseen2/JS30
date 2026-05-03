# PixelTune 🎨
> Update CSS Variables with JS — a real-time image editor built with vanilla JavaScript and CSS.

[![Screenshot-2026-05-03-205048.png](https://i.postimg.cc/nL6BBnhX/Screenshot-2026-05-03-205048.png)](https://postimg.cc/f3fVhnXs)

## What it does

PixelTune lets you upload any image and tweak its appearance live using sliders. No page reloads, no lag — just instant visual feedback powered by CSS custom properties updated through JavaScript.

## Features

- 🖼️ **Upload your own image** — works with any local image file
- 💾 **Download the edited version** — save your changes instantly
- 🎚️ **7 real-time filters:**
  - Border
  - Blur
  - Base Color
  - Brightness
  - Contrast
  - Saturation
  - Invert
  - Grayscale

## Demo

🌐 Live Demo: https://taseen2.github.io/PixelTune/

## Tech Stack

- HTML
- CSS (Custom Properties / Variables)
- Vanilla JavaScript

## What I learned

The core idea behind this project: CSS variables aren't just for static theming. When JavaScript updates a `--variable` on the root element, every element referencing it reacts instantly — no class toggling, no inline style mess.

```js
document.documentElement.style.setProperty(`--${this.name}`, this.value + suffix);
```

That one line is basically the whole trick.

## Getting Started

```bash
git clone https://github.com/your-username/pixeltune.git
cd pixeltune
open index.html
```

Or just open `index.html` directly in your browser — no build tools needed.

---
