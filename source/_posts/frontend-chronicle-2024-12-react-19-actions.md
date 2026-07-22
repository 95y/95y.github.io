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
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。React 这次变化就是一个典型例子。

## React 为什么开始关心表单提交

React 19 正式发布，围绕异步 Actions、表单状态、资源预加载和服务器组件集成完善 API。

异步数据变更从组件外部库的专属领域，更多进入 React 自身渲染和表单模型。

## Action 如何管理 pending 状态

Action 可以承接提交和 pending 状态：

```jsx
const [error, action, pending] = useActionState(renameUser, null)
return <form action={action}>
  <input name="name" />
  <button disabled={pending}>保存</button>
</form>
```

## 乐观更新失败后必须能回滚

useOptimistic 让界面先显示预期结果，但服务端仍可能因为权限、库存或校验失败而拒绝操作。乐观状态需要和真实响应关联，失败时恢复原值并告诉用户发生了什么。只追求“立即变化”而没有失败路径，会让界面与数据永久不一致。

## 服务器函数不是私有函数

带有服务器指令的 Action 最终可以被客户端触发，应当像 API 路由一样做身份校验、参数解析、速率限制和审计。不要因为函数和组件写在同一个仓库里，就信任来自表单的 ID、价格或角色字段。

## use 读取 Promise 意味着什么

- useActionState 与 useOptimistic 组织提交和乐观更新
- use 可以读取 Promise 或 Context 并与 Suspense 协作
- ref 作为 prop 与文档元数据等 DOM 能力得到简化

## 服务器 Action 仍然需要鉴权

Actions 不是鉴权机制；服务器入口仍要校验权限和参数。升级先处理弃用项，再评估是否重写已有成熟表单。

## React 19 发布说明

- [React v19](https://react.dev/blog/2024/12/05/react-19)
