---
title: "2023 前端技术演进：Next.js 13.4：App Router 稳定后的缓存与边界课题"
date: 2023-05-04 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2023
categories:
  - 前端年鉴
description: "Next.js 13.4 将 App Router 标记为稳定，Server Components、嵌套路由和 Server Actions alpha 进入更广泛生产实践。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

Next.js 13.4 将 App Router 标记为稳定，Server Components、嵌套路由和 Server Actions alpha 进入更广泛生产实践。

## 核心变化

- 服务器组件成为 App Router 默认组件类型
- 路由段支持独立加载、错误与重新验证策略
- 数据缓存和路由缓存成为性能模型的一部分

## 为什么重要

框架替开发者做了更多优化，也意味着团队必须理解请求记忆化、数据缓存与客户端路由缓存的差异。

## 放到今天怎么实践

为动态数据显式选择缓存策略；所有 Server Action 都做鉴权与输入校验，并用端到端测试覆盖缓存失效。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [Next.js 官方博客](https://nextjs.org/blog)
