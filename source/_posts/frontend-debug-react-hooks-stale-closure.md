---
title: "React Hooks 闭包陷阱：旧状态、无限循环与重复订阅"
date: 2019-08-16 14:00:00
tags:
  - 前端排障
  - React
categories:
  - 前端排障
description: "定时器或事件监听器始终读到第一次渲染的状态。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-react-hooks-stale-closure.svg
top_img: /img/covers/frontend-debug-react-hooks-stale-closure.svg
toc: true
---
这个问题最麻烦的地方，是表面现象和真正根因经常不在同一层。下面按一次实际排查的顺序来走。

## 现场通常是什么样

- 定时器或事件监听器始终读到第一次渲染的状态
- Effect 加入依赖后不断请求或循环更新
- 开发环境中订阅、请求或日志看起来执行两次

## 把问题缩小到这几行

依赖旧状态的更新改成函数式写法：

```jsx
useEffect(() => {
  const timer = setInterval(() => setCount(value => value + 1), 1000)
  return () => clearInterval(timer)
}, [])
```

## 我会先查这几个位置

1. 启用 eslint-plugin-react-hooks 并处理完整依赖提示
2. 记录每次渲染的依赖引用是否变化
3. 检查 Effect 是否真正用于同步外部系统

## 最后发现的高频根因

- 每次渲染都会创建新的闭包，旧回调保留旧值
- Effect 同时读取并更新不稳定依赖
- StrictMode 会额外执行 setup/cleanup 来暴露不安全副作用

## 修复和收尾

1. 状态更新依赖旧值时使用函数式更新
2. 事件回调需要最新值时重构数据流或使用适当的 Effect Event/ref
3. 返回 cleanup 取消订阅、定时器和过期请求

减少 Effect 数量，把派生数据留在渲染阶段；不要通过禁用 exhaustive-deps 维持偶然可用的代码。

## 相关资料

- [React v16.8：Hooks](https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html)
