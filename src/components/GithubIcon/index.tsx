import { JSX } from "solid-js/jsx-runtime";

export function GithubIcon(props: {} & JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div class={props.class} style={props.style}>
      <div class="icons icons--github w-[36px] h-[36px]" />
    </div>
  );
}
