import { NodeCore } from ".";

export function connect($img: HTMLImageElement, store: NodeCore) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          store.handleShow();
          io.unobserve($img);
        }
      });
    },
    { threshold: 0.4 }
  );
  io.observe($img);
}
