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


Next.js 13 推出 app 目录、嵌套布局、Server Components、Streaming 和 Turbopack alpha，开启新的 React 全栈应用模型。

组件放在哪里执行变成架构决策。错误的客户端边界会增加 JS，错误的缓存理解则会产生陈旧数据。

## 页面默认留在服务器

页面留在服务器，把真正需要交互的叶子放到客户端：

```tsx
export default async function Page() {
  const products = await getProducts()
  return <ProductList products={products} />
}
```

## use client 应该放得多低

一旦文件声明 use client，它导入的客户端依赖会一起进入浏览器边界。实际项目里可以让页面、布局和数据读取保持服务器组件，只把按钮、弹窗、表单等交互叶子标成客户端。这样既保留组合能力，也不会把整个页面重新变成 SPA。

## 缓存错误往往不像报错

缓存配置不正确时页面仍能正常渲染，只是用户看到旧数据，所以它比编译错误更危险。列表新增、登录状态和后台修改需要端到端测试，验证写入后哪个路径或标签被失效，而不是仅确认 Server Action 返回成功。

## loading 与 error 进入路由约定

- 布局与页面默认运行在服务器组件环境
- loading、error 等文件约定形成路由级状态边界
- 服务端数据获取与 React 缓存模型深度结合

## 从叶子组件开始添加 use client

从叶子交互组件开始添加 use client，尽量保持服务器组件树；升级时逐路由迁移，不必一次删除 Pages Router。

## Next.js 13 发布记录

- [Next.js 官方博客](https://nextjs.org/blog)
