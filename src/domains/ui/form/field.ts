import { BaseDomain, Handler } from "@/domains/base";
import { InputInterface } from "./types";

enum Events {
  Input,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Input]: unknown;
  [Events.StateChange]: FormFieldState;
};
type FormFieldState = {
  label: string;
};
type FormFieldProps = {
  label: string;
  name: string;
};

export class FormFieldCore extends BaseDomain<TheTypesOfEvents> {
  state: FormFieldState = {
    label: "",
  };

  constructor(options: Partial<{ _name: string } & FormFieldProps> = {}) {
    super(options);

    const { name, label } = options;
    // this.name = name;
    // this.state.label = label;
  }

  onInput(handler: Handler<TheTypesOfEvents[Events.Input]>) {
    this.on(Events.Input, handler);
  }
}
