/**
 * esbuild src/domains/qrcode/index.ts --outfile=dist/qrcode.js --format=esm --bundle --minify
 */
import { QRErrorCorrectLevel, QRCodeModel, _getTypeNumber } from "./libs";
import { QRcodeDrawing } from "./types";

type CanvasDrawingOptions = {
  width: number;
  height: number;
  colorDark: string;
  colorLight: string;
};
type QrcodeOptions = CanvasDrawingOptions & {
  text: string;
  width: number;
  height: number;
  colorDark: string;
  colorLight: string;
  typeNumber: number;
  correctLevel: number;
};

/**
 * @class QRCode
 * @constructor
 * @example
 * new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
 *
 * @example
 * var oQRCode = new QRCode("test", {
 *    text : "http://naver.com",
 *    width : 128,
 *    height : 128
 * });
 *
 * oQRCode.clear(); // Clear the QRCode.
 * oQRCode.makeCode("http://map.naver.com"); // Re-create the QRCode.
 *
 * @param {Object|String} vOption
 * @param {String} vOption.text QRCode link data
 * @param {Number} [vOption.width=256]
 * @param {Number} [vOption.height=256]
 * @param {String} [vOption.colorDark="#000000"]
 * @param {String} [vOption.colorLight="#ffffff"]
 * @param {QRCode.CorrectLevel} [vOption.correctLevel=QRCode.CorrectLevel.H] [L|M|Q|H]
 */
export class QRCode {
  /**
   * @name QRCode.CorrectLevel
   */
  static CorrectLevel = QRErrorCorrectLevel;

  _htOption: QrcodeOptions;
  _oQRCode: null | QRCodeModel = null;
  //   _oDrawing: QRcodeDrawing;

  constructor(vOption?: Partial<QrcodeOptions> | string) {
    this._htOption = {
      width: 256,
      height: 256,
      typeNumber: 4,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRErrorCorrectLevel.H,
      text: "",
    };
    const options: Partial<QrcodeOptions> = (() => {
      if (typeof vOption === "string") {
        return {
          text: vOption,
        };
      }
      return vOption || {};
    })();
    // Overwrites options
    for (const key in options) {
      // @ts-ignore
      this._htOption[key] = options[key];
    }
    // if (this._htOption.useSVG) {
    //     CanvasDrawing = svgDrawer;
    // }
    this._oQRCode = null;
    //     this._oDrawing = new CanvasDrawing(this._htOption);
  }

  /**
   * Make the QRCode
   *
   * @param {String} sText link data
   */
  fetchModel(sText: string, options: { logo?: string } = {}) {
    if ([undefined, null, ""].includes(sText)) {
      console.error("二维码内容不能为空");
      return null;
    }
    this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
    this._oQRCode.addData(sText);
    this._oQRCode.make();
    return this._oQRCode;
    //     this._oDrawing.draw(this._oQRCode);
    //     const { logo } = options;
    //     if (logo !== undefined) {
    //       await this._oDrawing.drawLogo.call(this, logo);
    //     }
    //     return this._oDrawing._elCanvas.toDataURL();
  }

  /**
   * Make the Image from Canvas element
   * - It occurs automatically
   * - Android below 3 doesn't support Data-URI spec.
   *
   * @private
   */
  // makeImage() {
  //   if (typeof this._oDrawing.makeImage === "function") {
  //     this._oDrawing.makeImage();
  //   }
  // }

  /**
   * Clear the QRCode
   */
  //   clear() {
  //     this._oDrawing.clear();
  //   }
}
