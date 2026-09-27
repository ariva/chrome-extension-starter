# Extension Starter

A TypeScript Manifest V3 Chrome extension starter: service worker, popup window, options page, typed storage and messaging, a self-reloading dev loop, four test tiers and a release gate. Vanilla DOM, **no runtime dependencies**, zero network requests.

What the demo does: clicking the toolbar button makes the service worker open `popup/index.html` as a small window (one instance — a second click focuses it). The window has a close button, pings the worker, reads the clicked page's title through `chrome.scripting`, and shares a `name` preference with the options page through `chrome.storage`.

## Quick start

```bash
nvm use && npm install
just dev            # builds dist/dev, rebuilds on save, the loaded extension reloads itself
```

Then `chrome://extensions` → Developer mode → **Load unpacked** → `dist/dev`. Details: [docs/INSTALL.md](docs/INSTALL.md).

Starting a real extension from this: [docs/USAGE.md](docs/USAGE.md) — the rename checklist and how to add a message, a stored key, a page.

## Permissions

The manifest (`src/manifest.ts`) asks for a broad default set so the usual APIs work on day one. **Delete what your extension does not call before publishing** — the Chrome Web Store rejects unused permissions.

| Permission | Used by the demo | For |
|---|---|---|
| `storage` | yes | `chrome.storage.local` / `.session` |
| `scripting` | yes | `chrome.scripting.executeScript` |
| `activeTab` | yes | lets `scripting` reach the tab the toolbar button was clicked on — no host permissions needed |
| `tabs` | no | tab titles / URLs |
| `tabGroups` | no | tab groups |
| `alarms` | no | periodic work that survives worker sleep |
| `contextMenus` | no | right-click menu items |
| `sidePanel` | no | side panel UI (`src/lib/platform/panel.ts`) |
| `favicon` | no | `_favicon/` URLs (`src/lib/platform/favicon.ts`) |

## Documentation

- [Installation](docs/INSTALL.md) — requirements, load unpacked, the dev copy's DEV badge, troubleshooting.
- [Usage](docs/USAGE.md) — turning the starter into your extension.
- [Building](docs/BUILD.md) — every command, build output, the dev loop, the release gate, the minified build.
- [Architecture](docs/ARCHITECTURE.md) — layering, runtime surfaces, the generic library, data flow.
- [Testing](docs/TESTING.md) — the four tiers, layout and conventions.

## Licence

Free for personal, non-commercial use. Commercial use requires explicit permission from Arunas Ivanauskas (arunas.work.hg [ AT ] [g] [m] [a] [i] [l] [.] [c] [o] [m]). See [LICENCE](LICENCE).
