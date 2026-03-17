# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-18
**Project:** World Clock Globe

## OVERVIEW
3D globe-based world clock showing real-time location info + weather. Static HTML/JS, runs directly in browser.

## STRUCTURE
```
world-clock-globe/
├── index.html      # Main HTML (71 lines)
├── app.js         # Main logic (260 lines) - globe.gl integration
├── api.js         # API calls (137 lines) - Open-Meteo + BigDataCloud
├── style.css      # Styles (254 lines)
├── manifest.json  # PWA manifest
└── PROJECT_SPEC.md
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Globe init | `app.js:22-47` | initGlobe() |
| Auto-rotate | `app.js:172-221` | toggleAutoRotate() |
| API calls | `api.js` | getWeather(), getLocationInfo() |
| Events | `app.js:68-77` | attachGlobeEvents() |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| initGlobe | function | app.js:22 | Initialize globe.gl |
| handleGlobeChange | function | app.js:50 | Drag/zoom handler + debounce |
| updateLocationInfo | function | app.js:80 | Fetch weather + location |
| getWeather | function | api.js:44 | Open-Meteo API |
| getLocationInfo | function | api.js:74 | BigDataCloud reverse geocode |
| toggleAutoRotate | function | app.js:173 | Auto-rotate ON/OFF |

## CONVENTIONS
- ES6 modules: `import`/`export` in app.js, api.js
- Global: `Globe` from CDN loaded as global
- Debounce: 800ms for API calls during drag
- Auto-rotate interval: 5 seconds

## ANTI-PATTERNS (THIS PROJECT)
- NO node_modules - pure CDN
- NO build step - static files only
- NO TypeScript - plain JavaScript

## COMMANDS
```bash
# No build required - open index.html directly in browser
# Or serve locally:
npx serve .
```

## NOTES
- Requires network (weather/geocoding APIs)
- globe.gl loaded via CDN (https://cdn.jsdelivr.net/npm/globe.gl)
- Initial position: Korea (lat: 37.5, lng: 127.0)
- Real-time coordinates update during drag
