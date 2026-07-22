---
title: "Vue 3 成为默认版本：生态迁移进入主线"
date: 2022-02-07 09:00:00
tags:
  - 前端年鉴
  - Vue
  - 2022
categories:
  - 前端年鉴
description: "Vue 3 正式成为 npm 与文档的默认版本，create-vue、Pinia、Vite 和新的开发工具组成推荐技术栈。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vue-3-default.svg
top_img: /img/covers/frontend-chronicle-vue-3-default.svg
toc: true
---
很多技术在发布当天看起来只是多了几个 API，真正的影响往往要过一两年才看得清。Vue 这次变化就是一个典型例子。

## 2022 年，项目里正在发生什么

Vue 3 正式成为 npm 与文档的默认版本，create-vue、Pinia、Vite 和新的开发工具组成推荐技术栈。

重大版本迁移最终取决于路由、状态、组件库和构建插件是否就绪，而不只是框架核心稳定。

## 代码里最直观的变化

把状态、派生值和副作用的边界写清楚：

```vue
<script setup>
import { computed, ref } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

## 版本号之外的变化

- Vue 3 从可选升级转为新项目默认选择
- Pinia 逐步替代 Vuex 成为官方推荐状态库
- Vite 与 Volar 改善启动速度和 TypeScript 开发体验

## 别急着把老项目全部重写

Vue 2 项目应先列出生态阻塞项和浏览器要求，再决定渐进迁移、兼容构建或业务重写。

## 相关发布记录

- [Vue 3.0 发布公告](https://blog.vuejs.org/posts/vue-3-one-piece)
