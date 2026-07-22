---
title: "2020 前端技术演进：React Server Components：组件边界延伸到服务器"
date: 2020-12-21 09:00:00
tags:
  - 前端年鉴
  - React
  - 2020
categories:
  - 前端年鉴
description: "React 团队公开 Server Components 研究成果：部分组件只在服务器执行，并以可流式传输的描述与客户端组件组合。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

React 团队公开 Server Components 研究成果：部分组件只在服务器执行，并以可流式传输的描述与客户端组件组合。

## 核心变化

- 服务器组件可以直接访问后端资源而不把实现发给浏览器
- 客户端组件继续承载状态和交互
- 打包器与框架需要理解服务器/客户端模块边界

## 为什么重要

前端架构重新从纯客户端 SPA 转向服务器与客户端协同。数据获取、缓存、序列化和安全边界成为组件设计的一部分。

## 放到今天怎么实践

Server Components 应通过成熟框架采用；任何 use server 入口都要按公开接口进行鉴权、校验和审计。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [React Server Components 介绍](https://legacy.reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html)
