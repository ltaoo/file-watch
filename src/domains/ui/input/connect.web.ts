import { InputCore } from "./index";

export function connect(store: InputCore<string>, $input: HTMLInputElement) {
  store.focus = () => {
    $input.focus();
  };
}
