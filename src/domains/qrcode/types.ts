import { QRCodeModel } from "./libs";

/**
 * @file web 端使用 canvas 绘制二维码
 */
export type DrawingOptions = {
  width: number;
  height: number;
  colorDark: string;
  colorLight: string;
};

/** 绘制器 */
export abstract class QRcodeDrawing {
  constructor(options: DrawingOptions) {}

  /** 在二维码中间绘制 Logo */
  abstract drawLogo(img: string): Promise<void>;
  /** 绘制二维码 */
  abstract draw(data: QRCodeModel): void;
  /** 清除绘制的二维码 */
  abstract clear(): void;
  /** 是否完成绘制 */
  abstract isPainted(): boolean;
  /** 对一个数字做处理 */
  abstract round(v: number): number;
}
