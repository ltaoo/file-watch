import { BaseDomain, Handler } from "@/domains/base";

import { getPoint, damping, preventDefault, getAngleByPoints } from "./utils";

let handler: null | ((v: ScrollViewCore) => void) = null;
export function onCreateScrollView(h: (v: ScrollViewCore) => void) {
  handler = h;
}

type PullToRefreshStep = "pending" | "pulling" | "refreshing" | "releasing";
export type PointEvent = {
  touches?: { pageX: number; pageY: number }[];
  clientX?: number;
  clientY?: number;
  cancelable?: boolean;
  preventDefault?: () => void;
};
type PullToDownOptions = {
  /** 在列表顶部，松手即可触发下拉刷新回调的移动距离 */
  offset: number;
  /**
   * 是否锁定下拉刷新
   * 默认 false
   */
  isLock: boolean;
  /**
   * 当手指 touchmove 位置在距离 body 底部指定范围内的时候结束上拉刷新，避免 Webview 嵌套导致 touchend 事件不执行
   */
  bottomOffset: number;
  /**
   * 向下滑动最少偏移的角度，取值区间[0,90]
   * 默认45度，即向下滑动的角度大于45度则触发下拉。而小于45度，将不触发下拉，避免与左右滑动的轮播等组件冲突
   */
  minAngle: number;
};
enum Events {
  InDownOffset,
  OutDownOffset,
  Pulling,
  PullToRefresh,
  PullToRefreshFinished,
  InUpOffset,
  OutUpOffset,
  Scrolling,
  ReachBottom,
  Mounted,
}
type TheTypesOfEvents = {
  [Events.InDownOffset]: void;
  [Events.OutDownOffset]: void;
  [Events.Pulling]: { instance: number };
  [Events.PullToRefresh]: void;
  [Events.PullToRefreshFinished]: void;
  [Events.InUpOffset]: void;
  [Events.OutUpOffset]: void;
  [Events.Scrolling]: { scrollTop: number };
  [Events.ReachBottom]: void;
  [Events.Mounted]: void;
};
type EnvNeeded = {
  android: boolean;
  pc: boolean;
  ios: boolean;
  wechat: boolean;
};
export type ScrollViewProps = {
  os?: EnvNeeded;
  // down: Partial<PullToDownOptions>;
  /** 下拉多少距离后刷新 */
  offset?: number;
  onScroll?: (pos: { scrollTop: number }) => void;
  onReachBottom?: () => void;
  onPullToRefresh?: () => void;
  onPullToBack?: () => void;
};
type ScrollViewCoreState = {
  top: number;
  left: number;
  /** 当前滚动距离顶部的距离 */
  scrollTop: number;
  scrollable: boolean;
  /** 是否支持下拉刷新 */
  pullToRefresh: boolean;
  // pullToBack: {
  //   enabled: boolean;
  //   canBack: boolean;
  //   width: number;
  //   height: number;
  // };
  /** 下拉刷新的阶段 */
  step: PullToRefreshStep;
};
export class ScrollViewCore extends BaseDomain<TheTypesOfEvents> {
  os: EnvNeeded = {
    android: true,
    ios: false,
    pc: false,
    wechat: false,
  };

  /** 尺寸信息 */
  rect: Partial<{
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
    /** 在 y 轴方向滚动的距离 */
    scrollTop: number;
    /** 内容高度 */
    contentHeight: number;
  }> = {
    width: 0,
    height: 0,
    scrollTop: 0,
    contentHeight: 0,
  };
  canPullToRefresh: boolean;
  canReachBottom = true;
  /** 隐藏下拉刷新指示器 */
  needHideIndicator = false;
  scrollable = true;
  /** 下拉刷新相关的状态信息 */
  pullToRefresh: {
    step: PullToRefreshStep;
    /** 开始拖动的起点 y */
    pullStartY: number;
    /** 开始拖动的起点 x */
    pullStartX: number;
    /** 拖动过程中的 y */
    pullMoveY: number;
    /** 拖动过程中的 x */
    pullMoveX: number;
    /** 拖动过程 x 方向上移动的距离 */
    distX: number;
    /** 拖动过程 y 方向上移动的距离 */
    distY: number;
    /** 实际移动的距离？ */
    distResisted: number;
  } = {
    step: "pending",
    pullStartX: 0,
    pullStartY: 0,
    pullMoveX: 0,
    pullMoveY: 0,
    distX: 0,
    distY: 0,
    distResisted: 0,
  };
  /** 滚动到底部的阈值 */
  threshold = 120;

