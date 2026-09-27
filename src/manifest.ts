// The extension manifest as code, emitted as manifest.json by tooling/manifest-plugin.ts.
// The version lives in package.json only. `target` exists so a second browser would be a
// second branch here.
export type BuildTarget = "chrome";

export const EXTENSION_NAME = "Extension Starter";

export function manifest(version: string, _target: BuildTarget = "chrome"): chrome.runtime.ManifestV3 {
  return {
    manifest_version: 3,
    name: EXTENSION_NAME,
    description: "Typed MV3 starter: service worker, popup window, options page, storage, messaging.",
    version,
    minimum_chrome_version: "121",

    // Starter default set. The demo uses storage, scripting and activeTab; the rest is there so
    // the usual APIs work on day one. DELETE what the real extension does not call before
    // publishing — the Chrome Web Store rejects unused permissions (.private/publish/PUBLISHING.md).
    // activeTab is what makes `scripting` work without host permissions: a toolbar click grants
    // access to that one tab.
    permissions: [
      "tabs",
      "tabGroups",
      "storage",
      "alarms",
      "contextMenus",
      "sidePanel",
      "favicon",
      "scripting",
      "activeTab",
    ],

    background: { service_worker: "background/service-worker.js", type: "module" },

    // no default_popup on purpose: the click goes to action.onClicked in the worker, which
    // opens popup/index.html as a window (src/background/service-worker.ts)
    action: { default_title: EXTENSION_NAME, default_icon: { 16: "icons/icon16.png", 32: "icons/icon32.png" } },
    icons: { 16: "icons/icon16.png", 32: "icons/icon32.png", 48: "icons/icon48.png", 128: "icons/icon128.png" },

    options_page: "options/index.html",
  };
}
