# Installing locally

The extension is written in TypeScript and built with [Vite](https://vite.dev) into a plain, readable (unminified) extension folder that Chrome loads directly.

## Requirements

- Google Chrome 121 or newer (`minimum_chrome_version` in `src/manifest.ts`).
- [Node.js](https://nodejs.org/) 24 LTS (`.nvmrc` pins it — `nvm use`) and `npm install`.
- [`just`](https://github.com/casey/just) — the command runner behind every task below ([installation guide](https://github.com/casey/just#installation)).

## Build it

```bash
npm install
just dev      # builds dist/dev and keeps rebuilding on every save (leave it running)
```

One-off production build without the watcher: `npx vite build` → `dist/prod`. All build commands: [BUILD.md](BUILD.md).

## Load unpacked (development install)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the built folder — the one containing `manifest.json`:

   ```text
   dist/dev      (while developing, from `just dev`)
   dist/prod     (production build)
   ```

5. The extension card appears. Pin the toolbar icon via the puzzle-piece menu.

An unpacked copy marks itself: a `dev` badge and the violet dev icon on the toolbar button, a `DEV · ` prefix on page titles and headings (`src/lib/env.ts` — a store install has `update_url` in its manifest, an unpacked copy never does). That keeps it distinguishable from a store install of the same extension running next to it.

## Verify it works

1. Open any web page and click the toolbar icon → a small window opens. Click the icon again → the same window is focused, no second one.
2. **Ping worker** → `pong <timestamp>` and a toast.
3. **Read page title** → the title of the page you clicked the icon on. On `chrome://` pages it reports an error instead — extensions cannot script those.
4. **Options** → change the name → the popup's greeting follows immediately.
5. **×** closes the window.

## After changing code

With `just dev` running and `dist/dev` loaded, nothing: every save rebuilds in well under a second and the loaded extension updates itself —

- a change to a page (popup / options: TypeScript, HTML, CSS) reloads the open extension pages;
- a change to the service worker, the manifest or shared code reloads the whole extension (open extension windows close — click the toolbar icon again).

Type errors stream in the same terminal (`tsc --watch`) — the build itself never blocks on them, `just check` does.

The reload signal reaches open extension pages only. If no popup or options page is open when you change the service worker, reload once by hand: `chrome://extensions` → the circular **reload** arrow on the card.

Service-worker logs: click the **service worker** link on the extension card to open its DevTools console. Popup / options: right-click inside them → Inspect.

## Packing a zip (optional)

```bash
just build    # release checks + dist/extension-starter.zip (readable, unminified — the store upload)
```

Needs, on top of the requirements above: [`jq`](https://jqlang.github.io/jq/), `zip`, `unzip`, `git`, and Playwright's Chromium (`npx playwright install chromium`). What the release checks are: [BUILD.md](BUILD.md).

## Troubleshooting

- **"Manifest file is missing or unreadable"** — you selected the repository root or a parent folder; select `dist/dev` (or `dist/prod`), and build first if it does not exist.
- **Nothing reloads after a save** — another extension's `just dev` owns the dev-reload port; the terminal says `dev-reload: cannot listen on …`. Change `port` in `vite.config.ts`.
- **Errors after editing code** — check the red **Errors** button on the extension card, fix, reload.
