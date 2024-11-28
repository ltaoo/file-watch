import { StorageCore } from "@/domains/storage/index";
import { Result } from "@/domains/result/index";

import { Application, MEDIA } from "./index";
import { ThemeTypes } from "./types";

export function connect<T extends { storage: StorageCore<any> }>(app: Application<T>) {
  const ownerDocument = globalThis.document;
  app.getComputedStyle = (el: HTMLElement) => {
    return window.getComputedStyle(el);
  };
  app.setTitle = (title: string) => {
    document.title = title;
  };
  app.copy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.cssText = "position: absolute; top: -999px; left: -999px;";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };
  window.addEventListener("DOMContentLoaded", (e) => {
    const { innerWidth, innerHeight } = window;
    app.setSize({ width: innerWidth, height: innerHeight });
  });
  window.addEventListener("orientationchange", function () {
    app.handleScreenOrientationChange(window.orientation);
  });
  window.addEventListener("load", () => {
    // console.log("2");
  });
  window.addEventListener("beforeunload", (event) => {
    // // 取消事件
    // event.preventDefault();
    // // Chrome 以及大部分浏览器需要返回值
    // event.returnValue = "";
    // // 弹出提示框
    // const confirmationMessage = "确定要离开页面吗？";
    // (event || window.event).returnValue = confirmationMessage;
    // return confirmationMessage;
  });
  window.addEventListener("resize", () => {
    const { innerWidth, innerHeight } = window;
    const size = {
      width: innerWidth,
      height: innerHeight,
    };
    // 旋转屏幕/进入全屏会触发这里（安卓）
    // app.handleResize(size);
  });
  window.addEventListener("blur", () => {
    app.emit(app.Events.Blur);
  });
  document.addEventListener("keydown", (event) => {
    // console.log("[DOMAIN]app/connect - keydown", event.code);
    app.keydown(event.code);
    // (() => {
    //   if (event.code === "KeyC" && (keycodes.ControlLeft || keycodes.ControlRight)) {
    //   }
    // })();
  });
  document.addEventListener("keyup", (event) => {
    app.keyup(event.code);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      app.emit(app.Events.Hidden);
      return;
    }
    app.emit(app.Events.Show);
  });
  /**
   * 环境变量 ------------
   */
  const userAgent = navigator.userAgent;
  const ua = userAgent.toLowerCase();
  const ios = /iPad|iPhone|iPod/.test(userAgent);
  const android = /Android/.test(userAgent);
  app.setEnv({
    wechat: ua.indexOf("micromessenger") !== -1,
    ios,
    android,
  });
  /**
   * 主题 ——-------------
   */
  const media = window.matchMedia(MEDIA);
  let curTheme = "light";
  const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
    console.log("[Domain]app/connect - handleMediaQuery");
    if (!e) {
      e = window.matchMedia(MEDIA);
    }
    const isDark = e.matches;
    const systemTheme = isDark ? "dark" : "light";
    curTheme = systemTheme;
    app.theme = systemTheme;
    return Result.Ok(systemTheme);
  };
  media.addListener(getSystemTheme);
  let attribute = "data-theme";
  const defaultTheme = "system";
  const defaultThemes = ["light", "dark"];
  const colorSchemes = ["light", "dark"];
  const attrs = defaultThemes;
  app.applyTheme = (theme: ThemeTypes) => {
    const d = document.documentElement;
    const name = curTheme;
    if (attribute === "class") {
      d.classList.remove(...attrs);
      if (name) d.classList.add(name);
    } else {
      if (name) {
        d.setAttribute(attribute, name);
      } else {
        d.removeAttribute(attribute);
      }
    }
    const fallback = colorSchemes.includes(defaultTheme) ? defaultTheme : null;
    const colorScheme = colorSchemes.includes(curTheme) ? curTheme : fallback;
    // @ts-ignore
    d.style.colorScheme = colorScheme;
    return Result.Ok(null);
  };
  app.getSystemTheme = getSystemTheme;
  app.setTheme = (theme: ThemeTypes) => {
    app.theme = theme;
    app.emit(app.Events.StateChange, { ...app.state });
    app.$storage.set("theme", theme);
  };
  const { availHeight, availWidth } = window.screen;
  if (window.navigator.userAgent.match(/iphone/i)) {
    const matched = [
      // iphonex iphonexs iphone12mini
      "375-812",
      // iPhone XS Max iPhone XR
      "414-896",
      // iPhone pro max iPhone14Plus
      "428-926",
      // iPhone 12/pro 13/14  753
      "390-844",
      // iPhone 14Pro
      "393-852",
      // iPhone 14ProMax
      "430-932",
    ].includes(`${availWidth}-${availHeight}`);
    app.safeArea = !!matched;
  }
  // ownerDocument.addEventListener("keydown", (event) => {
  //   const { key } = event;
  //   app.keydown({ key });
  // });

  const originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
  app.disablePointer = () => {
    ownerDocument.body.style.pointerEvents = "none";
  };
  app.enablePointer = () => {
    ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
  };
}
