---
title: "ESM/CJS 混用排查：ERR_REQUIRE_ESM 与默认导入错误"
date: 2023-08-18 14:00:00
tags:
  - 前端排障
  - Node.js
categories:
  - 前端排障
description: "从 ERR_REQUIRE_ESM 出发，核对实际文件格式、package type、exports、TypeScript 输出与 default 互操作。"
cover: /img/covers/frontend-debug-esm-cjs-module-errors.svg
top_img: /img/covers/frontend-debug-esm-cjs-module-errors.svg
toc: true
---
这条错误出现在一个已经运行两年的发布脚本里：

```text
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported
```

业务代码没有改，依赖升级后，某个工具包从同时发布 CommonJS/ESM 改成纯 ESM。脚本仍由 CommonJS 执行，用 `require()` 同步加载它，于是直接失败。

网上常见答案是“把 require 改成 import”或“package.json 加 type: module”。这两句可能有效，也可能让整个仓库的配置文件一起坏掉。排查模块错误必须先确认：报错文件被 Node 当成什么格式、它实际加载了哪个出口、编译后的代码又是什么。

## 第一步只用 Node 复现，不让框架包住错误

原脚本经过任务 runner，堆栈很长。我们先建最小文件：

```js
// reproduce.cjs
const formatter = require('esm-only-formatter')
console.log(formatter)
```

```bash
node reproduce.cjs
```

仍然抛 ERR_REQUIRE_ESM，说明与 webpack/测试器无关。再查看依赖自身 `package.json`：

```json
{
  "type": "module",
  "exports": "./index.js"
}
```

它公开的是 ESM `.js`。CommonJS 的 `require` 是同步 API，不能同步执行一个可能包含 top-level await 的 ESM 模块。

## 最小修复：在 CJS 边界使用动态 import

发布脚本暂时不能整体转 ESM，因为几个旧插件只提供 CJS。我们把纯 ESM 依赖收敛到一个异步加载函数：

```js
// formatter-loader.cjs
let formatterPromise

function loadFormatter() {
  formatterPromise ??= import('esm-only-formatter')
  return formatterPromise
}

module.exports = { loadFormatter }
```

调用链改为 async：

```js
const { loadFormatter } = require('./formatter-loader.cjs')

async function buildRelease() {
  const { default: format } = await loadFormatter()
  const result = format(await readManifest())
  await writeRelease(result)
}

buildRelease().catch(error => {
  console.error(error)
  process.exitCode = 1
})
```

动态 import 在 CommonJS 中可用，但返回 Promise。若原 API 必须同步，就不能假装一行替换没有架构影响；要么向上传播异步，要么固定兼容的旧依赖版本并规划迁移。

## `require is not defined` 是相反方向

另一个项目在 `package.json` 加了 `"type": "module"` 后，`vite.config.js` 报：

```text
ReferenceError: require is not defined in ES module scope
```

该 package 范围内 `.js` 已按 ESM 解释，配置仍写：

```js
const path = require('node:path')
module.exports = { /* ... */ }
```

有两种明确修法：把配置转换为 ESM，或在仍需 CJS 时改名 `.cjs`。

```js
// vite.config.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export default {
  resolve: {
    alias: { '@': path.join(currentDir, 'src') }
  }
}
```

不要在 ESM 顶部伪造一个全局 require 然后继续混写，除非确实需要 `createRequire` 加载特定 CJS/JSON，且边界很清楚。

## `.js` 到底是什么，由最近的 package 边界决定

快速判断表：

```text
.mjs                         -> ESM
.cjs                         -> CommonJS
.js + 最近 package type=module -> ESM
.js + type=commonjs/未声明      -> CommonJS
```

monorepo 中每个 package 可能有自己的 `package.json`，同名 `.js` 在不同目录下解释不同。Node 错误堆栈给出的绝对路径很重要，要沿路径向上找最近 package.json，而不是只看仓库根。

