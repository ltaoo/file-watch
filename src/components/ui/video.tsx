import { createSignal, onMount } from "solid-js";

import { PlayerCore } from "@/domains/player";
import { connect } from "@/domains/player/connect.web";
// import { useInitialize } from "@/hooks";

export function Video(props: { store: PlayerCore }) {
  const { store } = props;

  let $video: undefined | HTMLVideoElement;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  onMount(() => {
    // console.log("[COMPONENT]Video - onMount", $video, $$video);
    setTimeout(() => {
      const $$video = $video;
      // console.log("[COMPONENT]Video - onMount", $video, $$video);
      if (!$$video) {
        return;
      }
      store.setMounted();
      connect($$video, store);
    }, 200);
  });

  const { width, height, ready, poster } = state();

  // console.log("[COMPONENT]Video - render", width, height, poster);

  return (
    <div
      class="w-full"
      style={
        {
          // width: `${width}px`,
          // height: `${height}px`,
          // overflow: "hidden",
        }
      }
    >
      <video
        ref={$video}
        poster={poster}
        class="w-full relative z-10"
        controls={true}
        webkit-playsinline="true"
        plays-in-line
        preload="none"
        height={height}
      />
    </div>
  );
}
