---
title: "2025 前端技术演进：Tailwind CSS 4 与 CRA 退场：工具链继续现代化"
date: 2025-02-14 09:00:00
tags:
  - 前端年鉴
  - 前端工具链
  - 2025
categories:
  - 前端年鉴
description: "Tailwind CSS 4 使用新的高性能引擎与 CSS-first 配置；React 团队随后停止推荐 Create React App，建议新项目采用框架或 Vite 等构建工具。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/frontend-performance-cover.svg
toc: true
---

> 这是一篇前端技术演进记录。重点不是罗列版本号，而是理解当时解决了什么问题，以及这些变化如何影响今天的工程实践。

## 当时发生了什么

Tailwind CSS 4 使用新的高性能引擎与 CSS-first 配置；React 团队随后停止推荐 Create React App，建议新项目采用框架或 Vite 等构建工具。

## 核心变化

- 现代 CSS 能力承担更多主题与配置职责
- CRA 的封闭零配置模型不再适应当前框架和构建需求
- 新项目脚手架从单一模板转向按产品架构选择

## 为什么重要

“官方脚手架”不再是永远正确的默认值。前端项目需要主动选择渲染方式、路由、数据层和部署模型。

## 放到今天怎么实践

已有 CRA 项目可以继续维护，但应规划迁移并先移除 react-scripts 隐式依赖；样式工具升级要做视觉回归。

建议在真实项目中按以下顺序验证：

1. 盘点当前版本、插件和运行环境，不带假设地记录现状。
2. 建立最小可运行示例，确认新能力的边界和失败方式。
3. 在测试或影子构建中比较行为、性能与最终产物。
4. 保留回滚路径，再逐步扩大使用范围。

## 参考资料

- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Create React App 停止推荐](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
