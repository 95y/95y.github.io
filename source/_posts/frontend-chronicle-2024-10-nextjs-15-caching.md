---
title: "Next.js 15：缓存默认值调整与 Turbopack Dev 稳定"
date: 2024-10-21 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2024
categories:
  - 前端年鉴
description: "Next.js 15 缓存默认值调整后，先为文章、库存和用户资料定义新鲜度，再迁 GET Handler 与客户端导航。"
cover: /img/covers/frontend-chronicle-nextjs-15-caching.svg
top_img: /img/covers/frontend-chronicle-nextjs-15-caching.svg
toc: true
---
Next.js 15 升级最危险的部分不是编译报错，而是页面仍然能打开、数据新鲜度却悄悄改变。缓存默认值调整后，一些依赖旧行为的 GET Route Handler 和客户端导航会更频繁请求；另一些团队则反而庆幸，不再因为“默认缓存”看到旧列表。

我们把这次升级当成缓存需求审计，而不是把所有路由统一改回旧默认。每条数据先回答允许多旧、谁触发更新、能否跨用户共享，再写配置。

## 先做一张数据新鲜度表

| 数据 | 可接受陈旧 | 共享范围 | 更新方式 |
| --- | ---: | --- | --- |
| 博客文章 | 5 分钟 | 所有人 | CMS webhook/tag |
| 商品库存 | 10 秒内 | 按地区 | 下单后主动刷新 |
| 用户资料 | 请求级 | 单用户 | 保存后立即可见 |
| 导航分类 | 1 小时 | 所有人 | 后台发布失效 |

这张表比“都用 force-dynamic”或“都缓存 60 秒”更有用。性能和正确性不是二选一，缓存策略必须对应业务容忍度。

## GET Route Handler 不再默认替我们决定缓存

一个公开分类接口：

```ts
// app/api/categories/route.ts
export async function GET() {
  const categories = await categoryService.list()
  return Response.json(categories)
}
```

Next.js 15 中 GET Route Handler 默认不缓存。若分类数据明确可以静态缓存，就显式选择：

```ts
export const dynamic = 'force-static'

export async function GET() {
  return Response.json(await categoryService.list())
}
```

具体缓存 API 会继续演进，代码应跟随项目版本官方文档。这里真正的改变是“是否缓存”不再靠团队成员猜默认；公开数据显式 opt-in，用户数据保持动态。

## 客户端返回页面后，为什么请求又发生了

Next 15 调整了 Client Router Cache 的 page segment 默认 stale time。正常导航重新进入页面时更倾向拿到最新服务器结果；共享 layout、前进后退恢复和 loading 缓存仍有各自行为。

升级后产品同事反馈“返回列表时滚动位置与数据变了”。这不是单纯性能回退：此前用户从详情返回能立刻看到旧列表，现在可能重新请求并应用新排序。我们根据产品需求决定：浏览历史应恢复位置，库存应刷新，筛选参数保持在 URL。

端到端测试覆盖：

```text
列表 -> 滚动 -> 详情 -> 浏览器返回
列表 -> 新增记录 -> 回到列表
列表 -> 后台修改库存 -> 客户端导航回来
```

缓存行为必须放在用户导航序列中验证，单独请求某个 URL 看不出客户端 router 层。

## 异步 Request API 不能只靠 codemod 后不读代码

`cookies()`、`headers()`、`draftMode()` 以及 page 的 params/searchParams 向异步 API 迁移。示意：

```ts
import { cookies } from 'next/headers'

export default async function AccountPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  const account = await getAccount(session?.value)

  return <AccountView account={account} />
}
```

官方 codemod 可以完成大量机械修改，但我们逐个检查调用链：被改成 async 后是否影响缓存/静态判定，函数消费者是否正确 await，测试 mock 是否仍返回同步对象。自动转换是起点，不是行为证明。

## 写入和失效必须在同一个业务流程闭合

```ts
'use server'

import { revalidateTag } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const user = await requireUser()
  const input = parseProfile(formData)

  await profileService.update(user.id, input)
  revalidateTag(`profile:${user.id}`)

  return { ok: true }
}
```

这里最重要的两行不是 revalidate，而是鉴权与输入解析。Server Action 是可以由客户端触发的服务器入口，仍要像 API 一样对待。缓存 tag 还要包含正确作用域，不能失效或复用到其他用户。

我们测试“保存返回成功后当前页面与重新导航都看到新值”，避免写入成功、缓存仍旧造成假失败。

## Turbopack Dev stable 用影子命令验证

Next.js 15 将 Turbopack 开发模式标记稳定。项目有自定义 webpack 配置，所以没有直接替换日常命令，而是让 CI/开发者并行运行一段时间：

```bash
npm run dev:webpack
npm run dev:turbo
```

比较路由首次编译、Fast Refresh、CSS、SVG、Sentry 和自定义 loader。Turbopack 内置能力不需要照搬 webpack loader，但项目若使用特别转换，就要找等价支持或保留 webpack。

开发模式 stable 不等于当时生产 build 的所有路径也同样 stable，不能把两个阶段混为一谈。

## instrumentation 进入稳定路径后补了请求观测

框架缓存与服务器组件让一部分“前端慢”发生在服务器。我们利用 instrumentation 接入 trace/错误平台，记录 route、fetch 下游耗时和缓存相关标签（避免高基数/敏感值）。

没有服务器观测时，用户只看到 loading，前端 Network 里只有一个框架请求，很难知道是 CMS、数据库还是渲染慢。

## 升级后的性能变化怎样解释

不缓存默认能提高新鲜度，也可能增加后端流量和 TTFB。我们上线时同时看：

- GET Route Handler 请求量与缓存命中；
- 下游 CMS/数据库 QPS；
- 服务器 p95 与错误率；
- 客户端导航等待；
- 用户保存后看到新数据的成功率。

某个公开字典接口流量上涨后，我们依据表中“一小时可陈旧”显式缓存，而不是整站恢复旧默认。另一个账户接口保持动态，接受少量性能成本换取正确隔离。

## 缓存默认值变化教会我的事

框架默认值会根据生态反馈调整，业务的新鲜度契约却不应该跟版本漂移。Next 15 把不少缓存行为推向更显式的选择，迁移时最重要的是建立数据清单和端到端更新测试。

以后再升级缓存模型，我们不需要从“这个版本默认是什么”开始争论，而是拿出每条数据的陈旧上限、共享范围与失效来源，再映射到新 API。这才是能跨版本保留的工程资产。

## 资料

- [Next.js 15 发布说明](https://nextjs.org/blog/next-15)
- [Next.js：Caching](https://nextjs.org/docs/app/guides/caching)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
