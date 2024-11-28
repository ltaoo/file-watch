import { JSX } from "solid-js/jsx-runtime";

import { Application } from "@/domains/app";
import { HistoryCore } from "@/domains/history";
import { RouteViewCore } from "@/domains/route_view";
import { RouteConfig } from "@/domains/route_view/utils";
import { ScrollViewCore } from "@/domains/ui";
import { StorageCore } from "@/domains/storage";
import { HttpClientCore } from "@/domains/http_client";

import { PageKeys } from "./routes";
import { storage } from "./storage";

export type GlobalStorageValues = (typeof storage)["values"];
export type ViewComponentProps = {
  app: Application<{ storage: typeof storage }>;
  history: HistoryCore<PageKeys, RouteConfig<PageKeys>>;
  client: HttpClientCore;
  view: RouteViewCore;
  storage: StorageCore<GlobalStorageValues>;
  pages: Omit<Record<PageKeys, ViewComponent>, "root">;
  parent?: {
    view: RouteViewCore;
    scrollView?: ScrollViewCore;
  };
};
export type ViewComponent = (props: ViewComponentProps) => JSX.Element;
