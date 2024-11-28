/**
 * @file 应用，包含一些全局相关的事件、状态
 */

import { BaseDomain, Handler } from "@/domains/base";
import { UserCore } from "@/biz/user/index";
import { StorageCore } from "@/domains/storage/index";
import { Result } from "@/domains/result/index";
import { JSONObject } from "@/types/index";

import { ThemeTypes } from "./types";

export enum OrientationTypes {
  Horizontal = "horizontal",
  Vertical = "vertical",
}
const mediaSizes = {
  sm: 0,
  /** 中等设备宽度阈值 */
  md: 768,
  /** 大设备宽度阈值 */
  lg: 992,
  /** 特大设备宽度阈值 */
  xl: 1200,
  /** 特大设备宽度阈值 */
  "2xl": 1536,
};
function getCurrentDeviceSize(width: number) {
  if (width >= mediaSizes["2xl"]) {
    return "2xl";
  }
  if (width >= mediaSizes.xl) {
    return "xl";
  }
  if (width >= mediaSizes.lg) {
    return "lg";
  }
  if (width >= mediaSizes.md) {
    return "md";
  }
  return "sm";
}
export const MEDIA = "(prefers-color-scheme: dark)";
export type DeviceSizeTypes = keyof typeof mediaSizes;

enum Events {
  Tip,
  Error,
  Login,
  Logout,
  ForceUpdate,
  DeviceSizeChange,
  /** 生命周期 */
  Ready,
  Show,
  Hidden,
  /** 平台相关 */
  Resize,
  Blur,
  Keydown,
  Keyup,
  OrientationChange,
  EscapeKeyDown,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Ready]: void;
  // [EventsUserCore{ icon?: string; text: string[] };
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
  [Events.ForceUpdate]: void;
  [Events.Resize]: {
    width: number;
    height: number;
  };
  [Events.DeviceSizeChange]: DeviceSizeTypes;
  [Events.Keydown]: {
    code: string;
  };
  [Events.Keyup]: {
    code: string;
  };
  [Events.EscapeKeyDown]: void;
  [Events.Blur]: void;
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.OrientationChange]: "vertical" | "horizontal";
  [Events.StateChange]: ApplicationState;
};
type ApplicationState = {
  ready: boolean;
  env: JSONObject;
  theme: ThemeTypes;
  deviceSize: DeviceSizeTypes;
};
type ApplicationProps<T extends { storage: StorageCore<any> }> = {
  user: UserCore;
  storage: T["storage"];
  // history: HistoryCore;
  /**
   * 应用加载前的声明周期，只有返回 Result.Ok() 页面才会展示内容
   */
  beforeReady?: () => Promise<Result<null>>;
  onReady?: () => void;
};

export class Application<T extends { storage: StorageCore<any> }> extends BaseDomain<TheTypesOfEvents> {
  /** 用户 */
  $user: UserCore;
  $storage: T["storage"];

  lifetimes: Pick<ApplicationProps<T>, "beforeReady" | "onReady">;

  ready = false;
  screen: {
    statusBarHeight?: number;
    menuButton?: {
      width: number;
      left: number;
      right: number;
    };
    width: number;
    height: number;
  } = {
    width: 0,
    height: 0,
  };
  /** 当前按下的键 */
  keyboard: Record<string, boolean> = {};
  env: {
    wechat: boolean;
    ios: boolean;
    android: boolean;
    pc: boolean;
    weapp: boolean;
    prod: "develop" | "trial" | "release";
  } = {
    wechat: false,
    ios: false,
    android: false,
    pc: false,
    weapp: false,
    prod: "develop",
  };
  orientation = OrientationTypes.Vertical;
  curDeviceSize: DeviceSizeTypes = "md";
  theme: ThemeTypes = "system";

  safeArea = false;
  Events = Events;

  // @todo 怎么才能更方便地拓展 Application 类，给其添加许多的额外属性还能有类型提示呢？

  get state(): ApplicationState {
    return {
      ready: this.ready,
      theme: this.theme,
      env: this.env,
      deviceSize: this.curDeviceSize,
    };
  }

