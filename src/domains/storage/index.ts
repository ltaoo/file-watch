import { debounce } from "@/utils/lodash/debounce";

import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: StorageCoreState<T>;
};

type StorageCoreProps<T> = {
  key: string;
  values: T;
  defaultValues: T;
  client: {
    setItem: (key: string, value: string) => void;
    getItem: (key: string) => void;
  };
};
type StorageCoreState<T> = {
  values: T;
};

export class StorageCore<T extends Record<string, unknown>> extends BaseDomain<TheTypesOfEvents<T>> {
  key: string;
  values: T;
  defaultValues: T;
  client: StorageCoreProps<T>["client"];

  get state() {
    return {
      values: this.values,
    };
  }

  constructor(props: Partial<{ _name: string }> & StorageCoreProps<T>) {
    super(props);

    const { key, client, defaultValues, values } = props;
    this.key = key;
    this.values = values;
    this.values = {
      ...defaultValues,
      ...values,
    };
    this.defaultValues = defaultValues;
    this.client = client;
  }

  get<K extends keyof T>(key: K, defaultValue?: T[K]) {
    const v = this.values[key];
    // console.log("[DOMAIN]storage/index - get", key, v, this.values);
    if (v === undefined) {
      if (defaultValue) {
        // @ts-ignore
        return defaultValue[key] as T[K];
      }
      throw new Error("the default value no existing");
    }
    return v as T[K];
  }
  setDirectly<K extends keyof T>(key: K, values: T[K]) {
    // console.log("cache set", key, values);
    const nextValues = {
      ...this.values,
      [key]: values,
    };
    this.values = nextValues;
    this.client.setItem(this.key, JSON.stringify(this.values));
    this.emit(Events.StateChange, { ...this.state });
  }
  set = debounce(100, this.setDirectly.bind(this)) as (key: keyof T, value: unknown) => void;
  merge = <K extends keyof T>(
    key: K,
    values: Partial<T[K]>,
    extra: Partial<{ reverse: boolean; limit: number }> = {}
  ) => {
    // console.log("[]merge", key, values);
    const prevValues = this.get(key) || {};
    if (Array.isArray(prevValues)) {
      let nextValues = extra.reverse
        ? [...(values as unknown as Array<unknown>), ...prevValues]
        : [...prevValues, ...(values as unknown as Array<unknown>)];
      if (extra.limit) {
        nextValues = nextValues.slice(0, extra.limit);
      }
      this.set(key, nextValues);
      return nextValues;
    }
    if (typeof prevValues === "object" && typeof values === "object") {
      const nextValues = {
        ...prevValues,
        ...values,
      };
      this.set(key, nextValues);
      return nextValues;
    }
    console.warn("the params of merge must be object");
    return prevValues;
  };
  clear<K extends keyof T>(key: K) {
    const v = this.values[key];
    if (v === undefined) {
      return null;
    }
    this.values = {
      ...this.values,
      [key]: this.defaultValues[key],
    };
    this.client.setItem(this.key, JSON.stringify(this.values));
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
