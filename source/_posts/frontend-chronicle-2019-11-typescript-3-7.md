---
title: "TypeScript 3.7：可选链与空值合并进入日常开发"
date: 2019-11-05 09:00:00
tags:
  - 前端年鉴
  - TypeScript
  - 2019
categories:
  - 前端年鉴
description: "TypeScript 3.7 支持可选链、空值合并和断言函数。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-typescript-3-7.svg
top_img: /img/covers/frontend-chronicle-typescript-3-7.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。TypeScript 这次变化就是一个典型例子。

## TypeScript 当时想解决的问题

TypeScript 3.7 支持可选链、空值合并和断言函数。大量防御式属性访问变得简洁，同时类型收窄能力继续增强。

简洁语法减少样板代码，但连续可选链也可能掩盖数据契约缺失。类型安全的目标不是让所有访问都不报错，而是尽早暴露不应该为空的数据。

## 代码里最直观的变化

可选链和空值合并不会误伤合法的零值：

```ts
const retryCount = config.network?.retryCount ?? 3
const name = user.profile?.nickname ?? '匿名用户'
```

## 落到工程里，我关注这几件事

- ?. 只在 null 或 undefined 时停止访问
- ?? 不会把 0、空字符串和 false 当作缺省值
- asserts 返回类型可以把运行时校验反馈给类型系统

## 如果现在接手这样的项目

只对业务允许缺失的边界使用可选链；核心领域对象仍应通过解析和校验形成可靠类型。

## 我参考的资料

- [TypeScript 3.7 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html)
