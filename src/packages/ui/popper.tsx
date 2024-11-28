/**
 * @file 最原始的气泡组件
 * 仅负责计算气泡位置，不负责显隐
 */
import { JSX, Show, createSignal, onMount } from "solid-js";

import { PopperCore } from "@/domains/ui/popper";
import { cn } from "@/utils";

import { Arrow as ArrowPrimitive } from "./arrow";

const Root = (props: { store?: PopperCore } & JSX.HTMLAttributes<HTMLElement>) => {
  return props.children;
};

const Anchor = (
  props: {
    store: PopperCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  let $anchor: HTMLDivElement;

  // console.log("[COMPONENT]PopperAnchor - before setReference", store.reference);
  if (!store.reference) {
    return (
      <div
        ref={(el) => {
          $anchor = el;
          if (typeof props.ref === "function") {
            props.ref(el);
            return;
          }
          props.ref = el;
          store.setReference({
            getRect() {
              const rect = $anchor.getBoundingClientRect();
              return rect;
            },
          });
        }}
        class={cn("popper__anchor", props.class)}
      >
        {props.children}
      </div>
    );
  }
  return props.children;
};

const Content = (
  props: {
    store: PopperCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(PopperContext);
  const [state, setState] = createSignal(store.state);

  let $content: HTMLDivElement;

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  onMount(() => {
    console.log("[COMPONENT]PopperContent - getRect of floating", $content);
    store.setFloating({
      getRect() {
        const rect = $content.getBoundingClientRect();
        // console.log("[COMPONENT]PopperContent - getRect of floating", $content, rect);
        return rect;
      },
    });
  });

  const x = () => state().x;
  const y = () => state().y;
  const isPlaced = () => state().isPlaced;
  const strategy = () => state().strategy;
  const placedSide = () => state().placedSide;
  const placedAlign = () => state().placedAlign;

  return (
    <div
      ref={(el) => {
        $content = el;
        if (typeof props.ref === "function") {
          props.ref(el);
          return;
        }
        props.ref = el;
      }}
      role={props.role}
      // class={props.class}
      // classList={props.classList}
      style={{
        position: strategy(),
        left: 0,
        top: 0,
        // prettier-ignore
        transform: isPlaced() ? `translate3d(${Math.round(x())}px, ${Math.round(y())}px, 0)` : "translate3d(0, -200%, 0)",
        "min-width": "max-content",
        "z-index": 99,
        // zIndex: contentZIndex,
        // ["--radix-popper-transform-origin" as any]: [
        //   middlewareData.transformOrigin?.x,
        //   middlewareData.transformOrigin?.y,
        // ].join(" "),
      }}
      tabIndex={-1}
      onPointerEnter={() => {
        store.enter();
      }}
      onPointerLeave={() => {
        store.leave();
      }}
    >
      <div
        class={cn("popper__content", props.class)}
        classList={props.classList}
        data-side={placedSide()}
        data-align={placedAlign()}
        // style={{
        //   animation: !isPlaced() ? "none" : undefined,
        // }}
      >
        {props.children}
      </div>
    </div>
  );
};

const OPPOSITE_SIDE = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};
const Arrow = (
  props: {
    store: PopperCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const { arrowX, arrowY, baseSide, placedSide, shouldHideArrow } = state;
  let $arrow: HTMLSpanElement;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  onMount(() => {
    // @ts-ignore
    const $$arrow = $arrow;
    if (!$$arrow) {
      return;
    }
    store.setArrow($$arrow.getBoundingClientRect());
  });

  const baseSide = () => OPPOSITE_SIDE[state().placedSide];
  const placedSide = () => state().placedSide;

  return (
    <span
      // @ts-ignore
      ref={$arrow}
      class={cn("popper__arrow", props.class)}
      style={{
        position: "absolute",
        left: "20px",
        top: "0px",
        [baseSide()]: 0,
        "transform-origin": {
          top: "",
          right: "0 0",
          bottom: "center 0",
          left: "100% 0",
        }[placedSide()],
        transform: {
          top: "translateY(100%)",
          right: "translateY(50%) rotate(90deg) translateX(-50%)",
          bottom: `rotate(180deg)`,
          left: "translateY(50%) rotate(-90deg) translateX(50%)",
        }[placedSide()],
        // visibility: shouldHideArrow ? "hidden" : undefined,
      }}
    >
      <ArrowPrimitive />
    </span>
  );
};

export { Root, Anchor, Content, Arrow };
