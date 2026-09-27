# MV3 extension built with Vite (see vite.config.ts).
# `just dev` builds dist/dev and keeps it fresh — load THAT folder unpacked in Chrome.
# `just build` runs the release gate and packs dist/prod into a zip.

set shell := ["bash", "-uc"]

default: check

# lint + typecheck + test
check: lint typecheck test

# Enforces braces on every `if` and that src/lib + tooling import nothing extension-specific.
# Biome: lint + format check in one pass (biome.json)
lint:
    npx biome check

# apply formatting and safe lint fixes
format:
    npx biome check --write

# strict type check, no emit — Vite transpiles without checking, so this is the gate
typecheck:
    npx tsc -p tsconfig.json

# unit + ui tests (Vitest, plain Node + happy-dom)
test:
    npx vitest run

# rerun affected tests on save
test-watch:
    npx vitest

# real-browser tier (Vitest Browser Mode, headless Chromium): focus, clicks, dialogs
test-browser:
    npx vitest run -c vitest.browser.config.ts

# end-to-end smoke: production build loaded into real headless Chromium (Playwright)
test-e2e:
    npx vite build --logLevel warn
    npx playwright test

# First time: chrome://extensions → Load unpacked → dist/dev. The loaded extension then
# reloads itself after each rebuild (tooling/dev-reload-plugin.ts); type errors stream alongside.
# development loop: rebuild dist/dev on every save (source maps, dev icons) + tsc --watch
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    npx tsc -p tsconfig.json --watch --preserveWatchOutput &
    npx vite build --watch --mode development

# `just build minify=true` (or `just build true`) packs a minified copy instead (…-min.zip); the
# store upload stays readable. just hands `minify=true` to the recipe as a literal argument, hence
# the regex. Details and measurements: docs/BUILD.md
# release gate (version, notes, hashes, check, browser tier) → pack dist/prod → e2e on the packed build
build minify="false":
    MINIFY={{ if minify =~ '^(minify=)?true$' { "1" } else { "" } }} ./scripts/build.sh

# edit dev-assets/icons/icon.svg, then run this; the PNGs are committed
# regenerate shipped + dev icon PNGs from the one SVG source (scripts/generate-icons.mjs)
icons:
    node scripts/generate-icons.mjs

# remove dist/
clean:
    rm -rf dist
