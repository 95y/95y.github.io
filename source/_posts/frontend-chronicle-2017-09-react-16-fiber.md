---
title: "React 16 与 Fiber：渲染架构为并发能力打下基础"
date: 2017-09-26 09:00:00
tags:
  - 前端年鉴
  - React
  - 2017
categories:
  - 前端年鉴
description: "React 16 发布新的 Fiber 协调器，并带来错误边界、Fragments、Portal 等能力。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-react-16-fiber.svg
top_img: /img/covers/frontend-chronicle-react-16-fiber.svg
toc: true
---
如果把时间拨回 2017 年，React 所面对的问题和今天并不完全一样。回头看这次变化，最有意思的不是版本号，而是开发方式从这里拐了一个弯。

## React 为什么要重写协调器

React 16 发布新的 Fiber 协调器，并带来错误边界、Fragments、Portal 等能力。对业务代码而言 API 变化有限，但底层渲染模型已经重构。

## 用错误边界兜住局部崩溃

React 16 开始可以用错误边界隔离局部渲染失败：

```jsx
class ErrorBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Fallback /> : this.props.children }
}
```



## 可中断渲染从这里埋下伏笔

这是一次“用户看见的功能不多、架构意义很大”的升级。前端框架开始把调度优先级纳入渲染系统，而不仅是同步计算虚拟 DOM。

- 错误边界让组件树局部失败时可以降级展示
- Fragments 减少只为满足结构而添加的包装节点
- Fiber 把渲染工作拆成可调度单元，为后来的并发渲染铺路

## 升级 React 16 时应该检查什么

理解 Fiber 不需要依赖内部字段；更重要的是保持 render 纯净、正确处理副作用，并接受渲染可能被暂停或重新执行。

## React 16 官方说明

- [React v16.0](https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html)
