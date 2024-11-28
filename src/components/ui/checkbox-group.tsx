/**
 * @file 多选按钮组件
 */
import { For, JSX, createSignal } from "solid-js";

import { CheckboxCore } from "@/domains/ui/checkbox";
import { CheckboxGroupCore } from "@/domains/ui/checkbox/group";
import { cn } from "@/utils";

export const CheckboxOption = (props: { label: string; store: CheckboxCore } & JSX.HTMLAttributes<HTMLDivElement>) => {
  const { label, store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    // console.log("[COMPONENT]CheckboxGroup - Option store.onStateChange", nextState);
    setState(nextState);
  });

  return (
    <div
      class={cn(
        "py-2 px-4 rounded-lg border cursor-pointer",
        state().checked ? "bg-slate-500 text-slate-200 dark:text-slate-600" : "",
        {
          "bg-slate-500": state().checked,
        }
      )}
      onClick={() => {
        store.toggle();
      }}
    >
      <div class="text-sm">{label}</div>
    </div>
  );
};

export const CheckboxGroup = <T extends any>(
  props: { store: CheckboxGroupCore<T> } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div class="flex items-center flex-wrap gap-2 max-w-full">
      <For each={state().options}>
        {(opt) => {
          const { label, core } = opt;
          return <CheckboxOption store={core} label={label} />;
        }}
      </For>
    </div>
  );
};
