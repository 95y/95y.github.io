---
title: "React Compiler 1.0 与 Next.js 16：自动优化进入框架主线"
date: 2025-10-21 09:00:00
tags:
  - 前端年鉴
  - React
  - 2025
categories:
  - 前端年鉴
description: "React Compiler 1.0 稳定发布；Next.js 16 随后提供稳定集成，并让 Turbopack 成为默认打包器。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-react-compiler-next-16.svg
top_img: /img/covers/frontend-chronicle-react-compiler-next-16.svg
toc: true
---


React Compiler 1.0 稳定发布；Next.js 16 随后提供稳定集成，并让 Turbopack 成为默认打包器。

性能优化从手写 memo 逐步转为编译器可证明的变换，但前提是组件遵守纯函数和 Hooks 规则。

## 在 Next.js 中开启编译器

组件保持纯净，副作用只负责同步外部系统：

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(value => value + 1)}>{count}</button>
}
```



## 自动优化依赖哪些代码规则

- 编译器基于 React 规则自动添加记忆化优化
- Next.js Cache Components 重整部分预渲染与缓存模型
- Turbopack 覆盖开发与生产构建主路径

## 先修不纯组件再打开编译器

先运行官方 lint 规则并修复不纯代码，再启用编译器；不要一边保留所有手写 memo，一边假设编译器会自动解决架构问题。

## React Compiler 与 Next.js 16

- [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- [Next.js 16](https://nextjs.org/blog/next-16)
