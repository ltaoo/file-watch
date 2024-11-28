import { For, Show, createSignal, onMount } from "solid-js";

import { TabHeaderCore } from "@/domains/ui/tab-header";
import { cn } from "@/utils";

export const Tab = (props: { store: TabHeaderCore<any> }) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  const { tabs: options, current } = state();

  onMount(() => {
    store.onStateChange((v) => {
      setState(v);
    });
  });

  return (
    <div
      id="tabs-outer"
      class={cn("__a tabs")}
      style="{{style}}"
      onAnimationStart={() => {
        // updateContainer()
      }}
    >
      <div
        class="tabs-wrapper relative"
        // scroll-with-animation="{{scrollWithAnimation}}"
        // scroll-left="{{scrollLeftInset}}"
        // scroll-x
      >
        <div id="tabs-wrapper" class="flex">
          <For each={options}>
            {(tab, index) => {
              return (
                <div
                  id="tab-{{index}}"
                  class={cn("__a p-4 item-class", current === index() ? "active-item-class" : "")}
                  style="{{current === index ? activeItemStyle : itemStyle}}"
                  data-index="{{index}}"
                  data-text="{{item.text}}"
                  data-id="tab-{{index}}"
                  onClick={() => {
                    //     handleChange();
                  }}
                  onAnimationStart={(event) => {
                    event.stopPropagation();
                    //     updateTab();
                  }}
                >
                  {tab.text}
                </div>
              );
            }}
          </For>
          {/* <Show when={showLine}>
            <div
              class="absolute bottom-0 w-4 bg-w-brand transition-all"
              style="left: {{left}}px; height: 4rpx; transform: translateX(-50%)"
            />
          </Show> */}
        </div>
      </div>
    </div>
  );
};
