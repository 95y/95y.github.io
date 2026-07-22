---
title: "工具链进入新阶段：TypeScript 6、Node 26 与 Vite 8.1"
date: 2026-07-15 09:00:00
tags:
  - 前端年鉴
  - 前端工程化
  - 2026
categories:
  - 前端年鉴
description: "三张独立升级工单：TypeScript 6 进入主线，Node 26 留在 canary，Vite 8.1 bundled dev 只给超大后台实验。"
cover: /img/covers/frontend-chronicle-typescript-6-node-26-vite-8-1.svg
top_img: /img/covers/frontend-chronicle-typescript-6-node-26-vite-8-1.svg
toc: true
---
2026 年上半年，我们连续做了三次看似相关、实际上不能绑在一起的升级：TypeScript 6 调整类型检查与旧选项，Node 26 带来新的运行时/V8 并默认启用 Temporal，Vite 8.1 又给超大项目提供实验性的 bundled dev mode。

如果把它们写成“2026 工具链全面升级”，一个失败很难归因。真实操作是三张工单、三次兼容矩阵和三套验收。下面保留这份维护日志，而不是做功能列表。

## 3 月：TypeScript 6，先处理弃用而不是追 TypeScript 7

TypeScript 6.0 很特殊：官方计划它成为现有 JavaScript 代码库的最后一个主要版本，为后续原生 Go 实现铺路。它既有新能力，也承担清理旧配置与 6→7 迁移准备。

我们的 web app 旧 tsconfig：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "types": ["vite/client"]
  }
}
```

`moduleResolution: node` 实际指向旧 node10 算法，在 TS 6 被弃用。对由 Vite 打包的应用，更合适的是 bundler；直接由 Node 执行的包则应评估 nodenext：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "strict": true,
    "types": ["vite/client"]
  }
}
```

这不是全项目通用答案。CLI/Node 服务如果复制 bundler 解析，tsc 可能允许运行时 Node 找不到的导入。每个 package 按最终由谁加载选择策略。

### `stableTypeOrdering` 只用于迁移验证

TS 6 提供 `--stableTypeOrdering`，帮助检查未来原生编译器可能观察到的类型排序差异。我们在 CI 增加一条非阻断任务，针对生成声明与类型快照的库运行；普通应用没有因为“新 flag”就全开。

同时处理移除/弃用的老模块目标、`no-default-lib` 等选项，并显式记录受新默认影响的配置。升级后跑的不只是 `tsc --noEmit`，还要生成 `.d.ts`、打包库并在 consumer 项目使用。

## 5 月：Node 26 先进入 canary，不进入生产 LTS

Node 26.0.0 发布时属于 Current，官方计划到 10 月进入 LTS。我们不会因为 Current 发布就替换所有生产镜像，但会让一条 canary CI 提前运行测试，发现未来 LTS 阻塞项。

```yaml
strategy:
  matrix:
    node: ["22", "24", "26"]
continue-on-error: ${{ matrix.node == '26' }}
```

真正的生产版本按项目支持策略决定；canary 失败要建 issue，但不会阻止主线。等目标版进入合适生命周期、依赖支持齐全，再转为 required。

### Temporal 默认启用，不代表马上重写所有 Date

Node 26 默认启用 Temporal，解决许多时区、日历和不可变日期时间建模问题。我们先挑“将上海营业时间转换为用户时区”的纯函数做实验：

```js
const opening = Temporal.ZonedDateTime.from(
  '2026-07-22T09:00:00+08:00[Asia/Shanghai]'
)

const inLondon = opening.withTimeZone('Europe/London')
console.log(inLondon.toString())
```

生产前仍要确认：浏览器是否支持或需要 polyfill，数据库/JSON 如何序列化，API 是否继续传 ISO 字符串，团队对 Instant/PlainDate/ZonedDateTime 的选择是否一致。

前端与 Node 共享代码不能因为 Node 26 有全局 Temporal 就假设所有浏览器也有。边界层继续使用稳定字符串契约，内部逐步采用。

### 主版本也有移除项

Node 26 升级 V8 到 14.6、Undici 到 8，并移除/弃用一批历史 API。例如依赖若仍调用已移除的 `http.Server.prototype.writeHeader()`，canary 会尽早失败。原生 addon 还要重新验证 ABI/预编译二进制。

我们在 CI 记录 deprecation，并对 HTTP client、stream、原生图片包与信号退出跑专项测试。只验证语法新特性，会漏掉真正阻塞生产的旧 API。

## 6 月：Vite 8.1 bundled dev 只在大项目实验

Vite 8.1 的 experimental bundled dev mode 面向模块数量极大的应用。Vite 原本按模块服务源码，项目到上万模块、浏览器要处理大量请求时，启动和 full reload 会被请求数量拖慢；bundled dev 用开发 bundle 降低这个开销，同时保留 HMR 目标。

配置明确带 experimental：

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  experimental: {
    bundledDev: true
  }
})
```

或者使用官方提供的实验 CLI flag。它当前重点覆盖浏览器侧与基础插件，第三方插件/次要能力可能不工作，所以不能看到官方 benchmark 就设为所有项目默认。

### 我们怎么判断项目是否“足够大”

先在 Network/性能日志记录：

```text
冷启动到页面可用
首次路由模块请求数
full reload 时间
单文件 HMR 时间
代理环境额外延迟
浏览器 CPU/内存
```

小型营销站请求不到 300 个模块，开启实验模式收益有限；后台首页超过 7000 模块且走企业代理，full reload 明显受请求数量影响，才进入 A/B。

结果：冷启动页面渲染约快 2.4 倍，full reload 快约 35%，HMR 接近原有体验；但一个虚拟模块插件失败。我们提交最小复现，日常默认仍保持关闭，只给自愿试用者脚本。

## 三次升级之间唯一共享的是验证框架

我们用一张兼容矩阵串联，但不合并版本变更：

| 层 | 主要风险 | 验收 |
| --- | --- | --- |
| TypeScript 6 | 类型/声明/解析改变 | typecheck、d.ts consumer |
| Node 26 | 运行时移除、原生依赖 | canary test、容器冒烟 |
| Vite 8.1 实验模式 | 插件、dev 语义 | 双模式 E2E、HMR/full reload |

每层失败都能单独关闭：回退 TS 版本、让 Node 26 canary 非阻断、关闭 `bundledDev`。没有一个“升级全部工具”的开关。

## 删除历史包袱不等于删除兼容责任

TS 6 弃用旧解析、Node 26 移除旧 API、Vite 探索统一 bundling，看起来都在向现代基础设施收敛。但业务项目仍要服务自己的浏览器、部署平台和依赖生态。

我的维护顺序一直是：安全修复优先；受支持运行时其次；行为正确与可回退；最后才是速度和新语法。工具链越快，越不能用一次全量升级把风险混在一起。

到 2026 年 7 月，TypeScript 6 已进入主线；Node 26 仍在 canary 观察其生命周期与依赖支持；Vite 8.1 bundled dev 仍是大型后台的实验选项。这种“不整齐”的状态，反而比一张“已全面升级”海报更接近真实工程。

## 资料

- [TypeScript 6.0 发布说明](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [Node.js 26.0.0 发布说明](https://nodejs.org/en/blog/release/v26.0.0)
- [Vite 8.1 发布说明](https://vite.dev/blog/announcing-vite8-1)
