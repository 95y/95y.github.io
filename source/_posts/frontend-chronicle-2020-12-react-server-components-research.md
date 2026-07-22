---
title: "React Server Components：组件边界延伸到服务器"
date: 2020-12-21 09:00:00
tags:
  - 前端年鉴
  - React
  - 2020
categories:
  - 前端年鉴
description: "Server Components 不是另一种 SSR：用产品详情页区分 CSR、SSR 与 RSC，解释客户端边界、数据安全与序列化。"
cover: /img/covers/frontend-chronicle-react-server-components-research.svg
top_img: /img/covers/frontend-chronicle-react-server-components-research.svg
toc: true
---
2020 年底第一次看 React Server Components 演示时，我把它误解成“另一种 SSR”。两者都在服务器做事，但解决的问题并不相同：SSR 主要把组件首次渲染成 HTML，Server Components 则让一部分组件长期只在服务器执行，并把结果以 React 能继续组合的形式交给客户端。

当时它还是研究预览，不适合拿来重写生产项目。它的价值在于提出了一个很有冲击力的问题：既然某些组件只负责读取数据库和拼装内容，为什么必须把它们的代码、依赖和数据获取逻辑全部发到浏览器？

## 用一个产品详情页区分三件事

假设页面包含商品信息、评论和“加入购物车”按钮。

传统纯客户端渲染大致会发送应用 JavaScript，浏览器执行后再请求数据：

```jsx
function ProductPage({ id }) {
  const [product, setProduct] = useState(null)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(response => response.json())
      .then(setProduct)
  }, [id])

  if (!product) return <Skeleton />
  return <ProductView product={product} />
}
```

SSR 可以在服务器首次执行相似组件并返回 HTML，让用户更早看到内容；随后浏览器下载对应 JavaScript 并水合，组件成为可交互应用。

Server Component 的设想是：读取产品信息的组件只留在服务器，它的实现与数据库依赖不进入客户端 bundle；真正需要状态、事件和浏览器 API 的购物车按钮成为 Client Component。

```jsx
// 概念示意，具体语法应以所用框架版本为准
async function ProductPage({ id }) {
  const product = await db.product.findById(id)

  return (
    <article>
      <ProductDescription product={product} />
      <AddToCartButton productId={product.id} />
    </article>
  )
}
```

服务器组件的输出不是简单 HTML 字符串结束，而是能与客户端组件引用组合、逐步传输的描述。这样页面树可以跨越服务器和浏览器边界。

## “零客户端 JS”只属于服务器那一侧

Server Component 自身代码不发到浏览器，但页面只要有交互，Client Component 及其依赖仍会进入客户端。边界放在哪里直接决定多少 JavaScript 被发送。

如果把整个页面标成客户端组件，只为了一个按钮使用 `useState`，它导入的子树可能一起进入客户端边界。反过来，把静态内容与数据读取留在服务器，只把交互叶子下沉为客户端组件，才能保留收益。

这不是追求“一个 use client 都没有”。编辑器、地图、拖拽等功能本来就需要浏览器。好的边界是让每段代码运行在真正需要它的环境。

## 数据访问离组件更近，安全边界也必须更清楚

服务器组件可以接触数据库、文件和内部服务，这很方便，但不能把“服务器执行”误认为“自动安全”。组件接收的路由参数、Cookie 与客户端输入仍然不可信，查询前要做鉴权和校验。

```ts
async function AccountOrders({ accountId, viewer }) {
  if (!viewer) throw new Error('Unauthenticated')
  if (viewer.accountId !== accountId) throw new Error('Forbidden')

  const orders = await orderRepository.findByAccount(accountId)
  return <OrderList orders={orders} />
}
```

更重要的是只把可安全序列化的数据传给客户端组件。数据库实体可能带内部成本价、权限字段或 token，不能因为 JSX props 写起来方便就整个传下去。

## 包体积收益来自依赖留在服务器

演示中很吸引人的部分，是服务器组件可以使用 Markdown 解析、日期处理等较大依赖，而这些实现不会成为客户端 JavaScript。假设文章页在服务器把 Markdown 转成 React 节点，浏览器只接收结果和需要交互的部分。

不过“依赖不进客户端”不等于没有成本。它仍占用服务器计算、内存和部署体积，还涉及缓存与流式传输。性能评估要看整体：服务器响应时间、传输内容、客户端 JS 和交互时间，而不是只看 bundle 少了多少。

## 与 SSR 组合，而不是互相替代

一个常见误区是问“用了 RSC 还要不要 SSR”。在框架实现中，服务器组件树仍可以参与服务端生成初始 HTML，客户端组件再水合。RSC 决定组件代码与数据在哪一侧执行/传输，SSR 决定首屏 HTML 如何产生，两者可以组合。

另一个误区是把 RSC 当成 API 路由的简单替代。组件协议需要打包器识别模块边界、框架处理缓存/导航/流和序列化。官方最初就强调它需要与框架深度集成。业务团队自己拼一套协议，维护成本远高于写一个 fetch。

## 2020 年我会怎样对待这项研究

当时最合理的动作不是生产落地，而是调整组件边界意识：

1. 不让纯展示组件偷偷依赖 window 或全局可变状态；
2. 把浏览器交互收敛到较小区域；
3. 数据访问函数明确权限与序列化边界；
4. 避免在应用各处重复同一数据请求；
5. 等成熟框架提供完整实现、升级与部署方案。

这些准备即使后来不使用 RSC，也能让 SSR、测试和代码分割更清楚。

## 回头看，真正改变的是组件的地理边界

过去“React 组件”几乎默认意味着会在浏览器运行，服务端更多是模板或 API。Server Components 把组件模型延伸到服务器，让数据获取、模块图和渲染边界被同一套框架理解。

它同时增加了需要学习的新问题：哪些 props 可序列化、缓存何时失效、客户端边界怎样扩散、服务器入口如何鉴权。减少客户端 JavaScript的收益是真的，复杂度也没有消失，只是从手写 API 与 hydration 转移到框架管理的跨环境模型中。

## 资料

- [React Server Components 研究预览](https://legacy.reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html)
- [React：Server Components](https://react.dev/reference/rsc/server-components)
