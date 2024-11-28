/**
 * @file 弹窗核心类
 */
import { BaseDomain, Handler } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";

enum Events {
  BeforeShow,
  Show,
  BeforeHidden,
  Hidden,
  OpenChange,
  AnimationStart,
  AnimationEnd,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.BeforeShow]: void;
  [Events.Show]: void;
  [Events.BeforeHidden]: void;
  [Events.Hidden]: void;
  [Events.OpenChange]: boolean;
  [Events.AnimationStart]: void;
  [Events.AnimationEnd]: void;
  [Events.StateChange]: ToastState;
};
type ToastState = {
  icon?: unknown;
  texts: string[];
};
type ToastProps = {
  delay: number;
};

export class ToastCore extends BaseDomain<TheTypesOfEvents> {
  name = "ToastCore";

  present: PresenceCore;
  delay = 1200;
  timer: NodeJS.Timeout | null = null;
  open = false;

  state: ToastState = {
    icon: null,
    texts: [],
  };

  constructor(options: Partial<{ _name: string } & ToastProps> = {}) {
    super(options);

    const { delay } = options;
    if (delay) {
      this.delay = delay;
    }
    this.present = new PresenceCore();
    this.present.onShow(() => {
      // console.log("[]ToastCore - this.present.onShow");
      this.open = true;
      this.emit(Events.OpenChange, true);
    });
    this.present.onHidden(() => {
      // console.log("[]ToastCore - this.present.onHide");
      this.open = false;
      this.emit(Events.OpenChange, false);
    });
  }

  /** 显示弹窗 */
  async show(params: { icon?: unknown; texts: string[] }) {
    const { icon, texts } = params;
    this.emit(Events.StateChange, {
      icon,
      texts,
    });
    if (this.timer !== null) {
      this.clearTimer();
      this.timer = setTimeout(() => {
        this.hide();
        this.clearTimer();
      }, this.delay);
      return;
    }
    this.present.show();
    this.timer = setTimeout(() => {
      this.hide();
      this.clearTimer();
    }, this.delay);
  }
  clearTimer() {
    if (this.timer === null) {
      return;
    }
    clearTimeout(this.timer);
    this.timer = null;
  }
  /** 隐藏弹窗 */
  hide() {
    this.present.hide();
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onOpenChange(handler: Handler<TheTypesOfEvents[Events.OpenChange]>) {
    return this.on(Events.OpenChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "ToastCore";
  }
}
