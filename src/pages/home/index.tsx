/**
 * @file 首页
 */
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import dayjs from "dayjs";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { base, Handler } from "@/domains/base";
import { DragZoneCore } from "@/domains/ui/drag-zone";
import { DropArea } from "@/components/ui/drop-area";
import { RequestCore } from "@/domains/request";
import { fetch_file_profile, stop_watch_folder, watch_folder } from "@/biz/services";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui";
import { ButtonCore } from "@/domains/ui";

function HomeIndexPageCore(props: ViewComponentProps) {
  const { app } = props;

  const requests = {
    fetchFileProfile: new RequestCore(fetch_file_profile),
    watchFolder: new RequestCore(watch_folder),
    stopWatchFolder: new RequestCore(stop_watch_folder),
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
      $dragZone.clear();
      return;
    }
    if (_watching) {
      cancelWatch();
    }
    _messages = [];
    _folder = "";
    bus.emit(Events.Change, { ...state });
    const file = files[0];
    const r = await requests.fetchFileProfile.run(file);
    if (r.error) {
      app.tip({
        text: [r.error.message],
      });
      return;
    }
    console.log(r.data);
    if (r.data.file_type === "File") {
      app.tip({
        text: ["暂不支持监听文件"],
      });
      $dragZone.clear();
      return;
    }
    _folder = file;
    bus.emit(Events.Change, { ...state });
  });
  const $btn = new ButtonCore({
    async onClick() {
      if (!_watching) {
        startWatch();
        return;
      }
      cancelWatch();
    },
  });

  let _folder = "";
  let _watching = false;
  let _messages: { type: string; paths: string[]; time: string }[] = [];
  const state = {
    get folder() {
      return _folder;
    },
    get watching() {
      return _watching;
    },
    get messages() {
      return _messages;
    },
  };

  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof state;
  };
  const bus = base<TheTypesOfEvents>();

  async function startWatch() {
    if (!_folder) {
      app.tip({
        text: ["没有文件夹"],
      });
      return;
    }
    if (_watching) {
      app.tip({
        text: ["已经在监听", _folder],
      });
      return;
    }
    $btn.setLoading(true);
    const r2 = await requests.watchFolder.run(_folder);
    $btn.setLoading(false);
    if (r2.error) {
      app.tip({
        text: [r2.error.message],
      });
      return;
    }
    _watching = true;
    bus.emit(Events.Change, { ...state });
    app.tip({
      text: ["开始监听", _folder],
    });
  }
  async function cancelWatch() {
    if (!_folder) {
      app.tip({
        text: ["没有文件夹"],
      });
      return;
    }
    if (!_watching) {
      return;
    }
    $btn.setLoading(true);
    const r = await requests.stopWatchFolder.run(_folder);
    $btn.setLoading(false);
    if (r.error) {
      app.tip({
        text: [r.error.message],
      });
      return;
    }
    _watching = false;
    bus.emit(Events.Change, { ...state });
    app.tip({
      text: ["已停止监听", _folder],
    });
  }

  listen<{ change_type: string; paths: string[] }>("data", (event) => {
    const { change_type: type, paths } = event.payload;
    if (type === "") {
      return;
    }
    _messages.unshift({
      type,
      paths,
      time: dayjs().format("YYYY/MM/DD HH:mm:ss"),
    });
    bus.emit(Events.Change, { ...state });
  });

  return {
    state,
    ui: {
      $dragZone,
      $btn,
    },
    async ready() {},
    cancelWatch,
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export const HomeIndexPage: ViewComponent = (props) => {
  const $page = HomeIndexPageCore(props);

  const [state, setState] = createSignal($page.state);

  $page.onChange((v) => setState(v));

  onMount(() => {});
  onCleanup(() => {
    $page.cancelWatch();
  });

  return (
    <div class="min-h-screen relative flex flex-col bg-[#f8f9fa]">
      <DropArea store={$page.ui.$dragZone}>
        <Show when={state().folder}>
          <div class="flex w-[360px] mx-auto">
            <img class="w-[120px] mx-auto object-contain" src="/folder.png" />
            <div class="ml-4 mt-2 text-xl">
              <div class="flex">
                <div class=" h-[58px] overflow-hidden break-all whitespace-pre-wrap truncate line-clamp-2 text-ellipsis">
                  {state().folder}
                </div>
              </div>
              <div class="mt-2">
                <Button store={$page.ui.$btn}>{state().watching ? "停止监听" : "开始监听"}</Button>
              </div>
            </div>
          </div>
        </Show>
      </DropArea>
      <div class="flex-1 overflow-y-auto absolute top-[128px] bottom-0 w-full p-8 space-y-4">
        <For each={state().messages}>
          {(msg) => {
            return (
              <div class="p-2 border rounded-md">
                <div class="flex items-center">
                  <div class="p-2 rounded-md text-sm">{msg.type}</div>
                  <div class="text-gray-600 text-sm">{msg.time}</div>
                </div>
                <div class="mt-2 p-2 rounded-md bg-gray-200">
                  <For each={msg.paths}>
                    {(path) => {
                      return <div>{path}</div>;
                    }}
                  </For>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
