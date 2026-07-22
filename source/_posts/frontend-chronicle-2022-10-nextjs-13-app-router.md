---
title: "Next.js 13：App Router 与 Server Components 落地"
date: 2022-10-25 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2022
categories:
  - 前端年鉴
description: "Next.js 13 推出 app 目录、嵌套布局、Server Components、Streaming 和 Turbopack alpha，开启新的 React 全栈应用模型。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-nextjs-13-app-router.svg
top_img: /img/covers/frontend-chronicle-nextjs-13-app-router.svg
toc: true
---
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 真正改变开发体验的地方

组件放在哪里执行变成架构决策。错误的客户端边界会增加 JS，错误的缓存理解则会产生陈旧数据。

## 先动手跑一下

页面留在服务器，把真正需要交互的叶子放到客户端：

```tsx
export default async function Page() {
  const products = await getProducts()
  return <ProductList products={products} />
}
```

## 三个值得记住的细节

- 布局与页面默认运行在服务器组件环境
- loading、error 等文件约定形成路由级状态边界
- 服务端数据获取与 React 缓存模型深度结合

## 先把时间拨回 2022 年

Next.js 13 推出 app 目录、嵌套布局、Server Components、Streaming 和 Turbopack alpha，开启新的 React 全栈应用模型。

## 我会怎么落地

从叶子交互组件开始添加 use client，尽量保持服务器组件树；升级时逐路由迁移，不必一次删除 Pages Router。

## 继续往下看

- [Next.js 官方博客](https://nextjs.org/blog)
