---
title: "2022 前端技术演进：Node.js 18：原生 Fetch 拉近浏览器与服务器 API"
date: 2022-04-19 09:00:00
tags:
  - 前端年鉴
  - Node.js
  - 2022
categories:
  - 前端年鉴
description: "Node.js 18 提供实验性的全局 fetch，并随后成为 LTS。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

Node.js 18 提供实验性的全局 fetch，并随后成为 LTS。前后端共享基于 Request、Response、Headers 的网络代码变得更现实。

## 核心变化

- 常见 HTTP 请求不再必须依赖第三方客户端
- Web Streams、FormData 等 Web API 在服务器侧逐步完善
- 测试与 SSR 环境更容易复用浏览器标准接口

## 为什么重要

API 形状统一减少学习成本，但超时、重试、代理、证书和连接池仍然是服务器工程问题。

## 放到今天怎么实践

封装 fetch 时用 AbortSignal 明确超时，并统一处理非 2xx 响应；不要把浏览器请求封装原样搬到服务端。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [Node.js 历史版本](https://nodejs.org/en/about/previous-releases)
