---
title: "Vue 3 成为默认版本：生态迁移进入主线"
date: 2022-02-07 09:00:00
tags:
  - 前端年鉴
  - Vue
  - 2022
categories:
  - 前端年鉴
description: "三个 Vue 2 项目做出三种升级决定：新项目接受 Vue 3 默认栈，大后台逐路由迁移，稳定营销站暂不重写。"
cover: /img/covers/frontend-chronicle-vue-3-default.svg
top_img: /img/covers/frontend-chronicle-vue-3-default.svg
toc: true
---
2022 年 Vue 3 成为 npm 与官方文档的默认版本时，变化的不只是 `npm install vue` 会装到哪一版。create-vue、Vite、Pinia 和新的 TypeScript/编辑器工具逐渐组成一条完整默认路径，团队再也不能用“生态还没准备好”笼统推迟所有评估。

我们当时有三个 Vue 2 项目：一个还在维护的营销站、一个大型后台、一个准备启动的新系统。最后做了三个不同决定：新系统直接 Vue 3，大后台分阶段迁移，营销站只更新安全与关键依赖，不为追版本重写。框架成为默认，不代表所有旧项目都应该同一天升级。

## 新项目先接受新默认，再删掉不需要的选项

create-vue 生成项目时会询问 TypeScript、Router、Pinia、测试和 lint。我们没有全选，而是从产品需要出发：

```text
TypeScript: Yes
Vue Router: Yes
Pinia: Yes（存在跨路由会话状态）
Vitest: Yes
E2E: Yes（覆盖登录与支付路径）
JSX: No
```

最小入口非常直接：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app')
```

开箱即用的价值是工具之间已经走过兼容路径，不必从 webpack loader、Babel 和类型插件开始拼。但脚手架不是架构答案，目录边界、请求策略和状态归属仍要自己设计。

## Pinia 不是把 Vuex mutation 改个名字

旧 Vuex store 往往把所有东西放进一个根仓库，mutation、action 和 getter 按技术类型分散。迁移时我们按领域拆 store，而不是逐行翻译。

```ts
import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  state: () => ({
    user: null as User | null,
    permissions: [] as string[]
  }),
  getters: {
    signedIn: state => state.user !== null
  },
  actions: {
    async restore() {
      this.user = await sessionApi.currentUser()
      this.permissions = await sessionApi.permissions()
    },
    clear() {
      this.$reset()
    }
  }
})
```

页面局部筛选、弹窗开关不因为用了 Pinia 就要进全局 store。只有需要跨组件/路由共享、具有明确生命周期的状态才进入。服务器返回的数据还要考虑缓存和重新请求，不能一概永久放在 store 中。

## 大后台的阻塞项不是 Vue 核心

我们列出的迁移表里，Vue 核心 API 只占一小部分：

| 类别 | 需要确认的内容 |
| --- | --- |
| 组件库 | Vue 3 版本、主题变量、弹窗/表单行为 |
| 路由 | 动态路由、导航守卫、keep-alive |
| 状态 | Vuex 版本、模块注册、持久化插件 |
| 构建 | webpack loader、环境变量、SVG 与 worker |
| 业务插件 | 依赖 Vue 2 实例 API、过滤器、全局 mixin |
| 浏览器 | Proxy 支持范围与企业终端基线 |
| 测试 | shallowMount 行为、组件选择器、异步刷新 |

一个停更的树形表格组件成了真正阻塞项。与其为了升级重写整套后台，我们先把它隔离到少量适配组件，其他路由用兼容构建逐步迁移。阻塞项有了名字、负责人和替代方案以后，讨论才从“能不能升”变成具体工程计划。

## script setup 让组件短了，但边界不能省

新项目使用 `<script setup>` 后，props、emit 和模板变量更紧凑：

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  price: number
  count?: number
}>()

const emit = defineEmits<{
  change: [count: number]
}>()

const total = computed(() => props.price * (props.count ?? 1))
</script>

<template>
  <button @click="emit('change', (count ?? 1) + 1)">
    合计 {{ total }}
  </button>
</template>
```

宏减少样板代码，不代表 props 可以随意修改或事件可以没有契约。我们仍要求组件说明受控值、默认值和事件时机，并用类型/测试验证。

## Vite 很快，类型检查被拆到另一条链路

Vite 转换 TypeScript 主要负责去除类型，完整类型检查通常由 `vue-tsc` 独立完成。开发时编辑器反馈，CI 中显式运行：

```json
{
  "scripts": {
    "dev": "vite",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "build": "npm run typecheck && vite build"
  }
}
```

这条分工让 dev server 不被全项目类型检查阻塞，但不能因此漏掉 CI。工具更快往往来自拆分职责，团队要确保每个职责仍有执行入口。

## 迁移完成的标准不是“没有 Vue 2 语法”

每个路由迁移后，我们看的是业务行为：

- 直接刷新、前进后退与权限重定向；
- 表单校验触发时机和错误定位；
- keep-alive 页面恢复时是否重复请求；
- 全局弹窗/消息是否受新 Teleport 层级影响；
- 埋点、错误上报和 source map 是否完整；
- 大列表与常用交互性能是否退化。

语法扫描只能找到一部分兼容问题，真实用户路径才是迁移验收。

## 三个项目，三种结果

新系统使用 Vue 3 + Vite + Pinia 后保持了较干净的默认链路；后台用了数月按路由迁移；营销站没有迁，因为收益抵不过测试和重写成本。这个结果比制定“一季度全部 Vue 3 化”更健康。

Vue 3 成为默认版本，代表生态主航道已经改变。它给新项目一个更明确起点，也让旧项目必须正视未来维护窗口。但默认值是决策输入，不是决策本身。盘点依赖、明确业务收益、保留回滚和逐路由验证，才是大型项目真正能走完升级的原因。

## 资料

- [Vue：Vue 3 as the New Default](https://blog.vuejs.org/posts/vue-3-as-the-new-default)
- [Vue：Tooling](https://vuejs.org/guide/scaling-up/tooling.html)
- [Pinia 官方文档](https://pinia.vuejs.org/)
