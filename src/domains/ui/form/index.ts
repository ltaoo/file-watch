import { BaseDomain, Handler } from "@/domains/base";

import { FormFieldCore } from "./field";
import { InputInterface } from "./types";

enum Events {
  Input,
  Submit,
  StateChange,
}
type TheTypesOfEvents<T extends Record<string, unknown>> = {
  [Events.StateChange]: FormState<T>;
  [Events.Input]: unknown;
  [Events.Submit]: T;
};

type FormState<T extends Record<string, unknown>> = {
  values: T;
};
type FormProps = {
  fields: InputInterface[];
};

export class FormCore<T extends Record<string, unknown>> extends BaseDomain<TheTypesOfEvents<T>> {
  fields: InputInterface[] = [];
  state: FormState<T> = {
    // @ts-ignore
    values: {},
  };

  constructor(options: Partial<{ _name: string } & FormProps> = {}) {
    super(options);

    const { fields = [] } = options;
    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
      field.onChange((v: string) => {
        this.setValue(field.name, v);
      });
    }
    this.fields = fields;
  }
  setValue(name: string, value: unknown) {
    // @ts-ignore
    this.state.values[name] = value;
    this.emit(Events.StateChange, { ...this.state });
  }
  // setFieldsValue(nextValues) {}
  input<Key extends keyof T>(key: Key, value: T[Key]) {
    this.state.values[key] = value;
    this.emit(Events.Input, value);
    this.emit(Events.StateChange, { ...this.state });
  }
  submit() {
    this.emit(Events.Submit, { ...this.state.values });
  }

  onSubmit(handler: Handler<TheTypesOfEvents<T>[Events.Submit]>) {
    this.on(Events.Submit, handler);
  }
  onInput(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
