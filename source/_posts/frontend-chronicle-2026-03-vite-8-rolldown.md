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
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 为什么后来大家都跟进了

这是 Vite 2 之后最重要的底层变化，表明前端主流工具链已全面进入原生实现与统一内核阶段。

## 先动手跑一下

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```

## 落到工程里，我关注这几件事

- 开发与生产共享更多解析和转换基础设施
- 大型项目获得更明显的构建与重载收益
- 浏览器控制台转发等能力改善调试闭环

## Vite 当时想解决的问题

Vite 8 正式发布，以 Rolldown 作为统一的 Rust 打包器。官方给出的生产构建提升可达一个数量级，同时尽量保持插件兼容。

## 如果现在接手这样的项目

升级必须保留前后产物对比和端到端测试；含复杂 Rollup 插件、SSR 或库模式的项目应分阶段验证。

## 我参考的资料

- [Vite 8.0](https://vite.dev/blog/announcing-vite8)
