import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
  Focusin,
  Focusout,
}
type TheTypesOfEvents = {
  [Events.StateChange]: FocusScopeState;
  [Events.Focusin]: void;
  [Events.Focusout]: void;
};
type FocusScopeState = {
  paused: boolean;
};

export class FocusScopeCore extends BaseDomain<TheTypesOfEvents> {
  name = "FocusScopeCore";

  state: FocusScopeState = {
    paused: false,
  };

  constructor(options: Partial<{ _name: string }> = {}) {
    super(options);
  }

  pause() {
    this.state.paused = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  resume() {
    this.state.paused = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  focusin() {
    this.emit(Events.Focusin);
  }
  focusout() {
    this.emit(Events.Focusout);
  }

  onFocusin(handler: Handler<TheTypesOfEvents[Events.Focusin]>) {
    this.on(Events.Focusin, handler);
  }
  onFocusout(handler: Handler<TheTypesOfEvents[Events.Focusout]>) {
    this.on(Events.Focusout, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
