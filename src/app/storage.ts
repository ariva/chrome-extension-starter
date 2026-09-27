// The only doors to chrome.storage — keys and value types come from the schemas.
import { createStorage } from "../lib/storage.ts";

// survives browser restarts
export interface LocalStorageSchema {
  name: string;
}

// cleared when the browser closes; survives service-worker sleeps (module variables do not)
export interface SessionStorageSchema {
  /** the tab the toolbar button was last clicked on — what activeTab granted access to */
  targetTabId: number;
}

export const localStore = createStorage<LocalStorageSchema>("local");
export const sessionStore = createStorage<SessionStorageSchema>("session");

export const DEFAULT_NAME = "world";

export async function loadName(): Promise<string> {
  return (await localStore.get("name")).name || DEFAULT_NAME;
}

export type Features = Record<string, { enabled: boolean }>;

// features.json at the extension root (emitted by tooling/static-files-plugin.ts)
export async function loadFeatures(): Promise<Features> {
  try {
    return await (await fetch(chrome.runtime.getURL("features.json"))).json();
  } catch {
    return {}; // fail-closed: unknown flags read as disabled
  }
}
