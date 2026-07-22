---
title: "跨域 Cookie 排查：CORS、SameSite 与 credentials"
date: 2022-09-16 14:00:00
tags:
  - 前端排障
  - Web 安全
categories:
  - 前端排障
description: "登录返回 200 和 Set-Cookie，下一次请求却仍是 401；把 Cookie 保存、发送、CORS 预检与 SameSite 分层排查。"
cover: /img/covers/frontend-debug-cors-cookie-samesite.svg
top_img: /img/covers/frontend-debug-cors-cookie-samesite.svg
toc: true
---
这个问题的现场很典型：登录接口返回 200，Network 里能看到 `Set-Cookie`，下一次请求却仍然是 401。本地开发从未出现，测试环境一换成 `app.example.test` 调 `api.vendor.test` 就失败。

排查跨域 Cookie 最容易把 CORS、SameSite、Domain、Secure 和 fetch credentials 混成一团。我后来固定先问两个问题：Cookie 有没有被浏览器保存？已经保存的 Cookie 为什么没有随请求发送？这是两道不同的门。

## 先画清 origin 与 site，不要只说“跨域”

假设：

```text
页面：https://app.example.com
接口：https://api.example.com
```

它们 origin 不同（host 不同），所以 fetch 受 CORS 约束；但通常属于 same-site（scheme + registrable domain 相同），SameSite 判断与完全第三方站点又不同。

另一种：

```text
页面：https://app.example.com
接口：https://login.vendor.com
```

这是 cross-origin 且 cross-site，Cookie 的 SameSite 限制更严格，也会受到浏览器第三方 Cookie 策略影响。排障记录必须写完整 URL、scheme 和站点关系，“前后端跨域”信息太少。

## 第一道门：响应里的 Cookie 有没有保存

登录响应：

```http
Set-Cookie: session=abc...; Path=/; HttpOnly; Secure; SameSite=None
```

在 DevTools Network 的 Cookies/Issues 面板查看浏览器是否标注 blocked reason，再到 Application → Cookies 确认实际存储。常见失败原因：

- `SameSite=None` 没有同时使用 `Secure`；
- HTTPS 页面调用 HTTP 接口，或 Secure Cookie 在非 HTTPS 环境；
- `Domain` 与响应主机不匹配；
- 过期时间已过、值格式非法或浏览器策略拦截第三方 Cookie；
- CORS 凭据配置不成立，响应不能被客户端接受。

HttpOnly Cookie 不会出现在 `document.cookie`，这是安全属性的预期行为，不能用 JS 读不到来判断未保存。

## 第二道门：保存以后为什么没有发送

浏览器会根据请求 URL 的 Domain、Path、Secure、SameSite 和 credentials 再做一次判断。例如 Cookie 的 Path 是 `/auth`，请求 `/profile` 就不会带。

客户端跨 origin fetch 要明确包含凭据：

```js
const response = await fetch('https://api.example.com/profile', {
  credentials: 'include',
  headers: {
    Accept: 'application/json'
  }
})
```

axios 等库有自己的对应选项，不能把 fetch 配置名原样套用。然后在 Network 的 Request Headers/Cookies 查看实际请求，不要只打印代码中的 options。

## 服务端 CORS 必须与凭据配套

服务端响应需要明确允许页面 origin，并允许凭据：

```js
const allowedOrigins = new Set([
  'https://app.example.com',
  'https://admin.example.com'
])

function cors(req, res, next) {
  const origin = req.headers.origin

  if (allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }

  next()
}
```

带凭据请求不能使用 `Access-Control-Allow-Origin: *`。动态回显 origin 也不能无条件照抄请求头，否则任意恶意站点都可能被允许；必须先匹配严格 allowlist。

`Vary: Origin` 很重要：如果 CDN 缓存响应，而缓存 key 没区分 Origin，可能把给 A 站的允许头返回给 B 站，产生随机 CORS 故障或安全问题。

## 预检通过，实际响应仍可能失败

自定义 header、非简单方法或内容类型会触发 OPTIONS 预检：

```http
OPTIONS /profile HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type,x-csrf-token
```

