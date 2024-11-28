import { onCleanup, onMount } from "solid-js";

function createFocusGuard() {
  const element = document.createElement("span");
  element.setAttribute("data-radix-focus-guard", "");
  element.tabIndex = 0;
  element.style.cssText =
    "outline: none; opacity: 0; position: fixed; pointer-events: none";
  return element;
}

let count = 0;
function useFocusGuards() {
  onMount(() => {
    const edgeGuards = document.querySelectorAll("[data-radix-focus-guard]");
    document.body.insertAdjacentElement(
      "afterbegin",
      edgeGuards[0] ?? createFocusGuard()
    );
    document.body.insertAdjacentElement(
      "beforeend",
      edgeGuards[1] ?? createFocusGuard()
    );
    count++;
  });
  onCleanup(() => {
    if (count === 1) {
      document
        .querySelectorAll("[data-radix-focus-guard]")
        .forEach((node) => node.remove());
    }
    count--;
  });
}