  options: ScrollViewProps;
  pullToRefreshOptions: PullToDownOptions;

  isPullToRefreshing = false;
  isLoadingMore = false;
  startPoint: { x: number; y: number } = {
    x: 0,
    y: 0,
  };
  lastPoint: { x: number; y: number } = {
    x: 0,
    y: 0,
  };
  downHight = 0;
  upHight = 0;
  maxTouchMoveInstanceY = 0;
  inTouchEnd = false;
  inTopWhenPointDown = false;
  inBottomWhenPointDown = false;
  isMoveDown = false;
  isMoveUp = false;
  isScrollTo = false;
  /**
   * 为了让 StartPullToRefresh、OutOffset 等事件在拖动过程中仅触发一次的标记
   */
  movetype: PullToRefreshStep = "pending";
  preScrollY = 0;
  /** 标记上拉已经自动执行过，避免初始化时多次触发上拉回调 */
  isUpAutoLoad = false;

  get state(): ScrollViewCoreState {
    return {
      top: 0,
      left: 0,
      step: this.movetype,
      scrollTop: this.downHight,
      pullToRefresh: this.canPullToRefresh,
      scrollable: this.scrollable,
    };
  }

  constructor(props: ScrollViewProps = {}) {
    super(props);

    const { os, offset = 80, onScroll, onReachBottom, onPullToRefresh, onPullToBack } = props;
    // console.log(props);

    this.options = props;
    if (os) {
      this.os = os;
    }
    this.pullToRefreshOptions = {
      isLock: false,
      offset,
      bottomOffset: 20,
      minAngle: 45,
    };
    this.canPullToRefresh = !!onPullToRefresh;
    if (!this.canPullToRefresh) {
      this.needHideIndicator = true;
    }
    // console.log("[DOMAIN]ui/scroll-view", this.unique_id, onPullToRefresh, this.needHideIndicator, this.canPullToRefresh);
    if (this.needHideIndicator) {
      this.pullToRefreshOptions.offset = 9999;
    }
    if (onScroll) {
      this.onScroll(onScroll);
    }
    if (onReachBottom) {
      this.onReachBottom(onReachBottom);
    }
    if (onPullToRefresh) {
      this.onPullToRefresh(onPullToRefresh);
    }
    if (handler) {
      handler(this);
    }
  }
  setReady() {
    this.emit(Events.Mounted);
  }
  setRect(rect: Partial<{ width: number; height: number; contentHeight: number }>) {
    this.rect = {
      ...this.rect,
      ...rect,
    };
  }
  /** 显示下拉进度布局 */
  startPullToRefresh = () => {
    // console.log("[DOMAIN]ScrollView - startPullToRefresh", this.isPullToRefreshing);
    if (this.isPullToRefreshing) {
      return;
    }
    this.isPullToRefreshing = true;
    this.downHight = this.pullToRefreshOptions.offset;
    this.setIndicatorHeightTransition(true);
    this.changeIndicatorHeight(this.downHight);
    this.emit(Events.PullToRefresh);
  };
  /** 结束下拉刷新 */
  finishPullToRefresh = () => {
    if (!this.isPullToRefreshing) {
      return;
    }
    this.downHight = 0;
    this.changeIndicatorHeight(0);
    this.isPullToRefreshing = false;
    this.emit(Events.PullToRefreshFinished);
  };
  disablePullToRefresh = () => {
    this.pullToRefreshOptions.isLock = true;
  };
  enablePullToRefresh = () => {
    this.pullToRefreshOptions.isLock = false;
  };
  handleMouseDown = (event: MouseEvent) => {
    this.handlePointDown(event);
  };
  handleMouseMove = (event: MouseEvent) => {
    this.handlePointMove(event);
  };
  handleTouchStart = (event: TouchEvent) => {
    // @ts-ignore
    this.handlePointDown(event);
  };
  handleTouchMove = (event: TouchEvent) => {
    // @ts-ignore
    this.handlePointMove(event);
  };
  /** 鼠标/手指按下 */
  handlePointDown = (e: PointEvent) => {
    if (this.isScrollTo) {
      // 如果列表执行滑动事件，则阻止事件，优先执行 scrollTo 方法
      preventDefault(e);
    }
    const startPoint = getPoint(e);
    if (startPoint.x < 30) {
      preventDefault(e);
      return;
    }
    this.startPoint = startPoint;
    this.lastPoint = this.startPoint;
    this.maxTouchMoveInstanceY = this.getBodyHeight() - this.pullToRefreshOptions.bottomOffset;
    this.inTouchEnd = false;
    const scrollTop = this.getScrollTop();
    // const clientHeight = this.getScrollClientHeight();
    // const height = this.getScrollHeight();
    this.inTopWhenPointDown = scrollTop === 0;
    // this.inBottomWhenPointDown = scrollTop + clientHeight + 1 >= height;
  };
  /** 鼠标/手指移动 */
  handlePointMove = (e: PointEvent) => {
    // console.log("[DOMAIN]ScrollView - handlePointMove");
    if (!this.startPoint) {
      return;
    }
    // 当前滚动条的距离
    const scrollTop = this.getScrollTop();
    if (scrollTop > 0) {
      this.inTopWhenPointDown = false;
    }
    const curPoint = getPoint(e);
    const instanceY = curPoint.y - this.startPoint.y;
    console.log("[DOMAIN]ScrollView - handlePointMove", scrollTop, instanceY);
    if (instanceY > 0) {
      if (scrollTop <= 0) {
        preventDefault(e);
        if (this.canPullToRefresh && !this.inTouchEnd && !this.isPullToRefreshing) {
          if (!this.inTopWhenPointDown) {
            return;
          }
          const angle = getAngleByPoints(this.lastPoint, curPoint);
          if (angle && angle < this.pullToRefreshOptions.minAngle) {
            return;
          }
          // 如果手指的位置超过配置的距离，则提前结束下拉，避免 Webview 嵌套导致 touchend 无法触发
          if (this.maxTouchMoveInstanceY > 0 && curPoint.y >= this.maxTouchMoveInstanceY) {
            this.inTouchEnd = true;
            this.handleTouchEnd();
            return;
          }
          // console.log("before this.downHight < this.optDown.offset");
          if (this.downHight < this.pullToRefreshOptions.offset) {
            if (this.movetype !== "pulling") {
              if (this.movetype === "pending") {
                // console.log("start");
                this.setIndicatorHeightTransition(false);
                if (this.os.ios && !this.inTopWhenPointDown) {
                  this.optimizeScroll(true);
                }
              }
              if (this.movetype === "releasing") {
                // console.log("recover");
              }
              this.movetype = "pulling";
              this.emit(Events.InDownOffset);
              this.isMoveDown = true;
            }
          } else {
            if (this.movetype !== "releasing") {
              this.movetype = "releasing";
              this.emit(Events.OutDownOffset);
              this.isMoveDown = true;
            }
          }
          this.downHight = damping(curPoint.y - this.startPoint.y, 1000);
          this.changeIndicatorHeight(this.downHight);
          this.emit(Events.Pulling, {
            instance: this.downHight,
          });
        }
      }
    }
    if (instanceY < 0) {
      const scrollHeight = this.getScrollHeight();
      const clientHeight = this.getScrollClientHeight();
      const toBottom = scrollHeight - clientHeight - scrollTop;
      if (toBottom <= 0) {
        preventDefault(e);
      }
    }
    this.lastPoint = curPoint;
  };
  handleTouchEnd = () => {
    if (!this.canPullToRefresh) {
      return;
    }
    if (!this.isMoveDown) {
      return;
    }
    // console.log('handle touch end', this.unique_id, this.downHight, this.pullToRefreshOptions.offset)
    if (this.downHight >= this.pullToRefreshOptions.offset) {
      this.startPullToRefresh();
    } else {
      this.downHight = 0;
      this.setIndicatorHeightTransition(true);
      this.changeIndicatorHeight(0);
    }
    this.optimizeScroll(false);
    this.movetype = "pending";
    this.isMoveDown = false;
  };
  handleScrolling = () => {
    const scrollTop = this.getScrollTop();
    const isUp = scrollTop - this.preScrollY > 0;
    if (!this.isLoadingMore) {
      const toBottom = this.getScrollHeight() - this.getScrollClientHeight() - scrollTop;
      if (toBottom <= this.threshold && isUp) {
        // 如果滚动条距离底部指定范围内且向上滑,则执行上拉加载回调
        // this.startReachBottom();
        this.isLoadingMore = true;
        this.emit(Events.ReachBottom);
      }
    }
    this.emit(Events.Scrolling, { scrollTop });
  };
  finishLoadingMore() {
    this.isLoadingMore = false;
  }
  setMounted() {
    this.emit(Events.Mounted);
  }
  refreshRect() {
    console.log("请在 connect 中实现 refreshRect 方法");
  }
  setBounce = (isBounce: boolean) => {
    console.log("请在 connect 中实现 setBounce 方法");
  };
  changeIndicatorHeight(height: number) {
    console.log("请在 connect 中实现 changeDownIndicatorHeight 方法");
  }
  setIndicatorHeightTransition(set: boolean) {
    console.log("请在 connect 中实现 addDownIndicatorHeightTransition 方法");
  }
  optimizeScroll(optimize: boolean) {
    console.log("请在 connect 中实现 optimizeScroll 方法");
  }
  hideIndicator = () => {
    console.log("请在 connect 中实现 hideIndicator 方法");
  };
  /**
   * 滑动列表到指定位置
   * 带缓冲效果 (y=0 回到顶部；如果要滚动到底部可以传一个较大的值，比如 99999)
   */
  scrollTo = (position: Partial<{ left: number; top: number }>, duration = 300) => {
    console.log("请在 connect 中实现 scrollTo 方法");
  };
  /* 滚动条到底部的距离 */
  getToBottom() {
    return this.getScrollHeight() - this.getScrollClientHeight() - this.getScrollTop();
  }
  /* 获取元素到 mescroll 滚动列表顶部的距离 */
  getOffsetTop(dom: unknown) {
    console.log("请在 connect 中实现 getScrollHeight 方法");
    return 0;
  }
  /* 滚动内容的高度 */
  getScrollHeight() {
    console.log("请在 connect 中实现 getScrollHeight 方法");
    return 0;
  }
  /** 获取滚动容器的高度 */
  getScrollClientHeight() {
    console.log("请在 connect 中实现 getClientHeight 方法");
    return 0;
  }
  /* 滚动条的位置 */
  getScrollTop() {
    console.log("请在 connect 中实现 getScrollTop 方法");
    return 0;
  }
  /* 设置滚动条的位置 */
  setScrollTop(y: number) {
    console.log("请在 connect 中实现 setScrollTop 方法");
  }
  /* body的高度 */
  getBodyHeight() {
    console.log("请在 connect 中实现 getBodyHeight 方法");
    return 0;
  }
  /* 销毁mescroll */
  destroy = () => {
    console.error("请在 connect 中实现 destroy 方法");
  };

  inDownOffset(handler: Handler<TheTypesOfEvents[Events.InDownOffset]>) {
    return this.on(Events.InDownOffset, handler);
  }
  outDownOffset(handler: Handler<TheTypesOfEvents[Events.OutDownOffset]>) {
    return this.on(Events.OutDownOffset, handler);
  }
  onPulling(handler: Handler<TheTypesOfEvents[Events.Pulling]>) {
    return this.on(Events.Pulling, handler);
  }
  onScroll(handler: Handler<TheTypesOfEvents[Events.Scrolling]>) {
    return this.on(Events.Scrolling, handler);
  }
  onReachBottom(handler: Handler<TheTypesOfEvents[Events.ReachBottom]>) {
    return this.on(Events.ReachBottom, handler);
  }
  onPullToRefresh(handler: Handler<TheTypesOfEvents[Events.PullToRefresh]>) {
    this.canPullToRefresh = true;
    return this.on(Events.PullToRefresh, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
}
