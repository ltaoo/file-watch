export function throttle<T extends (...args: any[]) => any>(delay: number, func: T) {
  let lastTime = 0;
  return function (...args: Parameters<T>) {
    const currentTime = Date.now();
    if (currentTime - lastTime >= delay) {
      lastTime = currentTime;
      return func(...args);
    }
  };
}
