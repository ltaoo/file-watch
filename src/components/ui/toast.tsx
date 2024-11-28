/**
 * @file 小黑块 提示
 */
import { For, createSignal, JSX } from "solid-js";

import * as ToastPrimitive from "@/packages/ui/toast";
import { ToastCore } from "@/domains/ui/toast";
import { cn } from "@/utils";

export const Toast = (props: { store: ToastCore }) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((v) => {
    setState(v);
  });

  return (
    <ToastPrimitive.Root store={store}>
      <ToastPrimitive.Portal store={store}>
        {/* <ToastPrimitive.Overlay
          store={store}
          class={cn("fixed inset-0 z-100 bg-black/50 backdrop-blur-sm transition-all duration-200")}
          enterClassName="animate-in fade-in"
          exitClassName="animate-out fade-out"
        /> */}
        <ToastPrimitive.Content
          store={store}
          class={cn(
            "grid gap-4 rounded-b-lg bg-black text-white p-6 duration-200 sm:max-w-lg sm:rounded-lg",
            "dark:bg-slate-900"
          )}
          enterClassName="animate-in fade-in-90 sm:zoom-in-90"
          exitClassName="animate-out fade-out"
        >
          <For each={state().texts}>
            {(text) => {
              return <div class="text-center">{text}</div>;
            }}
          </For>
        </ToastPrimitive.Content>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Root>
  );
};
