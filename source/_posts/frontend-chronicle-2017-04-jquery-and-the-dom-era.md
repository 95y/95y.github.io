---
title: "从 jQuery 出发：DOM 操作时代的成熟与转折"
date: 2017-04-15 09:00:00
tags:
  - 前端年鉴
  - jQuery
  - 2017
categories:
  - 前端年鉴
description: "2017 年的前端项目仍大量依赖 jQuery。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-jquery-and-the-dom-era.svg
top_img: /img/covers/frontend-chronicle-jquery-and-the-dom-era.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。jQuery 这次变化就是一个典型例子。

## 从当时的开发现场说起

2017 年的前端项目仍大量依赖 jQuery。它把选择器、事件、动画、Ajax 与浏览器兼容性封装成统一 API，是许多团队进入工程化之前最可靠的基础设施。

jQuery 解决的是浏览器差异和命令式 DOM 操作；React、Vue 等框架随后解决的是复杂状态下的界面组织问题。两者不是简单的“新工具淘汰旧工具”，而是问题规模发生了变化。

## 代码里最直观的变化

老项目里很常见的事件委托：

```js
$('.js-menu').on('click', '.js-item', function () {
  $(this).toggleClass('is-active')
})
```

## 这部分最容易被忽略

- 链式 API 降低了直接操作 DOM 的门槛
- Ajax 与插件生态让页面从静态展示走向富交互
- 组件化框架开始接管状态与视图同步，手工维护 DOM 的成本逐渐暴露

## 别急着把老项目全部重写

维护老系统时不必立刻移除 jQuery。先锁定版本、补自动化测试、隔离插件，再把高变化区域逐步迁移到组件边界，风险通常比一次性重写更低。

## 版本记录与延伸阅读

- [jQuery 3.2.1 发布说明](https://blog.jquery.com/2017/03/20/jquery-3-2-1-now-available/)
