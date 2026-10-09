# Interactive Nuclei Decay Map

An interactive, high-density scientific Segrè chart (Chart of Nuclides) covering all 118 periodic table elements, multi-touch 2-finger zoom and pan, radioactive decay chain simulation, half-life telemetry, and dark/light modes.

## Features

- **All 118 Periodic Table Elements**: From Hydrogen ($Z=1$) up to Oganesson ($Z=118$), including all superheavy transactinides and known radionuclides.
- **Interactive Segrè Nuclear Landscape**: 60 FPS HTML5 canvas with 2-finger pinch-to-zoom, 2-finger panning, drag navigation, and hover coordinate probe.
- **Radioactive Decay Simulation**: Animated vector trajectories and step-by-step playback for primordial chains (U-238, Th-232, U-235), medical isotopes, and fission markers.
- **Compact UI**: Sleek collapsible inspector, 118-element Periodic Table drawer, and quick series presets.
- **Light & Dark Theme**: Calibrated high-contrast palettes for both modes.

---

## Push to GitHub & Build `debug.apk`

This repository is pre-configured with **Capacitor** and a **GitHub Actions CI workflow** (`.github/workflows/build-apk.yml`) that automatically compiles the app into a downloadable Android `debug.apk`.

### Step 1: Initialize Git and Push to GitHub

```bash
# Initialize git repository (if not already initialized)
git init

# Add all project files (including android/ and .github/workflows/)
git add .

# Commit
git commit -m "feat: interactive nuclei decay map with Android APK workflow"

# Rename branch to main
git branch -M main

# Add your GitHub repository remote
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# Push to GitHub
git push -u origin main
```

### Step 2: Download `debug.apk` from GitHub Actions

1. Go to your GitHub repository in your browser.
2. Click on the **Actions** tab at the top.
3. You will see the **Build Android Debug APK** workflow running.
4. When the build finishes (typically ~2-3 minutes), click on the completed run.
5. Under the **Artifacts** section at the bottom, click **debug-apk** to download the zip containing:
   - `debug.apk`
   - `nuclide-decay-map-debug.apk`
6. Transfer `debug.apk` to your Android device and install it directly!

---

## Local Development & Android Build

### Run Web App Locally

```bash
npm install
npm run dev
```

### Build APK Locally (Requires Android SDK & JDK 21)

```bash
# 1. Build web bundle and sync to Android project
npm run build:apk

# 2. Compile debug APK using Gradle
cd android
./gradlew assembleDebug

# Output APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```
