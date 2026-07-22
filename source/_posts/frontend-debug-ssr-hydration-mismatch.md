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
这个问题最麻烦的地方，是表面现象和真正根因经常不在同一层。下面按一次实际排查的顺序来走。

## 现场通常是什么样

- 页面首次加载闪烁并出现水合不匹配警告
- 只有刷新或生产环境出现，客户端跳转正常
- 事件绑定错位，部分 DOM 被客户端重新创建

## 把问题缩小到这几行

首屏使用确定值，浏览器信息在水合后更新：

```jsx
const [timezone, setTimezone] = useState('UTC')
useEffect(() => {
  setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
}, [])
```

## 我会先查这几个位置

1. 保存服务端原始 HTML，并与水合前后的 DOM 对比
2. 固定时间、随机数、语言和请求数据复现
3. 逐层缩小客户端组件边界，定位第一个不同节点

## 最后发现的高频根因

- 渲染阶段读取 Date、Math.random、window 或本地存储
- 服务端和客户端使用不同语言、时区或数据快照
- 无效 HTML 嵌套被浏览器解析器自动纠正

## 修复和收尾

1. 首屏使用服务器提供的稳定快照，浏览器专属值放到 Effect 后更新
2. 用合法 HTML 与确定性 key，统一时区和国际化配置
3. 必须跳过水合的第三方组件采用明确的客户端加载边界

SSR 组件执行确定性测试，并在 CI 用真实浏览器检查控制台 hydration 警告。

## 相关资料

- [React：hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
