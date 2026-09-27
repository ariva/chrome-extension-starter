import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "./fixtures.ts";

const { version } = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8"));

test("service worker registers and reports the packaged version", async ({ serviceWorker }) => {
  const manifest = await serviceWorker.evaluate(() => chrome.runtime.getManifest());
  expect(manifest.version).toBe(version);
  expect(manifest.manifest_version).toBe(3);
});

test("pages boot, the worker answers, the pref round-trips, zero network requests", async ({
  context,
  extensionId,
  networkRequests,
}) => {
  const errors: string[] = [];
  // Playwright cannot click the toolbar button — the same page as a tab runs the same code
  const popup = await context.newPage();
  popup.on("pageerror", (error) => errors.push(error.message));
  await popup.goto(`chrome-extension://${extensionId}/popup/index.html`);
  await expect(popup.locator("#hello")).toHaveText(/Hello, world!$/); // unpacked = dev copy: "DEV · " prefix
  await expect(popup.locator("#version")).toHaveText(`v${version}`);

  await popup.locator("#ping").click();
  await expect(popup.locator("#answer")).toHaveText(/^pong \d+$/);
  await expect(popup.locator("#toast")).toBeVisible(); // features.json shipped and TOAST_ON_PONG is on

  // no toolbar click happened, so no tab was granted: the worker's error arrives as text, not a crash
  await popup.locator("#page-title").click();
  await expect(popup.locator("#answer")).toHaveText(/no page yet/);

  const options = await context.newPage();
  options.on("pageerror", (error) => errors.push(error.message));
  await options.goto(`chrome-extension://${extensionId}/options/index.html`);
  await options.locator("#name").fill("starter");
  await options.locator("#name").blur();
  await expect(popup.locator("#hello")).toHaveText(/Hello, starter!$/);

  await popup.locator("#close").click();
  await expect.poll(() => popup.isClosed()).toBe(true);

  expect(errors).toEqual([]);
  expect(networkRequests).toEqual([]);
});

test("the toolbar click opens one popup window and a second click reuses it", async ({ context, serviceWorker }) => {
  const page = await context.newPage();
  // what Chrome does on a toolbar click, minus the click: fire the worker's own listener
  const click = () =>
    serviceWorker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      // dispatch exists on real chrome events; it is just not in the typings
      (chrome.action.onClicked as unknown as { dispatch: (tab: unknown) => void }).dispatch(tab);
    });
  const popups = () =>
    serviceWorker.evaluate(async () => (await chrome.windows.getAll({ windowTypes: ["popup"] })).length);

  await click();
  await expect.poll(popups).toBe(1);
  await click();
  await page.waitForTimeout(300);
  expect(await popups()).toBe(1);
});
