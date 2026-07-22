---
title: "Tailwind CSS 4 与 CRA 退场：工具链继续现代化"
date: 2025-02-14 09:00:00
tags:
  - 前端年鉴
  - 前端工具链
  - 2025
categories:
  - 前端年鉴
description: "Tailwind CSS 4 使用新的高性能引擎与 CSS-first 配置；React 团队随后停止推荐 Create React App，建议新项目采用框架或 Vite 等构建工具。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-tailwind-4-and-cra-sunset.svg
top_img: /img/covers/frontend-chronicle-tailwind-4-and-cra-sunset.svg
toc: true
---
如果把时间拨回 2025 年，前端工具链 所面对的问题和今天并不完全一样。回头看这次变化，最有意思的不是版本号，而是开发方式从这里拐了一个弯。

## 前端工具链 当时想解决的问题

Tailwind CSS 4 使用新的高性能引擎与 CSS-first 配置；React 团队随后停止推荐 Create React App，建议新项目采用框架或 Vite 等构建工具。

## 先看一段代码

Tailwind CSS 4 把主题配置带回 CSS：

```css
@import "tailwindcss";
@theme {
  --color-brand-500: oklch(0.62 0.19 255);
}
```

## 为什么后来大家都跟进了

“官方脚手架”不再是永远正确的默认值。前端项目需要主动选择渲染方式、路由、数据层和部署模型。

- 现代 CSS 能力承担更多主题与配置职责
- CRA 的封闭零配置模型不再适应当前框架和构建需求
- 新项目脚手架从单一模板转向按产品架构选择

## 如果现在接手这样的项目

已有 CRA 项目可以继续维护，但应规划迁移并先移除 react-scripts 隐式依赖；样式工具升级要做视觉回归。

## 我参考的资料

- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Create React App 停止推荐](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
