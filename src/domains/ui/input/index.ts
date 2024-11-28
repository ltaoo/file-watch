import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  Change,
  StateChange,
  Mounted,
  Focus,
  Blur,
  Enter,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: InputState<T>;
  [Events.Mounted]: void;
  [Events.Change]: T;
  [Events.Blur]: T;
  [Events.Enter]: T;
  [Events.Focus]: void;
};

type InputProps<T> = {
  /** 字段键 */
  name?: string;
  disabled?: boolean;
  defaultValue: T;
  placeholder?: string;
  type?: string;
  onChange?: (v: T) => void;
  onEnter?: (v: T) => void;
  onBlur?: (v: T) => void;
};
type InputState<T> = {
  value: T;
  placeholder: string;
  disabled: boolean;
  loading: boolean;
  type: string;
};

export class InputCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  defaultValue: T;
  value: T;
  placeholder: string;
  disabled: boolean;
  type: string;
  loading = false;
  /** 被消费过的值，用于做比较判断 input 值是否发生改变 */
  valueUsed: T;

  get state() {
    return {
      value: this.value,
      placeholder: this.placeholder,
      disabled: this.disabled,
      loading: this.loading,
      type: this.type,
    };
  }

  constructor(options: Partial<{ _name: string }> & InputProps<T>) {
    super(options);

    const {
      defaultValue,
      placeholder = "请输入",
      type = "string",
      disabled = false,
      onChange,
      onBlur,
      onEnter,
    } = options;
    this.placeholder = placeholder;
    this.type = type;
    this.disabled = disabled;
    this.defaultValue = defaultValue;
    this.value = defaultValue;
    this.valueUsed = defaultValue;
    if (onChange) {
      this.onChange(onChange);
    }
    if (onEnter) {
      this.onEnter(onEnter);
    }
    if (onBlur) {
      this.onBlur(onBlur);
    }
  }
  setMounted() {
    this.emit(Events.Mounted);
  }
  handleEnter() {
    if (this.value === this.valueUsed) {
      return;
    }
    this.valueUsed = this.value;
    this.emit(Events.Enter, this.value);
  }
  handleBlur() {
    if (this.value === this.valueUsed) {
      return;
    }
    this.valueUsed = this.value;
    this.emit(Events.Blur, this.value);
  }
  setLoading(loading: boolean) {
    this.loading = loading;
    this.emit(Events.StateChange, { ...this.state });
  }
  focus() {
    console.log("请在 connect 中实现该方法");
  }
  handleChange(event: unknown) {
    console.log("[DOMAIN]ui/input - handleChange", event);
    if (this.type === "file") {
      const { target } = event as { target: { files: T } };
      const { files: v } = target;
      this.setValue(v);
      return;
    }
    const { target } = event as { target: { value: T } };
    const { value: v } = target;
    this.setValue(v);
  }
  setValue(value: T) {
    this.value = value;
    if (this.type === "number") {
      this.value = Number(value) as T;
    }
    this.emit(Events.Change, value);
    this.emit(Events.StateChange, { ...this.state });
  }
  enable() {
    this.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  disable() {
    this.disabled = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  clear() {
    this.value = this.defaultValue;
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.value = this.defaultValue;
    this.emit(Events.StateChange, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents<T>[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onFocus(handler: Handler<TheTypesOfEvents<T>[Events.Focus]>) {
    return this.on(Events.Focus, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents<T>[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }
  onEnter(handler: Handler<TheTypesOfEvents<T>[Events.Enter]>) {
    return this.on(Events.Enter, handler);
  }
}

type InputInListProps<T = unknown> = {
  onChange?: (record: T) => void;
} & InputProps<T>;
type TheTypesInListOfEvents<K extends string, T> = {
  [Events.Change]: [K, T];
  [Events.StateChange]: InputProps<T>;
};

export class InputInListCore<K extends string, T> extends BaseDomain<TheTypesInListOfEvents<K, T>> {
  defaultValue: T;

  list: InputCore<T>[] = [];
  cached: Record<K, InputCore<T>> = {} as Record<K, InputCore<T>>;
  values: Map<K, T | null> = new Map();

  constructor(props: Partial<{ _name: string }> & InputInListProps<T>) {
    super(props);

    const { defaultValue } = props;
    this.defaultValue = defaultValue;
  }

  bind(
    unique_id: K,
    options: {
      defaultValue?: T;
    } = {}
  ) {
    const { defaultValue = this.defaultValue } = options;
    console.log("[DOMAIN]input/index - bind", unique_id, this.cached);
    const existing = this.cached[unique_id];
    if (existing) {
      return existing;
    }
    const select = new InputCore<T>({
      defaultValue,
      onChange: (value) => {
        this.values.set(unique_id, value);
        this.emit(Events.Change, [unique_id, value]);
      },
    });
    this.list.push(select);
    this.values.set(unique_id, defaultValue);
    this.cached[unique_id] = select;
    return select;
  }
  getCur(unique_id: K) {
    const existing = this.cached[unique_id];
    if (existing) {
      return existing;
    }
    return null;
  }
  setValue(v: T) {
    for (let i = 0; i < this.list.length; i += 1) {
      const item = this.list[i];
      item.setValue(v);
    }
  }
  clear() {
    this.list = [];
    this.cached = {} as Record<string, InputCore<T>>;
    this.values = new Map();
  }
  getValueByUniqueId(key: K) {
    return this.values.get(key) ?? null;
  }
  toJson<R>(handler: (value: [K, T | null]) => R) {
    const result: R[] = [];
    for (const [obj, value] of this.values) {
      const r = handler([obj, value]);
      result.push(r);
    }
    return result;
  }
  /** 清空触发点击事件时保存的按钮 */
  // clear() {
  //   this.cur = null;
  // }

  onChange(handler: Handler<TheTypesInListOfEvents<K, T>[Events.Change]>) {
    this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesInListOfEvents<K, T>[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
