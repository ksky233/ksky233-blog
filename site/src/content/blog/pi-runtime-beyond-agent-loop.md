---
title: "Agent Runtime 不只是一段 Loop：复用 Pi，究竟复用了什么？"
description: "沿着 Agent Loop、Session Tree、Compaction、Tool Event、ResourceLoader、Extension、Skill 与 SDK/RPC，逐层说明接入 Pi 后交给 Runtime 的能力。"
pubDate: 2026-09-08
originalDate: 2026-09-08
reviewedDate: 2026-09-08
contentStatus: current
series: "Agent 工程形态"
seriesOrder: 3
category: "Runtime 工程"
tags:
  - Agent
  - Agent Runtime
  - Pi
  - Harness
  - Context Engineering
featured: false
draft: false
heroImage: "/images/pi-runtime-beyond-loop.png"
---

> 把自建 Agent Service 里的 `while` 循环换成 Pi，只替换了最显眼的一层。Session、Context、Tool、Event、Resource、Extension，这些跟执行缠在一起的生命周期，才是接入 Runtime 时一并交出去的东西。

## 一段 Loop 解释不了长期运行

上一篇已经把一条飞书消息背后的代码分成了 Domain、Agent Definition、Channel、Runtime 和 Platform。沿着那条调用链继续往里看，会发现 Runtime 很容易被缩成一段 Agent Loop。

我们聊 Runtime，很容易盯着 Agent Loop。毕竟它几行代码就能把 Agent 的原理讲清楚。

```python
messages = [system_prompt, user_message]

while True:
    response = model.generate(messages, tools=tools)
    messages.append(response)

    if not response.tool_calls:
        return response.text

    for call in response.tool_calls:
        result = execute_tool(call)
        messages.append(tool_result(call, result))
```

这段 Loop 的确抓住了 Agent 的核心机制。

```text
模型判断下一步
→ 调用工具
→ 观察结果
→ 继续推理
→ 直到给出答案
```

可这只解释了 Agent 怎么跑起来。至于它怎么跑过第二轮、第二天，甚至换台机器继续跑，这几行代码一句都没说。

接进真实应用以后，麻烦很快就来了。用户在 Tool 执行到一半时又发来消息，这轮要继续还是取消？服务重启了，Session 从哪里恢复？历史越来越长，下一轮究竟带哪些内容？

再往后还有 Tool Result 格式、模型切换、取消与重试、项目文件加载、已有 Session 兼容。任何一项都不在那段 `while` 里，但每个准备长期运行的 Agent 都绕不过去。

团队只要在每个 Agent Application 里重新回答一遍这些问题，就仍然在维护自己的 Runtime。有没有亲手写那段 Loop，反倒没那么重要。

## Loop 往外，还有一圈运行时工作

「Agent Runtime」目前还没有边界完全统一的定义。不同项目可能把模型调用库、Workflow Engine、Agent Harness，甚至整套托管平台都叫作 Runtime。

这篇文章暂时只讨论下面这层。

> 承接 Agent 一次或多次执行，并统一管理 Session、Context、Tool、Event、Recovery 与扩展生命周期的运行环境。

可以暂时把它画成三层。

