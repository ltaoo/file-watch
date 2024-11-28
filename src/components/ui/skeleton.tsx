import { JSX } from "solid-js/jsx-runtime";

import { cn } from "@/utils";

function Skeleton(props: {} & JSX.HTMLAttributes<HTMLDivElement>) {
  return <div class={cn("animate-pulse w-full h-full rounded-md bg-gray-200", props.class)} />;
}

export { Skeleton };
