import { PlayerCore } from "@/domains/player";
import { JSX } from "solid-js/jsx-runtime";

const Root = () => {};

const Video = (props: { store: PlayerCore }) => {
  let $video: undefined | HTMLVideoElement;

  return (
    <video
      ref={$video}
      class="w-full relative z-10"
      controls={true}
      webkit-playsinline="true"
      plays-in-line
      preload="none"
      //       height={height}
    />
  );
};
const Poster = (props: { store: PlayerCore } & JSX.HTMLAttributes<HTMLElement>) => {

};
const Progress = (props: { store: PlayerCore }) => {

};
const CurTime = (props: { store: PlayerCore }) => {

};

const Handler = (props: { store: PlayerCore } & JSX.HTMLAttributes<HTMLElement>) => {

};
