---
title: "Svelte 3：把响应式工作前移到编译阶段"
date: 2019-04-22 09:00:00
tags:
  - 前端年鉴
  - Svelte
  - 2019
categories:
  - 前端年鉴
description: "Svelte 3 以编译器为核心重新设计响应式语法。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-svelte-3-compiler-reactivity.svg
top_img: /img/covers/frontend-chronicle-svelte-3-compiler-reactivity.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。Svelte 这次变化就是一个典型例子。

## 不使用虚拟 DOM 会怎样

Svelte 3 以编译器为核心重新设计响应式语法。它不依赖运行时虚拟 DOM，而是在构建阶段生成精确更新 DOM 的代码。

Svelte 证明了框架设计不只有运行时虚拟 DOM 一条路线，也推动整个生态重新讨论编译优化、信号和细粒度更新。

## 响应式赋值写起来是什么感觉

Svelte 3 的响应式关系可以直接写出来：

```svelte
<script>
  let price = 99
  let count = 1
  $: total = price * count
</script>
<strong>{total}</strong>
```



## 编译器替运行时做了哪些工作

- 赋值语句可以触发响应式更新
- 组件产物聚焦实际使用的运行时代码
- 编译器参与组件语义，而不仅是转换新语法

## 别只拿包体积决定技术选型

选择框架时应评估团队生态、SSR、调试和长期维护，不应只比较 Hello World 包体积。

## Svelte 3 的设计说明

- [Svelte 3：Rethinking reactivity](https://svelte.dev/blog/svelte-3-rethinking-reactivity)
