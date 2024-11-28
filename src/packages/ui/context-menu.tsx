/**
 * @file 右键菜单
 */
import { onMount, JSX } from "solid-js";

import { ContextMenuCore } from "@/domains/ui/context-menu";
import * as Menu from "@/packages/ui/menu";
import { MenuCore } from "@/domains/ui/menu";
import { MenuItemCore } from "@/domains/ui/menu/item";

const Root = (
  props: {
    store: ContextMenuCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <Menu.Root store={store.menu} class={props.class}>
      {props.children}
    </Menu.Root>
  );
};

/**
 * 点击展示菜单
 */
const Trigger = (props: { store: ContextMenuCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store: contextMenu } = props;
  let $span: HTMLSpanElement;

  onMount(() => {
    // @ts-ignore
    const _$span = $span;
    if (!_$span) {
      return;
    }
    contextMenu.setReference({
      getRect() {
        // console.log("[ContextMenuTrigger]get reference rect", $span);
        const rect = _$span.getBoundingClientRect();
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
      // @ts-ignore
      ref={$span}
      class={props.class}
      style={{ "-webkit-touch-callout": "none" }}
      onContextMenu={(event) => {
        event.preventDefault();
        // @ts-ignore
        const _$span = $span;
        if (!_$span) {
          return;
        }
        const { pageX: x, pageY: y } = event;
        contextMenu.updateReference({
          getRect() {
            const size = _$span.getBoundingClientRect();
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
  return (
    <Menu.Portal class={props.class} store={store}>
      {props.children}
    </Menu.Portal>
  );
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
  return <Menu.Group class={props.class}>{props.children}</Menu.Group>;
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
  return (
    <Menu.Sub class={props.class} store={subMenu}>
      {props.children}
    </Menu.Sub>
  );
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
export { Root, Trigger, Portal, Content, Group, Label, Item, Separator, Arrow, Sub, SubTrigger, SubContent };
