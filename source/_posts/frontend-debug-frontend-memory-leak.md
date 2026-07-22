---
title: "前端内存泄漏排查：监听器、闭包与未释放组件"
date: 2026-04-17 14:00:00
tags:
  - 前端排障
  - 性能优化
categories:
  - 前端排障
description: "工单页反复切换后内存涨到 1.5GB：用三张 Heap Snapshot 沿 window listener 找到 controller 与 Blob 保留链。"
cover: /img/covers/frontend-debug-frontend-memory-leak.svg
top_img: /img/covers/frontend-debug-frontend-memory-leak.svg
toc: true
---
这次泄漏发生在一张带图片预览的工单详情页。客服连续打开、关闭工单两个小时后，页面从 300MB 涨到接近 1.5GB，输入开始卡顿；刷新立刻恢复。单独打开某一张工单看不出问题，只有重复路由切换才稳定复现。

最终 Retainer 链指向一个全局键盘快捷键监听器。监听器闭包持有预览组件实例，组件又持有解码后的图片 Blob。路由离开时 DOM 被移除，window 上的回调却从未解绑，所以整个对象图都无法被回收。

## 先证明“持续增长”，不要看到内存上升就宣布泄漏

JavaScript 引擎不会每次页面关闭立刻 GC，堆先升后降很正常。我们的固定复现脚本：

```text
1. 打开工单 A，打开图片预览，关闭预览，返回列表
2. 打开工单 B，重复同样动作
3. 连续循环 20 次
4. 空闲并在 DevTools 中手动 GC
5. 重复 3 轮
```

Performance Monitor 里同时观察 JS heap、DOM Nodes、Event Listeners。每轮 GC 后基线仍上涨约 120MB，而且 detached DOM/监听器数量同步增加，才有足够证据继续做 heap snapshot。

不要在包含 DevTools 自己选中对象、console 历史引用的状态下测；控制台打印大对象也可能让它被保留。使用干净 profile、固定数据与相同步骤。

## 三张 Snapshot 比一张更有用

我们拍了：

```text
S0：刚登录并 GC
S1：循环 20 次后 GC
S2：再循环 20 次后 GC
```

在 Comparison 视图比较 S2 vs S1，按 retained size 和数量增量排序。`PreviewController`、`Blob` 与 Detached HTMLDivElement 都线性增长。单看 shallow size 可能不大，retained size 才显示它通过引用链间接留住多少对象。

选中一个 `PreviewController` 查看 Retainers：

```text
Window
└── EventListener (keydown)
    └── handleShortcut closure
        └── previewController
            └── currentImage
                └── Blob
```

GC 只能回收不可达对象；Window 是 GC root，只要监听器还在，下面整个链都可达。

## 泄漏代码看起来没有任何“大对象”

```js
export function setupPreview(previewController) {
  function handleShortcut(event) {
    if (event.key === 'Escape') previewController.close()
    if (event.key === 'ArrowRight') previewController.next()
  }

  window.addEventListener('keydown', handleShortcut)
}
```

函数里没有缓存数组，却通过闭包持有 controller。组件每次挂载都调用 setup，永不 remove。

修复让创建者返回对称销毁函数：

```js
export function setupPreview(previewController) {
  function handleShortcut(event) {
    if (event.key === 'Escape') previewController.close()
    if (event.key === 'ArrowRight') previewController.next()
  }

  window.addEventListener('keydown', handleShortcut)

  return () => {
    window.removeEventListener('keydown', handleShortcut)
  }
}
```

React 中接入生命周期：

```jsx
useEffect(() => {
  const controller = createPreviewController(images)
  const removeShortcuts = setupPreview(controller)

  return () => {
    removeShortcuts()
    controller.destroy()
  }
}, [images])
```

`removeEventListener` 必须拿到同一个函数引用。下面这样无法移除原 listener：

```js
window.addEventListener('resize', () => layout())
window.removeEventListener('resize', () => layout())
```

两个箭头函数是不同对象。

## 第二处泄漏：Object URL 没有 revoke

图片预览用 Blob 创建 URL：

```js
const url = URL.createObjectURL(file)
image.src = url
```

对象 URL 会让底层 Blob 保持可用，使用完应释放：

```js
const url = URL.createObjectURL(file)
image.src = url

image.addEventListener('load', () => {
  URL.revokeObjectURL(url)
}, { once: true })
```

