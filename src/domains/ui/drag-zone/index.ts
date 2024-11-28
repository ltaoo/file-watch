import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
  Change,
}
type TheTypesOfEvents = {
  [Events.StateChange]: DragZoneState;
  [Events.Change]: any[];
};

type DragZoneProps = {
  onChange?: (files: any[]) => void;
};
type DragZoneState = {
  hovering: boolean;
  selected: boolean;
  files: any[];
};

export class DragZoneCore extends BaseDomain<TheTypesOfEvents> {
  _hovering: boolean = false;
  _selected: boolean = false;
  _files: any[] = [];

  get state(): DragZoneState {
    return {
      hovering: this._hovering,
      selected: this._selected,
      files: this._files,
    };
  }

  constructor(props: Partial<{ _name: string }> & DragZoneProps = {}) {
    super(props);

    const { onChange } = props;
    if (onChange) {
      this.onChange(onChange);
    }
  }
  clear() {
    this._files = [];
    this._selected = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 开始拖动 */
  handleDragover() {
    this._hovering = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  handleDragleave() {
    this._hovering = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  handleDrop(files: any[]) {
    this._hovering = false;
    if (!files || files.length === 0) {
      this._selected = false;
      this._files = [];
      this.emit(Events.Change, [...files]);
      return;
    }
    this._files = files;
    this._selected = true;
    this.emit(Events.Change, [...files]);
    this.emit(Events.StateChange, { ...this.state });
  }
  getFileByName(name: string) {
    return this._files.find((f) => f.name === name);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
}
