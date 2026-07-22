---
title: 前端性能优化实战：围绕 Core Web Vitals 建立系统方法
date: 2026-07-22 17:15:00
updated: 2026-07-22 17:15:00
tags:
  - 前端性能
  - Core Web Vitals
  - 工程化
categories:
  - 前端开发
description: 从 LCP、INP、CLS 出发，建立一套覆盖测量、网络、资源加载、JavaScript 执行和渲染稳定性的前端性能优化方法。
cover: /img/frontend-performance-cover.svg
top_img: /img/frontend-performance-cover.svg
toc: true
---

性能优化最容易陷入两个误区：一是把 Lighthouse 分数当作唯一目标，二是看到某条建议就立即修改代码。真正稳定的优化需要先找到用户遇到的瓶颈，再围绕指标建立“测量、定位、修改、验证”的闭环。

本文从当前稳定的三个 Core Web Vitals 指标出发，整理一套可以直接用于项目的前端性能优化方法。

## 先定义什么叫“快”

Core Web Vitals 分别关注加载速度、交互响应和视觉稳定性：

| 指标 | 关注点 | 良好标准（P75） |
| --- | --- | --- |
| LCP | 主要内容何时可见 | ≤ 2.5 秒 |
| INP | 点击、输入等交互多久得到下一帧反馈 | ≤ 200 毫秒 |
| CLS | 页面是否发生意外位移 | ≤ 0.1 |

这里的 P75 表示至少 75% 的真实访问需要达到目标。实验室中的一次高分不能代表所有用户，尤其不能代表低端设备和弱网环境。

一个更合理的工作流是：

1. 用 PageSpeed Insights 或真实用户监控发现问题。
2. 用 Chrome DevTools 和 Lighthouse 在本地复现问题。
3. 找到影响指标的具体资源、长任务或布局变化。
4. 一次只修改一类因素，记录修改前后的结果。
5. 发布后继续观察真实用户数据。

## 优化 LCP：让关键内容更早出现

LCP 变慢通常可以拆成四个阶段：服务器响应慢、浏览器发现资源晚、资源下载慢、资源下载后仍然无法渲染。

### 1. 优先处理首屏关键资源

如果首屏大图是 LCP 元素，它应该直接出现在初始 HTML 中，并获得较高的加载优先级：

```html
<img
  src="/images/hero.webp"
  srcset="/images/hero-768.webp 768w, /images/hero-1440.webp 1440w"
  sizes="100vw"
  width="1440"
  height="810"
  fetchpriority="high"
  alt="产品首页界面"
/>
```

首屏 LCP 图片不要设置 `loading="lazy"`。浏览器如果要等到 JavaScript 执行之后才能发现图片地址，也会白白损失加载时间。

对于 CSS 背景图等不容易被预加载扫描器发现的资源，可以谨慎使用 preload：

```html
<link
  rel="preload"
  href="/images/hero.webp"
  as="image"
  type="image/webp"
  fetchpriority="high"
/>
```

Preload 只应用于真正关键的少量资源。预加载过多会让普通资源争抢带宽，结果可能适得其反。

### 2. 减少首屏阻塞

- 删除没有使用的 CSS 和 JavaScript。
- 按路由或功能拆分代码，避免所有页面共享一个巨大入口包。
- 非关键脚本使用 `defer`，第三方脚本尽量延后加载。
- 静态资源开启 Brotli 或 gzip，并配置长期缓存。
- 使用 CDN 缩短资源传输距离，但不要用 CDN 掩盖后端响应慢的问题。
- 对文字型站点优先使用系统字体，避免字体下载阻塞文本绘制。

### 3. 延迟首屏之外的内容

首屏之外的图片和 iframe 可以使用浏览器原生懒加载：

```html
<img
  src="/images/article-cover.webp"
  width="960"
  height="540"
  loading="lazy"
  decoding="async"
  alt="文章封面"
/>
```

这能减少初始请求数量，但不要对所有图片一刀切。是否懒加载取决于资源是不是首屏关键内容。

## 优化 INP：不要长时间占用主线程

一次交互通常包含三段时间：等待主线程、执行事件处理器、浏览器完成布局与绘制。任何一段过长，用户都会觉得按钮“没反应”。

### 1. 找出长任务

在 Chrome DevTools Performance 面板中录制一次真实操作，重点查看超过 50 毫秒的 Long Task。也可以在开发环境中临时监听：

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn('Long task:', Math.round(entry.duration), 'ms')
  }
})

