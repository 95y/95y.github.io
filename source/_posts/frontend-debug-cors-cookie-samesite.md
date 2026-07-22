---
title: "前端疑难排查：跨域 Cookie 排查：CORS、SameSite 与 credentials"
date: 2022-09-16 14:00:00
tags:
  - 前端排障
  - Web 安全
categories:
  - 前端排障
description: "接口返回 Set-Cookie，但浏览器没有保存。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/frontend-performance-cover.svg
toc: true
---

线上问题最怕“改一点试试看”。更可靠的方式是先稳定复现，再沿数据、时序、网络或渲染链路逐层缩小范围。

## 常见症状

1. 接口返回 Set-Cookie，但浏览器没有保存
2. Cookie 已存在，请求却没有携带
3. 本地代理正常，上线跨域环境失败

## 高概率根因

1. 客户端没有设置 credentials，或服务端没有允许凭据
2. Access-Control-Allow-Origin 使用了通配符
3. SameSite、Secure、Domain 或 Path 与实际场景不匹配

## 定位步骤

1. 在 Network 面板检查预检、实际请求和被阻止 Cookie 原因
2. 确认前端 Origin 与服务端允许来源完全一致
3. 分别验证存储阶段和发送阶段，不把两类问题混在一起

## 修复方案

1. fetch 使用 credentials: include，服务端返回明确 Origin 与 Allow-Credentials
2. 跨站 Cookie 使用 SameSite=None; Secure，并确保 HTTPS
3. 优先通过同站反向代理降低跨站身份复杂度

## 如何防止再次发生

建立本地、测试、生产三套真实域名回归；不要通过关闭浏览器安全策略解决业务配置问题。

修复完成后还应补充最小回归用例，并把关键上下文写进错误日志。只有能够在下一次自动发现同类问题，排障工作才算真正闭环。

## 参考资料

- [MDN：跨源资源共享](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)
