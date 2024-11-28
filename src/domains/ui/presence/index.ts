/**
 * @file 支持动画的 Popup
 */
import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
  PresentChange,
  Show,
  TmpShow,
  Hidden,
  TmpHidden,
  Unmounted,
}
type TheTypesOfEvents = {
  [Events.StateChange]: PresenceState;
  [Events.PresentChange]: boolean;
  [Events.Show]: void;
  [Events.TmpShow]: void;
  [Events.Hidden]: void;
  [Events.TmpHidden]: void;
  [Events.Unmounted]: void;
};
const PresenceEventMap = {
  mounted: {
    UNMOUNT: "unmounted",
    ANIMATION_OUT: "unmountSuspended",
  },
  unmountSuspended: {
    MOUNT: "mounted",
    ANIMATION_END: "unmounted",
  },
  unmounted: {
    MOUNT: "mounted",
  },
};
type PresenceState = {
  mounted: boolean;
  enter: boolean;
  visible: boolean;
  exit: boolean;
  text: string;
};
type PresenceProps = {
  mounted?: boolean;
  visible?: boolean;
};

export class PresenceCore extends BaseDomain<TheTypesOfEvents> {
  name = "PresenceCore";
  debug = false;

  animationName = "none";

  mounted = false;
  enter = false;
  visible = false;
  exit = false;

  get state(): PresenceState {
    return {
      mounted: this.mounted,
      enter: this.enter,
      visible: this.visible,
      exit: this.exit,
      text: (() => {
        if (this.exit) {
          return "exit";
        }
        if (this.enter) {
          return "enter";
        }
        if (this.visible) {
          return "visible";
        }
        return "unknown";
      })(),
    };
  }

  constructor(props: Partial<{ _name: string }> & PresenceProps = {}) {
    super(props);

    const { mounted = false, visible = false } = props;
    this.mounted = mounted;
    this.visible = visible;
    if (visible) {
      this.mounted = true;
    }
  }
  toggle() {
    if (this.visible) {
      this.hide();
      return;
    }
    this.show();
  }
  show() {
    this.mounted = true;
    this.enter = true;
    this.visible = true;
    this.emit(Events.StateChange, { ...this.state });
    setTimeout(() => {
      // 120 是预计的动画时间
      this.emit(Events.Show);
    }, 120);
  }
  hide(options: Partial<{ reason: "show_sibling" | "back" | "forward"; destroy: boolean }> = {}) {
    // console.log("[DOMAIN]ui/presence - hide", options);
    const { destroy = true } = options;
    if (destroy === false) {
      // 不销毁，但是要隐藏
      this.visible = false;
      this.emit(Events.Hidden);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    this.exit = true;
    this.emit(Events.StateChange, { ...this.state });
    setTimeout(() => {
      this.visible = false;
      this.emit(Events.Hidden);
      this.emit(Events.StateChange, { ...this.state });
      this.unmount();
    }, 120);
  }
  /** 将 DOM 从页面卸载 */
  unmount() {
    // console.log("[]PresenceCore - destroy", this.visible, this.exit);
    // if (this.open) {
    //   return;
    // }
    this.mounted = false;
    this.enter = false;
    this.visible = false;
    this.exit = false;
    this.emit(Events.Unmounted);
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.mounted = false;
    this.enter = false;
    this.visible = false;
    this.exit = false;
    this.emit(Events.StateChange, { ...this.state });
  }

  onTmpShow(handler: Handler<TheTypesOfEvents[Events.TmpShow]>) {
    return this.on(Events.TmpShow, handler);
  }
  onTmpHidden(handler: Handler<TheTypesOfEvents[Events.TmpHidden]>) {
    return this.on(Events.TmpHidden, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onUnmounted(handler: Handler<TheTypesOfEvents[Events.Unmounted]>) {
    return this.on(Events.Unmounted, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onPresentChange(handler: Handler<TheTypesOfEvents[Events.PresentChange]>) {
    return this.on(Events.PresentChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Presence";
  }
}
