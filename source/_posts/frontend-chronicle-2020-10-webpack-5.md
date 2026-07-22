---
title: "2020 前端技术演进：webpack 5：长期缓存与 Module Federation"
date: 2020-10-10 09:00:00
tags:
  - 前端年鉴
  - webpack
  - 2020
categories:
  - 前端年鉴
description: "webpack 5 完成核心架构升级，改善持久化缓存、长期缓存和 Tree Shaking，并正式带来 Module Federation。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

webpack 5 完成核心架构升级，改善持久化缓存、长期缓存和 Tree Shaking，并正式带来 Module Federation。

## 核心变化

- 文件系统缓存显著缩短重复构建时间
- 确定性模块与 chunk ID 改善浏览器长期缓存
- Module Federation 支持运行时加载远程构建产物

## 为什么重要

微前端获得强大的底层能力，但远程模块也引入版本协商、部署原子性和故障隔离等分布式系统问题。

## 放到今天怎么实践

只有在团队和发布边界确实独立时才引入 Federation；共享依赖必须约束版本，并准备远程模块不可用时的降级方案。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [webpack 5 发布公告](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
