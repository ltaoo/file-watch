import { onCleanup } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { CollectionCore } from "@/domains/ui/collection";

const CollectionProvider = (props: { store: CollectionCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  return props.children;
};
const CollectionSlot = (props: { store: CollectionCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  const wrap = {};
  store.setWrap(wrap);

  return props.children;
};
const CollectionItemSlot = (props: { store: CollectionCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const node = {
    id: store.uid(),
  };
  store.add(node, node);
  onCleanup(() => {
    store.remove(node);
  });

  return props.children;
};

const Provider = CollectionProvider;
const Slot = CollectionSlot;
const Item = CollectionItemSlot;

export { Provider, Slot, Item };
