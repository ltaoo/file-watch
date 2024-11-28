import { BaseDomain, Handler } from "@/domains/base";

type ProgressState = "indeterminate" | "complete" | "loading";
const DEFAULT_MAX = 100;
enum Events {
  ValueChange,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.ValueChange]: number;
  [Events.StateChange]: ProgressCore["state"];
};

export class ProgressCore extends BaseDomain<TheTypesOfEvents> {
  _value: number | null;
  _label: string | undefined;
  _max: number;

  constructor(options: {
    value?: number | null | undefined;
    max?: number;
    getValueLabel?: (value: number, max: number) => string;
  }) {
    super();
    const { value: valueProp, max: maxProp, getValueLabel = defaultGetValueLabel } = options;
    const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
    this._max = max;
    const value = isValidValueNumber(valueProp, max) ? valueProp : null;
    this._value = value;
    const valueLabel = isNumber(value) ? getValueLabel(value, max) : undefined;
    this._label = valueLabel;
  }

  get state() {
    return {
      state: getProgressState(this._value, this._max),
      value: this._value ?? undefined,
      max: this._max,
      label: this._label,
    };
  }

  setValue(v: number) {
    this._value = v;
    this.emit(Events.ValueChange, v);
    this.emit(Events.StateChange, this.state);
  }
  update(v: number) {
    this._value = v;
    this.emit(Events.ValueChange, v);
    this.emit(Events.StateChange, this.state);
  }

  onValueChange(handler: Handler<TheTypesOfEvents[Events.ValueChange]>) {
    this.on(Events.ValueChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}

function defaultGetValueLabel(value: number, max: number) {
  return `${Math.round((value / max) * 100)}%`;
}

function getProgressState(value: number | undefined | null, maxValue: number): ProgressState {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}

function isNumber(value: any): value is number {
  return typeof value === "number";
}

function isValidMaxNumber(max: any): max is number {
  // prettier-ignore
  return (
	  isNumber(max) &&
	  !isNaN(max) &&
	  max > 0
	);
}

function isValidValueNumber(value: any, max: number): value is number {
  // prettier-ignore
  return (
	  isNumber(value) &&
	  !isNaN(value) &&
	  value <= max &&
	  value >= 0
	);
}

// Split this out for clearer readability of the error message.
function getInvalidMaxError(propValue: string, componentName: string) {
  return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`;
}
