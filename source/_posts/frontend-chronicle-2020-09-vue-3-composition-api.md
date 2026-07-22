---
title: "Vue 3：Composition API、Proxy 与 TypeScript 基础重构"
date: 2020-09-18 09:00:00
tags:
  - 前端年鉴
  - Vue
  - 2020
categories:
  - 前端年鉴
description: "把一张 900 行会员列表迁到 Vue 3：按业务关注点重组代码，处理 ref/reactive、Proxy 身份与 composable 竞态。"
cover: /img/covers/frontend-chronicle-vue-3-composition-api.svg
top_img: /img/covers/frontend-chronicle-vue-3-composition-api.svg
toc: true
---
Vue 3 正式发布后，我挑了一张 900 多行的会员列表页做实验。它包含筛选、分页、URL 同步、导出和权限判断。Options API 本身没有坏，真正的问题是同一项功能被拆在 `data`、`computed`、`watch` 和 `methods` 几个区域里。查“筛选条件为什么重置”时，要在文件里上下翻很久。

Composition API 让我们可以按业务关注点把代码放回一起；Proxy 则补上 Vue 2 响应式在属性新增、数组索引和集合类型上的一些限制。迁移完以后文件没有神奇地变短，但每一块逻辑的输入、输出和清理路径清楚了很多。

## 先不拆 composable，只在 setup 中重新分组

旧组件的结构类似这样：

```js
export default {
  data() {
    return {
      filters: { keyword: '', level: 'all' },
      rows: [],
      loading: false,
      page: 1
    }
  },
  computed: {
    canExport() { return this.$store.getters.hasPermission('member:export') }
  },
  watch: {
    filters: {
      deep: true,
      handler() { this.page = 1; this.loadMembers() }
    }
  },
  methods: {
    async loadMembers() { /* ... */ },
    async exportMembers() { /* ... */ }
  }
}
```

第一步没有急着抽文件，只按“查询会员”这项能力放在一起：

```ts
import { computed, reactive, ref, watch } from 'vue'

export default {
  setup() {
    const filters = reactive({ keyword: '', level: 'all' })
    const rows = ref<Member[]>([])
    const loading = ref(false)
    const page = ref(1)

    async function loadMembers() {
      loading.value = true
      try {
        rows.value = await memberApi.list({ ...filters, page: page.value })
      } finally {
        loading.value = false
      }
    }

    watch(
      () => [filters.keyword, filters.level],
      () => {
        page.value = 1
        loadMembers()
      }
    )

    return { filters, rows, loading, page, loadMembers }
  }
}
```

先保证行为与 Vue 2 版本一致，测试通过后再抽 composable。直接边迁移边重新设计，出问题时很难判断是 API 变化还是业务重构。

## `ref` 与 `reactive` 的选择不是宗教问题

我们最后形成的约定很实用：单个值和可能整体替换的对象优先 `ref`；一组始终作为整体修改的表单字段可以 `reactive`。重要的是调用方能预测类型和更新方式。

```ts
const loading = ref(false)
const selectedMember = ref<Member | null>(null)
const filters = reactive({ keyword: '', level: 'all' })
```

`ref` 在 JavaScript 中用 `.value`，模板会自动解包。`reactive` 返回 Proxy，不能随意解构成普通值：

```ts
const state = reactive({ page: 1, pageSize: 20 })

// page 只是当前数字，不再与 state.page 建立响应关系
const { page } = state

// 需要解构时保留 ref
const { page: pageRef } = toRefs(state)
```

这种边界如果团队没有约定，composable 之间传来传去，很快会出现“日志已经变了，模板却没更新”的问题。

## Proxy 让新增属性不再需要特殊 API

Vue 2 基于 `Object.defineProperty` 初始化已知属性，运行时新增属性需要 `Vue.set` 才能进入响应系统。Vue 3 的 Proxy 可以拦截新增、删除和集合操作：

```ts
const member = reactive({ name: 'Jevon' })

member.level = 'vip'
delete member.name

const selectedIds = reactive(new Set<number>())
selectedIds.add(42)
```

但 Proxy 也带来身份问题。代理对象与原始对象不是严格相等，不能把 raw 和 proxy 混着当 Map key；解构或把属性传给只接收普通值的函数，也可能切断追踪。

```ts
const raw = { id: 1 }
const proxy = reactive(raw)

console.log(raw === proxy) // false
```

通常不应该在业务里依赖二者比较。进入响应式层以后尽量使用代理，确实要接第三方实例时再考虑 `markRaw` 等明确工具。

## composable 要围绕动作，而不是把页面换个文件名

第一次抽取时，我们做了一个 `useMemberPage()`，里面有列表、弹窗、权限、导出和路由，足足 500 行。它只是把大组件挪成大函数。

第二次按能力拆成：

- `useMemberQuery`：筛选、分页、请求与竞态处理；
- `useMemberSelection`：勾选与跨页选择规则；
- `useMemberExport`：导出任务与进度；
- 弹窗表单留在自己的子组件。

一个 composable 需要清楚的输入和返回值，并处理自己创建的资源：

```ts
export function useMemberQuery(filters: Ref<MemberFilters>) {
  const rows = ref<Member[]>([])
  const pending = ref(false)
  let requestId = 0

  async function reload() {
    const id = ++requestId
    pending.value = true

    try {
      const result = await memberApi.list(filters.value)
      if (id === requestId) rows.value = result
    } finally {
      if (id === requestId) pending.value = false
    }
  }

  watch(filters, reload, { deep: true, immediate: true })
  return { rows: readonly(rows), pending: readonly(pending), reload }
}
```

这里用 requestId 忽略过期响应；如果底层支持 AbortSignal，取消旧请求更好。抽成 composable 不会自动解决竞态，资源生命周期仍要自己设计。

## TypeScript 体验改善，但模板边界也要检查

Composition API 的函数与变量天然适合类型推导，不再大量依赖 `this` 上的合并类型。props 和 emit 可以明确表达：

```ts
const props = defineProps<{
  memberId: number
  readonly?: boolean
}>()

const emit = defineEmits<{
  saved: [member: Member]
  cancelled: []
}>()
```

不过 `script setup` 是后来成熟的使用方式，迁移时间点要看具体版本与工具支持。Vue 3.0 初期的现实困难更多来自组件库、路由、状态库和编辑器插件尚在迁移。核心 API 可用，不代表企业项目依赖全部就绪。

## 我们没有一次性迁完

最终策略是先升级底层依赖与构建，使用兼容方案跑通，再按路由迁移高变化页面。每个页面都保留功能对照：筛选条件、URL、权限、表单校验和埋点不能因为改写法丢失。

迁移 Vue 3 最值得避免的两种极端，一种是把 Composition API 当成必须重写所有 Options API，另一种是把它当成纯语法变化。它真正提供的是更灵活的逻辑组合和新的响应式基础；能不能变得更可维护，取决于我们是否按业务边界组织代码、是否理解 ref/Proxy，以及是否给副作用留出完整生命周期。

## 资料

- [Vue 3.0 发布公告](https://blog.vuejs.org/posts/vue-3-one-piece)
- [Vue：Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue：Composables](https://vuejs.org/guide/reusability/composables.html)
