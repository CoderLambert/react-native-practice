# 03 · 原生能力实验

## A. 从 TypeScript 调用 Kotlin

调用链：`LabScreen → device.snapshot() → requireOptionalNativeModule('NewsDevice') → Function('getSnapshot') → Android APIs`。

`expo-module.config.json` 指定 Android 类，Gradle 使用 `expo-module-gradle-plugin`；没有必要手改 MainApplication 或复制一套 bridge 注册代码。

打开实验室读取信息，再手动切换系统省电模式、回来刷新。没有设备唯一标识、联系人或位置权限。电量不可用时返回 null，不误显示 0%。

练习：在 Kotlin 增加 `isInteractive`（PowerManager），同步 TS 类型，给页面增加可见字段，重新 `pnpm android`。验收：实际锁屏/解锁后能观察字段变化，而不只是打印固定字符串。

## B. 窗口级保持亮屏

在文章页切换亮屏。Kotlin 在 `Queues.MAIN` 操作当前 Activity 的 `FLAG_KEEP_SCREEN_ON`，不申请 WAKE_LOCK，不改全局系统亮屏时间。路由失焦与模块销毁都尝试清理。

验收：设置较短的系统熄屏时间，在详情开启亮屏，返回列表后恢复系统行为。只测试屏幕“似乎没灭”不足以证明清理代码正确。

## C. 系统分享与语音

`Share.share` 打开系统分享面板；取消分享不是失败。`expo-speech` 调用设备语音引擎，长内容按 Unicode 字符分片，避免破坏代理对。离开详情或退到后台即停止，本例不是后台播放器。

验收：中文语音、没有中文语言包、外放关闭、分享取消、手势返回。系统语音引擎可能联网，本项目不保证声音离线可用。

## D. 本地通知与深链

仅点击提醒按钮时申请权限；Android 先创建频道。消息只包含受校验的 articleId，不接收任意外部路由。监听运行中的通知响应，同时读取启动响应，并清除已消费响应，防止每次打开 App 重放旧导航。

提醒 identifier 按文章稳定生成，用来替换或取消同一篇的待发提醒。不索取精确闹钟权限，10 秒只是请求延迟，投递以系统为准。不是远程 push，不需要 FCM 凭据。

验收：允许/拒绝/永久拒绝、返回桌面点击、结束进程点击、重复点击安排、取消提醒、畸形 articleId。原生提醒必须在设备上验收，Jest 无法证明系统投递。

## E. WorkManager 后台任务

`index.js` 首先导入任务定义；`TaskManager.defineTask` 在模块顶层，界面只负责注册与注销。后台调用复用业务/存储层，写入执行时间和成功/失败，刷新失败不会删旧缓存。

请求最小间隔 30 分钟，OS 可以推迟；Android WorkManager 最低间隔是 15 分钟。用户关闭后取消注册。开发构建中的触发测试只是请求系统执行，必须核对随后写入的实际结果。

```bash
adb shell dumpsys jobscheduler | grep -A 35 -m 1 'host.lambert.newslab.dev'
# 取得实际 JOB_ID，再进行开发测试；不要照抄不存在的编号
adb shell cmd jobscheduler run -f host.lambert.newslab.dev <JOB_ID>
```

不要要求用户关闭全部省电机制来使示例“看似成功”；把设备策略与业务正确性分开记录。

参考：[Expo Modules API](https://docs.expo.dev/modules/module-api/)、[Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)、[Expo BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/)、[Android PowerManager](https://developer.android.com/reference/android/os/PowerManager)。
