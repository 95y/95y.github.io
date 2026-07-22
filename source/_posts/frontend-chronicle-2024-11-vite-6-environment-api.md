---
title: "Vite 6：Environment API 面向多运行时框架"
date: 2024-11-26 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2024
categories:
  - 前端年鉴
description: "从一个 SSR 插件的三个错误假设出发，理解 Vite 6 Environment API 为何主要面向框架与插件作者。"
cover: /img/covers/frontend-chronicle-vite-6-environment-api.svg
top_img: /img/covers/frontend-chronicle-vite-6-environment-api.svg
toc: true
---
Vite 6 的 Environment API 不是普通 SPA 开发者每天都会调用的新功能。它主要服务框架与插件作者：同一个应用可能同时存在浏览器、Node SSR、边缘 runtime、测试沙箱，过去很多插件只靠 `ssr: true/false` 或全局分支猜自己正在处理哪一套模块。

我用一个极小的 SSR 插件做了升级实验。目标不是教人手写全栈框架，而是检查插件里那些默认“只有 client 与 Node 两个世界”的假设。

## 一个插件中的三个错误假设

旧插件负责注入构建信息：

```ts
export function runtimeInfoPlugin() {
  return {
    name: 'runtime-info',
    transform(code, id, options) {
      if (!id.endsWith('runtime-info.ts')) return

      const runtime = options?.ssr ? 'server' : 'client'
      return code.replace('__RUNTIME__', JSON.stringify(runtime))
    }
  }
}
```

它假设：

1. 非 client 就是 Node server；
2. server 可以使用 `process`、文件系统；
3. 同一个模块在所有服务端环境中都以相同方式执行。

加入 edge runtime 后，这些假设全可能错误。Edge 可能有 Web API，却没有完整 Node API；测试环境又可能模拟 DOM。

## 环境应该成为显式上下文

Environment API 的方向是让开发服务器/模块 runner 能表达多个命名环境，插件钩子在环境上下文中工作。Vite 6 发布时这套 API 仍是实验性，具体配置与接口会继续调整，所以业务应用不应该把内部形态写死。

插件设计可以先从环境无关开始：

```ts
function createRuntimeModule(runtime: 'client' | 'ssr' | 'edge') {
  return `export const runtime = ${JSON.stringify(runtime)}`
}
```

只有真正需要时再通过插件上下文选择实现；核心转换函数保持纯净并分别测试。这样即使实验 API 变化，业务逻辑也不必重写。

## 条件导出是另一个运行时边界

一个包可能针对浏览器与服务端提供不同入口：

```json
{
  "exports": {
    ".": {
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "default": "./dist/index.js"
    }
  }
}
```

框架开发服务器需要在每个环境按正确 conditions 解析模块。若 client 模块解析到 node 入口，可能把 `node:fs` 带进浏览器；edge 解析到 node 入口则上线才失败。

我们的 fixture 分别运行 client build、Node SSR 和 edge-like sandbox，断言解析到的 runtime 字符串与禁止 API。只跑一次 `vite build` 无法覆盖多环境模块图。

## HMR 在 SSR 环境不只是刷新浏览器

客户端 HMR 可以替换样式或组件，SSR 开发还要让服务器模块 runner 失效并重新执行。模块顶层如果创建数据库连接、定时器或全局注册，每次热更新都可能泄漏。

```ts
let dispose: (() => void) | undefined

export function startRuntime() {
  dispose?.()
  const timer = setInterval(refreshCache, 30_000)
  dispose = () => clearInterval(timer)
}
```

这只是简化示意。更好的框架/插件集成应使用明确的生命周期钩子，不让模块重新执行悄悄创建不可控资源。Environment API 让多环境 HMR 更可表达，也要求插件别把 transform 当一次性过程。

## `import.meta.env.SSR` 够用时，不要为了新 API 重写

普通 Vite SSR 应用只是偶尔分支：

```ts
if (import.meta.env.SSR) {
  // server-only path
}
```

这不代表一定要直接使用实验 Environment API。官方发布说明明确它面向框架作者和高级场景。普通 SPA/简单 SSR 首先升级 Vite、跑测试、处理 Sass 等迁移项即可。

选择实验 API 的标准应该是：确实要编排多个运行环境，并愿意跟随版本反馈/调整。为了“用上 Vite 6 新特性”引入并没有业务需求的环境配置，只会增加维护。

## Sass 默认 API 变化反而更贴近日常升级

Vite 6 的普通项目更可能遇到 Sass modern API 与弃用项。我们在升级日志中搜索 warning，检查自定义 importer 与全局样式注入，不让 deprecation 淹没。

```ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/styles/tokens.scss" as *;'
      }
    }
  }
})
```

`@import`/旧 API 迁移要结合 Sass 当前文档，不能因为 Vite build 成功就忽略未来移除警告。

## 多环境插件测试矩阵

我们给插件仓库加了下面的 fixture：

| 场景 | 重点 |
| --- | --- |
| client dev | HMR、浏览器无 Node 内建 |
| client build | 条件导出、资源与 source map |
| Node SSR dev | 模块重新执行与资源清理 |
| Node SSR build | externalization 与产物启动 |
| edge-like runtime | 禁止 fs/process 假设、Web API |

每个 fixture 都最小化，只验证插件承诺的能力。矩阵看起来多，却比在一个全功能 demo 中难以定位失败更省时间。

## Vite 6 给出的方向

Vite 从快速 SPA 构建工具逐渐成为许多全栈框架的共享基础设施。Environment API 试图把框架过去各自实现的模块运行环境下沉成公共能力，让插件更准确地知道“当前模块将在哪里运行”。

对应用开发者，正确动作可能只是升级并保持标准配置；对框架/插件作者，则应尽早清理 client/Node 二分假设，建立多环境测试。实验 API 最有价值的用法，是帮助生态反馈真实需求，而不是把不稳定接口包装成业务项目必须追的新潮写法。

## 资料

- [Vite 6 发布说明](https://vite.dev/blog/announcing-vite6)
- [Vite：Environment API](https://vite.dev/guide/api-environment)
- [Vite：SSR](https://vite.dev/guide/ssr)
