import { createSignal, onMount, JSX } from "solid-js";

import generateQrcode from "@/utils/qrcode";

export function QRCode(
  props: {
    text: string;
    //     width: number;
    //     height: number;
    logo?: string;
  } & JSX.HTMLAttributes<HTMLImageElement>
) {
  const { text, logo, ...restProps } = props;

  const [url, setUrl] = createSignal("");
  onMount(async () => {
    const nextUrl = await generateQrcode(text, { logo });
    if (!nextUrl) {
      return;
    }
    setUrl(nextUrl);
  });

  return <img class={props.class} style={props.style} src={url()} />;
}
