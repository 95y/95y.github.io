---
title: "前端疑难排查：z-index 失效排查：层叠上下文、定位与遮挡问题"
date: 2018-07-20 14:00:00
tags:
  - 前端排障
  - CSS
categories:
  - 前端排障
description: "把 z-index 调到 99999，弹层仍被遮住。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/frontend-performance-cover.svg
toc: true
---

线上问题最怕“改一点试试看”。更可靠的方式是先稳定复现，再沿数据、时序、网络或渲染链路逐层缩小范围。

## 常见症状

1. 把 z-index 调到 99999，弹层仍被遮住
2. 子元素无法越过相邻卡片或 fixed 导航
3. 加上 transform、opacity 或 filter 后层级突然变化

## 高概率根因

1. z-index 只能在同一个层叠上下文内比较
2. transform、filter、opacity、isolation 等属性会创建新上下文
3. 父元素的 overflow 还可能直接裁剪子元素

## 定位步骤

1. 从被遮挡元素向上检查每一层父元素的 computed style
2. 在 DevTools Layers 或 3D 视图确认上下文边界
3. 临时移除 transform 和 overflow 验证根因

## 修复方案

1. 把弹层 Portal 到 body 或统一 overlay 容器
2. 建立有限的 z-index token，而不是不断加位数
3. 只在确有需要时创建新的层叠上下文

## 如何防止再次发生

在设计系统中统一导航、抽屉、弹窗、Toast 的层级，并为组件文档增加嵌套容器测试。

修复完成后还应补充最小回归用例，并把关键上下文写进错误日志。只有能够在下一次自动发现同类问题，排障工作才算真正闭环。

## 参考资料

- [MDN：层叠上下文](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Stacking_context)
