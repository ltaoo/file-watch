/**
 * @file 按钮
 */
import { JSX } from "solid-js";

import { ButtonCore } from "@/domains/ui/button";

function Element<T = unknown>(
  props: {
    store: ButtonCore<T>;
  } & JSX.HTMLAttributes<HTMLButtonElement>
) {
  const { store } = props;

  return (
    <div
      class={props.class}
      onClick={(event) => {
        store.click();
      }}
    >
      {props.children}
    </div>
  );
}

export { Element };
