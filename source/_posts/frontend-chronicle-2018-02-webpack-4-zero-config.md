---
title: "webpack 4：从复杂配置走向合理默认值"
date: 2018-02-25 09:00:00
tags:
  - 前端年鉴
  - webpack
  - 2018
categories:
  - 前端年鉴
description: "从一份 400 行 webpack 配置里逐项删代码，用构建基线、产物对比和缓存验证说明 webpack 4 的合理默认值。"
cover: /img/covers/frontend-chronicle-webpack-4-zero-config.svg
top_img: /img/covers/frontend-chronicle-webpack-4-zero-config.svg
toc: true
---
webpack 4 发布前，我们有一份接近 400 行的配置。里面既有复制粘贴来的“性能优化”，也有早已失效的兼容代码。没有人敢删，因为每一行旁边似乎都能讲出一个理由；也没有人能证明它们还在产生价值。

`mode` 是 webpack 4 最容易被低估的改变。它没有消灭配置文件，却把开发和生产环境的一组合理默认值收进一个明确的开关。那次升级真正做成的事情，不是再加几个插件，而是逼着我们逐项回答：这段配置到底解决了什么问题？

## 先给旧配置做一次体检

升级之前我保留了三组数据：冷启动时间、生产构建时间和主要 chunk 体积。还在浏览器里跑了一遍登录、首屏、动态路由和错误上报。没有这些基线，所谓“构建变快了”通常只是感觉。

旧配置里有一段手工设置环境变量、压缩器和 source map 的代码：

```js
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  devtool: process.env.NODE_ENV === 'production'
    ? 'source-map'
    : 'cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    new UglifyJsPlugin()
  ]
}
```

到了 webpack 4，最小配置先收缩成：

```js
module.exports = (_, argv) => ({
  mode: argv.mode || 'development',
  entry: './src/index.js',
  output: {
    filename: '[name].[contenthash].js',
    clean: true
  }
})
```

`mode: 'production'` 会启用面向生产的一组优化，development 则保留更适合调试的默认行为。它不是魔法，也不表示所有项目都不用配置；价值在于团队不必各自维护一套“什么才算生产模式”的零散约定。

## 删掉配置以后，先看行为有没有改变

删配置比加配置更需要验证。我们每次只移除一组，连续构建两次并比较产物：

- 入口与异步 chunk 是否仍按预期拆分；
- 线上 source map 是否只上传到错误平台，而没有公开暴露；
- 修改一个业务模块后，无关 vendor 文件的 hash 是否稳定；
- CSS 和图片路径在 CDN 前缀下是否正确；
- 老浏览器语法兼容是否由 Babel 继续负责。

有一项优化删除后，首屏体积反而下降了。原因是旧版 CommonsChunkPlugin 规则把不相关页面的依赖强行收进公共包。配置叫“公共代码提取”，不等于结果一定更好。

## Tree Shaking 为什么有时毫无效果

webpack 4 改进了基于 ES Module 的 Tree Shaking，但它依赖静态模块结构与正确的副作用声明。下面两种入口看起来都能拿到 `formatPrice`，对构建器的可分析程度却不同：

```js
// 更容易静态分析
import { formatPrice } from './money.js'

// CommonJS 的动态特性会增加分析难度
const money = require('./money.js')
money.formatPrice(100)
```

库的 `package.json` 如果错误写了 `"sideEffects": false`，构建器甚至可能删掉必须执行的 CSS 导入或全局注册代码。反过来，完全不声明副作用，很多可删除模块又会被保留。

```json
{
  "sideEffects": [
    "*.css",
    "./src/polyfills.js"
  ]
}
```

所以验证 Tree Shaking 不能只看配置项，应当用 bundle analyzer 或 stats 找出“为什么这个模块还在”，再检查导入方式、包声明和实际副作用。

## 开发配置与生产配置不要长成两个项目

早期我们维护 `webpack.dev.js` 和 `webpack.prod.js` 两份完整对象，时间久了 loader 顺序和 alias 都不一样，出现过开发正常、生产找不到模块的情况。后来把公共部分留在基础配置，只在差异点上合并：

```js
const { merge } = require('webpack-merge')
const common = require('./webpack.common')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  performance: {
    hints: 'warning',
    maxEntrypointSize: 350 * 1024
  }
})
```

体积阈值也不是越小越专业。后台系统与内容站的首屏目标不同，阈值应该来自性能预算和真实网络数据。至少它能让一次意外引入整个图表库的提交在 CI 中被看见。

## 升级时踩过的几个坑

webpack 核心升级成功，只代表配置能被解析。真正容易失败的是周边：

1. loader/plugin 仍调用旧版内部接口；
2. Node 版本太旧，构建机与开发机行为不一致；
3. Babel 只转译业务源码，某个依赖发布了新语法；
4. `process.env.NODE_ENV` 在启动脚本中没有按预期传入；
5. 动态导入生成的新文件名与 CDN 缓存规则冲突。

我们没有一次性把所有依赖升级到最新版，而是先升级核心和必要插件，构建通过后再逐项更新。每一步都有产物可对比，也能快速回滚。

## webpack 4 留下的是一套更好的默认意识

“零配置”这个说法容易让人误会。真实项目始终需要入口、资源处理、缓存和发布策略。webpack 4 的进步，是让默认值覆盖常见场景，让配置重新聚焦项目特有的问题。

从那次清理以后，我不再把配置长度当成工程能力。每加一段规则，都应该能说清触发条件、验证方法和删除时机；每做一次构建升级，都要同时比较速度、产物和运行行为。能删掉并证明没问题的配置，往往比新加十个插件更有价值。

## 资料

- [webpack：Mode](https://webpack.js.org/configuration/mode/)
- [webpack：Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [webpack 官方博客](https://webpack.js.org/blog/)
