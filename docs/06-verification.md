# 06 · 验证记录与手动验收

## 2026-10-15 交付验证

代码验证基线：`25e3c3028a636dfbe0e76cbdcaae7a7e93b31d64`。之后仅修改本文档时，不改变下列代码证据对应的范围。

| 层级 | 实际结果 | 证据与边界 |
|---|---|---|
| TypeScript / ESLint | 通过 | Quality 工作流实际执行，不是只提供脚本 |
| 纯业务测试 | 31/31 通过 | 契约、取消、429、超时、并发、缓存、收藏、深链、Unicode 分片；本地与 CI 均执行 |
| SQLite 约束测试 | 6/6 通过 | Python sqlite3 执行实际迁移 SQL；不等于 Android SQLite 包真机验收 |
| Jest / RNTL 组件测试 | 4/4 通过 | 文章入口、正文类型、禁用按钮、选中状态 |
| Expo 依赖兼容 / Doctor | 通过 | 修复 RN Web / React types 补丁版本、移除直接安装的 expo-modules-core；没有排除检查来获得通过 |
| Android / Web JS 导出 | 均通过 | JS/Hermes 打包成功，不等于 Kotlin 编译或设备运行 |
| 锁文件 | 已验证并提交 | 首轮成功 CI 的 lockfile 已提交，后续 frozen-lockfile 安装成功 |
| 浏览器实测 | 9 项检查通过，0 个未捕获 JS 异常 | 真实导出应用 + Chrome + Playwright，不是静态假页面 |
| Android 原生编译 / APK | 尚未取得最终结果 | 远端构建已通过 SDK 初始化、安装与 prebuild，仍在 Gradle 原生编译阶段；不预先声称 APK 已产出 |
| Android 真机 / Maestro | 未执行 | 没有设备；通知、语音、后台、电量和亮屏仍需真机验证 |
| iOS 构建 / 真机 | 未执行 | 需要相应 EAS / Apple 签名和设备条件 |
| 实际 HN API 联通 | 本次未做实时联网验收 | 适配器解析有测试；Demo 与网络 mock 不代表真实来源联通 |

质量检查：[Quality / 25e3c30](https://github.com/CoderLambert/react-native-practice/actions/runs/38641683295)。
浏览器检查及五张实际截图：[Web application smoke / 25e3c30](https://github.com/CoderLambert/react-native-practice/actions/runs/38641683308)。产物名 `web-smoke-screenshots-and-results`。
原生构建：[Android preview APK / f1d710d](https://github.com/CoderLambert/react-native-practice/actions/runs/38640550205)。其 Kotlin 与原生依赖基线和 25e3c30 一致，但该 APK 即使完成也不包含之后的 JS 改动；需要最新包时在 Actions 手动运行 main。

### 浏览器九项检查

默认新闻展示、第二页加载、搜索筛选、文章跳转与收藏、整页重载后收藏恢复、主题重载后保持、清缓存不删收藏、Web 不伪装 Android 能力、无未捕获 JS 异常。

实测发现并修复了 RN Web 未暴露 checked/disabled 状态的问题；保留对应断言，不通过删测试来绕过失败。截图环境安装中文字体，避免缺字体方框被误认为产品界面。

`tests/web_smoke.py` 可在已安装 Chrome/Chromium、Python Playwright 的环境运行：

```bash
pnpm export:web
python3 -m pip install playwright==1.56.0
python3 tests/web_smoke.py
```

本地执行容器不能连接 npm，也禁止浏览器访问本地 HTTP 地址，因此依赖相关与浏览器检查转到仓库 CI 实际执行。上述结果始终区分本地、CI、浏览器、原生编译与真机，不能相互代替。

## 人工验收清单

| ID | 操作 | 通过标准 |
|---|---|---|
| M01 | 新安装，默认 Demo | 无账号/Key 即可看 6 篇原创教学内容；明确标为教学示例 |
| M02 | 加载第二页、搜索/分类、下拉刷新 | 无重复卡片；搜索范围明确；空态可恢复 |
| M03 | 收藏、结束进程、断网、重新打开 | 收藏与正文仍在；不是只验证内存缓存 |
| M04 | 清理资讯缓存 | 收藏不被删除；后续加载可重新建缓存 |
| M05 | 切换 HN，加载/刷新/断网 | 请求真实 API；失败显示旧缓存及时间，或明确报错，不切假源 |
| M06 | 打开 HN 文章 | 明确区分摘要与站外全文；原文只使用安全 HTTPS 链接 |
| M07 | 系统语音、分享、返回 | 分享可取消；朗读在失焦/退后台后停止；缺语言包路径可理解 |
| M08 | 开/关亮屏，退出详情 | Android 窗口标志生效并清理；没有修改全局屏幕超时 |
| M09 | 通知允许、拒绝、取消 | 不在首次启动索取权限；失败不假报安排成功 |
| M10 | 桌面/结束进程后点击通知 | 打开同一篇已保存文章；普通再次启动不重放旧通知 |
| M11 | Kotlin 快照 | 返回真实设备状态；省电开关变化可观测；Expo Go/Web不伪造结果 |
| M12 | 后台注册、触发、查看记录、注销 | 注册与执行分开显示；真实执行后写记录；注销后不再安排 |
| M13 | 深浅主题、字体放大、横屏、TalkBack | 文本可读、按钮可触控、有标签、不截断主要操作 |
| M14 | preview Release，关闭 Metro | 独立冷启动成功；包标识与开发版隔离 |
| M15 | v1 数据升级至未来 v2 | 收藏保留；高版本数据库不能被旧版自动清空 |

`.maestro/reading.yaml` 是预览包关键路径补充，覆盖阅读、收藏与结束进程恢复；无法代替全部权限/厂商后台测试。

## 记录格式

```text
Commit SHA:
App variant / version:
Device / Android version:
Test ID:
Steps:
Expected:
Observed:
Pass / fail / blocked:
Logs / screenshot:
```

不要把 blocked 改成 pass；不要为了绿灯关闭实际校验或跳过原生编译错误。
