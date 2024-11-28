/**
 * @file 首页
 */
import { createSignal, For, Show } from "solid-js";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { base, Handler } from "@/domains/base";
import { DragZoneCore } from "@/domains/ui/drag-zone";
import { DropArea } from "@/components/ui/drop-area";
import { RequestCore } from "@/domains/request";
import { fetch_file_profile } from "@/biz/services";

function HomeIndexPageCore(props: ViewComponentProps) {
  const { app } = props;

  const requests = {
    fetchFileProfile: new RequestCore(fetch_file_profile),
  };
  const $dragZone = new DragZoneCore();
  $dragZone.onChange(async (files: string[]) => {
    if (files.length === 0) {
      app.tip({
        text: ["请拖动文件夹到此处"],
      });
      return;
    }
    if (files.length > 1) {
      app.tip({
        text: ["暂支持单个文件夹"],
      });
      return;
    }
    const file = files[0];
    const r = await requests.fetchFileProfile.run(file);
    if (r.error) {
      console.log(r.error.message);
      return;
    }
    console.log(r.data);
  });

  const state = {};

  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof state;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    state,
    ui: {
      $dragZone,
    },
    async ready() {},
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export const HomeIndexPage: ViewComponent = (props) => {
  const $page = HomeIndexPageCore(props);

  const [state, setState] = createSignal($page.state);

  $page.onChange((v) => setState(v));

  return (
    <div class="bg-[#f8f9fa] min-h-screen">
      <DropArea store={$page.ui.$dragZone}>
        <div
          classList={{
            "__a relative w-[120px] h-[120px]": true,
          }}
        ></div>
      </DropArea>
    </div>
  );
};
