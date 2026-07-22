---
title: "Vite 6：Environment API 面向多运行时框架"
date: 2024-11-26 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2024
categories:
  - 前端年鉴
description: "Vite 6 推出实验性 Environment API，让框架可以为客户端、SSR、边缘或其他运行时定义不同模块执行环境。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-6-environment-api.svg
top_img: /img/covers/frontend-chronicle-vite-6-environment-api.svg
toc: true
---
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## 收益背后的代价

Vite 从 SPA 构建工具继续下沉为全栈框架基础设施，环境边界成为插件设计的重要维度。

## 2024 年，项目里正在发生什么

Vite 6 推出实验性 Environment API，让框架可以为客户端、SSR、边缘或其他运行时定义不同模块执行环境。

## 版本号之外的变化

1. 同一开发服务器可以表达多个运行时环境
2. 框架作者能复用更接近生产的开发基础设施
3. Sass 等生态默认 API 继续现代化

## 用最小例子感受一下

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```

## 今天再做一次选择

普通 SPA 不必追逐实验 API；框架和插件作者应避免假设所有模块都运行在 Node 或浏览器。

## 相关发布记录

- [Vite 官方博客](https://vite.dev/blog/)
