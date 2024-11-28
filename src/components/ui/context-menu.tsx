/**
 * @file 右键菜单
 */
import { For, createContext, createSignal, onMount, JSX } from "solid-js";
import { ChevronRight } from "lucide-solid";

import { ContextMenuCore } from "@/domains/ui/context-menu";
import * as Menu from "@/packages/ui/menu";
import { MenuCore } from "@/domains/ui/menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { cn } from "@/utils";

export const ContextMenu = (props: { store: ContextMenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    console.log("[]store.onStateChange", nextState.items);
    setState(nextState);
  });

  const items = () => state().items;

  return (
    <Root store={store}>
      <Trigger store={store}>{props.children}</Trigger>
      <Portal store={store.menu}>
        <Content
          class={cn(
            "z-50 min-w-[8rem] w-56 overflow-hidden rounded-md border-2 border-slate-100 bg-white p-1 text-slate-700 shadow-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400",
            props.class
          )}
          store={store}
        >
          <For each={items()}>
            {(item) => {
              const { label } = item;
              if (item.menu) {
                return <ItemWithSub menu={store.menu} store={item}></ItemWithSub>;
              }
              return (
                <Item
                  class={cn(
                    "relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-700",
                    "focus:bg-slate-100"
                  )}
                  store={item}
                >
                  {label}
                </Item>
              );
            }}
          </For>
        </Content>
      </Portal>
    </Root>
  );
};

const ItemWithSub = (
  props: {
    menu: MenuCore;
    store: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { menu, store: item } = props;
  const [itemState, setItemState] = createSignal(item.state);
  const [state, setState] = createSignal(item.menu!.state);
  item.onStateChange((nextState) => {
    setItemState(nextState);
  });
  item.menu!.onStateChange((nextState) => {
    setState(nextState);
  });

  const items = () => state().items;
  const label = () => itemState().label;

  return (
    <Sub subMenu={item.menu!}>
      <SubTrigger class="DropdownMenuSubTrigger" parent={menu} item={item}>
        {label()}
        <div class="RightSlot">
          <ChevronRight width={15} height={15} />
        </div>
      </SubTrigger>
      <Portal store={item.menu!}>
        <SubContent class="DropdownMenuSubContent" store={item.menu!}>
          <For each={items()}>
            {(ii) => {
              const { label } = ii;
              if (ii.menu) {
                return <ItemWithSub menu={item.menu!} store={ii}></ItemWithSub>;
              }
              return (
                <Item class="DropdownMenuItem" store={ii}>
                  {label}
                </Item>
              );
            }}
          </For>
        </SubContent>
      </Portal>
    </Sub>
  );
};

// const ContextMenuContext = createContext<ContextMenuCore>();
const Root = (
  props: {
    store: ContextMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return <Menu.Root store={store.menu}>{props.children}</Menu.Root>;
};

/**
 * 点击展示菜单
 */
const Trigger = (props: { store: ContextMenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store: contextMenu } = props;
  // const store = useContext(ContextMenuContext);
  let $span: HTMLSpanElement | undefined;

  onMount(() => {
    const $$span = $span;
    if (!$$span) {
      return;
    }
    contextMenu.setReference({
      getRect() {
        // console.log("[ContextMenuTrigger]get reference rect", $span);
        const rect = $$span.getBoundingClientRect();
        return rect;
        // const { width, height, left, top, x, y } = rect;
        // return {
        //   width,
        //   height,
        //   left,
        //   top,
        //   x,
        //   y,
        // } as Rect;
      },
    });
  });

  return (
    <span
      ref={$span}
      style={{ "-webkit-touch-callout": "none" }}
      onContextMenu={(event) => {
        event.preventDefault();
        const $$span = $span;
        if (!$$span) {
          return;
        }
        const { pageX: x, pageY: y } = event;
        contextMenu.updateReference({
          getRect() {
            const size = $$span.getBoundingClientRect();
            const { top, left, right, bottom } = size;
            return {
              // 会基于鼠标位置和 reference 宽高计算气泡位置，这里给的宽高，就是离鼠标有多远距离
              width: 4,
              height: 4,
              top,
              left,
              right,
              bottom,
              x,
              y,
            };
          },
        });
        contextMenu.show({ x, y });
      }}
      onPointerDown={() => {
        // ...
      }}
      onPointerMove={() => {
        // ...
      }}
      onPointerCancel={() => {
        // ...
      }}
      onPointerUp={() => {
        // ...
      }}
    >
      {props.children}
    </span>
  );
};
const Portal = (props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return <Menu.Portal store={store}>{props.children}</Menu.Portal>;
};
const Content = (props: { store: ContextMenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return (
    <Menu.Content class={props.class} store={store.menu}>
      {props.children}
    </Menu.Content>
  );
};
const Group = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <Menu.Group>{props.children}</Menu.Group>;
};
const Label = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <Menu.Label class={props.class}>{props.children}</Menu.Label>;
};
const Item = (props: { store: MenuItemCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return (
    <Menu.Item class={props.class} store={store}>
      {props.children}
    </Menu.Item>
  );
};
const Separator = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  return <Menu.Separator class={props.class}></Menu.Separator>;
};
const Arrow = (props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  return (
    <Menu.Arrow class={props.class} store={store}>
      {props.children}
    </Menu.Arrow>
  );
};
const Sub = (props: { subMenu: MenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { subMenu } = props;
  return <Menu.Sub store={subMenu}>{props.children}</Menu.Sub>;
};
const SubTrigger = (
  props: {
    parent: MenuCore;
    item: MenuItemCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { item } = props;
  return (
    <Menu.SubTrigger class={props.class} store={item}>
      {props.children}
    </Menu.SubTrigger>
  );
};
const SubContent = (props: { store: MenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return (
    <Menu.SubContent class={props.class} store={store}>
      {props.children}
    </Menu.SubContent>
  );
};
// const Root = ContextMenuRoot;
// const Trigger = ContextMenuTrigger;
// const Portal = ContextMenuPortal;
// const Content = ContextMenuContent;
// const Group = ContextMenuGroup;
// const Label = ContextMenuLabel;
// const Item = ContextMenuItem;
// const Separator = ContextMenuSeparator;
// const Arrow = ContextMenuArrow;
// const Sub = ContextMenuSub;
// const SubTrigger = ContextMenuSubTrigger;
// const SubContent = ContextMenuSubContent;
// export { Root, Trigger, Portal, Content, Group, Label, Item, Separator, Arrow, Sub, SubTrigger, SubContent };
