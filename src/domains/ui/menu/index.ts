/**
 * @file 菜单 组件
 */
import { BaseDomain, Handler } from "@/domains/base";
import { PopperCore, Side, Align } from "@/domains/ui/popper";
import { DismissableLayerCore } from "@/domains/ui/dismissable-layer";
import { PresenceCore } from "@/domains/ui/presence";
import { Direction } from "@/domains/ui/direction";

import { MenuItemCore } from "./item";

enum Events {
  Show,
  Hidden,
  EnterItem,
  LeaveItem,
  EnterMenu,
  LeaveMenu,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.EnterItem]: MenuItemCore;
  [Events.LeaveItem]: MenuItemCore;
  [Events.EnterMenu]: void;
  [Events.LeaveMenu]: void;
  [Events.StateChange]: MenuState;
};
type MenuState = {
  open: boolean;
  items: MenuItemCore[];
};
type MenuProps = {
  side: Side;
  align: Align;
  strategy: "fixed" | "absolute";
  items: MenuItemCore[];
};

export class MenuCore extends BaseDomain<TheTypesOfEvents> {
  _name = "MenuCore";
  debug = true;

  popper: PopperCore;
  presence: PresenceCore;
  layer: DismissableLayerCore;

  openTimer: NodeJS.Timeout | null = null;
  state: MenuState = {
    open: false,
    items: [],
  };

  constructor(
    options: Partial<
      {
        _name: string;
      } & MenuProps
    > = {}
  ) {
    super(options);
    const { _name, items = [], side, align, strategy } = options;
    if (_name) {
      this._name = _name;
    }
    this.state.items = items;
    this.items = items;

    this.popper = new PopperCore({
      side,
      align,
      strategy,
      _name: _name ? `${_name}__popper` : "menu__popper",
    });
    this.presence = new PresenceCore();
    this.layer = new DismissableLayerCore();

    this.listenItems(items);

    this.popper.onEnter(() => {
      this.emit(Events.EnterMenu);
    });
    this.popper.onLeave(() => {
      this.emit(Events.LeaveMenu);
    });
    this.layer.onDismiss(() => {
      // console.log("[DOMAIN/ui]menu/index - hide");
      console.log("[]MenuCore - this.layer.onDismiss");
      this.hide();
    });
    this.presence.onHidden(() => {
      // console.log("this.presence.onHidden", this.items.length);
      this.reset();
      if (this.curSub) {
        this.curSub.hide();
      }
    });
  }

  subs: MenuCore[] = [];
  items: MenuItemCore[] = [];
  curSub: MenuCore | null = null;
  curItem: MenuItemCore | null = null;
  inside = false;
  /** 鼠标是否处于子菜单中 */
  inSubMenu = false;
  /** 鼠标离开 item 时，可能要隐藏子菜单，但是如果从有子菜单的 item 离开前往子菜单，就不用隐藏 */
  maybeHideSub = false;
  hideSubTimer: NodeJS.Timeout | null = null;

