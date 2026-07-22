---
title: "Vite 7：现代浏览器 Baseline 与 Node 20 基线"
date: 2025-06-24 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2025
categories:
  - 前端年鉴
description: "Vite 7 提高 Node.js 版本要求，并把默认浏览器目标与 Web Platform Baseline 对齐，减少对过旧环境的转换负担。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-7-baseline.svg
top_img: /img/covers/frontend-chronicle-vite-7-baseline.svg
toc: true
---
如果把时间拨回 2025 年，Vite 所面对的问题和今天并不完全一样。回头看这次变化，最有意思的不是版本号，而是开发方式从这里拐了一个弯。

## 浏览器兼容为什么改看 Baseline

Vite 7 提高 Node.js 版本要求，并把默认浏览器目标与 Web Platform Baseline 对齐，减少对过旧环境的转换负担。

## 显式写出项目的构建目标

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```



## 旧 WebView 仍要看真实数据

浏览器兼容策略开始从手写版本列表转向能力基线，但企业设备和 WebView 仍需要真实数据验证。

- 默认构建目标更贴近现代浏览器共同能力
- Node 20.19+/22.12+ 成为工具运行基线
- Rolldown 集成继续为统一构建内核做准备

## 升级前先统一开发机与 CI

根据用户监控确定 targets，不要盲从默认值；CI 和开发机必须统一 Node 版本。

## Vite 7 发布记录

- [Vite 官方博客](https://vite.dev/blog/)
