---
title: "React 19：Actions、use 与表单异步状态"
date: 2024-12-05 09:00:00
tags:
  - 前端年鉴
  - React
  - 2024
categories:
  - 前端年鉴
description: "用修改昵称和评论点赞两个功能试用 React 19 Actions、useActionState 与 useOptimistic，并补齐失败和安全边界。"
cover: /img/covers/frontend-chronicle-react-19-actions.svg
top_img: /img/covers/frontend-chronicle-react-19-actions.svg
toc: true
---
React 19 最适合用一个表单来理解。过去提交资料时，组件往往手工维护 pending、error、成功重置、乐观状态，再把这些状态传给设计系统按钮。Actions 把异步变更放进 React 的渲染/表单模型，让 pending 与结果更自然地组合。

这不意味着现有 React Query/Form 库都该删除，也不意味着服务器函数自动安全。我们拿“修改昵称”和“评论点赞”两个小功能试用，一个展示 `useActionState` 的提交状态，一个展示乐观更新失败时如何回退。

## 修改昵称：状态来自 Action 的结果

```tsx
import { useActionState } from 'react'

type FormState = {
  error?: string
  success?: boolean
}

async function updateName(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim()

  if (name.length < 2) {
    return { error: '昵称至少需要 2 个字符' }
  }

  const response = await fetch('/api/profile/name', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })

  if (!response.ok) return { error: '保存失败，请稍后重试' }
  return { success: true }
}

export function NameForm() {
  const [state, formAction, pending] = useActionState(updateName, {})

  return (
    <form action={formAction}>
      <label>
        昵称
        <input name="name" disabled={pending} />
      </label>
      <button disabled={pending}>
        {pending ? '保存中…' : '保存'}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p>已保存</p>}
    </form>
  )
}
```

Action 执行期间 pending 自动反映提交状态，最终返回值成为新的 state。表单依然要有输入校验、错误文案和重复提交策略；API 仍要负责真正权限与数据校验。

## `useFormStatus` 让按钮不需要层层传 pending

设计系统按钮可以读取所在父表单状态：

```tsx
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? '提交中…' : '提交'}
    </button>
  )
}
```

它必须渲染在对应 `<form>` 内部才能读到状态。按钮自身触发的那次提交信息要按 API 返回字段使用，不能把它当任意全局 loading。

## 点赞适合乐观，支付不适合随便乐观

评论点赞失败后可以回到原数量，用户损失小，适合先更新 UI：

```tsx
import { startTransition, useOptimistic } from 'react'

function LikeButton({ comment, onCommit }) {
  const [optimistic, addOptimistic] = useOptimistic(
    comment,
    (current, liked: boolean) => ({
      ...current,
      liked,
      likeCount: current.likeCount + (liked ? 1 : -1)
    })
  )

  function toggle() {
    const next = !optimistic.liked

    startTransition(async () => {
      addOptimistic(next)
      const updated = await updateLike(comment.id, next)
      onCommit(updated)
    })
  }

  return (
    <button onClick={toggle} aria-pressed={optimistic.liked}>
      {optimistic.liked ? '取消赞' : '点赞'} {optimistic.likeCount}
    </button>
  )
}
```

错误时 optimistic 状态会回到真实 value，但产品仍应给用户提示。连续快速点击还要考虑请求顺序与服务端幂等。扣款、库存最终确认等高风险动作不应该只凭“体验更快”直接显示成功。

## Server Action 是网络入口，不是私有函数调用

在支持 React Server Components/Actions 的框架中，可以用 `use server` 定义服务器函数。它看起来像普通 import，框架实际会建立客户端可调用的网络引用。

```ts
'use server'

export async function changeRole(formData: FormData) {
  const actor = await requireAdmin()
  const input = parseRoleChange(formData)

  await rateLimit(actor.id, 'change-role')
  await userService.changeRole(actor, input)
  await auditLog.write({ actor: actor.id, action: 'change-role', input })
}
```

每次调用都重新鉴权，不能信任隐藏 input、用户 ID、价格或 role。框架生成不可猜测引用只能减少扫描，不是授权。服务端函数还要防 CSRF/滥用、限制 payload 并处理审计，具体由所用框架安全指南决定。

## `use` 可以读取 Promise，但 Promise 从哪里来很重要

React 19 的 `use` 可以在渲染中读取支持的 Promise，并与 Suspense 配合：

```tsx
import { Suspense, use } from 'react'

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise)
  return comments.map(comment => <p key={comment.id}>{comment.body}</p>)
}

function CommentPanel({ commentsPromise }) {
  return (
    <Suspense fallback={<p>评论加载中…</p>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  )
}
```

不要在 Client Component 每次 render 临时创建一个未缓存 Promise 再交给 `use`，React 会警告。Promise 通常来自支持 Suspense 缓存的框架/数据层，或由服务器组件传入。

`use` 与普通 Hook 的规则也不完全相同，例如可以在某些条件分支调用，但仍只能在渲染上下文使用。升级时以官方文档为准，不凭名字猜。

## ref 作为 prop 简化组件，但隐式返回会踩类型

函数组件可以直接接收 ref prop：

```tsx
function SearchInput({ ref, ...props }) {
  return <input ref={ref} type="search" {...props} />
}
```

callback ref 还支持返回清理函数。旧代码中这种隐式返回：

```tsx
<div ref={node => (instance = node)} />
```

会返回赋值结果，TypeScript 可能把它误认为不合法 cleanup。改成花括号明确不返回：

```tsx
<div ref={node => { instance = node }} />
```

这类细节需要按 React 19 Upgrade Guide 和 codemod 处理，而不是只装新版本。

## 没有重写成熟表单

已有复杂表单使用成熟 schema、字段数组和草稿恢复库，迁到 Action 并不会自动变简单。我们只在新表单和服务端框架路径试用；稳定系统继续原方案，等确实需要改动时再评估。

React 19 给出的不是“唯一数据层”，而是一套更懂异步 mutation 的基础能力。库可以与 Actions 组合，而不必被全部替代。

## 试用后的判断

Actions 最明显地减少了 pending/error/表单提交之间的手工胶水，useOptimistic 让乐观状态的生命周期更明确，`use` 把资源读取与 Suspense 连接起来。与此同时，竞态、幂等、鉴权、校验和错误提示仍是业务责任。

我们最终保留两个试点，并给它们补了慢网、失败、双击、权限不足和乐观回退测试。新 API 能让正确模式更好写，但不会替开发者决定哪些操作可以乐观、哪些输入可信。把这条边界守住，React 19 的表单能力才不是又一轮语法迁移。

## 资料

- [React 19 发布说明](https://react.dev/blog/2024/12/05/react-19)
- [React：useActionState](https://react.dev/reference/react/useActionState)
- [React：useOptimistic](https://react.dev/reference/react/useOptimistic)
