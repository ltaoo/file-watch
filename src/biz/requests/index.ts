import { request_factory } from "@/domains/request/utils";
import { Result } from "@/domains/result";

export const request = request_factory({
  hostnames: {
    dev: "",
    test: "",
    prod: "",
  },
  process<T>(r: Result<string>) {
    console.log("request result", r);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = JSON.parse(r.data);
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data as T);
  },
});
