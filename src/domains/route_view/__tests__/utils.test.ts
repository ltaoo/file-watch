import { expect, it, describe } from "vitest";

import { buildUrl } from "../utils";

describe("路径生成", () => {
  it("没有路径参数", () => {
    const path = "/home/tv";
    const params = {
      id: "1",
      type: "2",
    };
    const r = buildUrl(path, params);
    expect(r).toBe("/home/tv");
  });

  it("有一个路径参数", () => {
    const path = "/home/tv/:id";
    const params = {
      id: "1",
    };
    const r = buildUrl(path, params);
    expect(r).toBe("/home/tv/1");
  });

  it("有多个路径参数", () => {
    const path = "/home/:type/:id";
    const params = {
      id: "1",
      type: "2",
    };
    const r = buildUrl(path, params);
    expect(r).toBe("/home/2/1");
  });

  it("有 query", () => {
    const path = "/home/:type/:id";
    const params = {
      id: "1",
      type: "2",
    };
    const r = buildUrl(path, params, { season: "s01" });
    expect(r).toBe("/home/2/1?season=s01");
  });
});
