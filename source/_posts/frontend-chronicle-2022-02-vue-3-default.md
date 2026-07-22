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
前端工具更新很快，但并不是每个版本都值得记住。2022 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。

Vue 3 正式成为 npm 与文档的默认版本，create-vue、Pinia、Vite 和新的开发工具组成推荐技术栈。

## script setup 的日常写法

把状态、派生值和副作用的边界写清楚：

```vue
<script setup>
import { computed, ref } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```



## Pinia、Vite 与 Volar 拼齐生态

Vue 3 从可选升级转为新项目默认选择；Pinia 逐步替代 Vuex 成为官方推荐状态库；Vite 与 Volar 改善启动速度和 TypeScript 开发体验。

## 框架升级取决于周边是否就绪

重大版本迁移最终取决于路由、状态、组件库和构建插件是否就绪，而不只是框架核心稳定。

## Vue 2 项目先列阻塞清单

Vue 2 项目应先列出生态阻塞项和浏览器要求，再决定渐进迁移、兼容构建或业务重写。

## Vue 3 默认版本说明

- [Vue 3.0 发布公告](https://blog.vuejs.org/posts/vue-3-one-piece)
