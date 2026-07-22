---
title: "前端疑难排查：前端内存泄漏排查：监听器、闭包与未释放组件"
date: 2026-04-17 14:00:00
tags:
  - 前端排障
  - 性能优化
categories:
  - 前端排障
description: "页面使用时间越长越卡，刷新后恢复。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/frontend-performance-cover.svg
toc: true
---

线上问题最怕“改一点试试看”。更可靠的方式是先稳定复现，再沿数据、时序、网络或渲染链路逐层缩小范围。

## 常见症状

1. 页面使用时间越长越卡，刷新后恢复
2. 反复进入同一路由后内存持续上升
3. 已经离开的组件仍出现在 Heap Snapshot 的保留链中

## 高概率根因

1. 全局事件监听、定时器或观察器没有在卸载时清理
2. 缓存和闭包长期持有大型 DOM、响应数据或组件实例
3. 未取消的异步任务完成后继续写入失效状态

## 定位步骤

1. 使用 Performance Monitor 观察 JS Heap 与 DOM 节点趋势
2. 执行进入/离开页面动作后拍摄多次 Heap Snapshot 并比较
3. 沿 Retainers 找到把对象保留在 GC Root 下的引用

## 修复方案

1. 统一清理监听器、定时器、Observer 与第三方实例
2. 用 AbortController 取消请求，限制缓存容量和生命周期
3. 避免把 DOM 或完整响应对象存进全局单例

## 如何防止再次发生

为复杂页面增加循环挂载压力测试和内存基线；代码评审时让每个 subscribe/addEventListener 都对应 unsubscribe/remove。

修复完成后还应补充最小回归用例，并把关键上下文写进错误日志。只有能够在下一次自动发现同类问题，排障工作才算真正闭环。

## 参考资料

- [Chrome DevTools：内存问题](https://developer.chrome.com/docs/devtools/memory-problems/)
