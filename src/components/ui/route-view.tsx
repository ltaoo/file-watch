/**
 * @file 会销毁页面的视图（如果希望不销毁可以使用 keep-alive-route-view
 */
import { Show, createSignal, JSX, onCleanup } from "solid-js";

import { PageLoading } from "@/components/PageLoading";
import { RouteViewCore } from "@/domains/route_view";

export function RouteView(props: { store: RouteViewCore; index: number } & JSX.HTMLAttributes<HTMLDivElement>) {
  const { store, index } = props;

  // const [state, setState] = createSignal(view.state);
  // const [pageContent, setPageContent] = createSignal(<PageLoading class="w-full h-full" />);

  // view.onStateChange((nextState) => {
  //   setState(nextState);
  // });
  // (async () => {
  //   if (typeof view.component === "function") {
  //     if (view.loaded) {
  //       return;
  //     }
  //     const PageView = await view.component();
  //     setPageContent(<PageView app={app} view={view} />);
  //     view.setLoaded();
  //     return;
  //   }
  //   setPageContent(view.component as JSX.Element);
  // })();
  const [state, setState] = createSignal(store.state);

  const visible = () => state().visible;
  const mounted = () => state().mounted;

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  // console.log("[COMPONENT]RouteView", view.title);
  // effect(() => {
  //   console.log("RouteView", store._name, visible(), mounted());
  // });
  onCleanup(() => {
    // console.log("RouteView", view.title, "cleanup");
  });

  return (
    <Show when={mounted()}>
      <div
        class={props.class}
        // classList={{
        //   "relative w-full h-full": true,
        // }}
        style={{
          "z-index": index,
        }}
        // class={cn(
        //   "animate-in sm:zoom-in-90",
        //   "data-[state=open]:data-[state=open]:slide-in-from-bottom-full",
        //   "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-full"
        // )}
        data-state={visible() ? "open" : "closed"}
        // onAnimationEnd={() => {
        //   store.presence.animationEnd();
        // }}
      >
        {props.children}
      </div>
    </Show>
  );
}
