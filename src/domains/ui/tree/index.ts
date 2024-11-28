import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: TreeState;
};
type TreeProps = {};
type TreeState = {};

export class TreeCore extends BaseDomain<TheTypesOfEvents> {
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
