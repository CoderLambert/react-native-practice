# 闻序 NewsLab · React Native 实战工程

一个可以读、收藏、离线打开，并且能调用 Android 系统能力的新闻阅读学习项目。
不是只有目录的脚手架，也不是将网页放进 WebView。面向已有 React / TypeScript 经验、使用 Omarchy / Linux 的前端开发者。

> 当前定位：可演进的生产工程学习基线，**不是已完成商店验收的商业产品**。
> 已执行与待验证项目见 [验证记录](docs/06-verification.md)。不要把“有测试脚本”理解成“已完成真机验收”。

## 你能实际体验什么

| 页面 | 实际功能 | 对应学习能力 |
|---|---|---|
| 资讯 | 两种数据源、分页、下拉刷新、已加载内容搜索/分类、错误/缓存标记 | Router、Query、请求取消、协议适配 |
| 阅读 | 原生文本阅读、字号、收藏、系统分享、语音朗读 | 原生组件、生命周期、设备能力 |
| 收藏 | SQLite 内容快照、杀进程后恢复、与资讯缓存隔离 | 持久化、迁移、数据所有权 |
| 原生实验室 | Kotlin 系统快照、应用系统设置、后台刷新开关与执行记录 | Expo Modules、Android API、WorkManager |
| 设置 | 真实/示例来源切换、浅深主题、缓存清理、提醒撤销 | 状态边界、可恢复配置 |
| 通知入口 | 收藏并安排本地提醒、点击通知进入文章、冷启动处理 | 权限、通知频道、Deep Link |

**中文示例内容是原创教学文章，不是假装成实时新闻。** 真实来源使用 Hacker News 官方公开 API；对站外新闻只提供标题/摘要/链接，绝不声称获取了不存在的全文。离线收藏保存的是来源实际提供的内容。

## 最快启动

使用 Node.js 24 LTS 和 package.json 指定的 pnpm。已有 Corepack 时：

```bash
git clone https://github.com/CoderLambert/react-native-practice.git
cd react-native-practice
corepack enable
corepack pnpm --version
pnpm install
pnpm web
```

Web 可以先认识页面、数据流与收藏。它使用独立的 localStorage 适配器；**Web 预览不验证 SQLite、Kotlin、原生通知或后台调度**。被浏览器禁止存储时会显示错误，不虚假声称持久化成功。

### Omarchy 上运行真正的 Android App

先安装 Android Studio，并在 SDK Manager 安装当前 Expo/RN 要求的 SDK Platform、Build-Tools、Platform-Tools、Emulator、Command-line Tools。SDK 57 对应 Android API 36；使用 JDK 17。用 Android Studio 界面显示的实际路径设置环境变量，不盲目复制默认路径。

```bash
# ~/.zshrc，若你的 SDK 路径不同请修改
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# 新终端中，启动模拟器，或连接已启用 USB 调试并授权的 Android 手机
pnpm check:android
pnpm android
```

首次 `pnpm android` 会生成原生工程、编译 Kotlin、安装 Development Build 并启动 Metro。随后只改 JS/TS 时运行 `pnpm start` 即可；修改 Kotlin、Config Plugin 或新增原生库后重新 `pnpm android`。

若 Hyprland 下模拟器窗口异常，尝试 `QT_QPA_PLATFORM=xcb emulator -avd <实际名称>`；不要为了运行模拟器自动修改 KVM 权限或系统配置。真机不需要 KVM。

完整安装与排错：[Omarchy / Android 指南](docs/01-omarchy-android.md)。**此项目不以 Expo Go 作为完整验收环境**，因为 Expo Go 不包含本仓库的 Kotlin 模块。

## 推荐的第一次体验

1. 在资讯页打开第一篇教学文章，收藏，切到收藏页确认；结束应用进程并断网，再打开收藏。
2. 在文章页点击朗读、系统分享、保持亮屏；返回列表，确认朗读停止、亮屏标志被清理。
3. 点击“收藏并在 10 秒后提醒”，回到桌面，点击通知进入同一篇文章；再验证通知权限被拒绝的路径。
4. 在原生实验室读取系统状态，开启系统省电模式后再读一次；启用后台任务，开发构建中触发测试并检查实际执行记录。
5. 设置中切换 Hacker News，体验真实请求、分页、原文跳转；断网后刷新，确认显示缓存标记而不是悄悄换成示例。

## 工程结构与阅读顺序

