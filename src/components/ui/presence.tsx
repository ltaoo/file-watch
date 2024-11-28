/**
 * @file 控制内容显隐的组件
 */
import { JSX, Show, createSignal } from "solid-js";

import { PresenceCore } from "@/domains/ui/presence";
import { cn } from "@/utils/index";

export const Presence = (
  props: {
    store: PresenceCore;
    enterClassName?: string;
    exitClassName?: string;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store, enterClassName, exitClassName, onClick } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => setState(v));

  return (
    <Show when={state().mounted}>
      <div
        class={cn(
          "presence",
          state().enter && enterClassName ? enterClassName : "",
          state().exit && exitClassName ? exitClassName : "",
          props.class
        )}
        role="presentation"
        data-state={state().visible ? "open" : "closed"}
        // onAnimationEnd={() => {
        //   store.unmount();
        // }}
        onClick={onClick}
      >
        {props.children}
      </div>
    </Show>
  );
};
