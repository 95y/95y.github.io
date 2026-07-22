---
title: "Bun 1.0：运行时、包管理器与构建工具走向一体化"
date: 2023-09-08 09:00:00
tags:
  - 前端年鉴
  - Bun
  - 2023
categories:
  - 前端年鉴
description: "Bun 1.0 试用报告：安装、测试与小服务很顺，原生模块、lockfile、代理和生产观测为什么仍需逐项验证。"
cover: /img/covers/frontend-chronicle-bun-1-runtime-toolkit.svg
top_img: /img/covers/frontend-chronicle-bun-1-runtime-toolkit.svg
toc: true
---
Bun 1.0 发布后，我给自己定了一个很具体的试用范围：不改线上 Node 服务，先让它安装一个前端仓库、跑单元测试，再执行两个内部脚本。这样既能测到 package manager、runtime 和 test runner，又不会因为“启动快”就跳过生产兼容性。

结论不是简单的“能替代”或“不能替代”。安装与脚本启动确实快，很多 Web/Node API 可以直接运行；但测试 mock、原生 addon、lockfile 流程和公司代理都需要逐项验证。一体化工具减少了组合数量，也把更多职责集中到同一次升级里。

## 先用现有 package.json，不重写项目

```json
{
  "scripts": {
    "lint": "eslint src",
    "test": "vitest run",
    "build": "vite build",
    "check-links": "node scripts/check-links.mjs"
  }
}
```

第一步只是运行：

```bash
bun install
bun run lint
bun run build
bun scripts/check-links.mjs
```

不要为了让试验漂亮而先改掉所有失败依赖。记录哪些命令不改即可运行、哪些需要适配、哪些有行为差异，这才是兼容性报告。

安装速度之外，我们检查 lockfile 是否稳定、peer dependency 警告、私有 registry、postinstall 和补丁工具。CI 需要可复现安装，不是开发机第二次有缓存时最快。

## 内置测试器从一个纯函数开始

```ts
// price.ts
export function applyDiscount(price: number, rate: number) {
  if (price < 0) throw new Error('price must be positive')
  if (rate < 0 || rate > 1) throw new Error('invalid rate')
  return Math.round(price * (1 - rate) * 100) / 100
}
```

```ts
import { describe, expect, test } from 'bun:test'
import { applyDiscount } from './price'

describe('applyDiscount', () => {
  test('keeps currency precision', () => {
    expect(applyDiscount(19.9, 0.1)).toBe(17.91)
  })
})
```

这类测试迁移很顺。真正困难的是项目里大量依赖 Jest/Vitest 特定 mock、fake timer、jsdom 和 transform 插件的用例。API 名称相似不代表边缘行为完全一致。

我们抽取 50 条代表性测试：纯函数、React/Vue 组件、网络 mock、定时器、snapshot、动态 import、覆盖率。逐条对比结果与耗时，而不是让 2000 条测试第一次全量失败后靠搜索替换。

## Node 兼容要按项目实际 API 测

Bun 以 Node.js 兼容为重要目标，但“兼容 Node”范围很大。我们的脚本用到：

- `node:fs/promises` 与 glob；
- 子进程和退出码；
- TLS/企业代理；
- 一个含原生二进制的图片处理包；
- ESM/CJS 混合内部包；
- `process` 信号和优雅退出。

文件和普通 HTTP 测试通过，某个原生模块安装脚本与预编译二进制选择出现差异。于是生产服务被明确列为“暂不迁移”，图片脚本保留 Node。这比全局切换 runtime 后线上才发现好得多。

## 一个小 HTTP 服务能说明体验，不能证明生产可用

```ts
const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return Response.json({ ok: true })
    }

    return new Response('Not found', { status: 404 })
  }
})

console.log(`Listening on ${server.url}`)
```

几行代码就能启动服务，很适合原型。但生产评估还要覆盖：请求上限、超时、body 大小、TLS、日志、metrics/trace、优雅退出、容器信号、内存曲线和故障恢复。Hello World 的 QPS 不能代替业务负载。

我们用真实 JSON payload 和下游 mock 做短时压测，关注 p95、错误率与内存，而不是只截取最高吞吐。运行时差异往往在压力、取消和异常路径下出现。

## 一体化最舒服，也意味着升级半径更大

传统栈可能分别升级 Node、npm、Vitest 和 bundler。Bun 把 runtime、package manager、test 和 bundler放进一个版本，默认配合更顺，版本变更也可能同时触及多条链。

因此我们没有让 `bun upgrade` 随开发者个人执行，而是在分支中固定版本，跑：

```text
全新安装 -> lint -> 单测 -> 生产构建 -> E2E -> 脚本冒烟
```

失败时记录属于安装、运行时、测试还是打包。工具是一体的，诊断仍要分层。

## lockfile 与双包管理器不能长期并存

试验阶段保留 npm lockfile 作为基线可以理解，正式采用后不能让团队有人 npm install、有人 bun install，两份 lockfile 轮流修改。依赖解析结果可能不同，CI 也失去唯一来源。

我们的仓库在试验分支使用 Bun lockfile，主分支仍保持 npm。只有评审决定采用后才会一次性切换，并删除旧 lockfile、更新贡献文档和 CI。没有进入“两个都能用”的灰色状态。

## 最终采用范围

Bun 被用于几个无原生依赖的内部脚本和独立工具；主前端仓库暂时继续 npm + Vite/Vitest；生产 Node 服务没有迁移。选择不是永远不变，后续版本可以按同一兼容矩阵重测。

这次试用最值得的不是省下多少秒，而是把“运行时兼容”从模糊印象变成了清单。Bun 1.0 证明 JavaScript 工具链可以被重新组合，性能竞争也推动整个生态进步。团队是否采用，则要看自己的依赖、测试和运维，而不是只看一条 benchmark。

## 资料

- [Bun 1.0 发布说明](https://bun.sh/blog/bun-v1.0)
- [Bun：Node.js compatibility](https://bun.sh/docs/runtime/nodejs-apis)
- [Bun：Test runner](https://bun.sh/docs/test)
