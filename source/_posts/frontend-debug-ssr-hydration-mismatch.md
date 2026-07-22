---
title: "Hydration mismatch 排查：服务端 HTML 为什么和客户端不同"
date: 2024-08-16 14:00:00
tags:
  - 前端排障
  - SSR
categories:
  - 前端排障
description: "只在生产首屏出现的 hydration mismatch，最终来自服务器 UTC、浏览器时区和两次不同的 Date.now。"
cover: /img/covers/frontend-debug-ssr-hydration-mismatch.svg
top_img: /img/covers/frontend-debug-ssr-hydration-mismatch.svg
toc: true
---
这次水合错误只在生产首屏出现，客户端路由跳转完全正常。页面上的“活动剩余时间”先显示 8 小时，闪一下变成 0 小时，控制台提示服务器 HTML 与客户端不一致。开发机在同一时区，所以一直没复现。

最后发现服务器按 UTC 格式化，用户浏览器按本地时区格式化；两边还分别调用了一次 `Date.now()`。水合不是“把客户端重新渲染一次”这么简单，它要求客户端第一次 render 与服务器已经输出的内容一致，然后 React 才能把事件和状态接到现有 DOM 上。

## 页面在 React 接手前已经经历了三份形态

排查时我会把它们分开：

1. 服务器响应里的原始 HTML 字符串；
2. 浏览器解析/纠正后的 DOM；
3. React 首次客户端 render 期望的树。

即使 1 与 React 字符串看起来一样，非法标签嵌套也可能让浏览器在第 2 步修改结构。例如：

```jsx
function BadMarkup() {
  return (
    <p>
      说明文字
      <div>块级详情</div>
    </p>
  )
}
```

浏览器解析器会重排不合法的 `<p><div>` 结构，React 水合时看到的 DOM 已经不是服务器组件以为的树。先用 HTML validator/Elements 面板检查真实结构，不要只对比 View Source。

## 事故代码：两边使用了不同的“现在”

```jsx
function Countdown({ endsAt }) {
  const hours = Math.max(
    0,
    Math.ceil((new Date(endsAt).getTime() - Date.now()) / 3_600_000)
  )

  return <strong>剩余 {hours} 小时</strong>
}
```

服务器 render 和浏览器 hydration 有时间差，临界点可能跨小时；如果再用本地化格式化，时区/语言也会改变文本。正确方案不是给根元素加 suppress，而是把首屏快照固定。

服务端生成一致的参考时间：

```jsx
function Page() {
  const renderedAt = Date.now()
  return <Countdown endsAt={campaign.endsAt} renderedAt={renderedAt} />
}

function Countdown({ endsAt, renderedAt }) {
  const [now, setNow] = useState(renderedAt)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const hours = Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 3_600_000))
  return <strong>剩余 {hours} 小时</strong>
}
```

`renderedAt` 被序列化到页面，客户端首次使用同一值，水合后才开始本地计时。

## 浏览器能力不要在 render 分支里直接决定首屏结构

这段代码在服务器没有 window，客户端有 window，第一次输出必然不同：

```jsx
function ThemeLabel() {
  const dark = typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches

  return <span>{dark ? '深色' : '浅色'}</span>
}
```

如果主题可以由 Cookie 提供，服务器和客户端都读同一初始值最好；否则先渲染确定占位，水合后更新：

```jsx
function ThemeLabel() {
  const [theme, setTheme] = useState('unknown')

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(query.matches ? 'dark' : 'light')
  }, [])

  return <span>{theme === 'unknown' ? '跟随系统' : theme === 'dark' ? '深色' : '浅色'}</span>
}
```

这会在水合后多一次 render，但结构可预测。避免布局跳动可以预留尺寸或用 CSS media query 直接控制纯视觉主题。

## 数据快照不一致比随机数更难发现

服务器查询库存是 5，HTML 发出后库存变成 4；客户端 hydration 前又请求一次得到 4，就产生 mismatch。解决方案不是要求数据永远不变，而是让客户端首屏使用服务器同一快照，水合后再 revalidate。

