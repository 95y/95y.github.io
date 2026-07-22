---
title: "z-index 失效排查：层叠上下文、定位与遮挡问题"
date: 2018-07-20 14:00:00
tags:
  - 前端排障
  - CSS
categories:
  - 前端排障
description: "把 z-index 调到 99999，弹层仍被遮住。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-css-z-index-stacking-context.svg
top_img: /img/covers/frontend-debug-css-z-index-stacking-context.svg
toc: true
---
这个问题最麻烦的地方，是表面现象和真正根因经常不在同一层。下面按一次实际排查的顺序来走。

## 现场通常是什么样

- 把 z-index 调到 99999，弹层仍被遮住
- 子元素无法越过相邻卡片或 fixed 导航
- 加上 transform、opacity 或 filter 后层级突然变化

## 用最小例子感受一下

问题经常藏在创建层叠上下文的父元素：

```css
.card { transform: translateZ(0); }
.overlay-root {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
}
```

## 我会先查这几个位置

1. 从被遮挡元素向上检查每一层父元素的 computed style
2. 在 DevTools Layers 或 3D 视图确认上下文边界
3. 临时移除 transform 和 overflow 验证根因

## 最后发现的高频根因

- z-index 只能在同一个层叠上下文内比较
- transform、filter、opacity、isolation 等属性会创建新上下文
- 父元素的 overflow 还可能直接裁剪子元素

## 修复和收尾

1. 把弹层 Portal 到 body 或统一 overlay 容器
2. 建立有限的 z-index token，而不是不断加位数
3. 只在确有需要时创建新的层叠上下文

在设计系统中统一导航、抽屉、弹窗、Toast 的层级，并为组件文档增加嵌套容器测试。

## 相关资料

- [MDN：层叠上下文](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Stacking_context)
