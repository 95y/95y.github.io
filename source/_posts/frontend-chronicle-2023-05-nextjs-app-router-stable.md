---
title: "Next.js 13.4：App Router 稳定后的缓存与边界课题"
date: 2023-05-04 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2023
categories:
  - 前端年鉴
description: "App Router 稳定后迁一个真实商品分类页，重点不是目录，而是客户端边界、缓存失效与生产验收指标。"
cover: /img/covers/frontend-chronicle-nextjs-app-router-stable.svg
top_img: /img/covers/frontend-chronicle-nextjs-app-router-stable.svg
toc: true
---
Next.js 13.4 把 App Router 标记为 stable 后，我们才把它放进正式生产路线。stable 的含义不是“所有生态问题已经消失”，而是核心路由能力可以开始承担生产流量。Server Actions 当时仍是 alpha，所以我们没有把试验性写入接口作为迁移前提。

第一个生产路由是商品分类页。它有 SEO、分页、筛选和 CMS 推荐位，读多写少，适合发挥 Server Component 与 Streaming；购物车和结算仍留在 Pages Router。渐进迁移让团队可以观察真实缓存和运行成本，而不是一次性把所有风险叠起来。

## 先定义验收指标，再搬目录

迁移前保存基线：

- 首屏 HTML 是否包含核心商品内容；
- 页面客户端 JavaScript 体积；
- TTFB、LCP 与交互响应；
- CMS 更新到线上可见的最长时间；
- 登录价格、地区库存是否可能被公共缓存；
- 404、慢接口、部分接口失败时的页面表现。

如果只以“URL 能打开”为完成标准，最容易漏掉的是数据新鲜度和跨用户缓存。

## 默认服务器组件，交互从叶子开始

分类页在服务器读取数据：

```tsx
// app/category/[slug]/page.tsx
export default async function CategoryPage({ params, searchParams }) {
  const filters = parseFilters(searchParams)
  const category = await getCategory(params.slug)
  const products = await getProducts({ category: params.slug, ...filters })

  return (
    <CategoryLayout category={category}>
      <FilterBar initialFilters={filters} />
      <ProductGrid products={products} />
    </CategoryLayout>
  )
}
```

筛选控件需要读取 URL、处理点击，成为 Client Component；商品卡片如果只是链接与图片，可以继续留在服务器输出。我们用构建分析检查客户端边界，避免一个顶层 `use client` 把整个商品树带进 bundle。

## 缓存不是一个开关，而是几段生命周期

初学 App Router 时，很容易把“fetch 缓存”“请求内去重”“路由导航缓存”混成同一件事。排查旧数据要先问它存在哪一层、由谁失效。

同一次服务器渲染中，多处读取同一数据可能被记忆化/复用；跨请求的数据缓存可以保留结果；客户端导航还可能保留已访问的路由数据。不同 Next 版本的默认行为会变化，因此我们不背一句固定结论，而是把每个数据源的需求写进封装。

```ts
export async function getCategory(slug: string) {
  const response = await fetch(`${CMS_URL}/categories/${slug}`, {
    next: {
      revalidate: 300,
      tags: [`category:${slug}`]
    }
  })

  if (!response.ok) throw new Error(`CMS ${response.status}`)
  return response.json()
}
```

CMS webhook 在发布后触发对应 tag 失效。带登录用户价格的请求则不进入共享公共缓存，用户身份也不作为隐式全局变量在缓存函数中读取。

## 缓存故障不会报错，所以要写行为测试

一次测试环境事故中，运营修改分类标题，接口返回新值，页面仍显示旧标题。没有 500，也没有控制台错误。最后发现 webhook 失效了文章 tag，没有失效分类 tag。

我们补了一条端到端流程：

```text
发布分类标题 V1 -> 首次访问看到 V1
CMS 修改为 V2 -> 触发 webhook
新会话访问 -> 在 SLA 时间内看到 V2
已有客户端导航返回 -> 不得永久停留 V1
```

缓存正确性必须从写入/发布一路测试到用户可见结果。单测 `revalidateTag()` 被调用，只证明函数执行了，不能证明所有缓存层都更新。

## error/loading 边界按业务可恢复范围划分

商品列表失败可以显示重试，分类不存在应该走 notFound，推荐位失败可以直接隐藏。我们没有让根 `error.tsx` 接住所有故障。

```tsx
'use client'

export default function CategoryError({ reset }) {
  return (
    <section role="alert">
      <h2>商品列表暂时加载失败</h2>
      <button onClick={() => reset()}>重新加载</button>
    </section>
  )
}
```

错误边界提供恢复 UI，服务器日志仍记录 trace ID。给用户显示一个可联系的错误编号，比直接输出数据库堆栈安全。

## Server Actions alpha 没有被用来赶进度

13.4 同时提供 Server Actions alpha。它能把 mutation 与缓存失效放在同一服务端函数中，方向很吸引人：

```ts
'use server'

export async function renameCategory(formData: FormData) {
  const user = await requireAdmin()
  const input = parseRenameInput(formData)
  await categoryService.rename(user, input)
  revalidateTag(`category:${input.slug}`)
}
```

但当时 alpha 意味着 API 和部署要求仍可能变化。核心商品页继续使用成熟 API 路由，内部工具才做受控实验。技术选型里“晚一点用”不等于拒绝创新，而是把试验风险放在合适业务范围。

无论 Server Action 还是 API 路由，服务端入口都要鉴权、校验、限制频率并记录审计。函数写在组件旁边不会让浏览器输入变可信。

## 第三方组件经常决定 use client 的位置

一些旧组件在模块顶层读取 `window`，导入服务器组件就报错。短期可以包客户端适配层：

```tsx
'use client'

import LegacyCarousel from 'legacy-carousel'

export function CarouselClient(props) {
  return <LegacyCarousel {...props} />
}
```

但如果一个轮播库让半页变客户端，应该评估替换。迁移清单不能只有代码目录，还要包含组件库对 RSC 的兼容程度。

## 生产后我们看到了什么

核心内容进入首屏 HTML，分类页客户端 JS 下降；慢 CMS 时 Streaming 让布局和骨架更早出现。与此同时，团队花了更多时间理解缓存与服务端日志，部署平台的 CPU/响应时间也进入前端指标。

Pages Router 并没有立即删除。支付、复杂编辑器和依赖旧 context 的页面继续稳定运行，后续只在需求触及它们时迁移。官方也明确支持渐进采用，这让迁移不必成为一场停摆式重写。

## stable 是开始承担责任，不是停止学习

Next 13.4 的 App Router stable 给了生产采用信号，但新架构把更多事情交给框架后，团队必须理解服务器/客户端模块、缓存新鲜度、序列化和运行时。配置少了，不等于决策少了。

我们最终把每条路由当成一个可独立验收的迁移单元：测 HTML、JS、数据更新、错误恢复和平台成本。这样即便后续版本调整默认缓存行为，业务需求仍然有明确测试保护。

## 资料

- [Next.js 13.4 发布说明](https://nextjs.org/blog/next-13-4)
- [Next.js：Caching](https://nextjs.org/docs/app/guides/caching)
- [Next.js：Incremental Adoption](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
