---
title: "ChunkLoadError 排查：前端发布后懒加载资源 404"
date: 2021-09-17 14:00:00
tags:
  - 前端排障
  - 工程化
categories:
  - 前端排障
description: "发布后只有长时间没刷新的用户打开懒加载路由白屏：从失败 chunk URL 追到旧资源被删除与非原子发布。"
cover: /img/covers/frontend-debug-chunk-load-error-after-deploy.svg
top_img: /img/covers/frontend-debug-chunk-load-error-after-deploy.svg
toc: true
---
周五下午发布后，错误平台开始出现一条平时几乎没有的异常：`Loading chunk 17 failed`。新打开页面的同事无法复现，只有那些早上就开着后台、下午点击“报表”菜单的人会白屏。刷新一下又好了。

最初大家把它归因于“用户浏览器缓存”，准备在 catch 里直接 `location.reload()`。但如果不修发布流程，刷新只是把损失转给用户；碰到 Service Worker 或 CDN 版本不一致，自动刷新甚至可能进入循环。

## 先还原用户当时拿到的三个版本信息

排查这类问题，我会先收集：

```text
页面入口版本：2021.09.17-1
失败资源 URL：https://cdn.example.com/assets/report.a81c2f.js
当前线上版本：2021.09.17-2
HTTP 状态：404
页面打开时间：发布前 4 小时
Service Worker：未注册
```

只有一句 ChunkLoadError 不够。动态 import 可能因为 404、CDN 超时、CSP、语法错误或网络离线失败，错误名字也不一定在所有构建器/浏览器中相同。失败 URL 与 Network 状态最有价值。

我们在 HTML 模板中注入构建版本，错误上报附带它：

```js
window.__APP_VERSION__ = '2021.09.17-2'

window.addEventListener('error', event => {
  reportError(event.error || event.message, {
    appVersion: window.__APP_VERSION__,
    pageOpenedAt: window.__PAGE_OPENED_AT__,
    url: event.filename
  })
})
```

实际应用还会在动态导入包装层记录请求 URL、online 状态和 SW controller。

## 为什么只有没刷新的老页面出错

早上用户下载的入口 bundle 中记录着：

```js
import('./report.a81c2f.js')
```

下午发布后，新构建生成了 `report.f093ad.js`。部署脚本先清空静态目录，再上传新版，所以旧 hash 文件消失。老页面仍在内存中，直到用户第一次打开报表才发起对旧 chunk 的请求，结果 404。

刷新后浏览器拿到新版 HTML 和入口，自然会请求新 hash，于是显得“刷新就修好了”。真正根因是发布系统只服务当前版本，却存在长时间运行的旧客户端。

## 先在源站和 CDN 两边请求失败 URL

拿到 URL 后不要只在浏览器刷新。我会分别检查：

```bash
curl -I https://cdn.example.com/assets/report.a81c2f.js
curl -I https://origin.example.com/assets/report.a81c2f.js
```

结果可以快速分流：

- 源站 404、CDN 404：文件确实被删除或没上传；
- 源站 200、CDN 404：CDN 回源/负缓存或刷新策略；
- 部分 CDN 节点 404：分发未完成或区域问题；
- 返回 200 但 Content-Type 是 text/html：SPA fallback 吞掉了资源 404；
- 200 且内容是旧/错误文件：缓存 key、压缩变体或覆盖发布问题。

资源请求错误地回退到 `index.html` 时，浏览器常报告 `Unexpected token '<'` 或 MIME 错误，而不是清晰的 chunk 404。静态资源路径应直接返回 404，不走页面 fallback。

## 发布顺序改成“资源先行，入口后切”

正确发布模型依赖内容 hash 文件不可变：

1. 上传本次所有 hash 静态资源，不删除旧文件；
2. 从多个节点抽样确认关键资源可访问；
3. 最后切换 HTML/入口清单；
4. 观察错误率和业务指标；
5. 经过一个回滚窗口后，再清理足够旧的资源。

