/**
 * @file 可滚动容器，支持下拉刷新、滚动监听等
 */
import { JSX, createSignal } from "solid-js";
import { ArrowDown, Loader2 } from "lucide-solid";

import * as ScrollViewPrimitive from "@/packages/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils/index";

export const ScrollView = (props: { store: ScrollViewCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { store, children, ...rest } = props;

  const [rotate, setRotate] = createSignal(false);

  store.inDownOffset(() => {
    setRotate(false);
  });
  store.outDownOffset(() => {
    setRotate(true);
  });

  return (
    <ScrollViewPrimitive.Root
      class={cn("scroll-view w-full h-full overflow-y-auto", props.class)}
      style={props.style}
      store={store}
      onClick={rest.onClick}
    >
      <ScrollViewPrimitive.Indicator class="relative w-full overflow-hidden text-center" store={store}>
        <div class="absolute left-0 bottom-0 w-full min-h-[30px] py-[10px]">
          <ScrollViewPrimitive.Progress class="w-[50px] h-[50px] mx-auto rounded-full bg-w-bg-0" store={store}>
            <div
              class={cn(
                "inline-flex justify-center items-center w-full h-full",
                rotate() ? "rotate-[180deg]" : "rotate-[0deg]"
              )}
              style={{
                transition: "all 300ms",
              }}
            >
              <ArrowDown width={18} height={18} />
            </div>
          </ScrollViewPrimitive.Progress>
          <ScrollViewPrimitive.Loading class="w-[50px] h-[50px] mx-auto rounded-full bg-w-bg-0" store={store}>
            <div class="inline-flex justify-center items-center w-full h-full">
              <Loader2 class="animate animate-spin" width={18} height={18} />
            </div>
          </ScrollViewPrimitive.Loading>
        </div>
      </ScrollViewPrimitive.Indicator>
      {props.children}
    </ScrollViewPrimitive.Root>
  );
};
