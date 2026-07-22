# 95y.github.io

基于 [Hexo](https://hexo.io/) 与 [Butterfly](https://github.com/jerryc127/hexo-theme-butterfly) 构建的个人博客。

## 分支约定

- `main`：Hexo 源码与 Markdown 文章
- `gh-pages`：`npm run build` 生成的静态网站，由 GitHub Pages 发布
- `legacy-static-2022`：重构前旧站的完整备份

## 本地开发

```bash
npm install
npm run dev
```

本地地址：<http://localhost:4000>

## 新建文章

```bash
npm run new -- "文章标题"
```

文章位于 `source/_posts`。

## 前端专题文章

- `前端年鉴`：从 2017 年 4 月 jQuery 开始，记录 2017–2026 的关键技术演进
- `前端排障`：整理事件循环、响应式、模块系统、缓存、水合与内存泄漏等常见难题
- 专题文章均为独立 Markdown 正文，直接在 `source/_posts` 中逐篇维护，不使用批量正文生成器

## 构建

```bash
npm run build
```

构建产物位于 `public`，不会提交到 `main`。

## 部署

```bash
npm run deploy
```

该命令会重新构建网站，并将 `public` 内容提交到远端 `gh-pages` 分支。
