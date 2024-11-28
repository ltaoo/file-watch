import { request_factory } from "@/domains/request/utils";
import { Result } from "@/domains/result";

export const request = request_factory({
  hostnames: {
    dev: "",
    test: "",
    prod: "",
  },
  process<T>(r: Result<{ code: number | string; msg: string; data: T }>) {
    console.log("request result", r);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
});
