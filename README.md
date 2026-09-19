# ESCAPE

> *“Where do you go when you need to escape?”*

An immersive, interactive digital sanctuary. A place of soft rain, warm amber lamplight, quiet memories, and analog film grain.

---

## 🌧️ Visual DNA
- **Atmosphere**: Soft, poetic, romantic, cozy, nostalgic, healing.
- **Palette**: Midnight slate & deep rainy blue-grey (`#080b10` – `#151d29`) contrasted with warm amber interior light (`#e6a86e`).
- **Texture**: Dynamic window condensation, rain streaks, and a 35mm film grain overlay.
- **Tone**: Cinematic, intimate, minimal. Romantic without being pink-cute or overly decorative.

---

## 📁 Project Structure

```text
escape/
├── index.html                  # Main entry point & poetic typography hierarchy
├── assets/
│   ├── css/
│   │   ├── style.css           # Typography, layout, animations & responsive styling
│   │   └── atmosphere.css      # Ambient lighting, film grain & vignette layers
│   └── js/
│       ├── rain.js             # Canvas simulation (rain streaks & condensation drops)
│       ├── audio.js            # Procedural Web Audio API (soothing rain ambience)
│       └── main.js             # Parallax, interactions & entry transition
└── README.md
```

---

## 🚀 How to Preview Locally

This project requires **zero installations, zero build steps, and zero dependencies**.

### Method 1: Direct File Open (Easiest)
1. Open your file explorer at:
   `c:\Users\win\OneDrive\Documents\GitHub\escape`
2. Double-click **`index.html`** to open it directly in any modern browser (Google Chrome, Microsoft Edge, Firefox, Safari).

### Method 2: VS Code Live Server
If you use VS Code / Antigravity:
1. Right-click **`index.html`** in the file explorer.
2. Select **"Open with Live Server"**.

### Method 3: Python Local Server (Terminal)
Run in PowerShell or terminal within this directory:
```powershell
python -m http.server 8000
```
Then visit [http://localhost:8000](http://localhost:8000) in your browser.
