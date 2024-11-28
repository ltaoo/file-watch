import { ScrollViewCore, PointEvent } from "./index";
import { preventDefault } from "./utils";

const SpeedClassName = "enable-hardware";

export function connectScroll(store: ScrollViewCore, $scroll: HTMLDivElement) {
  function handlePointerDown(e: PointEvent) {
    store.handlePointDown(e);
    const scrollTop = store.getScrollTop();
    if (store.os.pc && scrollTop <= 0) {
      // 在顶部给PC端添加move事件
      $scroll.addEventListener("mousemove", store.handleMouseMove, {
        passive: false,
      });
      document.ondragstart = function () {
        // 在顶部禁止PC端拖拽图片,避免与下拉刷新冲突
        return false;
      };
    }
  }
  function handleTouchEnd() {
    store.handleTouchEnd();
    if (store.os.pc) {
      $scroll.removeEventListener("mousemove", store.handleMouseMove);
      document.ondragstart = function () {
        return true;
      };
    }
  }
  $scroll.addEventListener("touchstart", handlePointerDown);
  $scroll.addEventListener("touchmove", store.handleTouchMove, {
    passive: false,
  });
  $scroll.addEventListener("touchend", handleTouchEnd);
  $scroll.addEventListener("touchcancel", handleTouchEnd);
  $scroll.addEventListener("mousedown", handlePointerDown);
  $scroll.addEventListener("mouseup", handleTouchEnd);
  $scroll.addEventListener("mouseleave", handleTouchEnd);
  $scroll.addEventListener("scroll", store.handleScrolling);

  let isSetScrollAuto = false;
  store.optimizeScroll = (needOptimize) => {
    if (needOptimize && isSetScrollAuto === false) {
      $scroll.classList.add(SpeedClassName);
      // @ts-ignore
      $scroll.style.webkitOverflowScrolling = "auto";
      isSetScrollAuto = true;
    }

    if (needOptimize === false && isSetScrollAuto) {
      // @ts-ignore
      $scroll.style.webkitOverflowScrolling = "touch";
      $scroll.classList.remove(SpeedClassName);
      isSetScrollAuto = false;
    }
  };
  let preWinX = 0;
  let preWinY = 0;
  function handleTouchMoveInBounce(e: TouchEvent) {
    let el = e.currentTarget;
    // 当前touch的元素及父元素是否要拦截touchmove事件
    let isPrevent = true;
    while (el && el !== document.body && el !== document) {
      const cls = (el as HTMLElement).classList;
      if (cls) {
        if (cls.contains("mescroll") || cls.contains("mescroll-touch")) {
          // 如果是指定条件的元素，则无需拦截 touchmove 事件
          isPrevent = false;
          break;
        } else if (cls.contains("mescroll-touch-x") || cls.contains("mescroll-touch-y")) {
          // 如果配置了水平或者垂直滑动
          var curX = e.touches ? e.touches[0].pageX : 0;
          var curY = e.touches ? e.touches[0].pageY : 0;
          if (!preWinX) {
            preWinX = curX;
          }
          if (!preWinY) {
            preWinY = curY;
          }
          const x = Math.abs(preWinX - curX);
          const y = Math.abs(preWinY - curY);
          const z = Math.sqrt(x * x + y * y);
          preWinX = curX;
          preWinY = curY;
          if (z !== 0) {
            var angle = (Math.asin(y / z) / Math.PI) * 180;
            if ((angle <= 45 && cls.contains("mescroll-touch-x")) || (angle > 45 && cls.contains("mescroll-touch-y"))) {
              isPrevent = false;
              break;
            }
          }
        }
      }
      el = (el as HTMLElement).parentNode;
    }
    if (isPrevent) {
      preventDefault(e);
    }
  }
  store.refreshRect = () => {
    const { scrollHeight } = $scroll;
    store.setRect({
      contentHeight: scrollHeight,
    });
  };
  store.setBounce = (isBounce) => {
    /** 不支持非 iOS 设备 */
    if (!store.os.ios) {
      return;
    }
    if (isBounce === false) {
      // this.optUp.isBounce = false;
      window.addEventListener("touchmove", handleTouchMoveInBounce, {
        passive: false,
      });
    } else {
      // this.optUp.isBounce = true;
      window.removeEventListener("touchmove", handleTouchMoveInBounce);
    }
  };
  store.setScrollTop = (top: number) => {
    $scroll.scrollTop = top;
  };
  store.getScrollTop = () => {
    return $scroll.scrollTop;
  };
  store.getScrollClientHeight = () => {
    return $scroll.clientHeight;
  };
  store.getScrollHeight = () => {
    return $scroll.scrollHeight;
  };
  store.getBodyHeight = () => {
    return document.body.clientHeight || document.documentElement.clientHeight;
  };
  store.getOffsetTop = (dom: HTMLElement) => {
    let top = dom.offsetTop;
    let parent = dom.offsetParent as HTMLElement | null;
    while (parent && parent !== $scroll) {
      top += parent.offsetTop + parent.clientTop;
      parent = parent.offsetParent as HTMLElement | null;
    }
    return top;
  };
  function getStep(
    star: number,
    end: number,
    callback: (step: number, timer?: unknown) => void,
    t: number = 300,
    rate: number = 30
  ) {
    const diff = end - star;
    if (t === 0 || diff === 0) {
      callback && callback(end);
      return;
    }
    const count = t / rate;
    const step = diff / count;
    let i = 0;
    const timer = window.setInterval(() => {
      if (i < count - 1) {
        star += step;
        callback && callback(star, timer);
        i++;
      } else {
        callback && callback(end, timer);
        window.clearInterval(timer);
      }
    }, rate);
  }
  store.scrollTo = (position, duration) => {
    const { top = 0 } = position;
    const star = store.getScrollTop();
    let end = top;
    if (end > 0) {
      const maxY = store.getScrollHeight() - store.getScrollClientHeight();
      if (end > maxY) {
        end = maxY;
      }
    } else {
      end = 0;
    }
    store.isScrollTo = true;
    // 标记在滑动中,阻止列表的触摸事件
    // this.scrollDom.style.webkitOverflowScrolling = "auto";
    // 避免iOS惯性滚动的影响
    $scroll.style.overflow = "hidden";
    getStep(
      star,
      end,
      (step) => {
        store.setScrollTop(step);
        if (step === end) {
          // this.scrollDom.style.webkitOverflowScrolling = "touch";
          $scroll.style.overflow = "auto";
          store.isScrollTo = false;
        }
      },
      duration
    );
  };

  store.destroy = () => {
    $scroll.removeEventListener("touchstart", handlePointerDown);
    $scroll.removeEventListener("touchmove", store.handleTouchMove);
    $scroll.removeEventListener("touchend", handleTouchEnd);
    $scroll.removeEventListener("touchcancel", handleTouchEnd);
    $scroll.removeEventListener("mousedown", handlePointerDown);
    $scroll.removeEventListener("mousemove", store.handleMouseMove);
    $scroll.removeEventListener("mouseup", handleTouchEnd);
    $scroll.removeEventListener("mouseleave", handleTouchEnd);
    $scroll.removeEventListener("scroll", store.handleScrolling);
    store.setBounce(true);
  };
}

export function connectIndicator(store: ScrollViewCore, $indicator: HTMLDivElement) {
  store.hideIndicator = () => {
    $indicator.innerHTML = "";
  };
  store.changeIndicatorHeight = (height) => {
    $indicator.style.height = height + "px";
  };
  let hasTransition = false;
  store.setIndicatorHeightTransition = (addOrRemove) => {
    if (addOrRemove && hasTransition === false) {
      // $indicator.classList.add(HeightTransitionClassName);
      $indicator.style.transition = "height 300ms";
      hasTransition = true;
    }
    if (!addOrRemove && hasTransition === true) {
      // $indicator.classList.remove(HeightTransitionClassName);
      $indicator.style.transition = "unset";
      hasTransition = false;
    }
  };
}
