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
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 这次升级真正解决了什么

开发服务器、测试、组件文档和框架构建逐渐共享一张模块图，减少重复配置，也放大插件兼容的重要性。

## 先动手跑一下

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```

## 这部分最容易被忽略

- 统一插件接口让框架、测试和文档工具共享能力
- 更快的大版本节奏配合清晰迁移指南
- Node 支持周期开始直接影响 Vite 主版本

## 从当时的开发现场说起

Vite 4 升级 Rollup 3，并伴随 Vitest、VitePress 以及多个元框架形成更完整生态。

## 别急着把老项目全部重写

把 Vite 配置保持在标准能力内，避免深度依赖内部 API；升级主版本时运行完整插件兼容测试。

## 版本记录与延伸阅读

- [Vite 官方博客](https://vite.dev/blog/)
