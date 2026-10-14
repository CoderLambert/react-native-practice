# NewsDevice：本地 Kotlin 模块

`expo-module.config.json` 注册 Android 类；项目 `package.json` 指定 `nativeModulesDir`。
不需要发布 npm 包。CNG 会从 `modules/` 自动链接，不能把这个源目录当成生成的 `android/` 删除。

| 导出 | TypeScript | Android API | 权限 |
|---|---|---|---|
| 系统快照 | `device.snapshot()` | Build / BatteryManager / PowerManager / ActivityManager | 无危险权限 |
| 阅读亮屏 | `device.keepScreenOn(true)` | Activity Window FLAG_KEEP_SCREEN_ON | 无 |
| 应用设置 | `device.openSettings()` | Settings Intent | 无 |

窗口操作使用 `Queues.MAIN`；页面失焦和模块销毁都做清理。不是后台唤醒锁，不修改全局系统超时。
iOS / Web / Expo Go 没有此模块，TypeScript 适配器明确报告“不支持”，不返回伪造数据。
修改 Kotlin 后运行 `pnpm android` 重新编译；Fast Refresh 不会重编译 Kotlin。
