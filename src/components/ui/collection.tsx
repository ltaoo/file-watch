import { CollectionCore } from "@/domains/ui/collection";
import { createContext, onCleanup, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

const CollectionContext = createContext<CollectionCore>();
const CollectionProvider = (props: { store: CollectionCore; children: JSX.Element }) => {
  const { store } = props;
  return <CollectionContext.Provider value={store}>{props.children}</CollectionContext.Provider>;
};
const CollectionSlot = (props: { children: JSX.Element }) => {
  const store = useContext(CollectionContext);
  const wrap = {};
  if (store) {
    store.setWrap(wrap);
  }

  return props.children;
};
const CollectionItemSlot = (props: { children: JSX.Element }) => {
  const store = useContext(CollectionContext);

  if (store) {
    const node = {
      id: store.uid(),
    };
    store.add(node, node);
    // store.remove(node);
  }

  return props.children;
};

const Provider = CollectionProvider;
const Slot = CollectionSlot;
const Item = CollectionItemSlot;

export { Provider, Slot, Item };
