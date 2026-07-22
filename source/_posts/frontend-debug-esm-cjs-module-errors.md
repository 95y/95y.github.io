---
title: "前端疑难排查：ESM/CJS 混用排查：ERR_REQUIRE_ESM 与默认导入错误"
date: 2023-08-18 14:00:00
tags:
  - 前端排障
  - Node.js
categories:
  - 前端排障
description: "运行时报 ERR_REQUIRE_ESM 或 require is not defined。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/frontend-performance-cover.svg
toc: true
---

线上问题最怕“改一点试试看”。更可靠的方式是先稳定复现，再沿数据、时序、网络或渲染链路逐层缩小范围。

## 常见症状

1. 运行时报 ERR_REQUIRE_ESM 或 require is not defined
2. 开发环境正常，测试或构建阶段导入失败
3. 默认导入得到 undefined 或多包了一层 default

## 高概率根因

1. package.json type、文件扩展名与编译输出模块格式不一致
2. 依赖只发布 ESM，而调用方仍使用 require
3. TypeScript、测试器和运行时采用不同 moduleResolution

## 定位步骤

1. 从报错入口逐层确认每个包的 type、exports 和实际文件扩展名
2. 查看构建后的代码，不只检查 TypeScript 源码
3. 用 node 直接执行最小导入，排除框架包装影响

## 修复方案

1. 新项目统一使用 ESM，并让 tsconfig 与运行时保持一致
2. CommonJS 中加载 ESM 使用动态 import，避免私自深层导入
3. 库包通过 exports 明确提供的入口，不依赖隐式目录解析

## 如何防止再次发生

在 CI 同时测试发布产物与类型声明；升级纯 ESM 依赖前检查所有脚本、测试与配置文件。

修复完成后还应补充最小回归用例，并把关键上下文写进错误日志。只有能够在下一次自动发现同类问题，排障工作才算真正闭环。

## 参考资料

- [Node.js：ECMAScript modules](https://nodejs.org/api/esm.html)
