---
title: "Tailwind CSS 4 与 CRA 退场：工具链继续现代化"
date: 2025-02-14 09:00:00
tags:
  - 前端年鉴
  - 前端工具链
  - 2025
categories:
  - 前端年鉴
description: "Tailwind 4 与 CRA 退场都在提醒我们默认会过期：一边做样式视觉迁移，一边重新选择 React 项目架构。"
cover: /img/covers/frontend-chronicle-tailwind-4-and-cra-sunset.svg
top_img: /img/covers/frontend-chronicle-tailwind-4-and-cra-sunset.svg
toc: true
---
2025 年初有两个很有时代感的变化：Tailwind CSS 4 把更多配置带回 CSS，并用新的引擎重做构建路径；React 团队正式停止推荐 Create React App 创建新项目。一个是样式工具主动拥抱现代 CSS，另一个是曾经的“零配置脚手架”不再能代表 React 应用的默认答案。

它们不是同一个技术事件，却都提醒我：默认工具会过期。迁移不能靠重新运行最新初始化命令，而要先找出旧项目到底依赖了哪些隐式行为。

## Tailwind 4 的主题从 JavaScript 回到 CSS

旧项目常在 `tailwind.config.js` 扩展主题：

```js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#2563eb',
          600: '#1d4ed8'
        }
      }
    }
  }
}
```

Tailwind 4 的 CSS-first 配置可以直接声明主题变量：

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.623 0.214 259.8);
  --color-brand-600: oklch(0.546 0.245 262.9);
  --font-display: "Noto Sans SC", sans-serif;
  --breakpoint-3xl: 120rem;
}
```

这些变量不仅生成工具类，也可以在普通 CSS 中使用：

```css
.article-link {
  color: var(--color-brand-600);
}
```

设计 token 与 CSS 变量更接近，运行时主题和组件库共享也更自然。但不是把 JS 配置复制成 `@theme` 就完成，插件、动态 class、旧浏览器和 PostCSS 管道都要检查。

## 动态拼类名仍然是内容扫描的敌人

```jsx
// 构建器很难从任意拼接推导全部结果
<button className={`bg-${color}-500`} />
```

改成完整字符串映射：

```jsx
const buttonColor = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white'
}

<button className={buttonColor[variant]} />
```

这不仅帮助 Tailwind 发现类名，也让组件允许哪些 variant 成为显式 API。升级引擎不会让运行时任意字符串自动变成 CSS。

## Tailwind 升级先做“截图”，后做“清理”

样式迁移最怕构建成功、页面却悄悄变了。我们选登录、表单、表格、弹窗、文章排版和深色模式做基线截图，再升级依赖。重点检查：

- Preflight 基础样式是否改变表单和标题；
- border、ring、shadow 等默认语义；
- 自定义 plugin/utilities 是否还被支持；
- 任意值与旧 opacity 写法；
- CSS import 顺序和组件库覆盖；
- 目标浏览器是否支持生成的现代 CSS。

先让视觉等价，再利用 container query、现代颜色等新能力。一次 PR 同时升级并重设计，很难审核每个像素差异来自哪里。

## CRA 的问题不是项目突然不能运行

React 团队停止推荐 CRA，并不意味着所有 `react-scripts` 应用当天报废。已有项目可以继续运行，但脚手架的依赖和默认构建链不再是新项目推荐路径，长期安全与兼容更新需要规划。

我们先扫描 CRA 项目的隐式依赖：

```text
REACT_APP_* / process.env
PUBLIC_URL
src/setupProxy.js
Jest 配置与 jsdom
SVGR 的 ReactComponent 导入
CSS Modules 命名
serviceWorker / manifest
开发服务器 history fallback
```

这些才是迁移成本。把 `react-scripts start` 改成 `vite`，环境变量和 SVG 导入就可能先坏。

## 先决定项目需要“框架”还是“构建工具”

CRA 退场后没有唯一替代。React 官方建议新项目优先考虑能提供路由、数据获取、代码分割和部署集成的框架；如果应用不需要这些，可以选择 Vite、Parcel、Rsbuild 等构建工具。

我们用问题选，而不是按热度：

1. 是否需要 SEO/SSR/静态生成？
2. 路由和数据缓存是否希望由框架统一？
3. 是否只是嵌入已有后端的 SPA/微前端？
4. 部署平台是否支持服务器运行时？
5. 团队是否有大量 webpack 定制？

纯内部后台选择 Vite SPA；内容站选择全栈 React 框架；嵌入式小组件继续使用库模式构建。三个 React 项目不必有同一个答案。

## 一个 CRA 到 Vite 的实际改动

环境变量：

```diff
- const apiBase = process.env.REACT_APP_API_BASE
+ const apiBase = import.meta.env.VITE_API_BASE
```

HTML 入口从 `public/index.html` 模板进入项目根并显式加载模块：

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

测试不一定必须同时迁到 Vitest。我们第一阶段保留现有 Jest，用单独配置运行；构建稳定后再评估测试器，避免一次变更跨过开发、构建、测试和样式四条链。

`setupProxy.js` 则迁到 Vite server proxy，但要明确它只服务本地开发，生产反向代理仍由部署层配置。

## “弹出配置”不再是最后退路

CRA 时代，遇到深度配置常考虑 eject，一旦 eject 就接管整套 webpack/Babel 配置。迁移到更直接的构建工具后，配置可见、插件可替换，但也意味着团队自己负责升级。

透明并不自动等于简单。我们给自定义项写原因：为什么需要、谁消费、如何测试、何时能删除。不然几年后又会形成另一份没人敢动的配置。

## 两次迁移的共同原则

Tailwind 4 与 CRA sunset 表面一个关于 CSS，一个关于脚手架，实际迁移方法很相似：

- 先列出旧默认替你做了什么；
- 保存构建、视觉和用户路径基线；
- 先实现行为等价，再使用新能力；
- 将隐式配置改成明确契约；
- 不为统一技术栈强迫不同产品选择同一架构。

现代 CSS 让 Tailwind 可以把更多能力交还浏览器，现代 React 项目则需要在框架与构建工具之间做架构选择。默认值减少并不是倒退，而是生态成熟后问题被分得更清楚。我们要做的，是让每个项目的选择有理由、有测试、也有下一次迁移的出口。

## 资料

- [Tailwind CSS v4.0 发布说明](https://tailwindcss.com/blog/tailwindcss-v4)
- [React：Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- [React：Creating a React App](https://react.dev/learn/creating-a-react-app)
