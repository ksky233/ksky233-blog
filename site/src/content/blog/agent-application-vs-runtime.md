---
title: "都是飞书里的 Agent：自建 Agent 应用，还是复用通用 Runtime？"
description: "同样接入飞书，独立 Agent Service 与 Hosted Workspace Runtime 对应着两套不同的工程交付方式。"
pubDate: 2026-09-08
originalDate: 2026-09-07
reviewedDate: 2026-09-08
contentStatus: current
series: "Agent 工程形态"
seriesOrder: 1
category: "Agent 工程范式"
tags:
  - Agent
  - Agent Application
  - Agent Runtime
  - LangGraph
  - Pi
featured: true
draft: false
heroImage: "/images/agent-application-vs-runtime-spacious.png"
---

> 从用户视角看，它们可能都是一个飞书机器人；从工程视角看，一边交付的是完整 Agent Service，另一边交付的是通用 Runtime 上的 Workspace、Skill 与能力绑定。

## 我在实习中看到的，不是“把 Agent 塞进业务系统”

第一次参与企业 Agent 项目时，我接触到的组织方式是：Agent 团队相对独立，自己开发一套 Agent 应用。

这套应用通常使用 LangChain、LangGraph 等框架，自己维护 Prompt、Graph、State、Tool 和业务接口，最终再接入飞书机器人。用户在飞书里发消息，后端 Agent Service 接收请求、恢复会话、执行模型和工具，再把结果流式返回。

它不是 CRM、财务系统或其他已有业务应用中的一个内嵌功能。Agent Service 本身就是一套独立应用。

典型链路更接近：

```text
飞书机器人
    ↓
Channel Adapter / Agent API
    ↓
Standalone Agent Application
├── LangGraph / LangChain
├── Agent Graph / Factory
├── Session / State / Memory
├── Tool Integration
└── Streaming / Observability
    ↓
Business API / Domain Systems
```

再看 Pi 一类 Coding Agent Runtime，会发现另一种工程思路：通用 Runtime 已经能够运行 Agent，团队在上面装配 Workspace、Skill、Session 和 Tool Binding，不必为每个项目都开发一套完整 Agent Service。

```text
飞书机器人
    ↓
Agent Platform / Gateway
    ↓
Hosted Workspace Runtime
├── Pi / Other Harness
├── Workspace / Instructions
├── Skills / Extensions
├── Session / Context
└── Tool Bindings
    ↓
Business API / Domain Systems
```

两边都可以独立部署，也都可以通过飞书服务员工。它们的区别不在“嵌入业务应用还是部署到服务器”，而在团队最终交付什么：

> **团队是在开发一套 Agent 应用，还是在通用 Agent Runtime 上装配一个 Agent？**

## 先补上容易混淆的第三种形态

企业 Agent 实际上至少有三种常见工程形态：

```text
Agent 是否属于已有业务或产品应用的一项内部能力？
│
├── 是
│   └── Application-Embedded
│
└── 否，Agent 独立部署
    │
    ├── 团队自建完整 Agent Service
    │   └── Standalone Code-defined Agent Application
    │
    └── 团队复用通用 Runtime 与平台
        └── Hosted Workspace Runtime
```

`Application-Embedded` 指 Runtime 作为 SDK 或进程内组件进入已有 CRM、客服系统或 SaaS 产品。它是一种真实而且常见的形态，但不是本文要比较的重点。

本文关注后两种，因为它们都独立部署、都可能接入同一个飞书机器人，却对应完全不同的 Agent 交付方式。

## 路线一：开发一套 Standalone Agent Application

Standalone Code-defined Agent Application 指团队以 Agent 为主要产品目标，独立开发和部署一套服务。

它通常包含：

```text
Standalone Agent Application
├── Channel Adapter
├── API / Auth
├── Agent Framework / Runtime SDK
├── Agent Factory / Graph
├── Session / State / Memory
├── Queue / Scheduler
├── Tool Integration
├── Streaming Protocol
└── Observability / Evaluation
```

