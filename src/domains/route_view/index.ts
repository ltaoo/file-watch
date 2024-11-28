/**
 * @file 根据路由判断是否可见的视图块
 */
import { BaseDomain, Handler } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence/index";
import { NavigatorCore } from "@/domains/navigator/index";
import { query_stringify } from "@/utils/index";

import { buildUrl } from "./utils";

enum Events {
  /** 子视图改变（数量 */
  ViewsChange,
  /** 当前展示的子视图改变 */
  CurViewChange,
  /** 有视图变为可见状态 */
  ViewShow,
  /** 视图加载好 */
  Ready,
  /** 当前视图载入页面 */
  Mounted,
  BeforeShow,
  /** 当前视图变为可见，稍晚于 Mounted 事件 */
  Show,
  BeforeHide,
  /** 当前视图变为隐藏 */
  Hidden,
  /** 当前视图从页面卸载 */
  Unmounted,
  /** 被其他视图覆盖 */
  Layered,
  /** 覆盖自身的视图被移开 */
  Uncover,
  Start,
  StateChange,
  /** 子视图匹配上了 */
  Match,
  NotFound,
}
type TheTypesOfEvents = {
  [Events.ViewsChange]: RouteViewCore[];
  [Events.CurViewChange]: RouteViewCore;
  [Events.Ready]: void;
  [Events.Mounted]: void;
  [Events.ViewShow]: RouteViewCore[];
  [Events.BeforeShow]: void;
  [Events.Show]: void;
  [Events.BeforeHide]: void;
  [Events.Hidden]: void;
  [Events.Layered]: void;
  [Events.Uncover]: void;
  [Events.Unmounted]: void;
  [Events.Start]: { pathname: string };
  [Events.StateChange]: RouteViewCoreState;
  [Events.Match]: RouteViewCore;
  [Events.NotFound]: void;
};

type RouteViewCoreState = {
  /** 是否加载到页面上（如果有动画，在隐藏动画播放时该值仍为 true，在 animation end 后从视图上卸载后，该值被置为 false） */
  mounted: boolean;
  /** 是否可见，用于判断是「进入动画」还是「退出动画」 */
  visible: boolean;
  /** 被另一视图覆盖 */
  layered: boolean;
};
type RouteViewCoreProps = {
  /** 唯一标志 */
  name: string;
  pathname: string;
  title: string;
  // component: unknown;
  parent?: RouteViewCore | null;
  query?: Record<string, string>;
  visible?: boolean;
  /** 该视图是布局视图 */
  layout?: boolean;
  animation?: Partial<{
    in: string;
    out: string;
    show: string;
    hide: string;
  }>;
  children?: RouteViewCore[];
  views?: RouteViewCore[];

  // destroyAfterHide?: boolean;
};

export class RouteViewCore extends BaseDomain<TheTypesOfEvents> {
  unique_id = "ViewCore";
  debug = false;
  id = this.uid();

  /** 一些配置项 */
  name: string;
  pathname: string;
  title: string;
  animation: Partial<{
    in: string;
    out: string;
    show: string;
    hide: string;
  }> = {};
  /** 当前视图的 query */
  query: Record<string, string> = {};
  /** 当前视图的 params */
  params: Record<string, string> = {};
  // visible = false;
  _showed = false;
  loaded = false;
  mounted = true;
  layered = false;
  isRoot = false;

  parent: RouteViewCore | null;
  /** 当前子视图 */
  curView: RouteViewCore | null = null;
  /** 当前所有的子视图 */
  subViews: RouteViewCore[] = [];

  $presence = new PresenceCore();

  get state(): RouteViewCoreState {
    return {
      mounted: this.mounted,
      visible: this.visible,
      layered: this.layered,
    };
  }
  get href() {
    return [this.pathname, query_stringify(this.query)].filter(Boolean).join("?");
  }
  get visible() {
    return this.$presence.visible;
  }
  // get animation() {
  //   return this.options?.animation;
  // }

