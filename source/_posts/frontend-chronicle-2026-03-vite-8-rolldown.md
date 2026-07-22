---
title: "Vite 8：Rolldown 统一内核正式落地"
date: 2026-03-12 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2026
categories:
  - 前端年鉴
description: "Vite 8 正式发布，以 Rolldown 作为统一的 Rust 打包器。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-8-rolldown.svg
top_img: /img/covers/frontend-chronicle-vite-8-rolldown.svg
toc: true
---


Vite 8 正式发布，以 Rolldown 作为统一的 Rust 打包器。官方给出的生产构建提升可达一个数量级，同时尽量保持插件兼容。

这是 Vite 2 之后最重要的底层变化，表明前端主流工具链已全面进入原生实现与统一内核阶段。

## 留下升级前后的构建日志

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```

## 先比较产物，再比较秒数

构建时间下降很吸引人，但升级首先要保证动态导入、CSS 顺序、资源路径和库模式输出没有变化。可以把旧版与新版产物分别保存，在同一套端到端测试中运行，再记录冷启动和构建耗时。性能数字应该排在正确性之后。

## 插件兼容要覆盖真实钩子

只启动开发服务器不能证明插件兼容。使用 transform、generateBundle、虚拟模块或 SSR 钩子的插件，应同时跑开发、生产构建和服务端渲染。内部 API 用得越多，越适合拆成单独升级批次。

## Rolldown 如何统一构建路径

- 开发与生产共享更多解析和转换基础设施
- 大型项目获得更明显的构建与重载收益
- 浏览器控制台转发等能力改善调试闭环

## 复杂插件项目要分阶段验证

升级必须保留前后产物对比和端到端测试；含复杂 Rollup 插件、SSR 或库模式的项目应分阶段验证。

## Vite 8 正式版说明

- [Vite 8.0](https://vite.dev/blog/announcing-vite8)
