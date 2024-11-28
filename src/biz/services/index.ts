import { request } from "@/biz/requests";

/**
 * 开始监听指定目录
 */
export function watch_folder(dir: string) {
  return request.post("watch_folder", {
    pathToWatch: dir,
  });
}
/**
 * 取消监听指定目录
 */
export function stop_watch_folder(dir: string) {
  return request.post("cancel_watch_folder", {
    pathToWatch: dir,
  });
}
/**
 * 获取指定路径文件/文件夹信息
 */
export function fetch_file_profile(dir: string) {
  return request.post<{ file_type: string }>("fetch_file_profile", {
    path: dir,
  });
}