  toggle() {
    const { open } = this.state;
    // this.log("toggle", open);
    if (open) {
      this.hide();
      return;
    }
    this.show();
  }
  show() {
    this.presence.show();
    this.popper.place();
    this.emit(Events.Show);
    // this.emit(Events.StateChange, { ...this.state });
  }
  hide() {
    console.log("[DOMAIN/ui]menu/index - hide");
    // this.log("hide");
    this.presence.hide();
    this.emit(Events.Hidden);
    this.emit(Events.StateChange, { ...this.state });
  }
  listenItems(items: MenuItemCore[]) {
    // this.log("listen items", items);
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      item.onEnter(() => {
        // this.log("item.onEnter", this.inside, this.curSub?.inside);
        this.maybeHideSub = false;
        if (item.menu) {
          this.maybeHideSub = false;
          const subMenu = item.menu;
          subMenu.show();
        }
        if (!item.menu && this.curSub) {
          this.curSub.hide();
        }
        this.emit(Events.EnterItem, item);
      });
      item.onLeave(() => {
        this.maybeHideSub = true;
        this.emit(Events.LeaveItem, item);
        // this.log("item.onLeave", this.items.length);
        if (this.hideSubTimer !== null) {
          clearInterval(this.hideSubTimer);
          this.hideSubTimer = setTimeout(() => {
            this.checkNeedHideSubMenu(item);
          }, 100);
          return;
        }
        this.hideSubTimer = setTimeout(() => {
          this.checkNeedHideSubMenu(item);
        }, 100);
      });
      if (!item.menu) {
        continue;
      }
      const subMenu = item.menu;
      subMenu.onShow(() => {
        this.log("sub.onShow");
        this.curSub = subMenu;
      });
      subMenu.onEnter(() => {
        this.log("sub.onEnter");
        this.inSubMenu = true;
      });
      subMenu.onLeave(() => {
        this.log("sub.onLeave");
        this.inSubMenu = false;
      });
      subMenu.onHide(() => {
        this.log("sub.onHide");
        this.curSub = null;
      });
      if (this.subs.includes(subMenu)) {
        return;
      }
      this.subs.push(subMenu);
    }
  }
  setItems(items: MenuItemCore[]) {
    this.log("set items", items);
    this.state.items = items;
    this.items = items;
    this.listenItems(items);
    this.emit(Events.StateChange, {
      ...this.state,
    });
  }
  checkNeedHideSubMenu(item: MenuItemCore) {
    if (this.hideSubTimer) {
      clearTimeout(this.hideSubTimer);
    }
    this.hideSubTimer = null;
    if (this.maybeHideSub === false) {
      return;
    }
    // this.log("leaveMenu check need hide subMenu", this.curSub, this.inSubMenu);
    // this.emit(Events.LeaveMenu);
    // 直接从有 SubMenu 的 MenuItem 离开，不到其他 MenuItem 场景下，也要关闭 SubMenu
    if (this.curSub && !this.inSubMenu) {
      this.curSub.hide();
    }
  }
  reset() {
    // console.log("[]MenuCore - reset", this.items);
    this.inSubMenu = false;
    this.curItem = null;
    this.curSub = null;
    this.maybeHideSub = false;
    this.hideSubTimer = null;
    this.presence.reset();
    this.popper.reset();
    for (let i = 0; i < this.items.length; i += 1) {
      this.items[i].reset();
    }
  }
  unmount() {
    // this.log("destroy", this.name);
    super.destroy();
    this.layer.destroy();
    this.popper.destroy();
    this.presence.unmount();
    for (let i = 0; i < this.subs.length; i += 1) {
      this.subs[i].unmount();
    }
    for (let i = 0; i < this.items.length; i += 1) {
      this.items[i].unmount();
    }
    this.reset();
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onEnterItem(handler: Handler<TheTypesOfEvents[Events.EnterItem]>) {
    return this.on(Events.EnterItem, handler);
  }
  onLeaveItem(handler: Handler<TheTypesOfEvents[Events.LeaveItem]>) {
    return this.on(Events.LeaveItem, handler);
  }
  onEnter(handler: Handler<TheTypesOfEvents[Events.EnterMenu]>) {
    return this.on(Events.EnterMenu, handler);
  }
  onLeave(handler: Handler<TheTypesOfEvents[Events.LeaveMenu]>) {
    return this.on(Events.LeaveMenu, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Menu";
  }
}

const SELECTION_KEYS = ["Enter", " "];
const FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
const LAST_KEYS = ["ArrowUp", "PageDown", "End"];
const FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
const SUB_OPEN_KEYS: Record<Direction, string[]> = {
  ltr: [...SELECTION_KEYS, "ArrowRight"],
  rtl: [...SELECTION_KEYS, "ArrowLeft"],
};
const SUB_CLOSE_KEYS: Record<Direction, string[]> = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"],
};
