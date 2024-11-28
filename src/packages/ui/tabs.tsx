import { JSX, Show, createSignal } from "solid-js";

import { TabsCore } from "@/domains/ui/tabs";
import { PresenceCore } from "@/domains/ui/presence";

import { Presence } from "./presence";

const Root = (
  props: {
    store: TabsCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });
  const direction = () => state().dir;
  const orientation = "";

  return (
    <div data-orientation={orientation} class={props.class}>
      {props.children}
    </div>
  );
};

const List = (props: { store: TabsCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const orientation = () => state().orientation;

  return (
    <div class={props.class} role="tablist" aria-orientation={orientation()}>
      {props.children}
    </div>
  );
};

const Trigger = (
  props: {
    store: TabsCore;
    value: string;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store, value } = props;

  return (
    <button
      class={props.class}
      onMouseDown={(event) => {
        if (event.button === 0 && event.ctrlKey === false) {
          store.selectTab(value);
        }
      }}
      onKeyDown={(event) => {
        if ([" ", "Enter"].includes(event.key)) {
          store.selectTab(value);
        }
      }}
      onFocus={() => {
        // ...
      }}
    >
      {props.children}
    </button>
  );
};

const Content = (
  props: {
    store: TabsCore;
    value: string;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store, value } = props;

  const presence = new PresenceCore();
  const [state, setState] = createSignal(store.state);
  const [presenceState, setPresenceState] = createSignal(presence.state);
  presence.onStateChange((nextState) => {
    setPresenceState(nextState);
  });
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  store.appendContent({
    id: store.uid(),
    value,
    presence,
  });

  const orientation = () => state().orientation;
  const isSelected = () => state().curValue === value;
  const open = () => presenceState().visible;

  return (
    <Presence store={presence}>
      <div
        class={props.class}
        data-state={isSelected() ? "active" : "inactive"}
        data-orientation={orientation()}
        role="tabpanel"
        // aria-labelledby={triggerId}
        hidden={!open()}
        // id={contentId}
        tabIndex={0}
      >
        <Show when={open()}>{props.children}</Show>
      </div>
    </Presence>
  );
};

export { Root, List, Trigger, Content };
