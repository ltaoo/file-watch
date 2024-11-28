import { onMount, JSX } from "solid-js";

import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { connectScroll, connectIndicator } from "@/domains/ui/scroll-view/connect.web";

export const Root = (props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store, children, ...rest } = props;

  let $elm = undefined as HTMLDivElement | undefined;

  onMount(() => {
    if (!$elm) {
      return;
    }
    store.setRect({
      width: $elm.clientWidth,
      height: $elm.clientHeight,
    });
    store.setMounted();
    connectScroll(store, $elm);
  });

  return (
    <div ref={$elm} class={props.class} style={props.style} onClick={props.onClick}>
      {props.children}
    </div>
  );
};
/**
 * 下拉刷新指示器
 */
export const Indicator = (props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  let $elm = undefined as HTMLDivElement | undefined;
  // const [visible, setVisible] = useState(true);

  onMount(() => {
    if (!$elm) {
      return;
    }
    // 在这里里面会监听滚动逻辑，并改变 height
    connectIndicator(store, $elm);
    if (store.needHideIndicator) {
      store.hideIndicator();
    }
  });

  return (
    <div ref={$elm} class={props.class} style={{ height: 0 }}>
      {props.children}
    </div>
  );
};
export const Progress = (props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  let $node = undefined as HTMLDivElement | undefined;

  store.inDownOffset(() => {
    // console.log("[]Progress - store.onInOffset", ref);
    if (!$node) {
      return;
    }
    $node.style.display = "block";
  });
  store.onPullToRefresh(() => {
    // console.log("[]Progress - store.onPullToRefresh");
    if (!$node) {
      return;
    }
    $node.style.display = "none";
  });

  return (
    <div ref={$node} class={props.class}>
      {props.children}
    </div>
  );
};

export const Loading = (props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store } = props;

  let $node = undefined as HTMLDivElement | undefined;

  store.inDownOffset(() => {
    // console.log("[]Loading - store.onInOffset", ref);
    if (!$node) {
      return;
    }
    $node.style.display = "none";
  });
  store.onPullToRefresh(() => {
    // console.log("[]Loading - store.onPullToRefresh", ref);
    if (!$node) {
      return;
    }
    $node.style.display = "inline-block";
  });

  return (
    <div ref={$node} class={props.class} style={{ display: "none" }}>
      {props.children}
    </div>
  );
};
