# 05 · 从参考项目到生产产品

## 当前可以复用的工程能力

分层协议、取消/超时/受控并发、运行时校验、持久化快照、迁移、安全链接、平台适配、权限按需请求、生命周期清理、测试分层、环境隔离与构建门禁。这是生产工程基线，不是完成了所有商业功能。

## 多环境与 CNG

Development / preview / production 使用不同包标识和 scheme，避免测试操作清理真实数据。`android/`、`ios/` 由 CNG 生成，不提交；`modules/` 中的原生源码必须提交。`expo prebuild --clean` 会覆盖生成工程，不能在里面保存唯一修改。

EAS 项目必须属于你自己：安装/使用官方 EAS CLI，登录后 `eas init` 绑定项目。`EAS_PROJECT_ID` 为空时禁用 OTA，不写虚构 UUID。把真实项目 ID 配进对应构建环境；同一配置必须在 build 与 update 一致。

```bash
# 完成自己的 EAS 登录/项目绑定后
APP_VARIANT=preview eas build --platform android --profile preview
APP_VARIANT=production eas build --platform android --profile production
```

`runtimeVersion: fingerprint` 把原生依赖变化纳入兼容性判断。新增原生能力必须出新二进制；OTA 不是绕过原生构建或商店规则的工具。发布前在 preview channel 验证，再按自己的发布策略推进 production。

CI APK 使用模板测试签名，仅内部体验。Play 上架需要自己的上传签名、商店登记和政策检查；iOS 需要自己的 Apple 签名与真机测试。本项目不提交私钥、不替用户申请付费服务。

## 安全与隐私

服务端密钥绝不能放进 `EXPO_PUBLIC_*`、JS bundle 或仓库。Sentry DSN 是公开客户端配置，但上传 source map 的认证 token 不是；后者只能放 CI secret，日志不可输出。Sentry 默认关闭，显式配置后也关闭默认 PII 并删除用户/请求上下文。应在产品正式上线前审查仍会被发送的异常字段及第三方 SDK 行为。

当前不实现用户账户，不把生物识别或一个本地布尔值叫“服务器登录”。将来需要认证时：Authorization Code + PKCE、系统浏览器、后端会话授权、SecureStore 保存适当的凭据、退出清理用户级缓存；每个用户的收藏与队列必须隔离。浏览器 Cookie 与移动端 Token 生命周期不能机械照搬。

文章只以原生 Text 渲染。不把 `plainText` 当作 WebView HTML 清洗器。默认不读取位置、相机、通讯录或设备唯一标识。Android `allowBackup=false` 避免本地库被默认应用备份流程导出；这不意味着设备上数据已被应用层加密。

## 监控与诊断

`src/observability.ts` 提供默认关闭的 Sentry 集成，路由 ErrorBoundary 报告崩溃；可预期的权限拒绝/断网通过 UI 反馈，避免全部当作崩溃告警。需要定位生产堆栈时，再配置官方 Sentry source-map/符号上传插件、组织与项目。当前没有声称上传了 source map 或已验收线上监控。

## 正式产品剩余门禁

发布签名、真实设备与低端机、无障碍读屏、系统字体放大、横竖屏/平板、冷启动与升级迁移、进程被杀、后台权限、错误遥测脱敏、隐私声明、合法内容使用、端点容量与限流、数据备份/删除策略。测试记录要带版本 SHA、设备/系统、环境和结果。

参考：[EAS Build](https://docs.expo.dev/build/introduction/)、[EAS runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)、[Sentry for Expo](https://docs.expo.dev/guides/using-sentry/)。
