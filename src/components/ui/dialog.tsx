/**
 * @file 对话框
 */
import { createSignal, JSX } from "solid-js";
import { LucideX as X } from "lucide-solid";

import * as DialogPrimitive from "@/packages/ui/dialog";
import { Show } from "@/packages/ui/show";
import { DialogCore } from "@/domains/ui/dialog";
import { cn } from "@/utils/index";

export function Dialog(
  props: {
    store: DialogCore;
    width?: string;
  } & JSX.HTMLAttributes<HTMLElement>
) {
  const { store, width = "w-full sm:max-w-lg" } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => setState(v));

  return (
    <DialogPrimitive.Root store={store}>
      <DialogPrimitive.Portal class="fixed inset-0 z-50 flex items-start justify-center sm:items-center" store={store}>
        <DialogPrimitive.Overlay
          class={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", "transition-all duration-200")}
          enterClassName="animate-in fade-in"
          exitClassName="animate-out fade-out"
          store={store}
        />
        <DialogPrimitive.Content
          class={cn(
            "fixed z-50 grid gap-4 rounded-b-lg bg-white p-6 duration-200",
            "sm:zoom-in-90 sm:rounded-lg",
            "dark:bg-slate-900"
          )}
          enterClassName="animate-in fade-in-90"
          exitClassName="animate-out fade-out"
          store={store}
        >
          <DialogPrimitive.Header class="flex flex-col space-y-2 text-center sm:text-left">
            <DialogPrimitive.Title class={cn("text-lg font-semibold text-slate-900", "dark:text-slate-50")}>
              {state().title}
            </DialogPrimitive.Title>
          </DialogPrimitive.Header>
          {props.children}
          <Show when={state().closeable}>
            <DialogPrimitive.Close
              class={cn(
                "absolute top-4 right-4 cursor-pointer rounded-sm",
                "opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none",
                "dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
                "data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
              )}
              store={store}
            >
              <X width={15} height={15} />
              <span class="sr-only">Close</span>
            </DialogPrimitive.Close>
          </Show>
          <Show when={state().footer}>
            <DialogPrimitive.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <div class="space-x-2">
                <DialogPrimitive.Cancel store={store}>取消</DialogPrimitive.Cancel>
                <DialogPrimitive.Submit store={store}>确认</DialogPrimitive.Submit>
              </div>
            </DialogPrimitive.Footer>
          </Show>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
