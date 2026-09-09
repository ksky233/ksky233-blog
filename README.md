# ksky233-blog

基于 Astro 构建的个人技术博客，主要记录 Agent 工程、Runtime 以及真实项目中的技术实践。

- 博客：[blog.dearloom.me](https://blog.dearloom.me)
- 个人主页：[dearloom.me](https://dearloom.me)
- RSS：[blog.dearloom.me/rss.xml](https://blog.dearloom.me/rss.xml)

## 已发布文章

1. [都是飞书里的 Agent：自建 Agent 应用，还是复用通用 Runtime？](https://blog.dearloom.me/posts/agent-application-vs-runtime/)
2. [一个飞书 Agent Service，到底有多少代码不属于业务？](https://blog.dearloom.me/posts/feishu-agent-service-non-business-code/)
3. [Agent Runtime 不只是一段 Loop：复用 Pi，究竟复用了什么？](https://blog.dearloom.me/posts/pi-runtime-beyond-agent-loop/)

## 本地开发

```bash
cd site
pnpm install
pnpm dev
```

生产构建：

```bash
cd site
pnpm build
```

## 发布文章

文章位于 `site/src/content/blog/`。确认 Frontmatter 中 `draft: false`，完成本地构建后提交到 `main`：

```bash
git add site
git commit -m "content: publish article"
git push
```

GitHub Actions 会自动构建并发布到 GitHub Pages。

## 项目文档

- [Astro 博客搭建指南](docs/01-Astro博客搭建指南.md)
- [UI 风格规范](docs/02-UI风格规范.md)
- [Astro 使用速查](docs/03-Astro使用速查.md)

站点 UI 采用“安静质感”风格。自定义域名 `blog.dearloom.me` 已接入 GitHub Pages，并启用 HTTPS。
