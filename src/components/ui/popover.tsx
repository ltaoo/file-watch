/**
 * @file 气泡 组件
 */
import { Show } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { X } from "lucide-solid";

import { PopoverCore } from "@/domains/ui/popover";
import { Align, Side } from "@/domains/ui/popper";
import * as PopoverPrimitive from "@/packages/ui/popover";
import { cn } from "@/utils";

export const Popover = (
  props: {
    store: PopoverCore;
    content: JSX.Element;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <PopoverPrimitive.Root store={store}>
      <Show when={props.children}>
        <PopoverPrimitive.Trigger store={store} class="inline-flex items-center justify-center">
          {props.children}
        </PopoverPrimitive.Trigger>
      </Show>
      <PopoverPrimitive.Portal store={store}>
        <PopoverPrimitive.Content
          store={store}
          class={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "relative rounded-md p-5 w-64 bg-white shadow-lg focus:shadow-md focus:ring-2 focus:ring-violet-700",
            props.class
          )}
        >
          <div>{props.content}</div>
          <PopoverPrimitive.Close
            store={store}
            class="font-inherit rounded-full h-6 w-6 inline-flex items-center justify-center text-violet-900 absolute top-3 right-3"
          >
            <X class="w-4 h-4" />
          </PopoverPrimitive.Close>
          {/* <PopoverPrimitive.Arrow store={store} class="text-xl fill-white" /> */}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

export const PurePopover = (
  props: {
    content: JSX.Element;
    side?: Side;
    align?: Align;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { children, side = "bottom", align = "end" } = props;

  const store = new PopoverCore({
    side,
    align,
    strategy: "absolute",
  });

  return (
    <PopoverPrimitive.Root store={store}>
      <PopoverPrimitive.Trigger store={store} class="inline-flex items-center justify-center">
        {children}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal store={store}>
        <PopoverPrimitive.Content
          store={store}
          class={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "relative rounded-md p-5 w-64 bg-white shadow-lg focus:shadow-md focus:ring-2 focus:ring-violet-700",
            props.class
          )}
        >
          <div>{props.content}</div>
          <PopoverPrimitive.Close
            store={store}
            class="font-inherit rounded-full h-6 w-6 inline-flex items-center justify-center text-violet-900 absolute top-3 right-3"
          >
            <X class="w-4 h-4" />
          </PopoverPrimitive.Close>
          {/* <PopoverPrimitive.Arrow store={store} class="text-xl fill-white" /> */}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
