/* @refresh reload */

import { createSignal, For, onMount, Show } from "solid-js";
import { render } from "solid-js/web";

import { app, history, storage, client, PageKeys } from "./store/index";
import { pages } from "./store/views";
import { KeepAliveRouteView } from "./components/ui";
import { Toast } from "./components/ui/toast";
import { ToastCore } from "./domains/ui/toast";

import "./style.css";

function Application() {
  const view = history.$view;
  const toast = new ToastCore();

  const [state, setState] = createSignal(app.state);
  const [subViews, setSubViews] = createSignal(view.subViews);

  app.onStateChange((v) => {
    setState(v);
  });
  view.onSubViewsChange((v) => {
    setSubViews(v);
  });
  app.onTip((msg) => {
    const { text } = msg;
    toast.show({
      texts: text,
    });
  });
  onMount(() => {
    const { innerWidth, innerHeight, location } = window;
    history.$router.prepare(location);
    app.start({
      width: innerWidth,
      height: innerHeight,
    });
  });

  return (
    <div class={"screen overflow-hidden"}>
      <Show when={!state().ready}>
        <div class="flex items-center justify-center w-full h-full">
          <div class="flex flex-col items-center text-slate-500">
            <div class="mt-4 text-center">正在加载</div>
          </div>
        </div>
      </Show>
      <Show when={subViews().length !== 0}>
        <For each={subViews()}>
          {(subView, i) => {
            const routeName = subView.name;
            const PageContent = pages[routeName as Exclude<PageKeys, "root">];
            return (
              <KeepAliveRouteView
                class="absolute inset-0 opacity-100 dark:bg-black"
                store={subView}
                index={i()}
              >
                <PageContent
                  app={app}
                  history={history}
                  storage={storage}
                  pages={pages}
                  client={client}
                  view={subView}
                />
              </KeepAliveRouteView>
            );
          }}
        </For>
      </Show>
      <Toast store={toast} />
    </div>
  );
}
const root = document.getElementById("root");

render(() => <Application />, root!);
