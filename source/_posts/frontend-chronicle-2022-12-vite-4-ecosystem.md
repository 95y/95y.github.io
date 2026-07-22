---
title: "Vite 4：共享工具链生态进入稳定扩张期"
date: 2022-12-09 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2022
categories:
  - 前端年鉴
description: "Vite 4 时代的 monorepo 工具链整理：共享 alias、Vitest 转换、Rollup 插件测试与源码包出口边界。"
cover: /img/covers/frontend-chronicle-vite-4-ecosystem.svg
top_img: /img/covers/frontend-chronicle-vite-4-ecosystem.svg
toc: true
---
Vite 4 发布时，项目本身的变更不算惊天动地：生产构建升级到 Rollup 3，继续清理与演进。但在我们的 monorepo 里，Vite 已经不只是启动前端的命令。应用用 Vite，单元测试用 Vitest，组件文档和一个静态文档站也在复用相近的模块解析。

工具链开始共享以后，最大的收益不是少写几份配置，而是 alias、环境和插件行为终于能保持一致；最大的风险也同样明显：一个 Vite 插件升级可能同时影响开发、测试和文档。

## 以前三套工具有三份 alias

```text
vite.config.ts       @ -> src
vitest.config.ts     @ -> src（偶尔漏改）
tsconfig.json        @/* -> src/*
```

某次目录从 `src/services` 改为 `src/api`，应用能运行，测试在 CI 才找不到模块。我们把共享解析提取成普通配置模块：

```ts
// tooling/aliases.ts
import { fileURLToPath, URL } from 'node:url'

export const aliases = {
  '@': fileURLToPath(new URL('../apps/admin/src', import.meta.url)),
  '@shared': fileURLToPath(new URL('../packages/shared/src', import.meta.url))
}
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { aliases } from './tooling/aliases'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: aliases }
})
```

Vitest 可以在同一配置体系上合并测试选项。TypeScript paths 仍要同步，必要时用工具生成或做一致性测试，避免“双重真相”。

## 测试复用转换能力，但环境并不等于浏览器

Vitest 复用 Vite 的模块图和插件，Vue/React、TS、alias 的体验更一致。可这不代表测试自动运行在真实浏览器。jsdom/happy-dom 对布局、导航、Observer 等 API 的实现与浏览器有差异。

```ts
import { describe, expect, it } from 'vitest'
import { normalizePrice } from '@/domain/price'

describe('normalizePrice', () => {
  it('keeps zero as a valid value', () => {
    expect(normalizePrice(0)).toBe(0)
  })
})
```

纯逻辑适合快速单元测试；拖拽、焦点、真实渲染和跨页路由仍由 Playwright 等浏览器 E2E 覆盖。统一工具链不意味着只保留一种测试层级。

## 升级 Rollup 3，最先检查的是插件而不是业务代码

Vite 4 生产构建基于 Rollup 3。大多数标准项目升级平稳，自定义插件更需要关注：是否使用废弃钩子、假设输出对象结构、读取内部路径或依赖特定 chunk 顺序。

我们有个生成 asset manifest 的插件：

```ts
function assetManifestPlugin() {
  return {
    name: 'asset-manifest',
    generateBundle(_options, bundle) {
      const files = Object.values(bundle).map(item => item.fileName)
      this.emitFile({
        type: 'asset',
        fileName: 'asset-list.json',
        source: JSON.stringify(files, null, 2)
      })
    }
  }
}
```

测试不能只断言 build 成功，还要验证清单包含入口、动态 chunk 和 CSS，文件名/顺序不被消费者错误依赖。插件接口看似很小，往往连接着部署系统。

## monorepo 源码包要明确边界

开发时直接 alias 到 `packages/shared/src` 很方便，HMR 也快；发布时却可能绕过包的 exports，业务用到消费者本不该访问的内部文件。

```json
{
  "name": "@acme/shared",
  "exports": {
    ".": "./dist/index.js",
    "./date": "./dist/date.js"
  }
}
```

我们让应用日常通过公开包入口导入，并在 CI 对打包后的 package 做消费测试。开发体验不能牺牲发布契约，否则换仓库或外部复用时会集中爆炸。

## Node 版本开始决定整个前端工作区能否启动

Vite 大版本会跟随 Node 生命周期提高要求。monorepo 中只要一个脚本仍固定旧 Node，就可能出现应用能启动、文档或测试失败。我们把 Node 版本提升作为独立 PR：

1. 更新开发版本文件、CI 与 Docker；
2. 全新安装依赖并检查 lockfile；
3. 跑应用 build、Vitest、文档构建和组件测试；
4. 再升级 Vite/Rollup 相关依赖。

把运行时与构建器分开，回归范围更容易判断。

## 环境变量也需要区分测试与构建

应用中的 `import.meta.env` 在测试里可能走不同 mode。我们不让测试隐式读取开发机 `.env.local`，而是在测试 setup 中提供最小明确值，并禁止生产 secret 进入客户端前缀。

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    env: {
      VITE_API_BASE: 'https://api.test.invalid'
    }
  }
})
```

更好的业务设计是把 API client 的 base URL 作为依赖注入，减少全局环境变量散落。

## 共享不等于把所有配置塞进一个文件

我们尝试过一个 500 行 `vite.shared.ts`，包含 Vue、React、SSR、library build 和测试选项，最终条件分支比原来更多。后来只共享稳定原语：alias、通用 define、少量自研插件；框架插件和 build 目标留在各项目。

共享配置的判断标准是“这些项目真的必须同步变化吗”，而不是“代码看起来重复”。两行重复比一个充满 mode 判断的通用工厂更容易维护。

## Vite 4 这一年的实际意义

Vite 4 单独看像一次平稳大版本，放在生态里却能看到工具链平台已经形成：元框架、测试、文档、组件工具围绕相近插件能力协作。官方还用 vite-ecosystem-ci 在核心变更前验证下游项目，这种生态测试比承诺“完全兼容”更实际。

我们的收获也是双向的：开发/测试解析一致，配置更少漂移；同时把关键插件加入构建产物测试，不再把 dev server 能启动当作升级完成。共享基础设施越多，越需要真实下游验证和明确责任边界。

## 资料

- [Vite 4.0 发布说明](https://vite.dev/blog/announcing-vite4.html)
- [Vitest 官方文档](https://vitest.dev/)
- [Vite：Performance](https://vite.dev/guide/performance)
