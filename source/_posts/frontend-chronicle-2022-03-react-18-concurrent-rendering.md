---
title: "React 18：并发渲染、自动批处理与流式 SSR"
date: 2022-03-29 09:00:00
tags:
  - 前端年鉴
  - React
  - 2022
categories:
  - 前端年鉴
description: "一次 React 18 升级里遇到的重复请求与 DOM 时序问题，以及 automatic batching、transition 真正解决的场景。"
cover: /img/covers/frontend-chronicle-react-18-concurrent-rendering.svg
top_img: /img/covers/frontend-chronicle-react-18-concurrent-rendering.svg
toc: true
---
React 18 升级分支第一次跑起来时，测试群里马上出现两条消息：为什么开发环境接口请求两次？为什么一个依赖“setState 后马上读 DOM”的用例失败了？相比发布说明里的并发渲染，这两个具体问题更能代表迁移现场。

我们没有一开始就使用所有新 API。先切换 `createRoot`，让现有应用跑在新根节点上，修正副作用与批处理时序，再挑一个卡顿搜索页验证 transition。这样能把“版本行为变化”和“新增优化”分开。

## 第一处改动只是根节点 API

React 17 写法：

```jsx
import ReactDOM from 'react-dom'

ReactDOM.render(<App />, document.getElementById('root'))
```

React 18：

```jsx
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
```

新的并发基础由新 root 启用。API 改完页面能显示，不代表迁移完成；状态批处理、严格模式开发检查与 SSR 水合都需要回归。

## 自动批处理让一次异步回调只提交一次

旧版本中，React 事件之外的 Promise/timeout 回调里的多个 setState 可能分别渲染。React 18 新 root 下覆盖范围更广：

```jsx
function handleSave() {
  saveForm().then(result => {
    setData(result)
    setSaving(false)
    setMessage('保存成功')
  })
}
```

这些更新通常会被批处理，减少提交次数。大多数代码只会更快，但依赖“第一次 setState 后 DOM 立刻改变”的逻辑会出问题。

我们找到过一段打印代码：更新状态后立即读取元素高度。正确方向是把打印触发放到状态提交后的 Effect，或把要打印的数据直接传给打印模块，而不是依赖中间 DOM。确实必须同步刷新的极少场景可以使用 `flushSync`，但它会打断优化，不应该成为通用兼容补丁。

```jsx
import { flushSync } from 'react-dom'

flushSync(() => {
  setExpanded(true)
})
panelRef.current?.focus()
```

每个 `flushSync` 都应说明为什么浏览器 API 必须立刻看到更新。

## 开发环境重复请求，真正问题是请求没有生命周期

StrictMode 下，React 会在开发环境额外执行 setup/cleanup 流程，帮助发现不纯渲染和缺少清理的 Effect。下面代码会暴露问题：

```jsx
useEffect(() => {
  fetch(`/api/orders/${orderId}`)
    .then(response => response.json())
    .then(setOrder)
}, [orderId])
```

组件卸载/依赖变化后，请求仍可能返回并写入。修复可以使用 AbortController，或交给能缓存去重的数据层：

```jsx
useEffect(() => {
  const controller = new AbortController()

  async function load() {
    const response = await fetch(`/api/orders/${orderId}`, {
      signal: controller.signal
    })
    const data = await response.json()
    setOrder(data)
  }

  load().catch(error => {
    if (error.name !== 'AbortError') reportError(error)
  })

  return () => controller.abort()
}, [orderId])
```

关闭 StrictMode 能隐藏第二次执行，却不会补上真实切路由时缺失的取消。我们把重复执行当成压力测试，而不是框架 Bug。

## transition 只解决“哪次渲染更紧急”

搜索页有 5000 行本地数据。用户输入一个字符，输入框 state 与过滤列表同时更新，昂贵渲染让键盘反馈迟滞。这里很适合把输入保持为紧急更新，列表查询视为可中断的非紧急更新：

```jsx
function SearchPage() {
  const [input, setInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleChange(event) {
    const value = event.target.value
    setInput(value)
    startTransition(() => {
      setKeyword(value)
    })
  }

  const result = filterLargeList(keyword)

  return (
    <>
      <input value={input} onChange={handleChange} />
      {isPending && <span>更新结果中…</span>}
      <ResultList items={result} />
    </>
  )
}
```

transition 不会让 `filterLargeList` 计算变便宜，也不会自动防抖网络请求。它让 React 可以优先提交输入反馈，并中断过时的非紧急渲染。若计算本身阻塞主线程太久，仍需优化算法、虚拟列表或 Worker。

## `useDeferredValue` 适合你控制不了更新来源时

如果 keyword 通过 props 传入，调用者不方便包 `startTransition`，可以延迟消费：

```jsx
function ResultPanel({ keyword }) {
  const deferredKeyword = useDeferredValue(keyword)
  const isStale = deferredKeyword !== keyword
  const result = useMemo(
    () => filterLargeList(deferredKeyword),
    [deferredKeyword]
  )

  return <div aria-busy={isStale}><ResultList items={result} /></div>
}
```

它同样不是固定毫秒延迟的 debounce，而是与渲染调度配合。需要减少接口请求次数时仍应做防抖、缓存与取消。

## 服务端渲染的变化不能只在 CSR 项目里验证

React 18 改进了 Suspense 与流式 SSR，服务器可以先发送页面骨架，再逐步发送准备好的边界。我们没有手写底层流，而是等待框架集成，并在真实慢接口下测试：首字节、主要内容出现、脚本加载和交互恢复。

SSR 升级还要将 `hydrate` 改为 `hydrateRoot`，并检查服务端/客户端首屏输出确定性。时间、随机数、浏览器环境分支会造成 hydration mismatch。

## 升级后的回归清单

- root 与 hydrate API 是否全部迁移；
- Effect 是否有完整 cleanup，请求能否取消；
- 测试是否错误依赖 setState 后同步 DOM；
- 第三方组件是否在 render 中修改外部状态；
- transition 只用于非紧急渲染，而非包装受控输入本身；
- SSR 页面是否有水合警告和流式边界闪烁；
- 性能改动是否用 Profiler/真实交互数据验证。

## 并发不是“同时在多个线程渲染”

React 18 的 concurrent rendering 指渲染工作可以被调度、中断和放弃，不是把组件函数自动搬到多线程。组件必须保持纯净，因为一次未提交的渲染可能不产生 DOM，也可能稍后重试。

这次升级最有价值的结果，不只是列表输入变顺滑。StrictMode 帮我们修掉了几处缺失清理，自动批处理逼着旧代码摆脱中间 DOM 时序，transition 则让更新优先级变成可表达的产品意图。并发基础带来的要求其实很朴素：渲染做纯计算，副作用可重复和可清理，性能优化围绕用户感知而不是 API 数量。

## 资料

- [React 18 发布说明](https://react.dev/blog/2022/03/29/react-v18)
- [React：startTransition](https://react.dev/reference/react/startTransition)
- [React：StrictMode](https://react.dev/reference/react/StrictMode)
