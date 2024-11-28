import { JSX, onCleanup } from "solid-js";

import { FocusScopeCore } from "@/domains/ui/focus-scope";

const FocusScopeRoot = (props: { store: FocusScopeCore; children: JSX.Element }) => {
  const { store } = props;

  let $node: HTMLDivElement | undefined;

  store.onFocusin(() => {
    focus($node);
  });

  document.addEventListener("focusin", store.focusin);
  document.addEventListener("focusout", store.focusout);

  onCleanup(() => {
    document.removeEventListener("focusin", store.focusin);
    document.removeEventListener("focusout", store.focusout);
  });

  return (
    <div
      ref={$node}
      tabindex={-1}
      onKeyDown={(event) => {
        // if (!loop && !trapped) {
        //   return;
        // }
        // const isTabKey =
        //   event.key === "Tab" &&
        //   !event.altKey &&
        //   !event.ctrlKey &&
        //   !event.metaKey;
        // const focusedElement = document.activeElement as HTMLElement | null;
      }}
    >
      {props.children}
    </div>
  );
};

type FocusableTarget = HTMLElement | { focus(): void };
function focus(element?: FocusableTarget | null, { select = false } = {}) {
  // only focus if that element is focusable
  if (element && element.focus) {
    const previouslyFocusedElement = document.activeElement;
    // NOTE: we prevent scrolling on focus, to minimize jarring transitions for users
    element.focus({ preventScroll: true });
    // only select if its not the same element, it supports selection and we need to select
    if (element !== previouslyFocusedElement && isSelectableInput(element) && select) {
      element.select();
    }
  }
}

function isSelectableInput(element: unknown): element is FocusableTarget & { select: () => void } {
  return element instanceof HTMLInputElement && "select" in element;
}

const Root = FocusScopeRoot;
export { Root };
