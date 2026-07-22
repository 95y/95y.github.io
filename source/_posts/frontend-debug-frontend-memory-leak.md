---
title: "前端内存泄漏排查：监听器、闭包与未释放组件"
date: 2026-04-17 14:00:00
tags:
  - 前端排障
  - 性能优化
categories:
  - 前端排障
description: "页面使用时间越长越卡，刷新后恢复。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-frontend-memory-leak.svg
top_img: /img/covers/frontend-debug-frontend-memory-leak.svg
toc: true
---
我把这类问题拆成了“看到什么、怎么定位、最后改哪里”三部分。下次再遇到，可以直接照着检查。

## 页面越用越卡时先看什么

1. 页面使用时间越长越卡，刷新后恢复
2. 反复进入同一路由后内存持续上升
3. 已经离开的组件仍出现在 Heap Snapshot 的保留链中

## 用 Heap Snapshot 沿 Retainer 追踪

1. 使用 Performance Monitor 观察 JS Heap 与 DOM 节点趋势
2. 执行进入/离开页面动作后拍摄多次 Heap Snapshot 并比较
3. 沿 Retainers 找到把对象保留在 GC Root 下的引用

## 谁还在持有已经卸载的组件

全局事件监听、定时器或观察器没有在卸载时清理；缓存和闭包长期持有大型 DOM、响应数据或组件实例；未取消的异步任务完成后继续写入失效状态。

## 给监听器与请求补上清理函数

监听器和请求都要有对称的释放路径：

```js
const controller = new AbortController()
window.addEventListener('resize', handleResize)
fetch(url, { signal: controller.signal })
return () => {
  controller.abort()
  window.removeEventListener('resize', handleResize)
}
```

## 一次快照不够判断泄漏

内存升高可能只是垃圾回收尚未发生。更有效的方法是执行固定操作：进入页面、退出页面、手动触发 GC，再重复多轮并比较快照。只有同类对象数量持续增长，而且能沿 Retainer 找到稳定引用链，才更接近真正泄漏。

## 缓存也需要生命周期

Map、查询缓存和图片预览常被当成性能优化，却可能无限持有数据。缓存应有容量、过期时间或按路由释放策略。对大对象来说，少一次请求带来的收益可能抵不过长时间占用内存的成本。

## 把循环挂载加入压力测试

- 统一清理监听器、定时器、Observer 与第三方实例
- 用 AbortController 取消请求，限制缓存容量和生命周期
- 避免把 DOM 或完整响应对象存进全局单例

为复杂页面增加循环挂载压力测试和内存基线；代码评审时让每个 subscribe/addEventListener 都对应 unsubscribe/remove。

## Chrome 内存排查资料

- [Chrome DevTools：内存问题](https://developer.chrome.com/docs/devtools/memory-problems/)
