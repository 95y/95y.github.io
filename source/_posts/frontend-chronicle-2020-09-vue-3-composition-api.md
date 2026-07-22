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
前端工具更新很快，但并不是每个版本都值得记住。2020 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。

Vue 3.0 正式发布，响应式系统改用 Proxy，并提供 Composition API，以改善大型组件的逻辑组织和 TypeScript 推导。

## 把同一业务逻辑放回一起

把状态、派生值和副作用的边界写清楚：

```vue
<script setup>
import { computed, ref } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

## ref 和 reactive 不必二选一

单个值、可能整体替换的对象，使用 ref 往往更直观；一组始终一起修改的字段可以放进 reactive。真正需要避免的是为了少写 value 而随意混用，最后在解构、传参和 watch 时失去响应关系。团队形成固定约定，比争论哪一个更高级有用。

## Composable 也会变成新的大组件

把 Options API 搬进一个超大的 usePage 并没有改善结构。可复用逻辑应围绕业务动作拆分，并清楚暴露只读状态和修改入口。网络请求还要处理取消、竞态和组件卸载，不能只返回 data 与 loading。

## Proxy 补上了哪些响应式缺口

Proxy 可以观察属性新增、删除和集合类型；Composition API 按业务关注点组织逻辑；Tree-shakable API 与更好的 TypeScript 集成改善工程体验。

## Composition API 不是换一种写法

Vue 从适合渐进增强的小型框架，进一步扩展到大型应用与跨框架工具链。迁移难点主要集中在生态兼容和响应式语义，而不是模板语法。

## 迁移前先盘点组件库和插件

优先使用官方迁移工具和兼容构建；不要把所有逻辑塞进一个 setup，仍需按领域拆分 composable。

## Vue 3.0 发布公告

- [Vue 3.0 发布公告](https://blog.vuejs.org/posts/vue-3-one-piece)
