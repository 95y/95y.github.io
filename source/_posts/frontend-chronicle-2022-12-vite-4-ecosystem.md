---
title: "Vite 4：共享工具链生态进入稳定扩张期"
date: 2022-12-09 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2022
categories:
  - 前端年鉴
description: "Vite 4 升级 Rollup 3，并伴随 Vitest、VitePress 以及多个元框架形成更完整生态。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-4-ecosystem.svg
top_img: /img/covers/frontend-chronicle-vite-4-ecosystem.svg
toc: true
---
如果把时间拨回 2022 年，Vite 所面对的问题和今天并不完全一样。回头看这次变化，最有意思的不是版本号，而是开发方式从这里拐了一个弯。

## Vite 为什么不再只是一台开发服务器

Vite 4 升级 Rollup 3，并伴随 Vitest、VitePress 以及多个元框架形成更完整生态。

## 让测试与构建共享模块解析

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```



## Node 生命周期开始影响主版本

开发服务器、测试、组件文档和框架构建逐渐共享一张模块图，减少重复配置，也放大插件兼容的重要性。

- 统一插件接口让框架、测试和文档工具共享能力
- 更快的大版本节奏配合清晰迁移指南
- Node 支持周期开始直接影响 Vite 主版本

## 插件兼容比配置技巧更重要

把 Vite 配置保持在标准能力内，避免深度依赖内部 API；升级主版本时运行完整插件兼容测试。

## Vite 4 的发布记录

- [Vite 官方博客](https://vite.dev/blog/)
