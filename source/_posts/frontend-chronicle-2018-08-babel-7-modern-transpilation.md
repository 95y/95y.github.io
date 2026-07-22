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
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## TypeScript 进入 Babel 工具链

团队开始意识到“代码能被编译”不代表“目标浏览器拥有所需 API”。语法降级、polyfill 和浏览器列表需要作为一套兼容策略管理。

## 按目标浏览器决定转译范围

先把问题缩小到一个能独立运行的例子：

```js
function reproduce(input) {
  console.log({ input })
  return input
}
```



## 语法转换和 Polyfill 是两件事

- 官方包迁移到 @babel 命名空间
- preset-env 根据浏览器目标决定语法转换范围
- 语法转译与运行时 polyfill 的职责被更明确地区分

## Babel 到底在转换什么

Babel 7 统一包命名空间、改进 TypeScript 解析支持，并推动 preset-env 与按目标环境转译成为主流。

## 避免把所有代码都编译成 ES5

定期更新 Browserslist 数据，避免无差别转译到 ES5；同时检查 core-js 或运行时 API 的引入方式，防止重复 polyfill。

## Babel 7 发布说明

- [Babel 7.0.0](https://babeljs.io/blog/2018/08/27/7.0.0)
