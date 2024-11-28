import { BaseDomain, Handler } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};
type SelectContentProps = {
  $node: () => HTMLElement;
  getStyles: () => CSSStyleDeclaration;
  getRect: () => DOMRect;
};
export class SelectContentCore extends BaseDomain<TheTypesOfEvents> {
  constructor(
    options: Partial<{
      _name: string;
    }> &
      Partial<SelectContentProps> = {}
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
}
