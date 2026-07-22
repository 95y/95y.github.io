---
title: "Next.js 12：SWC、Middleware 与边缘运行时方向"
date: 2021-10-26 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2021
categories:
  - 前端年鉴
description: "Next.js 12 使用 Rust 编写的 SWC 改善编译和压缩速度，并推出 Middleware、React 18 与 Server Components 的早期支持。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-nextjs-12-swc.svg
top_img: /img/covers/frontend-chronicle-nextjs-12-swc.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。Next.js 这次变化就是一个典型例子。

## Next.js 为什么换掉一部分 Babel

Next.js 12 使用 Rust 编写的 SWC 改善编译和压缩速度，并推出 Middleware、React 18 与 Server Components 的早期支持。

全栈 React 框架的边界扩大，构建速度和部署模型开始由框架深度优化。

## Middleware 应该保持多轻

缓存策略与数据写入放在同一个业务边界里：

```ts
'use server'
import { revalidatePath } from 'next/cache'
await save(data)
revalidatePath('/posts')
```



## SWC 带来的不只是速度

- SWC 替代部分 Babel 与 Terser 工作
- Middleware 把请求处理逻辑放到路由渲染之前
- 框架开始同时管理编译、数据、路由与部署运行时

## 自定义 Babel 插件怎么迁移

自定义 Babel 插件较多的项目迁移 SWC 时要做语义回归；Middleware 适合轻量路由判断，不适合塞入重业务。

## Next.js 12 发布记录

- [Next.js 官方博客](https://nextjs.org/blog)
