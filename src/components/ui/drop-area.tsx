import { createSignal, JSX, Show } from "solid-js";
import { listen } from "@tauri-apps/api/event";

import { DragZoneCore } from "@/domains/ui/drag-zone";

// export function DropAreaCore() {
//   let _hovering = false;

//   const state = {
//     get hovering() {
//       return _hovering;
//     },
//   };
//   return {
//     Symbol: "DropAreaCore" as const,
//     state,
//   };
// }
// export type DropAreaCore = ReturnType<typeof DropAreaCore>;

export function DropArea(props: { store: DragZoneCore } & JSX.HTMLAttributes<HTMLDivElement>) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => setState(v));

  listen("tauri://drag-enter", () => {
    store.handleDragover();
  });
  listen<{ paths: string[] }>("tauri://drag-drop", (event) => {
    store.handleDrop(event.payload.paths);
  });
  listen("tauri://drag-leave", () => {
    store.handleDragleave();
  });

  return (
    <div
      classList={{
        "absolute inset-0": true,
        "bg-gray-800 opacity-50": state().hovering,
        "": !state().hovering,
      }}
    >
      <div
        class="absolute inset-0 flex items-center justify-center"
        style={{ display: state().selected ? "none" : "block" }}
      >
        <div class="p-4 text-center">
          <p>拖动文件夹到此处</p>
          {/* <input type="file" class="absolute inset-0 opacity-0 cursor-pointer" /> */}
        </div>
      </div>
      {props.children}
    </div>
  );
}
