# 01 · 在 Omarchy 上运行与调试

## 准备

本机写 TS/React，Android Studio 管 SDK/模拟器，JDK 17/Gradle 负责原生构建。编辑器仍可用 LazyVim、VS Code 或 WebStorm，无需把编码工作迁到 Android Studio。

Node 推荐 24 LTS；`.nvmrc` 固定主版本并让 CI 获取维护补丁。包管理器由 `packageManager` 固定为 pnpm 10.20.0。已安装 Corepack 时 `corepack enable`，缺少 Corepack 时根据 Node 官方安装方式安装 Corepack，或用 `npm install -g pnpm@10.20.0`。不要在 npm/pnpm 间交替生成多份锁文件。

Arch 可以安装 `jdk17-openjdk android-tools android-udev`；Android Studio 可以用官方 Linux 压缩包或你信任的 AUR 管理器安装。先阅读安装计划，不让项目脚本自动修改系统。

在 Android Studio SDK Manager 安装 Android API 36、Platform-Tools、Build-Tools、Emulator、Command-line Tools。以本地构建报错/Expo 版本要求为准，不为某个旧教程降低 SDK。SDK 路径在 Studio 设置中确认。

## 两条测试路线

**模拟器：** Device Manager 创建 x86_64 设备；确保 BIOS 开启虚拟化，`ls -l /dev/kvm` 检查当前用户可读写。权限问题按系统管理员策略修正；真机路线不依赖 KVM。

**Android 真机：** 开发者选项 → USB 调试 → 连接数据线 → 在手机上接受 RSA 授权。运行 `adb devices`，状态必须为 `device`，不是 `unauthorized` 或 `offline`。

```bash
pnpm install
pnpm check:android
pnpm android
# 多个设备时
pnpm exec expo run:android --device
```

模拟器屏幕和真机均运行你的原生安装包，不是网页截图。纯页面预览可用 `pnpm web`，但不能作为原生验收。

## 日常修改

TS/TSX：`pnpm start` + Fast Refresh。Kotlin / native package / app.config 插件：再次 `pnpm android`。不要手改生成的 `android/` 后就认为修改已保存；应修改 `modules/` 或 Config Plugin。

USB 开发连接不通时：`adb reverse tcp:8081 tcp:8081`，确认 Metro 使用的实际端口；防火墙/局域网问题优先排查实际地址，不关闭所有防火墙。模拟器访问电脑的本地后端通常用 `10.0.2.2`；真机用电脑的局域网地址或专门的开发转发。`localhost` 在手机上指手机自身。

Hyprland 模拟器窗口异常：

```bash
emulator -list-avds
QT_QPA_PLATFORM=xcb emulator -avd <从上条命令取得的名称>
```

## Deep Link 与日志

默认 Development Build 包名 `host.lambert.newslab.dev`，scheme `newslab-dev`：

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d 'newslab-dev://article/demo-1' host.lambert.newslab.dev
adb logcat -s ReactNativeJS AndroidRuntime
```

Preview 使用 `host.lambert.newslab.preview` / `newslab-preview`，生产使用 `host.lambert.newslab` / `newslab`。

## Release 验收

```bash
APP_VARIANT=preview pnpm android:release
```

关闭 Metro 后仍可启动，才证明 JS 已被打进包。此本地 Release/CI APK 使用测试签名流程，不意味着已配置 Play 商店签名。

Linux 不能运行 Xcode 或 iOS Simulator。iOS 可以通过你的 EAS 账号云构建，但原生 iPhone 验收和签名仍需对应设备、账号条件。

参考：[Expo Android 环境](https://docs.expo.dev/workflow/android-studio-emulator/)、[Android 硬件加速](https://developer.android.com/studio/run/emulator-acceleration)、[Development Build](https://docs.expo.dev/develop/development-builds/introduction/)。
