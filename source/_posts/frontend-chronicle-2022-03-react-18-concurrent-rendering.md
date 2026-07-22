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

## 把问题缩小到这几行

不紧急的列表更新可以放进 transition：

```jsx
const [isPending, startTransition] = useTransition()
function handleChange(value) {
  setInput(value)
  startTransition(() => setKeyword(value))
}
```

## 这部分最容易被忽略

更多异步来源中的状态更新会被自动批处理；startTransition 区分紧急与非紧急更新；流式 SSR 可以逐步发送 HTML 并选择性水合。

## 这次升级真正解决了什么

渲染不再保证一次同步走到底，依赖副作用时序或可变外部状态的代码更容易暴露问题。

## 今天再做一次选择

升级先切换 createRoot 并开启 StrictMode 回归；修复不纯渲染和缺少清理的 Effect，不要用关闭严格模式掩盖问题。

## 版本记录与延伸阅读

- [React v18.0](https://react.dev/blog/2022/03/29/react-v18)
