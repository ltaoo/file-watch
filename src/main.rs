#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ui;

use gpui::{
    App, AppContext, Application, Bounds, KeyBinding, TitlebarOptions, WindowBounds, WindowOptions,
    px, size,
};

fn main() {
    let initial_folder = std::env::args_os().nth(1).map(std::path::PathBuf::from);
    Application::with_platform(gpui_platform::current_platform(false))
        .with_assets(gpuikit::assets())
        .run(move |cx: &mut App| {
            gpuikit::init(cx);
            ui::init_theme(cx);
            cx.bind_keys([
                KeyBinding::new("secondary-o", ui::OpenFolder, Some("FileWatch")),
                KeyBinding::new("secondary-enter", ui::ToggleWatch, Some("FileWatch")),
                KeyBinding::new("secondary-l", ui::ClearRecords, Some("FileWatch")),
                KeyBinding::new("secondary-q", ui::Quit, None),
            ]);
            cx.on_action(|_: &ui::Quit, cx| cx.quit());
            cx.on_window_closed(|cx, _| {
                if cx.windows().is_empty() {
                    cx.quit();
                }
            })
            .detach();
            let bounds = Bounds::centered(None, size(px(860.), px(640.)), cx);
            if let Err(error) = cx.open_window(
                WindowOptions {
                    window_bounds: Some(WindowBounds::Windowed(bounds)),
                    window_min_size: Some(size(px(600.), px(420.))),
                    titlebar: Some(TitlebarOptions {
                        title: Some("FileWatch".into()),
                        ..Default::default()
                    }),
                    ..Default::default()
                },
                move |window, cx| cx.new(|cx| ui::FileWatch::new(initial_folder, window, cx)),
            ) {
                eprintln!("无法打开 FileWatch：{error:#}");
                cx.quit();
                return;
            }
            cx.activate(true);
        });
}
