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
整理这段历史时，我更想回答一个实际问题：这次升级到底替开发者省掉了什么，又带来了哪些新的约束？

## Vite 最初解决的就是等待

大型项目中“依赖规模越大，启动越慢”的传统模型受到挑战，前端工具链开始广泛采用原生语言编写的高性能工具。

## 打包器为什么拖慢开发启动

Vite 最初从 Vue 单文件组件的快速开发原型成长起来，核心思路是不再为每次启动预先打包整个应用，而是利用浏览器原生 ESM 按需提供模块。

## 依赖预构建和源码转换要分开

1. 开发阶段按请求转换模块，降低冷启动成本
2. 依赖预构建与源码按需编译采用不同策略
3. 生产构建继续交给成熟打包器完成优化

## 浏览器原生 ESM 能做什么

先用一份小配置验证升级前后的行为：

```js
import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2020' }
})
```



## 快并不代表可以忽略模块治理

Vite 很快，但项目性能仍会受插件数量、巨型依赖和模块图影响；升级工具不能替代依赖治理。

## Vite 的早期思路

- [Vite 官方博客](https://vite.dev/blog/)
