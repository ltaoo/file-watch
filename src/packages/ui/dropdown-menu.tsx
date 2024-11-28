/**
 * @file 下拉菜单
 */
import { createSignal, JSX, onMount } from "solid-js";

import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import * as MenuPrimitive from "@/packages/ui/menu";

const Root = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <MenuPrimitive.Root class={props.class} store={store.menu}>
      {props.children}
    </MenuPrimitive.Root>
  );
};

const Trigger = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const disabled = () => state().disabled;

  return (
    <MenuPrimitive.Anchor class={props.class} store={store.menu}>
      <button
        onPointerDown={() => {
          store.toggle();
        }}
        onKeyDown={(event) => {
          if (disabled()) {
            return;
          }
          if (["Enter", " "].includes(event.key)) {
            store.toggle();
            return;
          }
          if (event.key === "ArrowDown") {
            // context.onOpenChange(true)
          }
          // prevent keydown from scrolling window / first focused item to execute
          // that keydown (inadvertently closing the menu)
          if (["Enter", " ", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
          }
        }}
      >
        {props.children}
      </button>
    </MenuPrimitive.Anchor>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuPortal
 * -----------------------------------------------------------------------------------------------*/
const Portal = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <MenuPrimitive.Portal class={props.class} store={store}>
      {props.children}
    </MenuPrimitive.Portal>
  );
};

const Content = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <MenuPrimitive.Content store={store.menu} class={props.class}>
      {props.children}
    </MenuPrimitive.Content>
  );
};

const Group = (props: { store: DropdownMenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return <MenuPrimitive.Group class={props.class}>{props.children}</MenuPrimitive.Group>;
};

const Label = (
  props: {
    // store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  return <MenuPrimitive.Label class={props.class}>{props.children}</MenuPrimitive.Label>;
};

const Item = (
  props: {
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(DropdownMenuContext);

  return (
    <MenuPrimitive.Item class={props.class} store={store}>
      {props.children}
    </MenuPrimitive.Item>
  );
};

const Separator = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <MenuPrimitive.Separator class={props.class}></MenuPrimitive.Separator>;
};

const Arrow = (
  props: {
    store: DropdownMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <MenuPrimitive.Arrow store={store.menu} class={props.class}>
      {props.children}
    </MenuPrimitive.Arrow>
  );
};

const Sub = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <MenuPrimitive.Sub class={props.class} store={store}>
      {props.children}
    </MenuPrimitive.Sub>
  );
};

const SubTrigger = (
  props: {
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  onMount(() => {
    store.log("[COMPONENT]SubTrigger - mounted");
  });

  return (
    <MenuPrimitive.SubTrigger class={props.class} store={store}>
      {props.children}
    </MenuPrimitive.SubTrigger>
  );
};

const SubContent = (
  props: {
    store: MenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <MenuPrimitive.SubContent store={store} class={props.class}>
      {props.children}
    </MenuPrimitive.SubContent>
  );
};

export { Root, Trigger, Portal, Content, Group, Label, Item, Separator, Arrow, Sub, SubTrigger, SubContent };
