import { QRCodeModel } from "./libs";
import { DrawingOptions, QRcodeDrawing } from "./types";

/**
 * Drawing QRCode by using canvas
 *
 * @constructor
 * @param {Object} htOption QRCode Options
 */
export class CanvasDrawing implements QRcodeDrawing {
  options: DrawingOptions;
  _bIsPainted: boolean;
  _elCanvas: HTMLCanvasElement;
  _oContext: CanvasRenderingContext2D;
  _bSupportDataURI: null;
  _oDrawing: CanvasDrawing | null = null;

  constructor(htOption: DrawingOptions) {
    this._bIsPainted = false;
    // this._android = _getAndroid();

    this.options = htOption;
    this._elCanvas = document.createElement("canvas");
    this._elCanvas.width = htOption.width;
    this._elCanvas.height = htOption.height;
    this._oContext = this._elCanvas.getContext("2d")!;
    this._bIsPainted = false;
    this._bSupportDataURI = null;
  }

  /**
   * 绘制 logo
   */
  async drawLogo(img: string): Promise<void> {
    const ctx = this._oContext;
    return new Promise((resolve, reject) => {
      const image = document.createElement("img");
      image.src = img;
      image.crossOrigin = "anonymous";
      image.onload = (event) => {
        const { target } = event;
        // (256 / 2) - (48 / 2) === 104
        const size = 54;
        const x = 256 / 2 - size / 2;
        ctx.drawImage(image, x, x, size, size);
        resolve();
      };
      image.onerror = () => {
        reject(new Error("logo loaded failed"));
      };
    });
  }
  /**
   * Draw the QRCode
   *
   * @param {QRCode} model
   */
  draw(model: QRCodeModel) {
    const { _oContext } = this;
    const { options: _htOption } = this;
    const nCount = model.getModuleCount();
    const nWidth = _htOption.width / nCount;
    const nHeight = _htOption.height / nCount;
    const nRoundedWidth = Math.round(nWidth);
    const nRoundedHeight = Math.round(nHeight);

    this.clear();

    for (let row = 0; row < nCount; row++) {
      for (let col = 0; col < nCount; col++) {
        const bIsDark = model.isDark(row, col);
        const nLeft = col * nWidth;
        const nTop = row * nHeight;
        _oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
        _oContext.lineWidth = 1;
        _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
        _oContext.fillRect(nLeft, nTop, nWidth, nHeight);
        _oContext.strokeRect(Math.floor(nLeft) + 0.5, Math.floor(nTop) + 0.5, nRoundedWidth, nRoundedHeight);
        _oContext.strokeRect(Math.ceil(nLeft) - 0.5, Math.ceil(nTop) - 0.5, nRoundedWidth, nRoundedHeight);
      }
    }
    this._bIsPainted = true;
  }

  /**
   * Make the image from Canvas if the browser supports Data URI.
   */
  // makeImage() {
  //   if (this._bIsPainted) {
  //     _safeSetDataURI.call(this, _onMakeImage);
  //   }
  // }

  /**
   * Return whether the QRCode is painted or not
   *
   * @return {Boolean}
   */
  isPainted() {
    return this._bIsPainted;
  }

  /**
   * Clear the QRCode
   */
  clear() {
    this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
    this._bIsPainted = false;
  }

  /**
   * @private
   * @param {Number} nNumber
   */
  round(nNumber: number) {
    if (!nNumber) {
      return nNumber;
    }

    return Math.floor(nNumber * 1000) / 1000;
  }
}
