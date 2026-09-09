# ksky233 Blog｜Astro 搭建指南

- 目标域名：`https://blog.dearloom.me`
- GitHub Repository：`ksky233/ksky233-blog`
- 本地路径：`E:\AI_Projects\MyProjects\ksky233-blog`
- 技术方案：Astro Static Output + Markdown Content Collection + GitHub Pages
- UI 基准：[安静质感](02-UI风格规范.md)
- 当前状态：站点代码已开始实施，本指南继续保留整体搭建与发布流程

## 0. 十步快速路线

```text
1. 检查 Node >= 22.12 与 pnpm
2. pnpm create astro@latest site --template blog --install --no-git
3. cd site && pnpm dev
4. 建立 src/content.config.ts 与 src/content/blog/
5. 先写一篇真实 Markdown，完成首页和文章布局
6. 添加 @astrojs/rss 与 @astrojs/sitemap
7. astro.config.mjs 设置 https://blog.dearloom.me
8. public/CNAME 写入 blog.dearloom.me
9. 增加根目录 Pages Workflow，完成本地 build/preview
10. GitHub Pages、Cloudflare CNAME、Enforce HTTPS，最后给主页增加 Blog 入口
```

首次实施按上述顺序推进；遇到具体步骤时再阅读对应章节。

## 1. 目标结构

```text
ksky233-blog/
├── docs/
│   └── 01-Astro博客搭建指南.md
├── site/                         # Astro Project Root
│   ├── public/
│   │   └── CNAME
│   ├── src/
│   │   ├── components/
│   │   ├── content/blog/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── content.config.ts
│   ├── astro.config.mjs
│   ├── package.json
│   └── pnpm-lock.yaml
├── .github/workflows/pages.yml
└── README.md
```

仓库根目录负责 Git、Workflow 与手册；`site/` 是独立 Astro Root。后续 Pages Action 只构建 `site/`。

## 2. 环境检查

Astro 当前要求 Node.js `22.12.0` 或更高的受支持偶数版本。建议使用 Node 22 LTS 与当前 pnpm。

```powershell
node --version
pnpm --version
```

如果项目通过 Corepack 管理 pnpm：

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

## 3. 初始化 Astro Blog

进入仓库根目录：

```powershell
cd E:\AI_Projects\MyProjects\ksky233-blog
```

在尚不存在的 `site/` 目录生成 Blog Template：

```powershell
pnpm create astro@latest site --template blog --install --no-git
```

参数含义：

| 参数 | 作用 |
|---|---|
| `site` | 把 Astro Project 放入仓库的 `site/` |
| `--template blog` | 使用官方 Blog Starter |
| `--install` | 初始化后安装依赖 |
| `--no-git` | 复用仓库根目录现有 Git |

如果 CLI 仍进入交互模式：

```text
Template             Blog
Install dependencies Yes
Initialize Git       No
TypeScript           Strict
```

初始化后检查：

```powershell
cd site
pnpm dev
```

浏览器打开：

```text
http://localhost:4321
```

首次运行只确认 Starter 能启动，随后再开始替换页面和样式。

## 4. 首版功能范围

实现：

- Blog 首页；
- Featured Articles；
- 全部文章列表；
- Markdown 文章详情页；
- 发布时间、更新时间与标签；
- Draft 过滤；
- RSS；
- Sitemap；
- 404；
- 移动端排版；
- 返回 `dearloom.me` 的主页入口；
- GitHub Pages 自动发布。

首版暂缓：

- CMS 与数据库；
- 登录与管理后台；
- 评论系统；
- 全文搜索；
- 浏览量统计；
- MDX 组件文章；
- 动态 SSR Adapter。

## 5. Content Collection

推荐将文章放在：

```text
site/src/content/blog/
```

建立 `site/src/content.config.ts`：

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

Content Collection 负责统一 Frontmatter、生成类型并在 Build 阶段校验文章元数据。

## 6. 文章模板

示例 `site/src/content/blog/retrieval-unit.md`：

```markdown
---
title: "RetrievalUnit：结构化 RAG 的索引身份"
description: "为什么多视图检索需要独立的 Source、View 与 Target。"
pubDate: 2026-09-08
updatedDate: 2026-09-08
tags:
  - RAG
  - Retrieval
featured: true
draft: false
---

正文从这里开始。
```

发布规则：

- `featured: true` 进入精选区域；
- `draft: true` 在 Production Build 中过滤；
- 文件名作为稳定 Slug，发布后尽量保持；
- `description` 用于列表摘要、SEO 与 RSS；
- `updatedDate` 只在文章有实质更新时修改。

## 7. 页面职责

建议保留以下页面：

```text
src/pages/index.astro              Blog 首页
src/pages/posts/[...id].astro      文章详情静态路由
src/pages/rss.xml.js               RSS
src/pages/404.astro                404
```

组件：

```text
src/components/SiteHeader.astro
src/components/ArticleCard.astro
src/components/TagList.astro
src/components/SiteFooter.astro
```

布局：

