/**
 * @file ???
 */
import { createSignal, JSX, onCleanup, onMount } from "solid-js";

import { RouteViewCore } from "@/domains/route_view";
import { cn } from "@/utils/index";

export function KeepAliveRouteView(
  props: {
    store: RouteViewCore;
    index: number;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { store, index } = props;

  const [state, setState] = createSignal(store.$presence.state);

  // store.onStateChange((v) => setState(v));
  store.$presence.onStateChange((v) => setState(v));
  store.ready();
  onMount(() => {
    if (store.mounted) {
      return;
    }
    store.setShow();
  });
  onCleanup(() => {
    store.setUnmounted();
    store.destroy();
  });

  // const className = cn(mounted() ? "block" : "hidden", props.class);

  return (
    <div
      class={cn(
        props.class,
        state().enter ? `animate-in ${store.animation.in}` : "",
        state().exit ? `animate-out ${store.animation.out}` : ""
      )}
      style={{
        "z-index": index,
        display: state().visible ? "block" : "none",
      }}
      data-state={state().visible ? "open" : "closed"}
      data-title={store.title}
      data-href={store.href}
    >
      {props.children}
    </div>
  );
}
