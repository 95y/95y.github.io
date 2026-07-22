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


webpack 5 完成核心架构升级，改善持久化缓存、长期缓存和 Tree Shaking，并正式带来 Module Federation。

微前端获得强大的底层能力，但远程模块也引入版本协商、部署原子性和故障隔离等分布式系统问题。

## 远程模块如何暴露给其他应用

Module Federation 需要明确远程边界与共享依赖：

```js
new ModuleFederationPlugin({
  name: 'checkout',
  exposes: { './Cart': './src/Cart' },
  shared: { react: { singleton: true } }
})
```

## 远程模块失败时页面怎么办

Module Federation 把编译期依赖变成运行时网络依赖。远程入口超时、版本尚未同步或 CDN 缓存异常时，宿主应用必须有降级界面。共享 React 等单例依赖还要防止版本不兼容，否则问题会从构建失败变成线上运行时错误。

## 缓存优化要看发布结果

确定性 ID 和 contenthash 只有在非相关模块改动后保持稳定，才真正减少用户下载。升级后可以连续构建两次，只修改一个业务模块，再比较 dist 中其他文件的 hash；这比只看配置项是否开启更可靠。

## 持久化缓存与稳定 Hash

- 文件系统缓存显著缩短重复构建时间
- 确定性模块与 chunk ID 改善浏览器长期缓存
- Module Federation 支持运行时加载远程构建产物

## Module Federation 不适合所有团队

只有在团队和发布边界确实独立时才引入 Federation；共享依赖必须约束版本，并准备远程模块不可用时的降级方案。

## webpack 5 发布记录

- [webpack 5 发布公告](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
