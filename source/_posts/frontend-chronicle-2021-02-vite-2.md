---
title: "Vite 2：从 Vue 工具成长为框架无关构建平台"
date: 2021-02-16 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2021
categories:
  - 前端年鉴
description: "Vite 2 首个稳定版本发布，核心改为框架无关，通过插件支持 Vue、React、Preact 等生态。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-2.svg
top_img: /img/covers/frontend-chronicle-vite-2.svg
toc: true
---
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## Rollup 生态如何被复用

Vite 不只是更快的 dev server，它把工具能力下沉为多种上层框架共享的基础设施。

## 框架能力为什么放进插件

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```



## esbuild 负责了哪一段工作

- esbuild 用于依赖预构建，显著改善冷启动
- 兼容 Rollup 插件模型，降低生态建设成本
- CSS、Worker、静态资源与 SSR 获得统一开发体验

## Vite 如何从 Vue 工具变成通用平台

Vite 2 首个稳定版本发布，核心改为框架无关，通过插件支持 Vue、React、Preact 等生态。

## webpack 项目迁移前先找专用 Loader

新项目可优先评估 Vite；旧项目迁移前要盘点 webpack 专用 loader、Node polyfill 和环境变量行为。

## Vite 2.0 发布说明

- [Vite 官方博客](https://vite.dev/blog/)
