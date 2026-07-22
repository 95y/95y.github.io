---
title: "webpack 5：长期缓存与 Module Federation"
date: 2020-10-10 09:00:00
tags:
  - 前端年鉴
  - webpack
  - 2020
categories:
  - 前端年鉴
description: "webpack 5 完成核心架构升级，改善持久化缓存、长期缓存和 Tree Shaking，并正式带来 Module Federation。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-webpack-5.svg
top_img: /img/covers/frontend-chronicle-webpack-5.svg
toc: true
---
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 为什么后来大家都跟进了

微前端获得强大的底层能力，但远程模块也引入版本协商、部署原子性和故障隔离等分布式系统问题。

## 先动手跑一下

Module Federation 需要明确远程边界与共享依赖：

```js
new ModuleFederationPlugin({
  name: 'checkout',
  exposes: { './Cart': './src/Cart' },
  shared: { react: { singleton: true } }
})
```

## 落到工程里，我关注这几件事

- 文件系统缓存显著缩短重复构建时间
- 确定性模块与 chunk ID 改善浏览器长期缓存
- Module Federation 支持运行时加载远程构建产物

## webpack 当时想解决的问题

webpack 5 完成核心架构升级，改善持久化缓存、长期缓存和 Tree Shaking，并正式带来 Module Federation。

## 如果现在接手这样的项目

只有在团队和发布边界确实独立时才引入 Federation；共享依赖必须约束版本，并准备远程模块不可用时的降级方案。

## 我参考的资料

- [webpack 5 发布公告](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
