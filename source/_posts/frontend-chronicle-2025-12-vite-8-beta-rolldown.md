---
title: "Vite 8 Beta：Rolldown 开始统一开发与生产构建"
date: 2025-12-03 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2025
categories:
  - 前端年鉴
description: "Vite 8 Beta 完整集成 Rolldown，准备结束开发阶段使用 esbuild、生产阶段使用 Rollup 的双内核历史。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-8-beta-rolldown.svg
top_img: /img/covers/frontend-chronicle-vite-8-beta-rolldown.svg
toc: true
---
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 这次升级真正解决了什么

统一内核可以减少开发与生产行为差异，但底层替换仍可能暴露依赖解析、插件钩子和输出顺序差异。

## 先动手跑一下

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```

## 这部分最容易被忽略

- Rust 编写的 Rolldown 统一主要打包路径
- Rollup 兼容目标帮助现有插件渐进迁移
- 大项目构建性能成为本轮架构升级核心

## 从当时的开发现场说起

Vite 8 Beta 完整集成 Rolldown，准备结束开发阶段使用 esbuild、生产阶段使用 Rollup 的双内核历史。

## 别急着把老项目全部重写

Beta 适合在 CI 影子构建中验证，不应未经回归直接替换生产链路；重点比较产物、动态导入和插件行为。

## 版本记录与延伸阅读

- [Vite 8.0](https://vite.dev/blog/announcing-vite8)
