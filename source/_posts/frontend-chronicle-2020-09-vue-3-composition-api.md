---
title: "Vue 3：Composition API、Proxy 与 TypeScript 基础重构"
date: 2020-09-18 09:00:00
tags:
  - 前端年鉴
  - Vue
  - 2020
categories:
  - 前端年鉴
description: "Vue 3.0 正式发布，响应式系统改用 Proxy，并提供 Composition API，以改善大型组件的逻辑组织和 TypeScript 推导。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vue-3-composition-api.svg
top_img: /img/covers/frontend-chronicle-vue-3-composition-api.svg
toc: true
---
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## 这次升级真正解决了什么

Vue 从适合渐进增强的小型框架，进一步扩展到大型应用与跨框架工具链。迁移难点主要集中在生态兼容和响应式语义，而不是模板语法。

## 从当时的开发现场说起

Vue 3.0 正式发布，响应式系统改用 Proxy，并提供 Composition API，以改善大型组件的逻辑组织和 TypeScript 推导。

## 版本号之外的变化

1. Proxy 可以观察属性新增、删除和集合类型
2. Composition API 按业务关注点组织逻辑
3. Tree-shakable API 与更好的 TypeScript 集成改善工程体验

## 用最小例子感受一下

把状态、派生值和副作用的边界写清楚：

```vue
<script setup>
import { computed, ref } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

## 别急着把老项目全部重写

优先使用官方迁移工具和兼容构建；不要把所有逻辑塞进一个 setup，仍需按领域拆分 composable。

## 相关发布记录

- [Vue 3.0 发布公告](https://blog.vuejs.org/posts/vue-3-one-piece)
