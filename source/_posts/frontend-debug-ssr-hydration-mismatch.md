---
title: "Hydration mismatch 排查：服务端 HTML 为什么和客户端不同"
date: 2024-08-16 14:00:00
tags:
  - 前端排障
  - SSR
categories:
  - 前端排障
description: "页面首次加载闪烁并出现水合不匹配警告。从症状、根因、定位步骤到修复与预防，给出完整排查路径。"
cover: /img/covers/frontend-debug-ssr-hydration-mismatch.svg
top_img: /img/covers/frontend-debug-ssr-hydration-mismatch.svg
toc: true
---
先说结论：不要从报错文字直接猜答案。把现场压缩成最小例子，再顺着引用、网络或渲染链路往回找，通常更稳。

页面首次加载闪烁并出现水合不匹配警告；只有刷新或生产环境出现，客户端跳转正常；事件绑定错位，部分 DOM 被客户端重新创建。

## 把浏览器信息放到水合之后

首屏使用确定值，浏览器信息在水合后更新：

```jsx
const [timezone, setTimezone] = useState('UTC')
useEffect(() => {
  setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
}, [])
```

## 页面其实经历了三份状态

排查水合问题时要区分服务器返回的 HTML、浏览器解析后的 DOM，以及 React 水合后的树。无效标签嵌套会在第二步被浏览器自动修正，即使服务端字符串看起来一致，真正参与水合的结构也可能已经不同。

## 不要把警告简单压掉

suppressHydrationWarning 只适合已知且局部的差异，例如不可避免的时间文本。它不会修复事件错位，也不应包住整块页面。更可靠的方案是给首屏提供确定数据，再在 Effect 中更新浏览器专属信息。

## 保存原始 HTML 再对比 DOM

1. 保存服务端原始 HTML，并与水合前后的 DOM 对比
2. 固定时间、随机数、语言和请求数据复现
3. 逐层缩小客户端组件边界，定位第一个不同节点

- 渲染阶段读取 Date、Math.random、window 或本地存储
- 服务端和客户端使用不同语言、时区或数据快照
- 无效 HTML 嵌套被浏览器解析器自动纠正

## SSR 组件需要确定性测试

1. 首屏使用服务器提供的稳定快照，浏览器专属值放到 Effect 后更新
2. 用合法 HTML 与确定性 key，统一时区和国际化配置
3. 必须跳过水合的第三方组件采用明确的客户端加载边界

SSR 组件执行确定性测试，并在 CI 用真实浏览器检查控制台 hydration 警告。

## React 水合资料

- [React：hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
