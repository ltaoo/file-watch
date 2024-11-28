import { JSX } from "solid-js/jsx-runtime";

import { cn } from "@/utils";
import { InputCore } from "@/domains/ui/input";
import { createSignal } from "solid-js";

export interface TextareaProps extends HTMLTextAreaElement {}

const Textarea = (props: { store: InputCore<string> } & JSX.HTMLAttributes<HTMLTextAreaElement>) => {
  const { store, class: className, ...restProps } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const value = () => state().value;
  const placeholder = () => state().placeholder;
  const disabled = () => state().disabled;

  return (
    <textarea
      ref={props.ref}
      class={cn(
        "flex h-20 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
        props.class
      )}
      value={value()}
      placeholder={placeholder()}
      disabled={disabled()}
      onInput={(event: Event & { currentTarget: HTMLTextAreaElement }) => {
        const { value } = event.currentTarget;
        store.setValue(value);
      }}
      {...restProps}
    />
  );
};
Textarea.displayName = "Textarea";

export { Textarea };
