---
title: "2022 前端技术演进：Next.js 13：App Router 与 Server Components 落地"
date: 2022-10-25 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2022
categories:
  - 前端年鉴
description: "Next.js 13 推出 app 目录、嵌套布局、Server Components、Streaming 和 Turbopack alpha，开启新的 React 全栈应用模型。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

Next.js 13 推出 app 目录、嵌套布局、Server Components、Streaming 和 Turbopack alpha，开启新的 React 全栈应用模型。

## 核心变化

- 布局与页面默认运行在服务器组件环境
- loading、error 等文件约定形成路由级状态边界
- 服务端数据获取与 React 缓存模型深度结合

## 为什么重要

组件放在哪里执行变成架构决策。错误的客户端边界会增加 JS，错误的缓存理解则会产生陈旧数据。

## 放到今天怎么实践

从叶子交互组件开始添加 use client，尽量保持服务器组件树；升级时逐路由迁移，不必一次删除 Pages Router。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [Next.js 官方博客](https://nextjs.org/blog)
