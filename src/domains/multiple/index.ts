/**
 * @file 列表中多选
 */
import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: T[];
};
type SelectionProps<T> = {
  onChange?: (v: T[]) => void;
};
type MultipleSelectionState = {};
export class MultipleSelectionCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  values: T[] = [];

  constructor(options: Partial<{ _name: string }> & SelectionProps<T> = {}) {
    super(options);

    const { onChange } = options;
    if (onChange) {
      this.onStateChange(onChange);
    }
  }

  toggle(value: T) {
    if (this.values.includes(value)) {
      this.remove(value);
      return;
    }
    this.select(value);
  }
  select(value: T) {
    if (this.values.includes(value)) {
      return;
    }
    this.values.push(value);
    this.emit(Events.StateChange, [...this.values]);
  }
  remove(value: T) {
    if (!this.values.includes(value)) {
      return;
    }
    this.values = this.values.filter((v) => v !== value);
    this.emit(Events.StateChange, [...this.values]);
  }
  /** 暂存的值是否为空 */
  isEmpty() {
    return this.values.length === 0;
  }
  clear() {
    this.values = [];
    this.emit(Events.StateChange, [...this.values]);
  }

  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
