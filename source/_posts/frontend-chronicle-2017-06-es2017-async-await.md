---
title: "ES2017 与 async/await：异步代码开始像同步代码一样可读"
date: 2017-06-30 09:00:00
tags:
  - 前端年鉴
  - JavaScript
  - 2017
categories:
  - 前端年鉴
description: "一次 async/await 改造让首页请求慢了一倍：从请求瀑布、错误边界到取消与并发，复盘异步流程该怎样设计。"
cover: /img/covers/frontend-chronicle-es2017-async-await.svg
top_img: /img/covers/frontend-chronicle-es2017-async-await.svg
toc: true
---
async/await 刚进入标准时，我最先做的事是把一段七层回调改成从上往下的代码。改完确实顺眼，测试也全过了，上线后首页接口却慢了接近一倍。

问题不在语法，而在我无意中把三个并行请求写成了串行。这件小事让我很早就明白：`await` 解决的是表达方式，不负责替我们设计并发关系。

## 一段“更好读”但更慢的代码

用户进入工作台后，需要同时读取个人资料、权限和未读消息。这三份数据彼此独立，原来的 Promise 版本会一起发出请求：

```js
function loadDashboard(userId) {
  return Promise.all([
    fetchProfile(userId),
    fetchPermissions(userId),
    fetchUnreadCount(userId)
  ]).then(function ([profile, permissions, unread]) {
    return { profile, permissions, unread }
  })
}
```

我当时机械地把 `.then()` 换成 `await`：

```js
async function loadDashboard(userId) {
  const profile = await fetchProfile(userId)
  const permissions = await fetchPermissions(userId)
  const unread = await fetchUnreadCount(userId)
  return { profile, permissions, unread }
}
```

如果三个接口分别耗时 300ms、400ms 和 200ms，第二种写法接近 900ms；它的缩进更少，却改变了业务时序。正确改法是先创建任务，再一起等待：

```js
async function loadDashboard(userId) {
  const profileTask = fetchProfile(userId)
  const permissionTask = fetchPermissions(userId)
  const unreadTask = fetchUnreadCount(userId)

  const [profile, permissions, unread] = await Promise.all([
    profileTask,
    permissionTask,
    unreadTask
  ])

  return { profile, permissions, unread }
}
```

我现在更习惯先在纸上标出依赖：B 需要 A 的结果，就顺序 `await`；B 与 A 无关，就同时启动。代码风格不能替代这一步。

## try/catch 终于能包住一段业务流程

Promise 链当然可以处理错误，但一旦中间穿插条件分支、循环或回退逻辑，链式写法很容易被拆散。async 函数最大的价值，是可以直接使用 JavaScript 原有的控制结构：

```js
async function submitOrder(draft) {
  try {
    const order = await createOrder(draft)

    if (order.needPayment) {
      await openCashier(order.paymentToken)
    }

    await refreshOrder(order.id)
    return order
  } catch (error) {
    reportError(error, { action: 'submit-order' })
    showMessage(getFriendlyMessage(error))
    throw error
  } finally {
    setSubmitting(false)
  }
}
```

这里要小心错误边界的大小。如果 `try` 把整页初始化都包进去，任何失败最终只剩一句“加载失败”，反而丢掉了哪些请求允许降级的信息。头像失败可以用默认图，权限失败却必须阻止页面继续渲染，它们不应该落进同一个无差别的 `catch`。

## `Promise.all` 的失败策略不是总合适

`Promise.all` 中任一任务拒绝，外层就立即拒绝，但其他请求并不会自动取消。对于“要么全部成功、要么页面无法使用”的数据，这很合理；首页的推荐位、公告和统计卡片则可以分别降级。

```js
const results = await Promise.allSettled([
  fetchNotice(),
  fetchRecommendations(),
  fetchStatistics()
])

const [notice, recommendations, statistics] = results.map(result =>
  result.status === 'fulfilled' ? result.value : null
)
```

使用 `allSettled` 也不能把错误吞掉。失败项仍需记录接口名、耗时和原因，否则页面看似正常，监控里却什么也没有。

## 超时和取消必须由业务补上

async/await 不会让请求自动超时。用户切换搜索关键词时，旧请求可能比新请求晚回来，然后把界面覆盖成过期结果。我会为每次搜索保留一个 `AbortController`：

```js
let currentController

async function search(keyword) {
  currentController?.abort()
  currentController = new AbortController()

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`, {
      signal: currentController.signal
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') return null
    throw error
  }
}
```

“取消”不一定能让服务器停止工作，但至少能阻止客户端继续消费已过期的响应。提交、付款这类写操作则不能随意重试，还要由服务端用幂等键兜住重复请求。

## 循环里的 await 先问清楚意图

代码评审中经常看到 `forEach(async item => ...)`。`forEach` 不会等待回调，外层函数可能在任务完成前就返回。需要串行时用 `for...of`：

```js
for (const file of files) {
  await uploadFile(file)
}
```

需要有限并发时，也不要一次性把几千个请求塞进 `Promise.all`。可以分批，或使用一个有并发上限的任务池。异步代码的关键从来不只是“有没有 await”，而是顺序、并发上限、失败、取消与重试是否符合业务。

## ES2017 留下的真正变化

到今天，async/await 已经普通得像 `if` 和 `for`。它最重要的贡献不是少写几个 `.then()`，而是让异步业务重新拥有可读的控制流。与此同时，它也让不合理的串行等待变得更隐蔽。

我现在写异步流程会先回答四个问题：哪些任务有依赖，失败能否局部降级，用户离开后如何取消，写操作能不能安全重试。答案清楚以后，async/await 才会把代码变简单，而不是只把复杂度藏到语法后面。

## 资料

- [ECMAScript 2017 语言规范](https://262.ecma-international.org/8.0/)
- [MDN：async function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN：Promise 并发方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise#promise_concurrency)
