---
title: "Vite 8 Beta：Rolldown 开始统一开发与生产构建"
date: 2025-12-03 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2025
categories:
  - 前端年鉴
description: "没有把 Vite 8 Beta 直接上线，而是让 CI 生成两份产物；影子构建提前找出插件顺序与动态导入问题。"
cover: /img/covers/frontend-chronicle-vite-8-beta-rolldown.svg
top_img: /img/covers/frontend-chronicle-vite-8-beta-rolldown.svg
toc: true
---
Vite 8 Beta 公布 Rolldown 集成后，我们做的第一件事不是更新主分支，而是在 CI 增加一条允许失败的“影子构建”。Vite 从早期开始在开发依赖优化/转换与生产打包中组合 esbuild、Rollup；Rolldown 的目标是用 Rust 实现的统一 bundler 收拢主要路径，同时尽可能兼容 Rollup 插件。

这类底层替换最适合 Beta 阶段做真实反馈，也最不适合只看一次构建耗时就直接上线。我们需要知道：产物是否等价、插件钩子是否完整、动态导入与 CSS 顺序是否变化，以及构建快在哪一段。

## 影子构建不覆盖正式 dist

CI 同一次提交分别运行稳定版与 Beta，各输出独立目录：

```bash
npm run build:stable -- --outDir dist-stable
npm run build:rolldown -- --outDir dist-rolldown
```

Beta 分支不上传生产 CDN，不写正式 manifest。流水线保存两份 artifact 和统计：

```json
{
  "buildMs": 8421,
  "jsBytes": 1832041,
  "cssBytes": 284190,
  "chunks": 76,
  "warnings": 0
}
```

连续跑多次取中位数，区分冷/热缓存。CI 机器负载会抖动，单次“快 40%”不能作为结论。

## 比较文件名之前，先比较业务语义

两个 bundler 的 chunk 划分或 hash 算法可能不同，逐文件名相等没有意义。我们的分层验证是：

1. 两份产物都能由静态服务器直接访问；
2. Playwright 跑登录、懒加载路由、上传与报表；
3. manifest 包含部署端需要的入口/CSS；
4. source map 能在错误平台还原；
5. 动态 import 失败恢复、CSP nonce 与 base 路径正确；
6. 最后才比较体积、chunk 数与耗时。

正确性过关以后，性能数字才有意义。

## 第一个失败来自插件对 chunk 顺序的假设

自研 HTML 插件取 `bundle` 中“第一个 chunk”当入口：

```ts
generateBundle(_options, bundle) {
  const firstChunk = Object.values(bundle)
    .find(item => item.type === 'chunk')
  writeEntry(firstChunk.fileName)
}
```

稳定构建里它碰巧成立，Rolldown 输出迭代顺序变化后选错。插件本来就写得不可靠，应该根据 `isEntry` 与明确 name 查找：

```ts
const entry = Object.values(bundle).find(
  item => item.type === 'chunk' && item.isEntry && item.name === 'index'
)

if (!entry) this.error('index entry not found')
```

Beta 暴露的是既有 bug，而不是简单的“不兼容”。修复同时回到稳定分支，插件也加了 fixture 测试。

## 第二个差异只发生在动态 import

一个页面用变量拼路径：

```ts
const module = await import(`./locales/${language}.ts`)
```

不同分析/插件路径对动态模式处理有差异。我们改成显式 glob：

```ts
const locales = import.meta.glob('./locales/*.ts')

export async function loadLocale(language: string) {
  const loader = locales[`./locales/${language}.ts`]
  if (!loader) throw new Error(`Unsupported locale: ${language}`)
  return loader()
}
```

支持集合从隐式目录变成可检查映射，也更容易处理错误语言。统一内核不能替我们让任意动态路径变得可静态分析。

## Rollup 兼容不等于内部 API 兼容

标准插件钩子大多能工作，导入 Vite/Rollup 内部路径、修改私有 AST 字段或依赖输出顺序的插件风险最高。我们按类别盘点：

```text
官方框架插件：跟随 Beta 版本
标准 Rollup 插件：跑 dev/build fixture
自研标准钩子：重点检查输出与 sourcemap
内部 API/monkey patch：先移除或隔离
```

每个插件还要同时跑开发 HMR和生产 build。Beta 核心替换的目标之一是统一路径，但实际钩子在 dev/build 的触发时机仍需验证。

## CSS 顺序不能只靠截图一页

chunk 划分变化可能改变 CSS 提取与加载顺序，尤其多个异步页面都覆盖组件库变量时。我们既做视觉回归，也检查构建 warning，并减少依赖导入顺序的全局覆盖。

更稳的样式架构是设计 token、明确 layer 和组件作用域，而不是期待某个页面 chunk 恰好最后加载。构建器替换常把这种偶然顺序暴露出来。

## Beta 期间怎样处理上游问题

最小复现比上传整个公司仓库更有用。我们把失败插件缩成十几行 fixture，记录：

```text
Vite/Rolldown 版本
Node 与操作系统
最小配置
预期/实际输出
稳定版对照
是否只在 dev/build/SSR 出现
```

能证明是 Beta 回归的就提交上游 issue；业务私有假设则自己修。试用 prerelease 的价值包括给生态反馈，不只是提前享受速度。

## 什么时候才允许进入主线

我们设了门槛：连续两周影子构建全绿；核心 E2E、SSR/库模式（适用时）通过；关键插件有 fixture；产物体积无无法解释回退；错误平台 source map 验证；有一键回到稳定构建的脚本。

Beta 最终仍没有直接成为生产默认。等稳定版发布后，我们用同一套证据重新验证。这样试用工作不会浪费，主线也不承担不必要风险。

## Beta 阶段最有价值的收获

构建时间改善很吸引人，但这次影子构建更早发现了入口顺序假设、动态导入和 CSS 覆盖问题。它们在现有工具中只是碰巧稳定，换内核后才显形。

底层统一能减少长期的开发/生产语义差异，前提是插件生态和真实项目一起验证。对 Beta 最负责的使用方式不是发一张 benchmark 截图，而是让相同提交产生两份可运行产物，用测试说明差异，再把最小问题反馈给上游。

## 资料

- [Vite 8 Beta 发布说明](https://vite.dev/blog/announcing-vite8-beta)
- [Rolldown 官方文档](https://rolldown.rs/)
- [Vite：Plugin API](https://vite.dev/guide/api-plugin)
