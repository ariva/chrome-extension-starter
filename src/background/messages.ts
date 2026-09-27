// The runtime.onMessage dispatcher: one exhaustive switch over the Message union.
import type { Message, MessageResponses } from "../app/messages.ts";
import { sessionStore } from "../app/storage.ts";

export async function handleMessage(message: Message): Promise<MessageResponses[Message["type"]]> {
  switch (message.type) {
    case "ping":
      return { pong: Date.now() };
    case "page-title":
      return { title: await pageTitle() };
    default:
      // every Message member is handled above, so `message` is `never` here — but an
      // unknown type can still arrive at runtime
      throw new Error(`unknown message ${(message as { type: string }).type}`);
  }
}

// `scripting` demo: run a function inside the page the toolbar button was clicked on.
// Rejects on pages no extension may touch (chrome://, the Web Store) or once the tab has
// navigated away (activeTab is gone) — listen() turns that into { error }.
async function pageTitle(): Promise<string> {
  const { targetTabId } = await sessionStore.get("targetTabId");
  if (targetTabId === undefined) {
    throw new Error("no page yet — click the toolbar button on a tab");
  }
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId: targetTabId },
    func: () => document.title, // serialized and run in the page — no closures
  });
  return injection?.result ?? "";
}
