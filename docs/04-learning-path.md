# 04 · 六个可独立验收的练习

学习单位是可观察的功能，不是看完多少视频。先运行现有代码，再每次只扩展一个闭环。可让 Codex 写重复代码与测试，但自己解释状态归属与平台边界。

| 顺序 | 动手修改 | 重点文件 | 必须能解释/验收 |
|---|---|---|---|
| 1 | 调整资讯卡片与分类 | ArticleCard / FeedScreen | View/Text 与 DOM 的区别；动态字体与触控区域 |
| 2 | 增加“只看有正文”筛选 | domain/models / FeedScreen | 在纯函数里过滤；新增单测，不在 JSX 中到处写规则 |
| 3 | 给收藏增加用户备注 | ports / schema / storage / reader | 增加 v2 迁移，升级保留旧收藏；写失败不显示成功 |
| 4 | Kotlin 增加系统字段 | NewsDeviceModule / device / LabScreen | 改完 TS 不会自动重编原生；只读设备状态不上传 |
| 5 | 把提醒延迟做成选择项 | notifications / ReaderScreen | 拒绝权限、重复安排、取消、冷启动深链仍成立 |
| 6 | 接入自己的新闻后端 | 新 NewsSource adapter | 页面无需依赖后端响应格式；先做契约测试再接 UI |

## 建议阅读顺序

先读 `FeedScreen` 看到实际产品，再沿 `queries → NewsService → NewsSource` 追一次请求。接着看 Storage 如何保存收藏。最后看 Kotlin 与通知/后台的“必须重建”“由系统决定”等移动端特有约束。

## 可直接交给 Codex 的练习约束

```text
在这个仓库中完成一个练习，不要重构整站或替换技术栈。
先读 README、docs/02-architecture.md、docs/06-verification.md。
先指出本功能的事实来源、写入边界、失败语义和平台限制。
增加最小可观察 UI 与完整实际逻辑；不做空按钮、假数据伪装或 catch 后静默成功。
先补纯业务/存储测试，再修改页面，最后运行相关测试和 pnpm check。
涉及 Kotlin/config plugin 时必须标记需要重新构建。
输出改动文件、测试证据、未验证项和 3～5 步人工验收。
不修改其他功能，不删除用户数据，不使用真实账号密钥。
```

## 学会的标准

能在没有教程逐行提示的情况下加一个功能；能解释离线和失败时行为；能从原生构建错误定位到具体层；能打出脱离 Metro 的包并在真机验证。仅通过类型检查不等于掌握了移动产品交付。
