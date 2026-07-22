---
title: "React Hooks：状态逻辑从类组件中解放出来"
date: 2019-02-06 09:00:00
tags:
  - 前端年鉴
  - React
  - 2019
categories:
  - 前端年鉴
description: "React 16.8 正式提供 Hooks，函数组件可以使用状态、上下文和副作用。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-react-hooks.svg
top_img: /img/covers/frontend-chronicle-react-hooks.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。React 这次变化就是一个典型例子。

## 类组件的逻辑为什么难复用

React 16.8 正式提供 Hooks，函数组件可以使用状态、上下文和副作用。复用逻辑从高阶组件与 render props 转向自定义 Hook。

Hooks 改善了逻辑复用，也带来了依赖数组、闭包和副作用时机等新型错误。它要求开发者把“同步外部系统”与“计算派生值”区分开。

## 把订阅封装成一个 Hook

自定义 Hook 把订阅和清理放在同一个地方：

```jsx
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    return () => window.removeEventListener('online', update)
  }, [])
  return online
}
```

## Effect 最容易被误用的地方

很多组件把“根据 props 计算一个值”也写进 Effect，再调用 setState 保存结果。这样会多一次渲染，还会制造依赖数组问题。只要结果能由当前 props 和 state 算出，就应该直接在渲染阶段计算；Effect 更适合连接网络、订阅、DOM 或第三方实例。

## 自定义 Hook 的边界怎么划

一个 Hook 最好表达完整能力，例如 useOnlineStatus、useDocumentTitle，而不是机械地按生命周期拆成 useMount、useUpdate。调用者应该关心它提供什么结果，不需要知道内部用了几个 Effect。

## 依赖数组不是性能开关

- useState 和 useReducer 承担局部状态
- useEffect 统一描述与外部系统同步的副作用
- 自定义 Hook 让状态逻辑按业务能力组合

## 少写 Effect 比多写技巧更重要

能在渲染中计算的值不要放进 Effect；Effect 中订阅的资源必须清理；复杂状态优先通过 reducer 或更清晰的数据边界组织。

## Hooks 的首个稳定版本

- [React v16.8：Hooks](https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html)
