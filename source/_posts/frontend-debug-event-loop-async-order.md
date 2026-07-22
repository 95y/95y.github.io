---
title: "事件循环排障：为什么 Promise、setTimeout 的顺序和预期不同"
date: 2017-11-18 14:00:00
tags:
  - 前端排障
  - JavaScript
categories:
  - 前端排障
description: "日志顺序与代码书写顺序不一致。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-event-loop-async-order.svg
top_img: /img/covers/frontend-debug-event-loop-async-order.svg
toc: true
---
这类 Bug 很少靠一行代码彻底解决。修复现场问题之外，还要把缓存、生命周期或发布流程一起补上。

## 先给结论

代码评审时要求异步流程说明串行、并行、取消和错误策略；不要用增加 setTimeout 延迟来掩盖竞态。

## 出现过这些信号，就值得检查

- 日志顺序与代码书写顺序不一致
- 循环中发起异步任务后拿到相同索引或过期值
- 长计算导致点击、动画和定时器一起卡住

## 先看一段代码

先运行最小例子，再判断微任务和定时器顺序：

```js
console.log('A')
queueMicrotask(() => console.log('microtask'))
setTimeout(() => console.log('timer'), 0)
console.log('B')
```

## 沿着这条线查

1. 把同步日志、queueMicrotask、Promise 和 setTimeout 做成最小复现
2. 在 Performance 面板查看长任务与 Main 线程空档
3. 给每个异步操作记录创建时间、开始时间和完成时间

## 根因与对应修复

- 同步任务先清空调用栈，微任务在当前任务结束后执行
- 定时器只保证最早可执行时间，不保证准点执行
- 闭包捕获可变变量，执行时读取到的是后续状态

1. 用 Promise.all 明确并发，用顺序 await 明确依赖关系
2. 把超过 50ms 的计算拆分或放入 Worker
3. 使用块级变量或显式参数固定异步任务上下文

## 相关资料

- [MDN：事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop)