这里的 `Code-defined` 不是“所有东西都从 while 循环开始手写”。LangChain、LangGraph 和各种 Agents SDK 已经提供了模型调用、工具循环、Graph、Middleware、Checkpointer 等能力。

这里的关键是：**Agent 的主要定义和运行方式最终由这套 Agent Service 的代码负责交付。**

团队需要决定：

- Agent Graph 怎样组织；
- State 中保存哪些字段；
- Session 怎样与飞书用户或群聊关联；
- Tool 如何注册和获得用户身份；
- Streaming 如何转换成飞书卡片；
- 模型调用失败后如何重试；
- 服务如何部署、扩容和监控；
- 新版本如何灰度和回滚。

### LangGraph 解决了什么，又没有解决什么

LangGraph 很适合表达一个 Agent 应用内部的状态流转。

例如销售资料助手可以被明确建模为：

```text
识别客户
→ 查询内部资料
→ 搜索外部信息
→ 检查证据完整性
→ 生成客户简报
→ 人工确认
```

每个节点可以读取和更新统一 State；Checkpointer 可以保存执行状态；条件边可以决定继续搜索、重新生成还是进入人工审核。

但有了 Graph，不等于完整 Agent 应用自动出现。飞书接入、用户身份、Session Mapping、业务 Tool、权限、队列、部署、日志和告警，仍然需要团队自己组织。

当只有一个 Agent 项目时，这通常不是问题。框架给了团队足够大的自由度，业务体验也可以深度定制。

问题出现在企业陆续建设第二个、第三个、第五个 Agent Application 时：

```text
销售 Agent Service
采购 Agent Service
法务 Agent Service
运维 Agent Service
知识助手 Agent Service
```

它们的业务目标不同，外围代码却会越来越相似。飞书或 Web 接入、Session、模型与工具装配、Streaming、执行记录、部署和恢复，几套服务都得各自维护。

团队以为自己在持续开发不同业务 Agent，实际上也在不同仓库里重复维护 Agent Runtime Integration。

### 这种路线为什么仍然有价值

独立 Agent Application 并不过时。它特别适合：

- 需要复杂确定性 Graph；
- State 与业务流程强绑定；
- 需要完全自定义产品 API 和交互体验；
- 有严格的 SLA、并发和独立扩容要求；
- 面向外部客户交付专业 Agent 产品；
- 团队需要控制每个节点、每次状态变化和每种失败分支。

它的主要交付物是：

> **Agent Service Artifact。**

角色、流程、状态、Tool Integration 和运行治理都跟随这套服务演进。

## 路线二：复用 Hosted Workspace Runtime

另一条路线先建设一套可以反复承载不同 Agent 的通用 Runtime，再从这套基线上创建业务 Agent。

以 Pi 为例，模型—工具循环只是其中一层。它还提供 AgentSession、Session Tree、Compaction、Tool 与 Extension、Skill 与 Prompt Template，以及 Context 文件和 ResourceLoader。SDK、Headless RPC、事件流、取消和恢复接口也已经包含在内。

这些能力让 Pi 可以承担可复用的 Agent 执行内核，同时继续作为终端 Coding Agent 使用。

在这种形态中，一个销售资料助手更像下面这些资产的组合：

```text
Sales Agent
= Agent Identity
+ Workspace / Instructions
+ Sales Skills
+ CRM / BI Tool Binding
+ Session / Memory Scope
+ Runtime Profile
+ Access / Policy
```

团队的主要交付物随之变成：

> **Workspace + Skill + Capability Binding。**

Runtime 负责通用执行语义，业务团队继续提供销售规则、数据接口和权限边界。

### 只有 Runtime 还不够

把 Pi 以 RPC 或 SDK 方式运行起来，只解决了执行内核问题。

如果希望多个员工通过飞书使用多个 Agent，仍然需要上层能力：

```text
谁可以使用哪个 Agent？
消息属于哪个 Session？
任务应该去哪个 Runtime？
多个 Run 如何排队？
机器离线后怎么办？
Skill 如何发布？
执行结果在哪里审计？
```

