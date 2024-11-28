import { JSX, createSignal, onMount } from "solid-js";
import { Loader2 } from "lucide-solid";

import { InputCore } from "@/domains/ui/input";
import { Input as InputPrimitive } from "@/packages/ui/input";
import { connect } from "@/domains/ui/input/connect.web";
import { cn } from "@/utils";

const Input = (props: { store: InputCore<any>; prefix?: JSX.Element; class?: string }) => {
  const { store, prefix } = props;

  // let ref: HTMLInputElement;
  const [state, setState] = createSignal(store.state);

  // onMount(() => {
  //   const $input = ref;
  //   if (!$input) {
  //     return;
  //   }
  //   connect(store, $input);
  //   store.setMounted();
  // });
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const { loading, value, placeholder, disabled, type } = state();

  // React.useEffect(() => {
  //   return () => {
  //     console.log("Input unmounted");
  //   };
  // }, []);
  // console.log("[]Input");
  return (
    <div class="relative w-full">
      <div class="absolute left-3 top-[50%] translate-y-[-50%] text-slate-400 ">
        {(() => {
          if (!prefix) {
            return null;
          }
          if (loading) {
            return <Loader2 class="w-4 h-4 animate-spin" />;
          }
          return prefix;
        })()}
      </div>
      <InputPrimitive
        class={cn(
          "flex items-center h-10 w-full rounded-md leading-none border border-slate-300 bg-transparent py-2 px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
          "placeholder:text-slate-400",
          prefix ? "pl-8" : "",
          props.class
        )}
        style={{
          "vertical-align": "bottom",
        }}
        store={store}
      />
    </div>
  );
};
Input.displayName = "Input";

export { Input };
