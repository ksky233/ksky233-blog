# 第二篇文章 AI 头图生成记录

## 输出

```text
site/public/images/feishu-agent-service-layers.png
```

知识库母稿同步保存：

```text
E:\MyNotes\20_项目\内容输出\Agent技术博客\03_框架实践\Standalone-Agent-Application\assets\02-飞书AgentService\飞书AgentService五层结构-AI插图.png
```

生成方式：Codex 内置 ImageGen。

## Prompt

```text
Use case: infographic-diagram
Asset type: spacious editorial hero illustration for a Chinese technical blog article, wide landscape
Primary request: Illustrate the hidden engineering layers inside one independently deployed enterprise chat Agent Service. The viewer sees a simple chat message and answer, but underneath is a large five-layer software structure. The illustration should clearly communicate that business code is only one layer among Agent Definition, Channel, Runtime, and Platform code.

Visual structure:
- At the top, one simple chat bubble labeled 飞书消息 enters a clean Agent Service structure and a small answer bubble comes out.
- Below it, show one large cutaway software structure made of five wide horizontal layers. Each layer has generous height, large padding, a simple icon, one strong label, and a short list.
- Layer 1: 业务能力 — 业务规则 · 数据口径
- Layer 2: Agent Definition — Prompt · Graph · Tools
- Layer 3: Channel — Webhook · 身份 · 卡片
- Layer 4: Runtime — Session · Context · Streaming · Recovery
- Layer 5: Platform — 部署 · 日志 · 队列 · Secret
- Visually emphasize that 业务能力 is important but occupies only one of the five layers. Do not imply an exact percentage.
- Use large gaps between layers and generous surrounding negative space. Keep all information, but make it easy to scan.

Style/medium: minimalist editorial technical illustration, tactile paper-cut layers with subtle depth and clean geometric icons, calm and professional, visually illustrative rather than a SaaS dashboard
Background: deep desaturated blue-gray or charcoal-blue, clearly contrasting with the warm beige blog page
Color palette: off-white layer cards, muted blue and forest accents, coral highlight for the business layer, restrained shadows
Text (verbatim): "一个飞书 Agent Service"; "业务代码，只是其中一层"; "飞书消息"; "业务能力"; "业务规则 · 数据口径"; "Agent Definition"; "Prompt · Graph · Tools"; "Channel"; "Webhook · 身份 · 卡片"; "Runtime"; "Session · Context · Streaming · Recovery"; "Platform"; "部署 · 日志 · 队列 · Secret"
Constraints: preserve every listed layer and its items; generous padding and spacing; large readable typography; no fake percentage; no company logo; no product logo; no people; no robot mascot; no watermark; no invented labels
Avoid: crowded dashboard, tiny boxes, dense flowchart, HTML/CSS card look, cinematic landscape, mountains, city, machinery, server racks, cyberpunk, neon, excessive 3D, illegible Chinese
```
