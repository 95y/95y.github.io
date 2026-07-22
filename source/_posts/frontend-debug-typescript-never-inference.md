---
title: "TypeScript never 排查：类型为什么被收窄到不可能"
date: 2025-08-15 14:00:00
tags:
  - 前端排障
  - TypeScript
categories:
  - 前端排障
description: "属性访问报 Property does not exist on type never。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-typescript-never-inference.svg
top_img: /img/covers/frontend-debug-typescript-never-inference.svg
toc: true
---
这个问题最麻烦的地方，是表面现象和真正根因经常不在同一层。下面按一次实际排查的顺序来走。

## 现场通常是什么样

- 属性访问报 Property does not exist on type never
- 空数组推导为 never[]，后续无法 push
- 穷尽分支中的变量类型突然变成 never

## 把问题缩小到这几行

空容器缺少推导信息时直接声明元素类型：

```ts
type Task = { id: string; done: boolean }
const tasks: Task[] = []
tasks.push({ id: 'build', done: false })
```

## 我会先查这几个位置

1. 把复杂表达式拆成中间变量查看每一步推导类型
2. 检查泛型参数、空数组和 useState 的初始类型
3. 用 assertNever 确认是真正穷尽还是上游类型写错

## 最后发现的高频根因

- 初始化信息不足导致泛型或数组元素无法推导
- 控制流分析认为某个分支永远不可达
- 联合类型与自定义类型守卫不完整或条件互斥

## 修复和收尾

1. 为无信息初始值显式声明元素或泛型类型
2. 修正类型守卫，使返回条件与声明谓词一致
3. 使用可辨识联合表达状态，避免多个布尔值形成非法组合

保持 strict 模式，不用 any 压制错误；把 never 当作上游模型问题的信号，而不是需要强制断言的障碍。

## 相关资料

- [TypeScript 5.9](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/)
