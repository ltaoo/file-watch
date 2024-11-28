/**
 * @file tauri 请求
 */
import { HttpClientCore } from "@/domains/http_client/index";
import { connect } from "@/domains/http_client/connect.tauri";

export const client = new HttpClientCore({
  headers: {},
});
connect(client);
