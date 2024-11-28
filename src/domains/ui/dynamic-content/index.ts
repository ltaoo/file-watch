import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: DynamicContentCoreState;
};

type DynamicContentCoreProps = {
  unique_id?: unknown;
  defaultValue?: number;
  value: number;
};
type DynamicContentCoreState = {
  value: number;
};

export class DynamicContentCore extends BaseDomain<TheTypesOfEvents> {
  unique_uid?: unknown;
  value: number;

  get state(): DynamicContentCoreState {
    return {
      value: this.value,
    };
  }

  constructor(props: Partial<{ _name: string }> & DynamicContentCoreProps) {
    super(props);

    const { value, unique_id } = props;
    this.value = value;
    if (unique_id) {
      this.unique_uid = unique_id;
    }
  }

  show(value: number) {
    this.value = value;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

export class DynamicContentInListCore extends BaseDomain<TheTypesOfEvents> {
  /** 列表中一类多个按钮 */
  btns: DynamicContentCore[] = [];
  /** 按钮点击后，该值被设置为触发点击的那个按钮 */
  cur: DynamicContentCore | null = null;
  defaultValue: number;

  constructor(props: Partial<{ _name: string }> & { value: number }) {
    super(props);

    const { value } = props;
    this.defaultValue = value;
  }

  /** 当按钮处于列表中时，使用该方法保存所在列表记录 */
  bind(unique_id: unknown) {
    const existing = this.btns.find((btn) => {
      return btn.unique_id === unique_id;
    });
    if (existing) {
      return existing;
    }
    const btn = new DynamicContentCore({
      unique_id,
      value: this.defaultValue,
    });
    this.btns.push(btn);
    return btn;
  }
  /** 清空触发点击事件时保存的按钮 */
  clear() {
    this.cur = null;
  }
  select(unique_id: unknown) {
    const matched = this.btns.find((btn) => btn.unique_id === unique_id);
    if (!matched) {
      return;
    }
    this.cur = matched;
  }
  set(v: number) {
    if (this.cur === null) {
      return;
    }
    this.cur.show(v);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
