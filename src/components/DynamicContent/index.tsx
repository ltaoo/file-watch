import { JSX, createSignal } from "solid-js";

import { DynamicContentCore } from "@/domains/ui/dynamic-content";

export const DynamicContent = (
  props: {
    store: DynamicContentCore;
    options: { value: number; content: null | JSX.Element }[];
  } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { store, options } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => {
    setState(v);
  });

  return (
    <div class={props.class}>
      {(() => {
        const matched = options.find((opt) => opt.value === state().value);
        if (!matched) {
          return null;
        }
        return matched.content;
      })()}
    </div>
  );
};