若图片还需下载/再次展示，释放时机要跟组件生命周期一致，不能 load 后过早导致后续操作失效。我们在预览 controller destroy 中统一 revoke 当前与预加载 URL。

## 第三处不是泄漏，是无上限缓存

修复 listener 后，内存仍会缓慢增长但最终不下降。另一个 Retainer 指向模块级 Map：

```js
const ticketCache = new Map()

export function cacheTicket(ticket) {
  ticketCache.set(ticket.id, ticket)
}
```

Map 设计上永久持有所有访问过的工单，严格说是缓存策略问题，但用户体验与泄漏一样。改成有容量的 LRU/TTL，只保存轻量数据；大 Blob 与 DOM 绝不进入通用缓存。

```js
const MAX_ENTRIES = 50
const ticketCache = new Map()

function setCache(id, value) {
  ticketCache.delete(id)
  ticketCache.set(id, { value, expiresAt: Date.now() + 5 * 60_000 })

  while (ticketCache.size > MAX_ENTRIES) {
    const oldest = ticketCache.keys().next().value
    ticketCache.delete(oldest)
  }
}
```

真实项目使用成熟缓存实现，示例只是说明容量与过期必须显式。

## 请求没取消通常不是主要堆泄漏，但会制造失效更新

组件离开后，长请求回调仍捕获 state/大数据，至少在请求结束前保留它们，还可能写入已失效页面。统一用 AbortController：

```jsx
useEffect(() => {
  const controller = new AbortController()

  loadTicket(ticketId, controller.signal)
    .then(setTicket)
    .catch(error => {
      if (error.name !== 'AbortError') reportError(error)
    })

  return () => controller.abort()
}, [ticketId])
```

取消客户端等待不保证服务器停止工作，但能释放客户端链路并防止过期结果覆盖。

## Observer、计时器和第三方实例逐个做对称检查

代码评审我会搜索：

```bash
rg "addEventListener|setInterval|setTimeout|new (ResizeObserver|IntersectionObserver|MutationObserver)|subscribe\(" src
```

并为每个资源找对应：

```text
addEventListener -> removeEventListener
setInterval -> clearInterval
Observer.observe -> disconnect/unobserve
store.subscribe -> unsubscribe
editor/chart/map constructor -> destroy/dispose
createObjectURL -> revokeObjectURL
fetch -> abort/忽略过期结果
```

不是每个 setTimeout 都会永久泄漏，执行后会释放；但长延迟、重复调度和捕获大对象仍值得检查。第三方编辑器常在 document 上注册事件，仅移除 DOM 容器不够，必须调用它的 destroy。

## WeakMap 不是万能解决方案

有人建议把所有缓存改 WeakMap。WeakMap 只接受对象 key，且条目是否存在由 key 的可达性决定，不适合需要枚举、按 ID 查询或明确 TTL 的业务缓存。它适合给对象附加元数据，又不希望元数据反过来阻止对象回收。

```js
const measurements = new WeakMap()

function remember(element, rect) {
  measurements.set(element, rect)
}
```

如果 value 通过其他路径又持有 key 或全局引用仍在，WeakMap 也不会神奇清理整个系统。先画 Retainer 链，再选数据结构。

## 修复后怎样证明不是“看起来降了”

用完全相同的 3×20 次循环重新拍 S0/S1/S2。修复后：

```text
PreviewController 增量：趋近 0
keydown listeners：回到基线
Detached DOM：GC 后回到基线
Blob retained size：不再线性增长
总 heap：波动但平台化
```

我们又把循环挂载做成 Playwright 压力用例，记录 `performance.memory` 只作趋势信号；CI 环境噪声大，不用一个绝对 MB 阈值直接判失败。更可靠的自动检查是 listener 数、组件 destroy mock、对象 URL revoke 和请求 abort 都被调用。

## 最终复盘

这次问题不是“一张图太大”，而是 window listener → closure → controller → Blob 的完整保留链。修复 listener 后又发现对象 URL 与无上限 cache，说明内存问题经常有多个来源，必须修一处后重复实验。

我现在判断泄漏遵循：固定操作、多轮 GC 后看基线、比较 snapshot 增量、沿 Retainers 走到 GC root、修复后原步骤复测。看 Task Manager 猜，或把所有变量设成 null，都没有这条链可靠。

## 资料

- [Chrome DevTools：Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems/)
- [MDN：URL.revokeObjectURL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL/revokeObjectURL_static)
- [MDN：AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
