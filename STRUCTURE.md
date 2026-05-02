# World Clock Globe - Project Structure

## Folder Tree

```
world-clock-globe/
├── index.html          # Main HTML entry point
├── app.js             # Core application logic (globe initialization, event handlers)
├── api.js             # API functions (weather, location geocoding)
├── style.css          # Styles for globe and UI components
├── manifest.json      # PWA manifest for installable web app
├── icon.svg           # App icon (SVG)
├── icon-192.png       # App icon (192x192)
├── icon-512.png       # App icon (512x512)
├── AGENTS.md          # Project knowledge base and conventions
├── PROJECT_SPEC.md    # Feature specifications
├── STRUCTURE.md       # This file - project structure documentation
└── .github/
    └── workflows/
        └── static.yml  # GitHub Pages deployment workflow
```

## File Descriptions

| File | Description |
|------|-------------|
| **index.html** | Main HTML entry point. Loads globe.gl via CDN, initializes app. |
| **app.js** | Core logic: globe initialization, auto-rotate, drag detection, coordinate updates. |
| **api.js** | External API calls: Open-Meteo (weather) + BigDataCloud (reverse geocoding). Includes rate limiting (5s interval). |
| **style.css** | Styling for globe container, info card, buttons, and responsive layout. |
| **manifest.json** | PWA manifest enabling installation as a web app. |
| **icon.svg, icon-192.png, icon-512.png** | App icons for various contexts. |
| **AGENTS.md** | Project knowledge base: conventions, code map, anti-patterns. |
| **PROJECT_SPEC.md** | Detailed feature specifications. |
| **.github/workflows/static.yml** | CI/CD for GitHub Pages deployment. |

## App Flow

1. **Load**: Browser loads `index.html` → downloads globe.gl from CDN
2. **Init**: `app.js` calls `initGlobe()` → renders 3D Earth
3. **Events**: User drags/rotates globe → `handleGlobeChange()` triggers
4. **API**: `updateLocationInfo()` → calls `getLocationInfo()` + `getWeather()`
5. **Display**: Info card updates with city name, temperature, weather

## API Rate Limiting

- **Location API** (BigDataCloud): 5-second minimum interval to prevent 400 errors
- **Weather API** (Open-Meteo): No rate limiting (generous free tier)
