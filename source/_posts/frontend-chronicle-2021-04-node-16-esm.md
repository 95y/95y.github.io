---
title: "Node.js 16：ESM、现代 V8 与前端工具运行时升级"
date: 2021-04-20 09:00:00
tags:
  - 前端年鉴
  - Node.js
  - 2021
categories:
  - 前端年鉴
description: "Node.js 16 发布并随后进入 LTS。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-node-16-esm.svg
top_img: /img/covers/frontend-chronicle-node-16-esm.svg
toc: true
---
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## 这次升级真正解决了什么

Node 版本不再只是后端问题，它直接决定 Vite、webpack、测试工具和包管理器能否运行。

## 从当时的开发现场说起

Node.js 16 发布并随后进入 LTS。前端工具链开始更广泛依赖原生 ESM、更新的 V8 和稳定 ABI。

## 版本号之外的变化

1. package.json 的 type 字段逐渐成为模块边界的重要配置
2. 工具作者需要同时处理 ESM 与 CommonJS 消费方式
3. 更现代的运行时允许构建工具减少语法兼容包袱

## 用最小例子感受一下

运行时升级前先验证实际支持的 API：

```js
console.log(process.version)
console.log(typeof fetch, typeof AbortSignal.timeout)
```

## 今天再做一次选择

在项目中声明 engines 并在 CI 固定 Node 主版本；升级前检查原生依赖、测试环境和部署镜像。

## 相关发布记录

- [Node.js 历史版本](https://nodejs.org/en/about/previous-releases)