这些问题更接近 Agent Control Plane。

Multica 提供了一个值得观察的组合样本：平台保存 Workspace、Agent、Skill、Chat、Issue 和 Run，连接机器上的 Daemon 领取任务并调用本地 Pi、Codex、Claude Code 等 Coding Agent 执行。

可以概括成：

```text
飞书 / Web / Event
→ Multica Agent / Chat / Issue / Run
→ Runtime Registry / Daemon
→ Pi Runtime
→ Workspace / Skill / Tool
→ Business Systems
```

Agent 团队不用再为每个业务助手分别建设 Channel、Run Queue、Runtime 状态和执行记录，可以把精力更多放在角色、Skill、Capability 与评测上。

### 这种路线的代价

复用 Runtime 仍然有工程成本。Workspace 与 Session 隔离、Skill 和 Extension 的版本管理、身份与 Credential 的传递，都需要团队重新设计。Runtime Host 的资源和安全边界、平台与企业服务器的数据边界，以及故障恢复时的外部副作用一致性，也不会自动解决。

而且通用 Runtime 的抽象未必适合每个业务。复杂 Graph、强类型 State、特殊交互协议和外部高并发产品，可能仍然更适合独立 Agent Application。

Hosted Workspace Runtime 要复用的是高度重复的执行外壳。业务 Agent 不会因此全部变成配置文件。

## 两条路线到底差在哪里

| 维度 | Standalone Agent Application | Hosted Workspace Runtime |
| --- | --- | --- |
| 部署方式 | 独立部署 | 独立部署 |
| 用户入口 | 飞书、Web、API、Event | 飞书、Web、API、Event |
| Runtime 来源 | LangGraph、LangChain、SDK 组成 Agent Service | 复用 Pi 等通用 Runtime / Harness |
| Agent 主要定义 | Graph、Factory、代码与服务配置 | Workspace、Instructions、Skill 与 Binding |
| 主要交付物 | Agent Service Artifact | Workspace + Skill + Capability Binding |
| Bot / API | 团队自己开发或集成 | Gateway / 平台复用 |
| Session / State | Agent Service 负责 | Runtime / 平台负责 |
| Workflow | 代码和 Graph 主导 | Runtime Loop、Skill 与 Tool 主导 |
| Runtime 治理 | 每套服务自行建设 | 平台统一复用 |
| 产品定制自由度 | 高 | 受 Runtime 与平台抽象约束 |
| 新角色上线 | 开发或配置后发布服务 | 创建 Workspace、绑定 Skill 与能力 |
| 典型优势 | 强定制、强状态、复杂流程 | 复用执行内核、角色快速装配、多入口共享 |
| 典型风险 | 多项目重复建设外围能力 | 平台复杂度、隔离与通用抽象限制 |

更深一层的变化，是团队拥有的软件边界变了：

```text
Standalone Agent Application
→ 团队拥有整套 Agent Service

Hosted Workspace Runtime
→ 平台拥有通用 Runtime
→ 业务团队拥有 Agent Definition 与 Capability
```

## “复用 Pi”究竟复用了什么

如果只把 Pi 理解成一个已经写好的 `while model → tool → model`，它与 `create_agent()` 的差异并没有那么大。

更值得复用的是 Loop 之外的长期工程能力：

```text
Session 生命周期
Context 构建与压缩
Tool 执行与事件
Workspace 资源发现
Skill / Extension 加载
模型和凭据适配
Headless 接口
执行取消与恢复
```

这些能力不直接属于销售、采购或法务业务，却会出现在几乎每个 Agent 项目里。

比较 LangGraph 和 Pi 谁更强，对这个问题帮助不大。更应该追问的是：

> 这部分能力应该继续由每个 Agent Application 自己拥有，还是沉淀为可以被不同 Agent 复用的 Runtime？

## 两条路线不是替代关系

真实企业系统很可能同时存在两种形态。

