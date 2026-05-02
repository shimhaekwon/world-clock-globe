# F-Droid Setup Guide

F-Droid does not accept pre-built APK/AAB binaries. It builds the app from
source on its own infrastructure, so we need a TWA (Trusted Web Activity)
Android project committed to the repo and a metadata YAML in the
`fdroiddata` repository.

This document walks through the one-time setup. After approval, every new
git tag triggers an automatic F-Droid build and update.

## 1. Add a TWA Android project to the repo

We use [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) to scaffold
a TWA wrapper. It produces a standard Gradle Android project that F-Droid
can build.

### Prerequisites

- Java JDK 17
- Android SDK (`ANDROID_SDK_ROOT` env var)
- Node 18+

### One-time scaffold

```bash
npm install -g @bubblewrap/cli
mkdir android && cd android
bubblewrap init --manifest=https://shimhaekwon.github.io/world-clock-globe/manifest.json
# follow prompts — package name suggestion: io.github.shimhaekwon.worldclockclimate
bubblewrap build  # produces signed APK locally as a sanity check
```

Commit the generated `android/` folder to the repo.

### Resulting layout

```
world-clock-globe/
├── index.html, app.js, ...     (PWA — already present)
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/AndroidManifest.xml
│   ├── build.gradle
│   ├── gradlew
│   └── settings.gradle
├── LICENSE
└── ...
```

## 2. Capture the signing key fingerprint

After `bubblewrap build`, take note of the SHA-256 fingerprint of the signing
key:

```bash
keytool -list -v -keystore android/app/release-signing.jks -alias android
# look for: SHA256: 12:34:56:...
```

Add this fingerprint to `.well-known/assetlinks.json` in this repo (replacing
the placeholder), so Chrome verifies the TWA owns the same domain. Commit and
deploy to GitHub Pages.

## 3. Tag a release

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

F-Droid uses tags as build anchors. Each future release should bump the
`versionCode` in `android/app/build.gradle` and add a new tag.

## 4. Submit metadata to fdroiddata

1. Fork https://gitlab.com/fdroid/fdroiddata
2. Create `metadata/io.github.shimhaekwon.worldclockclimate.yml`:

```yaml
Categories:
  - Time
  - Internet
License: MIT
SourceCode: https://github.com/shimhaekwon/world-clock-globe
IssueTracker: https://github.com/shimhaekwon/world-clock-globe/issues

AutoName: World Clock Climate
Summary: 3D globe showing local time and weather for any spot on Earth

Description: |-
  A 3D rotating globe that shows the current local time and weather for any
  spot on Earth. Point the crosshair anywhere to see the place name (in local
  script + english), the local time, and the current weather condition.

  Uses OpenStreetMap Nominatim for reverse geocoding and Open-Meteo for
  weather. No accounts, no advertisements, no tracking.

RepoType: git
Repo: https://github.com/shimhaekwon/world-clock-globe.git

Builds:
  - versionName: '1.0.0'
    versionCode: 1
    commit: v1.0.0
    subdir: android/app
    gradle:
      - yes

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: '1.0.0'
CurrentVersionCode: 1
```

3. Open a merge request against fdroiddata.
4. Wait for the F-Droid maintainer review (commonly several weeks). They
   may ask for adjustments — the most common requests are:
   - **Anti-features**: external network services like Nominatim and
     Open-Meteo will likely earn the `NonFreeNet` anti-feature label
     (informational only, not a block)
   - **Reproducibility**: ensure the build command runs deterministically
     against a clean clone
   - **License headers**: every source file should reference the LICENSE

5. After approval, the next time you push a `vX.Y.Z` tag, F-Droid's bot picks
   it up automatically and publishes the new version.

## 5. Updates after first publish

For every new release:

1. Bump `versionCode` and `versionName` in `android/app/build.gradle`
2. Commit
3. `git tag -a vX.Y.Z -m "..."` and `git push origin vX.Y.Z`

F-Droid auto-builds within 24–48h.

## Notes / caveats

- **External dependencies**: jsdelivr-hosted libraries (globe.gl, three.js)
  are usually fine since they're MIT-licensed, but F-Droid prefers self-hosted
  or npm-bundled. If a maintainer flags this, switch to npm + bundling later.
- **Anti-feature `NonFreeNet`** is expected (Nominatim/Open-Meteo are free
  services but external). It's a label, not a block — users still see the app.
- **Review queue is slow.** Plan for 4–12 weeks before first listing. Galaxy
  Store is faster if you want to be live sooner.

## Useful links

- F-Droid contribution docs: https://f-droid.org/docs/Submitting_to_F-Droid/
- Bubblewrap CLI: https://github.com/GoogleChromeLabs/bubblewrap
- TWA quality check: https://www.pwabuilder.com/
