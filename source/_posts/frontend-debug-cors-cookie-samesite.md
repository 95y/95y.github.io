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
我把这类问题拆成了“看到什么、怎么定位、最后改哪里”三部分。下次再遇到，可以直接照着检查。

## 从现象开始缩小范围

1. 接口返回 Set-Cookie，但浏览器没有保存
2. Cookie 已存在，请求却没有携带
3. 本地代理正常，上线跨域环境失败

## 排查过程

1. 在 Network 面板检查预检、实际请求和被阻止 Cookie 原因
2. 确认前端 Origin 与服务端允许来源完全一致
3. 分别验证存储阶段和发送阶段，不把两类问题混在一起

## 为什么会发生

客户端没有设置 credentials，或服务端没有允许凭据；Access-Control-Allow-Origin 使用了通配符；SameSite、Secure、Domain 或 Path 与实际场景不匹配。

## 先动手跑一下

前后端两侧都要允许凭据：

```js
await fetch('https://api.example.com/profile', { credentials: 'include' })
res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com')
res.setHeader('Access-Control-Allow-Credentials', 'true')
```

## 修完以后别漏掉这些事

- fetch 使用 credentials: include，服务端返回明确 Origin 与 Allow-Credentials
- 跨站 Cookie 使用 SameSite=None; Secure，并确保 HTTPS
- 优先通过同站反向代理降低跨站身份复杂度

建立本地、测试、生产三套真实域名回归；不要通过关闭浏览器安全策略解决业务配置问题。

## 相关资料

- [MDN：跨源资源共享](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)
