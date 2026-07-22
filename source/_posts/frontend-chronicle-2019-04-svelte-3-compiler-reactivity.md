---
title: "Svelte 3：把响应式工作前移到编译阶段"
date: 2019-04-22 09:00:00
tags:
  - 前端年鉴
  - Svelte
  - 2019
categories:
  - 前端年鉴
description: "从一个购物车组件和简化编译产物入手，理解 Svelte 3 如何在构建阶段生成更新路径，以及赋值响应的边界。"
cover: /img/covers/frontend-chronicle-svelte-3-compiler-reactivity.svg
top_img: /img/covers/frontend-chronicle-svelte-3-compiler-reactivity.svg
toc: true
---
第一次看到 Svelte 3 的代码，我以为 `$:` 只是另一种 computed 语法。真正让我理解它的是打开 REPL 的编译结果：组件并没有把一棵虚拟 DOM 带到浏览器再反复比较，而是编译出创建节点、标记脏值和精确更新文本的命令。

这篇不做框架跑分，也不试图证明谁“更先进”。我只用一个购物车小组件，看看 Svelte 3 把哪些工作从运行时挪到了编译阶段，以及这种设计给代码带来什么约束。

## 先写一个会算总价的组件

```svelte
<script>
  export let product

  let count = 1
  $: subtotal = product.price * count
  $: canCheckout = product.stock >= count && count > 0

  function increase() {
    if (count < product.stock) count += 1
  }
</script>

<article>
  <h2>{product.name}</h2>
  <button on:click={increase}>+</button>
  <span>{count}</span>
  <strong>¥{subtotal}</strong>
  <button disabled={!canCheckout}>结算</button>
</article>
```

`subtotal` 和 `canCheckout` 的依赖可以在编译时从变量引用中分析出来。当 `count` 改变，生成代码知道哪些表达式需要重新计算、哪些 DOM 需要更新，不必在浏览器里重新执行一套通用组件 diff。

如果只看最终行为，它和其他框架的派生状态没有本质冲突；差别在于很多框架把追踪和比较留给运行时，Svelte 让编译器更深地理解组件语义。

## “赋值触发更新”有一个容易踩的边界

Svelte 3 的响应式与赋值紧密相关。下面这段数组变更在早期写法中经常让人困惑：

```svelte
<script>
  let items = []

  function addItem(item) {
    items.push(item)
  }
</script>
```

`push` 修改了数组内容，但没有对 `items` 赋值。为了让编译器看到更新，可以创建新数组或补一次赋值：

```svelte
function addItem(item) {
  items = [...items, item]
}
```

这说明“没有虚拟 DOM”不等于“任意对象变化都能自动知道”。编译器需要可识别的信号。代码写得越隐式，例如把对象传给外部函数深层修改，分析越困难。

## 响应式语句既能算值，也能执行副作用

`$:` 后面不只能赋值，也能放语句：

```svelte
$: if (count > product.stock) {
  count = product.stock
}
```

这很方便，却可能形成难以看懂的依赖链。多个响应式语句会按依赖排序执行，不按肉眼看到的行号简单决定。若一条语句通过隐藏函数读取变量，编译器未必能从调用点看出完整依赖。

我会把纯派生值留给 `$:`，订阅、计时器和网络等外部副作用放进生命周期，并返回清理函数：

```svelte
<script>
  import { onMount } from 'svelte'

  let online = true

  onMount(() => {
    const update = () => online = navigator.onLine
    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  })
</script>
```

语法简洁不应该成为把所有逻辑塞进一个组件的理由，生命周期和资源释放仍然存在。

## 编译产物值得看一次，但不必依赖它

实际生成代码会随版本和编译选项变化，所以不应该在业务里依赖内部结构。不过观察一次大概形态很有帮助。编译器会把模板拆成创建、挂载、更新、销毁等操作，并用脏值标记决定更新哪些位置。

可以把思路粗略理解为：

```js
function update(changed, state) {
  if (changed.count || changed.product) {
    textNode.data = state.product.price * state.count
  }

  if (changed.canCheckout) {
    checkoutButton.disabled = !state.canCheckout
  }
}
```

这不是 Svelte 的真实输出，只是帮助理解：框架的通用工作被编译成组件专用更新路径。小组件通常带来很少的运行时代码，但应用变大后，业务代码、依赖和路由仍然决定总体积，不能拿 Hello World 结果外推所有场景。

## Store 解决跨组件共享，但别把所有东西都塞进去

Svelte store 使用可订阅契约，组件中用 `$store` 读取时，编译器会处理订阅和清理：

```js
// cart.js
import { writable, derived } from 'svelte/store'

export const cart = writable([])
export const total = derived(cart, items =>
  items.reduce((sum, item) => sum + item.price * item.count, 0)
)
```

```svelte
<script>
  import { cart, total } from './cart.js'
</script>

<p>共 {$cart.length} 种商品，合计 ¥{$total}</p>
```

局部输入状态继续放在组件里，跨页面购物车才进入 store。否则 store 很快会退化成全局变量仓库，编译器也无法替我们解决领域边界。

## 选型时，我会问这些而不是只问快不快

Svelte 3 让我确认，前端框架不必都围绕虚拟 DOM 设计。但项目选型还要看：

- 团队能否理解编译语义和响应式边界；
- 路由、SSR、测试、组件库和调试工具是否满足项目；
- 第三方组件和招聘/交接成本怎样；
- 框架升级时编译输出与生态插件能否稳定迁移；
- 性能瓶颈是否真的在框架运行时，而不是网络和业务依赖。

Svelte 3 的意义不只是一个框架版本。它让“编译器可以理解多少组件语义”成为主流讨论，后来其他框架也越来越重视编译优化、细粒度更新和减少手工 memo。对普通开发者来说，最直接的收获是：写下的一行响应式代码并非魔法，背后总有一套可分析的依赖和更新规则。理解规则，才能知道什么时候它不会按想象工作。

## 资料

- [Svelte 3：Rethinking reactivity](https://svelte.dev/blog/svelte-3-rethinking-reactivity)
- [Svelte Playground：Reactive declarations（历史语法）](https://svelte.dev/playground/reactive-declarations)
