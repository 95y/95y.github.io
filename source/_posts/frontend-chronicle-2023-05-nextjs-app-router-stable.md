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
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 这次升级真正解决了什么

框架替开发者做了更多优化，也意味着团队必须理解请求记忆化、数据缓存与客户端路由缓存的差异。

## 先动手跑一下

缓存策略与数据写入放在同一个业务边界里：

```ts
'use server'
import { revalidatePath } from 'next/cache'
await save(data)
revalidatePath('/posts')
```

## 版本号之外的变化

- 服务器组件成为 App Router 默认组件类型
- 路由段支持独立加载、错误与重新验证策略
- 数据缓存和路由缓存成为性能模型的一部分

## 2023 年，项目里正在发生什么

Next.js 13.4 将 App Router 标记为稳定，Server Components、嵌套路由和 Server Actions alpha 进入更广泛生产实践。

## 别急着把老项目全部重写

为动态数据显式选择缓存策略；所有 Server Action 都做鉴权与输入校验，并用端到端测试覆盖缓存失效。

## 相关发布记录

- [Next.js 官方博客](https://nextjs.org/blog)
