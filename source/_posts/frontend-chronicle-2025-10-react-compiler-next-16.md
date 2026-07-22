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
如果把时间拨回 2025 年，React 所面对的问题和今天并不完全一样。回头看这次变化，最有意思的不是版本号，而是开发方式从这里拐了一个弯。

## 先把时间拨回 2025 年

React Compiler 1.0 稳定发布；Next.js 16 随后提供稳定集成，并让 Turbopack 成为默认打包器。

## 先看一段代码

组件保持纯净，副作用只负责同步外部系统：

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(value => value + 1)}>{count}</button>
}
```

## 真正改变开发体验的地方

性能优化从手写 memo 逐步转为编译器可证明的变换，但前提是组件遵守纯函数和 Hooks 规则。

- 编译器基于 React 规则自动添加记忆化优化
- Next.js Cache Components 重整部分预渲染与缓存模型
- Turbopack 覆盖开发与生产构建主路径

## 我会怎么落地

先运行官方 lint 规则并修复不纯代码，再启用编译器；不要一边保留所有手写 memo，一边假设编译器会自动解决架构问题。

## 继续往下看

- [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- [Next.js 16](https://nextjs.org/blog/next-16)
