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
这个问题最麻烦的地方，是表面现象和真正根因经常不在同一层。下面按一次实际排查的顺序来走。

## 现场通常是什么样

- 页面使用时间越长越卡，刷新后恢复
- 反复进入同一路由后内存持续上升
- 已经离开的组件仍出现在 Heap Snapshot 的保留链中

## 代码里最直观的变化

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

## 我会先查这几个位置

1. 使用 Performance Monitor 观察 JS Heap 与 DOM 节点趋势
2. 执行进入/离开页面动作后拍摄多次 Heap Snapshot 并比较
3. 沿 Retainers 找到把对象保留在 GC Root 下的引用

## 最后发现的高频根因

- 全局事件监听、定时器或观察器没有在卸载时清理
- 缓存和闭包长期持有大型 DOM、响应数据或组件实例
- 未取消的异步任务完成后继续写入失效状态

## 修复和收尾

1. 统一清理监听器、定时器、Observer 与第三方实例
2. 用 AbortController 取消请求，限制缓存容量和生命周期
3. 避免把 DOM 或完整响应对象存进全局单例

为复杂页面增加循环挂载压力测试和内存基线；代码评审时让每个 subscribe/addEventListener 都对应 unsubscribe/remove。

## 相关资料

- [Chrome DevTools：内存问题](https://developer.chrome.com/docs/devtools/memory-problems/)
