import { BaseDomain, Handler } from "@/domains/base";
import { Direction, Orientation } from "@/domains/ui/direction";
import { CollectionCore } from "@/domains/ui/collection";

enum Events {
  ItemFocus,
  ItemShiftTab,
  FocusableItemAdd,
  FocusableItemRemove,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.ItemFocus]: number;
  [Events.ItemShiftTab]: void;
  [Events.FocusableItemAdd]: void;
  [Events.FocusableItemRemove]: void;
  [Events.StateChange]: RovingFocusState;
};
type RovingFocusState = {
  currentTabStopId: number | null;
  orientation?: Orientation;
  dir?: Direction;
  loop?: boolean;
};
export class RovingFocusCore extends BaseDomain<TheTypesOfEvents> {
  collection: CollectionCore;

  state: RovingFocusState = {
    currentTabStopId: null,
    orientation: "horizontal",
    dir: "ltr",
  };

  constructor(options: Partial<{ _name: string }> = {}) {
    super(options);

    const { _name } = options;
    this.collection = new CollectionCore();
  }

  focusItem(id: number) {
    this.emit(Events.ItemFocus, id);
  }
  shiftTab() {
    this.emit(Events.ItemShiftTab);
  }
  addFocusableItem() {
    this.emit(Events.FocusableItemAdd);
  }
  removeFocusableItem() {
    this.emit(Events.FocusableItemRemove);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
  onItemFocus(handler: Handler<TheTypesOfEvents[Events.ItemFocus]>) {
    this.on(Events.ItemFocus, handler);
  }
  onItemShiftTab(handler: Handler<TheTypesOfEvents[Events.ItemShiftTab]>) {
    this.on(Events.ItemShiftTab, handler);
  }
  onFocusableItemAdd(handler: Handler<TheTypesOfEvents[Events.FocusableItemAdd]>) {
    this.on(Events.FocusableItemAdd, handler);
  }
  onFocusableItemRemove(handler: Handler<TheTypesOfEvents[Events.FocusableItemRemove]>) {
    this.on(Events.FocusableItemRemove, handler);
  }
}
