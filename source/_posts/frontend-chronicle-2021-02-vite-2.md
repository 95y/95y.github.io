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
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## 为什么后来大家都跟进了

Vite 不只是更快的 dev server，它把工具能力下沉为多种上层框架共享的基础设施。

## Vite 当时想解决的问题

Vite 2 首个稳定版本发布，核心改为框架无关，通过插件支持 Vue、React、Preact 等生态。

## 落到工程里，我关注这几件事

1. esbuild 用于依赖预构建，显著改善冷启动
2. 兼容 Rollup 插件模型，降低生态建设成本
3. CSS、Worker、静态资源与 SSR 获得统一开发体验

## 用最小例子感受一下

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```

## 如果现在接手这样的项目

新项目可优先评估 Vite；旧项目迁移前要盘点 webpack 专用 loader、Node polyfill 和环境变量行为。

## 我参考的资料

- [Vite 官方博客](https://vite.dev/blog/)
