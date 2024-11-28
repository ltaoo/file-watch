import { BaseDomain, Handler } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};
export class SelectViewportCore extends BaseDomain<TheTypesOfEvents> {
  constructor(
    options: Partial<{
      _name: string;
      $node: () => HTMLElement;
      getStyles: () => CSSStyleDeclaration;
      getRect: () => DOMRect;
    }> = {}
  ) {
    super(options);
    const { $node, getStyles, getRect } = options;
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
  get clientHeight() {
    return this.$node()?.clientHeight ?? 0;
  }
  get scrollHeight() {
    return this.$node()?.scrollHeight ?? 0;
  }
  get offsetTop() {
    return this.$node()?.offsetTop ?? 0;
  }
  get offsetHeight() {
    return this.$node()?.offsetHeight ?? 0;
  }
}
