# פירגון — React Native (Expo) frontend

A single React Native codebase (Expo + React Native Web) that runs **responsively on
desktop & mobile browsers**, as **native iOS/Android apps**, and as a **packaged desktop
app via Electron**. Ported from the Vite/React app in `../frontend` — same screens,
Hebrew/RTL, i18n, and design tokens. UI text stays in `src/locales/he.json`.

## One-time setup

```bash
cd frontend-native
npm install
```

> First run also needs the Expo CLI, which ships as a dependency — `npx expo` works with no global install.

## Run in each environment

### 1. Web (responsive desktop + mobile browser)
```bash
npm run web          # dev server → opens http://localhost:8081
npm run build:web    # static production bundle → ./dist
```
The same build is responsive: resize the window (or open on a phone browser) and the
layout switches between the desktop sidebar and the mobile bottom-tab shell at 880px.

### 2. Native iOS / Android
```bash
npm start            # Metro bundler + QR code
# then:
#   press  i   → iOS simulator      (needs Xcode, macOS only)
#   press  a   → Android emulator   (needs Android Studio)
#   or scan the QR with the Expo Go app on a physical phone
```
Direct shortcuts: `npm run ios`, `npm run android`.

### 3. Desktop app (Electron)
```bash
npm run electron:dev      # live dev: starts Expo web + opens an Electron window
npm run build:desktop     # exports the web bundle, then packages with electron-builder
                          # → installers in ./desktop-dist (.dmg / .nsis / .AppImage)
```

## Project layout
```
App.js                 root: auth gate → Shell → active view + GiveModal
index.js               entry; forces RTL before render
src/theme.js           design tokens (ported from tokens.css) as JS
src/i18n.js            react-i18next, source of truth: src/locales/he.json
src/hooks/useViewport  responsive hook (useWindowDimensions, <880px = mobile)
src/components/ui.js    primitives (Icon, Avatar, Button, Card, …)
src/components/*View.js the seven screens
electron/main.js        desktop window (loads dev URL or ./dist)
```
