# FileWatch

使用 Rust + [GPUI](https://www.gpui.rs/) + [gpuikit](https://github.com/iamnbutler/gpuikit) 实现的原生文件夹监听工具。应用直接渲染原生窗口，无需 Node.js 或 WebView。

## 运行与构建

需要 Rust 1.96 或更新版本，以及当前平台的原生编译工具。

```sh
cargo run --locked
# 启动时预选文件夹（仍需点击「开始监听」）
cargo run --locked -- /path/to/folder
# 生成发行版可执行文件
cargo build --release --locked
```

可执行文件位于 `target/release/file-watch`（Windows 为 `file-watch.exe`）。macOS 使用运行时 Metal shader，无需安装 Xcode 的 Metal 编译组件；仍需 Command Line Tools。Linux 构建需要 GPUI 使用的窗口系统、字体库及音频开发依赖；具体依赖以 [GPUI 官方说明](https://github.com/zed-industries/zed/tree/main/crates/gpui) 为准。本地已完成 macOS release 构建、测试及打包，以及 Linux ARM64 容器的编译和测试；四个平台的最终构建结果由 GitHub Actions 验证。

## 功能

- 通过原生选择器选择文件夹，或将单个文件夹拖入窗口。
- 手动开始、停止递归监听，覆盖所有子文件夹。
- 记录创建、内容修改、属性修改、重命名及删除，并显示路径和时间。
- 最新记录在前，保留最近 2,000 条；列表按需渲染，点击路径可复制完整路径。
- 停止监听后保留记录；切换到有效的新文件夹时停止旧监听并清空记录。
- 支持清空记录和关闭提示音；音频随可执行文件内嵌。
- 监听失败、音频失败和事件队列溢出会在底部显示；根文件夹被删除或移走后停止监听。

快捷键：macOS 使用 `⌘`，其他平台使用 `Ctrl`。

| 快捷键 | 操作 |
| --- | --- |
| `⌘/Ctrl + O` | 选择文件夹 |
| `⌘/Ctrl + Enter` | 开始 / 停止监听 |
| `⌘/Ctrl + L` | 清空记录 |
| `⌘/Ctrl + Q` | 退出 |

文件事件由操作系统提供，不同平台可能合并或拆分事件，重命名也可能以旧路径和新路径的独立事件出现。此工具用于观察实时变化，记录不持久化；事件超过队列容量时会显示跳过数量。

## 验证

```sh
cargo fmt --check
cargo check --all-targets --locked
cargo clippy --all-targets --locked -- -D warnings
cargo test --locked
cargo build --locked
```

测试覆盖事件分类、路径验证、真实文件系统的递归创建/修改/重命名/删除、监听会话隔离、记录容量和内嵌音频解码。界面行为需手动验证：运行后选择或拖入文件夹，开始监听并修改子文件夹内容，然后检查停止/重启、切换目录、提示音、快捷键及关闭窗口。

## 代码

- `src/main.rs`：原生应用入口及快捷键。
- `src/ui.rs`：gpuikit 控件、原生选择器、拖放和虚拟列表，保留原有浅色背景及中性卡片样式。
- `src/watch.rs`：跨平台 `RecommendedWatcher` 及有界事件队列。
- `src/history.rs`：有界变更记录。
- `src/sound.rs`：单个可退出的音频线程及播放节流。

## 自动发布

[Build and release](.github/workflows/release.yml) 在推送到 `main` 后自动执行，也可以在 GitHub Actions 页面手动触发。其他分支的手动运行只构建，不发布。

每个平台都会执行格式检查、Clippy、非 GUI 测试及 release 构建。全部成功后，workflow 使用仓库自带的 `GITHUB_TOKEN` 创建 GitHub Release，无需配置额外的发布密钥；发布任务使用 `contents: write` 权限。

Release 标签为 `v<Cargo.toml 版本>-build.<workflow 运行编号>`，例如 `v0.2.0-build.12`。每次推送生成独立版本，重跑同一次 workflow 使用相同标签。Release 先创建为草稿，上传完整产物及 `SHA256SUMS` 校验文件后再公开，并设为最新版本。

| 平台 | Release 产物 |
| --- | --- |
| macOS Apple Silicon | `aarch64-apple-darwin.tar.gz`，包含 `FileWatch.app` |
| macOS Intel | `x86_64-apple-darwin.tar.gz`，包含 `FileWatch.app` |
| Windows x64 | `x86_64-pc-windows-msvc.zip`，包含 `file-watch.exe` |
| Linux x64 | `x86_64-unknown-linux-gnu.tar.gz`，包含 `file-watch` |

文件名还包含项目名及 Release 标签。macOS 应用使用 ad-hoc 签名，未进行 Apple 公证；Linux 可执行文件在 Ubuntu 24.04 上构建，运行时需要系统窗口、字体及 ALSA 音频库。跨平台构建结果以 GitHub Actions 实际运行结果为准。

打包逻辑位于 `scripts/package_release.py`，只使用 Python 3.11+ 标准库。可对已构建的产物执行同样的打包步骤，例如：

```sh
cargo build --release --locked --target aarch64-apple-darwin
python3 scripts/package_release.py \
  --target aarch64-apple-darwin \
  --version 0.2.0 \
  --release-tag v0.2.0-build.0
```

打包结果位于 `dist/`。原有 SolidJS/Tauri 源码、前端依赖和配置已移除，音频及应用图标保留在 `assets/`。