## `exports` 会让“文件明明存在”也无法导入

依赖升级后还有一种错误：

```text
ERR_PACKAGE_PATH_NOT_EXPORTED
```

旧代码绕过公开入口：

```js
import parser from 'some-package/lib/internal/parser.js'
```

包新增 `exports` 后，只允许声明的子路径：

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./parser": "./dist/parser.js"
  }
}
```

应改用 `some-package/parser` 或公开 API，而不是继续拼 `node_modules` 路径。深层文件不是稳定契约，构建器也可能与 Node 对 exports 的处理不同。

## 默认导入多一层 `.default` 从哪里来

CommonJS 只有 `module.exports`，ESM 有 default/named exports。转译器会为了互操作生成包装，配置不同就可能出现：

```js
const module = require('./compiled-module')
console.log(module.default)
```

排查不要根据 TypeScript 源码猜，直接打印/查看最终导出：

```bash
node -e "console.log(require('./dist/index.cjs'))"
node -e "import('./dist/index.js').then(console.log)"
```

库同时发布两种格式时，两条命令都应该是 CI 消费测试。只跑源码单测无法保证消费者看到的形状。

## TypeScript 配置必须与真实运行时一致

最隐蔽的情况是 IDE 和 `tsc` 都通过，Node 执行 dist 失败。比如 TypeScript 按 bundler 方式允许省略扩展名，产物却直接交给 Node ESM：

```ts
import { parse } from './parse'
```

编译后仍是无扩展导入，Node ESM 找不到。对于直接由 Node 执行的项目，使用与 Node ESM 匹配的 `module`/`moduleResolution`（如项目版本支持的 NodeNext 组合），并在源码中写输出时有效的路径：

```ts
import { parse } from './parse.js'
```

TypeScript 能把它解析到 `parse.ts`，输出给 Node 时保留 `.js`。具体选项应与所用 TS/Node 版本核对，不能从前端 bundler 项目复制 tsconfig。

## 测试环境正常、生产失败怎么办

Jest/Vitest/tsx 等工具可能转换模块或提供自定义解析，使源码中的混用暂时可行；生产 Node 直接运行 dist 时就失败。因此我们的最小验收始终包含：

```bash
npm pack
mkdir /tmp/package-consumer
# 在临时 consumer 中安装 tarball
# 分别用 import 与 require（如果声称支持）加载公开入口
node dist/cli.js --help
```

测试发布 tarball 能发现 package files 漏发、exports 错路径和 types 指向源码等问题。

## 一张实用故障分流表

| 错误 | 先检查 |
| --- | --- |
| ERR_REQUIRE_ESM | CJS 是否 require 纯 ESM；能否动态 import |
| require is not defined | 文件是否进入 ESM package scope |
| Cannot use import statement outside a module | 文件是否被当成 CJS；转换是否未执行 |
| ERR_MODULE_NOT_FOUND | ESM 相对扩展名、大小写、exports |
| ERR_PACKAGE_PATH_NOT_EXPORTED | 是否深层导入未公开文件 |
| default 为 undefined/多一层 | 最终 CJS/ESM 导出形状与 interop 配置 |

## 结论不是“全都改 ESM”

新项目统一 ESM 通常更清楚，遗留仓库也可以分包迁移；但强行在一次 PR 改所有脚本、测试与构建配置，会放大风险。关键是边界明确：`.cjs/.mjs/type` 一致、exports 是唯一公开入口、tsconfig 符合真实运行方式、最终产物有消费测试。

那次 ERR_REQUIRE_ESM 最终只改了一个 loader 和上层 async 调用，却顺带补上了 package 测试。之后再看到模块错误，我们不再试十组 compiler flags，而是从报错文件的实际格式开始，一层层核对解析契约。

## 资料

- [Node.js：ECMAScript modules](https://nodejs.org/api/esm.html)
- [Node.js：Packages](https://nodejs.org/api/packages.html)
- [TypeScript：Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
