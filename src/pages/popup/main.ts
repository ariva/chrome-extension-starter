// The popup window's page. Opened by the worker (action.onClicked), talks to it through
// send(), shares the `name` pref with the options page through storage.
import { type Message, send } from "../../app/messages.ts";
import { loadFeatures, loadName, localStore } from "../../app/storage.ts";
import { getElementById } from "../../lib/dom.ts";
import { DEV_PREFIX, getReleaseVersion, markDevPage } from "../../lib/env.ts";
import { askDialog } from "../../lib/ui/ask-dialog.ts";
import { toast } from "../../lib/ui/toast.ts";

const hello = getElementById<HTMLElement>("hello");
const answer = getElementById<HTMLOutputElement>("answer");

async function render(): Promise<void> {
  hello.textContent = `${DEV_PREFIX}Hello, ${await loadName()}!`;
}

// one round trip to the worker; shows the error side, returns the data side
async function ask<T extends Message>(message: T) {
  const response = await send(message).catch((error) => ({ error: String(error) }));
  if (!response || "error" in response) {
    answer.textContent = response?.error ?? "no answer";
    return null;
  }
  return response;
}

getElementById("ping").addEventListener("click", async () => {
  const response = await ask({ type: "ping" });
  if (!response) {
    return;
  }
  answer.textContent = `pong ${response.pong}`;
  if ((await loadFeatures()).TOAST_ON_PONG?.enabled) {
    toast("The worker answered");
  }
});

getElementById("page-title").addEventListener("click", async () => {
  const response = await ask({ type: "page-title" });
  if (response) {
    answer.textContent = `page title: ${response.title}`;
  }
});

getElementById("rename").addEventListener("click", async () => {
  const name = await askDialog({ message: "Your name", input: { initial: await loadName() }, okLabel: "Save" });
  if (typeof name === "string") {
    await localStore.set({ name: name.trim() });
  }
});

getElementById("options").addEventListener("click", () => chrome.runtime.openOptionsPage());
getElementById("close").addEventListener("click", () => window.close());

getElementById<HTMLElement>("version").textContent = `v${getReleaseVersion()}`;
markDevPage();
chrome.storage.onChanged.addListener(render); // the options page edits the same pref
void render();
