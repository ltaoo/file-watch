import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  Click,
  ContextMenu,
  Mounted,
  EnterViewport,
}
type TheTypesOfEvents = {
  [Events.EnterViewport]: void;
  [Events.Mounted]: void;
  [Events.Click]: Events & { target: HTMLElement };
};
export class NodeCore extends BaseDomain<TheTypesOfEvents> {
  handleShow() {
    this.emit(Events.EnterViewport);
  }

  onVisible(handler: Handler<TheTypesOfEvents[Events.EnterViewport]>) {
    return this.on(Events.EnterViewport, handler);
  }
  onClick(handler: Handler<TheTypesOfEvents[Events.Click]>) {
    return this.on(Events.Click, handler);
  }
}
