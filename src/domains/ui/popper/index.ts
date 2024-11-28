import { BaseDomain, Handler } from "@/domains/base";
import { Rect } from "@/types";

import type {
  Alignment,
  Placement,
  Coords,
  Strategy,
  Middleware,
  MiddlewareData,
  Padding,
  SideObject,
  Axis,
  Length,
} from "./types";

const SIDE_OPTIONS = ["top", "right", "bottom", "left"] as const;
const ALIGN_OPTIONS = ["start", "center", "end"] as const;
export type Side = (typeof SIDE_OPTIONS)[number];
export type Align = (typeof ALIGN_OPTIONS)[number];

enum Events {
  /** 参考原始被加载 */
  ReferenceMounted,
  /** 内容元素被加载（可以获取宽高位置） */
  FloatingMounted,
  /** 被放置（其实就是计算好了浮动元素位置） */
  Placed,
  /** 鼠标进入内容区 */
  Enter,
  /** 鼠标离开内容区 */
  Leave,
  StateChange,
  /** 父容器改变 */
  ContainerChange,
}
type TheTypesOfEvents = {
  [Events.FloatingMounted]: {
    getRect: () => Rect;
    // width: number;
    // height: number;
    // x: number;
    // y: number;
  };
  [Events.ReferenceMounted]: {
    getRect: () => Rect;
    // width: number;
    // height: number;
    // x: number;
    // y: number;
  };
  [Events.ContainerChange]: Node;
  [Events.Placed]: PopperState;
  [Events.Enter]: void;
  [Events.Leave]: void;
  [Events.StateChange]: PopperState;
};
type PopperProps = {
  side: Side;
  align: Align;
  strategy: "fixed" | "absolute";
  middleware: Middleware[];
};
type PopperState = {
  strategy: Strategy;
  x: number;
  y: number;
  // placement: Placement;
  isPlaced: boolean;
  placedSide: Side;
  placedAlign: Align;
  /** 是否设置了参考DOM */
  reference: boolean;
};
export class PopperCore extends BaseDomain<TheTypesOfEvents> {
  _name = "PopperCore";
  debug = true;

  // side: Side = "bottom";
  // align: Align = "center";
  placement: Placement = "bottom";
  strategy: Strategy = "absolute";
  middleware: Middleware[] = [];
  // sideOffset = 0;
  // alignOffset = 0;
  // arrowPadding = 0;
  // collisionBoundary = [];
  // collisionPadding: collisionPaddingProp = 0;
  // sticky = "partial";
  // hideWhenDetached = false;
  // avoidCollisions = true;
  // onPlaced;
  reference: {
    getRect: () => Rect;
    // x: number;
    // y: number;
    // width: number;
    // height: number;
  } | null = null;
  floating: {
    getRect: () => Rect;
    // x: number;
    // y: number;
    // width: number;
    // height: number;
  } | null = null;
  container: Node | null = null;
  arrow: {
    width: number;
    height: number;
  } | null = null;

  state: PopperState = {
    strategy: "absolute",
    x: 0,
    y: 0,
    isPlaced: false,
    placedSide: "bottom",
    placedAlign: "center",
    reference: false,
  };

  _enter = false;
  _focus = false;

  constructor(options: Partial<{ _name: string }> & Partial<PopperProps> = {}) {
    super(options);

    const { _name, side = "bottom", align = "center", strategy = "absolute", middleware = [] } = options;
    if (_name) {
      this._name = _name;
    }
    this.strategy = strategy;
    this.placement = (side + (align !== "center" ? "-" + align : "")) as Placement;
    // const validMiddleware = middleware.filter(Boolean) as Middleware[];
  }

