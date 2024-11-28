import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: TreeLeafState;
};
type TreeLeafProps = {};
type TreeLeafState = {
  expanded: boolean;
};

export class TreeLeafCore extends BaseDomain<TheTypesOfEvents> {
  /** 如果存在子数，该子树是否展开 */
  expanded = false;

  get state(): TreeLeafState {
    return {
      expanded: this.expanded,
    };
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
