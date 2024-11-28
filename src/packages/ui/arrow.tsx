/**
 * @file 箭头
 */
import { children, JSX } from "solid-js";

import { Show } from "./show";

const Arrow = (props: { width?: number; height?: number; class?: string; children?: JSX.Element }) => {
  const { width = 10, height = 5 } = props;

  const c = children(() => props.children);

  return (
    <svg class={props.class} width={width} height={height} viewBox="0 0 30 10" preserveAspectRatio="none">
      {/* We use their children if they're slotting to replace the whole svg */}
      <Show when={c()} fallback={<polygon points="0,0 30,0 15,10" />}>
        {c()}
      </Show>
    </svg>
  );
};

/* -----------------------------------------------------------------------------------------------*/

export { Arrow };
