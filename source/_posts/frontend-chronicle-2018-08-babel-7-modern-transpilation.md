---
title: "Babel 7：现代 JavaScript 转译体系重新整理"
date: 2018-08-27 09:00:00
tags:
  - 前端年鉴
  - Babel
  - 2018
categories:
  - 前端年鉴
description: "Babel 7 统一包命名空间、改进 TypeScript 解析支持，并推动 preset-env 与按目标环境转译成为主流。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-babel-7-modern-transpilation.svg
top_img: /img/covers/frontend-chronicle-babel-7-modern-transpilation.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。Babel 这次变化就是一个典型例子。

## Babel 当时想解决的问题

Babel 7 统一包命名空间、改进 TypeScript 解析支持，并推动 preset-env 与按目标环境转译成为主流。

团队开始意识到“代码能被编译”不代表“目标浏览器拥有所需 API”。语法降级、polyfill 和浏览器列表需要作为一套兼容策略管理。

## 代码里最直观的变化

先把问题缩小到一个能独立运行的例子：

```js
function reproduce(input) {
  console.log({ input })
  return input
}
```

## 落到工程里，我关注这几件事

- 官方包迁移到 @babel 命名空间
- preset-env 根据浏览器目标决定语法转换范围
- 语法转译与运行时 polyfill 的职责被更明确地区分

## 如果现在接手这样的项目

定期更新 Browserslist 数据，避免无差别转译到 ES5；同时检查 core-js 或运行时 API 的引入方式，防止重复 polyfill。

## 我参考的资料

- [Babel 7.0.0](https://babeljs.io/blog/2018/08/27/7.0.0)
