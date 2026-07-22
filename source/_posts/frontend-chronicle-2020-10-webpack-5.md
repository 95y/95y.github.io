---
title: "webpack 5：长期缓存与 Module Federation"
date: 2020-10-10 09:00:00
tags:
  - 前端年鉴
  - webpack
  - 2020
categories:
  - 前端年鉴
description: "同一次 webpack 5 升级里，文件系统缓存很快上线，Module Federation 却只留在两个边界：为什么风险完全不同。"
cover: /img/covers/frontend-chronicle-webpack-5.svg
top_img: /img/covers/frontend-chronicle-webpack-5.svg
toc: true
---
webpack 5 升级时，我们同时做了两件性质完全不同的事：一是把日常生产构建从十几分钟降下来，二是验证两个团队能否独立发布同一个后台里的业务模块。前者靠文件系统缓存和更稳定的产物策略，后者用了 Module Federation。

这两个功能都叫“工程化升级”，风险却不在一个量级。缓存错误最多让构建变慢或产物不对，远程模块则把原本在构建时确定的依赖搬到了用户运行时。后者已经带有分布式系统的味道，不能因为配置只有十几行就低估它。

## 先把构建缓存做成可验证的改动

webpack 5 提供持久化文件系统缓存后，我们没有只加一句 `cache: { type: 'filesystem' }` 就结束：

```js
const path = require('path')

module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].js'
  },
  optimization: {
    moduleIds: 'deterministic',
    chunkIds: 'deterministic'
  }
}
```

验证分三组：清空缓存冷构建、代码不变重复构建、只改一个叶子模块后增量构建。缓存命中带来的时间下降要记录，配置文件、lockfile 或环境变化后也必须正确失效。

缓存最危险的状态不是“没命中”，而是错误命中并复用过期结果。所以自定义 loader 如果依赖外部配置，需要把依赖告诉 webpack；CI 也不能在不同 Node/依赖环境之间盲目复用同一缓存目录。

## contenthash 稳不稳定，用两次构建就能看出来

长期缓存的目标不是文件名看起来有 hash，而是改一个模块时，无关资源的 hash 不变。我们保存第一次 dist，修改订单页一个文案再构建，然后比较清单：

```bash
find dist -type f -maxdepth 2 | sort
```

如果公共运行时代码、所有页面 chunk 都跟着变化，用户仍要重新下载。确定性 module/chunk ID 改善了这种稳定性，但 splitChunks、runtime 拆分和插件输出也会影响结果。最后必须看真实产物，而不是只看配置是否用了 `contenthash`。

## Module Federation 的 POC 很快就跑通了

结算团队暴露购物车模块：

```js
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'checkout',
      filename: 'remoteEntry.js',
      exposes: {
        './CartPanel': './src/CartPanel'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^17.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^17.0.0' }
      }
    })
  ]
}
```

宿主配置 remote 后，业务里可以动态导入：

```jsx
const CartPanel = React.lazy(() => import('checkout/CartPanel'))

function CheckoutArea() {
  return (
    <ErrorBoundary fallback={<LegacyCartLink />}>
      <React.Suspense fallback={<CartSkeleton />}>
        <CartPanel />
      </React.Suspense>
    </ErrorBoundary>
  )
}
```

本地两台 dev server 上很顺利。真正的问题都在“如果”：如果 remoteEntry 超时，如果远程刚发布宿主还在旧版本，如果共享 React 不兼容，如果 CDN 缓存了入口但 chunk 已更新。

## 远程依赖把失败时间推到了用户面前

普通 npm 依赖版本不兼容，通常在安装、构建或测试阶段暴露。Federation 远程模块在浏览器运行时解析与加载，故障可能只发生在某个地区、某个缓存节点或某组版本组合。

因此上线前我们补了这些基础设施：

- 远程模块加载失败时显示旧入口，不让整个后台白屏；
- remoteEntry 使用短缓存，内容 hash chunk 使用长期不可变缓存；
- 每次请求记录宿主版本、远程版本和失败 URL；
- 发布后做跨应用契约测试，回滚时保留对应静态资源；
- 共享依赖只保留真正需要单例的包，不把所有依赖都 shared。

React 同时加载两份可能导致 Hooks 与 context 问题，所以常设为 singleton；工具函数库未必需要共享，强行共享反而增加版本协商复杂度。

## 独立部署不是由插件赋予的

Module Federation 经常和微前端一起出现，但配置 remote 不会自动让团队变独立。如果两个模块共用数据库表、同一天必须同步接口、发布还要在一个群里手工排顺序，它们依然强耦合。

我们用几个问题判断边界是否合理：

1. 远程模块有独立业务所有者和发布节奏吗？
2. 输入 props/事件是否能形成稳定契约，而不是直接读取宿主内部 store？
3. 远程不可用时，宿主能否降级？
4. 设计系统、鉴权和路由由谁提供，版本怎样兼容？
5. 线上问题能否明确定位到某一版本的某个远程？

答不清这些问题时，先拆 npm 包或仓库模块通常更便宜。

## Node polyfill 变化是迁移中的隐藏成本

webpack 5 不再像过去那样自动为大量 Node 核心模块提供浏览器 polyfill。某些前端依赖间接使用 `crypto`、`buffer` 或 `process`，升级后会直接报错。

我们没有第一时间把所有 polyfill 全补回来，而是先追依赖链：浏览器代码为什么需要 Node API？能否换成 Web API 或浏览器版本入口？只有确实合理的依赖才显式配置 fallback。全量补回会把历史包袱和体积一起带入新构建。

## 最后的结果

文件系统缓存给所有开发者带来稳定收益，很快进入主线。Module Federation 只用于两个确实有独立发布需求的区域，没有推广到整站。技术能力可以使用，不意味着适合每一个边界。

webpack 5 对我最大的提醒，是“构建工具功能”也可能改变系统架构。持久化缓存要验证失效，长期缓存要比较 hash，远程模块要按网络依赖处理。把每项能力放到它真实的失败范围里评估，升级才不会停在一份漂亮配置上。

## 资料

- [webpack 5 发布公告](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
- [webpack：Module Federation](https://webpack.js.org/concepts/module-federation/)
- [webpack：Build Performance](https://webpack.js.org/guides/build-performance/)
