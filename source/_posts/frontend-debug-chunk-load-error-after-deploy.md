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
这个问题最麻烦的地方，是表面现象和真正根因经常不在同一层。下面按一次实际排查的顺序来走。

## 现场通常是什么样

- 发布后部分在线用户点击路由出现白屏
- 控制台出现 ChunkLoadError 或动态 import 失败
- 刷新页面后问题暂时消失

## 先动手跑一下

动态导入失败时提供可控恢复路径：

```js
try {
  return await import('./pages/Report.js')
} catch (error) {
  if (error.name === 'ChunkLoadError') location.reload()
  throw error
}
```

## 我会先查这几个位置

1. 记录失败 chunk URL、页面版本号和 service worker 状态
2. 直接请求资源并检查 CDN、源站和缓存响应头
3. 对照发布清单确认旧 hash 是否仍在静态目录

## 最后发现的高频根因

- 旧 HTML 或运行中的旧应用引用了已经被删除的 hash 文件
- CDN 与 HTML 缓存策略不一致
- 多节点发布期间 HTML 和静态资源来自不同版本

## 修复和收尾

1. 静态资源使用内容 hash 和长期缓存，HTML 使用短缓存或 no-cache
2. 保留至少一个回滚窗口的旧资源，不要发布即删除
3. 捕获动态导入失败并提示用户安全刷新

采用先上传资源、再切换 HTML 的发布顺序，并在监控中按版本聚合 chunk 加载失败率。

## 相关资料

- [webpack 5 发布公告](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
