---
title: "React 18：并发渲染、自动批处理与流式 SSR"
date: 2022-03-29 09:00:00
tags:
  - 前端年鉴
  - React
  - 2022
categories:
  - 前端年鉴
description: "React 18 正式发布，createRoot 启用新的并发渲染基础，并加入自动批处理、Transitions 与改进的 Suspense SSR。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-react-18-concurrent-rendering.svg
top_img: /img/covers/frontend-chronicle-react-18-concurrent-rendering.svg
toc: true
---
前端工具更新很快，但并不是每个版本都值得记住。2022 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。

React 18 正式发布，createRoot 启用新的并发渲染基础，并加入自动批处理、Transitions 与改进的 Suspense SSR。

## 用 transition 区分更新优先级

不紧急的列表更新可以放进 transition：

```jsx
const [isPending, startTransition] = useTransition()
function handleChange(value) {
  setInput(value)
  startTransition(() => setKeyword(value))
}
```

## StrictMode 的重复执行不是线上重复渲染

开发环境额外执行 setup 与 cleanup，是为了暴露没有清理的订阅和不纯逻辑。看到两次请求时，应该先让请求可取消或移动到数据层，而不是直接关闭 StrictMode。被重复执行就出错的 Effect，通常本来就缺少幂等性。

## Transition 不是通用防抖

startTransition 只是在 React 调度里降低更新优先级，并不会减少请求次数。搜索输入仍然需要取消过期请求，昂贵计算仍可能需要 Worker。它解决的是渲染响应性，不是所有异步性能问题。

## 自动批处理改变了哪些时序

更多异步来源中的状态更新会被自动批处理；startTransition 区分紧急与非紧急更新；流式 SSR 可以逐步发送 HTML 并选择性水合。

## StrictMode 为什么更容易暴露问题

渲染不再保证一次同步走到底，依赖副作用时序或可变外部状态的代码更容易暴露问题。

## 先修不纯渲染再谈性能

升级先切换 createRoot 并开启 StrictMode 回归；修复不纯渲染和缺少清理的 Effect，不要用关闭严格模式掩盖问题。

## React 18 发布说明

- [React v18.0](https://react.dev/blog/2022/03/29/react-v18)
