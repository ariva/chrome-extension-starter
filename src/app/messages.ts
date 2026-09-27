// chrome.runtime messages the service worker answers: the union, the response map, and the
// typed send() (pages) / listen() (worker). Add a message = add a member here, its response
// below, and its case in src/background/messages.ts — forgetting one does not compile.
import { createMessenger } from "../lib/messaging.ts";

export type Message = { type: "ping" } | { type: "page-title" };

// message type → what its handler answers with
export interface MessageResponses {
  ping: { pong: number };
  "page-title": { title: string };
}

export const { send, listen } = createMessenger<Message, MessageResponses>();