```html
<script id="__PAGE_DATA__" type="application/json">
  {"productId":42,"stock":5,"version":"inventory-901"}
</script>
```

框架通常提供自己的序列化/数据传递机制，优先使用它，避免手拼 JSON 带来 XSS。缓存库也应 hydrate 服务器 query cache，而不是客户端第一次 render 就显示另一份 loading/data。

## 随机 key 会让问题升级为节点重建

```jsx
items.map(item => <Row key={Math.random()} item={item} />)
```

服务器与客户端 key 不同，会破坏身份；即使没立即报 hydration 文本错误，后续更新也会反复卸载组件。使用数据稳定 ID：

```jsx
items.map(item => <Row key={item.id} item={item} />)
```

没有 ID 时，先修数据模型；数组 index 只适合顺序和成员永不变化的静态列表。

## 我怎么抓到“水合前”的 DOM

React 很快就可能替换不匹配子树，Elements 面板看到的是事后结果。几种方法：

1. Network 中保存 Document response，拿到原始 HTML；
2. 禁用 JavaScript 重新加载，看浏览器解析后的 DOM；
3. 在入口 `hydrateRoot` 前打断点，复制 `document.documentElement.outerHTML`；
4. 使用 React 19 更详细的 hydration diff 找第一个分歧节点；
5. 固定时区、语言、Date/random 和接口 fixture 在 CI 复现。

```js
console.log({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  html: document.getElementById('root')?.innerHTML
})
```

线上日志不能上传完整页面个人数据，只记录必要环境和组件边界。

## `suppressHydrationWarning` 的使用范围要非常小

如果时间戳文本确实无法在两侧一致，可以在单个元素上抑制警告：

```jsx
<time suppressHydrationWarning>{clientFormattedTime}</time>
```

它通常只对一层生效，也不会修复事件绑定、结构和业务状态。给整个 `<main>` 加上以后“控制台干净”不等于水合正确。每个 suppress 都应有注释说明差异来源和为什么安全。

第三方编辑器/地图完全依赖浏览器时，可以使用框架提供的 client-only 动态加载边界，而不是让服务器伪造一棵完全不同的 DOM。

## 浏览器扩展也可能改 DOM，但不要先甩锅

密码管理器、翻译和广告扩展可能在 React 加载前插入属性或节点。若只发生在少量用户且 diff 指向扩展属性，可以在干净 profile 复现对比。但绝大多数 hydration 错误仍来自自己的不确定渲染。

先固定时间/数据、检查 HTML、缩小组件边界；证据指向扩展后再分类上报，不要把所有“本地复现不了”都归因于用户环境。

## CI 增加了一个控制台零容忍用例

```ts
test('product page hydrates without warnings', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/products/42')
  await page.getByRole('button', { name: '加入购物车' }).click()

  expect(errors.filter(text => /hydration/i.test(text))).toEqual([])
})
```

测试服务器固定时区与数据，再加一组不同时区浏览器。既验证没有 warning，也点击关键按钮确认事件真正接上。

## 最后的分流顺序

- 文本不同：时间、随机数、本地化、数据快照；
- 结构不同：非法 HTML、条件分支、第三方 DOM 修改；
- 只在首屏：SSR 与首次 client render 输入不一致；
- 只在生产：缓存、时区、压缩/插件或环境变量差异；
- suppress 后仍异常：它从来没有修复结构和状态。

这次活动倒计时最终通过服务器时间快照修复，并补了跨时区水合测试。Hydration mismatch 不是无关紧要的开发 warning，它意味着 React 不能确信现有 DOM 与组件树一致，可能重建子树、丢状态或绑定错误。找到两边第一次 render 的第一个不同输入，问题通常就能落到具体代码上。

## 资料

- [React：hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React 19：Hydration error diffs](https://react.dev/blog/2024/12/05/react-19#diffs-for-hydration-errors)
- [WHATWG：Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html)
