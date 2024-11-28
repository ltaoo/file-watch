/**
 * @file Select 选项
 */
import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
  Select,
  Leave,
  Enter,
  Move,
  Focus,
  Blur,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: SelectItemState<T>;
  [Events.Select]: void;
  [Events.Leave]: void;
  [Events.Enter]: void;
  [Events.Focus]: void;
  [Events.Blur]: void;
};
type SelectItemState<T> = {
  /** 标志唯一值 */
  value: T | null;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
};
type SelectItemProps<T> = {
  name?: string;
  label: string;
  value: T;
  selected?: boolean;
  focused?: boolean;
  disabled?: boolean;
  $node?: () => HTMLElement;
  getRect?: () => DOMRect;
  getStyles?: () => CSSStyleDeclaration;
};

export class SelectItemCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  name = "SelectItemCore";
  debug = true;

  text: string;
  value: T | null = null;
  selected: boolean = false;
  focused: boolean = false;
  disabled: boolean = false;

  // text: {
  //   $node: () => HTMLElement;
  //   getRect: () => DOMRect;
  //   getStyles: () => CSSStyleDeclaration;
  // } | null = null;

  _leave = false;
  _enter = false;

  get state(): SelectItemState<T> {
    return {
      value: this.value,
      selected: this.selected,
      focused: this.focused,
      disabled: this.disabled,
    };
  }

  constructor(options: Partial<{ _name: string }> & SelectItemProps<T>) {
    super(options);

    const { name, label, value, $node, getRect, getStyles } = options;
    this.text = label;
    this.value = value;
    if (name) {
      this.name = `${this.name}_${name}`;
    }
    if ($node) {
      this.$node = $node;
    }
    if (getRect) {
      this.getRect = getRect;
    }
    if (getStyles) {
      this.getStyles = getStyles;
    }
  }
  $node(): HTMLElement | null {
    return null;
  }
  getRect() {
    return {} as DOMRect;
  }
  getStyles() {
    return {} as CSSStyleDeclaration;
  }
  get offsetHeight() {
    return this.$node()?.offsetHeight ?? 0;
  }
  get offsetTop() {
    return this.$node()?.offsetTop ?? 0;
  }
  setText(text: SelectItemCore<T>["text"]) {
    this.text = text;
  }
  select() {
    // if (this.state.selected) {
    //   return;
    // }
    this.state.selected = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  unselect() {
    // if (this.state.selected === false) {
    //   return;
    // }
    this.state.selected = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  focus() {
    if (this.state.focused === true) {
      return;
    }
    this.state.focused = true;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Focus);
  }
  blur() {
    if (this.state.focused === false) {
      return;
    }
    this.state.focused = false;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Blur);
  }
  leave() {
    this.emit(Events.Leave);
  }
  move(pos: { x: number; y: number }) {
    if (this.state.disabled) {
      this.leave();
      return;
    }
    // console.log("[SelectItemCore]move - prepare focus");
    this.focus();
  }
  enter() {
    if (this._enter === true) {
      return;
    }
    this._enter = true;
    this.emit(Events.Enter);
  }

  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onLeave(handler: Handler<TheTypesOfEvents<T>[Events.Leave]>) {
    return this.on(Events.Leave, handler);
  }
  onEnter(handler: Handler<TheTypesOfEvents<T>[Events.Enter]>) {
    return this.on(Events.Enter, handler);
  }
  onFocus(handler: Handler<TheTypesOfEvents<T>[Events.Focus]>) {
    return this.on(Events.Focus, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents<T>[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }
}