  constructor(options: Partial<{ _name: string }> & RouteViewCoreProps) {
    super(options);
    const { name, pathname, title, query = {}, visible = false, animation = {}, parent = null, views = [] } = options;
    this.name = name;
    this.pathname = pathname;
    this.parent = parent;
    this.title = title;
    this.unique_id = title;
    this.animation = animation;
    this.subViews = views;
    // console.log("[DOMAIN]route_view - constructor", title, { destroyAfterHide });
    if (views.length) {
      this.curView = views[0];
    }
    // this.visible = visible;
    this.query = query;
    if (visible) {
      this.mounted = true;
    }
    for (let i = 0; i < views.length; i += 1) {
      const view = views[i];
      view.parent = this;
    }

    this.$presence.onStateChange((nextState) => {
      const { visible, mounted } = nextState;
      // console.log("[ROUTE_VIEW]this.presence.onStateChange", this.title, this.state.visible, open, mounted);
      // console.log(performance.now());
      const prevVisible = this.state.visible;
      // this.visible = open;
      if (prevVisible === false && visible) {
        this.setShow();
      }
      if (prevVisible && visible === false) {
        this.setHidden();
      }
      this.mounted = !!mounted;
      this.emit(Events.StateChange, { ...this.state });
    });
    // this.$presence.onShow(() => {
    //   this.showed();
    // });
    // this.$presence.onHidden(() => {
    //   this.hidden();
    // });
    emitViewCreated(this);
  }

