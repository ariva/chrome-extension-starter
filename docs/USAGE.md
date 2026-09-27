# Using the starter

How to turn this repository into your extension. What the code looks like and why: [ARCHITECTURE.md](ARCHITECTURE.md).

## Rename checklist

| What | Where |
|---|---|
| Extension name, description | `src/manifest.ts` (`EXTENSION_NAME`, `description` — the store caps it at 132 characters) |
| Package name, author | `package.json` (`version` here is the only version — the build stamps it into `manifest.json`) |
| Zip name | `scripts/pack.sh` (`extension-starter.zip`, twice) |
| Page titles | `src/pages/popup/index.html`, `src/pages/options/index.html` |
| Icons | `dev-assets/icons/icon.svg`, then `just icons` — regenerates `public/icons/` (shipped) and `dev-assets/icons/dev/` (the dev copy's toolbar icon, same shape in violet; colours in `scripts/generate-icons.mjs`) — 16, 32, 48, 128 px PNG |
| Permissions | `src/manifest.ts` — delete what you do not call, then `UPDATE_SNAPSHOT=1 npx vitest run tests/structure/release-snapshot.test.ts` |
| Dev-reload port | `vite.config.ts` (`port: 5184`) — only matters when two extensions run `just dev` at the same time |
| Licence, README | `LICENCE`, `README.md` |
| Store listing | `.private/publish/PUBLISHING.md` (gitignored) |

`rg -i "extension.starter"` finds every leftover.

## Adding a message (page → worker)

1. `src/app/messages.ts` — add a member to `Message` and its answer to `MessageResponses`. A member without a response entry does not compile.
2. `src/background/messages.ts` — add the `case`. The `switch` is exhaustive; a throw becomes `{ error }` on the sender's side.
3. In a page: `const response = await send({ type: "…" })`, then narrow — it is `undefined` (nobody answered), `{ error }`, or your answer. `src/pages/popup/main.ts` has the pattern (`ask()`).
4. Test the case in `tests/background/messages.test.ts`.

## Adding a stored key

Add it to `LocalStorageSchema` (survives restarts) or `SessionStorageSchema` (cleared with the browser, survives worker sleeps) in `src/app/storage.ts`. `localStore` / `sessionStore` are typed from the schema. Pages that show a stored value re-render on `chrome.storage.onChanged` instead of being told — that is how the popup and the options page stay in sync.

The service worker keeps **no state in module variables** — Chrome stops it after about 30 idle seconds. Anything that must survive goes to storage.

## Adding a page

1. `src/pages/<name>/index.html` + `main.ts` (+ a CSS file importing `../../styles/common.css`).
2. `vite.config.ts` — add `"<name>/index"` to `rollupOptions.input` and `"<name>"` to `devReloadPlugin({ pageDirs })`.
3. Reference it from `src/manifest.ts` if Chrome should open it (`side_panel.default_path`, `options_page`, …). Pages must sit exactly one directory deep.
4. Update the release snapshot (command above).

## A classic toolbar popup instead of a window

The starter opens a real window because it survives losing focus. For the small bubble under the toolbar button instead: set `action.default_popup: "popup/index.html"` in `src/manifest.ts` and delete the `chrome.action.onClicked` listener in `src/background/service-worker.ts` (Chrome does not fire it when a default popup exists). `window.close()` — the close button — works in both.

## Feature flags

`features.json` at the repo root ships with the extension; `loadFeatures()` in `src/app/storage.ts` reads it, unknown flags read as disabled. One flag (`TOAST_ON_PONG`) shows the pattern; delete both if you do not need flags.

## Releasing

Bump `version` in `package.json`, add the `## v<version> — <date>` section to `CHANGES.md` (the `release-notes` agent skill writes it from git history), run `just build`, tag `release-v<version>`. Details: [BUILD.md](BUILD.md#the-release-build).
