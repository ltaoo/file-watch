import { BaseDomain, Handler } from "@/domains/base";
import { MenuCore } from "@/domains/ui/menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { Side } from "@/domains/ui/popper/types";
import { Align } from "@/domains/ui/popper";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: DropdownMenuState;
};
type DropdownMenuProps = {
  side?: Side;
  align?: Align;
  items?: MenuItemCore[];
  onHidden?: () => void;
};
type DropdownMenuState = {
  items: MenuItemCore[];
  open: boolean;
  disabled: boolean;
};
export class DropdownMenuCore extends BaseDomain<TheTypesOfEvents> {
  open = false;
  disabled = false;

  get state(): DropdownMenuState {
    return {
      items: this.items,
      open: this.open,
      disabled: this.disabled,
    };
  }

  menu: MenuCore;
  subs: MenuCore[] = [];
  items: MenuItemCore[] = [];

  constructor(
    props: {
      _name?: string;
    } & DropdownMenuProps = {}
  ) {
    super(props);

    const { _name, side, align, items = [], onHidden } = props;
    this.items = items;
    this.menu = new MenuCore({ side, align, items, _name: _name ? `${_name}__menu` : "menu-in-dropdown" });
    this.menu.onHide(() => {
      this.menu.reset();
      if (onHidden) {
        onHidden();
      }
    });
  }

  listenItems(items: MenuItemCore[]) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      // console.log(item);
      // item.onEnter(() => {
      //   this.maybeLeave = false;
      //   this.inside = true;
      //   if (item.menu) {
      //     this.maybeLeave = false;
      //     item.menu.show();
      //   }
      //   if (!item.menu && this.curSub) {
      //     this.curSub.hide();
      //   }
      //   this.emit(Events.EnterItem, item);
      // });
      // item.onLeave(() => {
      //   this.maybeLeave = true;
      //   this.emit(Events.LeaveItem, item);
      //   this.log("item.onLeave", this.items.length);
      //   if (this.leaveTimer !== null) {
      //     clearInterval(this.leaveTimer);
      //     this.leaveTimer = setTimeout(() => {
      //       this.leaveMenu(item);
      //     }, 100);
      //     return;
      //   }
      //   this.leaveTimer = setTimeout(() => {
      //     this.leaveMenu(item);
      //   }, 100);
      // });
      // if (!item.menu) {
      //   continue;
      // }
      // const sub = item.menu;
      // if (this.subs.includes(sub)) {
      //   return;
      // }
      // sub.onShow(() => {
      //   this.log("sub.onShow");
      //   this.curSub = sub;
      // });
      // sub.onEnter(() => {
      //   this.log("sub.onEnter");
      //   this.inSubMenu = true;
      // });
      // sub.onLeave(() => {
      //   this.log("sub.onLeave");
      //   this.inSubMenu = false;
      // });
      // sub.onHide(() => {
      //   this.log("sub.onHide");
      //   this.curSub = null;
      // });
      // this.subs.push(sub);
    }
  }
  setItems(items: MenuItemCore[]) {
    this.items = items;
    this.emit(Events.StateChange, {
      ...this.state,
    });
  }
  toggle(position?: Partial<{ x: number; y: number }>) {
    if (position) {
      const { x, y } = position;
      this.menu.popper.updateReference({
        // @ts-ignore
        getRect() {
          return {
            width: 8,
            height: 8,
            x,
            y,
          };
        },
      });
    }
    this.menu.toggle();
  }
  hide() {
    console.log('[DOMAIN/ui]dropdown-menu/index - hide');
    this.menu.hide();
  }
  unmount() {
    super.destroy();
    this.menu.unmount();
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
