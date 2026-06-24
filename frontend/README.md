# פירגון — React (Vite) frontend

The web UI for **פרגון (fergon)**, a Hebrew (RTL) peer-to-peer recognition platform.
Built with React + Vite, styled with Tailwind, and translated through react-i18next
(`src/locales/he.json` is the source of truth for all UI text).

## One-time setup

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev        # start the Vite dev server (HMR) → http://localhost:5173
npm run build      # production build → ./dist
npm run preview    # serve the production build locally
npm run test       # run the Vitest unit tests
```

> The dev server prints the exact local URL on start (default Vite port `5173`).

## Project layout

```
index.html             Vite entry HTML
src/main.jsx           React entry; mounts <App /> and loads i18n
src/App.jsx            root component
src/i18n.js            react-i18next setup (source of truth: src/locales/he.json)
src/locales/           translation files (he.json)
src/components/         UI components / screens
src/hooks/             custom hooks
src/lib/               helpers/utilities
src/data/              static/mock data
src/styles/            Tailwind + global styles
src/test/              Vitest setup and tests
```
