---
title: "Vite 萌芽：原生 ESM 改变开发服务器思路"
date: 2020-07-15 09:00:00
tags:
  - 前端年鉴
  - Vite
  - 2020
categories:
  - 前端年鉴
description: "Vite 最初从 Vue 单文件组件的快速开发原型成长起来，核心思路是不再为每次启动预先打包整个应用，而是利用浏览器原生 ESM 按需提供模块。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-vite-native-esm-origin.svg
top_img: /img/covers/frontend-chronicle-vite-native-esm-origin.svg
toc: true
---
前端工具更新很快，但并不是每个版本都值得记住。2020 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。

Vite 最初从 Vue 单文件组件的快速开发原型成长起来，核心思路是不再为每次启动预先打包整个应用，而是利用浏览器原生 ESM 按需提供模块。

## 把问题缩小到这几行

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```

## 落到工程里，我关注这几件事

开发阶段按请求转换模块，降低冷启动成本；依赖预构建与源码按需编译采用不同策略；生产构建继续交给成熟打包器完成优化。

## 真正改变开发体验的地方

大型项目中“依赖规模越大，启动越慢”的传统模型受到挑战，前端工具链开始广泛采用原生语言编写的高性能工具。

## 如果现在接手这样的项目

Vite 很快，但项目性能仍会受插件数量、巨型依赖和模块图影响；升级工具不能替代依赖治理。

## 我参考的资料

- [Vite 官方博客](https://vite.dev/blog/)
