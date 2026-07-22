---
title: "前端疑难排查：TypeScript never 排查：类型为什么被收窄到不可能"
date: 2025-08-15 14:00:00
tags:
  - 前端排障
  - TypeScript
categories:
  - 前端排障
description: "属性访问报 Property does not exist on type never。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/frontend-performance-cover.svg
toc: true
---

线上问题最怕“改一点试试看”。更可靠的方式是先稳定复现，再沿数据、时序、网络或渲染链路逐层缩小范围。

## 常见症状

1. 属性访问报 Property does not exist on type never
2. 空数组推导为 never[]，后续无法 push
3. 穷尽分支中的变量类型突然变成 never

## 高概率根因

1. 初始化信息不足导致泛型或数组元素无法推导
2. 控制流分析认为某个分支永远不可达
3. 联合类型与自定义类型守卫不完整或条件互斥

## 定位步骤

1. 把复杂表达式拆成中间变量查看每一步推导类型
2. 检查泛型参数、空数组和 useState 的初始类型
3. 用 assertNever 确认是真正穷尽还是上游类型写错

## 修复方案

1. 为无信息初始值显式声明元素或泛型类型
2. 修正类型守卫，使返回条件与声明谓词一致
3. 使用可辨识联合表达状态，避免多个布尔值形成非法组合

## 如何防止再次发生

保持 strict 模式，不用 any 压制错误；把 never 当作上游模型问题的信号，而不是需要强制断言的障碍。

修复完成后还应补充最小回归用例，并把关键上下文写进错误日志。只有能够在下一次自动发现同类问题，排障工作才算真正闭环。

## 参考资料

- [TypeScript 5.9](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/)
