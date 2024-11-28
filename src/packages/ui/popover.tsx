import { JSX } from "solid-js/jsx-runtime";
import { Portal as PortalPrimitive } from "solid-js/web";

import { PopoverCore } from "@/domains/ui/popover";

import * as PopperPrimitive from "./popper";
import { Presence } from "./presence";
import { DismissableLayer } from "./dismissable-layer";
import { createSignal } from "solid-js";

const Root = (props: { store: PopoverCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  // console.log("[COMPONENT]PopoverRoot", store);
  return <PopperPrimitive.Root store={store.popper}>{props.children}</PopperPrimitive.Root>;
};

// const PopoverAnchor = (props: { children: JSX.Element }) => {
//   return <Popper.Anchor>{props.children}</Popper.Anchor>;
// };

/* -------------------------------------------------------------------------------------------------
 * PopoverTrigger
 * -----------------------------------------------------------------------------------------------*/
const Trigger = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  // const store = useContext(PopoverContext);

  return (
    <PopperPrimitive.Anchor store={store.popper} class={props.class}>
      <button
        onClick={() => {
          store.toggle();
        }}
      >
        {props.children}
      </button>
    </PopperPrimitive.Anchor>
  );
};

/* -------------------------------------------------------------------------------------------------
 * PopoverPortal
 * -----------------------------------------------------------------------------------------------*/
const Portal = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [mount, setMount] = createSignal(store.popper.container);
  store.popper.onContainerChange((nextContainer) => {
    setMount(nextContainer);
  });

  return (
    <Presence store={store.present}>
      <PortalPrimitive mount={mount() ?? undefined}>{props.children}</PortalPrimitive>
    </Presence>
  );
};

/* -------------------------------------------------------------------------------------------------
 * PopoverContent
 * -----------------------------------------------------------------------------------------------*/
const Content = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(PopoverContext);

  return (
    <PopoverContentNonModal store={store} class={props.class}>
      {props.children}
    </PopoverContentNonModal>
  );
};

/* -----------------------------------------------------------------------------------------------*/
const PopoverContentNonModal = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <PopoverContentImpl store={store} class={props.class}>
      {props.children}
    </PopoverContentImpl>
  );
};

const FocusScope = (props: { children: JSX.Element }) => {
  return props.children;
};
const PopoverContentImpl = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.present.state);
  store.present.onStateChange((nextState) => {
    setState(nextState);
  });

  // return (
  //   <FocusScope>
  //     <DismissableLayer store={store.layer}>
  //       <PopperPrimitive.Content store={store.popper} class={props.class} data-state={state().open ? "open" : "closed"}>
  //         {props.children}
  //       </PopperPrimitive.Content>
  //     </DismissableLayer>
  //   </FocusScope>
  // );
  return (
    <PopperPrimitive.Content store={store.popper} class={props.class} data-state={state().visible ? "open" : "closed"}>
      {props.children}
    </PopperPrimitive.Content>
  );
};

const Close = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(PopoverContext);
  return (
    <button
      class={props.class}
      onClick={() => {
        store.hide();
      }}
    >
      {props.children}
    </button>
  );
};

const Arrow = (props: { store: PopoverCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return <PopperPrimitive.Arrow store={store.popper} class={props.class}></PopperPrimitive.Arrow>;
};

export { Root, Trigger, Content, Portal, Close, Arrow };