例如，一个 Hosted 销售 Agent 可以把“生成客户简报”交给 Skill 和通用 Runtime，但把“复杂授信评估”作为 Tool 调用一套独立 LangGraph Agent Service：

```text
Hosted Sales Agent
        ↓ Tool
Standalone Credit Analysis Agent Service
        ↓
Risk / CRM Domain Systems
```

外层 Runtime 负责多渠道入口、Workspace、Session 和通用任务执行；内层 Agent Application 负责复杂 Graph、强类型 State 和专业业务流程。

反过来也可以：独立 Agent Application 内部通过 Pi SDK 复用 AgentSession 和 Tool Runtime，同时保留自己的 API、Graph 和产品体验。

工程上更重要的是明确每一层由谁拥有，框架站队解决不了这个问题。

## 什么时候应该继续自建 Agent Application

如果下面大多数问题的答案是“是”，独立 Agent Application 通常更合适：

- 是否需要高度定制的产品体验和 API？
- 是否有复杂的确定性 Graph 与状态机？
- Agent State 是否与领域流程强绑定？
- 是否需要独立 SLA、扩容和故障域？
- 是否面向外部客户或高并发产品？
- 是否需要精确控制每个执行节点和失败分支？
- 通用 Runtime 是否无法表达核心流程？

这时团队开发的是一款以 Agent 为核心的业务软件，Bot 只是它的一个入口。

## 什么时候值得复用 Hosted Runtime

如果下面的特征越来越明显，通用 Runtime 的价值会迅速增加：

- 企业内部开始出现多个业务 Agent；
- 大量项目重复建设飞书、Session、Streaming 和 Tool 外壳；
- Agent 主要通过 Workspace、文档和 Skill 工作；
- 角色与 SOP 需要频繁更新；
- 多个 Agent 可以共享同一种 Runtime 基线；
- 业务能力已经有稳定 API、HTTP Client 或 MCP；
- 企业希望统一管理 Agent、Run、Runtime 和审计；
- 新增一个 Agent 不应该总是新建一个服务仓库。

此时继续复制 Agent Application，维护成本可能会逐渐超过业务差异本身。

## 回到飞书机器人

从员工视角看，两套系统没有那么大差别：

```text
打开飞书
→ 找到销售资料助手
→ 输入客户名称
→ 得到客户简报
```

但从工程团队视角看，它们分别代表两种交付方式：

```text
开发并运行一套 Agent 应用
vs
在通用 Runtime 上装配一个 Agent
```

前者提供最大自由度，后者争取最大复用度。

前者的核心资产是 Agent Service 代码，后者的核心资产是 Workspace、Skill、Capability 与它们的 Binding。

Coding Agent Runtime 之所以可能走出 IDE，是因为它们已经逐步形成 Session、Context、Tool、Workspace 和长任务执行等通用能力。「帮人写代码」只是这些能力当前最成熟的落点。

当然，这条路线仍处于快速发展阶段。Runtime 的兼容性、隔离、安全、Credential Binding 和故障恢复都还没有完全稳定。现在把所有独立 Agent Application 全部改造成 Hosted Workspace 并不现实，也没有必要。

现阶段，先识别重复部分比全面迁移更实际：

> 哪些代码真正属于业务 Agent，哪些代码只是每个团队都重新写了一遍的 Runtime 外壳？

边界清楚以后，Agent 团队才可能减少重复的服务外壳，把业务能力沉淀下来，再在稳定 Runtime 上装配不同 Agent。

---
## 参考资料

- [LangChain Agents](https://docs.langchain.com/oss/python/langchain/agents)
- [LangChain Runtime](https://docs.langchain.com/oss/python/langchain/runtime)
- [LangGraph Overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [Pi SDK](https://pi.dev/docs/latest/sdk)
- [Pi RPC Mode](https://pi.dev/docs/latest/rpc)
- [Pi Skills](https://pi.dev/docs/latest/skills)
- [Multica：How Multica works](https://multica.ai/docs/how-multica-works)
- [Multica：Daemon and runtimes](https://multica.ai/docs/daemon-runtimes)
