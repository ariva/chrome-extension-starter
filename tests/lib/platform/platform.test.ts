import assert from "node:assert/strict";
import { test } from "vitest";
import { capabilities } from "../../../src/lib/platform/capabilities.ts";
import { faviconUrl } from "../../../src/lib/platform/favicon.ts";
import { openPanel, openPanelOnActionClick } from "../../../src/lib/platform/panel.ts";
import { openPopupWindow } from "../../../src/lib/platform/popup-window.ts";

// hand-rolled fake — `as`: a partial stand-in for the chrome global
function fakeChrome(fake: object): void {
  globalThis.chrome = fake as unknown as typeof chrome;
}

test("Lib - Platform - Capabilities: tabGroups follows the API's presence, detected at the point of use", () => {
  fakeChrome({});
  assert.equal(capabilities.tabGroups, false);
  fakeChrome({ tabGroups: {} });
  assert.equal(capabilities.tabGroups, true);
});

test("Lib - Platform - Favicon: _favicon/ URL of the extension with pageUrl and size encoded", () => {
  fakeChrome({ runtime: { getURL: (path: string) => `chrome-extension://abc${path}` } });
  assert.equal(
    faviconUrl("https://example.com/a?b=1&c=2", 16),
    "chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1%26c%3D2&size=16",
  );
});

test("Lib - Platform - Panel: open targets the window, action click is wired to open the panel", async () => {
  const calls: unknown[][] = [];
  fakeChrome({
    sidePanel: {
      open: async (options: unknown) => {
        calls.push(["open", options]);
      },
      setPanelBehavior: async (options: unknown) => {
        calls.push(["setPanelBehavior", options]);
      },
    },
  });

  await openPanel(7);
  await openPanelOnActionClick();

  assert.deepEqual(calls, [
    ["open", { windowId: 7 }],
    ["setPanelBehavior", { openPanelOnActionClick: true }],
  ]);
});

test("Lib - Platform - Panel: a refused open (no user gesture) rejects for the caller to handle", async () => {
  fakeChrome({
    sidePanel: {
      open: async () => {
        throw new Error("may only be called in response to a user gesture");
      },
    },
  });
  await assert.rejects(openPanel(1), /user gesture/);
});

function fakePopupChrome(contexts: object[], calls: unknown[][]): void {
  fakeChrome({
    runtime: {
      getURL: (path: string) => `chrome-extension://abc/${path}`,
      getContexts: async () => contexts,
    },
    windows: {
      getLastFocused: async () => ({ left: 100, top: 50, width: 1000, height: 800 }),
      create: async (options: unknown) => {
        calls.push(["create", options]);
      },
      update: async (windowId: number, options: unknown) => {
        calls.push(["update", windowId, options]);
      },
    },
  });
}

test("Lib - Platform - Popup window: creates a popup-type window for the page when none is open", async () => {
  const calls: unknown[][] = [];
  fakePopupChrome([{ documentUrl: "chrome-extension://abc/options/index.html", windowId: 3 }], calls);

  await openPopupWindow("popup/index.html", { width: 300, height: 200 });

  // left: 100 + (1000 - 300) / 2 — centred over the focused browser window; no `top` asked, none set
  assert.deepEqual(calls, [
    ["create", { url: "chrome-extension://abc/popup/index.html", type: "popup", width: 300, height: 200, left: 450 }],
  ]);
});

test("Lib - Platform - Popup window: `top` is an offset from the focused browser window's top edge", async () => {
  const calls: unknown[][] = [];
  fakePopupChrome([], calls);

  await openPopupWindow("popup/index.html", { width: 300, height: 200, top: 100 });

  assert.deepEqual(calls, [
    [
      "create",
      { url: "chrome-extension://abc/popup/index.html", type: "popup", width: 300, height: 200, left: 450, top: 150 },
    ],
  ]);
});

test("Lib - Platform - Popup window: bounds Chrome rejects (mostly off-screen) fall back to default placement", async () => {
  const calls: unknown[][] = [];
  fakePopupChrome([], calls);
  const create = chrome.windows.create as unknown as (options: { left?: number }) => Promise<void>;
  chrome.windows.create = (async (options: { left?: number }) => {
    if (options.left !== undefined) {
      throw new Error("Invalid value for bounds.");
    }
    await create(options);
  }) as unknown as typeof chrome.windows.create;

  await openPopupWindow("popup/index.html", { width: 300, height: 200, top: 100 });

  assert.deepEqual(calls, [
    ["create", { url: "chrome-extension://abc/popup/index.html", type: "popup", width: 300, height: 200 }],
  ]);
});

test("Lib - Platform - Popup window: focuses the open one instead of creating a second", async () => {
  const calls: unknown[][] = [];
  fakePopupChrome([{ documentUrl: "chrome-extension://abc/popup/index.html#x", windowId: 9 }], calls);

  await openPopupWindow("popup/index.html", { width: 300, height: 200 });

  assert.deepEqual(calls, [["update", 9, { focused: true }]]);
});
