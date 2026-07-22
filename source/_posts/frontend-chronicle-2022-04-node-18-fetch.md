---
title: "Node.js 18：原生 Fetch 拉近浏览器与服务器 API"
date: 2022-04-19 09:00:00
tags:
  - 前端年鉴
  - Node.js
  - 2022
categories:
  - 前端年鉴
description: "Node 18 有了全局 Fetch 后，怎样补齐 HTTP 状态、超时、取消、重试、流式下载、SSRF 与可观测性。"
cover: /img/covers/frontend-chronicle-node-18-fetch.svg
top_img: /img/covers/frontend-chronicle-node-18-fetch.svg
toc: true
---
Node.js 18 把全局 `fetch` 带进运行时（最初是实验状态）以后，服务端小工具终于可以直接使用和浏览器相似的 Request、Response、Headers API。我们删掉了一个只为发两条 HTTP 请求而安装的客户端库，却很快发现：API 统一了，服务端网络工程的复杂度一点也没消失。

`fetch` 只在网络层拒绝时抛异常，HTTP 404/500 仍会正常返回 Response；默认没有“业务想要的五秒超时”；重试、代理、连接池、可观测性也不会凭空出现。真正可用的封装需要把这些策略写清楚。

## 第一版封装犯了两个错误

```js
export async function getJson(url) {
  const response = await fetch(url)
  return response.json()
}
```

错误一：500 响应也会继续解析，调用方可能把错误 JSON 当成功数据。错误二：上游一直不返回时，请求可以长时间挂着，占用服务资源。

我们先定义一个带状态和响应片段的错误：

```js
export class HttpError extends Error {
  constructor(message, { status, url, body, cause } = {}) {
    super(message, { cause })
    this.name = 'HttpError'
    this.status = status
    this.url = url
    this.body = body
  }
}
```

再做最小的状态/超时处理：

```js
export async function requestJson(url, options = {}) {
  const timeout = options.timeout ?? 5000
  const signal = AbortSignal.timeout(timeout)

  let response
  try {
    response = await fetch(url, { ...options, signal })
  } catch (cause) {
    throw new HttpError(`Request failed: ${url}`, { url, cause })
  }

  if (!response.ok) {
    const body = await response.text()
    throw new HttpError(`HTTP ${response.status}: ${url}`, {
      status: response.status,
      url,
      body: body.slice(0, 1000)
    })
  }

  return response.json()
}
```

这里的 `AbortSignal.timeout` 支持范围要与实际 Node 18 小版本核对；较早环境可以自行创建 controller + timer。关键是超时成为显式策略，并且错误保留 URL/status/cause。

## 外部 signal 与超时要能组合

调用方可能在任务取消时已经有 signal，封装不能直接覆盖。可以组合信号（具体 API 同样要按目标 Node 版本确认），或者手动转发 abort：

```js
function createTimeoutSignal(ms, externalSignal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('timeout')), ms)

  const abortFromOutside = () => controller.abort(externalSignal.reason)
  externalSignal?.addEventListener('abort', abortFromOutside, { once: true })

  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timer)
      externalSignal?.removeEventListener('abort', abortFromOutside)
    }
  }
}
```

使用后在 finally 中 dispose，避免监听器和 timer 留存。取消不是“无关紧要的异常”，要区分用户取消、任务超时与真正网络失败，监控告警级别也不同。

## 不是所有失败都可以重试

GET 查询在网络错误、429 或部分 5xx 下可以有限重试，并带退避与随机抖动；POST 支付、创建订单则可能产生重复写入，除非服务端支持幂等键。

```js
async function retryGet(url, { attempts = 3, signal } = {}) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestJson(url, { signal })
    } catch (error) {
      lastError = error
      const retryable = !error.status || error.status === 429 || error.status >= 500
      if (!retryable || attempt === attempts) throw error

      const delay = 200 * 2 ** (attempt - 1) + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
```

生产代码还应读取 `Retry-After`、让等待可取消并设置总截止时间。每层都重试会放大流量，所以网关、SDK 和业务服务要明确由哪一层负责。

## Response body 是流，只能消费一次

Fetch 的响应体不是随时可重复读取的普通对象：

```js
const response = await fetch(url)
const text = await response.text()
const json = await response.json() // body 已经被消费，会失败
```

调试中想既记录又解析，可以先读取文本再 JSON.parse，或在合适场景 clone；但 clone 大响应也会有内存代价。下载大文件时应流式处理，而不是 `arrayBuffer()` 后全部放进内存。

```js
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'

const response = await fetch(fileUrl)
if (!response.ok) throw new Error(`HTTP ${response.status}`)

await pipeline(
  Readable.fromWeb(response.body),
  createWriteStream('./archive.zip')
)
```

Web Stream 与 Node stream 的桥接让标准 API 可以进入现有文件管道，但要处理取消、磁盘错误和临时文件清理。

## 浏览器封装不能原样搬到服务器

浏览器关心 CORS、Cookie credentials 和页面生命周期；服务器没有浏览器 CORS 限制，却要处理企业代理、证书、DNS、连接复用与 SSRF。

尤其是服务端根据用户输入请求 URL 时，必须限制协议、主机和重定向，防止访问内网元数据地址：

```js
function assertAllowedUrl(input) {
  const url = new URL(input)
  if (url.protocol !== 'https:') throw new Error('HTTPS required')
  if (!['api.example.com', 'images.example.com'].includes(url.hostname)) {
    throw new Error('Host not allowed')
  }
  return url
}
```

allowlist 只是简化示例，生产还要考虑 DNS rebinding、重定向目标和 IP 范围。统一 API 不等于统一威胁模型。

## 日志要能关联，而不是打印整个响应

我们给每个外部请求记录目标服务名、路径模板、状态、耗时、重试次数和 trace ID，不记录完整 token/个人数据。错误正文最多截断并脱敏。

```js
const startedAt = performance.now()
try {
  return await requestJson(url, options)
} finally {
  metrics.observe('outbound_http_duration_ms', performance.now() - startedAt, {
    service: 'profile-api'
  })
}
```

仅记录 URL 容易把用户 ID 变成高基数指标；使用路径模板更适合聚合。

## 原生 Fetch 给了统一基础，不是完整 SDK

Node 18 的 fetch 让跨运行时库和小脚本少了一项依赖，也让 Request/Response/Web Streams 更常见。真正业务服务仍可能需要成熟客户端提供代理、连接调优、插件与更丰富的错误模型。

是否替换第三方库不应该只看“Node 已经内置”。对简单 JSON 调用，原生 fetch 足够；对复杂认证、重试、上传进度和企业网络，保留专用客户端可能更可靠。无论选哪一个，状态检查、截止时间、取消、幂等与可观测性都必须由团队明确承担。

## 资料

- [Node.js 18.0.0 发布说明](https://nodejs.org/en/blog/release/v18.0.0)
- [Node.js：Global fetch](https://nodejs.org/api/globals.html#fetch)
- [MDN：Fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
