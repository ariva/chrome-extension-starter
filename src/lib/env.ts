// Store installs get `update_url` injected into the manifest; an unpacked
// (local dev) copy never has it. Lets both run side by side distinguishably.
export const IS_DEV = !chrome.runtime.getManifest().update_url;

export const DEV_PREFIX = IS_DEV ? "DEV · " : "";

// manifest version as shipped, e.g. "0.1.0"
export function getReleaseVersion(): string {
  return chrome.runtime.getManifest().version;
}

// prefix tab title + page heading so the dev copy's pages are unmistakable
export function markDevPage(): void {
  if (!IS_DEV) {
    return;
  }
  document.title = DEV_PREFIX + document.title;
  const heading = document.querySelector("h1");
  if (heading) {
    heading.textContent = DEV_PREFIX + heading.textContent;
  }
}

// worker side: dev icon + "dev" badge on the toolbar button (icons/dev/ exists in dist/dev only)
export async function markDevAction(): Promise<void> {
  if (!IS_DEV) {
    return;
  }
  await chrome.action
    // root-relative: setIcon resolves bare paths against the worker's own directory
    .setIcon({ path: { 16: "/icons/dev/icon16.png", 32: "/icons/dev/icon32.png" } })
    // dist/prod loaded unpacked (e2e, manual check) has no dev icons — keep the stock one
    .catch(() => {});
  await chrome.action.setBadgeText({ text: "dev" });
  await chrome.action.setBadgeBackgroundColor({ color: "#1a63d4" });
}
