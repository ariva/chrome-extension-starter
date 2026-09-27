// A standalone popup WINDOW (chrome.windows, type "popup") showing one extension page —
// unlike action.default_popup it survives losing focus. One instance: a second call
// focuses the window that is already open.
export interface PopupWindowSize {
  width: number;
  height: number;
  top?: number; // px below the browser window's top edge; omitted = Chrome's default placement
}

export async function openPopupWindow(path: string, { top, ...size }: PopupWindowSize): Promise<void> {
  const url = chrome.runtime.getURL(path);
  // runtime.getContexts, not a remembered window id: nothing to persist across worker
  // sleeps, nothing to go stale. A popup window's page is a "TAB" context.
  const contexts = await chrome.runtime.getContexts({ contextTypes: ["TAB"] });
  const open = contexts.find((context) => context.documentUrl?.startsWith(url));
  if (open) {
    await chrome.windows.update(open.windowId, { focused: true });
    return;
  }
  // centred over the browser window the user is in — the worker has no `screen`, and this
  // lands on the right monitor for free
  const anchor = await chrome.windows.getLastFocused();
  const position: { left?: number; top?: number } = {};
  if (anchor.left !== undefined && anchor.width !== undefined) {
    position.left = Math.round(anchor.left + (anchor.width - size.width) / 2);
  }
  if (top !== undefined && anchor.top !== undefined) {
    position.top = anchor.top + top;
  }
  try {
    await chrome.windows.create({ url, type: "popup", ...size, ...position });
  } catch {
    // "Bounds must be at least 50% within visible screen space" — browser window low or half
    // off-screen. A window in Chrome's default spot beats no window at all.
    await chrome.windows.create({ url, type: "popup", ...size });
  }
}
