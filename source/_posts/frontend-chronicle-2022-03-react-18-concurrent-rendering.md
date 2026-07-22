---
title: "2022 前端技术演进：React 18：并发渲染、自动批处理与流式 SSR"
date: 2022-03-29 09:00:00
tags:
  - 前端年鉴
  - React
  - 2022
categories:
  - 前端年鉴
description: "React 18 正式发布，createRoot 启用新的并发渲染基础，并加入自动批处理、Transitions 与改进的 Suspense SSR。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

React 18 正式发布，createRoot 启用新的并发渲染基础，并加入自动批处理、Transitions 与改进的 Suspense SSR。

## 核心变化

- 更多异步来源中的状态更新会被自动批处理
- startTransition 区分紧急与非紧急更新
- 流式 SSR 可以逐步发送 HTML 并选择性水合

## 为什么重要

渲染不再保证一次同步走到底，依赖副作用时序或可变外部状态的代码更容易暴露问题。

## 放到今天怎么实践

升级先切换 createRoot 并开启 StrictMode 回归；修复不纯渲染和缺少清理的 Effect，不要用关闭严格模式掩盖问题。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [React v18.0](https://react.dev/blog/2022/03/29/react-v18)
