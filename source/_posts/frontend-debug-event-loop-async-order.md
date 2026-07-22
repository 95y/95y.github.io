---
title: "事件循环排障：为什么 Promise、setTimeout 的顺序和预期不同"
date: 2017-11-18 14:00:00
tags:
  - 前端排障
  - JavaScript
categories:
  - 前端排障
description: "一次偶发重复提交如何牵出 Promise 微任务、同步长任务和定时器误解，以及为什么加 setTimeout 不能修竞态。"
cover: /img/covers/frontend-debug-event-loop-async-order.svg
top_img: /img/covers/frontend-debug-event-loop-async-order.svg
toc: true
---
这个问题来自一次真实的“偶发重复提交”。用户点击保存后，我们先把按钮禁用，再发起请求；自动化测试却偶尔在按钮仍可点击时触发第二次。有人建议在提交函数里加一个 `setTimeout(..., 100)`，试图让界面“有时间更新”。这当然没有修好，反而让复现更随机。

最后发现，问题由三个部分叠加：Promise 回调、一个耗时的同步校验，以及对定时器执行时机的错误想象。下面把当时的排查过程完整还原。

## 先别背输出顺序，先标出每段代码进入哪个队列

最小复现是这几行：

```js
console.log('1: script start')

setTimeout(() => console.log('2: timer'), 0)

Promise.resolve()
  .then(() => console.log('3: promise'))

queueMicrotask(() => console.log('4: microtask'))

console.log('5: script end')
```

浏览器中的常见输出是：

```text
1: script start
5: script end
3: promise
4: microtask
2: timer
```

脚本本身是一项任务。同步代码先跑完；当前任务结束、调用栈清空后，事件循环会清空微任务队列，所以两个微任务先于定时器。`Promise.then` 与 `queueMicrotask` 都在微任务队列中，它们按入队先后执行。

关键不是记住这一个答案，而是每遇到新代码都问：回调何时入队，进入任务队列还是微任务队列，执行它之前有没有一段同步工作没结束。

## `setTimeout(fn, 0)` 的 0 不是执行时间

定时器的延迟表示“至少等待这么久以后，回调可以被调度”，并不保证到点立刻执行。主线程如果正在跑一个 300ms 的循环，定时器只能在它结束后才有机会执行。

```js
const startedAt = performance.now()

setTimeout(() => {
  console.log('timer delay:', performance.now() - startedAt)
}, 0)

while (performance.now() - startedAt < 300) {
  // 模拟阻塞主线程的同步计算
}
```

这里日志通常接近 300ms，而不是 0ms。把 UI 修复放进 `setTimeout`，只是把它排到未来某个不确定时刻；如果前面仍有长任务，它还是不会及时发生。

## 回到重复提交现场

原始代码大致如下：

```js
async function handleSubmit(form) {
  await validateForm(form)
  button.disabled = true

  const result = await save(form)
  renderSuccess(result)
}
```

`validateForm` 表面上是异步函数，内部却先执行一大段同步的 schema 遍历，然后才返回已经解决的 Promise。按钮禁用发生在第一次 `await` 之后，也就是一个后续微任务里。在某些测试驱动和双击场景中，第二次事件已经进入队列。

第一版修复是把“是否正在提交”作为同步守卫，放在任何 await 之前：

```js
let submitting = false

async function handleSubmit(form) {
  if (submitting) return

  submitting = true
  button.disabled = true

  try {
    const errors = validateFormSync(form)
    if (errors.length) {
      renderErrors(errors)
      return
    }

    const result = await save(form)
    renderSuccess(result)
  } finally {
    submitting = false
    button.disabled = false
  }
}
```

前端守卫改善了交互，但不能作为重复写入的最终防线。网络重试、多个标签页或代理重放都可能再次提交，所以订单接口后来又增加了幂等键。这也是排障中很重要的一点：事件循环解释了客户端现象，却不代表只在客户端修就足够。

## 微任务也能把页面“饿死”

通常会说“微任务比定时器先执行”，但容易漏掉下一句：处理一个任务以后，浏览器会持续清空微任务队列。如果每个微任务又创建一个微任务，渲染和下一项任务可能长时间没有机会运行。

```js
function loop() {
  queueMicrotask(loop)
}

loop()
```

这段代码不会像普通递归那样立刻爆栈，却可能让页面无法响应。实际项目中的版本往往没这么明显，例如在 Promise 回调里不断检查某个状态。需要把工作分帧时，可以根据场景使用 `requestAnimationFrame`、任务调度或 Web Worker，而不是无限续接微任务。

## 循环索引问题其实是闭包问题

另一类常被归到事件循环的现象，是几个回调都输出相同索引：

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
```

定时器执行时循环早已结束，三个闭包读取同一个函数作用域里的 `i`，所以输出三个 3。改成 `let` 会为每次迭代创建独立绑定：

```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
```

这里事件循环只决定“稍后执行”，闭包才决定“稍后读取哪个变量”。把两个概念分开，定位会更准确。

## 我现在怎样记录异步现场

只打印一句“开始/结束”很难还原竞态。我会给同一次操作生成 ID，并记录创建、开始、完成和取消时间：

```js
async function tracedRequest(name, task) {
  const id = crypto.randomUUID()
  const start = performance.now()
  console.log({ id, name, phase: 'created', start })

  try {
    const value = await task()
    console.log({ id, name, phase: 'fulfilled', cost: performance.now() - start })
    return value
  } catch (error) {
    console.error({ id, name, phase: 'rejected', cost: performance.now() - start, error })
    throw error
  }
}
```

如果页面卡顿，再用 Performance 面板查看 Main 线程上的 Long Task。只看日志顺序无法发现中间那段阻塞渲染的同步计算。

## 最终检查单

以后再遇到“顺序不对”，我不会先试着加延迟，而会按这个顺序查：

- 同步调用栈什么时候结束，是否存在长任务；
- 回调属于任务还是微任务，它在什么时候入队；
- 多个请求究竟要求串行、并行还是只接受最后一个结果；
- 回调读取的是值快照，还是闭包中的可变引用；
- 用户离开或重复操作时，旧任务是否能取消或被忽略；
- 写操作在服务端是否具有幂等保护。

事件循环不是一道只用来猜输出的面试题。它影响按钮反馈、请求竞态、渲染机会和线上日志的解释方式。把队列模型和具体业务状态连起来，才算真正用上它。

## 资料

- [MDN：JavaScript 事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop)
- [HTML Standard：事件循环](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [MDN：queueMicrotask](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/queueMicrotask)
