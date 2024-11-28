/**
 * @file 按钮
 */
import { JSX, createSignal } from "solid-js";

import { ButtonCore } from "@/domains/ui/button";

import { Show } from "./show";
import { cn } from "@/utils";

function Root<T = unknown>(
  props: {
    store: ButtonCore<T>;
  } & JSX.HTMLAttributes<HTMLButtonElement>
) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const disabled = () => state().disabled;
  const loading = () => state().loading;

  return (
    <button
      class={cn("break-keep whitespace-nowrap", props.class)}
      role="button"
      disabled={disabled()}
      onClick={(event) => {
        event.preventDefault();
        store.click();
      }}
    >
      {props.children}
    </button>
  );
}

function Loading<T = unknown>(props: { store: ButtonCore<T> } & JSX.HTMLAttributes<HTMLSpanElement>) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const loading = () => state().loading;

  return <Show when={loading()}>{props.children}</Show>;
}

function Prefix<T = unknown>(props: { store: ButtonCore<T> } & JSX.HTMLAttributes<HTMLSpanElement>) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const loading = () => state().loading;

  return <Show when={!loading()}>{props.children}</Show>;
}

function Text<T = unknown>(props: { store: ButtonCore<T> } & JSX.HTMLAttributes<HTMLSpanElement>) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const text = () => state().text;

  return <span class={props.class}>{props.children}</span>;
}

export { Root, Text, Loading, Prefix };
