---
title: "React Hooks 闭包陷阱：旧状态、无限循环与重复订阅"
date: 2019-08-16 14:00:00
tags:
  - 前端排障
  - React
categories:
  - 前端排障
description: "自动保存显示成功却提交旧内容：还原 interval 的闭包快照，并比较完整依赖、函数式更新、ref 与请求取消。"
cover: /img/covers/frontend-debug-react-hooks-stale-closure.svg
top_img: /img/covers/frontend-debug-react-hooks-stale-closure.svg
toc: true
---
这是一次定时保存功能引出的 Bug。编辑器右上角显示“已保存”，服务端收到的却偶尔是十几秒前的内容。网络面板没有失败，接口参数也合法，所以问题在测试环境里躲了很久。

最终原因是：页面首次渲染时创建的 interval 一直持有那次渲染里的 `content`。用户后续输入会触发新的渲染，但老 interval 不会自动换成新函数。它没有“读错 state”，只是忠实地读了自己闭包中的旧快照。

## 事故代码只有十几行

```jsx
function Editor({ documentId }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      saveDocument(documentId, content)
    }, 10_000)

    return () => clearInterval(timer)
  }, [])

  return <textarea value={content} onChange={e => setContent(e.target.value)} />
}
```

空依赖数组让 Effect 只为这次挂载建立 interval。回调捕获的是首次渲染的 `documentId` 与 `content`。每次 `setContent` 都会重新调用组件，产生一个新的 `content` 常量和新的函数，但已经交给 `setInterval` 的旧函数仍然存在。

把函数组件理解成“每次渲染都是一次独立函数调用”，这个问题就不神秘了。

## 先做一个能看见快照的最小例子

为了确认不是保存接口缓存，我把逻辑缩成计数器：

```jsx
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('interval sees:', count)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

按钮数字一直增加，控制台始终打印 0。这个最小例子把请求、编辑器和服务端全部排除，只剩渲染快照与 Effect。

## 第一种修法：把真实依赖写完整

最直接的方式是把依赖加入数组：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    saveDocument(documentId, content)
  }, 10_000)

  return () => clearInterval(timer)
}, [documentId, content])
```

它能拿到最新内容，但用户每输入一次都会清理并重建定时器。结果是持续输入时 10 秒倒计时不断重置，可能一直不保存。这不是 React 的问题，而是我们的需求其实不是“内容变化后重建 interval”。

依赖数组首先服务于正确性，不是性能开关。写全以后发现行为不符合需求，应该重新设计同步模型，而不是删掉依赖让 lint 安静。

## 更适合编辑器的是脏标记与稳定调度器

我们最后把“是否需要保存”与“定时调度”分开。最新草稿放在 ref 中，内容变化时标记 dirty，interval 本身保持稳定：

```jsx
function useAutoSave(documentId, content) {
  const latestDraft = useRef({ documentId, content })
  const dirty = useRef(false)

  useEffect(() => {
    latestDraft.current = { documentId, content }
    dirty.current = true
  }, [documentId, content])

  useEffect(() => {
    const timer = setInterval(async () => {
      if (!dirty.current) return

      const draft = latestDraft.current
      await saveDocument(draft.documentId, draft.content)

      if (latestDraft.current === draft) {
        dirty.current = false
      }
    }, 10_000)

    return () => clearInterval(timer)
  }, [])
}
```

真实项目还要处理请求重叠、失败重试、卸载前提示和版本冲突。这里的 ref 不是为了逃避依赖，而是刻意保存一个不参与渲染、需要被异步调度器读取的最新可变快照。

如果 UI 也要显示 dirty 状态，就应该用 state；ref 变化不会触发渲染。

## 计数器则应该使用函数式更新

另一种常见闭包 Bug 是 interval 内 `setCount(count + 1)`：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1)
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

回调一直看到 0，所以每次都设置 1。这里不需要读取业务上的“最新 count”，只是要基于上一状态更新。函数式写法最准确：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(previous => previous + 1)
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

React 把最新状态传给 updater，Effect 不再依赖 `count`。比起用 ref 镜像每一个 state，这种写法更简单。

## 加完依赖后无限请求，通常暴露了另一个问题

有人为了遵守 exhaustive-deps 把函数加入依赖，页面立刻循环：

```jsx
function Search({ keyword }) {
  const [result, setResult] = useState([])

  const options = { keyword, pageSize: 20 }

  useEffect(() => {
    search(options).then(setResult)
  }, [options])
}
```

每次渲染都会创建新 `options`，引用变化让 Effect 再执行，`setResult` 又触发渲染。这里可以在 Effect 内创建对象，只依赖原始值：

```jsx
useEffect(() => {
  const controller = new AbortController()
  const options = { keyword, pageSize: 20 }

  search(options, controller.signal).then(setResult)
  return () => controller.abort()
}, [keyword])
```

不是所有对象都要 `useMemo`。先缩小 Effect 的输入，通常比到处稳定引用更清楚。

## StrictMode 的“两次执行”帮我们发现了泄漏

React 18 开发环境的 StrictMode 会额外执行一次 Effect setup/cleanup，用来暴露没有正确清理的副作用。我们曾看到 WebSocket 连了两次，第一反应是“React 重复执行”；继续查才发现 Effect 根本没有返回 unsubscribe。

```jsx
useEffect(() => {
  const connection = connect(roomId)
  connection.open()

  return () => connection.close()
}, [roomId])
```

在 setup → cleanup → setup 后仍然正确，说明生命周期更稳健。生产环境不一定重复执行，但用户切路由、热更新和错误恢复本来就会发生挂载/卸载，清理不是只为 StrictMode。

## 我用什么标准选修法

遇到旧闭包时，不应该统一回答“加 ref”。我会按意图选择：

- 只是基于旧 state 更新：使用函数式 updater；
- Effect 确实随某值变化而重新同步：写完整依赖；
- 值能在渲染中直接计算：删除 Effect；
- 外部长期回调需要读取最新值、但变化不应重建订阅：使用受控的 ref 或框架提供的 Effect Event 能力；
- 请求随输入变化：写依赖，同时取消旧请求或忽略过期响应；
- 对象/函数每次新建：先把创建移动到真正使用的位置，再判断是否需要 memo。

## 防止复发比修这一处更重要

修完自动保存后，我们开启并认真处理 `eslint-plugin-react-hooks` 的依赖规则，没有再用整页 disable 注释。还给自动保存补了假定时器测试：连续输入、请求失败、切换文档和卸载都要验证。

闭包不是 Hooks 独有的陷阱，JavaScript 一直如此。Hooks 让每次渲染的值快照更明显，也让错误依赖更容易影响订阅。把每次渲染当成独立快照、把 Effect 当成外部同步过程，很多“React 为什么拿不到最新 state”的问题就能沿着引用关系解释清楚。

## 资料

- [React：State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [React：Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
- [React v16.8：Hooks](https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html)
