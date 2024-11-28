import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: SimpleSelectCoreState;
};

type SimpleSelectCoreProps = {
  defaultValue: number;
  options: {
    value: number;
    label: string;
  }[];
};
type SimpleSelectCoreState = {
  value: number;
  options: {
    value: number;
    label: string;
  }[];
};

export class SimpleSelectCore extends BaseDomain<TheTypesOfEvents> {
  defaultValue: SimpleSelectCoreProps["defaultValue"];
  options: SimpleSelectCoreProps["options"];

  value: number;

  get state(): SimpleSelectCoreState {
    return {
      value: this.value,
      options: this.options,
    };
  }

  constructor(props: Partial<{ _name: string }> & SimpleSelectCoreProps) {
    super(props);

    const { defaultValue, options } = props;
    this.defaultValue = defaultValue;
    this.value = defaultValue;
    this.options = options;
  }

  select(v: number) {
    this.value = v;
  }
  setValue(v: number) {
    this.value = v;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
