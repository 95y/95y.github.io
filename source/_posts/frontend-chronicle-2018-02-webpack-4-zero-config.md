---
title: "webpack 4：从复杂配置走向合理默认值"
date: 2018-02-25 09:00:00
tags:
  - 前端年鉴
  - webpack
  - 2018
categories:
  - 前端年鉴
description: "webpack 4 引入 development 与 production 模式，强化默认优化，并显著改善构建性能。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-webpack-4-zero-config.svg
top_img: /img/covers/frontend-chronicle-webpack-4-zero-config.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。webpack 这次变化就是一个典型例子。

## 2018 年，项目里正在发生什么

webpack 4 引入 development 与 production 模式，强化默认优化，并显著改善构建性能。前端构建开始从“所有选项都手配”转向约定优于配置。

构建配置不再只是能跑即可，而成为缓存、包体积、发布稳定性和开发体验的共同入口。

## 代码里最直观的变化

构建配置先保持可测量，再逐项加入优化：

```js
module.exports = {
  mode: 'production',
  entry: './src/index.js'
}
```

## 这部分最容易被忽略

- mode 统一开发与生产环境的基础优化策略
- 更好的 Tree Shaking 和模块拼接降低生产包开销
- 生态开始围绕 loader、plugin 与代码分割形成稳定分工

## 今天再做一次选择

老 webpack 项目先分析产物和升级插件，不要复制一份全新的配置硬替换；每次升级都应对比构建时间、首屏资源和运行时错误。

## 版本记录与延伸阅读

- [webpack 官方博客](https://webpack.js.org/blog/)
