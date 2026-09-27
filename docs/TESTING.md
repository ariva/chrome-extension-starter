# Testing

Four tiers, cheapest first. The first two run on every `just check`; the last two need a real browser and run on demand and in `just build`.

| Tier | Runs in | What belongs here | Command |
|---|---|---|---|
| **unit** | [Vitest](https://vitest.dev), plain Node | Pure logic, the worker's message dispatcher against a hand-rolled `chrome` fake, tooling, release packaging, changelog format | `just test` |
| **ui** | Vitest + [happy-dom](https://github.com/capricorn86/happy-dom) | DOM wiring against a stubbed `chrome.*` (`tests/lib/ui/` shows the pattern: install a happy-dom `Window`, then `await import()` the module) | `just test` |
| **browser** | Vitest Browser Mode, headless Chromium | What happy-dom cannot judge: focus / blur order, which element a click lands on, `<dialog>` and popover behaviour, drag & drop | `just test-browser` |
| **e2e** | [Playwright](https://playwright.dev), headless Chromium | The BUILT extension (`dist/prod`) in real Chrome: the worker registers, pages boot, the worker answers, a stored pref reaches another page, the toolbar click opens exactly one popup window, zero network requests | `just test-e2e` |

Rule of thumb: put a test in the cheapest tier that can actually fail for the bug.

## Setup

1. [Node.js](https://nodejs.org/) 24 LTS — `.nvmrc` pins it (`nvm use`).
2. `npm install`
3. [`just`](https://github.com/casey/just); `zip` / `unzip` for the release snapshot test.
4. Browser tiers only, once: `npx playwright install chromium`.

## Running

```bash
just check          # lint (Biome) + typecheck + unit + ui — also the gate inside `just build`
just format         # apply Biome formatting + safe lint fixes
just test           # unit + ui
just test-watch     # rerun affected tests on save
just test-browser   # real-browser tier
just test-e2e       # build dist/prod, then the Playwright smoke
just typecheck      # tsc --noEmit (strict)
```

Single file / filtered run:

```bash
npx vitest run tests/background/messages.test.ts
npx vitest run tests/lib                    # a whole folder
npx vitest run -t "Service Worker"
```

## Layout

`tests/` mirrors `src/`: a test lives where its subject lives.

| Folder | Covers |
|---|---|
| `tests/lib/` | The generic library: `messaging`, `storage`, `platform/`, `ui/` — hand-rolled fakes only, no extension imports |
| `tests/background/` | `messages.test.ts` — the worker's dispatcher as a plain async function |
| `tests/tooling/` | `dev-reload.test.ts` — what a rebuild means for the loaded extension |
| `tests/structure/` | Repo-wide guards: `lib-boundary` (generic code imports nothing from the extension layers), `no-import-cycles`, `changes` (CHANGES.md format), `justfile` (`build minify=true` really minifies), `release-snapshot` — packs through the real `scripts/pack.sh` and pins WHAT SHIPS (zip file list + manifest, no dev/tooling files, no dev-loop or network code, no source maps). Intended change: `UPDATE_SNAPSHOT=1 npx vitest run tests/structure/release-snapshot.test.ts` |
| `tests/browser/` | Real-browser tier (`ask-dialog.test.ts`) |
| `tests/e2e/` | Playwright on the built extension: `smoke.spec.ts`; `fixtures.ts` is a generic "one unpacked MV3 extension" fixture (`context`, `serviceWorker`, `extensionId`, `networkRequests`). Keep this tier small — seconds, under ~10 tests |
| `tests/fixtures/` | `release-snapshot.json` |

Add `tests/app/` and `tests/pages/` when those layers grow logic worth testing.

## Conventions

- Test names are prefixed by group: `Lib - `, `Service Worker - `, `Tooling - `, `Release Package - `, `Structure - `; description capitalized.
- Assertions use `node:assert/strict`; Vitest's `expect` is fine too (the browser tier uses it).
- Every test is strict TypeScript. Fakes are hand-rolled and hold only what the unit touches: `globalThis.chrome = { … } as unknown as typeof chrome`.
- `src/lib/ui` modules build DOM at import time — a ui test installs its DOM globals first, then `await import()`s the module.
- e2e: Playwright cannot click the toolbar button or open the popup surface. Pages are opened as tabs (same code), and the toolbar click is simulated with `chrome.action.onClicked.dispatch(tab)` inside the worker — `activeTab` is NOT granted that way, so real page scripting stays a manual check ([INSTALL.md](INSTALL.md#verify-it-works)).
- An unpacked extension is a dev copy (`src/lib/env.ts`), `dist/prod` included — e2e sees the `DEV · ` prefix.
- Keep pure logic `chrome.*`-free (`src/app/`) so it tests as plain functions.
- Never compare DOM nodes with `assert.equal` — a failure tries to print the whole node tree; compare a property or use `assert.ok(a === b)`.
