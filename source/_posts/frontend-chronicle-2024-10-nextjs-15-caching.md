---
title: "Next.js 15：缓存默认值调整与 Turbopack Dev 稳定"
date: 2024-10-21 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2024
categories:
  - 前端年鉴
description: "Next.js 15 发布，调整 fetch、GET Route Handler 和客户端路由缓存默认行为，并将 Turbopack 开发模式标记稳定。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-nextjs-15-caching.svg
top_img: /img/covers/frontend-chronicle-nextjs-15-caching.svg
toc: true
---
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 数据新鲜度比类型通过更重要

缓存从隐式性能优化转向显式业务决策。升级如果只处理类型错误而不验证数据新鲜度，容易出现行为回归。

## 把动态策略写在路由旁边

缓存策略与数据写入放在同一个业务边界里：

```ts
'use server'
import { revalidatePath } from 'next/cache'
await save(data)
revalidatePath('/posts')
```



## 异步 Request API 在准备什么

- 动态数据默认更不容易被意外缓存
- 异步 Request API 为后续渲染模型做准备
- React 19 支持与 Server Actions 安全改进同步进入

## 缓存默认值为什么再次调整

Next.js 15 发布，调整 fetch、GET Route Handler 和客户端路由缓存默认行为，并将 Turbopack 开发模式标记稳定。

## 升级后重点测试哪些页面

为每条关键数据记录缓存需求，配合 revalidate 与标签失效；升级后重点测试登录态、列表刷新和后台更新。

## Next.js 15 发布说明

- [Next.js 官方博客](https://nextjs.org/blog)