```text
src/layouts/BaseLayout.astro
src/layouts/ArticleLayout.astro
```

`index.astro` 使用 `getCollection("blog")`：

1. 过滤 `draft`；
2. 按 `pubDate` 倒序；
3. 将 `featured` 文章放入精选区域；
4. 其余进入全部文章列表。

`[...id].astro` 使用 `getStaticPaths()` 为每篇非 Draft 文章生成静态 URL。

## 8. RSS 与 Sitemap

进入 Astro Root：

```powershell
cd E:\AI_Projects\MyProjects\ksky233-blog\site
```

添加 RSS：

```powershell
pnpm add @astrojs/rss
```

添加 Sitemap：

```powershell
pnpm astro add sitemap
```

RSS 使用 `getCollection("blog")` 生成，并过滤 Draft。Sitemap Integration 会在 Production Build 中生成站点 URL 清单。

## 9. Astro 配置

自定义域名部署时，`site/astro.config.mjs` 设置正式域名，不设置 Repository Base Path：

```js
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://blog.dearloom.me",
  integrations: [sitemap()],
});
```

该 `site` 值用于 Canonical URL、Sitemap 和 RSS 链接。

## 10. Custom Domain 文件

建立 `site/public/CNAME`：

```text
blog.dearloom.me
```

`public/` 内容会原样进入 Astro `dist/`。

## 11. GitHub Pages Workflow

在仓库根目录创建 `.github/workflows/pages.yml`：

```yaml
name: Deploy blog to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - "site/**"
      - ".github/workflows/pages.yml"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Build and upload Astro site
        uses: withastro/action@v6
        with:
          path: site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

Workflow 读取 `site/pnpm-lock.yaml`，安装依赖、执行 Astro Build、上传 `dist/` 并发布 Pages。

## 12. 发布前本地检查

```powershell
cd E:\AI_Projects\MyProjects\ksky233-blog\site

pnpm build
pnpm preview
```

检查：

- 首页和文章路由；
- Draft 未进入产物；
- RSS 与 Sitemap 可访问；
- 手机宽度无横向滚动；
- 站内链接使用正式路径；
- `dist/CNAME` 存在；
- `dist/` 中不存在源 Markdown、密钥和个人笔记原路径。

## 13. GitHub 与 Cloudflare

### GitHub

Repository：

```text
Settings
→ Pages
→ Build and deployment
→ Source: GitHub Actions
```

Custom Domain：

```text
blog.dearloom.me
```

`dearloom.me` 已完成账号级验证，因此其直接子域名也在保护范围内。

### Cloudflare

先在 GitHub 保存 Custom Domain，再添加：

```text
Type     CNAME
Name     blog
Target   ksky233.github.io
Proxy    DNS only
TTL      Auto
```

GitHub 证书完成后启用：

```text
Enforce HTTPS
```

## 14. 接入项目主页

博客 HTTPS 验收完成后，再修改 `ksky233.github.io`：

```text
Header → Blog ↗ → https://blog.dearloom.me
```

可选增加一块轻量入口：

```text
SELECTED WRITING
围绕 RAG、Agent Infrastructure 与 Python 工程的实践记录。
```

主页只展示精选文章标题和摘要，完整文章列表留在 Blog Site。

## 15. 日常发文流程

```powershell
cd E:\AI_Projects\MyProjects\ksky233-blog

# 在 site/src/content/blog/ 新增或修改 Markdown
cd site
pnpm build
cd ..

git status
git add site
git commit -m "content: publish <article-slug>"
git push origin main
```

Push 后观察 GitHub Actions，成功后检查：

```text
https://blog.dearloom.me
https://blog.dearloom.me/posts/<slug>
https://blog.dearloom.me/rss.xml
https://blog.dearloom.me/sitemap-index.xml
```

## 16. 内容发布检查

- 从个人笔记复制文章前移除内部路径、账号、Token、截图隐私和未公开业务信息；
- 引用外部资料时保留来源；
- 图片确认版权与压缩结果；
- 标题、摘要与正文结论保持一致；
- 技术版本和时效性内容写明验证日期；
- 发布后从手机网络检查一次；
- 文章修改保留 `updatedDate`，避免覆盖原发布时间。

## 17. 推荐实施顺序

```text
1. 初始化 site/ Astro Blog
2. 保留一篇 Starter，跑通 dev/build
3. 建立 Content Collection Schema
4. 完成 Blog 首页与 Article Layout
5. 写入 1 篇真实文章验证排版
6. 增加 RSS、Sitemap、404
7. 添加 Pages Workflow 与 CNAME
8. 本地 Build/Preview
9. GitHub Pages + Cloudflare
10. HTTPS 完成后再给 dearloom.me 增加 Blog 入口
11. 扩充到 3～5 篇精选文章
```

## 18. 参考资料

- [Install Astro](https://docs.astro.build/en/install-and-setup/)
- [Astro Markdown](https://docs.astro.build/en/guides/markdown-content/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro RSS](https://docs.astro.build/en/recipes/rss/)
- [Astro GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
