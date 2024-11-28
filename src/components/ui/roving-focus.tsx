import { createContext, createSignal, onCleanup, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { RovingFocusCore } from "@/domains/ui/roving-focus";

import * as Collection from "./collection";

const RovingFocusContext = createContext<RovingFocusCore>();
const RovingFocusGroup = (
  props: {
    store: RovingFocusCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  return (
    <Collection.Provider store={store.collection}>
      <Collection.Slot>
        <RovingFocusGroupImpl store={store}>{props.children}</RovingFocusGroupImpl>
      </Collection.Slot>
    </Collection.Provider>
  );
};

const RovingFocusGroupImpl = (
  props: {
    store: RovingFocusCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  let isClickFocus = false;

  return (
    <RovingFocusContext.Provider value={store}>
      <div
        style={{ outline: "none" }}
        onMouseDown={() => {
          isClickFocus = true;
        }}
        onFocus={(event) => {
          const isKeyboardFocus = !isClickFocus;
          if (event.target === event.currentTarget && isKeyboardFocus) {
          }
          isClickFocus = false;
        }}
        onBlur={() => {
          // ...
        }}
      >
        {props.children}
      </div>
    </RovingFocusContext.Provider>
  );
};

const RovingFocusGroupItem = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  const store = useContext(RovingFocusContext)!;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  onCleanup(() => {
    store.removeFocusableItem();
  });

  store.addFocusableItem();
  const id = store.uid();

  const orientation = () => state().orientation;
  const isCurrentTabStop = () => state().currentTabStopId === id;

  return (
    <Collection.Item>
      <span
        tabIndex={isCurrentTabStop() ? 0 : -1}
        data-orientation={orientation()}
        onMouseDown={() => {
          store.focusItem(id);
        }}
        onFocus={() => {
          store.focusItem(id);
        }}
        onKeyDown={(event) => {
          if (event.key === "Tab" && event.shiftKey) {
            store.shiftTab();
            return;
          }
        }}
      >
        {props.children}
      </span>
    </Collection.Item>
  );
};

const Root = RovingFocusGroup;
const Item = RovingFocusGroupItem;

export { Root, Item };
