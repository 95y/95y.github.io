---
title: "React Server Components：组件边界延伸到服务器"
date: 2020-12-21 09:00:00
tags:
  - 前端年鉴
  - React
  - 2020
categories:
  - 前端年鉴
description: "React 团队公开 Server Components 研究成果：部分组件只在服务器执行，并以可流式传输的描述与客户端组件组合。梳理核心变化、工程影响与今天的实践建议。"
cover: /img/covers/frontend-chronicle-react-server-components-research.svg
top_img: /img/covers/frontend-chronicle-react-server-components-research.svg
toc: true
---
前端工具更新很快，但并不是每个版本都值得记住。2020 年这次变化之所以留下来，是因为它改变了后续项目的默认做法。

React 团队公开 Server Components 研究成果：部分组件只在服务器执行，并以可流式传输的描述与客户端组件组合。

## 把问题缩小到这几行

组件保持纯净，副作用只负责同步外部系统：

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(value => value + 1)}>{count}</button>
}
```

## 这部分最容易被忽略

服务器组件可以直接访问后端资源而不把实现发给浏览器；客户端组件继续承载状态和交互；打包器与框架需要理解服务器/客户端模块边界。

## 这次升级真正解决了什么

前端架构重新从纯客户端 SPA 转向服务器与客户端协同。数据获取、缓存、序列化和安全边界成为组件设计的一部分。

## 今天再做一次选择

Server Components 应通过成熟框架采用；任何 use server 入口都要按公开接口进行鉴权、校验和审计。

## 版本记录与延伸阅读

- [React Server Components 介绍](https://legacy.reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html)
