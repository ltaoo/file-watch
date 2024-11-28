import { BaseDomain, Handler } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};

export class CollectionCore extends BaseDomain<TheTypesOfEvents> {
  itemMap: Map<unknown, unknown> = new Map();

  setWrap(wrap: unknown) {
    // ...
  }
  add(key: unknown, v: unknown) {
    this.itemMap.set(key, v);
  }
  remove(key: unknown) {
    this.itemMap.delete(key);
  }
  getItems() {
    // 找到 wrap 下的所有 item
    const items = Array.from(this.itemMap.values());
    return items;
  }
}
