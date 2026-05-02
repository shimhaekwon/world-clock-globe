# Galaxy Store Submission Checklist

Wake-up checklist for getting the app live on Samsung Galaxy Store. The text
in [`store-description.md`](./store-description.md) is ready to paste; this
file is just the action sequence.

## Day 0 — start the long-poll items

1. **Seller Portal account** — https://seller.samsungapps.com
   - Sign up with your email
   - Identity verification (passport / national ID upload)
   - **Wait 1–3 business days for approval**
2. **Generate the AAB** — https://www.pwabuilder.com
   - Enter `https://shimhaekwon.github.io/world-clock-globe/`
   - "Package for Stores" → Android → download the `.zip`
   - Inside the zip: keep the `app-release-bundle.aab` and the
     `assetlinks.json` (note the SHA-256 fingerprint inside)
3. **Fingerprint → site** — copy the SHA-256 from `assetlinks.json` into
   `.well-known/assetlinks.json` in the repo, commit, push (GH Pages will
   redeploy in ~3 min). This makes the TWA pass Chrome's domain ownership
   check.
4. **Capture screenshots** — Chrome DevTools → toggle Device Toolbar →
   set 1080×1920 → reload the live site → screenshot 4–8 of:
   - globe far out (country labels)
   - zoomed into Korea (city labels)
   - auto-rotating ("Rotating" placeholder visible)
   - info card expanded with weather data
   - a different continent (Europe / Americas)

## Day 1+ — once Seller Portal is approved

5. **Create new app** in Seller Portal → "Add new application"
6. **App information** (paste from `store-description.md`):
   - App name: `World Clock Climate`
   - Short description (English + 한국어)
   - Full description (English + 한국어)
   - Keywords
   - Category: Weather (primary)
7. **Graphic assets**:
   - App icon: `icon-512.png` (already in the repo)
   - Phone screenshots: the ones you captured in step 4
   - Feature graphic: 1920×1080 (optional — can be a screenshot crop)
8. **Binary**: upload the `.aab` from step 2
9. **Privacy policy URL**:
   `https://shimhaekwon.github.io/world-clock-globe/privacy.html`
10. **Content rating**: all ages, no chat / UGC / ads
11. **Pricing**: Free
12. **Countries**: Worldwide (or limit to KR if testing first)
13. **Submit for review** — Samsung review usually 1–2 weeks

## After approval

- Listing goes live on Galaxy Store
- For updates: PWA changes propagate automatically (TWA fetches from GH Pages),
  but if you want to bump the *app* version (versionCode), regenerate the AAB
  via PWABuilder and upload as a new version.

## Common rejection causes (and fixes)

| Cause | Fix |
|---|---|
| Privacy policy URL missing or 404 | Confirm `privacy.html` is reachable on the live URL |
| Screenshots too few or wrong resolution | Capture 4+ at 1080×1920 |
| App description has placeholder text | Use the localized text from `store-description.md` |
| Crashes on first launch | Test the AAB locally on a Galaxy device first; check Chrome devtools console of the live PWA for runtime errors |
| Trademark / brand issues | Avoid using "Samsung", "Galaxy", "Earth" alone, etc. — current name is fine |
