---
title: "Vite 5：Rollup 4 与现代 Node 基线"
date: 2023-11-16 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2023
categories:
  - 前端年鉴
description: "Vite 5 切换到 Rollup 4，要求 Node.js 18/20+，清理废弃 API，并继续改善开发服务器性能分析能力。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-5-rollup-4.svg
top_img: /img/covers/frontend-chronicle-vite-5-rollup-4.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。Vite 这次变化就是一个典型例子。

## Vite 5 为什么提高 Node 基线

Vite 5 切换到 Rollup 4，要求 Node.js 18/20+，清理废弃 API，并继续改善开发服务器性能分析能力。

工具升级越来越与 Node 生命周期、模块系统和插件维护状态绑定，长期不升级的成本会集中爆发。

## 把配置文件迁移到 ESM

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```



## Rollup 4 带来的构建变化

- 生产构建获得 Rollup 4 的性能改进
- CJS Node API 被弃用，推动配置与插件转向 ESM
- server.warmup 可提前转换常用模块

## 升级顺序应该从运行时开始

先升级 Node 和配置文件模块格式，再升级 Vite；用 ecosystem CI 思路验证关键插件而不是只看 dev 能否启动。

## Vite 5 发布说明

- [Vite 官方博客](https://vite.dev/blog/)
