/**
 * @file 小黑块 提示
 */
import { createSignal, JSX } from "solid-js";

import { Portal as PortalPrimitive } from "@/packages/ui/portal";
import { Presence } from "@/components/ui/presence";
import { ToastCore } from "@/domains/ui/toast";
import { cn } from "@/utils/index";

const Root = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Portal = (props: { store: ToastCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  return (
    <Presence store={store.present}>
      <PortalPrimitive>{props.children}</PortalPrimitive>
    </Presence>
  );
};

const Overlay = (
  props: { store: ToastCore; enterClassName?: string; exitClassName?: string } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store, enterClassName, exitClassName } = props;

  return (
    <Presence
      store={store.present}
      class={cn(props.class)}
      enterClassName={enterClassName}
      exitClassName={exitClassName}
    >
      <div />
    </Presence>
  );
};

const Content = (
  props: { store: ToastCore; enterClassName?: string; exitClassName?: string } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store, enterClassName, exitClassName } = props;

  return (
    <div class="fixed z-[99] left-[50%] translate-x-[-50%] top-60 w-120 h-120 ">
      <Presence
        store={store.present}
        class={cn(props.class)}
        enterClassName={enterClassName}
        exitClassName={exitClassName}
      >
        {props.children}
      </Presence>
    </div>
  );
};

export { Root, Portal, Overlay, Content };
