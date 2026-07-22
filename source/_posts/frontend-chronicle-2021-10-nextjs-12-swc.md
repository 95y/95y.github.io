---
title: "Next.js 12：SWC、Middleware 与边缘运行时方向"
date: 2021-10-26 09:00:00
tags:
  - 前端年鉴
  - Next.js
  - 2021
categories:
  - 前端年鉴
description: "Next.js 12 升级没有停在 SWC 跑分：移除自定义 Babel 插件、约束 Middleware，并验证容器输出追踪。"
cover: /img/covers/frontend-chronicle-nextjs-12-swc.svg
top_img: /img/covers/frontend-chronicle-nextjs-12-swc.svg
toc: true
---
Next.js 12 宣布用 Rust 编写的 SWC 接手默认转译与压缩工作时，我们最关心的是两个数字：`next dev` 首次可用时间，以及 CI 中 `next build` 的耗时。实测确实有改善，但升级没有停在跑分，因为项目里藏着一个自定义 Babel 插件，会在编译时给埋点函数补页面标识。

只要 `.babelrc` 存在，框架可能回退到 Babel 路径，团队就会出现“别人都说 SWC 快，我们为什么没变化”的困惑。那次迁移最后变成了一个很好的工具链审计：哪些转换仍然必要，哪些已经被框架内置，哪些不该继续依赖 AST 魔法。

## 先确认项目到底有没有走 SWC

旧 `.babelrc`：

```json
{
  "presets": ["next/babel"],
  "plugins": [
    ["./build/babel-plugin-page-track", { "project": "console" }]
  ]
}
```

这个插件会把：

```js
track('open')
```

变成带页面信息的调用。它方便，但也让每个源码文件的转换依赖内部插件。我们先统计插件真正覆盖的调用点，发现只有二十多个，最终改成显式封装：

```ts
export function trackPageEvent(
  page: string,
  event: string,
  payload: Record<string, unknown> = {}
) {
  analytics.track(event, { page, ...payload })
}
```

移除 `.babelrc` 后，构建才完整走默认 SWC 路径。显式代码多写了一个参数，却更容易搜索、测试和迁移。

## 跑分要固定条件，否则数字没有意义

我们分别记录：

- 删除 `.next` 后的冷启动；
- 已有缓存时修改叶子组件的 Fast Refresh；
- 相同 Node 与依赖下的生产构建；
- CI 全新安装后的端到端总耗时。

只挑一次最快结果没有价值。开发机后台进程、文件系统缓存和 CI CPU 都会影响数字。更重要的是行为回归：JSX 转换、styled-jsx、source map、测试覆盖率和生产错误堆栈都要验证。

SWC 的优势不只来自“Rust 比 JavaScript 快”，还来自框架能为自己的约定做端到端整合。越多自定义 Babel 插件，越难享受这条优化路径。

## Middleware 最初吸引人，也最容易被塞满逻辑

Next.js 12 的 Middleware 能在请求完成路由渲染前运行。多语言重写、A/B 分流和轻量鉴权判断都很适合：

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const login = new URL('/login', request.url)
    login.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}
```

这段代码只做早期跳转，真正的权限校验仍需在服务端数据/API 层执行。Cookie 存在不代表有效，更不代表用户有权读取某条数据。Middleware 是用户体验和路由边界，不是唯一安全边界。

我们一度想在里面查数据库、拼导航和刷新 token，后来放弃。边缘运行时的 API、连接方式和执行成本不同于完整 Node 服务；每个请求都经过的代码应该短、可预测并能失败降级。

## ES Module 优先暴露了几个老包问题

Next.js 12 对 ESM 的支持进一步推进。某个内部包的 `module` 入口与 `main` 入口导出不一致，升级后解析到 ESM，页面出现默认导入 undefined。修复不是强制 alias 回 CJS，而是统一包的公开导出并增加两种消费测试。

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

框架升级像一盏更亮的灯，常常照出内部包早已存在但没被触发的契约差异。

## 输出文件追踪让容器不必带完整仓库

Next.js 12 会追踪每个页面/API 路由运行所需文件，为部署工具生成依赖信息。对于容器部署，这意味着可以基于实际依赖制作更小的运行镜像，而不是把整个 monorepo 和所有开发依赖复制进去。

我们对生成镜像做了三类冒烟：访问静态页面、请求 SSR 页面、调用需要模板/字体等非 JS 文件的 API。文件追踪能处理模块依赖，但代码运行时通过动态字符串读取的资源，仍可能需要显式包含。

```js
const template = await fs.readFile(
  path.join(process.cwd(), 'templates', 'invoice.html'),
  'utf8'
)
```

这种资源不一定出现在静态 import 图中，部署后才报 ENOENT 会很难看，所以必须在接近生产的镜像里验证。

## 升级清单不是只看页面能否打开

我们最终的回归范围包括：

1. 删除自定义 Babel 后，埋点、宏和测试转换是否等价；
2. production source map 能否正确还原到源码；
3. Middleware 的 matcher 是否误伤静态资源和 API；
4. ESM/CJS 内部包在 dev、build、test 中是否一致；
5. standalone/追踪产物是否包含运行时读取的文件；
6. 冷启动、热更新与 CI 构建的基线有没有真实改善。

## 我对 Next.js 12 的印象

这一版是 Next.js 从“集成 React 的框架”继续走向“深度掌管编译和运行时”的节点。SWC 把性能优化下沉到框架基础设施，Middleware 把框架触角伸到请求入口，输出追踪则连接到部署。

收益越完整，自定义逃生舱就越需要审视。保留 Babel 当然可以，但要接受性能路径和兼容成本；Middleware 当然能写复杂逻辑，但要承担每次请求的运行风险。框架默认越来越强时，最好的升级方式往往是删掉不再必要的定制，同时把真正的业务规则显式留下。

## 资料

- [Next.js 12 发布说明](https://nextjs.org/blog/next-12)
- [Next.js：Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
