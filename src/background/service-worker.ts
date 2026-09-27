// Service-worker ENTRY (the manifest path): registers every chrome event listener
// synchronously at module evaluation — MV3 only wakes the worker for listeners registered
// that way — and hands each event to its module. No logic here.
// The worker is stateless across sleeps: whatever must survive goes to storage.
import { listen } from "../app/messages.ts";
import { sessionStore } from "../app/storage.ts";
import { markDevAction } from "../lib/env.ts";
import { openPopupWindow } from "../lib/platform/popup-window.ts";
import { handleMessage } from "./messages.ts";

// ---------- lifecycle ----------

chrome.runtime.onInstalled.addListener(markDevAction);
chrome.runtime.onStartup.addListener(markDevAction);

// ---------- toolbar button → popup window ----------

chrome.action.onClicked.addListener(async (tab) => {
  await sessionStore.set({ targetTabId: tab.id }); // the click granted activeTab on this tab
  await openPopupWindow("popup/index.html", { width: 760, height: 420, top: 300 });
});

// ---------- messages from the pages ----------

listen(handleMessage);
