---
title: "ChunkLoadError 排查：前端发布后懒加载资源 404"
date: 2021-09-17 14:00:00
tags:
  - 前端排障
  - 工程化
categories:
  - 前端排障
description: "发布后部分在线用户点击路由出现白屏。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-chunk-load-error-after-deploy.svg
top_img: /img/covers/frontend-debug-chunk-load-error-after-deploy.svg
toc: true
---
这类 Bug 很少靠一行代码彻底解决。修复现场问题之外，还要把缓存、生命周期或发布流程一起补上。

## 静态资源至少保留一个回滚窗口

采用先上传资源、再切换 HTML 的发布顺序，并在监控中按版本聚合 chunk 加载失败率。

## 为什么发布后只有老用户白屏

- 发布后部分在线用户点击路由出现白屏
- 控制台出现 ChunkLoadError 或动态 import 失败
- 刷新页面后问题暂时消失

## 给动态导入留一条恢复路径

动态导入失败时提供可控恢复路径：

```js
try {
  return await import('./pages/Report.js')
} catch (error) {
  if (error.name === 'ChunkLoadError') location.reload()
  throw error
}
```

## 为什么刷新以后往往就好了

用户打开页面时已经下载了旧版入口，发布后服务器只保留新版 Chunk。正在运行的旧页面继续请求旧 hash，自然得到 404；刷新会拿到新版 HTML，所以看起来像“偶发问题”。这不是用户缓存太顽固，而是发布过程没有兼容仍在线的旧客户端。

## 一次更安全的发布顺序

先上传带内容 hash 的静态资源，确认 CDN 可访问后再切换 HTML；旧资源至少保留一个回滚窗口。监控中记录应用版本和失败 URL，才能判断是单个 CDN 节点、某次发布还是 Service Worker 引起。

## 检查 CDN、源站与版本号

1. 记录失败 chunk URL、页面版本号和 service worker 状态
2. 直接请求资源并检查 CDN、源站和缓存响应头
3. 对照发布清单确认旧 hash 是否仍在静态目录

## 旧 HTML 指向了已经删除的 Chunk

- 旧 HTML 或运行中的旧应用引用了已经被删除的 hash 文件
- CDN 与 HTML 缓存策略不一致
- 多节点发布期间 HTML 和静态资源来自不同版本

1. 静态资源使用内容 hash 和长期缓存，HTML 使用短缓存或 no-cache
2. 保留至少一个回滚窗口的旧资源，不要发布即删除
3. 捕获动态导入失败并提示用户安全刷新

## webpack 与缓存资料

- [webpack 5 发布公告](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
