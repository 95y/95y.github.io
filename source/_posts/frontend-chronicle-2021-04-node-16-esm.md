---
title: "Node.js 16：ESM、现代 V8 与前端工具运行时升级"
date: 2021-04-20 09:00:00
tags:
  - 前端年鉴
  - Node.js
  - 2021
categories:
  - 前端年鉴
description: "从一个读取配置的脚本迁移 ESM，讲清 package type、扩展名、exports、双格式包和 CI Node 版本一致性。"
cover: /img/covers/frontend-chronicle-node-16-esm.svg
top_img: /img/covers/frontend-chronicle-node-16-esm.svg
toc: true
---
Node.js 16 发布时，前端团队已经不能再把 Node 当成“装 webpack 的那个东西”。构建、测试、代码生成、SSR 和包发布都运行在 Node 上。开发机是 14、CI 是 12、Docker 又是另一个版本时，同一份配置经常出现三种结果。

我们升级 Node 16 的同时，把一批工具脚本改成 ESM。真正花时间的不是把 `require` 换成 `import`，而是理解 package 边界、文件扩展名、条件 exports 和测试器各自如何解析模块。

## 从一个读取配置的脚本开始迁移

CommonJS 版本：

```js
const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, 'site.config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

module.exports = config
```

在 `package.json` 声明模块类型：

```json
{
  "type": "module",
  "engines": {
    "node": ">=16 <17"
  }
}
```

ESM 中没有 CommonJS 注入的 `__dirname`，需要基于当前模块 URL：

```js
import { readFile } from 'node:fs/promises'

const configUrl = new URL('./site.config.json', import.meta.url)
const config = JSON.parse(await readFile(configUrl, 'utf8'))

export default config
```

这不是 ESM 少了一个功能，而是模块定位从“当前进程/包装函数里的路径”转向标准 URL 语义。工具脚本里随处依赖 `__dirname` 时，迁移会比业务组件明显得多。

## `type` 决定 `.js` 的解释方式

最近的 `package.json` 中 `"type": "module"` 会让该包范围内的 `.js` 按 ESM 解释；`"type": "commonjs"` 或未声明时按 CommonJS。`.mjs` 和 `.cjs` 可以显式覆盖。

这意味着不能只看源码里有没有 import 来猜。配置文件也在包范围内：

```text
project/
  package.json       # type: module
  build.config.js    # 会按 ESM 解释
  legacy-tool.cjs    # 明确按 CommonJS
```

升级时常见的 `require is not defined`，就是某个 `.js` 已经进入 ESM 范围却仍使用 CommonJS 全局。反向的 `Cannot use import statement outside a module`，通常说明文件仍被当作 CJS。

## ESM 导入对路径更严格

Node ESM 的相对路径通常要写完整扩展名：

```js
// 不再依赖 CommonJS 风格的隐式 .js / index.js 查找
import { loadConfig } from './config/load-config.js'
```

这种严格一开始显得啰嗦，却让运行时解析更明确。TypeScript 项目要让源码导入、编译输出和 `moduleResolution` 协调；不能让 IDE 能跳转，实际 Node 却找不到输出文件。

我们会直接查看 dist，而不是只看 TS 源码：

```bash
node dist/cli.js --help
```

发布包的最终 JavaScript 才是消费者运行的东西。

## CommonJS 与 ESM 互操作不是完全对称

ESM 可以导入很多 CommonJS 包，但默认/命名导出的推断会受包写法影响。CommonJS 则不能同步 `require()` 一个纯 ESM 模块，通常需要动态 import：

```js
// legacy-loader.cjs
async function loadFormatter() {
  const module = await import('./formatter.js')
  return module.default
}

module.exports = { loadFormatter }
```

动态 import 返回 Promise，这会把异步边界向上传播。一个同步加载配置的 API 可能因此需要重构，而不是简单替换一行语法。

## 发布“双格式包”要避免两个实例

库作者常想同时服务 ESM 和 CommonJS，通过 `exports` 提供条件入口：

```json
{
  "name": "@acme/format",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "types": "./dist/index.d.ts"
}
```

但两套入口如果各自创建单例状态，同一进程中分别 import/require 可能得到两个实例，形成所谓 dual package hazard。无状态工具问题较小，事件总线、缓存和 class identity 就很危险。

我们尽量让两个入口共享同一底层状态，或干脆只发布一种模块格式并明确最低 Node 版本。兼容范围越宽，测试矩阵越大。

## 前端构建为什么被 Node 版本卡住

Vite、webpack、ESLint 和测试工具会逐步提高 Node 基线，以使用更新语法、标准 API 和 V8 能力。某次依赖升级在开发机正常，CI 报语法错误，最后只是 CI 镜像仍在 Node 12。

解决方式不是让每个人记住口头要求，而是把版本写进多个自动化入口：

```text
.nvmrc / .node-version
package.json engines
CI setup-node version
Dockerfile FROM node:16.x（当时示例）
```

同时让安装阶段在不支持版本上尽早失败。开发、CI 与生产尽量使用同一主版本，升级也要作为一次明确变更提交。

## 原生依赖和 lockfile 要一起验证

Node 主版本升级会影响原生 addon ABI、npm 版本与 lockfile 行为。我们检查了图片处理、旧版 Sass 等含原生二进制的依赖，删除 node_modules 后重新安装，而不是把旧目录直接带过去。

CI 验证包含：全新安装、单元测试、生产构建、SSR 启动和一次容器冒烟。仅仅 `node -v` 正确，不代表原生包已经为新 ABI 重新构建。

## 这次升级留下的模块边界

Node 16 并不是 ESM 的起点，也不是模块生态问题的终点，但它处在越来越多工具开始把现代 Node 与 ESM 当作正常路径的阶段。对我们来说，最大收获是项目不再混用“能碰巧跑”的模块约定：包级 type 明确、相对导入完整、发布入口受 exports 控制、CI 直接执行最终产物。

如果现在回头维护那类项目，我仍会先统一 Node 版本，再迁移模块格式；先跑通最终 JavaScript，再修 IDE 配置。模块错误往往不是一行 import 的错，而是源码、编译器、package.json 和运行时对同一个文件做出了不同解释。

## 资料

- [Node.js 16.0.0 发布说明](https://nodejs.org/en/blog/release/v16.0.0)
- [Node.js：ECMAScript modules](https://nodejs.org/api/esm.html)
- [Node.js：Packages](https://nodejs.org/api/packages.html)