  appendView(view: RouteViewCore) {
    view.parent = this;
    if (this.subViews.length === 0 && view.visible) {
      this.curView = view;
    }
    if (!this.subViews.includes(view)) {
      this.subViews.push(view);
    }
    console.log("[DOMAIN]route_view - appendView", this.title, this.subViews, view);
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  replaceViews(views: RouteViewCore[]) {
    this.subViews = views;
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  /** 移除（卸载）一个子视图 */
  removeView(
    view: RouteViewCore,
    options: Partial<{ reason: "show_sibling" | "back" | "forward"; destroy: boolean; callback: () => void }> = {}
  ) {
    const { reason, destroy, callback } = options;
    // console.log("[DOMAIN]route_view - removeView", this.title, view.title);
    console.log("[DOMAIN]route_view - removeView", this.title, view.title);
    if (!this.subViews.includes(view)) {
      return;
    }
    view.onUnmounted(() => {
      console.log("[DOMAIN]route_view - removeView.onUnmounted", this.title, view.title);
      // console.log(performance.now());
      view.destroy();
      // view.setUnmounted();
      this.subViews = this.subViews.filter((v) => v !== view);
      if (callback) {
        callback();
      }
      console.log("[DOMAIN]route_view - removeView before Events.ViewsChange", this.title, view.title);
      this.emit(Events.ViewsChange, [...this.subViews]);
    });
    // console.log(performance.now());
    view.hide({ reason, destroy });
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  findCurView(): RouteViewCore | null {
    if (!this.curView) {
      return this;
    }
    return this.curView.findCurView();
  }
  ready() {
    this.emit(Events.Ready);
  }
  /** 让自身的一个子视图变为可见 */
  showView(subView: RouteViewCore, options: Partial<{ reason: "show_sibling" | "back"; destroy: boolean }> = {}) {
    console.log("[DOMAIN]route_view - showSubView", this.title, subView.title, this.curView?.title);
    if (subView === this) {
      console.warn("cannot show self");
      return;
    }
    if (subView.visible) {
      console.warn("the sub view has been visible");
      return;
    }
    (() => {
      if (!this.visible) {
        // 如果自身是不可见状态，先让自身的父视图将自己 show
        // console.log("[DOMAIN]route_view - show self by parent", this.title, this.parent?.title);
        if (!this.parent) {
          if (!this.isRoot) {
            console.warn("no parent");
          }
          return;
        }
        this.parent.showView(this, options);
      }
    })();
    if (this.curView) {
      this.curView.hide(options);
    }
    this.appendView(subView);
    this.emit(Events.BeforeShow);
    this.curView = subView;
    subView.show();
    this.emit(Events.CurViewChange, this.curView);
  }
  /** 主动展示视图 */
  show() {
    // console.log("[ROUTE_VIEW]show", this._name, this.state.visible);
    if (this.visible) {
      // 为了让 presence 内部 hide 时判断 mounted 为 true
      this.$presence.state.mounted = true;
      return;
    }
    this.$presence.show();
  }
  /** 主动隐藏自身视图 */
  hide(options: Partial<{ reason: "show_sibling" | "back" | "forward"; destroy: boolean }> = {}) {
    console.log("[DOMAIN]route_view - hide", this.title, options);
    if (this.visible === false) {
      console.warn("has been un visible");
      return;
    }
    for (let i = 0; i < this.subViews.length; i += 1) {
      const view = this.subViews[i];
      // 子视图先隐藏
      view.hide(options);
    }
    this.emit(Events.BeforeHide);
    this.$presence.hide(options);
  }
  /** 视图在页面上展示（变为可见） */
  setShow() {
    console.log("[DOMAIN]route_view/index - showed", this.title, this._showed);
    if (this._showed) {
      return;
    }
    this._showed = true;
    // console.log("[ROUTE_VIEW]emit showed", this._name);
    this.emit(Events.Show);
  }
  /** 视图在页面上隐藏（变为不可见） */
  setHidden() {
    console.log("[DOMAIN]route_view/index - hidden", this.title, this._showed);
    this._showed = false;
    this.emit(Events.Hidden);
  }
  mount() {
    this.setMounted();
  }
  /** 卸载自身 */
  unmount() {
    // console.log("[DOMAIN]route_view - unmount", this.title);
    // this.onHidden(() => {
    //   this.destroy();
    //   this.setUnmounted();
    // });
    // this.hide();
  }
  /** 视图被装载到页面 */
  setMounted() {
    if (this.mounted) {
      return;
    }
    this.mounted = true;
    this.emit(Events.Mounted);
  }
  /** 视图从页面被卸载 */
  setUnmounted() {
    this.mounted = false;
    this.emit(Events.Unmounted);
  }
  /** 页面组件已加载 */
  setLoaded() {
    this.loaded = true;
  }
  /** 页面组件未加载 */
  setUnload() {
    this.loaded = false;
  }
  buildUrl(query: Record<string, string | number>) {
    const url = buildUrl(this.pathname, this.params, query);
    return url;
  }
  buildUrlWithPrefix(query: Record<string, string | number>) {
    const url = buildUrl(this.pathname, this.params, query);
    return [NavigatorCore.prefix, url].join("");
  }

  onStart(handler: Handler<TheTypesOfEvents[Events.Start]>) {
    return this.on(Events.Start, handler);
  }
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onViewShow(handler: Handler<TheTypesOfEvents[Events.ViewShow]>) {
    return this.on(Events.ViewShow, handler);
  }
  onBeforeShow(handler: Handler<TheTypesOfEvents[Events.BeforeShow]>) {
    return this.on(Events.BeforeShow, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onBeforeHide(handler: Handler<TheTypesOfEvents[Events.BeforeHide]>) {
    return this.on(Events.BeforeHide, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onLayered(handler: Handler<TheTypesOfEvents[Events.Layered]>) {
    return this.on(Events.Layered, handler);
  }
  onUncover(handler: Handler<TheTypesOfEvents[Events.Uncover]>) {
    return this.on(Events.Uncover, handler);
  }
  onUnmounted(handler: Handler<TheTypesOfEvents[Events.Unmounted]>) {
    return this.on(Events.Unmounted, handler);
  }
  onSubViewsChange(handler: Handler<TheTypesOfEvents[Events.ViewsChange]>) {
    return this.on(Events.ViewsChange, handler);
  }
  onCurViewChange(handler: Handler<TheTypesOfEvents[Events.CurViewChange]>) {
    return this.on(Events.CurViewChange, handler);
  }
  onMatched(handler: Handler<TheTypesOfEvents[Events.Match]>) {
    return this.on(Events.Match, handler);
  }
  onNotFound(handler: Handler<TheTypesOfEvents[Events.NotFound]>) {
    return this.on(Events.NotFound, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
// type ParamConfigure = {
//   name: string;
//   prefix: string;
//   suffix: string;
//   pattern: string;
//   modifier: string;
// };
// function buildParams(opt: { regexp: RegExp; targetPath: string; keys: ParamConfigure[] }) {
//   const { regexp, keys, targetPath } = opt;
//   const match = regexp.exec(targetPath);
//   if (match) {
//     const params: Record<string, string> = {};
//     for (let i = 1; i < match.length; i++) {
//       params[keys[i - 1].name] = match[i];
//     }
//     return params;
//   }
//   return {};
// }
// function buildQuery(path: string) {
//   const [, search] = path.split("?");
//   if (!search) {
//     return {} as Record<string, string>;
//   }
//   return qs.parse(search) as Record<string, string>;
// }

let handler: ((views: RouteViewCore) => void) | null = null;
export function onViewCreated(fn: (views: RouteViewCore) => void) {
  handler = fn;
}
function emitViewCreated(view: RouteViewCore) {
  if (!handler) {
    return;
  }
  handler(view);
}
