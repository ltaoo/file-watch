/**
 * @file 回到顶部按钮
 */
import { Show, createSignal } from "solid-js";
import { ArrowUp } from "lucide-solid";

import { ScrollViewCore } from "@/domains/ui/scroll-view";
// import { app } from "@/store";

export function BackToTop(props: { store: ScrollViewCore }) {
  const { store } = props;

  let ref = false;
  const [visible, setVisible] = createSignal(false);

  store.onScroll((instance) => {
    let needShow = false;
    // if (instance.scrollTop >= app.screen.height) {
    //   needShow = true;
    // }
    if (needShow === ref) {
      return;
    }
    setVisible(needShow);
    ref = needShow;
  });

  return (
    <Show when={visible()}>
      <div class="z-index-200 fixed right-4 bottom-24">
        <div
          class="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-slate-300 opacity-100 dark:bg-black-900 safe-bottom"
          onClick={() => {
            store.scrollTo({ top: 0 });
          }}
        >
          <ArrowUp class="w-6 h-6" />
        </div>
      </div>
    </Show>
  );
}
