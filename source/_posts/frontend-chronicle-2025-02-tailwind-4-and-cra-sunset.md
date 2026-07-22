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
这不是一篇发布日志翻译。我只挑项目里真正能感知到的变化，再看看它们放到今天是否仍然值得借鉴。

## 现代 CSS 承担了更多职责

“官方脚手架”不再是永远正确的默认值。前端项目需要主动选择渲染方式、路由、数据层和部署模型。

## 把 Tailwind 主题写回 CSS

Tailwind CSS 4 把主题配置带回 CSS：

```css
@import "tailwindcss";
@theme {
  --color-brand-500: oklch(0.62 0.19 255);
}
```



## CRA 退场后脚手架怎么选

- 现代 CSS 能力承担更多主题与配置职责
- CRA 的封闭零配置模型不再适应当前框架和构建需求
- 新项目脚手架从单一模板转向按产品架构选择

## 两个旧默认为什么同时变化

Tailwind CSS 4 使用新的高性能引擎与 CSS-first 配置；React 团队随后停止推荐 Create React App，建议新项目采用框架或 Vite 等构建工具。

## 老 CRA 项目不必连夜重写

已有 CRA 项目可以继续维护，但应规划迁移并先移除 react-scripts 隐式依赖；样式工具升级要做视觉回归。

## Tailwind 与 React 官方记录

- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Create React App 停止推荐](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
