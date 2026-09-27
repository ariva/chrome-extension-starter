import { loadName, localStore } from "../../app/storage.ts";
import { getElementById } from "../../lib/dom.ts";
import { markDevPage } from "../../lib/env.ts";

const field = getElementById("name");
const saved = getElementById<HTMLElement>("saved");

field.addEventListener("change", async () => {
  await localStore.set({ name: field.value.trim() });
  saved.hidden = false;
  setTimeout(() => (saved.hidden = true), 1500);
});

// the popup's Rename edits the same pref
chrome.storage.onChanged.addListener(async () => {
  field.value = await loadName();
});

markDevPage();
field.value = await loadName();