```text
src/app/                  文件路由，只组合页面
src/features/news/        新闻、阅读、收藏、Query hooks
src/features/lab/         原生能力实验页面
src/features/settings/    设置页面
src/domain/               类型、运行时校验、接口、用例、网络策略（不依赖 React）
src/data/                 Demo/HN 来源、SQLite、Web 存储、依赖组合
src/native/               通知、后台任务、Android 模块的 TS 边界
src/ui/                   设计 tokens、无障碍控件、交互互斥
modules/news-device/      真正的 Android Kotlin 源码
tests/                   业务、SQLite 和组件测试
.maestro/                 独立 preview 包的操作测试
.github/workflows/        质量门禁、原生编译与 APK 产物
docs/                    架构解释、逐步实验、验收与发布
```

从这条链开始：

```text
app/(tabs)/index.tsx
→ features/news/FeedScreen.tsx
→ features/news/queries.ts
→ domain/news-service.ts
→ data/hn-source.ts 或 demo-source.ts
→ data/storage.ts（原生 SQLite） / storage.web.ts（浏览器预览）
```

接着读第二条链：`ReaderScreen → native/device.ts → NewsDeviceModule.kt → Android Window API`。

## 技术选择

Expo **57.0.29** / React Native **0.86.3** / React **19.2.3**，根据 Expo `sdk-57` 模板和兼容清单选定；TypeScript strict、Expo Router、TanStack Query、SQLite、Expo Modules Kotlin、Jest/RNTL、Maestro、EAS 配置。

没有为了展示技术而强行加入 Zustand、表单库、数据库 ORM 或复杂 Monorepo。页面临时状态属于 React；请求状态属于 Query；用户保存的内容属于持久化层。没有表单业务就不引入表单框架。需要这些能力时，按边界扩展，而不是从第一天承担所有依赖。

**依赖锁定：** 首次可信 `main` CI 在全部质量检查通过后，将本次已验证的 `pnpm-lock.yaml` 普通提交回仓库。它不会改源代码、不会 force push、不会给 PR 写权限；若主分支已变化则放弃写入。之后 CI 使用 `--frozen-lockfile`。若首次验证未完成，应先检查 Actions 和 lockfile 状态，不应声称已实现可重复构建。

## 命令

```bash
pnpm test              # 纯 TypeScript 业务测试；不依赖模拟器
pnpm test:sql          # Python 标准库运行真实 SQLite 约束测试
pnpm test:ui           # Jest + React Native Testing Library
pnpm typecheck
pnpm lint
pnpm check             # 上述质量检查
pnpm doctor
pnpm export:android    # JS/Hermes 打包，不等于原生编译
pnpm export:web
APP_VARIANT=preview pnpm android:release
maestro test .maestro/reading.yaml
```

Maestro 使用单独的 `host.lambert.newslab.preview`，会清理该预览应用的数据，不要改成存有个人数据的包名。

GitHub Actions 的 **Android preview APK** 会编译 Kotlin 和 Release JS 并上传测试签名 APK。该产物仅用于内部体验，不是商店签名或上架完成的证据。生产发布用自己的签名与 EAS 项目，详见 [发布指南](docs/05-release-security.md)。

## 学习文档

- [01 · Omarchy 开发、模拟器和真机调试](docs/01-omarchy-android.md)
- [02 · 架构、数据流与为什么这样分层](docs/02-architecture.md)
- [03 · 原生能力实验：TypeScript 到 Kotlin](docs/03-native-lab.md)
- [04 · 六个可独立验收的练习](docs/04-learning-path.md)
- [05 · 发布、安全、监控与后续产品化](docs/05-release-security.md)
- [06 · 验证记录与手动验收清单](docs/06-verification.md)
- [07 · 接入你自己的新闻服务](docs/07-your-news-api.md)

## 边界

当前没有账户登录、远程收藏同步、服务端推送、AI 调用、站外全文抓取、全文搜索索引、付费订阅或应用商店提审。它们是后续可验收的独立任务，不用假接口或空按钮冒充已经实现。

默认不需要账号、Key 或收费服务，不自动申请通知权限，不读取设备唯一标识。Sentry 默认关闭；`.env.example` 只允许公开配置，生产服务密钥绝不能放进 App。

## 官方参考

[Expo SDK 57](https://expo.dev/changelog/sdk-57) · [原生模块](https://docs.expo.dev/modules/get-started/) · [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) · [通知](https://docs.expo.dev/versions/latest/sdk/notifications/) · [后台任务](https://docs.expo.dev/versions/latest/sdk/background-task/) · [Hacker News API](https://github.com/HackerNews/API)

MIT License。仓库教学文章为本项目原创；真实新闻及其原文归各自权利人所有。
