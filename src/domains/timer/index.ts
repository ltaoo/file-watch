export class TimerCore {
  timer: null | NodeJS.Timeout = null;

  interval(fn: Function, delay: number) {
    if (this.timer !== null) {
      return;
    }
    setInterval(() => {
      fn();
    }, delay);
  }
  clear() {
    if (this.timer === null) {
      return;
    }
    clearInterval(this.timer);
    this.timer = null;
  }
}
