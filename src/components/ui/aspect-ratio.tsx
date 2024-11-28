import { JSX } from "solid-js/jsx-runtime";

export const AspectRatio = (
  props: {
    ratio: number;
  } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { ratio = 1 / 1 } = props;

  return (
    <div class={props.class} style={`position: relative; width: 100%; padding-bottom: ${100 / ratio}%;`}>
      {props.children}
    </div>
  );
};
