import { UnpackedResult } from "@/domains/result/index";
import { Unpacked } from "@/types";

export type BaseApiResp<T> = {
  code: number;
  msg: string;
  data: T;
};
export type ListResponse<T> = {
  total: number;
  page: number;
  page_size: number;
  no_more: boolean;
  list: T[];
};
export type ListResponseWithCursor<T> = {
  page_size: number;
  next_marker?: string;
  total: number;
  list: T[];
};
export type RequestedResource<T extends (...args: any[]) => any> = UnpackedResult<Unpacked<ReturnType<T>>>;
