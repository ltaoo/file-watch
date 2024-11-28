type NumType = number | string;

/**
 * @desc 解决浮动运算问题，避免小数点后产生多位数和计算精度损失。
 * 问题示例：2.3 + 2.4 = 4.699999999999999，1.0 - 0.9 = 0.09999999999999998
 */

/**
 * 是否有效的数字
 * @param num
 * @returns
 */
function isValidNum(num: any) {
  return typeof num === "string" || typeof num === "number";
}

/**
 * 把错误的数据转正
 * strip(0.09999999999999998)=0.1
 */
function strip(num: NumType, precision = 15): number {
  return +parseFloat(Number(num).toPrecision(precision));
}

/**
 * Return digits length of a number
 * @param {*number} num Input number
 */
function digitLength(num: NumType): number {
  // Get digit length of e
  const eSplit = num.toString().split(/[eE]/);
  const len = (eSplit[0].split(".")[1] || "").length - +(eSplit[1] || 0);
  return len > 0 ? len : 0;
}

/**
 * 把小数转成整数，支持科学计数法。如果是小数则放大成整数
 * @param {*number} num 输入数
 */
function float2Fixed(num: NumType): number {
  if (num.toString().indexOf("e") === -1) {
    return Number(num.toString().replace(".", ""));
  }
  const dLen = digitLength(num);
  return dLen > 0 ? strip(Number(num) * Math.pow(10, dLen)) : Number(num);
}

/**
 * 检测数字是否越界，如果越界给出提示
 * @param {*number} num 输入数
 */
function checkBoundary(num: number) {
  if (_boundaryCheckingState) {
    if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
      console.warn(`${num} is beyond boundary when transfer to integer, the results may not be accurate`);
    }
  }
}

/**
 * 精确乘法
 */
function mul(num1: NumType, num2: NumType, ...others: NumType[]): number {
  if (!(isValidNum(num1) && isValidNum(num2))) return Number.NaN;
  if (others.length > 0) {
    return mul(mul(num1, num2), others[0], ...others.slice(1));
  }
  const num1Changed = float2Fixed(num1);
  const num2Changed = float2Fixed(num2);
  const baseNum = digitLength(num1) + digitLength(num2);
  const leftValue = num1Changed * num2Changed;

  checkBoundary(leftValue);

  return leftValue / Math.pow(10, baseNum);
}

/**
 * 精确加法
 */
function add(num1: NumType, num2: NumType, ...others: NumType[]): number {
  if (!(isValidNum(num1) && isValidNum(num2))) return Number.NaN;
  if (others.length > 0) {
    return add(add(num1, num2), others[0], ...others.slice(1));
  }
  const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
  return (mul(num1, baseNum) + mul(num2, baseNum)) / baseNum;
}

/**
 * 精确减法
 */
function sub(num1: NumType, num2: NumType, ...others: NumType[]): number {
  if (!(isValidNum(num1) && isValidNum(num2))) return Number.NaN;
  if (others.length > 0) {
    return sub(sub(num1, num2), others[0], ...others.slice(1));
  }
  const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
  return (mul(num1, baseNum) - mul(num2, baseNum)) / baseNum;
}

/**
 * 精确除法
 */
function div(num1: NumType, num2: NumType, ...others: NumType[]): number {
  if (!(isValidNum(num1) && isValidNum(num2))) return Number.NaN;
  if (others.length > 0) {
    return div(div(num1, num2), others[0], ...others.slice(1));
  }
  const num1Changed = float2Fixed(num1);
  const num2Changed = float2Fixed(num2);
  checkBoundary(num1Changed);
  checkBoundary(num2Changed);
  // fix: 类似 10 ** -4 为 0.00009999999999999999，strip 修正
  return mul(num1Changed / num2Changed, strip(Math.pow(10, digitLength(num2) - digitLength(num1))));
}

/**
 * 四舍五入
 */
function round(num: NumType, ratio: number): number {
  const base = Math.pow(10, ratio);
  let result = div(Math.round(Math.abs(mul(num, base))), base);
  if (Number(num) < 0 && result !== 0) {
    result = mul(result, -1);
  }
  return result;
}

let _boundaryCheckingState = false;
/**
 * 是否进行边界检查，默认开启
 * @param flag 标记开关，true 为开启，false 为关闭，默认为 true
 */
function enableBoundaryChecking(flag = true) {
  _boundaryCheckingState = flag;
}

export const math = {
  add,
  sub,
  mul,
  div,
  enableBoundaryChecking,
};
