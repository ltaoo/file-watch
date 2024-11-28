/**
 * @file 提供 加载中、没有数据、加载更多等内容的组件
 */
import { Show, createSignal } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { AlertCircle, ArrowDown, Bird, Loader } from "lucide-solid";

import { ListCore } from "@/domains/list";
import { cn } from "@/utils";

export function ListView(
  props: { store: ListCore<any, any>; skeleton?: JSX.Element } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { store, skeleton } = props;
  const [response, setResponse] = createSignal(store.response);

  store.onStateChange((nextState) => {
    // console.log("[COMPONENT]ListView - store.onStateChange", nextState.dataSource);
    setResponse(nextState);
  });

  return (
    <div class={cn("relative")}>
      <div class={props.class}>
        <Show
          when={response().initial}
          fallback={
            <Show
              when={!response().empty}
              fallback={
                <div class="w-full h-[360px] center flex items-center justify-center">
                  <div class="flex flex-col items-center justify-center text-slate-500">
                    <Bird class="w-24 h-24" />
                    <div class="mt-4 flex items-center space-x-2">
                      <Show when={response().loading}>
                        <Loader class="w-6 h-6 animate-spin" />
                      </Show>
                      <div class="text-center text-xl">{response().loading ? "加载中" : "列表为空"}</div>
                    </div>
                  </div>
                </div>
              }
            >
              {props.children}
            </Show>
          }
        >
          <Show when={skeleton}>{skeleton}</Show>
        </Show>
      </div>
      <Show
        when={!!response().error}
        fallback={
          <Show when={!response().noMore && !response().initial}>
            <div class="mt-4 flex justify-center py-4 text-slate-500">
              <div
                class="flex items-center space-x-2 cursor-pointer"
                onClick={() => {
                  store.loadMore();
                }}
              >
                <Show when={response().loading} fallback={<ArrowDown class="w-6 h-6" />}>
                  <Loader class="w-6 h-6 animate-spin" />
                </Show>
                <div class="text-center text-xl">{response().loading ? "加载中" : "加载更多"}</div>
              </div>
            </div>
          </Show>
        }
      >
        <div class="absolute top-0 z-10 w-full h-[360px] center flex items-center justify-center">
          <div class="flex flex-col items-center justify-center text-slate-500">
            <AlertCircle class="w-24 h-24" />
            <div class="mt-4 flex items-center space-x-2">
              <div class="text-xl text-center">{response().error?.message}</div>
            </div>
          </div>
        </div>
      </Show>
      <Show when={response().noMore && !response().empty}>
        <div class="mt-4 flex justify-center py-4 text-slate-500">
          <div class="flex items-center space-x-2">
            <Show when={response().loading}>
              <Loader class="w-6 h-6 animate-spin" />
            </Show>
            <div
              class="text-center text-xl"
              onClick={() => {
                store.loadMoreForce();
              }}
            >
              没有数据了
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
