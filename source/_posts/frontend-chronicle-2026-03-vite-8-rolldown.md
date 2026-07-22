---
title: "Vite 8：Rolldown 统一内核正式落地"
date: 2026-03-12 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2026
categories:
  - 前端年鉴
description: "从三个月 Beta 影子构建走到 Vite 8 正式上线：隔离 bundler 变化、比较两份 dist、验证插件和回退链路。"
cover: /img/covers/frontend-chronicle-vite-8-rolldown.svg
top_img: /img/covers/frontend-chronicle-vite-8-rolldown.svg
toc: true
---
Vite 8 稳定版发布那天，我们已经跑了三个月 Beta 影子构建，所以升级没有从“看迁移指南”开始，而是从那份失败清单开始。两个插件问题已在 Beta 阶段修复，剩下的是把正式版本放入主线、保留回退路径，并验证 Rolldown 带来的真实收益。

Vite 8 最大的底层变化，是以 Rolldown 作为统一的 Rust bundler，收拢过去 esbuild 与 Rollup 两条主要管线的差异。官方把它称为 Vite 2 以来最重要的架构升级。对应用团队来说，这句话最终要落到三件事：能否正确构建、插件是否兼容、自己的项目到底快多少。

## 按官方建议把 bundler 变化单独隔离

复杂项目可以先在 Vite 7 使用 `rolldown-vite` 验证，再升级 Vite 8。我们 Beta 阶段已经完成这步，所以正式升级拆成：

```text
提交 1：Node 版本与 lockfile 统一
提交 2：Vite 7 + rolldown-vite 产物验证
提交 3：Vite 8 正式包与迁移项
提交 4：可选插件/新功能
```

如果提交 2 出错，知道是 bundler；提交 3 出错，更可能来自 Vite 8 其他变化。一次性升 Node、React 插件、Vite 和全部插件会失去这种归因。

## 兼容层让配置能跑，不代表配置仍然合理

Vite 8 会为许多现有 esbuild/rollupOptions 配置提供兼容转换。旧配置：

```ts
export default defineConfig({
  esbuild: {
    drop: ['debugger']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['echarts']
        }
      }
    }
  }
})
```

它可能继续工作，但我们逐项确认是否仍有必要。手工把图表库固定成 chunk 曾用于缓存，后来路由只在一个页面使用，强制分包反而让入口多请求。底层升级是删除历史微调的好机会，不是把它们永久交给兼容层。

## 我们得到的性能数字

同一 CI 规格、清缓存后各跑五次取中位数：

```text
项目：后台 monorepo（约 6200 modules）
Vite 7 production build：41.8s
Vite 8 production build：9.7s
产物 gzip 总量：差异 < 1.5%
E2E：全部通过
```

这只是我们的记录，不是所有项目承诺。小型站点从 4 秒降到 2 秒，体感就没有同样夸张。瓶颈如果在类型检查、图片压缩或部署上传，bundler 加速也不会让总流水线按比例下降。

所以我们同时分阶段计时：依赖安装、类型检查、Vite build、E2E、上传。build 从 42 秒变 10 秒以后，typecheck 成为最长步骤，下一轮优化才有正确目标。

## 生产前最容易漏的四条路径

### 动态导入

运行所有懒加载路由，不只访问首页。检查 chunk 404、base URL 和预加载关系。

### CSS 顺序

打开弹窗、深色模式和异步页面，做视觉 diff。chunk 改变可能暴露全局 CSS 偶然顺序。

### SSR/库模式

SSR 要直接启动构建产物，检查 external 与 Node/edge API；库模式要在临时 consumer 中分别 import/require（若承诺两种格式）。

### source map

在 staging 主动抛一个错误，确认错误平台能还原到源码与 release。构建成功不证明上传/映射路径正确。

## React 插件不必与 Vite 同一天升级

Vite 8 同期的 `@vitejs/plugin-react` v6 使用 Oxc 处理 React Refresh，默认不再依赖 Babel；需要 React Compiler 时提供显式集成路径。官方说明旧插件 v5 仍可配合 Vite 8。

我们利用这一点先保留 v5，只换 Vite/Rolldown；主线稳定后再单独升级 React 插件。否则 Refresh 或 Compiler 出问题，很难判断来自哪层。

这种“允许旧插件继续工作”的兼容窗口，应该用来降低变更半径，而不是永远不升级。

## tsconfig paths 支持要考虑开销和发布契约

Vite 8 可以选择启用内置 tsconfig paths 解析：

```ts
export default defineConfig({
  resolve: {
    tsconfigPaths: true
  }
})
```

它有小的性能成本，且 TypeScript path 并不会自动改变 npm 包的运行时 exports。应用内部可减少 alias 重复，发布库仍需明确公开入口并测试最终产物。我们只在一个 alias 很多的 app 启用，没有为了新功能全仓开启。

## 浏览器 console 转发解决了一个真实协作问题

开发代理/远程环境中，错误只在浏览器 console，终端和自动化助手看不到。Vite 8 提供控制台转发能力：

```ts
export default defineConfig({
  server: {
    forwardConsole: true
  }
})
```

开启前先考虑日志中的 token、个人信息和噪音，生产当然不应使用 dev server 配置。我们只在本地开发启用，并对请求 header 做脱敏，不让“可见性”变成泄密通道。

## 回退不是降级整个发布

升级当天保留上一份 lockfile/构建镜像与独立 dist artifact。若 Vite 8 构建出现未知回归，可以用上一条稳定流水线重新构建，而不是 git reset 用户提交。

部署仍遵循静态资源先行、HTML 后切换，旧 chunk 保留回滚窗口。构建器升级不应该顺便改变成熟发布协议。

## 从 Beta 到稳定版，证据可以复用

Beta 影子构建留下的插件 fixture、产物对比和 E2E 在稳定版直接复用，正式升级只需确认版本回归和迁移项。这就是提前试用最实际的回报：不是抢先使用，而是把未知风险提前变成自动化测试。

Vite 8 的构建提升在大项目中非常明显，统一内核也让长期开发/生产语义更有机会一致。但稳定版不是“无需测试”的同义词。我们最终在正确性、可观测性和回退都就绪后才切主线，速度数字反而是最后确认的一项。

## 资料

- [Vite 8 发布说明](https://vite.dev/blog/announcing-vite8)
- [Vite 8 Migration Guide](https://vite.dev/guide/migration)
- [Vite Plugin Registry](https://registry.vite.dev/)