  constructor(props: ApplicationProps<T>) {
    super();

    const { user, storage, beforeReady, onReady } = props;

    this.$user = user;
    this.$storage = storage;

    this.lifetimes = {
      beforeReady,
      onReady,
    };
  }
  /** 启动应用 */
  async start(size: { width: number; height: number }) {
    const { width, height } = size;
    this.screen = { ...this.screen, width, height };
    this.curDeviceSize = getCurrentDeviceSize(width);
    // console.log('[Application]start');
    const { beforeReady } = this.lifetimes;
    if (beforeReady) {
      const r = await beforeReady();
      // console.log("[]Application - ready result", r);
      if (r.error) {
        return Result.Err(r.error);
      }
    }
    this.ready = true;
    this.emit(Events.Ready);
    this.emit(Events.StateChange, { ...this.state });
    // console.log("[]Application - before start");
    return Result.Ok(null);
  }
  setTheme(theme?: string) {
    let resolved = theme;
    if (!resolved) {
      return;
    }
    // If theme is system, resolve it before setting theme
    if (theme === "system") {
      const r = this.getSystemTheme();
      if (r.error) {
        return;
      }
      resolved = r.data;
    }
  }
  /** 应用指定主题 */
  applyTheme(theme: ThemeTypes) {
    const tip = "请在 connect.web 中实现 applyTheme 方法";
    console.warn(tip);
    return Result.Err(tip);
  }
  getTheme() {
    const tip = "请在 connect.web 中实现 getTheme 方法";
    console.warn(tip);
    return Result.Err(tip);
  }
  getSystemTheme(e?: any): Result<string> {
    const tip = "请在 connect.web 中实现 getSystemTheme 方法";
    console.warn(tip);
    return Result.Err(tip);
  }
  // push(...args: Parameters<HistoryCore["push"]>) {
  //   return this.$history.push(...args);
  // }
  // replace(...args: Parameters<HistoryCore["replace"]>) {
  //   return this.$history.replace(...args);
  // }
  // back(...args: Parameters<HistoryCore["back"]>) {
  //   return this.$history.back(...args);
  // }

  tipUpdate() {
    this.emit(Events.ForceUpdate);
  }
  /** 手机震动 */
  vibrate() {}
  setSize(size: { width: number; height: number }) {
    this.screen = size;
  }
  /** 设置页面 title */
  setTitle(title: string): void {
    throw new Error("请实现 setTitle 方法");
  }
  setEnv(env: JSONObject) {
    this.env = {
      ...this.env,
      ...env,
    };
  }
  /** 复制文本到粘贴板 */
  copy(text: string) {
    throw new Error("请实现 copy 方法");
  }
  getComputedStyle(el: unknown): {} {
    throw new Error("请实现 getComputedStyle 方法");
  }
  /** 发送推送 */
  notify(msg: { title: string; body: string }) {
    console.log("请实现 notify 方法");
  }
  disablePointer() {
    throw new Error("请实现 disablePointer 方法");
  }
  enablePointer() {
    throw new Error("请实现 enablePointer 方法");
  }
  /** 平台相关的全局事件 */
  keydown(code: string) {
    this.keyboard[code] = true;
    // console.log("[DOMAIN]app - keydown", code, this.keyboard);
    this.emit(Events.Keydown, { code });
  }
  keyup(code: string) {
    delete this.keyboard[code];
    if (code === "Escape") {
      this.escape();
    }
    this.emit(Events.Keyup, { code });
  }
  escape() {
    this.emit(Events.EscapeKeyDown);
  }
  resize(size: { width: number; height: number }) {
    this.screen = size;
    this.emit(Events.Resize, size);
  }
  blur() {
    this.emit(Events.Blur);
  }

  handleScreenOrientationChange(orientation: number) {
    if (orientation === 0) {
      this.orientation = OrientationTypes.Vertical;
      this.emit(Events.OrientationChange, this.orientation);
      return;
    }
    this.orientation = OrientationTypes.Horizontal;
    this.emit(Events.OrientationChange, this.orientation);
  }
  handleResize(size: { width: number; height: number }) {
    this.screen = size;
    const mediaStr = getCurrentDeviceSize(size.width);
    if (mediaStr !== this.curDeviceSize) {
      this.curDeviceSize = mediaStr;
      this.emit(Events.DeviceSizeChange, this.curDeviceSize);
    }
    this.emit(Events.Resize, size);
  }

  /* ----------------
   * Lifetime
   * ----------------
   */
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  onDeviceSizeChange(handler: Handler<TheTypesOfEvents[Events.DeviceSizeChange]>) {
    return this.on(Events.DeviceSizeChange, handler);
  }
  onUpdate(handler: Handler<TheTypesOfEvents[Events.ForceUpdate]>) {
    return this.on(Events.ForceUpdate, handler);
  }
  /** 平台相关全局事件 */
  onOrientationChange(handler: Handler<TheTypesOfEvents[Events.OrientationChange]>) {
    return this.on(Events.OrientationChange, handler);
  }
  onResize(handler: Handler<TheTypesOfEvents[Events.Resize]>) {
    return this.on(Events.Resize, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onKeydown(handler: Handler<TheTypesOfEvents[Events.Keydown]>) {
    return this.on(Events.Keydown, handler);
  }
  onKeyup(handler: Handler<TheTypesOfEvents[Events.Keyup]>) {
    return this.on(Events.Keyup, handler);
  }
  onEscapeKeyDown(handler: Handler<TheTypesOfEvents[Events.EscapeKeyDown]>) {
    return this.on(Events.EscapeKeyDown, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  /**
   * ----------------
   * Event
   * ----------------
   */
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
}
