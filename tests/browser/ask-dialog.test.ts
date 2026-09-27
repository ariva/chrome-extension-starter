// The generic <dialog>-based prompt in a real browser: focus, Enter, Esc and the backdrop
// are browser behaviour happy-dom cannot judge.
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { askDialog } from "../../src/lib/ui/ask-dialog.ts";

const dialog = () => document.getElementById("ask-dialog") as HTMLDialogElement;
const open = () => askDialog({ message: "Your name", input: { initial: "" } });

test("opens modal with the input focused; Enter confirms with the typed value", async () => {
  const result = open();
  expect(dialog().open).toBe(true);
  expect(document.activeElement).toBe(dialog().querySelector(".ask-input"));
  await userEvent.keyboard("reader{Enter}");
  expect(await result).toBe("reader");
  expect(dialog().open).toBe(false);
});

test("Esc cancels", async () => {
  const result = open();
  await userEvent.keyboard("nope{Escape}");
  expect(await result).toBe(null);
});

test("a click on the backdrop cancels", async () => {
  const result = open();
  // the backdrop belongs to the dialog element: a click outside its box lands on it
  await userEvent.click(dialog(), { position: { x: -40, y: -40 }, force: true });
  expect(await result).toBe(null);
});
