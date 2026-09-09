# ksky233 Blog｜Astro 使用速查

## 基本模型

```text
Markdown + Astro Components + Content Schema
                    ↓
               pnpm build
                    ↓
              静态 HTML/CSS
                    ↓
              GitHub Pages
```

Astro 默认在构建时生成页面。这个博客不需要运行服务端，也不需要数据库。

## 常用命令

进入 Astro 项目：

```powershell
cd E:\AI_Projects\MyProjects\ksky233-blog\site
```

开发：

```powershell
pnpm dev
```

类型与内容检查：

```powershell
pnpm check
```

正式构建：

```powershell
pnpm build
```

预览正式产物：

```powershell
pnpm preview
```

## 写一篇文章

在下面目录增加 Markdown：

```text
site/src/content/blog/<slug>.md
```

示例：

```yaml
---
title: "文章标题"
description: "列表、RSS 与 SEO 摘要。"
pubDate: 2026-09-08
originalDate: 2025-06-01
reviewedDate: 2026-09-08
contentStatus: current
series: "Agent 工程形态"
seriesOrder: 1
category: "Agent 工程范式"
tags:
  - Agent
  - Agent Runtime
featured: true
draft: true
heroImage: "/images/example.png"
---
```

开发模式会显示草稿并标注“草稿预览”；Production Build 会过滤 `draft: true`。

确认文章准备公开后，将：

```yaml
draft: false
```

## 图片

当前使用简单的公开静态目录：

```text
site/public/images/example.png
```

Markdown 或 Frontmatter 中写：

```text
/images/example.png
```

`public/` 中的文件会原样复制到 `dist/`，首版不额外引入图片 CDN。

## 页面路由

```text
site/src/pages/index.astro
→ /

site/src/pages/articles/index.astro
→ /articles/

site/src/pages/series/index.astro
→ /series/

site/src/pages/about.astro
→ /about/

site/src/pages/posts/[...id].astro
→ /posts/<Markdown 文件名>/
```

## 内容字段

字段定义位于：

```text
site/src/content.config.ts
```

如果 Markdown 缺少必填字段、日期无法解析、状态不在允许范围内，`pnpm check` 或 `pnpm build` 会失败。

日期语义：

- `pubDate`：本站首次公开日期；
- `originalDate`：原始笔记形成日期；
- `updatedDate`：文章实质修改日期；
- `reviewedDate`：最近技术复核日期。

内容状态：

- `current`：当前内容；
- `historical`：历史技术记录；
- `outdated`：主要实现已经过时，但保留参考价值。

## 样式修改

全局设计 Token 和正文样式：

```text
site/src/styles/global.css
```

页面组件：

```text
site/src/components/
site/src/layouts/
```

UI 修改遵循：

```text
docs/02-UI风格规范.md
```

## 发布

```text
git push origin main
→ .github/workflows/pages.yml
→ 构建 site/
→ 上传 site/dist/
→ GitHub Pages
→ https://blog.dearloom.me
```

首次发布前仍需在 GitHub Pages 和 DNS 后台完成自定义域名配置。
