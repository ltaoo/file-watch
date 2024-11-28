/* -------------------------------------------------------------------------------------------------
 * Checkbox
 * -----------------------------------------------------------------------------------------------*/

import { CheckboxCore } from "@/domains/ui/checkbox";
import { JSX } from "solid-js/jsx-runtime";
import { Presence } from "./presence";
import { createSignal } from "solid-js";

const CHECKBOX_NAME = "Checkbox";

// type CheckedState = boolean | "indeterminate";

// type CheckboxContextValue = {
//   state: CheckedState;
//   disabled?: boolean;
// };

// const [CheckboxProvider, useCheckboxContext] = createCheckboxContext<CheckboxContextValue>(CHECKBOX_NAME);

// type CheckboxElement = JSX.Element;
// type PrimitiveButtonProps = Radix.ComponentPropsWithoutRef<typeof Primitive.button>;
// interface CheckboxProps extends Omit<PrimitiveButtonProps, "checked" | "defaultChecked"> {
//   checked?: CheckedState;
//   defaultChecked?: CheckedState;
//   required?: boolean;
//   onCheckedChange?(checked: CheckedState): void;
// }

const Root = (props: { store: CheckboxCore } & JSX.HTMLAttributes<HTMLButtonElement>) => {
  const { id, store } = props;
  //   const [button, setButton] = React.useState<HTMLButtonElement | null>(null);
  //   const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
  //   const hasConsumerStoppedPropagationRef = React.useRef(false);
  // We set this to true by default so that events bubble to forms without JS (SSR)
  //   const isFormControl = button ? Boolean(button.closest("form")) : true;
  //   const [checked = false, setChecked] = useControllableState({
  //     prop: checkedProp,
  //     defaultProp: defaultChecked,
  //     onChange: onCheckedChange,
  //   });
  //   const initialCheckedStateRef = React.useRef(checked);
  //   React.useEffect(() => {
  //     const form = button?.form;
  //     if (form) {
  //       const reset = () => setChecked(initialCheckedStateRef.current);
  //       form.addEventListener("reset", reset);
  //       return () => form.removeEventListener("reset", reset);
  //     }
  //   }, [button, setChecked]);
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <>
      <button
        type="button"
        role="checkbox"
        class={props.class}
        aria-checked={isIndeterminate(state().checked) ? "mixed" : state().checked}
        aria-required={state().required}
        data-state={getState(state().checked)}
        data-disabled={state().disabled ? "" : undefined}
        disabled={state().disabled}
        onClick={(event) => {
          event.stopPropagation();
          store.toggle();
        }}
      >
        {props.children}
      </button>
      <BubbleInput
        id={id}
        // control={button}
        // bubbles={!hasConsumerStoppedPropagationRef.current}
        // name={name}
        // value={value}
        checked={state().checked}
        required={state().required}
        disabled={state().disabled}
        // We transform because the input is absolutely positioned but we have
        // rendered it **after** the button. This pulls it back to sit on top
        // of the button.
        style={{ transform: "translateX(-100%)" }}
      />
    </>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CheckboxIndicator
 * -----------------------------------------------------------------------------------------------*/

const Indicator = (props: { store: CheckboxCore } & JSX.HTMLAttributes<HTMLSpanElement>) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    // console.log("[PACKAGE]checkbox/Indicator", nextState);
    setState(nextState);
  });

  return (
    <Presence store={store.presence} class="w-full h-full">
      <span
        data-state={getState(state().checked)}
        data-disabled={state().disabled ? "" : undefined}
        style={{ "pointer-events": "none" }}
      >
        {props.children}
      </span>
    </Presence>
  );
};

/* ---------------------------------------------------------------------------------------------- */

// type InputProps = Radix.ComponentPropsWithoutRef<"input">;
// interface BubbleInputProps extends Omit<InputProps, "checked"> {
//   checked: CheckedState;
//   control: HTMLElement | null;
//   bubbles: boolean;
// }

const BubbleInput = (
  props: {
    checked?: boolean;
    required?: boolean;
    disabled?: boolean;
    bubbles?: boolean;
  } & JSX.HTMLAttributes<HTMLInputElement>
) => {
  const { id, bubbles = true, ...inputProps } = props;
  //   const ref = React.useRef<HTMLInputElement>(null);
  //   const prevChecked = usePrevious(checked);
  //   const controlSize = useSize(control);

  // Bubble checked change to parents (e.g form change event)
  //   React.useEffect(() => {
  //     const input = ref.current!;
  //     const inputProto = window.HTMLInputElement.prototype;
  //     const descriptor = Object.getOwnPropertyDescriptor(inputProto, "checked") as PropertyDescriptor;
  //     const setChecked = descriptor.set;

  //     if (prevChecked !== checked && setChecked) {
  //       const event = new Event("click", { bubbles });
  //       input.indeterminate = isIndeterminate(checked);
  //       setChecked.call(input, isIndeterminate(checked) ? false : checked);
  //       input.dispatchEvent(event);
  //     }
  //   }, [prevChecked, checked, bubbles]);

  return (
    <input
      type="checkbox"
      aria-hidden
      id={id}
      //       defaultChecked={isIndeterminate(checked) ? false : checked}
      {...inputProps}
      tabIndex={-1}
      style={{
        position: "absolute",
        "pointer-events": "none",
        opacity: 0,
        margin: 0,
      }}
    />
  );
};

function isIndeterminate(checked?: boolean | "indeterminate"): checked is "indeterminate" {
  return checked === "indeterminate";
}

function getState(checked?: boolean) {
  return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}

export { Root, Indicator };