```text
┌──────────────────────────────────────────────┐
│ 接入与定制：SDK / RPC / Skill / Extension   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Runtime 语义                           │  │
│  │ Session / Context / Tool / Event       │  │
│  │ Compaction / Retry / Cancellation      │  │
│  │                                        │  │
│  │       ┌──────────────────────┐         │  │
│  │       │ Model ↔ Tool Loop    │         │  │
│  │       └──────────────────────┘         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

Loop 仍然重要，但它只是最里面的一圈。

接入一套 Runtime，少写几十行模型调用代码只是表面收益。更麻烦的状态和生命周期也有了统一实现，这才会拉开长期维护成本的差距。

## 拿 Pi 当一个现成样本

Pi 官方把自己称为一个最小化的终端 Coding Harness。它没有试图在内核里塞入 Sub-agent、Plan Mode、MCP 或复杂的权限体系，而是把更多能力留给 Extension、Skill、Prompt Template 和 Package。

它的内核不大，扩展面却很清楚。用它来对照一套自建 Agent Service，比较容易看见团队少维护了哪些东西。

这里说的复用 Pi，也不局限于直接打开 TUI。Pi 提供 SDK、RPC 和 JSON 事件流，可以嵌入其他应用，也可以作为无头进程运行。

它首先是一个 Coding Agent，但它暴露出来的 Runtime 结构，对通用 Agent 工程也有参考价值。

## Loop 只是最里面的一圈

最直接的复用当然是 Agent Loop。

Runtime 负责把模型响应、Assistant Message、Tool Call 与 Tool Result 串成一个合法的执行过程。应用不用再反复处理下面这段流程。

```text
模型调用
→ 解析工具请求
→ 执行工具
→ 回填结果
→ 再次调用模型
→ 判断结束
```

这部分最像 Agent 的发动机，工程量却未必最大。发动机每转一圈，都要和 Session、Context、Tool 状态、用户输入队列以及外部事件对齐。只拿走 Loop，其他状态仍由应用各管各的，Runtime 边界还是散的。

## Session 不能只是一组 messages

长期运行的 Agent 需要一个会持续变化的 Session。一轮请求里的 `messages` 数组远远不够。

Pi 的 `AgentSession` 管理消息历史、模型状态、生命周期、Compaction 和事件。它的 Session 文件使用 JSONL 保存，并通过 `id` 与 `parentId` 形成一棵树。

Session 的形态也随之变了。

```text
Session 不再只是一条不断追加的聊天列表，
而是一个可以分支、回到旧节点、继续演化的执行历史。
```

当用户从某个历史节点创建新分支时，原来的路径不必被覆盖；切换分支时，Runtime 也能找到当前路径应该投影出的 Context。

所以 Pi Session 做的不只是「帮我把聊天记录写进文件」。持久化格式、Entry 类型和父子关系、当前叶节点、分支导航、模型切换记录，连扩展状态挂在哪里，它都已经作出了选择。以后格式升级，兼容责任也由这套 Session 协议接住。

团队自己实现也完全可行，只是 Session Schema 一旦上线，很快就会变成一份要维护很多年的数据协议。

## Session 保存历史，Context 决定本轮输入

Session 保存「发生过什么」，Context 决定「这一轮让模型看到什么」。两者用途不同。

一个简单实现会把所有历史消息直接放进模型上下文。但随着 Session 变长，团队必须作出更多选择。当前分支要读哪些历史，Tool Result 要不要完整保留，大文件和长日志怎么截，什么时候开始压缩，都得有人定规则。从旧节点切出新分支以后，还多了一个问题，遗漏的那段路径该怎样概括。

Pi 对长上下文提供 Compaction，并在分支导航场景中使用 Branch Summary。它会生成结构化摘要，再让后续执行建立在摘要与近期上下文之上。单纯删掉旧消息不够。

复用 Pi 时，这条投影链也跟着进来了。

```text
完整 Session Tree
→ 选择当前分支
→ 读取相关 Entry
→ 注入系统与项目上下文
→ 必要时进行 Compaction
→ 形成当前模型 Context
```

这条链路直接影响 Agent 是否「记得住」、会不会重复劳动，以及长任务进行到后半段时还能不能理解自己的目标。

这部分更适合放进 Runtime 核心。笼统地归进 Prompt 工程，会漏掉太多状态问题。

## Tool 也有自己的运行时

把一个函数注册给模型，并不等于拥有完整的 Tool Runtime。

一次工具调用周围，至少还有下面这些环节。

```text
Tool Schema
Tool Call Start
参数校验
执行与增量输出
Tool Call End
错误与取消
结果写回 Session
事件通知 UI 或宿主应用
```

Pi 的 Session 会发出 Agent、Message、Tool、Compaction、Retry 等事件。Extension 也可以在工具调用前后拦截事件、修改参数、拒绝危险操作，或者追加自己的日志和状态。

宿主应用不用解析终端文本来猜 Agent 正在做什么。订阅结构化事件，再映射成自己的产品反馈就可以。

```text
Runtime Tool Event
→ 宿主统一事件
→ 飞书卡片 / Web UI / Trace
```

这里很容易越界。Runtime 可以统一工具的执行协议，但它天然没有业务权限。

例如 `refund_order` 能不能执行，最终仍应由订单系统根据用户、租户、订单状态和审批规则判断。Prompt 或本地 Extension 没有资格单独拍板。

## Workspace 也需要约定

Agent 的行为并不只由一段 System Prompt 决定。项目级说明、当前工作目录、Skill、Extension、Prompt Template、设置、模型配置和凭据引用，都会影响同一轮执行。

Pi SDK 中的 `ResourceLoader` 会负责发现和加载这些资源。默认实现可以沿当前工作目录查找项目资源，同时加载 Agent 目录中的全局配置、凭据和 Session。

这给 Agent 定下了一套 Workspace 约定。

```text
给定 cwd 与 agentDir
→ 找到项目上下文
→ 加载可用 Skill 和 Extension
→ 合并 Prompt 与配置
→ 创建可运行的 AgentSession
```

没有这层约定，每个 Agent Service 都要重新定义资源放在哪里、什么时候加载、怎样覆盖、怎样升级。等这些规则散进几个项目，再想做可迁移的 Agent Definition 就很费劲了。

## Skill、Extension 和 Package 各管一类变化

Runtime 把所有东西都内置，迟早会长成一个难升级的平台；留得太空，业务团队又会回到复制粘贴。Pi 把不同变化放到了几种扩展面上。

### Skill，给 Agent 的可发现操作手册

Skill 更接近可按需加载的知识和流程。启动时先暴露名称与描述，Agent 需要时再读取完整的 `SKILL.md`，属于 Progressive Disclosure。

具体任务的操作步骤、项目约定、工具用法和领域工作方法，都可以放进 Skill。需要复用的任务模板也适合放在这里。

这样不必把所有说明都塞进 System Prompt，也不需要为了改一段工作方法去修改 Runtime 内核。

### Extension，修改 Runtime 的行为

Extension 更靠近代码和生命周期。它可以注册新工具，监听或拦截事件，也可以修改工具调用、注入上下文、自定义 Compaction。需要保存扩展状态、增加命令和界面交互，或者接入权限门与路径保护时，也要从这里动手。

Skill 主要告诉 Agent「怎样工作」，Extension 则可以改变 Runtime「怎样运行」。

### Package，把一组能力发出去

Package 可以把 Extension、Skill、Prompt 和 Theme 组合起来，再通过 npm 或 Git 分发。

Package 关心能力怎样跨 Workspace、跨团队复用。

```text
Runtime Core 保持较小
能力通过 Package 组合
Agent 通过 Workspace 选择所需能力
```

当然，Extension 和 Package 都是本地可执行代码，安装它们等于授予相应系统权限。扩展模型带来复用，也把供应链审查、版本锁定和隔离问题带到了平台侧。

## SDK 和 RPC 把 TUI 从 Runtime 里拆开

如果 Pi 只能运行在终端里，它很难成为其他 Agent 产品的 Runtime。

Pi 给了三种层级不同的接入方式。

| 接口 | 适合什么场景 | 宿主获得什么 |
| --- | --- | --- |
| SDK | TypeScript 应用内深度嵌入 | 直接创建和控制 `AgentSession`，订阅事件，自定义资源加载 |
| RPC | 跨语言或独立进程托管 | 通过 stdin/stdout 发送 JSON 命令并接收响应、事件 |
| JSON Event Stream | 自动化和事件消费 | 读取结构化运行过程，不依赖终端渲染 |

把 Pi 接入飞书，不等于让用户远程操作一个终端。链路可以长这样。

```text
飞书 Gateway
→ 用户与 Session 映射
→ Pi SDK / RPC
→ AgentSession
→ Tool / Skill / Extension
→ Runtime Event
→ 飞书卡片更新
```

飞书仍然是 Channel，Gateway 仍然负责消息协议和身份，Pi 负责 Agent 的执行语义。

整个业务应用还在。被替换掉的，是应用内部反复搭建的 Agent Application Shell。

## 把这些责任放回一张表里

到这里再回看标题，答案就比较清楚了。

| 能力 | 只写 Loop 时谁负责 | 复用 Pi 后主要由谁负责 |
| --- | --- | --- |
| 模型—工具循环 | Agent 项目 | Pi Core |
| 消息与模型状态 | Agent 项目 | `AgentSession` |
| Session 持久化与分支 | Agent 项目 | Session JSONL / Tree |
| Context 选择与压缩 | Agent 项目 | Context Projection / Compaction |
| Tool 生命周期与事件 | Agent 项目 | Runtime Event + Extension |
| 项目资源发现 | Agent 项目 | `ResourceLoader` / Workspace 约定 |
| 工作方法与任务知识 | Prompt 或业务代码 | Skill |
| Runtime 行为定制 | Fork 框架或散落的 Hook | Extension |
| 能力组合与分发 | 各项目复制 | Package |
| 嵌入宿主应用 | 自定义封装 | SDK / RPC / JSON Stream |

更值得关注的是责任怎么转移。

> 团队不再拥有每一个底层状态和生命周期的实现，只需要遵守 Runtime 的协议，并在扩展点上交付差异。

当然，这不是白拿。团队也接受了 Pi 的 Session Schema、事件模型、资源约定、扩展 API 和升级节奏。

## Pi 接不走的那部分

Pi 可以当作可复用 Runtime 来研究，但还撑不起完整的企业 Agent 基础设施。有几块责任始终留在外面。

### Channel、身份和业务权限

飞书 Webhook、消息解密、卡片更新、Web UI、语音入口和通知协议，不属于 Pi Runtime 的核心职责。

谁在使用 Agent、属于哪个租户、可以访问什么数据、能否执行高风险操作，仍需由身份系统与业务服务裁决。

客户、订单、工单和审批的权威状态不能只保存在 Session 中。事务、幂等和领域不变量也不能交给模型自由解释。

### Control Plane 还在更外面

企业拥有多个 Agent 后，还需要 Agent Registry、版本发布、Run Queue、调度、Worker Pool、配额、审计、成本与可观测性。这些是平台控制面，不会因为有了一个 Runtime 自动出现。

### Session 恢复不了整个世界

一个 Session 文件能恢复执行历史，却不等于能在任意机器上冷重建同一个 Agent。

Workspace 还可能依赖下面这些东西。

```text
Runtime 与 Package 版本
全局 Skill / Extension
环境变量
系统工具
文件权限
凭据引用
网络能力
外部服务状态
```

可迁移的 Hosted Agent 还得显式记录 Runtime Image、依赖清单、Capability Profile、Credential Reference 与 Workspace Manifest。

Session 可以告诉我们某个 Tool 曾被请求，但服务崩溃时，外部支付、发信或工单操作究竟有没有成功，不能只靠重放聊天记录判断。高风险 Tool 仍要实现幂等键、状态查询和补偿机制。

所以 Pi 复用的是 Agent 执行环境。企业软件那些麻烦，只是被重新划清了边界，并没有消失。

## Pi 与 LangGraph 没必要二选一

前一篇文章以 LangGraph 项目为例，讨论了自建 Agent Service 周围的重复代码。这里很容易顺手得出一个结论，既然可以复用 Pi，就不该再用 LangGraph。这样比较有点省事过头了。

两者解决问题的重心不同。

LangGraph 是面向长时间、有状态 Agent 的低层 Orchestration Framework 与 Runtime，强调显式状态、节点与边、Durable Execution、Persistence 和 Human-in-the-loop。它适合团队精确表达一条可控的业务流程。

Pi 更像一套已经可以直接工作的 Coding Harness。Session、Context、资源加载、交互和扩展模型都已经围绕开放式 Agent Loop 组装好了。

选择时可以先粗略地看任务形态。

| 场景 | 更值得优先观察的方向 |
| --- | --- |
| 流程结构明确，需要强状态和确定性节点 | LangGraph / Workflow Runtime |
| 开放式长任务，需要文件、工具、Skill 与持续 Session | Pi 一类 Harness |
| 需要快速建立多个相似 Agent Workspace | 通用 Runtime + Workspace |
| 业务流程与开放式 Agent 同时存在 | 把两者组合起来 |

一种可能的组合是让 Pi 负责用户侧 Agent Session 与通用工具循环，某个 Tool 再调用由 LangGraph 编排的领域 Workflow。反过来，LangGraph 节点也可以通过独立 Runtime 执行一个开放式研究任务。

框架名字替代不了架构边界。落到项目里，需要先回答这几个问题。

```text
哪些状态属于确定性业务流程？
哪些状态属于开放式 Agent Session？
哪一层由谁长期维护？
```

## 哪些项目会先吃到这份复用

Pi 当然不会适合所有 Agent。要是一个团队已经在几个项目里重复实现 Session、Context、Tool Event 和 Streaming，就值得拿它试一次。尤其是下面这类项目。

- Agent 主要完成开放式长任务，固定业务流程占比较少；
- 文件与 Workspace 是任务上下文的重要组成部分；
- Skill 和工具改得很勤，Runtime Core 相对稳定；
- 同一套 Agent Definition 需要跑在终端、后台任务和消息渠道；
- 团队能接受 TypeScript SDK，或者愿意通过 RPC 管理独立进程。

反过来，如果项目高度依赖显式 Graph、强类型业务 State、复杂事务，或者 Pi 的 Session 与扩展模型无法表达核心需求，强行迁移只会把原来的代码变成一层更别扭的 Adapter。

功能多不多反而排在后面。它的边界要刚好接住项目里反复出现的那部分代码。

## 迁移可以先做四件事

不需要先把现有系统全部推倒。

### 先盘点，再留一组回归任务

沿用前一篇的分类，先给代码做个标记。

```text
Domain
Agent Definition
Channel
Runtime
Platform
```

优先寻找 Session、Context、Tool Event、模型配置、资源加载和流式处理中的重复实现。接着保存一组真实任务、Tool 调用轨迹、最终结果与失败案例。没有这组基线，迁移后只能凭「感觉差不多」判断质量。

### 把业务能力留在稳定边界之后

让 Runtime 调用稳定的 Business Tool 或 Domain API。别让它直接访问业务数据库，权限、事务与幂等都留在服务端。

### 选接入方式，也定好 Session Mapping

```text
同一 TypeScript 进程深度控制 → SDK
跨语言或进程隔离 → RPC
批处理与事件采集 → JSON Stream
```

飞书用户、群聊、话题或业务 Case 怎样对应 Pi Session，必须由宿主系统定义。不能简单把 Channel Message ID 当成所有状态的主键。

### 最后再搬 Skill、Extension 和 Package

```text
任务方法与项目说明 → Skill / Context File
新工具与生命周期钩子 → Extension
复用组合 → Package
用户入口与卡片交互 → Channel Adapter
全局调度与治理 → Control Plane
```

迁移是否成功，不能只看 Demo 回答是否正确。新建第二个 Agent 时复制的基础代码量，Session 恢复和长上下文的稳定性，Runtime 升级、Extension 安全审查与故障恢复的成本，这几项更能说明问题。最后再看业务团队是不是更集中地在交付 Role、Skill、Tool、Policy 与 Evaluation。

## 最后仍要回到边界

Agent Runtime 最容易被理解成那段不断调用模型和工具的 Loop，因为那是 Agent 最直观、也最有辨识度的部分。

Loop 外面的这些生命周期，才会把 Demo 和长期运行的软件分开。

```text
Session 怎样演化
Context 怎样投影
Tool 怎样执行
Event 怎样传播
资源怎样发现
能力怎样扩展
状态怎样恢复
宿主怎样接入
```

省掉一个 `while True` 没多少价值。少为每个 Agent Application 发明一遍这些规则，价值才会慢慢显出来。

Pi 也没替团队解决 Channel、业务事实、身份权限、企业调度和部署隔离。成熟的 Runtime 应该把边界做稳定。

> Runtime 负责让 Agent 可靠地运行；业务系统负责事实、规则与副作用；Control Plane 负责多个 Agent 的治理。

可以用一个很朴素的信号判断 Agent 工程有没有接近那个阶段。团队创建第二个、第三个 Agent 时，还会不会复制一套 Session、Context、Streaming 和 Tool Lifecycle。哪天大家默认复用稳定 Runtime，主要精力只放在角色、Skill、Tool、Policy 与评测上，很多东西才算真的沉淀下来了。

Pi 最后会不会成为那个通用答案，现在还不能确定。至少它已经把这条路铺出了一小段。可以拿真实项目去试，不必只停在架构图里。

---
## 参考资料

- [Pi SDK](https://pi.dev/docs/latest/sdk)
- [Pi RPC](https://pi.dev/docs/latest/rpc)
- [Pi Session Format](https://pi.dev/docs/latest/session-format)
- [Pi Compaction](https://pi.dev/docs/latest/compaction)
- [Pi Extensions](https://pi.dev/docs/latest/extensions)
- [Pi Agent Skills](https://pi.dev/docs/latest/skills)
- [Pi Packages](https://pi.dev/docs/latest/packages)
- [LangGraph Overview](https://docs.langchain.com/oss/python/langgraph/overview)
