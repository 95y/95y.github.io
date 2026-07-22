---
title: "Next.js 13：App Router 与 Server Components 落地"
date: 2022-10-25 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2022
categories:
  - 前端年鉴
description: "没有迁首页，而是用帮助中心试跑 Next 13 App Router：布局、Server Component、loading 边界和缓存如何落地。"
cover: /img/covers/frontend-chronicle-nextjs-13-app-router.svg
top_img: /img/covers/frontend-chronicle-nextjs-13-app-router.svg
toc: true
---
Next.js 13 发布 `app` 目录时，它还是 beta。我们没有把现有 Pages Router 主站整体搬过去，而是选了一个只读的“帮助中心”做实验：有分类布局、文章详情、搜索框和登录用户的收藏按钮。它刚好能覆盖布局、服务器数据、流式 loading 和一小块客户端交互。

这次试迁最大的认知变化，是组件不再默认等于客户端 JavaScript。页面与 layout 默认可以是 Server Component，只有需要 state、事件或浏览器 API 的叶子才声明 `use client`。

## 文件结构先表达页面边界

```text
app/
  help/
    layout.tsx
    loading.tsx
    error.tsx
    page.tsx
    [slug]/
      page.tsx
      FavoriteButton.tsx
```

共享布局可以读取分类并包裹子页面：

```tsx
// app/help/layout.tsx
export default async function HelpLayout({ children }) {
  const categories = await getHelpCategories()

  return (
    <div className="help-layout">
      <HelpSidebar categories={categories} />
      <main>{children}</main>
    </div>
  )
}
```

布局在路由间保持，避免 Pages Router 中用 `_app` 和条件判断拼不同壳。嵌套目录直接对应 UI 层级，代价是团队必须理解每个 segment 的 loading/error/not-found 范围。

## 数据读取直接发生在服务器页面

文章页可以是 async 组件：

```tsx
// app/help/[slug]/page.tsx
import { notFound } from 'next/navigation'

export default async function HelpArticle({ params }) {
  const article = await getArticle(params.slug)
  if (!article) notFound()

  return (
    <article>
      <h1>{article.title}</h1>
      <ArticleBody html={article.html} />
      <FavoriteButton articleId={article.id} />
    </article>
  )
}
```

数据库客户端和 Markdown 解析器可以留在服务器模块里，不进入浏览器包。传给客户端组件的 props 则要可序列化，并且只包含它真正需要的数据。不要把完整数据库对象连内部字段一起传下去。

## `use client` 放高一层，客户端边界就跟着扩大

收藏按钮需要 state 和 click：

```tsx
'use client'

import { useState } from 'react'

export function FavoriteButton({ articleId }) {
  const [saved, setSaved] = useState(false)

  async function toggle() {
    const next = !saved
    setSaved(next)
    await fetch(`/api/favorites/${articleId}`, {
      method: next ? 'PUT' : 'DELETE'
    })
  }

  return <button onClick={toggle}>{saved ? '已收藏' : '收藏'}</button>
}
```

如果为了这个按钮在 `layout.tsx` 顶部写 `use client`，布局导入的导航、分类和大部分子树都会进入客户端边界。我们把交互组件尽量下沉，把服务器渲染的内容作为 children 组合，而不是把整页变回 SPA。

客户端组件仍可以接收 Server Component 输出作为 children；边界不是“客户端组件下面全都必须客户端”，关键看模块导入关系与框架组合方式。

## loading.tsx 不是全局 Spinner

在 help segment 放 `loading.tsx` 后，框架会用 Suspense/Streaming 在内容准备期间提供 fallback：

```tsx
export default function LoadingHelp() {
  return (
    <div aria-busy="true" className="article-skeleton">
      <div className="line title" />
      <div className="line" />
      <div className="line" />
    </div>
  )
}
```

骨架应该尽量保持最终布局，避免大幅位移。嵌套边界还能让侧栏先显示、文章内容稍后流式到达。我们用慢接口测试，不只在本地秒开环境看一眼。

`error.tsx` 必须是 Client Component，因为它需要错误交互与 reset。它负责当前路由段的恢复，但日志上报仍要脱敏，不能把服务器错误细节直接展示给用户。

## 缓存比目录结构更容易让人误判

Next 13 初期的数据缓存语义仍在演进。我们没有把“默认行为”当永恒规则，而是为每类数据写需求：帮助文章可缓存多久，登录收藏必须多新，预览草稿绝不能被公共缓存。

```ts
async function getArticle(slug: string) {
  const response = await fetch(`${CMS_URL}/articles/${slug}`, {
    next: { revalidate: 300 }
  })

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`CMS ${response.status}`)
  return response.json()
}
```

代码示例只代表当时可用的思路，框架缓存默认值在后续大版本继续调整。真正稳妥的是把新鲜度当业务需求测试：CMS 修改文章后，多少时间/哪个失效动作必须让用户看到新内容。

## 搜索页暴露了 URL 与客户端状态的选择

搜索关键字应该出现在 URL，便于分享和前进后退。页面服务器读取 search params，交互输入在客户端更新路由。我们避免把搜索结果同时保存到全局 store，减少两份来源。

如果输入每次按键都导航，请求会很多；客户端做轻量 debounce，并让旧请求/导航失效。App Router 不会自动替产品决定防抖、空状态和错误恢复。

## Turbopack alpha 只用来试，不作为生产承诺

Next 13 同时带来 Turbopack alpha。我们在实验分支测冷启动与 HMR，但项目有自定义 webpack 插件，功能并不完全对等，因此没有把 alpha 工具写进正式开发流程。

性能数字必须在自己的模块图、插件和机器上测；alpha 更重要的任务是发现不兼容并反馈，而不是为了发布会数字替换稳定链路。

## Pages 与 App 可以共存，这让迁移变得现实

我们只迁 `/help`，登录、支付与后台仍在 `pages`。需要注意两个 router 之间不能共享所有布局状态，跨边界导航也要真实测试。但逐路由迁移让回滚简单：实验路由不稳时，不影响核心交易。

验收包含：

- 直接访问和客户端跳转输出是否一致；
- 页面 JS 体积是否因 `use client` 放置不当增加；
- 慢 CMS 下 layout/loading 顺序是否合理；
- 404/error 边界是否工作；
- 登录收藏是否泄露跨用户缓存；
- CMS 更新后的可见时间是否符合要求；
- 生产 Node/边缘运行时是否支持依赖 API。

## 这次试迁的结论

App Router 的价值不只是一套新目录。它把 Server Components、布局、Streaming 和数据生命周期放进路由模型，让“代码在哪执行、多少 JS 发给浏览器”成为组件级决策。

2022 年它仍处在 beta，我们选择小而真实的路由学习，而不是把实验性当成落后/先进的标签。最终帮助中心保留了下来，也让团队为后续稳定版积累了缓存和边界经验。面对这种架构升级，最好的第一步往往不是迁首页，而是选一个能独立验收、失败可回滚、又包含真实交互的路由。

## 资料

- [Next.js 13 发布说明](https://nextjs.org/blog/next-13)
- [Next.js：Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
