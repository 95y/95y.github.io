---
title: "Next.js 13.4：App Router 稳定后的缓存与边界课题"
date: 2023-05-04 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2023
categories:
  - 前端年鉴
description: "Next.js 13.4 将 App Router 标记为稳定，Server Components、嵌套路由和 Server Actions alpha 进入更广泛生产实践。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-nextjs-app-router-stable.svg
top_img: /img/covers/frontend-chronicle-nextjs-app-router-stable.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。Next.js 这次变化就是一个典型例子。

## App Router 稳定意味着什么

Next.js 13.4 将 App Router 标记为稳定，Server Components、嵌套路由和 Server Actions alpha 进入更广泛生产实践。

框架替开发者做了更多优化，也意味着团队必须理解请求记忆化、数据缓存与客户端路由缓存的差异。

## 写入之后如何让缓存失效

缓存策略与数据写入放在同一个业务边界里：

```ts
'use server'
import { revalidatePath } from 'next/cache'
await save(data)
revalidatePath('/posts')
```



## 三类缓存不要混在一起

- 服务器组件成为 App Router 默认组件类型
- 路由段支持独立加载、错误与重新验证策略
- 数据缓存和路由缓存成为性能模型的一部分

## 逐路由迁移比整体重写可靠

为动态数据显式选择缓存策略；所有 Server Action 都做鉴权与输入校验，并用端到端测试覆盖缓存失效。

## Next.js 13.4 发布记录

- [Next.js 官方博客](https://nextjs.org/blog)
