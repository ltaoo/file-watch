import { For, Show, createSignal } from "solid-js";

import { TabHeaderCore } from "@/domains/ui/tab-header";
import { cn } from "@/utils";

export const TabHeader = (props: { store: TabHeaderCore<any> }) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  const [left, setLeft] = createSignal<null | number>(null);

  const { tabs: options, current } = state();

  store.onStateChange((v) => {
    setState(v);
  });
  store.onLinePositionChange((v) => {
    setLeft(v.left);
  });

  return (
    <div
      class={cn("__a tabs w-full overflow-x-auto scroll--hidden")}
      //       style="{{style}}"
      onAnimationStart={(event) => {
        const { width, height, left } = event.currentTarget.getBoundingClientRect();
        store.updateContainerClient({ width, height, left });
      }}
    >
      <div
        class="tabs-wrapper relative"
        // scroll-with-animation="{{scrollWithAnimation}}"
        // scroll-left="{{scrollLeftInset}}"
        // scroll-x
      >
        <div id="tabs-wrapper" class="flex space-x-2">
          <For each={options}>
            {(tab, index) => {
              return (
                <div
                  classList={{
                    "__a flex items-center relative px-4 py-2 border border-4 rounded-full break-keep cursor-pointer hover:bg-gray-200":
                      true,
                    "border-gray-400": tab.id === state().curId,
                    "border-gray-200": tab.id !== state().curId,
                  }}
                  // style="{{current === index ? activeItemStyle : itemStyle}}"
                  onClick={() => {
                    store.select(index());
                  }}
                  onAnimationEnd={(event) => {
                    console.log("[COMPONENT]ui/tab-header - animationEnd", index());
                    event.stopPropagation();
                    const target = event.currentTarget;
                    // const { width, height, left } = event.currentTarget.getBoundingClientRect();
                    store.updateTabClient(index(), {
                      rect() {
                        const { offsetLeft, clientWidth, clientHeight } = target;
                        return {
                          width: clientWidth,
                          height: clientHeight,
                          left: offsetLeft,
                        };
                      },
                    });
                  }}
                >
                  <Show when={tab.url}>
                    <img class="w-[24px] h-[24px] mr-2 object-contain" src={tab.url} />
                  </Show>
                  <div class="text-xl text-gray-600">{tab.text}</div>
                </div>
              );
            }}
          </For>
          {/* {left() !== null ? (
            <div
              class="absolute bottom-0 w-8 rounded-sm bg-gray-800 transition-all"
              style={{
                left: `${left()}px`,
                height: "8px",
                transform: "translateX(-50%)",
              }}
            />
          ) : null} */}
        </div>
      </div>
    </div>
  );
};
