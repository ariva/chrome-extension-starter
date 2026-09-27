# Building

How the source becomes a loadable extension, which command does what, and what the optional minified build buys you. Setup (Node 24, `npm install`, `just`) is in [INSTALL.md](INSTALL.md); how the build is wired is in [ARCHITECTURE.md](ARCHITECTURE.md#build-dev-loop-release); the test tiers are in [TESTING.md](TESTING.md).

Every command goes through [`just`](https://github.com/casey/just) — run `just --list` to see them all.

## Commands

| Command | What it does | When to use it |
|---|---|---|
| `just dev` | Builds `dist/dev` and rebuilds on every save (source maps on, violet DEV icons); runs `tsc --watch` alongside. The loaded extension reloads itself after each rebuild. | While developing — leave it running. |
| `npx vite build` | One production build into `dist/prod`. No checks, no zip. | A quick look at what would ship. |
| `just check` | Biome lint + format check → strict `tsc` → unit and UI tests. | Before calling any change done. |
| `just test`, `just test-watch` | The unit + UI tier, once or re-running on save. | See [TESTING.md](TESTING.md). |
| `just test-browser` | Real-browser tier (headless Chromium). | Anything about focus, clicks, dialogs. |
| `just test-e2e` | Builds `dist/prod`, then runs the Playwright tests against the real extension. | Anything that depends on what Chrome really does. |
| `just build` | The release: every check below, then `dist/extension-starter.zip`. | Producing the store upload. |
| `just build minify=true` | Same release gate, minified output: `dist/extension-starter-min.zip`. | Only if you want the smaller zip — see [Minified build](#minified-build). |
| `just lint`, `just typecheck`, `just format` | The pieces of `check` on their own; `format` applies Biome's formatting and safe fixes. | |
| `just icons` | Renders `dev-assets/icons/icon.svg` into `public/icons/` and `dev-assets/icons/dev/` (headless Chromium). | After editing the icon. |
| `just clean` | Removes `dist/`. | |

The browser tiers need Playwright's Chromium once: `npx playwright install chromium`.

## What a build produces

```text
dist/dev/     development build — what you load unpacked while coding
dist/prod/    production build — what gets zipped
  manifest.json                   emitted from src/manifest.ts, version from package.json
  background/service-worker.js    the worker, at the fixed path the manifest points to
  popup/index.html, index.js      the popup window's page
  options/index.html, index.js    the options page
  chunks/*.js                     code shared between the worker and the pages
  assets/*.css                    page styles
  icons/                          from public/icons
  features.json                   copied from the repo root — the extension fetches it at run time
```

Output names are stable and unhashed on purpose: the manifest refers to files by path, and a readable, predictable file list is what `tests/structure/release-snapshot.test.ts` pins. `dist/dev` additionally contains `dev-reload-client.js` and the violet `icons/dev/` — neither is ever part of `dist/prod`.

The build is configured in `vite.config.ts`; the three small Vite plugins it uses live in `tooling/`.

## The dev loop

`just dev`, then load `dist/dev` once (`chrome://extensions` → Developer mode → Load unpacked). After that every save rebuilds (tens of milliseconds) and the extension updates itself:

- a change to a page — TypeScript, HTML or CSS of the popup or options — reloads the open extension pages;
- a change to the service worker, the manifest or code shared with the worker reloads the whole extension.

Type errors appear in the same terminal but never block the rebuild — Vite only strips types; `just check` is what enforces them. The reload signal reaches open extension pages only: if no popup or options page is open when you change the worker, reload once by hand from `chrome://extensions`.

The signal is an HTTP long-poll on `localhost:5184` (`port` in `vite.config.ts`). Two extensions in `just dev` at once need two ports.

## The release build

`just build` runs `scripts/build.sh`, which stops at the first failure:

1. `scripts/validate_versions.sh` — the version in `package.json` (the only place it lives) is newer than the latest `release-v*` git tag, and `CHANGES.md` has an entry for it.
2. `scripts/validate_hashes.sh` — every commit hash mentioned in `CHANGES.md` exists in git history.
3. `scripts/validate_code.sh` — `just check`.
4. `just test-browser`.
5. `scripts/pack.sh` — production build into `dist/prod`, zipped to `dist/extension-starter.zip`.
6. `npx playwright test` — the e2e tests, against the `dist/prod` that was just packed.

Inside step 3, the test suite also pins what ships: the zip's file list and manifest, no dev or tooling files, no dev-loop or network code, no source maps.

To cut a release: bump `version` in `package.json`, write the `CHANGES.md` entry, run `just build`, tag `release-v<version>`.

## Minified build

```bash
just build minify=true     # or: just build true
```

Same gate, same checks, but Vite minifies JavaScript and CSS and the zip is named `dist/extension-starter-min.zip`. Without the gate: `MINIFY=1 scripts/pack.sh`. The default build — and the store upload — stays unminified: extension files load from the local disk, so minifying buys kilobytes, not speed, and costs source a store reviewer can read and stack traces you can read.

## When a build fails

| Message | Cause |
|---|---|
| `version … is not greater than previous release …` | `package.json` was not bumped since the last `release-v*` tag. |
| `CHANGES.md has no release notes entry for v…` | Add the `## v<version> — <date>` section. |
| `CHANGES.md references unknown commit: …` | A hash in the notes is not in git history (typo, or a rebased commit). |
| `shipped file list changed` / `shipped manifest changed` | The build now emits something different. If that is intended: `UPDATE_SNAPSHOT=1 npx vitest run tests/structure/release-snapshot.test.ts`, and review the diff of `tests/fixtures/release-snapshot.json`. |
| `The release zip (dist/prod) contains "…"` | Dev-only or network code leaked into the production build. The message names the file and line, what the string means, and how to fix it. |
| `The release zip contains source maps: …` | `build.sourcemap` is on outside development mode — check `vite.config.ts`. |
| Playwright: `Executable doesn't exist` | `npx playwright install chromium`. |
| Vitest refuses to start / odd syntax errors | Wrong Node version — `nvm use` (the repo pins Node 24 in `.nvmrc`). |
