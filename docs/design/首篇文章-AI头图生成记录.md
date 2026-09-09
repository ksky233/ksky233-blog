# 首篇文章 AI 头图生成记录

## 当前采用：宽松信息插图版

```text
site/public/images/agent-application-vs-runtime-spacious.png
```

生成方式：Codex 内置 ImageGen，以极简概念图为视觉参考，恢复完整技术信息，并增加分区、卡片内边距和模块间距。

“极简”在这里指布局和装饰克制，不减少信息量。

### Prompt

```text
Use case: style-transfer
Asset type: spacious editorial technical infographic for a Chinese blog hero, wide landscape
Input image: preserve the calm cool blue-gray paper-cut illustration style, flat tactile shapes, clear two-route comparison, and color semantics from the reference. Increase the amount of technical information while keeping the layout visually minimal and spacious.

Primary request: Redesign into a complete but uncluttered comparison. “Minimal” means fewer decorative elements and generous padding, not less information. Preserve the full key architecture of both routes.

Layout:
- Large title at top: 两种 Agent 工程路线
- Two equally sized large route areas with very generous inner padding and wide gaps between modules.
- One shared entry at top may split into both routes, or each route may show its own entry.
- Left route has four clearly separated levels:
  1. 飞书 / Web / API / Event
  2. Channel Adapter / Agent API
  3. Agent Service containing three spacious modules: LangGraph / LangChain Runtime; Session / State / Memory; Tool Integration / Streaming / Observability
  4. 主要交付物：Agent Service 代码
- Right route has four clearly separated levels:
  1. 飞书 / Web / API / Event
  2. Agent Platform / Gateway
  3. 通用 Runtime containing three spacious modules: Pi / Other Agent Harness; Workspace / Instructions / Skills; Session / Tool / Capability Binding
  4. 主要交付物：Workspace + Skill + Binding
- Both routes flow to one shared Business API / Domain Systems destination.
- Bottom conclusion: 两边都独立部署，区别在主要交付物

Style/medium: minimalist editorial technical illustration, flat paper-cut geometry with subtle depth and texture, clear icons integrated into modules, not a dashboard, not HTML cards
Spacing: generous whitespace; large card padding; large gaps between levels; large readable type; no tiny text; no tightly nested frames; each module should breathe
Background: cool desaturated blue-gray, clearly contrasting with a warm beige website
Color palette: muted blue for the left route, muted forest green for the right route, off-white cards, small coral accent for shared entry and conclusion
Text: use exactly the labels listed above. Do not invent slogans, handwritten text, or decorative captions.
Constraints: preserve full technical meaning; all arrows clear and consistent; do not omit Session, State, Memory, Tool Integration, Streaming, Observability, Workspace, Instructions, Skills, or Capability Binding; no logos; no people; no robots; no watermark
Avoid: reducing information to only two objects, cinematic scenery, mountains, city, workshop scene, machinery, neon glow, cyberpunk, excessive 3D, dense nested boxes, tiny typography, illegible Chinese
```

## 未采用：过度场景化概念插图

```text
site/public/images/agent-application-vs-runtime-illustrated.png
```

生成方式：Codex 内置 ImageGen，全新生成，不以 HTML 图作为视觉参考。

### Prompt

