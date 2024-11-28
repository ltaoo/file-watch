import { BaseDomain, Handler } from "@/domains/base";
import { RefCore } from "@/domains/cur";

enum Events {
  Click,
  StateChange,
}
type TheTypesOfEvents<T = unknown> = {
  [Events.Click]: T | null;
  [Events.StateChange]: ButtonState;
};
type ButtonState = {
  text: string;
  loading: boolean;
  disabled: boolean;
};
type ButtonProps<T = unknown> = {
  onClick: (record: T | null) => void;
};
export class ButtonCore<T = unknown> extends BaseDomain<TheTypesOfEvents<T>> {
  id = this.uid();
  cur: RefCore<T>;

  state: ButtonState = {
    text: "Click it",
    loading: false,
    disabled: false,
  };

  constructor(options: Partial<{ _name: string } & ButtonProps<T>> = {}) {
    super(options);

    this.cur = new RefCore();
    const { onClick } = options;
    if (onClick) {
      this.onClick(() => {
        onClick(this.cur.value);
      });
    }
  }
  /** 触发一次按钮点击事件 */
  click() {
    // console.log("click", this.state.loading, this.state.disabled);
    if (this.state.loading) {
      return;
    }
    if (this.state.disabled) {
      return;
    }
    this.emit(Events.Click);
  }
  /** 禁用当前按钮 */
  disable() {
    this.state.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 恢复按钮可用 */
  enable() {
    this.state.disabled = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 当按钮处于列表中时，使用该方法保存所在列表记录 */
  bind(v: T) {
    this.cur.select(v);
    return this;
  }
  setLoading(loading: boolean) {
    if (this.state.loading === loading) {
      return;
    }
    this.state.loading = loading;
    this.emit(Events.StateChange, { ...this.state });
  }

  onClick(handler: Handler<TheTypesOfEvents<T>[Events.Click]>) {
    this.on(Events.Click, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}

type ButtonInListProps<T = unknown> = {
  onClick: (record: T) => void;
};

type TheTypesInListOfEvents<T> = {
  [Events.Click]: T;
  [Events.StateChange]: ButtonState;
};

export class ButtonInListCore<T> extends BaseDomain<TheTypesInListOfEvents<T>> {
  /** 列表中一类多个按钮 */
  btns: ButtonCore<T>[] = [];
  /** 按钮点击后，该值被设置为触发点击的那个按钮 */
  cur: ButtonCore<T> | null = null;

  constructor(options: Partial<{ _name: string } & ButtonInListProps<T>> = {}) {
    super(options);

    const { onClick } = options;
    if (onClick) {
      this.onClick(onClick);
    }
  }

  /** 当按钮处于列表中时，使用该方法保存所在列表记录 */
  bind(v: T) {
    const existing = this.btns.find((btn) => {
      return btn.cur.value === v;
    });
    if (existing) {
      return existing;
    }
    const btn = new ButtonCore<T>({
      onClick: (record) => {
        this.cur = btn;
        this.emit(Events.Click, record!);
      },
    });
    btn.bind(v);
    this.btns.push(btn);
    return btn;
  }
  /** 清空触发点击事件时保存的按钮 */
  clear() {
    this.cur = null;
  }
  setLoading(loading: boolean) {
    // console.log("set loading", loading, this.cur);
    if (this.cur === null) {
      for (let i = 0; i < this.btns.length; i += 1) {
        const btn = this.btns[i];
        btn.setLoading(loading);
      }
      return;
    }
    this.cur.setLoading(loading);
  }
  click() {
    if (this.cur === null) {
      return;
    }
    this.cur.click();
  }

  onClick(handler: Handler<TheTypesInListOfEvents<T>[Events.Click]>) {
    this.on(Events.Click, handler);
  }
  onStateChange(handler: Handler<TheTypesInListOfEvents<T>[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
