import { createSignal, Show } from "solid-js";
import { Eye, EyeOff } from "lucide-solid";

import { ColorInputCore } from "@/biz/color_input";
import { Input } from "@/components/ui";

export function ColorInput(props: { store: ColorInputCore }) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onChange((v) => setState(v));

  return (
    <div class="flex items-center h-[64px]">
      <div class="flex items-center">
        <Input store={store.$input} />
        <Input store={store.$opacity} />
      </div>
      <div class="cursor-pointer w-[64px] h-[64px] hover:bg-[#ccc]">
        <Show when={state().visible} fallback={<Eye class="w-4 h-4" />}>
          <EyeOff class="w-4 h-4" />
        </Show>
      </div>
    </div>
  );
}