```text
Use case: infographic-diagram
Asset type: editorial hero illustration for a Chinese technical blog article, wide landscape composition
Primary request: Create an original conceptual illustration about two ways to build an enterprise AI agent. Do not imitate a dashboard, flowchart, HTML card layout, or conventional architecture diagram. The image should feel illustrated and memorable while preserving clear technical meaning.

Visual concept:
- A single glowing chat message enters from the top center and splits into two broad, spacious paths.
- Left path represents building a complete custom Agent application: an open workshop-like machine assembled from code blocks, graph nodes, session memory, tool connectors, and a service shell. It should visibly communicate that the team builds and owns the whole Agent Service.
- Right path represents reusing a stable general-purpose Agent Runtime: a large robust engine/platform foundation already exists, while a few modular pieces labeled Workspace, Skill, and Binding plug cleanly into it. It should visibly communicate reuse and assembly on top of a mature Runtime.
- Both paths connect to the same simple business-system destination at the bottom, showing that the user-facing result may be similar.
- Use generous negative space and only a few major visual groups. The viewer should understand the contrast in three seconds.

Style/medium: sophisticated editorial technology illustration; slightly isometric, tactile paper-cut and soft 3D hybrid; strong illustrative character; elegant geometric forms; not photorealistic; not a UI mockup
Composition/framing: wide 3:2 or 16:10; left and right concepts large and separated; strong central split; minimal arrows; no dense nested boxes
Lighting/mood: calm, intelligent, exploratory; soft rim lighting and subtle depth
Color palette: deep desaturated midnight navy or blue-black background, noticeably different from a warm ivory website; muted electric blue for the custom-app route, luminous jade/teal for the reusable-runtime route, small warm coral accents; high contrast but not neon
Text (verbatim, large and minimal): "两种 Agent 工程路线"; "自建 Agent 应用"; "复用通用 Runtime"; "Agent Service"; "Workspace · Skill · Binding"
Constraints: preserve the technical distinction between a team-owned complete Agent Service and a reusable Runtime configured with Workspace, Skill, and Binding; content must not feel crowded; labels must be large and readable; no extra paragraphs; no company logos; no product logos; no people; no mascots; no watermark; no random code; no tiny technical text
Avoid: beige background, blog-card visual style, HTML/CSS look, SaaS dashboard, dense architecture diagram, many boxes, cyberpunk, excessive neon, server racks, literal robots, illegible Chinese, invented labels
```

## 上一版：低饱和结构图

上一版仍保留，当前不再由文章引用：

```text
site/public/images/agent-application-vs-runtime-ai.png
```

### Prompt

```text
Use case: style-transfer
Asset type: high-resolution landscape hero infographic for a Chinese technical blog article
Input image: Image 1 is the authoritative architecture and semantic reference. Preserve its two-column comparison, flow direction, distinctions, and all technical meanings.
Primary request: Redesign the reference as a polished AI-generated editorial infographic with richer visual depth, clearer hierarchy, larger readable labels, subtle vector-like icons, and premium publication quality. It must compare two independently deployed routes: a Standalone Agent Application on the left and a Hosted Workspace Runtime on the right.
Scene/backdrop: warm ivory paper background with a very subtle fine grid and quiet editorial texture
Style/medium: sophisticated low-saturation technology editorial illustration; clean vector-like geometry with restrained dimensionality; calm, modern, professional; visually compatible with a warm, quiet personal blog
Composition/framing: wide landscape; centered title; two balanced columns; muted blue-gray left, muted ink-green right, restrained wine-red for the shared conclusion; generous spacing; thick enough typography for web display
Text (verbatim): "都是飞书里的 Agent"; "自建 Agent Application，还是复用通用 Runtime？"; "Standalone Agent Application"; "Code-defined"; "团队独立开发完整 Agent Service"; "飞书 · Web · API · Event"; "Channel Adapter / Agent API"; "LangGraph / LangChain Runtime"; "Session · State · Memory"; "Tool Integration · Streaming · Observability"; "Agent Service 代码"; "Hosted Workspace Runtime"; "Workspace-defined"; "复用通用 Runtime 与平台能力"; "Agent Platform / Gateway"; "Pi / Other Agent Harness"; "Workspace · Instructions · Skills"; "Session · Tool / Capability Binding"; "Workspace + Skill + Binding"; "Business API / Domain Systems"; "两边都独立部署，区别在主要交付物"
Constraints: keep left and right flows technically accurate; all arrows point downward; render the exact text without invented labels; prioritize legibility over decoration; no company logos; no mascots; no people; no watermark; no tiny paragraphs; no neon colors; no dark background; no cyberpunk; no server rack imagery; no extra architecture layers; do not change the comparison to embedded application versus hosted worker
Avoid: illegible Chinese, spelling errors, excessive gradients, glossy SaaS dashboard look, busy background, saturated blue or green, fake code
```
