import { JSX } from "solid-js";

import { FormCore } from "@/domains/ui/form";
import { FormFieldCore } from "@/domains/ui/form/field";

function Root<T extends Record<string, unknown>>(props: { store: FormCore<T> } & JSX.HTMLAttributes<HTMLElement>) {
  return props.children;
}

const Field = (props: { store: FormFieldCore } & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Label = <T extends Record<string, unknown>>(props: { store: FormCore<T> } & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Message = <T extends Record<string, unknown>>(
  props: { store: FormCore<T> } & JSX.HTMLAttributes<HTMLElement>
) => {
  return props.children;
};

function Control<T extends Record<string, unknown>>(props: { store: FormCore<T> } & JSX.HTMLAttributes<HTMLElement>) {
  return (
    <input
      onChange={(
        event: Event & {
          target: HTMLInputElement;
          currentTarget: HTMLInputElement;
        }
      ) => {
        console.log("input onChange", event.currentTarget.value);
      }}
      onInput={(
        event: Event & {
          target: HTMLInputElement;
          currentTarget: HTMLInputElement;
        }
      ) => {
        console.log("input onInput", event.currentTarget.value);
      }}
    >
      {props.children}
    </input>
  );
}

function Submit<T extends Record<string, unknown>>(
  props: { store: FormCore<T> } & JSX.HTMLAttributes<HTMLButtonElement>
) {
  const { store } = props;

  return (
    <div
      onClick={() => {
        store.submit();
      }}
    >
      {props.children}
    </div>
  );
}

export { Root, Field, Control, Submit };
