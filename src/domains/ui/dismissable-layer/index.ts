import { BaseDomain, Handler } from "@/domains/base";
// import { app } from "@/store";

type AbsNode = {};
enum Events {
  /** 遮罩消失 */
  Dismiss,
  FocusOutside,
  PointerDownOutside,
  InteractOutside,
}
type TheTypesOfEvents = {
  [Events.Dismiss]: void;
  [Events.PointerDownOutside]: void;
  [Events.FocusOutside]: void;
  [Events.InteractOutside]: void;
};
type DismissableLayerState = {};

export class DismissableLayerCore extends BaseDomain<TheTypesOfEvents> {
  name = "DismissableLayerCore";

  layers = new Set();
  layersWithOutsidePointerEventsDisabled = new Set();
  branches: Set<AbsNode> = new Set();

  isPointerInside = false;

  state: DismissableLayerState = {};

  constructor(options: Partial<{ _name: string }> = {}) {
    super(options);

    // app.onEscapeKeyDown(() => {
    //   this.emit(Events.Dismiss);
    // });
  }

  handlePointerOutside(branch: HTMLElement) {}
  /** 响应点击事件 */
  pointerDown() {
    this.isPointerInside = true;
  }
  /** 响应冒泡到最顶层时的点击事件 */
  handlePointerDownOnTop(absNode?: {}) {
    // console.log(...this.log("handlePointerDownOnTop"));
    //     const { branches, layersWithOutsidePointerEventsDisabled } = this;
    //     const isBodyPointerEventsDisabled =
    //       layersWithOutsidePointerEventsDisabled.size > 0;
    //     const layers = Array.from(this.layers);
    //     const [highestLayerWithOutsidePointerEventsDisabled] = [
    //       ...layersWithOutsidePointerEventsDisabled,
    //     ].slice(-1);
    //     const highestLayerWithOutsidePointerEventsDisabledIndex = layers.indexOf(
    //       highestLayerWithOutsidePointerEventsDisabled
    //     );
    //     const index = absNode ? layers.indexOf(absNode) : -1;
    //     console.log("[DismissableLayerCore]handlePointerDownOnTop - index", index);
    //     const isPointerEventsEnabled = index !== -1;
    //     const isPointerDownOnBranch = [...branches].some((b) => b.contains(absNode));
    if (this.isPointerInside === true) {
      this.isPointerInside = false;
      return;
    }
    this.emit(Events.PointerDownOutside);
    this.emit(Events.InteractOutside);
    this.emit(Events.Dismiss);
  }

  onDismiss(handler: Handler<TheTypesOfEvents[Events.Dismiss]>) {
    return this.on(Events.Dismiss, handler);
  }
}
