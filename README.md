# World Clock Climate

A 3D rotating globe that shows the current local time and weather for any spot
on Earth — point the crosshair anywhere and instantly see the place name,
local time, temperature, and condition.

Live demo: https://shimhaekwon.github.io/world-clock-globe/

## Features

- **3D interactive globe** powered by [globe.gl](https://github.com/vasturiano/globe.gl)
  with self-hosted 8K daymap texture
- **Tiered labels** — country / state-province / major city — that swap automatically
  with the zoom level. Country names shrink as you zoom in so they stay context, not clutter.
- **Localized info card** — `서울특별시 / Seoul`-style display where the local script
  and the english name match the city
- **Auto-rotate** — slider 0-10. While rotating the info card collapses to "Rotating"
  and API polling pauses (respects [Nominatim's fair use policy](https://operations.osmfoundation.org/policies/nominatim/))
- **Timezone-aware initial view** — the app opens centered on the user's region
  rather than always at Seoul
- **PWA** — installable as a standalone app on iOS/Android/desktop, works offline
  for static assets after first visit

## Data sources

- Reverse geocoding: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
- Weather: [Open-Meteo](https://open-meteo.com/)
- Country boundaries: [datasets/geo-boundaries-world-110m](https://github.com/datasets/geo-boundaries-world-110m)
- Admin-1 / cities: [Natural Earth](https://www.naturalearthdata.com/)

## Texture credit

The 8K daymap texture (`img/earth-8k-daymap.jpg`) is from
[Solar System Scope](https://www.solarsystemscope.com/textures/), free for personal
and commercial use.

## Privacy

The app makes no analytics or tracking calls. It only contacts the third-party
APIs above to look up place names and weather. See [privacy.html](./privacy.html)
for details.

## License

MIT — see [LICENSE](./LICENSE).

## Run locally

```bash
# any static file server works
python -m http.server 5500
# then open http://localhost:5500/
```

## Distribution

- **Web**: live on GitHub Pages
- **Galaxy Store**: planned (TWA wrapper)
- **F-Droid**: planned (TWA wrapper, requires Android source in repo)

See [docs/store-description.md](./docs/store-description.md) for store listing
copy and [docs/fdroid-setup.md](./docs/fdroid-setup.md) for the F-Droid path.
