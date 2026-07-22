---
title: "React 19：Actions、use 与表单异步状态"
date: 2024-12-05 09:00:00
tags:
  - 前端年鉴
  - React
  - 2024
categories:
  - 前端年鉴
description: "React 19 正式发布，围绕异步 Actions、表单状态、资源预加载和服务器组件集成完善 API。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-react-19-actions.svg
top_img: /img/covers/frontend-chronicle-react-19-actions.svg
toc: true
---
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 这次升级真正解决了什么

异步数据变更从组件外部库的专属领域，更多进入 React 自身渲染和表单模型。

## 先动手跑一下

Action 可以承接提交和 pending 状态：

```jsx
const [error, action, pending] = useActionState(renameUser, null)
return <form action={action}>
  <input name="name" />
  <button disabled={pending}>保存</button>
</form>
```

## 版本号之外的变化

- useActionState 与 useOptimistic 组织提交和乐观更新
- use 可以读取 Promise 或 Context 并与 Suspense 协作
- ref 作为 prop 与文档元数据等 DOM 能力得到简化

## 从当时的开发现场说起

React 19 正式发布，围绕异步 Actions、表单状态、资源预加载和服务器组件集成完善 API。

## 今天再做一次选择

Actions 不是鉴权机制；服务器入口仍要校验权限和参数。升级先处理弃用项，再评估是否重写已有成熟表单。

## 相关发布记录

- [React v19](https://react.dev/blog/2024/12/05/react-19)
