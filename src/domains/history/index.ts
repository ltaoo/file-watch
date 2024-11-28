import { BaseDomain, Handler } from "@/domains/base";
import { RouteViewCore } from "@/domains/route_view";
import { NavigatorCore } from "@/domains/navigator";
// import { PathnameKey, RouteConfig } from "@/types";
import { query_stringify } from "@/utils";

enum Events {
  TopViewChange,
  RouteChange,
  ClickLink,
  Back,
  Forward,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.TopViewChange]: RouteViewCore;
  [Events.ClickLink]: {
    href: string;
    target: string | null;
  };
  [Events.Back]: void;
  [Events.Forward]: void;
  [Events.RouteChange]: {
    view: RouteViewCore;
    name: string;
    href: string;
    pathname: string;
    query: Record<string, string>;
    reason: "back" | "forward" | "push" | "replace";
    /** 调用方希望忽略这次 route change */
    ignore?: boolean;
  };
  [Events.StateChange]: HistoryCoreState;
};

type HistoryCoreProps<K extends string, R extends Record<string, any>> = {
  view: RouteViewCore;
  router: NavigatorCore;
  routes: Record<K, R>;
  views: Record<K, RouteViewCore>;
  /** 是否采用虚拟路由（不改变浏览器历史） */
  virtual?: boolean;
};
type HistoryCoreState = {
  href: string;
  stacks: {
    id: string;
    key: string;
    title: string;
    visible: boolean;
    query: string;
  }[];
  cursor: number;
};

export class HistoryCore<K extends string, R extends Record<string, any>> extends BaseDomain<TheTypesOfEvents> {
  virtual = false;

  /** 路由配置 */
  routes: Record<K, R>;
  /** 加载的所有视图 */
  views: Record<string, RouteViewCore>;
  /** 按顺序依次 push 的视图 */
  stacks: RouteViewCore[] = [];
  /** 栈指针 */
  cursor: number = -1;

  /** 浏览器 url 管理 */
  $router: NavigatorCore;
  /** 根视图 */
  $view: RouteViewCore;

  get state(): HistoryCoreState {
    return {
      href: this.$router.href,
      stacks: this.stacks.map((view) => {
        const { id, pathname: key, title, query, visible } = view;
        return {
          // id: String(id),
          id: [key, query_stringify(query)].filter(Boolean).join("?"),
          key,
          title,
          query: JSON.stringify(query, null, 2),
          visible,
        };
      }),
      cursor: this.cursor,
    };
  }

  constructor(props: Partial<{ _name: string }> & HistoryCoreProps<K, R>) {
    super(props);

    const { virtual = false, view, router, routes, views } = props;

    this.$view = view;
    this.$router = router;
    this.routes = routes;
    this.views = views;
    this.virtual = virtual;
  }

