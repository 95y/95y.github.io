---
title: "前端疑难排查：Vue 响应式失效排查：解构、赋值与 watch 时机"
date: 2020-08-21 14:00:00
tags:
  - 前端排障
  - Vue
categories:
  - 前端排障
description: "修改数据后模板不更新。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/frontend-performance-cover.svg
toc: true
---

线上问题最怕“改一点试试看”。更可靠的方式是先稳定复现，再沿数据、时序、网络或渲染链路逐层缩小范围。

## 常见症状

1. 修改数据后模板不更新
2. 从 reactive 对象解构后变量失去响应
3. watch 没有触发或触发次数远多于预期

## 高概率根因

1. 普通解构复制了当前值，不再经过响应式代理
2. 替换整个 reactive 引用会让消费者仍指向旧代理
3. 深度 watch 遍历范围过大，且新旧值可能指向同一对象

## 定位步骤

1. 用 Vue Devtools 确认实际变化的是 ref、代理还是普通值
2. 把问题压缩到一个 computed 和一个 watch 验证依赖
3. 检查异步回调是否修改了已经失效的组件状态

## 修复方案

1. 解构 reactive 时使用 toRefs，单值状态优先 ref
2. 用 computed 表达派生值，不要用 watch 复制状态
3. 为 watch 指定精确 getter，并在需要时清理异步副作用

## 如何防止再次发生

团队统一 ref/reactive 选型约定，并避免在多个 store 中保存同一业务状态副本。

修复完成后还应补充最小回归用例，并把关键上下文写进错误日志。只有能够在下一次自动发现同类问题，排障工作才算真正闭环。

## 参考资料

- [Vue 3.0 发布公告](https://blog.vuejs.org/posts/vue-3-one-piece)
