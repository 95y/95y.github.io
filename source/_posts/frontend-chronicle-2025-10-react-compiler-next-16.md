---
title: "React Compiler 1.0 与 Next.js 16：自动优化进入框架主线"
date: 2025-10-21 09:00:00
tags:
  - 前端年鉴
  - React
  - 2025
categories:
  - 前端年鉴
description: "在一张排班表中增量启用 React Compiler，先修不纯渲染，再与手工 memo、Next 16 Turbopack 分开验证。"
cover: /img/covers/frontend-chronicle-react-compiler-next-16.svg
top_img: /img/covers/frontend-chronicle-react-compiler-next-16.svg
toc: true
---
React Compiler 1.0 稳定以后，我们没有在整个 monorepo 打开开关。第一个试点是一张经常重渲染的排班表：父组件每次选中单元格，几十个无关行也会重新执行。代码里已有不少 `memo`、`useMemo` 和 `useCallback`，其中一部分有依据，另一部分只是前人为了“性能”加上。

Compiler 的价值是通过构建时分析自动加入记忆化，让开发者少手工维护引用稳定性；它的前提是组件遵守 React Rules——渲染纯净、状态不可变、Hook 调用合法。试点真正花时间的部分不是配置，而是 lint 把几处不纯代码翻了出来。

## 先记录现状，不用“感觉更快”验收

我们保存三组基线：

- React Profiler 中选中一个单元格时的 commit 与组件 render 数；
- 低端设备上拖动排班范围的 Interaction to Next Paint；
- 生产 bundle、构建时间和测试结果。

一段已有优化：

```jsx
const visibleRows = useMemo(
  () => filterRows(rows, keyword, department),
  [rows, keyword, department]
)

const handleSelect = useCallback(id => {
  setSelectedId(id)
}, [])
```

不能看到 Compiler 就把它们全删。先启用、对比生成行为与性能，再逐步清理冗余 memo；有明确语义/昂贵计算保护的手工优化也可能继续保留。

## lint 找到了一次 render 中的写操作

```jsx
const recentRows = []

function ScheduleRow({ row }) {
  recentRows.push(row.id)
  return <div>{row.name}</div>
}
```

组件 render 修改模块级数组，重复渲染、并发或中断都会留下不同结果。编译器不能安全假设它是纯函数。正确做法取决于意图：如果用于调试就删除；如果用于统计，在事件或 Effect 中上报；如果只是计算列表，作为 render 的局部值并返回。

另一个问题是直接修改 props：

```jsx
function SortableList({ items }) {
  items.sort((a, b) => a.rank - b.rank)
  return items.map(item => <Row key={item.id} item={item} />)
}
```

改成创建新数组：

```jsx
const sortedItems = [...items].sort((a, b) => a.rank - b.rank)
```

这些修复即使不开 Compiler 也有价值。编译器诊断更像代码健康检查，不是为了通过而加一堆 disable。

## 在 Next.js 16 中做小范围集成

Next.js 16 提供 React Compiler 稳定集成。具体配置随版本文档演进，我们先只对试点 app 开启，并固定编译器版本/lockfile：

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true
}

export default nextConfig
```

编译器当前以构建插件形式工作，会增加一部分构建成本。我们在 CI 分别记录类型检查、编译、静态生成各阶段，不能只看总耗时后猜。

不满足规则的代码，编译器可以跳过部分优化而不是让应用全部坏掉，但诊断要进入可见的技术债清单。团队不能误以为打开 true 就“所有组件自动最快”。

## 先让 Compiler 与手工 memo 共存

第一周不删除任何 `memo`，用 Profiler 确认排班表无关行 render 数下降、交互改善、结果正确。第二周才挑没有收益/依赖难维护的 memo：

```diff
- export default memo(ScheduleRow)
+ export default ScheduleRow
```

每批删除后跑相同交互脚本。如果某个子组件接收第三方可变对象或计算边界编译器无法证明，就保留手工优化并写明测量依据。

Compiler 不是禁止 useMemo/useCallback，而是让它们从默认仪式回到针对性工具。

## Turbopack 成为默认是另一条独立迁移线

Next.js 16 同时让 Turbopack 成为默认 bundler（开发和生产路径）。这和 React Compiler 都触及构建，若同时切换，出现 source map、插件或 bundle 差异时难归因。

我们的顺序：

1. 先在 webpack 路径启用 Compiler，验证 React 行为；
2. 固定结果后使用默认 Turbopack 影子构建；
3. 比较 routes、chunk、CSS、source map、Sentry、server external；
4. 自定义 webpack 配置无法等价时暂时使用 `--webpack` 回退；
5. Turbopack 验证完成后才改主命令。

性能优化不能以失去可观测性和构建正确性为代价。

## Cache Components 不要与组件 memo 混为一谈

Next 16 的 Cache Components/`use cache` 处理服务器页面、组件或函数的数据/渲染缓存；React Compiler 的 memoization 处理组件/Hook 的客户端或 React 计算优化。两者都出现“cache”，生命周期和风险完全不同。

```ts
async function ProductSummary({ id }) {
  'use cache'
  const product = await getProduct(id)
  return <Summary product={product} />
}
```

是否使用服务器缓存要基于数据新鲜度与用户隔离；是否让 Compiler 优化组件要基于纯函数规则和 render 数据流。不能因为 Compiler 安全就推导服务器数据也能跨请求缓存。

## 试点发现的收益与限制

排班表减少了大量无关行执行，INP 场景改善；构建时间略有增加，在可接受范围。几个使用动态模式的组件未能完全优化，保留手工 memo。更重要的是移除了 render 写全局、props 原地排序和缺失 Hook 规则的代码。

我们没有把所有性能问题归给 Compiler。一次拖动仍卡顿，Profiler 显示不是 React render，而是主线程上的布局测量与 600ms 同步计算，最后用虚拟化/Worker 解决。自动 memo 不能优化网络、DOM layout 和算法复杂度。

## 推广规则

- 先升级 `eslint-plugin-react-hooks` 并处理规则；
- 每个 app 独立启用，不在 monorepo 根一刀切；
- 保存 Profiler 与真实用户指标基线；
- 手工 memo 分批删除，有证据再改；
- 编译器诊断不做整库 silent suppress；
- 与 bundler/框架缓存迁移分开提交。

React Compiler 让性能优化更接近编译器可以证明的数据流，而不是开发者猜哪个引用要稳定。它不会替代架构和测量，但能把大量样板 memo 从日常代码中拿走。对我们来说，最大的收益甚至不是少写 `useMemo`，而是组件纯净规则第一次有了更强的自动反馈。

## 资料

- [React Compiler 1.0 发布说明](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Compiler：Incremental Adoption](https://react.dev/learn/react-compiler/incremental-adoption)
- [Next.js 16 发布说明](https://nextjs.org/blog/next-16)
