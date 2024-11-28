/**
 * @file 后台/首页布局
 */
import { For, JSX, createSignal, onMount } from "solid-js";

import { ViewComponent } from "@/store/types";
import { PageKeys } from "@/store/routes";
import { KeepAliveRouteView } from "@/components/ui";
import { cn } from "@/utils/index";
import { __VERSION__ } from "@/constants/index";

export const HomeLayout: ViewComponent = (props) => {
  const { app, history, client, storage, pages, view } = props;

  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onSubViewsChange((v) => {
    setSubViews(v);
  });

  return (
    <>
      <div class="flex w-full h-full bg-white">
        <div class="flex-1">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                const routeName = subView.name;
                const PageContent = pages[routeName as Exclude<PageKeys, "root">];
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "absolute inset-0",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    store={subView}
                    index={i()}
                  >
                    <PageContent
                      app={app}
                      client={client}
                      storage={storage}
                      pages={pages}
                      history={history}
                      view={subView}
                    />
                  </KeepAliveRouteView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </>
  );
};
