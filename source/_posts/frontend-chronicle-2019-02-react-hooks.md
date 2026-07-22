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
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## 这次升级真正解决了什么

Hooks 改善了逻辑复用，也带来了依赖数组、闭包和副作用时机等新型错误。它要求开发者把“同步外部系统”与“计算派生值”区分开。

## 2019 年，项目里正在发生什么

React 16.8 正式提供 Hooks，函数组件可以使用状态、上下文和副作用。复用逻辑从高阶组件与 render props 转向自定义 Hook。

## 这部分最容易被忽略

1. useState 和 useReducer 承担局部状态
2. useEffect 统一描述与外部系统同步的副作用
3. 自定义 Hook 让状态逻辑按业务能力组合

## 用最小例子感受一下

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

## 别急着把老项目全部重写

能在渲染中计算的值不要放进 Effect；Effect 中订阅的资源必须清理；复杂状态优先通过 reducer 或更清晰的数据边界组织。

## 版本记录与延伸阅读

- [React v16.8：Hooks](https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html)
