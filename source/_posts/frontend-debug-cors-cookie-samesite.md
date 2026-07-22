---
title: "跨域 Cookie 排查：CORS、SameSite 与 credentials"
date: 2022-09-16 14:00:00
tags:
  - 前端排障
  - Web 安全
categories:
  - 前端排障
description: "接口返回 Set-Cookie，但浏览器没有保存。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-cors-cookie-samesite.svg
top_img: /img/covers/frontend-debug-cors-cookie-samesite.svg
toc: true
---
这类 Bug 很少靠一行代码彻底解决。修复现场问题之外，还要把缓存、生命周期或发布流程一起补上。

## 用真实域名覆盖三套环境

建立本地、测试、生产三套真实域名回归；不要通过关闭浏览器安全策略解决业务配置问题。

## Set-Cookie 返回了为什么没有保存

- 接口返回 Set-Cookie，但浏览器没有保存
- Cookie 已存在，请求却没有携带
- 本地代理正常，上线跨域环境失败

## 前后端两侧都要允许凭据

前后端两侧都要允许凭据：

```js
await fetch('https://api.example.com/profile', { credentials: 'include' })
res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com')
res.setHeader('Access-Control-Allow-Credentials', 'true')
```

## Cookie 有保存和发送两道门

Network 面板看到 Set-Cookie 只说明响应尝试写入。浏览器还会检查 Domain、Path、Secure 和 SameSite；保存成功以后，下次请求又会根据站点关系和 credentials 决定是否发送。排查时把这两个阶段分开，速度会快很多。

## 本地代理为什么会掩盖问题

开发服务器代理让浏览器看到的是同源请求，因此生产环境的跨站限制没有被触发。测试环境最好使用接近线上的 HTTPS 域名和子域结构，并同时检查预检响应与实际响应。

## 逐项检查 SameSite、Secure 与 Domain

1. 在 Network 面板检查预检、实际请求和被阻止 Cookie 原因
2. 确认前端 Origin 与服务端允许来源完全一致
3. 分别验证存储阶段和发送阶段，不把两类问题混在一起

## 先区分保存失败还是发送失败

- 客户端没有设置 credentials，或服务端没有允许凭据
- Access-Control-Allow-Origin 使用了通配符
- SameSite、Secure、Domain 或 Path 与实际场景不匹配

1. fetch 使用 credentials: include，服务端返回明确 Origin 与 Allow-Credentials
2. 跨站 Cookie 使用 SameSite=None; Secure，并确保 HTTPS
3. 优先通过同站反向代理降低跨站身份复杂度

## CORS 参考资料

- [MDN：跨源资源共享](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)
