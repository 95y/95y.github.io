---
title: "Vite 2：从 Vue 工具成长为框架无关构建平台"
date: 2021-02-16 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2021
categories:
  - 前端年鉴
description: "把一个 React 数据看板迁到 Vite 2，逐项处理入口、require.context、环境变量、CSS 与自定义插件。"
cover: /img/covers/frontend-chronicle-vite-2.svg
top_img: /img/covers/frontend-chronicle-vite-2.svg
toc: true
---
Vite 2.0 是我第一次敢把 Vite 用在非 Vue 项目里的版本。它把核心重写成框架无关，Vue、React、Preact 等能力由插件提供；插件接口又尽量复用 Rollup 生态。早期“给 Vue 单文件组件用的快速开发服务器”，到这一版才真正有了通用构建平台的轮廓。

我当时拿一个独立的 React 数据看板做迁移。项目不大，webpack 配置却有 Babel、CSS Modules、SVG loader、环境变量和代理。这个规模刚好能看到差异，也不至于把主站发布押在一套新工具上。

## 迁移第一天：先让入口跑起来

webpack 入口由配置指定，Vite 默认把 HTML 当作应用入口。旧项目的模板：

```html
<div id="root"></div>
```

改成显式 ESM：

```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```

再安装官方 React 插件：

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

启动速度明显改善，但“首页能打开”只完成了不到一半。真正迁移成本藏在 webpack 特有行为里。

## 把 webpack 特有能力列成清单

我们没有边报错边搜索，而是先搜索配置和源码：

- `require.context` 是否用于批量加载页面；
- SVG 是 URL、raw 文本还是转换成 React 组件；
- 是否依赖 `process.env` 和 DefinePlugin；
- loader 有没有注入全局变量或修改源码；
- `publicPath` 对应的部署子路径是什么；
- Node 的 `Buffer`、`process`、`path` 是否意外进入浏览器代码；
- 动态导入路径能否被静态分析。

比如 `require.context` 需要改成 `import.meta.glob`：

```js
const modules = import.meta.glob('./pages/*.jsx')

export async function loadPage(name) {
  const loader = modules[`./pages/${name}.jsx`]
  if (!loader) throw new Error(`Unknown page: ${name}`)
  return loader()
}
```

Vite 能看到 glob 模式并生成对应动态导入。把任意用户输入直接拼进 `import()`，生产构建通常无法知道要包含哪些文件。

## esbuild 快在它负责的那一段

Vite 2 使用 esbuild 做依赖预构建，把 CommonJS/UMD 依赖转换成 ESM，并合并依赖内部的大量模块请求。官方发布说明给出的重依赖示例有显著提升，但项目中的实际数字仍要自己测。

业务源码的转换、框架 Fast Refresh 和生产打包不是全都由 esbuild 一手包办。React 插件负责 JSX/Fast Refresh 语义，生产构建仍基于 Rollup。理解职责以后，遇到问题才能判断是依赖优化、插件 transform 还是生产 bundle。

有个内部包同时提供 CJS 与 ESM，开发时入口解析正确，构建时却走了另一个条件导出。我们最终修的是包的 `exports`，不是给 Vite 加更多 alias。工具升级经常把原本模糊的包边界暴露出来。

## 环境变量迁移必须逐个确认

旧项目：

```js
const apiBase = process.env.REACT_APP_API_BASE
```

Vite 中使用：

```js
const apiBase = import.meta.env.VITE_API_BASE
```

我们把环境变量做成一张表：变量名、哪个环境提供、能否公开、缺失时是否阻止构建。任何进入 `import.meta.env` 客户端代码的值都可能出现在最终 bundle 中，不能放服务端 secret。

```ts
const apiBase = import.meta.env.VITE_API_BASE

if (!apiBase) {
  throw new Error('VITE_API_BASE is required')
}
```

相比静默使用空字符串，构建或启动时明确失败更容易排查。

## 写一个小插件理解两套生命周期

项目需要在构建时生成版本模块。我们用一个很小的插件完成：

```js
function buildInfoPlugin() {
  const virtualId = 'virtual:build-info'
  const resolvedId = '\0' + virtualId

  return {
    name: 'build-info',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify({
          version: process.env.APP_VERSION || 'dev'
        })}`
      }
    }
  }
}
```

`resolveId`、`load` 来自 Rollup 风格钩子，开发和构建都能复用。Vite 还提供只在 dev server 或特定阶段执行的扩展。插件作者必须明确钩子运行在哪个环境，不能假设始终存在浏览器或始终存在最终 bundle。

## CSS 和静态资源是最容易漏测的部分

JS 跑通以后，我们重点回归了：

- CSS Modules 的类名与组合规则；
- Sass 全局变量是否通过额外配置注入；
- `url()` 在嵌套文件中的重写结果；
- 小图片内联阈值与 CDN 地址；
- 动态路由 chunk 对应 CSS 是否会同步加载；
- 部署在 `/dashboard/` 子路径时 `base` 是否正确。

```js
export default defineConfig({
  base: '/dashboard/',
  plugins: [react()]
})
```

本地根路径正常不代表子路径发布正常。我们用和生产一致的前缀启动静态服务器，直接刷新二级路由，检查 HTML、JS、CSS 和图片请求。

## 最终为什么留下 Vite 2

迁移后冷启动与热更新改善是最直观的收益，更长期的价值是配置回到了标准 ESM、Rollup 插件和 Web API 附近。这个 React 项目没有因为 Vite 源于 Vue 而得到“二等支持”，说明框架能力下沉到插件的方向是有效的。

但我没有因此立刻迁移所有 webpack 项目。依赖 Module Federation、自定义 loader 或复杂多页发布的系统，需要单独计算迁移收益。Vite 2 适合成为新项目和相对标准项目的默认候选，不是删掉既有工具链的行政命令。

## 资料

- [Vite 2.0 发布说明](https://vite.dev/blog/announcing-vite2.html)
- [Vite：Plugin API](https://vite.dev/guide/api-plugin)
- [Vite：Glob Import](https://vite.dev/guide/features.html#glob-import)
