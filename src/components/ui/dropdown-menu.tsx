/**
 * @file 下拉菜单
 */
import { For, createSignal, JSX } from "solid-js";
import { ChevronRight } from "lucide-solid";

import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import { Show } from "@/packages/ui/show";
import { cn } from "@/utils";

import * as DropdownMenuPrimitive from "@/packages/ui/dropdown-menu";

export const DropdownMenu = (props: { store: DropdownMenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    // console.log("[COMPONENT]ui/dropdown-menu - store.onStateChange", nextState.items.length);
    setState(nextState);
  });

  return (
    <DropdownMenuPrimitive.Root store={store}>
      <Show when={props.children}>
        <DropdownMenuPrimitive.Trigger class="inline-block" store={store}>
          {props.children}
        </DropdownMenuPrimitive.Trigger>
      </Show>
      <DropdownMenuPrimitive.Portal store={store.menu}>
        <DropdownMenuPrimitive.Content
          class={cn(
            "z-50 min-w-[8rem] w-56 overflow-hidden rounded-md border-2 border-slate-100 bg-white p-1 text-slate-700 shadow-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400",
            props.class
          )}
          store={store}
        >
          <For each={state().items}>
            {(item) => {
              return (
                <Show
                  when={!!item.menu}
                  fallback={
                    <DropdownMenuPrimitive.Item
                      class={cn(
                        "relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700",
                        "focus:bg-slate-100"
                      )}
                      store={item}
                    >
                      <Show when={!!item.icon}>
                        <div class="mr-2">{item.icon as Element}</div>
                      </Show>
                      {item.label}
                      <Show when={item.shortcut}>{item.shortcut}</Show>
                    </DropdownMenuPrimitive.Item>
                  }
                >
                  <ItemWithSubMenu subMenu={item.menu!} store={item} />
                </Show>
              );
            }}
          </For>
          {/* <DropdownMenuPrimitive.Arrow store={store} /> */}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

const ItemWithSubMenu = (
  props: {
    subMenu: MenuCore;
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store: item, subMenu } = props;

  const [itemState, setItemState] = createSignal(item.state);
  const [state, setState] = createSignal(subMenu.state);

  item.onStateChange((nextState) => {
    setItemState(nextState);
  });
  subMenu.onStateChange((nextState) => {
    setState(nextState);
  });

  const items = () => state().items;
  const label = () => itemState().label;
  const icon = () => itemState().icon as JSX.Element;

  return (
    <DropdownMenuPrimitive.Sub store={subMenu}>
      <DropdownMenuPrimitive.SubTrigger
        class={cn(
          "flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none focus:bg-slate-100 data-[highlighted]:bg-slate-100 data-[state=open]:bg-slate-100 dark:focus:bg-slate-700 dark:data-[state=open]:bg-slate-700",
          {
            "pl-8": !!icon(),
          },
          props.class
        )}
        store={item}
      >
        <Show when={!!icon()}>
          <div class="mr-2">{icon()}</div>
        </Show>
        {label()}
        <div class="ml-auto h-4 w-4">
          <ChevronRight class="w-4 h-4" />
        </div>
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal store={subMenu}>
        <DropdownMenuPrimitive.SubContent
          class={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border-2 border-slate-100 bg-white p-1 text-slate-700 shadow-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400",
            props.class
          )}
          store={subMenu}
        >
          <For each={items()}>
            {(subMenuItem) => {
              const { label } = subMenuItem;
              if (subMenuItem.menu) {
                return <ItemWithSubMenu subMenu={subMenuItem.menu} store={subMenuItem}></ItemWithSubMenu>;
              }
              return (
                <DropdownMenuPrimitive.Item
                  class={cn(
                    "relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700"
                  )}
                  store={subMenuItem}
                >
                  {label}
                </DropdownMenuPrimitive.Item>
              );
            }}
          </For>
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  );
};
