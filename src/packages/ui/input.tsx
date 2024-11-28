/**
 * @file 输入框
 */
import { createSignal, JSX, onMount } from "solid-js";

import { InputCore } from "@/domains/ui/input";
import { connect } from "@/domains/ui/input/connect.web";
import { cn } from "@/utils";
import { effect } from "solid-js/web";

const Input = (
  props: {
    store: InputCore<string>;
  } & JSX.HTMLAttributes<HTMLInputElement>
) => {
  const { store } = props;

  let ref: HTMLInputElement | undefined = undefined;
  const [state, setState] = createSignal(store.state);
  // const [v, setV] = createSignal();

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  onMount(() => {
    const $input = ref;
    if (!$input) {
      return;
    }
    connect(store, $input);
    store.setMounted();
  });

  const value = () => {
    const { type, value } = state();
    if (type === "file") {
      return "";
    }
    return value;
  };
  const placeholder = () => state().placeholder;
  const disabled = () => state().disabled;
  const type = () => state().type;

  return (
    <input
      ref={ref}
      class={cn(props.class)}
      style={props.style}
      multiple
      value={value()}
      placeholder={placeholder()}
      disabled={disabled()}
      type={type()}
      onInput={(event: Event & { currentTarget: HTMLInputElement }) => {
        console.log("[COMPONENT]ui/input onInput", event.currentTarget.value);
        store.handleChange(event);
      }}
      // onChange={(event) => {
      //   console.log("[COMPONENT]ui/input onChange");
      //   store.handleChange(event);
      // }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          store.handleEnter();
        }
      }}
      onBlur={() => {
        store.handleBlur();
      }}
    />
  );
};

export { Input };
