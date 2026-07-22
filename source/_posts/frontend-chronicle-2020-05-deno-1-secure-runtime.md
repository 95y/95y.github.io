---
title: "Deno 1.0：JavaScript 运行时重新思考安全与工具集成"
date: 2020-05-13 09:00:00
tags:
  - 前端年鉴
  - Deno
  - 2020
categories:
  - 前端年鉴
description: "用 Deno 1.0 写一个 Markdown 检查脚本，实际体验显式权限、URL 依赖与内置工具，并解释为何没急着迁生产服务。"
cover: /img/covers/frontend-chronicle-deno-1-secure-runtime.svg
top_img: /img/covers/frontend-chronicle-deno-1-secure-runtime.svg
toc: true
---
Deno 1.0 发布时，我拿它写的第一个东西不是 Web 服务，而是一个读取 Markdown frontmatter、检查发布日期的命令行脚本。原因很简单：这类工具足够小，能体验权限、TypeScript 和依赖导入，又不会因为生态不兼容影响生产业务。

跑通以后最直观的感受不是“比 Node 快多少”，而是脚本需要什么权限被写进了启动命令。它让我重新注意到：一个普通构建脚本默认能读取整个磁盘、访问任意网络和环境变量，其实是非常宽的能力。

## 从一个没有 package.json 的脚本开始

当时可以直接写 TypeScript，并从 URL 导入标准模块。下面是一个简化版检查器：

```ts
import { walk } from "https://deno.land/std/fs/walk.ts"

for await (const entry of walk("./posts", { exts: [".md"] })) {
  const text = await Deno.readTextFile(entry.path)
  const matched = text.match(/^date:\s*(.+)$/m)

  if (!matched) {
    console.warn(`${entry.path}: missing date`)
  }
}
```

第一次运行会失败，因为脚本没有读取目录的权限：

```bash
deno run check_posts.ts
```

明确允许目标目录后才可执行：

```bash
deno run --allow-read=./posts check_posts.ts
```

这类错误不是“环境没配好”，而是权限模型在工作。相比 `--allow-read` 放开所有路径，把范围收窄到脚本真正需要的目录更符合最小权限原则。

## 网络依赖看起来自由，也需要锁定

URL import 让依赖来源一目了然，但也产生了新问题：远端内容变化或不可用时，脚本是否还能复现？Deno 会缓存已下载模块，也提供 lock file 来校验依赖完整性。项目一旦进入 CI，就不能只依赖某台开发机的缓存。

当依赖越来越多，散落在每个源码文件里的长 URL 也不好维护。我们后来集中在一个依赖模块中再导出：

```ts
// deps.ts
export { walk } from "https://deno.land/std@0.53.0/fs/walk.ts"

// check_posts.ts
import { walk } from "./deps.ts"
```

这里的版本号只是当时写法示意，实际项目应使用当前受支持版本。集中入口至少能让升级和审计有明确位置。

## 权限不是沙箱的万能证明

Deno 默认拒绝文件、网络、环境变量和子进程访问，是很好的安全起点。但一旦为了省事使用 `-A`/`--allow-all`，边界就回到了全开状态。第三方脚本如果同时获得读环境变量和网络权限，理论上就能读取 token 并发送出去。

我会把任务拆开：格式化脚本不需要网络；抓取数据的脚本只允许目标 API 域名；生成文件只允许输出目录。

```bash
deno run \
  --allow-net=api.example.com \
  --allow-read=./config \
  --allow-write=./generated \
  generate_report.ts
```

权限参数仍然需要代码审查，尤其是通配路径、环境变量和运行子进程。默认安全只是让授权动作可见，不会自动判断授权是否合理。

## 内置工具减少了“先选工具”的时间

Deno 1.0 把格式化、lint、测试、文档和打包相关能力放进同一个可执行文件。对于小工具，这种体验很干净：

```bash
deno fmt
deno test --allow-read=./fixtures
deno doc check_posts.ts
```

测试同样受权限限制。某条测试如果意外访问网络，会直接失败，而不是悄悄依赖外部服务。这促使我们把纯逻辑和 I/O 分开：frontmatter 解析写成纯函数，文件读取留给最外层，单元测试就不需要任何权限。

```ts
export function readDate(markdown: string): string | null {
  return markdown.match(/^date:\s*(.+)$/m)?.[1].trim() ?? null
}

Deno.test("readDate returns null when date is absent", () => {
  if (readDate("# hello") !== null) throw new Error("unexpected date")
})
```

## 没有立刻迁移 Node 服务的原因

当时生产项目依赖数据库驱动、监控 SDK、公司内部 npm 包和既有容器镜像。Deno 的 API 设计很有吸引力，但“语法能运行”不等于整条运维链路准备好了。

我们评估的是这些具体问题：

- 关键依赖有没有兼容实现，行为边界是否相同；
- 日志、指标、trace 和错误上报能否接入现有平台；
- 构建镜像、健康检查与优雅退出如何实现；
- 团队排障工具是否认识新的运行时；
- 锁文件、私有依赖与离线构建怎样管理。

最后 Deno 留在了内部脚本和实验服务，没有强行替换主业务。这不是试用失败，反而是一个合理的技术结论。

## Deno 1.0 真正推动了什么

Deno 没有在 1.0 发布后立刻取代 Node.js，但它重新点燃了 JavaScript 运行时竞争：Web 标准 API、默认权限、原生 TypeScript 体验和一体化工具都成为后续讨论的重点。Node 与其他运行时也在不断吸收类似方向。

回看那次小实验，我最愿意保留的不是 URL import，而是“让能力显式化”的习惯。无论使用什么运行时，构建脚本访问了哪些目录、网络和密钥，都应该能被看见、限制和审计。安全默认值能帮我们迈出第一步，真正的安全仍来自精确授权和完整运维验证。

## 资料

- [Deno 1.0 发布说明](https://deno.com/blog/v1)
- [Deno：Security and permissions](https://docs.deno.com/runtime/fundamentals/security/)
