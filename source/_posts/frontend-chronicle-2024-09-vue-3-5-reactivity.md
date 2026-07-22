---
title: "Vue 3.5：响应式性能、解构与 SSR 细节继续成熟"
date: 2024-09-03 09:00:00
tags:
  - 前端年鉴
  - Vue
  - 2024
categories:
  - 前端年鉴
description: "Vue 3.5 发布，重构响应式系统，并改进 props 解构、SSR 水合和自定义元素能力。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vue-3-5-reactivity.svg
top_img: /img/covers/frontend-chronicle-vue-3-5-reactivity.svg
toc: true
---


Vue 3.5 发布，重构响应式系统，并改进 props 解构、SSR 水合和自定义元素能力。

框架竞争从新增 API 转向编译、内存、SSR 与开发工具等系统性细节，升级价值更多体现在长期稳定性。

## Props 解构为什么仍能响应

把状态、派生值和副作用的边界写清楚：

```vue
<script setup>
import { computed, ref } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```



## 内存与依赖图的改进

- 响应式核心降低内存占用并改善大型依赖图性能
- 响应式 props 解构进入稳定使用路径
- 延迟水合等 API 帮助控制 SSR 交互成本

## 升级后重点回归 watch 与 computed

升级后重点回归 computed、watch 与 SSR 水合；不要依赖未公开的响应式内部结构。

## Vue 3.5 发布公告

- [Vue 3.5 发布公告](https://blog.vuejs.org/posts/vue-3-5)
