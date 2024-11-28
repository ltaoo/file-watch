/**
 * @file 控制内容显隐的组件
 */
import { JSX, createSignal } from "solid-js";

import { PresenceCore } from "@/domains/ui/presence";
import { cn } from "@/utils";

import { Show } from "./show";

export const Presence = (
  props: {
    store: PresenceCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const open = () => state().visible;
  const mounted = () => state().mounted;

  return (
    <Show when={mounted()}>
      <div
        class={cn("presence", props.class)}
        role="presentation"
        data-state={open() ? "open" : "closed"}
        onAnimationEnd={() => {
          store.unmount();
        }}
      >
        {props.children}
      </div>
    </Show>
  );
};
