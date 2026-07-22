---
title: "Vite 萌芽：原生 ESM 改变开发服务器思路"
date: 2020-07-15 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2020
categories:
  - 前端年鉴
description: "从四十秒冷启动到按需模块请求，沿浏览器 Network 面板拆开 Vite 的原生 ESM、依赖预构建与 HMR。"
cover: /img/covers/frontend-chronicle-vite-native-esm-origin.svg
top_img: /img/covers/frontend-chronicle-vite-native-esm-origin.svg
toc: true
---
2020 年那段时间，我维护的一个 Vue 项目冷启动要等四十多秒。改一处底层工具函数，页面上的进度条会先跑一遍模块重建，再刷新。项目越大，等待越长，大家逐渐把“启动后不要关 dev server”当成工作习惯。

Vite 早期版本让我觉得新鲜的不是配置更少，而是它重新安排了开发阶段的工作：浏览器需要哪个源码模块，服务器再转换并返回哪个；不再在启动前把整个应用先打成 bundle。

## 打开 Network，原生 ESM 的链路就在那里

一个最小入口可能只有：

```html
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

```js
// /src/main.js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

浏览器请求 `/src/main.js`，解析到导入后继续请求 `App.vue` 等模块。开发服务器拦截这些请求，把 `.vue`、TypeScript 或 JSX 转换成浏览器能执行的 ESM，再返回结果。

这与传统 bundle-based dev server 的主要差别，是冷启动不必先遍历并打包全部业务模块。首页没访问到的路由，初始阶段可以不处理。模块规模增长时，这种按需模型尤其明显。

## 裸导入不是浏览器天然能理解的

浏览器知道 `./App.vue` 是相对路径，却不知道下面的 `vue` 应该去 `node_modules` 哪个文件：

```js
import { createApp } from 'vue'
```

Vite 会解析并处理这类 bare import。早期实现和后来细节会变化，但核心问题一直存在：npm 包的入口、CommonJS/ESM 格式和大量内部模块不适合原样交给浏览器逐个请求。

依赖预构建承担了两件重要工作：把需要的 CommonJS/UMD 依赖转换为 ESM，并把内部模块很多的依赖合并成更少请求。源码按需转换与依赖预构建是不同路径，不能简单总结成“Vite 完全不打包”。

如果依赖扫描没发现一个只在条件分支里动态导入的包，第一次访问时可能触发重新优化与页面刷新。排查这类问题要看 Vite 的优化日志和依赖入口，而不是只看业务模块。

## 一次修改为什么能只更新一个组件

原生 ESM 让模块边界直接存在于浏览器，但 HMR 仍需要开发服务器维护模块关系。文件变化后，服务器沿模块图找到可接受更新的边界，通过 WebSocket 通知客户端加载带新时间戳的模块。

框架插件负责保留组件状态等更高层语义。以 Vue 单文件组件为例，修改 `<style>` 可以只替换样式，修改 template 可以更新 render，尽量不重新创建整个应用。

自己写模块时也能看到 HMR API 的基本形态：

```js
export function formatPrice(value) {
  return `¥${value.toFixed(2)}`
}

if (import.meta.hot) {
  import.meta.hot.accept(newModule => {
    console.log('formatter updated', newModule)
  })
}
```

并不是所有变更都能保持状态。模块有顶层副作用、无法找到 accept 边界或插件没有正确实现转换时，仍可能全页刷新。HMR 快不代表可以忽略模块副作用。

## 开发快，不等于生产环境直接发源码

Vite 的开发阶段利用原生 ESM 按需服务模块，生产阶段仍需要打包、Tree Shaking、压缩、代码分割和资源 hash。早期 Vite 选择 Rollup 承担生产构建，这形成了开发与生产两条不同链路。

这带来一个必须认真对待的问题：dev 正常不代表 build 正常。典型差异包括：

- 大小写错误在 macOS 开发机不明显，Linux 构建失败；
- 动态导入路径无法被静态分析，生产 chunk 缺失；
- 某个包的开发入口是 ESM，生产条件导出走到另一个文件；
- CSS 顺序、base 路径或 public 资源地址只在部署后出错；
- 依赖读取 Node 全局变量，开发插件碰巧提供了替代。

因此 CI 必须真正执行生产构建，并用 `vite preview` 或部署后的静态服务器做冒烟测试。

## 环境变量不是把 process.env 搬过来

Vite 使用 `import.meta.env` 暴露构建时环境，并通常只把指定前缀的变量交给客户端：

```js
const apiBase = import.meta.env.VITE_API_BASE
```

带前缀不代表安全。只要进入客户端构建，用户就能在产物中看到它。数据库密码、私钥和服务端 token 绝不能因为变量名改了就注入前端。

迁移旧项目时，`process.env.*` 往往散落在业务代码和依赖中。我们先列出每个变量的用途：构建开关、公开 API 地址还是服务端秘密，再决定替换方式，而不是全局 define 一个空的 `process.env` 把错误压下去。

## Vite 也会慢，通常慢在具体环节

项目使用 Vite 后，如果启动或热更新重新变慢，我会把问题分开测：

1. 依赖优化耗时，是否频繁失效缓存；
2. 某个插件的 transform 是否对每个模块做昂贵工作；
3. barrel file 是否让一个小改动牵动巨大模块图；
4. 浏览器是否同时请求了成千上万个细碎模块；
5. 类型检查、lint 是否被错误地塞进同步转换链。

工具的架构能降低基础成本，不能消除不受控依赖和插件。大型图标包、全量 locale 和跨层 barrel export，换构建器后仍然可能拖慢开发。

## 当时没有直接迁移全部项目

新项目试用很顺利，旧项目却有自定义 webpack loader、全局注入和一套特殊的多页构建。我们先迁了内部工具和独立页面，用真实数据记录启动、HMR 与生产构建，再决定主项目是否值得投入。

这段经历让我对 Vite 的理解不再停在“快”。它改变的是开发服务器的成本模型：业务源码按需转换，依赖单独优化，生产交给构建器。今天 Vite 的内部已经继续演进，但从 Network 面板理解模块请求、从插件和模块图定位性能问题，仍比背一组宣传数字更有用。

## 资料

- [Vite：Why Vite](https://vite.dev/guide/why)
- [Vite：Dependency Pre-Bundling](https://vite.dev/guide/dep-pre-bundling)
- [Vite 官方博客](https://vite.dev/blog/)
