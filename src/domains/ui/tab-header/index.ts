import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
  Scroll,
  LinePositionChange,
  Mounted,
  Change,
}
type TheTypesOfEvents<T extends { key: any; options: { id: any; text: string }[] }> = {
  [Events.StateChange]: TabHeaderState<T>;
  [Events.Scroll]: { left: number };
  [Events.LinePositionChange]: { left: number };
  [Events.Mounted]: void;
  [Events.Change]: T["options"][number] & { index: number };
};
type TabHeaderState<T extends { key: any; options: { id: any; text: string }[] }> = {
  tabs: T["options"];
  current: number | null;
  left: number | null;
  curId: string | null;
};
type TabHeaderProps<T extends { key: any; options: { id: any; text: string }[] }> = {
  key?: T["key"];
  options: T["options"];
  defaultTab?: string;
  targetLeftWhenSelected?: number;
  onChange?: (value: T["options"][number] & { index: number }) => void;
  onMounted?: () => void;
};

export class TabHeaderCore<
  T extends { key: any; options: { id: any; text: string; [x: string]: any }[] }
> extends BaseDomain<TheTypesOfEvents<T>> {
  key: T["key"];
  tabs: T["options"] = [];
  defaultTab?: string;
  count = 0;
  mounted = false;
  /** 已经加载到页面中的 Tab */
  extra: Record<
    string,
    {
      rect: () => { width: number; height: number; left: number };
    }
  > = {};
  current: number | null = null;
  left: number | null = null;
  /** 父容器宽高等信息 */
  container = {
    width: 0,
    left: 0,
    scrollLeft: 0,
  };
  /** 当 checkbox 选中时，希望它距离父容器 left 距离。如小于 1，则视为百分比，如 0.5 即中间位置 */
  targetLeftWhenSelected: null | number = null;

  get selectedTabId() {
    if (this.current === null) {
      return null;
    }
    const matched = this.tabs[this.current];
    if (!matched) {
      if (this.tabs.length) {
        return this.tabs[0].id;
      }
      return null;
    }
    return matched.id ?? null;
  }
  get selectedTab() {
    if (this.current === null) {
      return null;
    }
    return this.tabs[this.current];
  }
  get state(): TabHeaderState<T> {
    return {
      tabs: this.tabs,
      curId: this.selectedTabId,
      current: this.current,
      left: this.targetLeftWhenSelected,
    };
  }

  constructor(props: Partial<{ _name: string }> & TabHeaderProps<T>) {
    super(props);

    const { key = "id", defaultTab, options, targetLeftWhenSelected = 0, onChange, onMounted } = props;
    this.key = key;
    this.targetLeftWhenSelected = targetLeftWhenSelected;
    this.tabs = options;
    if (defaultTab) {
      this.defaultTab = defaultTab;
    }
    if (onChange) {
      this.onChange(onChange);
    }
    if (onMounted) {
      this.onMounted(onMounted);
    }
  }
  setTabs(options: T["options"]) {
    if (options.length === 0) {
      return;
    }
    this.tabs = options;
    for (let i = 0; i < options.length; i += 1) {
      const { id } = options[i];
      this.extra[id] = {
        rect() {
          return {
            left: 0,
            width: 0,
            height: 0,
          };
        },
      };
    }
  }
  select(index: number) {
    const matchedTab = this.tabs[index] as unknown as T["options"][number];
    // console.log("[DOMAIN]tab-header - select", index, matchedTab, this.tabs);
    if (!matchedTab) {
      return;
    }
    this.current = index;
    const left = this.calcLineLeft(this.current);
    // console.log("[DOMAIN]tab-header - after this.calcLineLeft(this.current)", left);
    if (left !== null) {
      this.left = left;
      this.changeLinePosition(left);
    }
    this.emit(Events.Change, { ...matchedTab, index });
    this.emit(Events.StateChange, { ...this.state });
  }
  pendingAction: null | {
    id: T["options"][number]["id"];
    options: Partial<{ ignore: boolean }>;
  } = null;
  selectById(id: T["options"][number]["id"], options: Partial<{ ignore: boolean }> = {}) {
    console.log("[DOMAIN]ui/tab-header - select by id", id, this.extra, this.mounted);
    if (!this.mounted) {
      this.pendingAction = {
        id,
        options,
      };
      return;
    }
    const { ignore } = options;
    const matchedIndex = this.tabs.findIndex((t) => t.id === id);
    if (matchedIndex === -1) {
      return;
    }
    const matched = this.tabs[matchedIndex];
    if (!matched) {
      return;
    }
    this.current = matchedIndex;
    const left = this.calcLineLeft(this.current);
    // console.log("[DOMAIN]tab-header/index selectById", this.current, this.selectedTab, left);
    if (left !== null) {
      this.changeLinePosition(left);
    }
    this.emit(Events.StateChange, { ...this.state });
    if (!ignore) {
      this.emit(Events.Change, {
        ...matched,
        index: matchedIndex,
      });
    }
  }
  handleChangeById(id: string) {
    const matchedIndex = this.tabs.findIndex((t) => t.id === id);
    if (matchedIndex === -1) {
      return;
    }
    this.current = matchedIndex;
    // console.log("[DOMAIN]tab-header/index selectById", this.current, this.selectedTab);
    const left = this.calcLineLeft(this.current);
    // console.log("[DOMAIN]tab-header/index handleChangeById", this.current, this.selectedTab, left);
    if (left !== null) {
      this.changeLinePosition(left);
    }
  }
  /** 计算下划线的位置 */
  calcLineLeft(index: number) {
    const matchedTab = this.tabs[index];
    if (!matchedTab) {
      return null;
    }
    const client = this.extra[matchedTab.id].rect();
    // console.log("[DOMAIN]ui/tab-header/index - calcLineLeft", this.extra, client);
    return client.left + client.width / 2;
  }
  updateTabClient(index: number, info: { rect: () => { width: number; height: number; left: number } }) {
    const matchedTab = this.tabs[index];
    console.log("[DOMAIN]ui/tab-headers - updateTabClient findMatchedTab", index, matchedTab);
    if (!matchedTab) {
      return;
    }
    this.extra[matchedTab.id] = info;
    // console.log("[DOMAIN]ui/tab-headers", index, this.extra, this.tabs.length);
    if (Object.keys(this.extra).length !== this.tabs.length) {
      return;
    }
    // if (this.current === null) {
    //   return;
    // }
    this.mounted = true;
    this.emit(Events.Mounted);
    (() => {
      if (this.pendingAction) {
        this.selectById(this.pendingAction.id, this.pendingAction.options);
        this.pendingAction = null;
        return;
      }
      if (this.defaultTab) {
        this.selectById(this.defaultTab);
        this.pendingAction = null;
        return;
      }
      const left = this.calcLineLeft(0);
      if (left !== null) {
        this.changeLinePosition(left);
      }
    })();
  }
  changeLinePosition(left: number) {
    this.emit(Events.LinePositionChange, { left });
  }
  updateTabClientById(id: string, info: { rect: () => { width: number; height: number; left: number } }) {
    const matchedTabIndex = this.tabs.findIndex((t) => t.id === id);
    if (matchedTabIndex === -1) {
      return;
    }
    const matchedTab = this.tabs[matchedTabIndex];
    this.extra[matchedTab.id] = info;
  }
  updateContainerClient(info: { width: number; height: number; left: number }) {
    // console.log('[]setContainer', info);
    this.container = {
      ...this.container,
      ...info,
    };
    // this.emit(Events.Mounted);
  }
  calcScrollLeft(curTab: TabHeaderCore<T>["selectedTab"]) {
    const { width, left } = this.container;
    // console.log("[]calcScrollLeft", this.container, curTab);
    if (curTab === null) {
      return;
    }
    const client = this.extra[curTab.id].rect();
    const theTabMiddle = client.left + client.width / 2;
    const realTargetPosition = (() => {
      if (this.targetLeftWhenSelected === null) {
        return 0;
      }
      if (this.targetLeftWhenSelected <= 1) {
        return this.targetLeftWhenSelected * width;
      }
      return this.targetLeftWhenSelected;
    })();
    if (theTabMiddle <= realTargetPosition) {
      this.container.scrollLeft = 0;
      this.emit(Events.Scroll, {
        left: 0,
      });
      return;
    }
    const theLeftNeedScroll = theTabMiddle - left - realTargetPosition;
    this.container.scrollLeft = theLeftNeedScroll;
    // @todo 需要移动的距离太小了，就忽略
    // @todo 当移动的 tab 偏右侧，已经没有可以移动的空间了，也忽略
    // console.log("[]calcScrollLeft - need move", theLeftNeedScroll);
    this.emit(Events.Scroll, {
      left: theLeftNeedScroll,
    });
  }

  onScroll(handler: Handler<TheTypesOfEvents<T>[Events.Scroll]>) {
    return this.on(Events.Scroll, handler);
  }
  onLinePositionChange(handler: Handler<TheTypesOfEvents<T>[Events.LinePositionChange]>) {
    return this.on(Events.LinePositionChange, handler);
  }
  onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents<T>[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
