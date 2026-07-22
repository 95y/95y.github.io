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
前端工具更新很快，但并不是每个版本都值得记住。2024 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。

Vite 6 推出实验性 Environment API，让框架可以为客户端、SSR、边缘或其他运行时定义不同模块执行环境。

## 在配置里区分 Client 与 SSR

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```



## 插件不能再假设只有浏览器

同一开发服务器可以表达多个运行时环境；框架作者能复用更接近生产的开发基础设施；Sass 等生态默认 API 继续现代化。

## Environment API 服务的是谁

Vite 从 SPA 构建工具继续下沉为全栈框架基础设施，环境边界成为插件设计的重要维度。

## 普通 SPA 不必追实验接口

普通 SPA 不必追逐实验 API；框架和插件作者应避免假设所有模块都运行在 Node 或浏览器。

## Vite 6 发布说明

- [Vite 官方博客](https://vite.dev/blog/)
