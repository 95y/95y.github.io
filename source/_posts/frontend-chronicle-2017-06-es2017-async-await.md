---
title: "ES2017 与 async/await：异步代码开始像同步代码一样可读"
date: 2017-06-30 09:00:00
tags:
  - 前端年鉴
  - JavaScript
  - 2017
categories:
  - 前端年鉴
description: "ES2017 将 async/await 纳入标准，使 Promise 链可以用结构化控制流表达。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-es2017-async-await.svg
top_img: /img/covers/frontend-chronicle-es2017-async-await.svg
toc: true
---
前端工具更新很快，但并不是每个版本都值得记住。2017 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。

ES2017 将 async/await 纳入标准，使 Promise 链可以用结构化控制流表达。异步请求、错误处理和并行任务的写法由此发生长期变化。

## 把串行等待改成真正并发

没有依赖关系的请求应该并发：

```js
const [profile, permissions] = await Promise.all([
  fetchProfile(userId),
  fetchPermissions(userId)
])
```



## async/await 没有消灭异步

await 让异步流程拥有普通的 try/catch 错误边界；Promise.all 继续承担互不依赖任务的并发调度；构建工具与运行时兼容目标开始决定是否需要转译 async 函数。

## 错误处理终于回到 try/catch

可读性提高并不等于性能自动提高。连续 await 可能把本可并行的请求变成瀑布流，因此“表达清晰”和“并发正确”需要同时设计。

## 今天写异步流程的几个习惯

默认使用 async/await 表达业务流程；对独立任务先创建 Promise 再统一等待，并明确超时、取消和失败策略。

## ES2017 规范入口

- [ECMAScript 2017 规范](https://262.ecma-international.org/8.0/)
