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
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## 这次升级真正解决了什么

这是一次“用户看见的功能不多、架构意义很大”的升级。前端框架开始把调度优先级纳入渲染系统，而不仅是同步计算虚拟 DOM。

## 从当时的开发现场说起

React 16 发布新的 Fiber 协调器，并带来错误边界、Fragments、Portal 等能力。对业务代码而言 API 变化有限，但底层渲染模型已经重构。

## 这部分最容易被忽略

1. 错误边界让组件树局部失败时可以降级展示
2. Fragments 减少只为满足结构而添加的包装节点
3. Fiber 把渲染工作拆成可调度单元，为后来的并发渲染铺路

## 用最小例子感受一下

React 16 开始可以用错误边界隔离局部渲染失败：

```jsx
class ErrorBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Fallback /> : this.props.children }
}
```

## 别急着把老项目全部重写

理解 Fiber 不需要依赖内部字段；更重要的是保持 render 纯净、正确处理副作用，并接受渲染可能被暂停或重新执行。

## 版本记录与延伸阅读

- [React v16.0](https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html)
