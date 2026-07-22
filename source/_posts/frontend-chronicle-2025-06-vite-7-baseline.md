---
title: "Vite 7：现代浏览器 Baseline 与 Node 20 基线"
date: 2025-06-24 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2025
categories:
  - 前端年鉴
description: "Vite 7 对齐 Baseline 后，真实仓储 PDA WebView 仍不能忽略：怎样把浏览器支持写成数据与退役计划。"
cover: /img/covers/frontend-chronicle-vite-7-baseline.svg
top_img: /img/covers/frontend-chronicle-vite-7-baseline.svg
toc: true
---
Vite 7 把默认浏览器目标对齐到 Web Platform Baseline 的 Widely Available 能力，并提高 Node 运行基线。对新项目，这是更现代、更可解释的默认；对我们那个仍运行在仓库 PDA WebView 上的后台，则不能只因为构建成功就接受。

兼容性不是构建工具替产品做的决定。我们先从真实访问数据和设备清单出发，再决定沿用默认目标、显式降低 target，还是给旧终端保留独立版本。

## 先把“支持哪些浏览器”从口头要求变成数据

团队原来的文档只有一句“支持主流浏览器和 Android”。这无法指导任何构建配置。我们补了三类证据：

- RUM 中浏览器/系统/关键 API 失败率；
- 企业客户设备清单与合同要求；
- QA 可获得的最低版本真实设备。

结果发现公众用户几乎都在现代浏览器，但 3% 的仓储用户使用固定 WebView，升级周期由设备部门控制。这 3% 不能用公共市场份额查询抹掉，因为他们贡献核心业务。

## Baseline 解决的是共同能力，不是全部产品环境

Baseline 用跨浏览器可用性描述 Web 平台能力，比随手写“last 2 versions”更稳定。Vite 7 默认目标对应一个明确的 Widely Available 时间基线，能减少对过旧语法的无差别转换。

但以下环境仍要单独验证：

```text
企业 WebView
内嵌小程序/超级 App 浏览器
智能电视/车机
长期不更新的专用终端
受合规约束的桌面镜像
```

Baseline 不是浏览器测试替代品，也不涵盖所有非语法 API、CSS 和业务依赖行为。

## 显式 target 是一份产品契约

确认 PDA 无法及时升级后，我们没有隐含依赖旧默认，而是在配置中写清目标并加注释/文档：

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // 仓储 PDA WebView 合同基线；移除前查 compatibility.md
    target: ['chrome89']
  }
})
```

这只是语法转换目标，不会自动 polyfill 所有 Web API。如果源码使用新 API，还要能力检测或选择性 polyfill：

```js
if (!('ResizeObserver' in window)) {
  await import('./polyfills/resize-observer.js')
}
```

polyfill 也要在真实设备上测性能与正确性，不能看包名认为“已兼容”。

## 旧环境应该拖住所有用户吗

我们评估过三种方案：

1. 所有人下载同一份低目标 bundle：运维简单，现代用户承担额外转换/体积；
2. modern/legacy 双构建：体验更精细，发布和测试矩阵增大；
3. PDA 保留旧应用版本，新主站提高基线：产品分叉，需要明确支持期限。

最后选择第 3 种，因为 PDA 页面本来就是独立入口、功能稳定；给它设置一年升级窗口，新主站使用 Vite 7 默认现代基线。技术债没有消失，但有了负责人和截止时间。

## Node 基线先于 Vite 升级

Vite 7 要求新的 Node 版本范围。我们先更新：

```text
.node-version
package.json engines
CI setup-node
开发容器
部署/SSR 镜像
```

然后仍在旧 Vite 上跑一遍 build/test，确认 Node 升级没有让原生依赖和脚本失败。再升级 Vite 7，问题归因会清楚很多。

有同事只更新本地 Node，CI 使用版本号范围恰好选到不兼容小版本。最终我们在 CI 固定经过验证的版本，并让依赖更新工具单独提 Node 升级 PR，不依赖“>=20”自动漂移。

## 用 capabilities 测试比 UA 分支可靠

业务代码以前这样判断：

```js
if (/Chrome\/(8\d|9[0-1])/.test(navigator.userAgent)) {
  loadLegacyEditor()
}
```

UA 容易伪装，也无法准确代表 WebView 功能。能做能力检测时直接检测：

```js
const supportsModernEditor =
  'ResizeObserver' in window &&
  'structuredClone' in window &&
  CSS.supports('selector(:has(*))')

if (!supportsModernEditor) {
  showUnsupportedEditorNotice()
}
```

复杂能力要测试实际行为而非只看属性存在。服务端统计仍可能需要 UA，但客户端功能分支尽量基于 capability。

## 构建通过后，真实浏览器矩阵才开始

Vite/esbuild 能转语法，不会检测 CSS、第三方 SDK 和运行时 API 全部兼容。我们的最低设备用例包含：登录、扫码、离线重试、打印、文件上传和长列表。错误平台还按浏览器版本聚合 SyntaxError/ReferenceError。

生产 sourcemap 必须能还原，不然旧环境只报一个 `Unexpected token` 很难追到是否 target 漏转译某个依赖。

## 默认变现代是一件好事，前提是我们知道例外

过去为了“保险”永远转到很老，会增加 bundle 与编译负担；为了“性能”盲目跟随最新默认，又可能丢掉真实用户。Baseline 提供了比模糊市场版本更好的共同起点，业务例外仍要用数据覆盖。

Vite 7 升级最终让主站减少历史转换，PDA 则进入明确的退役计划。最大的成果不是快了多少毫秒，而是兼容范围从一句模糊口号变成了设备、配置、测试和结束日期都可追踪的契约。

## 资料

- [Vite 7 发布说明](https://vite.dev/blog/announcing-vite7)
- [web.dev：Baseline](https://web.dev/baseline)
- [Vite：Build Options - target](https://vite.dev/config/build-options.html#build-target)
