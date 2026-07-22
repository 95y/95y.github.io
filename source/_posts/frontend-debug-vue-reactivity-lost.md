---
title: "Vue 响应式失效排查：解构、赋值与 watch 时机"
date: 2020-08-21 14:00:00
tags:
  - 前端排障
  - Vue
categories:
  - 前端排障
description: "请求后 state.rows 已有数据，模板仍为空：从普通解构断开代理一路排到 reactive 替换、watch source 和异步竞态。"
cover: /img/covers/frontend-debug-vue-reactivity-lost.svg
top_img: /img/covers/frontend-debug-vue-reactivity-lost.svg
toc: true
---
一个 Vue 3 列表页出现过很奇怪的现象：请求返回后控制台能看到 `state.rows` 已经有数据，模板里的空状态却没有消失。手动切一次筛选条件，列表又突然出现。

最后问题不是 Vue 没检测到数组变化，而是 composable 返回前把响应式对象普通解构了。模板拿到的是初始化时的值快照，请求修改的是 Proxy 里的另一个属性。两边名字一样，引用却已经断开。

这篇把几种“数据变了、页面不动”的情况拆开。它们表面相似，修法并不相同。

## 第一现场：解构以后只剩普通值

有问题的 composable：

```ts
function useMemberList() {
  const state = reactive({
    rows: [] as Member[],
    pending: false,
    keyword: ''
  })

  async function reload() {
    state.pending = true
    try {
      state.rows = await fetchMembers(state.keyword)
    } finally {
      state.pending = false
    }
  }

  return { ...state, reload }
}
```

对象展开会读取 Proxy 当时的属性值，返回一个普通对象。`rows` 初始是空数组引用，后来 `state.rows = newRows` 替换为新数组，调用方仍持有旧数组。

修复可以直接返回 `state`，也可以使用 `toRefs`：

```ts
function useMemberList() {
  const state = reactive({
    rows: [] as Member[],
    pending: false,
    keyword: ''
  })

  // reload 同上
  return { ...toRefs(state), reload }
}
```

`toRefs` 为每个属性创建与原对象联动的 ref。模板会自动解包，JavaScript 中访问需要 `.value`。

## 第二种：把 reactive 变量整体换掉

另一个常见写法：

```ts
let form = reactive({ name: '', phone: '' })

async function load(id: number) {
  form = reactive(await fetchMember(id))
}
```

模板或其他 composable 可能已经持有旧 Proxy，重新给局部变量赋值不会让这些消费者自动改指向。若对象结构稳定，可以修改原代理：

```ts
const form = reactive({ name: '', phone: '' })

async function load(id: number) {
  const data = await fetchMember(id)
  Object.assign(form, data)
}
```

如果业务语义本来就是整体替换，我更倾向使用 `ref`：

```ts
const form = ref<MemberForm>({ name: '', phone: '' })

async function load(id: number) {
  form.value = await fetchMember(id)
}
```

选 `reactive` 还是 `ref` 要结合更新方式。经常整体替换的值用 ref，意图更直接。

## 第三种：watch 监听的对象不对

`watch(state.keyword, callback)` 会在调用 watch 时先读取字符串，然后把普通值传进去，并没有可追踪来源。应该传 getter 或 ref：

```ts
watch(
  () => state.keyword,
  (keyword, previous) => {
    console.log({ previous, keyword })
  }
)
```

多个筛选条件可以返回数组：

```ts
watch(
  () => [state.keyword, state.level, state.page],
  () => reload()
)
```

不要为了省事总是 `watch(state, ..., { deep: true })`。深度监听会遍历嵌套属性，大对象成本高；对象内部修改时，回调中的新旧值还可能指向同一个对象，很难拿来做差异比较。

## 派生值不应该用 watch 复制一份

下面代码维护了两份可以互相推导的状态：

```ts
const firstName = ref('')
const lastName = ref('')
const fullName = ref('')

watch([firstName, lastName], () => {
  fullName.value = `${firstName.value} ${lastName.value}`.trim()
}, { immediate: true })
```

用 computed 不需要同步时序：

```ts
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`.trim()
)
```

watch 更适合产生外部副作用，例如请求、localStorage 或第三方实例，而不是把 A 状态复制成 B 状态。副本越多，越容易出现“一个变了另一个没变”。

## 异步搜索看似响应式失效，其实是竞态

关键词 A 请求慢，关键词 B 请求快。B 先回来正确显示，A 后回来又覆盖列表，用户会觉得“输入变了页面还是旧内容”。响应式本身完全正常，错的是响应顺序。

```ts
let controller: AbortController | null = null

watch(keyword, async value => {
  controller?.abort()
  controller = new AbortController()

  try {
    rows.value = await searchMembers(value, controller.signal)
  } catch (error) {
    if ((error as Error).name !== 'AbortError') throw error
  }
})
```

Vue 的 watch 清理机制也可以用于取消上一次副作用，具体 API 写法应跟随项目版本。关键是新一轮执行之前，让旧请求失效。

## DOM 还没更新，不代表状态没更新

修改状态后立刻读取元素尺寸，拿到的可能还是上一次 DOM：

```ts
expanded.value = true
console.log(panel.value?.getBoundingClientRect().height)
```

Vue 会批量调度 DOM 更新。确实需要等待本轮 DOM 刷新时使用 `nextTick`：

```ts
expanded.value = true
await nextTick()
console.log(panel.value?.getBoundingClientRect().height)
```

不要把所有状态修改都包进 `nextTick`。它只解决“等待 DOM 提交”的时机，不会修复丢失代理或错误 watcher。

## 用 Devtools 沿数据链找断点

我现在排查会按以下顺序，而不是先加 `forceUpdate`：

1. 在 Vue Devtools 中看组件真正接收到的 prop/ref 是否变化；
2. 用 `isRef`、`isReactive`、`toRaw` 辅助确认值的身份；
3. 从模板使用点向上追，检查对象展开、普通解构和函数参数；
4. 暂时去掉复杂 watch，只保留一个 ref + computed 的最小复现；
5. 若数据正确但 DOM 稍后才变，检查更新批次与 `nextTick`；
6. 若最终显示旧请求结果，记录每个请求 ID 和完成顺序。

```ts
console.table({
  rowsIsRef: isRef(rows),
  formIsReactive: isReactive(form),
  sameRaw: toRaw(form) === originalForm
})
```

这些 API 是诊断工具，不建议在业务逻辑中到处依赖 raw/proxy 身份。

## 不使用“万能修复”

我见过的临时处理包括给组件加随机 key、调用 forceUpdate、把所有对象 JSON 深拷贝、所有 watch 都开 deep。它们可能让现象暂时消失，却会制造重建组件、丢失状态和性能问题。

更可靠的判断是：

- 解构断开：返回 ref 或保持对象属性访问；
- 整体替换：使用 ref，或更新原 reactive 对象；
- 派生数据：computed；
- 外部副作用：watch，并精确声明来源与清理；
- DOM 提交时机：nextTick；
- 请求覆盖：取消或忽略旧请求。

“响应式失效”不是一个根因，只是一组症状。把值从创建、传递、派生到副作用的链路画出来，找到哪一步从 Proxy/ref 变成普通快照，通常就能定位，而不必怀疑整个框架。

## 资料

- [Vue：Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue：Watchers](https://vuejs.org/guide/essentials/watchers.html)
- [Vue：Reactivity Utilities](https://vuejs.org/api/reactivity-utilities.html)
