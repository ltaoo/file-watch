// import { useEffect, useRef, useState } from "react";
import { Match, Switch, createSignal, onMount } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { effect } from "solid-js/web";
import { Image, ImageOff } from "lucide-solid";

import { ImageCore, ImageStep } from "@/domains/ui/image";
import { connect } from "@/domains/ui/image/connect.web";
import { cn } from "@/utils";

export function LazyImage(props: { store: ImageCore; alt?: string } & JSX.HTMLAttributes<HTMLImageElement>) {
  const { store } = props;

  let $img: HTMLImageElement | undefined = undefined;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => {
    console.log("[COMPONENT]ui/image - store.onStateChange", v);
    setState(v);
  });
  onMount(() => {
    if (!$img) {
      return;
    }
    connect($img, store);
  });
  // effect(() => {
  //   if (!props.src) {
  //     return;
  //   }
  //   store.updateSrc(props.src);
  // });

  return (
    <div
      ref={$img}
      classList={{
        [props.class as string]: true,
        "flex items-center justify-center": true,
        "bg-slate-200": ![ImageStep.Loading, ImageStep.Loaded].includes(state().step),
      }}
    >
      <Switch>
        <Match when={state().step === ImageStep.Failed}>
          <ImageOff class="w-8 h-8 text-slate-500" />
        </Match>
        <Match when={state().step === ImageStep.Pending}>
          <Image class="w-8 h-8 text-slate-500" />
        </Match>
        <Match when={[ImageStep.Loading, ImageStep.Loaded].includes(state().step)}>
          <img
            class={props.class}
            style={{ "object-fit": state().fit }}
            src={state().src}
            alt={state().alt}
            onError={() => {
              store.handleError();
            }}
          />
        </Match>
      </Switch>
    </div>
  );
}
