import type { Article } from '../domain/models.ts';
import type { NewsSource } from '../domain/ports.ts';
import { throwIfAborted } from '../domain/http.ts';

export const DEMO_ARTICLES: Article[] = [
  {
    id: 'demo-1', source: 'demo', title: '从网页到原生：同一套 React，不同的运行环境',
    summary: '认识 View、Text 和原生导航，找到已有前端经验可以复用的部分。',
    paragraphs: [
      '这是一篇项目内置的原创教学内容，不是实时新闻。它让你在没有后端、没有账号和网络的情况下先走通阅读、收藏、朗读和提醒。',
      'React 负责描述界面和状态，但 React Native 不使用浏览器 DOM。View 和 Text 对应原生视图；浏览器样式、hover 和直接操作 document 的经验不能原样照搬。',
      '本项目把文件路由放在 src/app，页面业务放在 src/features，底层能力放在 src/native。先打开资讯页对应的薄路由文件，再跟到 FeedScreen，观察数据怎样通过 hook 进入界面。',
      '实验：修改卡片标题的字号，观察 Fast Refresh；然后修改 Kotlin 的系统信息字段，重新构建。前者改变 JavaScript，后者改变安装包中的原生实现。'
    ], author: 'NewsLab 教学编辑', publishedAt: '2026-10-10T08:00:00.000Z', category: '移动开发', bodyKind: 'full'
  },
  {
    id: 'demo-2', source: 'demo', title: '离线阅读，不只是把请求结果留在内存里',
    summary: '用持久化收藏和清晰的缓存状态，让断网行为成为可验证的产品功能。',
    paragraphs: [
      'TanStack Query 负责请求状态和内存缓存。关闭进程后仍能阅读，需要 SQLite 等持久化存储。两者职责不同，不能把“请求曾经成功”当成“已经支持离线”。',
      '这里的 feed_pages 保存资讯页缓存，bookmarks 保存用户主动收藏的内容快照。清除资讯缓存不会删除收藏；取消收藏也不会破坏资讯列表。',
      '实验：收藏本文，彻底结束应用，断开网络，再打开收藏页。你应仍然看到全文。切换真实新闻来源后，收藏只保存该来源实际提供的内容，不补造站外正文。',
      '缓存回退必须显示数据来源与时间。用户看到的“旧内容”可以有价值，但不能被界面误导成刚刚更新的新闻。'
    ], author: 'NewsLab 教学编辑', publishedAt: '2026-10-11T08:00:00.000Z', category: '工程实践', bodyKind: 'full'
  },
  {
    id: 'demo-3', source: 'demo', title: '用 Kotlin 接触 Android 底层能力',
    summary: '从 TypeScript 调用系统电量、省电模式和窗口标志，不依赖网页桥接。',
    paragraphs: [
      '打开原生实验室，点击读取系统状态。调用会经过 TypeScript 类型边界、Expo Modules，再进入 Kotlin，最终读取 Android 的 BatteryManager、PowerManager 与 ActivityManager。',
      '阅读保持亮屏使用当前 Activity 的窗口标志，而不是全局修改系统超时，也不获取持久唤醒锁。离开页面后必须清理该标志。',
      '此示例只读取一般设备状态，不读取 IMEI、广告标识、位置、通讯录或其他稳定身份信息；页面展示也不会默认上传。',
      '实验：开启系统省电模式，再回到实验室刷新状态。接着修改模块返回值，运行 pnpm android 重新编译，确认你理解原生代码的构建边界。'
    ], author: 'NewsLab 教学编辑', publishedAt: '2026-10-11T08:00:00.000Z', category: '移动开发', bodyKind: 'full'
  },
  {
    id: 'demo-4', source: 'demo', title: '系统通知：从权限到深链的完整闭环',
    summary: '通知必须可拒绝、可撤销，并能把用户带回正确的文章。',
    paragraphs: [
      '在文章详情点击“10 秒后提醒”，应用先保存文章快照，再按需申请通知权限。拒绝权限时显示原因，不循环弹窗。',
      '本地通知与服务器推送不同：此功能不需要 FCM 凭据或推送服务器。系统可能延后投递，因此十秒是请求时间，不是精准定时保证。',
      '通知只携带受校验的 articleId，不接受任意 URL 作为路由。通知点击和冷启动恢复都会进入同一个文章页面。',
      '实验：安排提醒后回到桌面，收到通知并点击；再尝试关闭应用后的通知入口。拒绝通知权限仍应保留阅读与收藏能力。'
    ], author: 'NewsLab 教学编辑', publishedAt: '2026-10-12T08:00:00.000Z', category: '产品设计', bodyKind: 'full'
  },
  {
    id: 'demo-5', source: 'demo', title: '后台刷新为什么不能当成 setInterval',
    summary: '理解 WorkManager 与移动系统的资源约束。',
    paragraphs: [
      '应用退到后台后，JavaScript 计时器不是可靠调度器。此项目通过 Expo BackgroundTask 使用 Android WorkManager，由系统决定何时运行。',
      '后台任务在入口模块顶层定义，不能只放在某个 React 页面里。系统唤醒任务时，不需要先打开设置页。',
      '用户主动启用后，任务只更新当前来源首页。实验室显示最近实际执行结果，不把“注册成功”等同于“已经执行”。',
      '开发版本可触发一次测试；生产环境仍受网络、电池和厂商策略约束。学习重点是幂等、失败记录和持久化，而不是追求固定每分钟执行。'
    ], author: 'NewsLab 教学编辑', publishedAt: '2026-10-12T08:00:00.000Z', category: '工程实践', bodyKind: 'full'
  },
  {
    id: 'demo-6', source: 'demo', title: '发布前，哪些通过才算真正通过',
    summary: '把类型、业务、组件、原生构建和真机验收分成不同证据。',
    paragraphs: [
      '类型检查通过不能证明应用能安装，JavaScript 打包通过不能证明 Kotlin 编译通过，模拟器运行也不能代替真机通知、语音和后台行为验收。',
      '本项目提供纯业务测试、SQL 约束测试、组件测试、Android 构建工作流和 Maestro 关键路径。验证报告会区分实际运行与待验证，不把脚本存在写成测试通过。',
      '预览包和生产包使用独立应用标识。EAS 项目编号、签名和监控配置必须绑定到你自己的账号，仓库中没有伪造的项目编号或服务密钥。',
      '实验：运行 pnpm check；在真实手机完成阅读、收藏、杀进程恢复和通知测试，再构建 Release 包，关闭 Metro 后启动应用。'
    ], author: 'NewsLab 教学编辑', publishedAt: '2026-10-13T08:00:00.000Z', category: '产品设计', bodyKind: 'full'
  }
];

export const demoSource: NewsSource = {
  async page(page, signal) {
    throwIfAborted(signal);
    return { items: DEMO_ARTICLES.slice(page * 3, (page + 1) * 3), nextPage: (page + 1) * 3 < DEMO_ARTICLES.length ? page + 1 : null };
  },
  async article(id, signal) {
    throwIfAborted(signal);
    const article = DEMO_ARTICLES.find(item => item.id === id);
    if (!article) throw new Error('示例文章不存在');
    return article;
  },
};
