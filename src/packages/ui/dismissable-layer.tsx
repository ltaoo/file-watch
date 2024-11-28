import { JSX, onCleanup, onMount } from "solid-js";

import { DismissableLayerCore } from "@/domains/ui/dismissable-layer";

export const DismissableLayer = (props: { store: DismissableLayerCore; asChild?: boolean; children: JSX.Element }) => {
  const { store } = props;

  let $node: HTMLDivElement | undefined = undefined;
  let timerId: number | null = null;

  const node = {};
  const ownerDocument = globalThis?.document;
  const handlePointerDown = (event: PointerEvent) => {
    if (!event.target) {
      return;
    }
    const f = () => {
      store.handlePointerDownOnTop();
    };
    if (event.pointerType === "touch") {
      ownerDocument.removeEventListener("click", f);
      ownerDocument.addEventListener("click", f, {
        once: true,
      });
      return;
    }
    store.handlePointerDownOnTop();
  };
  onMount(() => {
    store.layers.add(node);
    timerId = window.setTimeout(() => {
      ownerDocument.addEventListener("pointerdown", handlePointerDown);
    }, 0);
    // app.disablePointer();
    //     const handleFocus = (event: FocusEvent) => {
    //       if (event.target && !isFocusInsideReactTreeRef.current) {
    //         const eventDetail = { originalEvent: event };
    //       }
    //     };
    //     ownerDocument.addEventListener("focusin", handleFocus);
  });
  onCleanup(() => {
    store.layers.delete(node);
    store.layersWithOutsidePointerEventsDisabled.delete(node);
    if (timerId !== null) {
      window.clearTimeout(timerId);
    }
    ownerDocument.removeEventListener("pointerdown", handlePointerDown);
    ownerDocument.removeEventListener("click", store.handlePointerDownOnTop);
    // app.enablePointer();
  });

  return (
    <div
      ref={$node}
      class="dismissable-layer"
      style={{}}
      onPointerDown={() => {
        store.pointerDown();
      }}
    >
      {props.children}
    </div>
  );
};

const CONTEXT_UPDATE = "dismissableLayer.update";
const POINTER_DOWN_OUTSIDE = "dismissableLayer.pointerDownOutside";
const FOCUS_OUTSIDE = "dismissableLayer.focusOutside";

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;
type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;

/**
 * Listens for `pointerdown` outside a react subtree. We use `pointerdown` rather than `pointerup`
 * to mimic layer dismissing behaviour present in OS.
 * Returns props to pass to the node we want to check for outside events.
 */
function usePointerDownOutside(
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void,
  ownerDocument: Document = globalThis?.document
) {
  //   const handlePointerDownOutside = useCallbackRef(
  //     onPointerDownOutside
  //   ) as EventListener;
  //   const isPointerInsideReactTreeRef = React.useRef(false);
  //   const handleClickRef = React.useRef(() => {});
}

function handleAndDispatchCustomEvent<E extends CustomEvent, OriginalEvent extends Event>(
  name: string,
  handler: ((event: E) => void) | undefined,
  detail: { originalEvent: OriginalEvent } & (E extends CustomEvent<infer D> ? D : never),
  { discrete }: { discrete: boolean }
) {
  const target = detail.originalEvent.target;
  const event = new CustomEvent(name, {
    bubbles: false,
    cancelable: true,
    detail,
  });
  if (handler) {
    target.addEventListener(name, handler as EventListener, { once: true });
  }
  target.dispatchEvent(event);
}
