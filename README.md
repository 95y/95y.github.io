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
