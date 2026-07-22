---
title: "Vue 3.5：响应式性能、解构与 SSR 细节继续成熟"
date: 2024-09-03 09:00:00
tags:
  - 前端年鉴
  - Vue
  - 2024
categories:
  - 前端年鉴
description: "用一个实时搜索组件串起 Vue 3.5 的响应式 props 解构、watcher 清理、模板 ref 与 SSR 延迟水合。"
cover: /img/covers/frontend-chronicle-vue-3-5-reactivity.svg
top_img: /img/covers/frontend-chronicle-vue-3-5-reactivity.svg
toc: true
---
Vue 3.5 是一类“升级后业务代码可能一行不改，但大型应用会慢慢受益”的版本。响应式核心经过重构，官方强调内存与深层响应数组等场景的性能改善；同时，响应式 props 解构、watcher 清理、模板 ref 和 SSR 水合策略这些长期摩擦点被逐个补上。

我们用一个实时搜索组件验证升级。它需要解构 props、监听关键词、取消旧请求，并在 SSR 页面中延迟水合推荐区域。这个例子刚好串起 3.5 几项最实用的变化。

## 解构 props 终于不再轻易丢响应

过去在 `<script setup>` 里直接解构 `defineProps`，变量可能只是当时的值，后续 prop 更新不会触发依赖。常见写法是始终保留 `props` 对象或 `toRefs`：

```ts
const props = defineProps<{ keyword: string; limit?: number }>()
watch(() => props.keyword, search)
```

Vue 3.5 将 Reactive Props Destructure 稳定化，编译器会为同一 `<script setup>` 中的访问做转换：

```vue
<script setup lang="ts">
const { keyword, limit = 20 } = defineProps<{
  keyword: string
  limit?: number
}>()

watchEffect(() => {
  console.log('search keyword:', keyword, 'limit:', limit)
})
</script>
```

默认值也更自然，不需要额外 `withDefaults`。但这是编译器识别的 props 解构语义，不应该外推成“所有 reactive 对象都能安全普通解构”。

把变量直接传给需要 watch source 的函数时，还要考虑传值是否失去 getter。显式包装最清楚：

```ts
watch(() => keyword, value => {
  console.log('keyword changed:', value)
})
```

## `onWatcherCleanup` 让取消逻辑靠近副作用

搜索组件最容易出现旧请求覆盖新结果。Vue 3.5 提供 `onWatcherCleanup`，可以在 watcher 失效重跑前清理当前副作用：

```ts
import { onWatcherCleanup, ref, watch } from 'vue'

const result = ref<SearchResult[]>([])
const pending = ref(false)

watch(() => keyword, async value => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort())

  pending.value = true
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
      signal: controller.signal
    })
    result.value = await response.json()
  } catch (error) {
    if ((error as Error).name !== 'AbortError') throw error
  } finally {
    if (!controller.signal.aborted) pending.value = false
  }
})
```

清理注册必须发生在 watcher 同步执行阶段，不能等第一个 await 之后才注册。这个限制很合理：Vue 需要在副作用开始时知道如何让它失效。

旧的 `onCleanup` 回调参数仍然有对应使用方式。迁移不是为了把全项目 API 搜索替换，而是在新代码里让资源创建与释放放在一起。

## `useTemplateRef` 让模板与脚本的连接更明确

以前模板 ref 通常要声明一个同名 `ref(null)`：

```vue
<script setup>
const input = ref(null)
onMounted(() => input.value.focus())
</script>

<template><input ref="input" /></template>
```

3.5 的 `useTemplateRef` 让字符串 key 关系显式，也改善类型推导：

```vue
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

const searchInput = useTemplateRef<HTMLInputElement>('search-input')

onMounted(() => {
  searchInput.value?.focus()
})
</script>

<template>
  <input ref="search-input" type="search" />
</template>
```

仍要处理 null：挂载前、条件渲染消失后，元素都可能不存在。template ref 是逃生舱，不应替代声明式 props/state。

## 延迟水合适合低优先级区域

SSR 页面中，首屏下方的推荐区 HTML 已经存在，但不需要立刻下载/执行交互。3.5 的异步组件 hydration strategy 可以按空闲、可见、媒体查询或交互延迟水合。

```ts
import { defineAsyncComponent, hydrateOnVisible } from 'vue'

const RecommendationPanel = defineAsyncComponent({
  loader: () => import('./RecommendationPanel.vue'),
  hydrate: hydrateOnVisible({ rootMargin: '200px' })
})
```

延迟水合并非免费：用户可能在组件水合前快速交互，策略要保证事件被合理处理或该区域本来就不急。登录按钮、购买按钮这类关键交互不适合为了分数盲目推迟。

我们用真实慢网和快速滚动测试，而不是只看 Lighthouse 一次结果。

## `data-allow-mismatch` 只用于已知差异

SSR 中某些文本确实不可避免地因服务器/客户端不同，例如本地化时间。3.5 允许更细粒度抑制已知 hydration mismatch：

```html
<time data-allow-mismatch="text">{{ localTime }}</time>
```

这不应成为压掉所有水合警告的开关。随机数、非法 HTML、不同数据快照造成的结构差异仍要修。允许 mismatch 前必须能解释差异为何安全、为何不能提供服务器快照。

## 响应式核心重构怎么验证

官方称重构在保持行为一致的同时降低内存占用，并改善大型/深层响应场景。业务项目不需要读取内部 dependency link 来证明它。我们做的是：

1. 跑 computed、watch、effectScope 与组件库完整测试；
2. 在重复打开/关闭复杂表单后比较 heap 趋势；
3. 对大数组筛选场景记录交互和更新耗时；
4. 检查依赖 Vue 内部 API 的调试插件；
5. SSR 页面扫描 hydration warning。

如果项目规模小，数字可能没有肉眼差异，这不影响内部维护质量的价值。不要为了制造“升级收益”写不可信 benchmark。

## 这次小版本最值得的地方

Vue 3.5 没有要求团队学习一种全新组件范式，而是在已有模型上打磨：解构更符合直觉，watcher 有清晰清理入口，模板 ref 与 SSR 水合更精细，底层响应式减少长期成本。

这种版本适合正常升级，但依然要完整回归，特别是 computed/watch、SSR 和依赖内部实现的插件。框架越成熟，重要变化越可能藏在内存、编译和边界 API，而不是发布会上的新语法数量。

## 资料

- [Vue 3.5 发布说明](https://blog.vuejs.org/posts/vue-3-5)
- [Vue：Watchers - Side Effect Cleanup](https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup)
- [Vue：Async Components - Lazy Hydration](https://vuejs.org/guide/components/async.html#lazy-hydration)
