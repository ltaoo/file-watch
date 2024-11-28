/**
 * 根据点击滑动事件获取第一个手指的坐标
 */
export function getPoint(e: { touches?: { pageX: number; pageY: number }[]; clientX?: number; clientY?: number }) {
  if (e.touches) {
    return {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY,
    };
  }
  if (e.clientX && e.clientY) {
    return {
      x: e.clientX,
      y: e.clientY,
    };
  }
  return {
    x: 0,
    y: 0,
  };
}

/**
 * 阻止浏览器默认事件
 */
export function preventDefault(e: { cancelable?: boolean; defaultPrevented?: boolean; preventDefault?: () => void }) {
  // cancelable:是否可以被禁用; defaultPrevented:是否已经被禁用
  if (e && e.cancelable && !e.defaultPrevented && e.preventDefault) {
    e.preventDefault();
  }
}

/**
 * 阻尼效果
 * 代码来自 https://www.jianshu.com/p/3e3aeab63555
 */
export function damping(x: number, max: number) {
  let y = Math.abs(x);
  y = (0.82231 * max) / (1 + 4338.47 / Math.pow(y, 1.14791));
  return Math.round(x < 0 ? -y : y);
}

export function getAngleByPoints(lastPoint: { x: number; y: number }, curPoint: { x: number; y: number }) {
  const x = Math.abs(lastPoint.x - curPoint.x);
  const y = Math.abs(lastPoint.y - curPoint.y);
  const z = Math.sqrt(x * x + y * y);
  if (z !== 0) {
    const angle = (Math.asin(y / z) / Math.PI) * 180;
    return angle;
  }
  return 0;
}