observer.observe({ type: 'longtask', buffered: true })
```

### 2. 拆分大任务

不要在一次点击中同步完成所有计算。可以把非关键工作拆成小块，在浏览器有机会绘制之后继续：

```js
async function processItems(items) {
  const batchSize = 100

  for (let index = 0; index < items.length; index += batchSize) {
    processBatch(items.slice(index, index + batchSize))

    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
  }
}
```

如果计算本身非常重，应考虑 Web Worker。拆分代码只能给主线程喘息机会，并不会减少总计算量。

### 3. 控制渲染范围

- 长列表使用分页或虚拟滚动。
- 输入联想请求使用防抖，并取消过期请求。
- 避免因为一个局部状态变化而重新渲染整棵组件树。
- 不要在循环中交替读取布局信息和修改样式。
- 对不影响当前交互结果的统计、日志和预加载任务延后执行。

交互发生后，应尽快给用户可见反馈。即使后台任务还没有结束，也可以先更新按钮状态或显示轻量的处理中提示。

## 优化 CLS：提前为内容保留空间

CLS 的本质不是“页面发生了变化”，而是内容在用户没有预期时突然移动。

### 1. 明确媒体尺寸

为图片和视频提供尺寸或宽高比，浏览器才能在资源下载前预留空间：

```css
.article-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}
```

### 2. 为异步模块提供稳定容器

广告、推荐列表、评论和远程卡片都应该提前拥有最小高度。加载中的骨架屏必须与最终内容尺寸接近，否则骨架屏消失时仍然会产生位移。

```css
.recommendation-panel {
  min-height: 320px;
  contain: layout paint;
}
```

### 3. 避免在已有内容上方插入元素

提示条和活动横幅如果在页面加载后插入顶部，会把用户正在阅读的内容整体向下推。更好的方式是预留区域，或者把提示设计成不会改变文档流的覆盖层，同时确保它不会挡住主要操作。

## 动画只使用合成友好的属性

浏览器渲染大致经历 Style、Layout、Paint 和 Composite。动画 `width`、`height`、`top` 等属性往往会触发布局或绘制，而 `transform` 与 `opacity` 通常可以在合成阶段完成。

```css
.card {
  transition: transform 180ms ease, opacity 180ms ease;
}

.card:hover {
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

动画应该表达状态变化，而不是单纯增加装饰。还要尊重系统的“减少动态效果”设置。

## 建立性能预算

性能优化不能只靠发布前临时检查。可以在项目中定义一组可执行的预算：

| 项目 | 示例预算 |
| --- | ---: |
| 首屏 JavaScript（压缩后） | ≤ 170 KB |
| 首屏 CSS（压缩后） | ≤ 50 KB |
| 首屏图片总量 | ≤ 500 KB |
| 单个同步任务 | < 50 ms |
| Lighthouse Performance | ≥ 90 |

预算需要结合业务调整，但一定要能够在 CI 中自动检查。否则随着依赖和功能持续增加，性能通常只会缓慢退化。

## 一份可执行的检查清单

### 加载阶段

- [ ] 首屏 LCP 资源能从初始 HTML 中被发现。
- [ ] 首屏图片没有被错误地懒加载。
- [ ] 非关键 JavaScript 不阻塞 HTML 解析。
- [ ] 图片使用合适的格式、尺寸和响应式资源。
- [ ] 字体数量和字重得到控制。

### 交互阶段

- [ ] 点击和输入过程中没有明显长任务。
- [ ] 大量计算已拆分或移动到 Worker。
- [ ] 长列表没有一次性渲染全部内容。
- [ ] 用户操作能在 100 毫秒左右获得可见反馈。

### 稳定性

- [ ] 图片、视频和 iframe 都声明了尺寸。
- [ ] 异步内容拥有稳定的占位区域。
- [ ] 页面不会在已有内容上方突然插入模块。
- [ ] 动画主要使用 `transform` 和 `opacity`。

## 总结

前端性能优化不是寻找一条万能配置，而是理解时间花在哪里。围绕 LCP、INP 和 CLS 建立测量闭环后，每一次优化都会变得更可解释：你知道问题影响了谁、修改解决了什么、发布后是否真的改善。

先建立数据和预算，再处理最影响真实用户的瓶颈，通常比盲目追求一次满分更有价值。

## 参考资料

- [Web Vitals](https://web.dev/articles/vitals)
- [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [Optimize Interaction to Next Paint](https://web.dev/articles/optimize-inp)
- [Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [MDN：Lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)
