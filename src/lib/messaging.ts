// Typed chrome.runtime messaging. One factory call per extension binds the
// message union and its response map; send() and listen() are then checked against them.

// a handler that threw (or an unknown message type): String(error)
export interface MessageError {
  error: string;
}

// M: union of { type: "…", …payload }. R: message type → what its handler answers with.
export function createMessenger<M extends { type: string }, R extends Record<M["type"], unknown>>() {
  return {
    // pages → worker. Resolves with undefined when no listener answered. No retries and no
    // catching here — a sleeping worker rejects, and callers decide whether that matters.
    send<T extends M>(message: T): Promise<R[T["type"]] | MessageError | undefined> {
      return chrome.runtime.sendMessage<T, R[T["type"]] | MessageError | undefined>(message);
    },
    // worker side: call once, synchronously at module evaluation (MV3 only wakes the worker
    // for listeners registered that way). A handler that throws answers { error } — the
    // MessageError every send() caller already has to narrow away.
    listen(handler: (message: M, sender: chrome.runtime.MessageSender) => Promise<R[M["type"]]>): void {
      chrome.runtime.onMessage.addListener((message: M, sender, sendResponse) => {
        // Promise.resolve().then: a handler that throws synchronously is answered too
        Promise.resolve()
          .then(() => handler(message, sender))
          .then(sendResponse, (error) => sendResponse({ error: String(error) } satisfies MessageError));
        return true; // the answer comes asynchronously — keep the channel open
      });
    },
  };
}
