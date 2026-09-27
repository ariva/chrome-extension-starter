// Shared DOM helpers for extension pages (popup, options).

// document.getElementById for ids the page's static markup guarantees. Typed as a
// form control by default — covers .value/.checked/.disabled on the inputs and
// buttons these pages look up; pass T for anything else (select, template, …).
// `as`: the id → element type pairing lives in the HTML, which TS cannot see.
export const getElementById = <T extends HTMLElement = HTMLInputElement>(id: string) =>
  document.getElementById(id) as T;

// event.target → nearest ancestor matching `selector`, or null. Replaces the
// cast-then-closest idiom: event targets are EventTarget, not Element.
// Duck-typed, not instanceof: a target can come from another realm (iframe, test DOM).
export function closest<T extends Element = HTMLElement>(target: EventTarget | null, selector: string): T | null {
  return target && "closest" in target ? (target as Element).closest<T>(selector) : null;
}

// querySelector for nodes the page cannot work without (static markup, templates):
// a readable error at the lookup instead of "cannot read properties of null" later
export function mustQuery<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) {
    throw new Error(`missing element: ${selector}`);
  }
  return found;
}
