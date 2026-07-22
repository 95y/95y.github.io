---
title: "Node.js 18：原生 Fetch 拉近浏览器与服务器 API"
date: 2022-04-19 09:00:00
tags:
  - 前端年鉴
  - Node.js
  - 2022
categories:
  - 前端年鉴
description: "Node.js 18 提供实验性的全局 fetch，并随后成为 LTS。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-node-18-fetch.svg
top_img: /img/covers/frontend-chronicle-node-18-fetch.svg
toc: true
---
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## 连接池、代理和重试没有消失

API 形状统一减少学习成本，但超时、重试、代理、证书和连接池仍然是服务器工程问题。

## 服务端为什么也需要标准 Fetch

Node.js 18 提供实验性的全局 fetch，并随后成为 LTS。前后端共享基于 Request、Response、Headers 的网络代码变得更现实。

## Web API 统一后仍有服务端问题

1. 常见 HTTP 请求不再必须依赖第三方客户端
2. Web Streams、FormData 等 Web API 在服务器侧逐步完善
3. 测试与 SSR 环境更容易复用浏览器标准接口

## 给请求补上超时与状态检查

服务端 fetch 也要处理超时与非 2xx：

```js
const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
if (!response.ok) throw new Error('HTTP ' + response.status)
```



## 封装 Fetch 时应该统一什么

封装 fetch 时用 AbortSignal 明确超时，并统一处理非 2xx 响应；不要把浏览器请求封装原样搬到服务端。

## Node.js 18 版本记录

- [Node.js 历史版本](https://nodejs.org/en/about/previous-releases)