静态资源可以长期缓存：

```http
Cache-Control: public, max-age=31536000, immutable
```

HTML 则应短缓存或要求重新验证：

```http
Cache-Control: no-cache
```

`no-cache` 不是“不存”，而是使用前重新验证。具体策略要结合 CDN，但核心是不让 HTML 长期指向已经清理的资源。

## 多节点滚动发布也会拼出混合版本

即使没有删除文件，HTML 与资源由不同服务器构建/提供，也可能拿到不一致版本。例如请求 HTML 命中节点 B 的新版，资源回源到尚未发布的节点 A，短时间 404。

我们的静态资源改成一次构建产物上传到共享对象存储，不在每个应用节点现场构建；HTML 切换使用同一个 release ID。部署系统保存完整 release 清单，回滚只切入口，不重新拼装文件。

```json
{
  "release": "2021.09.17-2",
  "assets": [
    "app.91de02.js",
    "report.f093ad.js",
    "report.35c102.css"
  ]
}
```

发布前脚本会逐个 HEAD 检查清单中的资源。

## 客户端恢复要克制，避免刷新死循环

即使发布流程修好，用户网络或扩展仍可能导致偶发加载失败。可以提供一次受控恢复，但不能所有 import 错误都无限刷新。

```js
const RELOAD_KEY = 'chunk-reload-version'

export async function importWithRecovery(loader) {
  try {
    const module = await loader()
    sessionStorage.removeItem(RELOAD_KEY)
    return module
  } catch (error) {
    const currentVersion = window.__APP_VERSION__
    const reloadedFor = sessionStorage.getItem(RELOAD_KEY)

    reportError(error, { type: 'dynamic-import', currentVersion })

    if (navigator.onLine && reloadedFor !== currentVersion) {
      sessionStorage.setItem(RELOAD_KEY, currentVersion)
      location.reload()
      return new Promise(() => {})
    }

    throw error
  }
}
```

路由层还要有 Error Boundary/错误页，让第二次失败后显示“资源加载失败，请检查网络或手动刷新”，而不是白屏。对用户正在填写的长表单，自动刷新前最好保存草稿或征得确认。

## 如果项目有 Service Worker，再多检查一层

Service Worker 可能缓存旧 HTML、拦截 chunk 请求或在激活时清理旧 cache。排查时记录：

```js
console.log({
  controller: navigator.serviceWorker?.controller?.scriptURL,
  appVersion: window.__APP_VERSION__
})
```

打开 DevTools Application 面板查看 active/waiting worker 和 Cache Storage。不要把“Unregister service worker”当生产修复，它只清了测试机器；需要设计 SW 版本升级、旧客户端切换和缓存清理时机。

## 监控从异常数量升级为发布指标

修复后，我们按 release 聚合动态导入失败率，并在发布窗口设置阈值。上报字段至少包含：

- 入口应用版本与失败 chunk URL；
- 页面打开时间、路由和网络状态；
- HTTP status（能获取时）与 CDN request ID；
- 是否有 Service Worker；
- 自动恢复是否已执行、执行后是否成功。

这样能区分某个旧版本资源被删、单一区域 CDN 故障，还是用户整体离线。

## 结案

这次事故最终没有靠 `location.reload()` 结案。根修复是静态资源不可变、资源先于 HTML 发布、旧文件保留回滚窗口，以及完整 release 可追踪。客户端只提供一次安全恢复和明确错误界面。

ChunkLoadError 看似前端路由 Bug，根因常在构建 hash、CDN 缓存和发布原子性。下次遇到时，先拿失败 URL、入口版本与 HTTP 状态，还原用户跨过了哪两次发布，比反复清浏览器缓存有效得多。

## 资料

- [webpack：Caching](https://webpack.js.org/guides/caching/)
- [MDN：Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Headers/Cache-Control)
