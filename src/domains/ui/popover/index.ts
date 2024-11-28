/**
 * @file 气泡
 */
import { BaseDomain, Handler } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
import { PopperCore, Align, Side } from "@/domains/ui/popper";
import { DismissableLayerCore } from "@/domains/ui/dismissable-layer";

const SIDE_OPTIONS = ["top", "right", "bottom", "left"] as const;
const ALIGN_OPTIONS = ["start", "center", "end"] as const;
// export type Align = (typeof ALIGN_OPTIONS)[number];
// export type Side = (typeof SIDE_OPTIONS)[number];

enum Events {
  Show,
  Hidden,
}
type TheTypesOfEvents = {
  [Events.Show]: void;
  [Events.Hidden]: void;
};
type PopoverProps = {
  side?: Side;
  align?: Align;
  strategy?: "fixed" | "absolute";
};

export class PopoverCore extends BaseDomain<TheTypesOfEvents> {
  popper: PopperCore;
  present: PresenceCore;
  layer: DismissableLayerCore;

  _side: Side;
  _align: Align;

  constructor(props: { _name?: string } & PopoverProps = {}) {
    super();

    const { side = "bottom", align = "end", strategy } = props;
    this._side = side;
    this._align = align;

    this.popper = new PopperCore({
      side,
      align,
      strategy,
    });
    this.present = new PresenceCore();
    this.layer = new DismissableLayerCore();
    this.layer.onDismiss(() => {
      console.log("[DOMAIN/ui]popover/index - onDismiss");
      this.hide();
    });
  }

  visible = false;
  get state() {
    return {
      visible: this.visible,
    };
  }

  toggle() {
    console.log("[DOMAIN/ui]popover/index - toggle");
    const { visible } = this;
    if (visible) {
      this.hide();
      return;
    }
    this.show();
  }
  show(position?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  }) {
    console.log(this.popper.reference?.getRect());
    if (position) {
      this.popper.updateReference({
        getRect() {
          const { x = 0, y = 0, width = 0, height = 0, left = 0, top = 0, right = 0, bottom = 0 } = position;
          return {
            width,
            height,
            x,
            y,
            left,
            top,
            right,
            bottom,
          };
        },
      });
    }
    this.visible = true;
    this.present.show();
    this.popper.place();
    this.emit(Events.Show);
  }
  hide() {
    if (this.visible === false) {
      return;
    }
    this.visible = false;
    this.present.hide();
    this.emit(Events.Hidden);
  }
  unmount() {
    super.destroy();
    this.layer.destroy();
    this.popper.destroy();
    this.present.unmount();
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    this.on(Events.Show, handler);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    this.on(Events.Hidden, handler);
  }

  get [Symbol.toStringTag]() {
    return "PopoverCore";
  }
}
