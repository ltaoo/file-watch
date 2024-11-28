import { JSX } from "solid-js/jsx-runtime";
import { LucideLoader2 as Loader2 } from "lucide-solid";

import { cn } from "@/utils";

export function PageLoading(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div class={cn("flex items-center", props.class)}>
      <div class="flex items-center justify-center w-full h-full">
        <div class="flex flex-col items-center text-slate-500">
          <Loader2 class="w-8 h-8 animate-spin" />
          <div class="mt-4 text-center">正在加载</div>
        </div>
      </div>
    </div>
  );
}
