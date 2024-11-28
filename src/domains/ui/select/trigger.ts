// @ts-nocheck
import { BaseDomain, Handler } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};
export class SelectTriggerCore extends BaseDomain<TheTypesOfEvents> {
  constructor(
    options: Partial<{
      name: string;
      $node: () => HTMLElement;
      getStyles: () => CSSStyleDeclaration;
      getRect: () => DOMRect;
    }> = {}
  ) {
    super(options);
    const { $node, getStyles, getRect } = options;
    if (getRect) {
      this.getRect = getRect;
    }
    if (getStyles) {
      this.getStyles = getStyles;
    }
    if ($node) {
      this.$node = $node;
    }
  }
  $node() {
    return null;
  }
  getRect() {
    return {} as DOMRect;
  }
  getStyles() {
    return {} as CSSStyleDeclaration;
  }
}
