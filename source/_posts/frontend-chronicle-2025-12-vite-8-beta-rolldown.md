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
如果把时间拨回 2025 年，Vite 所面对的问题和今天并不完全一样。回头看这次变化，最有意思的不是版本号，而是开发方式从这里拐了一个弯。

## 为什么 Vite 想统一两套内核

Vite 8 Beta 完整集成 Rolldown，准备结束开发阶段使用 esbuild、生产阶段使用 Rollup 的双内核历史。

## 用影子构建验证 Beta

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```



## 开发与生产差异能否变小

统一内核可以减少开发与生产行为差异，但底层替换仍可能暴露依赖解析、插件钩子和输出顺序差异。

- Rust 编写的 Rolldown 统一主要打包路径
- Rollup 兼容目标帮助现有插件渐进迁移
- 大项目构建性能成为本轮架构升级核心

## Beta 不应该直接替换生产链路

Beta 适合在 CI 影子构建中验证，不应未经回归直接替换生产链路；重点比较产物、动态导入和插件行为。

## Vite 8 Beta 记录

- [Vite 8.0](https://vite.dev/blog/announcing-vite8)
