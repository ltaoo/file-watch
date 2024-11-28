import { ImageCore } from "./index";

export function connect($img: HTMLDivElement, store: ImageCore) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          store.handleShow();
          //   $img.src = src;
          //   $img.classList.add("visible");
          //   if (has_visible_ref.current === false) {
          //     set_visible(true);
          //   }
          //   has_visible_ref.current = true;
          io.unobserve($img);
        }
      });
    },
    { threshold: 0.01 }
  );
  io.observe($img);
  // store.onStartLoad(() => {});
}
