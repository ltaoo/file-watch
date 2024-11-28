import { query_stringify } from "@/utils";
import { JSONObject } from "@/types";

export function buildUrl(key: string, params?: JSONObject, query?: Parameters<typeof query_stringify>[0]) {
  const search = (() => {
    if (!query || Object.keys(query).length === 0) {
      return "";
    }
    return "?" + query_stringify(query);
  })();
  const url = (() => {
    if (!key.match(/:[a-z]{1,}/)) {
      return key + search;
    }
    if (!params || Object.keys(params).length === 0) {
      return key + search;
    }
    return (
      key.replace(/:([a-z]{1,})/g, (...args: string[]) => {
        const [, field] = args;
        const value = String(params[field] || "");
        return value;
      }) + search
    );
  })();
  return url;
}

export type OriginalRouteConfigure = Record<
  PathnameKey,
  {
    title: string;
    pathname: string;
    options?: Partial<{
      keep_alive?: boolean;
      animation?: Partial<{
        in: string;
        out: string;
        show: string;
        hide: string;
      }>;
      require?: string[];
    }>;
    children?: OriginalRouteConfigure;
  }
>;
export type PageKeysType<T extends OriginalRouteConfigure, K = keyof T> = K extends keyof T & (string | number)
  ?
      | `${K}`
      | (T[K] extends object
          ? T[K]["children"] extends object
            ? `${K}.${PageKeysType<T[K]["children"]>}`
            : never
          : never)
  : never;
export type PathnameKey = string;

export type RouteConfig<T> = {
  /** 使用该值定位唯一 route/page */
  name: T;
  title: string;
  pathname: PathnameKey;
  /** 是否为布局 */
  layout?: boolean;
  parent: {
    name: string;
  };
  options?: Partial<{
    require?: string[];
    keep_alive?: boolean;
    animation?: {
      in: string;
      out: string;
      show: string;
      hide: string;
    };
  }>;
  // component: unknown;
};

function apply<T>(
  configure: OriginalRouteConfigure,
  parent: null | {
    pathname: PathnameKey;
    name: T;
  } = null
): RouteConfig<T>[] {
  const routes = Object.keys(configure).map((key) => {
    const config = configure[key];
    const { title, pathname, options, children } = config;
    // 一个 hack 操作，过滤掉 root
    const name = parent ? ([parent.name, key].filter(Boolean).join(".") as T) : key;
    if (children) {
      const subRoutes = apply(children, {
        name,
        pathname,
      });
      return [
        {
          title,
          name,
          pathname,
          options,
          layout: true,
          parent: parent
            ? {
                name: parent.name,
              }
            : null,
        },
        ...subRoutes,
      ] as RouteConfig<T>[];
    }
    return [
      {
        title,
        name,
        pathname,
        options,
        parent: parent
          ? {
              name: parent.name,
            }
          : null,
      },
    ] as RouteConfig<T>[];
  });
  return routes.reduce((a, b) => {
    return a.concat(b);
  }, []);
}

export function build<T>(configure: OriginalRouteConfigure) {
  const configs = apply<T>(configure);
  const routes: Record<PathnameKey, RouteConfig<T>> = configs
    .map((a) => {
      return {
        [a.name as string]: a,
      };
    })
    .reduce((a, b) => {
      return {
        ...a,
        ...b,
      };
    }, {});
  const routesWithPathname: Record<PathnameKey, RouteConfig<T>> = configs
    .map((a) => {
      return {
        [a.pathname]: a,
      };
    })
    .reduce((a, b) => {
      return {
        ...a,
        ...b,
      };
    }, {});

  return {
    routes,
    routesWithPathname,
  };
}