服务端要返回允许的方法和 header：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT
Access-Control-Allow-Headers: Content-Type,X-CSRF-Token
```

只给 OPTIONS 配好 CORS 还不够，实际 PUT 响应也要包含对应 allow-origin/credentials。我们遇到过网关接管 OPTIONS，业务服务的 500 响应却没有 CORS 头，浏览器最终只显示 CORS error，掩盖真正的服务端异常。

排查时同时看预检和实际请求；必要时在服务器日志用 request ID 找原始状态。

## Domain 的常见误区

不写 Domain 时会形成 host-only Cookie，只发送给设置它的精确主机，通常更安全。如果要在子域共享，可以设置合适的 Domain，但不能设置成无关域，也不应为了“省配置”放大范围。

```http
# 仅 api.example.com
Set-Cookie: session=...; Path=/; Secure; HttpOnly; SameSite=Lax

# 可能覆盖 example.com 的多个子域
Set-Cookie: session=...; Domain=example.com; Path=/; Secure; HttpOnly; SameSite=Lax
```

Cookie 前导点的历史写法不应作为判断重点，浏览器按规范处理域匹配。真正要确认的是谁设置、哪些主机需要发送、是否有同名 Cookie 在不同 Domain/Path 下互相干扰。

同名 Cookie 存在两份时，服务端解析库可能取到意外的一份。Application 面板按 Domain 和 Path 全部展开，比只看键名可靠。

## SameSite 不是 CORS 的替代品

SameSite 控制 Cookie 在跨站上下文中的发送，CORS 控制页面脚本能否读取跨 origin 响应。它们解决不同问题。

- `Strict`：跨站导航也严格限制，安全强但可能影响外部链接后的登录态；
- `Lax`：适合很多第一方会话，是常见默认策略；
- `None`：允许跨站发送，必须配 Secure，并要面对第三方 Cookie 政策。

如果应用完全依赖 third-party Cookie，不能只确认 `SameSite=None` 就认为长期可用。浏览器隐私策略会限制它，架构上优先考虑同站反向代理、顶级导航授权或标准身份协议，而不是要求用户关闭保护。

## Cookie 登录还需要 CSRF 防护

`credentials: include` 与宽松跨站 Cookie 让浏览器自动带会话，也意味着跨站请求伪造风险。CORS 不是完整 CSRF 防护，因为表单等某些请求并不依赖脚本读取响应。

常见组合是 SameSite、CSRF token、Origin/Referer 校验与敏感操作二次确认。下面只是 token 形态示意：

```js
await fetch('https://api.example.com/profile', {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(profile)
})
```

token 的生成、绑定和验证要由服务端安全设计，不是多加一个 header 就完成。

## 为什么本地代理会把问题全部藏起来

Vite/webpack dev proxy 让浏览器请求 `/api`，看起来与页面同源：

```js
server: {
  proxy: {
    '/api': 'https://api.example.com'
  }
}
```

浏览器看不到代理后面的跨 origin，自然不会触发生产 CORS 场景。开发体验可以保留代理，但测试环境至少要有一条使用真实 HTTPS 域名和接近生产站点关系的端到端用例。

不要用 `--disable-web-security` 作为验证，它只把问题从测试机隐藏，上线用户仍会失败。

## 当时的根因与修复

事故中有两个根因叠加：前端 fetch 没有 `credentials: 'include'`；网关使用 `Access-Control-Allow-Origin: *`。Cookie 的 SameSite 配置本身没错，但请求根本没有通过凭据型 CORS 的完整链路。

修复后我们做了自动化场景：首次登录保存 Cookie、刷新仍登录、会话过期、从不同允许 origin 访问、恶意 origin 被拒绝、预检和实际响应都带正确 Vary/CORS 头。这样以后改网关不会只测一个 200。

## 我的排查顺序

1. 写完整页面/接口 URL，判断 cross-origin 与 cross-site；
2. 看响应 Cookie blocked reason，确认是否真正保存；
3. 看 Application 中 Domain/Path/SameSite/Secure 与同名 Cookie；
4. 看下一次请求是否携带，检查前端 credentials；
5. 分别检查 OPTIONS 和实际响应的 CORS 头；
6. 检查 CDN 的 Vary/缓存以及网关是否吞掉错误响应头；
7. 最后再评估第三方 Cookie 政策、CSRF 和身份架构。

把“保存”与“发送”分开后，这类问题通常不再玄学。浏览器每次阻止 Cookie 都有具体规则，找到它在哪一道门被拒绝，比反复改 SameSite 字符串快得多。

## 资料

- [MDN：CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)
- [MDN：Set-Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN：Using Fetch - Including credentials](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)
