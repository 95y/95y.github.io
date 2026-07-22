---
title: "Vite 5：Rollup 4 与现代 Node 基线"
date: 2023-11-16 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2023
categories:
  - 前端年鉴
description: "一份 Vite 5 升级日志：先统一 Node，再迁 CJS 配置，最后比较 Rollup 4 的两份 dist 与插件矩阵。"
cover: /img/covers/frontend-chronicle-vite-5-rollup-4.svg
top_img: /img/covers/frontend-chronicle-vite-5-rollup-4.svg
toc: true
---
Vite 5 的升级分支一开始就失败在 CI，连业务源码都没来得及编译。原因是 CI 还在 Node 16，而 Vite 5 要求受支持的现代 Node 版本。这个报错反而帮我们确定了正确顺序：先统一运行时，再迁 ESM 配置和废弃 API，最后才评估 Rollup 4 产物与性能。

把所有变化塞进一个依赖更新 PR，会让任何失败都难定位。我们把升级拆成三次可回滚提交，下面是当时的迁移笔记。

## 第 1 步：让四个地方使用同一个 Node

项目中的 Node 版本散落在：

```text
.nvmrc
package.json engines
.github/workflows/ci.yml
Dockerfile
```

先统一到 Vite 5 支持范围内的版本，重新生成依赖安装结果，跑旧 Vite 的测试和 build。这样如果原生依赖或 npm lockfile 出问题，可以确定是 Node 升级，而不是 Vite 5。

同时检查部署平台，不只看构建容器。SSR/预渲染脚本如果运行在旧 Node，即使静态 build 在 CI 成功，运行时仍会失败。

## 第 2 步：清掉 CJS Node API 警告

旧工具脚本这样加载 Vite：

```js
// scripts/build.cjs
const { build } = require('vite')

build({ mode: 'production' })
```

Vite 5 弃用 CJS Node API 后，我们把脚本改成 ESM：

```js
// scripts/build.mjs
import { build } from 'vite'

await build({ mode: 'production' })
```

配置也统一为 `vite.config.mjs/ts` 或处在 `type: module` 包范围内。这里不能只全局改扩展名：`__dirname`、JSON 导入、CommonJS 插件与测试 config 都要逐个处理。

使用 Vite API 的内部工具比普通应用更容易踩到变化，所以我们用 `rg "require\(['\"]vite"` 搜出所有直接调用点，并直接执行每个脚本。

## 第 3 步：升级以后比较两份 dist

Vite 5 使用 Rollup 4。官方说明包含性能与行为更新，但业务最需要的是产物等价。我们保存旧版和新版构建：

```text
dist-v4/
dist-v5/
```

比较：入口和 chunk 数量、gzip/brotli 体积、manifest、CSS 顺序、动态导入、图片路径与 source map。再让同一套 Playwright 用例分别访问两份静态产物。

某个 snapshot 测试依赖 chunk 文件排列顺序，升级后失败。排查发现业务并不应该依赖顺序，于是修了测试；另一个 SSR externalization 差异则确实影响运行，必须调整包出口。对比的目标不是让每个字节一致，而是识别哪些差异有业务含义。

## server.warmup 不是越多越快

Vite 5 提供 `server.warmup`，可以在启动时预转换常用模块，减少打开页面时的转换瀑布：

```js
export default defineConfig({
  server: {
    warmup: {
      clientFiles: [
        './src/main.ts',
        './src/router.ts',
        './src/layouts/AppLayout.vue'
      ]
    }
  }
})
```

如果把整个 src glob 进去，就重新把按需开发变成启动前全量工作。我们从真实首页请求瀑布和转换日志挑三个稳定入口，并比较“server ready”与“页面可交互”两个时间。启动日志更快不代表开发者更早看到页面。

## 慢启动最后定位到 barrel file

升级后某个项目仍慢，打开 `DEBUG=vite:*`/性能分析后发现，入口通过一个 `components/index.ts` 重导出两百多个组件：

```ts
export * from './charts'
export * from './editors'
export * from './tables'
```

首页只用一个 Button，却把大量模块带进转换图。我们改为直接入口和包级显式 exports。这个问题不是 Vite 5 制造的，升级只是提供了重新测量的机会。

## 插件兼容要覆盖 dev、build 与 SSR

自研插件分别用了 `transform`、虚拟模块和 `generateBundle`。测试矩阵如下：

```text
dev: 模块能加载、HMR 能更新
build: 产物与 manifest 正确
preview: base 路径与动态 chunk 正确
SSR: external/resolve 行为正确
```

只有 `vite dev` 能启动不能证明 generateBundle 钩子兼容；只有 build 成功也不能证明 HMR。我们给每个关键插件建了最小 fixture，类似官方 ecosystem CI 的下游验证思路。

## 废弃 API 不要拖到下一个大版本

Vite 大版本节奏较快，长期忽略 warning 会让多批变化同时到来。升级完成后 CI 会扫描构建日志中的 Vite deprecation（对可控警告维护 allowlist），新警告作为需要处理的技术债，而不是等构建失败才看。

同样，内部插件不导入 Vite 未公开路径。少写几十行绕过 API 的“捷径”，能省掉以后每次主版本追内部实现的成本。

## 升级结果

Rollup 4 构建有实际改善，Node/ESM 统一让配置更干净，warmup 只在一个大型后台保留。更重要的是升级过程留下了产物对比与插件 fixture，后续主版本不再靠人工点两页。

Vite 5 本身是一轮相对直接的大版本，但它体现了现代前端工具的现实：Node 生命周期、ESM 包边界、生产构建器与插件生态绑定在一起。升级顺序从运行时开始，验收以最终产物结束，中间每层都能单独回滚，才不会把“依赖升成功”误认为项目已经迁完。

## 资料

- [Vite 5.0 发布说明](https://vite.dev/blog/announcing-vite5)
- [Vite：Performance](https://vite.dev/guide/performance)
- [Vite：Migration from v4](https://vite.dev/guide/migration)
