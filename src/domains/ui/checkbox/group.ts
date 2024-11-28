/**
 * @file 多选
 */
import { BaseDomain, Handler } from "@/domains/base";

import { CheckboxCore } from ".";

enum Events {
  StateChange,
  Change,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: CheckboxGroupState<T>;
  [Events.Change]: T[];
};
type CheckboxGroupOption<T> = {
  value: T;
  label: string;
  checked?: boolean;
  disabled?: boolean;
};
type CheckboxGroupProps<T> = {
  options?: CheckboxGroupOption<T>[];
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (options: T[]) => void;
};
type CheckboxGroupState<T> = Omit<CheckboxGroupProps<T>, "options"> & {
  options: {
    label: string;
    value: T;
    core: CheckboxCore;
  }[];
  values: T[];
  indeterminate: boolean;
};

export class CheckboxGroupCore<T extends any> extends BaseDomain<TheTypesOfEvents<T>> {
  options: {
    label: string;
    value: T;
    core: CheckboxCore;
  }[] = [];
  disabled: CheckboxGroupProps<T>["disabled"];
  values: T[] = [];

  get indeterminate() {
    return this.values.length === this.options.length;
  }
  get state(): CheckboxGroupState<T> {
    return {
      values: this.values,
      options: this.options,
      disabled: this.disabled,
      indeterminate: this.indeterminate,
    };
  }

  prevChecked = false;

  constructor(props: { _name?: string } & CheckboxGroupProps<T> = {}) {
    super(props);

    const { options = [], disabled = false, onChange } = props;
    this.disabled = disabled;

    this.options = options.map((opt) => {
      const { label, value, checked, disabled } = opt;
      const store = new CheckboxCore({
        label,
        checked,
        disabled,
        onChange: (checked) => {
          const existing = this.values.includes(value);
          if (checked && !existing) {
            this.checkOption(value);
            return;
          }
          if (!checked && existing) {
            this.uncheckOption(value);
          }
        },
      });
      return {
        label,
        value,
        core: store,
      };
    });
    if (onChange) {
      this.onChange(onChange);
    }
  }
  checkOption(value: T) {
    console.log("[DOMAIN]domains/ui/checkbox/group - checkOption", value);
    this.values = this.values.concat(value);
    this.emit(Events.Change, [...this.values]);
    this.emit(Events.StateChange, { ...this.state });
  }
  uncheckOption(value: T) {
    console.log("[DOMAIN]domains/ui/checkbox/group - uncheckOption", value);
    this.values = this.values.filter((v) => {
      return v !== value;
    });
    this.emit(Events.Change, [...this.values]);
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.values = [];
    this.emit(Events.Change, [...this.values]);
    this.emit(Events.StateChange, { ...this.state });
  }
  setOptions(options: CheckboxGroupOption<T>[]) {
    // console.log("[DOMAIN]ui/checkbox/group - setOptions", this.options);
    for (let i = 0; i < this.options.length; i += 1) {
      const opt = this.options[i];
      // console.log("[DOMAIN]ui/checkbox/group - setOptions", opt, i);
      opt.core.destroy();
    }
    this.options = options.map((opt) => {
      const { label, value, checked, disabled } = opt;
      const store = new CheckboxCore({
        label,
        checked,
        disabled,
        onChange: (checked) => {
          const existing = this.values.includes(value);
          if (checked && !existing) {
            this.checkOption(value);
            return;
          }
          if (!checked && existing) {
            this.uncheckOption(value);
          }
        },
      });
      return {
        label,
        value,
        core: store,
      };
    });
    console.log("[DOMAIN]ui/checkbox/group - setOptions", this.options.length);
    this.emit(Events.StateChange, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
