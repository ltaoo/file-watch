/**
 * @file 一个缓存/当前值
 * 类似 useRef
 */
import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: T;
};
type RefProps<T> = {
  defaultValue?: T;
  onChange?: (v: T) => void;
};
type RefState = {};
export class RefCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  value: T | null = null;

  get state(): T | null {
    return this.value;
  }

  constructor(options: Partial<{ _name: string }> & RefProps<T> = {}) {
    super(options);

    const { defaultValue, onChange } = options;
    if (defaultValue) {
      this.value = defaultValue;
    }
    if (onChange) {
      this.onStateChange(onChange);
    }
  }

  /** 暂存一个值 */
  select(value: T) {
    this.value = value;
    this.emit(Events.StateChange, this.value);
  }
  patch(value: Partial<T>) {
    this.value = {
      ...this.value,
      ...value,
    } as T;
    this.emit(Events.StateChange, this.value);
  }
  /** 暂存的值是否为空 */
  isEmpty() {
    return this.value === null;
  }
  /** 返回 select 方法保存的 value 并将 value 重置为 null */
  clear() {
    // const v = this.value;
    this.value = null;
    this.emit(Events.StateChange);
    // return v;
  }

  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
