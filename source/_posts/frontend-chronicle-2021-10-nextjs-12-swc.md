---
title: "2021 前端技术演进：Next.js 12：SWC、Middleware 与边缘运行时方向"
date: 2021-10-26 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2021
categories:
  - 前端年鉴
description: "Next.js 12 使用 Rust 编写的 SWC 改善编译和压缩速度，并推出 Middleware、React 18 与 Server Components 的早期支持。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

Next.js 12 使用 Rust 编写的 SWC 改善编译和压缩速度，并推出 Middleware、React 18 与 Server Components 的早期支持。

## 核心变化

- SWC 替代部分 Babel 与 Terser 工作
- Middleware 把请求处理逻辑放到路由渲染之前
- 框架开始同时管理编译、数据、路由与部署运行时

## 为什么重要

全栈 React 框架的边界扩大，构建速度和部署模型开始由框架深度优化。

## 放到今天怎么实践

自定义 Babel 插件较多的项目迁移 SWC 时要做语义回归；Middleware 适合轻量路由判断，不适合塞入重业务。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [Next.js 官方博客](https://nextjs.org/blog)
