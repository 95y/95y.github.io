---
title: "ESM/CJS 混用排查：ERR_REQUIRE_ESM 与默认导入错误"
date: 2023-08-18 14:00:00
tags:
  - 前端排障
  - Node.js
categories:
  - 前端排障
description: "运行时报 ERR_REQUIRE_ESM 或 require is not defined。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-esm-cjs-module-errors.svg
top_img: /img/covers/frontend-debug-esm-cjs-module-errors.svg
toc: true
---
遇到这类报错时，先别急着改配置。稳定复现、缩小范围，通常比在搜索结果里反复复制答案更快。

## 先确认是不是同一个问题

- 运行时报 ERR_REQUIRE_ESM 或 require is not defined
- 开发环境正常，测试或构建阶段导入失败
- 默认导入得到 undefined 或多包了一层 default

## 不要跳过最小复现

1. 从报错入口逐层确认每个包的 type、exports 和实际文件扩展名
2. 查看构建后的代码，不只检查 TypeScript 源码
3. 用 node 直接执行最小导入，排除框架包装影响

## 用最小例子感受一下

CommonJS 加载纯 ESM 包时收敛动态导入边界：

```js
async function loadPackage() {
  const { default: api } = await import('esm-only-package')
  return api
}
```

## 根因通常藏在这里

- package.json type、文件扩展名与编译输出模块格式不一致
- 依赖只发布 ESM，而调用方仍使用 require
- TypeScript、测试器和运行时采用不同 moduleResolution

## 我最后会这样改

1. 新项目统一使用 ESM，并让 tsconfig 与运行时保持一致
2. CommonJS 中加载 ESM 使用动态 import，避免私自深层导入
3. 库包通过 exports 明确提供的入口，不依赖隐式目录解析

在 CI 同时测试发布产物与类型声明；升级纯 ESM 依赖前检查所有脚本、测试与配置文件。

## 相关资料

- [Node.js：ECMAScript modules](https://nodejs.org/api/esm.html)