  push(
    name: K,
    query: Record<string, string> = {},
    options: Partial<{
      /** 不变更 history stack */
      ignore: boolean;
    }> = {}
  ) {
    // console.log("-----------");
    // console.log("[DOMAIN]history/index - push target url is", name, "and cur href is", this.$router.href);
    const { ignore } = options;
    if (this.isLayout(name)) {
      console.log("[DOMAIN]history/index - the target url is layout", name);
      return;
    }
    const route1 = this.routes[name];
    if (!route1) {
      console.log("[DOMAIN]history/index - push 2. no matched route", name);
      return;
    }
    const uniqueKey = [route1.pathname, query_stringify(query)].filter(Boolean).join("?");
    if (uniqueKey === this.$router.href) {
      // console.log("[DOMAIN]history/index - push target url is", uniqueKey, "and cur href is", this.$router.href);
      return;
    }
    const view = this.views[uniqueKey];
    if (view) {
      this.ensureParent(view);
      view.query = query;
      if (!view.parent) {
        console.log("[DOMAIN]history/index - error1");
        return;
      }
      this.$router.href = view.href;
      this.$router.name = view.name;
      // const viewAfter = this.stacks.slice(this.cursor + 1);
      // for (let i = 0; i < viewAfter.length; i += 1) {
      //   const v = viewAfter[i];
      //   v.parent?.removeView(v, {
      //     reason: "show_sibling",
      //     callback: () => {
      //       delete this.views[v.href];
      //     },
      //   });
      // }
      this.stacks = this.stacks.slice(0, this.cursor + 1).concat(view);
      this.cursor += 1;
      view.parent.showView(view, { reason: "show_sibling", destroy: false });
      this.emit(Events.RouteChange, {
        reason: "push",
        view,
        name,
        href: view.href,
        pathname: view.pathname,
        query: view.query,
        ignore,
      });
      // this.emit(Events.TopViewChange, view);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    const route = (() => {
      const m = this.routes[name];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - push 2. no matched route", uniqueKey);
      return null;
    }
    const created = new RouteViewCore({
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      animation: route.options?.animation,
      parent: null,
    });
    // created.onUnmounted(() => {
    //   this.stacks = this.stacks.filter((s) => s.key !== created.key);
    //   delete this.views[uniqueKey];
    // });
    this.views[uniqueKey] = created;
    this.ensureParent(created);
    if (!created.parent) {
      console.log("[DOMAIN]history/index - push 3. ", route.name);
      return;
    }
    this.$router.href = created.href;
    this.$router.name = created.name;
    // const viewsAfter = this.stacks.slice(this.cursor);
    // for (let i = 0; i < viewsAfter.length; i += 1) {
    //   const v = viewsAfter[i];
    //   v.hide();
    // }
    this.stacks = this.stacks.slice(0, this.cursor + 1).concat(created);
    this.cursor += 1;
    created.parent.showView(created, { reason: "show_sibling", destroy: false });
    this.emit(Events.RouteChange, {
      reason: "push",
      view: created,
      name,
      href: created.href,
      pathname: created.pathname,
      query: created.query,
      ignore,
    });
    // this.emit(Events.TopViewChange, created);
    this.emit(Events.StateChange, { ...this.state });
  }
  replace(name: K, query: Record<string, string> = {}) {
    const uniqueKey = [name, query_stringify(query)].filter(Boolean).join("?");
    if (uniqueKey === this.$router.href) {
      console.log("[DOMAIN]history/index - replace target url is", uniqueKey, "and cur href is", this.$router.href);
      return;
    }
    const view = this.views[uniqueKey];
    if (view) {
      this.ensureParent(view);
      view.query = query;
      if (!view.parent) {
        console.log("[DOMAIN]history/index - replace 1");
        return;
      }
      this.$router.href = view.href;
      this.$router.name = view.name;
      const theViewNeedDestroy = this.stacks[this.stacks.length - 1];
      if (theViewNeedDestroy) {
        theViewNeedDestroy.parent?.removeView(theViewNeedDestroy);
      }
      this.stacks[this.stacks.length - 1] = view;
      // this.cursor = uniqueKey;
      view.parent.showView(view);
      this.emit(Events.RouteChange, {
        reason: "replace",
        view,
        name: view.name,
        href: view.href,
        pathname: view.pathname,
        query: view.query,
      });
      // this.emit(Events.TopViewChange, view);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    const route = (() => {
      const m = this.routes[name];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - replace 2. no matched route");
      return null;
    }
    const created = new RouteViewCore({
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      animation: route.options?.animation,
      parent: null,
    });
    this.views[uniqueKey] = created;
    this.ensureParent(created);
    if (!created.parent) {
      console.log("[DOMAIN]history/index - replace 3. ");
      return;
    }
    this.$router.href = created.href;
    this.$router.name = created.name;
    const theViewNeedDestroy = this.stacks[this.stacks.length - 1];
    if (theViewNeedDestroy) {
      theViewNeedDestroy.parent?.removeView(theViewNeedDestroy, {
        reason: "show_sibling",
        callback: () => {
          delete this.views[uniqueKey];
        },
      });
    }
    this.stacks[this.stacks.length - 1] = created;
    created.parent.showView(created);
    this.emit(Events.RouteChange, {
      reason: "replace",
      view: created,
      name: created.name,
      href: created.href,
      pathname: created.pathname,
      query: created.query,
    });
    // this.emit(Events.TopViewChange, created);
    this.emit(Events.StateChange, { ...this.state });
  }
  realBack() {
    const targetCursor = this.cursor - 1;
    const viewPrepareShow = this.stacks[targetCursor];
    // console.log("[DOMAIN]history - back", this.cursor, targetCursor, viewPrepareShow);
    if (!viewPrepareShow) {
      // this.$view.showView(this.$view.subViews[0]);
      return;
    }
    const href = viewPrepareShow.href;
    if (!viewPrepareShow.parent) {
      // this.$view.showView(this.$view.subViews[0]);
      return;
    }
    this.$router.href = href;
    this.$router.name = viewPrepareShow.name;
    this.cursor = targetCursor;
    const viewsAfter = this.stacks.slice(targetCursor + 1);
    // console.log("[DOMAIN]history - back before viewsAfter.length", viewsAfter);
    for (let i = 0; i < viewsAfter.length; i += 1) {
      const v = viewsAfter[i];
      // console.log("[DOMAIN]history - back before removeView", v.parent?.title, v.title);
      v.parent?.removeView(v, {
        reason: "back",
        destroy: true,
        callback: () => {
          delete this.views[v.href];
        },
      });
    }
    viewPrepareShow.parent.showView(viewPrepareShow, { reason: "back", destroy: true });
    this.emit(Events.RouteChange, {
      reason: "back",
      view: viewPrepareShow,
      name: viewPrepareShow.name,
      href: viewPrepareShow.href,
      pathname: viewPrepareShow.pathname,
      query: viewPrepareShow.query,
    });
    this.emit(Events.Back);
    this.emit(Events.StateChange, { ...this.state });
  }
  back() {
    console.log("请实现 back 方法");
  }
  forward() {
    const targetCursor = this.cursor + 1;
    const viewPrepareShow = this.stacks[targetCursor];
    if (!viewPrepareShow) {
      return;
    }
    if (!viewPrepareShow.parent) {
      return;
    }
    const href = viewPrepareShow.href;
    this.$router.href = href;
    this.$router.name = viewPrepareShow.name;
    this.cursor = targetCursor;
    const viewsAfter = this.stacks.slice(targetCursor + 1);
    for (let i = 0; i < viewsAfter.length; i += 1) {
      const v = viewsAfter[i];
      v.parent?.removeView(v, {
        reason: "forward",
        callback: () => {
          delete this.views[v.href];
        },
      });
    }
    viewPrepareShow.parent.showView(viewPrepareShow);
    this.emit(Events.RouteChange, {
      reason: "forward",
      view: viewPrepareShow,
      name: viewPrepareShow.name,
      href: viewPrepareShow.href,
      pathname: viewPrepareShow.pathname,
      query: viewPrepareShow.query,
    });
    // this.emit(Events.TopViewChange, viewPrepareShow);
    this.emit(Events.Forward);
    this.emit(Events.StateChange, { ...this.state });
  }
  reload() {
    // 销毁再初始化？
  }
  ensureParent(view: RouteViewCore) {
    const { name } = view;
    if (view.parent) {
      if (view.parent.pathname === "/") {
        return;
      }
      this.ensureParent(view.parent);
      return;
    }
    const route = this.routes[name as K];
    if (!route) {
      return;
    }
    const { parent } = route;
    if (this.views[parent.name]) {
      view.parent = this.views[parent.name];
      if (parent.name === "root") {
        return;
      }
      this.ensureParent(this.views[parent.name]);
      return;
    }
    const parent_route = this.routes[parent.name as K];
    if (!parent_route) {
      return null;
    }
    const created_parent = new RouteViewCore({
      name: parent_route.name,
      pathname: parent_route.pathname,
      title: parent_route.title,
      parent: null,
    });
    this.views[parent_route.name] = created_parent;
    view.parent = created_parent;
    this.ensureParent(created_parent);
  }
  buildURL(name: K, query: Record<string, string> = {}) {
    const route = (() => {
      const m = this.routes[name];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - push 2. no matched route", name);
      return this.routes["root.notfound" as K]!.pathname as string;
    }
    const created = new RouteViewCore({
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      parent: null,
    });
    return created.buildUrl(query);
  }
  buildURLWithPrefix(name: K, query: Record<string, string> = {}) {
    const route = (() => {
      const m = this.routes[name];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - push 2. no matched route", name);
      return this.routes["root.notfound" as K]!.pathname as string;
    }
    const created = new RouteViewCore({
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      parent: null,
    });
    return created.buildUrlWithPrefix(query);
  }
  isLayout(name: K) {
    const route = this.routes[name];
    if (!route) {
      return null;
    }
    return route.layout;
  }
  handleClickLink(params: { href: string; target: null | string }) {
    const { href, target } = params;
    this.emit(Events.ClickLink, { href, target });
  }

  onTopViewChange(handler: Handler<TheTypesOfEvents[Events.TopViewChange]>) {
    return this.on(Events.TopViewChange, handler);
  }
  onRouteChange(handler: Handler<TheTypesOfEvents[Events.RouteChange]>) {
    return this.on(Events.RouteChange, handler);
  }
  onBack(handler: Handler<TheTypesOfEvents[Events.Back]>) {
    return this.on(Events.Back, handler);
  }
  onForward(handler: Handler<TheTypesOfEvents[Events.Forward]>) {
    return this.on(Events.Forward, handler);
  }
  onClickLink(handler: Handler<TheTypesOfEvents[Events.ClickLink]>) {
    return this.on(Events.ClickLink, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
