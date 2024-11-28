import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
  StartLoad,
  Loaded,
  Error,
}
type TheTypesOfEvents = {
  [Events.StateChange]: ImageState;
  [Events.StartLoad]: void;
  [Events.Loaded]: void;
  [Events.Error]: void;
};
export enum ImageStep {
  Pending,
  Loading,
  Loaded,
  Failed,
}

type ImageProps = {
  /** 图片宽度 */
  width?: number;
  /** 图片高度 */
  height?: number;
  /** 图片地址 */
  src?: string;
  /** 说明 */
  alt?: string;
  scale?: number;
  /** 模式 */
  fit?: "cover" | "contain";
  unique_id?: unknown;
};
type ImageState = Omit<ImageProps, "scale"> & {
  step: ImageStep;
  scale: number | null;
};

export class ImageCore extends BaseDomain<TheTypesOfEvents> {
  static prefix = "";
  static url(url?: string | null) {
    if (!url) {
      return "";
    }
    if (url.includes("http")) {
      return url;
    }
    return ImageCore.prefix + url;
  }

  unique_uid: unknown;
  src: string;
  width: number;
  height: number;
  scale: null | number = null;
  fit: "cover" | "contain";

  step: ImageStep = ImageStep.Pending;
  realSrc?: string;

  get state(): ImageState {
    return {
      src: this.src,
      step: this.step,
      width: this.width,
      height: this.height,
      scale: this.scale,
    };
  }

  constructor(props: Partial<{}> & ImageProps) {
    super();

    const { unique_id, width = 200, height = 200, src, scale, fit = "cover" } = props;
    this.width = width;
    this.height = height;
    this.src = "";
    this.fit = fit;
    this.realSrc = src;
    if (scale) {
      this.scale = scale;
    }
    if (unique_id) {
      this.unique_uid = unique_id;
    }
  }

  setURL(src?: string | null) {
    console.log("[DOMAIN]ui/image setURL", this.realSrc, this.src, src, this.step);
    if (!src) {
      return;
    }
    if (this.realSrc && src !== this.realSrc) {
      this.realSrc = src;
      // 这里就是修改图片地址
      this.handleShow();
      return;
    }
    this.realSrc = src;
    if (this.step !== ImageStep.Loaded) {
      return;
    }
    this.src = ImageCore.url(this.realSrc);
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 图片进入可视区域 */
  handleShow() {
    // console.log("[DOMAIN]ui/image - handleShow", this.realSrc);
    if (!this.realSrc) {
      this.step = ImageStep.Failed;
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    this.step = ImageStep.Loading;
    this.src = ImageCore.url(this.realSrc);
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 图片加载完成 */
  handleLoaded() {
    this.step = ImageStep.Loaded;
    this.emit(Events.Loaded);
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 图片加载失败 */
  handleError() {
    this.step = ImageStep.Failed;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Error);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onStartLoad(handler: Handler<TheTypesOfEvents[Events.StartLoad]>) {
    return this.on(Events.StartLoad, handler);
  }
  onLoad(handler: Handler<TheTypesOfEvents[Events.Loaded]>) {
    return this.on(Events.Loaded, handler);
  }
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
}

export class ImageInListCore extends BaseDomain<TheTypesOfEvents> {
  /** 列表中一类多个按钮 */
  btns: ImageCore[] = [];
  /** 按钮点击后，该值被设置为触发点击的那个按钮 */
  cur: ImageCore | null = null;

  scale: number | null = null;

  constructor(props: Partial<{ _name: string } & ImageCore> = {}) {
    super(props);

    const { scale } = props;
    if (scale) {
      this.scale = scale;
    }
  }

  /** 当按钮处于列表中时，使用该方法保存所在列表记录 */
  bind(unique_id?: string) {
    const existing = this.btns.find((btn) => {
      return btn.unique_id === unique_id;
    });
    if (existing) {
      return existing;
    }
    const btn = new ImageCore({
      src: unique_id,
      scale: this.scale || undefined,
    });
    this.btns.push(btn);
    return btn;
  }
  select(unique_id: unknown) {
    const matched = this.btns.find((btn) => btn.unique_id === unique_id);
    if (!matched) {
      return;
    }
    this.cur = matched;
  }
  /** 清空触发点击事件时保存的按钮 */
  clear() {
    this.cur = null;
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
