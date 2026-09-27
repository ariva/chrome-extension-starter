import assert from "node:assert/strict";
import { test } from "vitest";
import { handleMessage } from "../../src/background/messages.ts";

// hand-rolled fake: session storage + scripting, the two things the dispatcher touches
function fakeChrome(session: Record<string, unknown>, executeScript?: (injection: unknown) => Promise<unknown[]>) {
  globalThis.chrome = {
    storage: { session: { get: async () => session } },
    scripting: { executeScript },
  } as unknown as typeof chrome;
}

test("Service Worker - Messages - ping answers with a timestamp", async () => {
  const before = Date.now();
  const response = await handleMessage({ type: "ping" });
  assert.ok("pong" in response && response.pong >= before);
});

test("Service Worker - Messages - page-title runs a script in the tab the toolbar button was clicked on", async () => {
  const injected: unknown[] = [];
  fakeChrome({ targetTabId: 42 }, async (injection) => {
    injected.push(injection);
    return [{ result: "Example Domain" }];
  });

  assert.deepEqual(await handleMessage({ type: "page-title" }), { title: "Example Domain" });
  assert.deepEqual((injected[0] as { target: unknown }).target, { tabId: 42 });
});

test("Service Worker - Messages - page-title without a clicked tab, and an unknown type, reject", async () => {
  fakeChrome({});
  await assert.rejects(handleMessage({ type: "page-title" }), /no page yet/);
  await assert.rejects(handleMessage({ type: "nope" } as never), /unknown message nope/);
});