  /** 基准元素加载完成 */
  setReference(reference: { $el?: unknown; getRect: () => Rect }) {
    // this.log("setReference", this.reference, reference.$el);
    if (this.reference !== null) {
      return;
    }
    this.reference = reference;
    this.state.reference = true;
    this.emit(Events.ReferenceMounted, reference);
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 更新基准元素（右键菜单时会用到这个方法） */
  updateReference(reference: { getRect: () => Rect }) {
    this.log("updateReference", this.reference);
    this.reference = reference;
  }
  removeReference() {
    if (this.reference === null) {
      return;
    }
    this.state.reference = false;
    this.reference = null;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 内容元素加载完成 */
  setFloating(floating: PopperCore["floating"]) {
    if (floating === null) {
      return;
    }
    this.floating = floating;
    this.emit(Events.FloatingMounted, floating);
  }
  /** 箭头加载完成 */
  setArrow(arrow: PopperCore["arrow"]) {
    this.arrow = arrow;
  }
  setContainer(container: Node) {
    // this.container = container;
    // this.emit(Events.ContainerChange, container);
  }
  setConfig(config: { placement?: Placement; strategy?: Strategy }) {}
  /** 计算浮动元素位置 */
  async place() {
    console.log(...this.log("place", this.reference, this.floating));
    this.middleware = [
      // arrow({
      //   element: this.floating,
      // }),
      // transformOriginMiddleware({
      //   element: this.arrow,
      // }),
    ];
    if (this.reference === null || this.floating === null) {
      return;
    }
    const coords = await this.computePosition();
    const { x, y, middlewareData } = coords;
    const [placedSide, placedAlign] = getSideAndAlignFromPlacement(this.placement);
    this.state = {
      x,
      y,
      strategy: this.strategy,
      isPlaced: true,
      placedSide,
      placedAlign,
      reference: true,
    };
    // console.log(...this.log("place - before emit placed", { x, y }));
    this.emit(Events.StateChange, {
      ...this.state,
    });
  }
  async computePosition() {
    const rtl = true;
    const { placement, strategy } = this;
    let statefulPlacement = placement;
    // @todo 处理 this.reference 为空
    const reference = this.reference!.getRect();
    const floating = this.floating!.getRect();
    const rects = {
      reference,
      floating,
    };
    let { x, y } = this.computeCoordsFromPlacement(rects, placement, rtl);
    // console.log('[]this.computeCoordsFromPlacement result', x, y);
    let middlewareData: MiddlewareData = {};
    for (let i = 0; i < this.middleware.length; i++) {
      const { name, fn } = this.middleware[i];
      const {
        x: nextX,
        y: nextY,
        data,
        reset,
      } = await fn({
        x,
        y,
        initialPlacement: placement,
        placement: statefulPlacement,
        strategy,
        middlewareData,
        rects,
        elements: { reference, floating },
      });

      x = nextX ?? x;
      y = nextY ?? y;

      middlewareData = {
        ...middlewareData,
        [name]: {
          ...middlewareData[name],
          ...data,
        },
      };
    }
    return {
      x,
      y,
      placement: statefulPlacement,
      strategy,
      middlewareData,
    };
  }
  /** 根据放置位置，计算浮动元素坐标 */
  computeCoordsFromPlacement(elms: { reference: Rect; floating: Rect }, placement: Placement, rtl?: boolean): Coords {
    const { reference, floating } = elms;
    console.log("computeCoordsFromPlacement", reference, floating);
    const commonX = reference.x + reference.width / 2 - floating.width / 2;
    const commonY = reference.y + reference.height / 2 - floating.height / 2;
    // 主轴，是横向对齐，还是竖向对齐 x/y
    const mainAxis = getMainAxisFromPlacement(placement);
    // 获取距离属性，height/width
    const length = getLengthFromAxis(mainAxis);
    const commonAlign = reference[length] / 2 - floating[length] / 2;
    const side = getSide(placement);
    const isVertical = mainAxis === "x";
    let coords;
    switch (side) {
      case "top":
        coords = { x: commonX, y: reference.y - floating.height };
        break;
      case "bottom":
        coords = { x: commonX, y: reference.y + reference.height };
        break;
      case "right":
        coords = { x: reference.x + reference.width, y: commonY };
        break;
      case "left":
        coords = { x: reference.x - floating.width, y: commonY };
        break;
      default:
        coords = { x: reference.x, y: reference.y };
    }
    switch (getAlignment(placement)) {
      case "start":
        coords[mainAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
        break;
      case "end":
        coords[mainAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
        break;
      default:
    }
    return coords;
  }
  enter() {
    // this.log("enter", this.reference?.x, this._enter);
    if (this._enter === true) {
      return;
    }
    this._enter = true;
    this.emit(Events.Enter);
  }
  leave() {
    // this.log("leave", this.reference?.x, this._enter);
    if (this._enter === false) {
      return;
    }
    this._enter = false;
    this.emit(Events.Leave);
  }
  reset() {
    this._enter = false;
    this._focus = false;
  }

  onReferenceMounted(handler: Handler<TheTypesOfEvents[Events.ReferenceMounted]>) {
    return this.on(Events.ReferenceMounted, handler);
  }
  onFloatingMounted(handler: Handler<TheTypesOfEvents[Events.FloatingMounted]>) {
    return this.on(Events.FloatingMounted, handler);
  }
  onContainerChange(handler: Handler<TheTypesOfEvents[Events.ContainerChange]>) {
    return this.on(Events.ContainerChange, handler);
  }
  onEnter(handler: Handler<TheTypesOfEvents[Events.Enter]>) {
    return this.on(Events.Enter, handler);
  }
  onLeave(handler: Handler<TheTypesOfEvents[Events.Leave]>) {
    return this.on(Events.Leave, handler);
  }
  onPlaced(handler: Handler<TheTypesOfEvents[Events.Placed]>) {
    return this.on(Events.Placed, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "PopperCore";
  }
}

/* -----------------------------------------------------------------------------------------------*/

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}
function getSideAndAlignFromPlacement(placement: Placement) {
  const [side, align = "center"] = placement.split("-");
  return [side as Side, align as Align] as const;
}
function getSide(placement: Placement): Side {
  return placement.split("-")[0] as Side;
}
function getMainAxisFromPlacement(placement: Placement): Axis {
  return ["top", "bottom"].includes(getSide(placement)) ? "x" : "y";
}
function getLengthFromAxis(axis: Axis): Length {
  return axis === "y" ? "height" : "width";
}
function getAlignment<T extends string>(placement: T): Alignment {
  return placement.split("-")[1] as Alignment;
}
function expandPaddingObject(padding: Partial<SideObject>): SideObject {
  return { top: 0, right: 0, bottom: 0, left: 0, ...padding };
}
function getSideObjectFromPadding(padding: Padding): SideObject {
  return typeof padding !== "number"
    ? expandPaddingObject(padding)
    : { top: padding, right: padding, bottom: padding, left: padding };
}

function within(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
export const arrow = (options: { element: { width: number; height: number }; padding?: number }): Middleware => ({
  name: "arrow",
  options,
  async fn(state) {
    // Since `element` is required, we don't Partial<> the type.
    const { element, padding = 0 } = options || {};
    const { x, y, placement, rects, elements } = state;

    if (element == null) {
      return {};
    }

    const paddingObject = getSideObjectFromPadding(padding);
    const coords = { x, y };
    const axis = getMainAxisFromPlacement(placement);
    const length = getLengthFromAxis(axis);
    const arrowDimensions = element;
    const isYAxis = axis === "y";
    const minProp = isYAxis ? "top" : "left";
    const maxProp = isYAxis ? "bottom" : "right";
    const clientProp = isYAxis ? "clientHeight" : "clientWidth";

    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];

    // const arrowOffsetParent = await platform.getOffsetParent?.(element);
    // let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
    const clientSize = elements.floating[clientProp] || rects.floating[length];

    const centerToReference = endDiff / 2 - startDiff / 2;

    // Make sure the arrow doesn't overflow the floating element if the center
    // point is outside the floating element's bounds.
    const min = paddingObject[minProp];
    const max = clientSize - arrowDimensions[length] - paddingObject[maxProp];
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset = within(min, center, max);

    // If the reference is small enough that the arrow's padding causes it to
    // to point to nothing for an aligned placement, adjust the offset of the
    // floating element itself. This stops `shift()` from taking action, but can
    // be worked around by calling it again after the `arrow()` if desired.
    const shouldAddOffset =
      getAlignment(placement) != null &&
      center != offset &&
      rects.reference[length] / 2 -
        (center < min ? paddingObject[minProp] : paddingObject[maxProp]) -
        arrowDimensions[length] / 2 <
        0;
    const alignmentOffset = shouldAddOffset ? (center < min ? min - center : max - center) : 0;

    return {
      [axis]: coords[axis] - alignmentOffset,
      data: {
        [axis]: offset,
        centerOffset: center - offset,
      },
    };
  },
});

const transformOriginMiddleware = (options: {
  element: {
    width: number;
    height: number;
  };
}): Middleware => ({
  name: "transformOrigin",
  options,
  fn(data) {
    const { element } = options;
    if (!element) {
      return {
        data: {
          x: 0,
          y: 0,
        },
      };
    }
    const { placement, rects, middlewareData } = data;
    const cannotCenterArrow = middlewareData.arrow?.centerOffset !== 0;
    const isArrowHidden = cannotCenterArrow;
    const arrowWidth = isArrowHidden ? 0 : element.width;
    const arrowHeight = isArrowHidden ? 0 : element.height;

    const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
    const noArrowAlign = { start: "0%", center: "50%", end: "100%" }[placedAlign];

    const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2;
    const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2;

    let x = "";
    let y = "";

    if (placedSide === "bottom") {
      x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
      y = `${-arrowHeight}px`;
    } else if (placedSide === "top") {
      x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
      y = `${rects.floating.height + arrowHeight}px`;
    } else if (placedSide === "right") {
      x = `${-arrowHeight}px`;
      y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
    } else if (placedSide === "left") {
      x = `${rects.floating.width + arrowHeight}px`;
      y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
    }
    return { data: { x, y } };
  },
});
