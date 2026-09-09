---
title: "一个飞书 Agent Service，到底有多少代码不属于业务？"
description: "沿着一条飞书消息的完整调用链，分清 Domain、Agent Definition、Channel、Runtime 与 Platform 的工程边界。"
pubDate: 2026-09-08
originalDate: 2026-09-08
reviewedDate: 2026-09-08
contentStatus: current
series: "Agent 工程形态"
seriesOrder: 2
category: "Runtime 工程"
tags:
  - Agent
  - Agent Service
  - Agent Runtime
  - LangGraph
  - 飞书机器人
featured: false
draft: false
heroImage: "/images/feishu-agent-service-layers.png"
---

> 用户只看到一个飞书机器人。代码仓库里却可能同时存在 Webhook、消息解密、身份映射、卡片更新、Session、State、模型适配、Tool Dispatch、异常处理、日志、配置和部署脚本。真正属于业务 Agent 的，到底是哪一部分？

## 一条消息背后的真实链路

从用户视角看，使用企业 Agent 的过程很短：

```text
在飞书里输入问题
→ 等待几秒
→ 收到一张结果卡片
```

例如销售问：

> 帮我整理这个客户的基本信息和最近跟进情况。

看起来，Agent 只需要理解问题、调用查询工具、整理答案。

但当我实际接触一套独立部署的 Agent Service 时，看到的调用链路更接近：

```text
飞书事件
→ 校验并解密请求
→ 识别用户、会话和消息
→ 判断事件类型与重复请求
→ 创建或更新飞书卡片
→ 恢复 Session 与历史状态
→ 组装模型、Prompt、Graph 和 Tool
→ 启动 LangGraph 流式执行
→ 处理模型消息和 Tool Call
→ 调用内部 API 或数据服务
→ 标准化 Tool Result
→ 更新 State 并继续执行
→ 整理最终答案
→ 转换成飞书卡片协议
→ 回写结果
→ 记录 Trace、耗时和异常
```

中间任何一步失败，用户看到的都可能只是：

> 助手暂时忙不过来了，请稍后再试。

这时我开始意识到：我们说自己在开发「销售 Agent」，但仓库中很大一部分代码并不解决销售问题，而是在保证 Agent 能接进系统、持续运行并处理异常。

## 先别急着计算百分比

标题问“到底有多少代码不属于业务”，最容易给出一个很抓眼球的答案：70%、80%，或者“Agent Loop 只占 5%”。

但如果没有对实际仓库做文件、提交和维护工时统计，这些数字都不诚实。

代码行数也不是最好的指标：

- 一段业务规则可能只有二十行，却需要长期由领域专家维护；
- 一套通用 Session 模块可能有数千行，但能服务多个 Agent；
- 一个飞书卡片 JSON 模板行数很大，认知复杂度却不一定高；
- 一个隐藏在中间件中的权限错误，风险可能高于整个 Agent Graph。

比计算百分比更有用的做法，是先按照**变化原因和生命周期**给代码分类。

```text
这段代码为什么会变化？
是谁要求它变化？
它应该跟业务一起发布，还是可以被多个 Agent 复用？
```

沿着这个问题，一套飞书 Agent Service 大致可以拆成四层。

## 第一层：业务能力

这一层回答的是：这个 Agent 为什么存在？

以销售资料助手为例，业务代码可能包括：

- 怎样识别客户或商户；
- 哪些销售数据对当前问题有意义；
- 不同岗位可以查看哪些数据；
- “最近跟进情况”如何定义；
- 哪些异常指标值得提醒；
- 客户简报应该包含哪些字段；
- 什么时候需要人工确认；
- 怎样调用 CRM、BI、订单或工单能力；
- 什么结果才算完成任务。

这些内容可以表现为：

```text
Domain Service
Business Tool
Policy
业务 Workflow
Evaluation Case
```

它们的变化通常来自业务规则、权限制度、数据口径和用户反馈，而不是因为模型 SDK 升级。

这一层不能被“通用 Agent Runtime”拿走。

Runtime 可以帮助 Agent 调用 `query_customer`，但不能替业务系统决定：当前用户是否有权查看某类客户信息，也不能把对话历史当成客户数据的权威来源。

## 第二层：Agent Definition

这一层决定 Agent 用什么方式完成业务目标。

例如：

- System Prompt；
- 场景和工具路由规则；
- Agent Graph；
- 可用 Tool 集合；
- 最大研究轮数；
- 输出结构；
- 何时追问用户；
- 何时结束；
- 何时进入人工审核；
- 使用什么模型和思考等级。

在 LangGraph 项目中，它经常表现为：

```text
State Schema
Nodes
Conditional Edges
Agent Factory
Tool Registration
Prompt / Configuration
```

这部分处在业务代码和基础设施之间，更像「业务目标在 Agent 系统中的表达方式」。业务变化会影响它，模型能力和 Runtime API 变化也会影响它。

例如，“销售助手要先判断场景，再在场景内选择工具”，既包含业务分类，也包含 Agent Orchestration。把它全部塞进 Domain Service 不合适，把它全部交给通用 Runtime 也不现实。

Agent Definition 通常需要由业务团队与 Agent 工程团队共同维护。

## 第三层：Channel 与产品外壳

飞书机器人不是一个简单的 HTTP 输入框。

一套完整接入通常需要处理：

```text
事件订阅
签名校验与消息解密
私聊、群聊和话题识别
用户身份映射
消息去重
回调响应时限
卡片创建与更新
流式文本转卡片增量
按钮与交互事件
错误状态展示
限流与重试
```

这些代码决定了产品能不能在飞书里使用，却几乎不包含销售知识。

换一个采购助手、法务助手或知识助手，大部分 Channel Adapter 仍然相似。

如果团队继续为每个 Agent Service 分别维护：

```text
lark_event_endpoint
lark_event_handler
card_renderer
message_updater
session_key_builder
```

那么项目数量增长时，飞书协议变化、卡片升级、错误处理和身份安全也要在多个仓库中同步修改。

这就是第一类容易重复的非业务代码。

它未必属于 Agent Runtime 内核，但应该沉淀为共享 Gateway、Channel Adapter 或产品平台能力。

## 第四层：Runtime Integration

Runtime Integration 是最容易和“Agent 业务逻辑”混在一起的部分。

它通常包含：

### 1. 模型与执行循环

```text
Model Provider 初始化
模型参数与凭据读取
调用模型
识别 Tool Call
执行 Tool
追加 Tool Result
判断继续或结束
处理模型错误和重试
```

如果使用 LangChain `create_agent()`，标准模型—工具循环已经由框架提供。使用 LangGraph 时，团队也可以通过 StateGraph、节点和边控制执行，不需要真的从一个 `while True` 开始。

所以 `Code-defined Agent` 不等于“手写 Agent Loop”。

即使 Loop 已经由框架提供，整套服务仍然需要决定它怎样与 Session、用户、Channel、Tool、State 和部署环境结合。

### 2. Session 与 Context

```text
用户 / 群聊 / 业务 Case 对应哪个 Session？
Session 保存在内存、Redis 还是数据库？
服务重启后怎样恢复？
历史消息怎样进入本轮 Context？
工具结果是否完整进入上下文？
Context 超长后怎样压缩？
新会话与继续会话如何区分？
```

LangGraph 的 Checkpointer 可以持久化 Graph State，并支持中断和恢复。但业务应用仍要提供 thread 标识、存储配置，以及 Channel 会话到 Graph Thread 的映射。

框架解决的是执行原语，应用仍要定义真实系统中的 Session 边界。

### 3. Tool Runtime

一个 Tool 不只是一个 Python 函数。

正式环境还需要：

```text
Schema 校验
动态工具筛选
用户与租户身份透传
权限检查
Timeout
Retry
错误分类
结果截断
敏感信息过滤
副作用等级
幂等键
审计记录
```

LangChain 已经支持工具序列调用、动态选择、错误处理和 Middleware，但 Tool 背后的身份、事务和业务不变量仍然需要应用自己接入。

### 4. Streaming 与事件

模型的 Token 流、Graph 的节点事件和飞书卡片更新不是同一种协议。

应用通常要完成这段转换：

```text
Model / Graph Event
→ 内部统一事件
→ 节流、合并和顺序控制
→ 飞书 Card Update
```

用户取消、同一 Session 的并发消息、Tool 执行进度、断线重连，也都挤在这层。最终消息要和增量消息一致，卡片更新失败时还得准备降级路径。

### 5. 运行、恢复和观测

```text
Trace ID
模型耗时与 Token
Tool 调用记录
节点执行轨迹
失败原因分类
重试次数
运行状态
结构化日志
指标与告警
配置与 Secret
容器与部署
```

这些东西不会让销售建议变得更专业，却决定系统出了问题以后能不能被定位、恢复和审计。

这就是第二类容易在 Agent Service 中重复出现的非业务代码。

## LangGraph 已经解决了很多，为什么还是会重复？

必须承认，今天的 LangGraph 已经不只是一个“画图工具”。

官方将它定位为面向长时间、有状态 Agent 的低层 Orchestration Framework 与 Runtime，提供 Durable Execution、Streaming、Human-in-the-loop、Persistence，以及对状态和执行流程的细粒度控制。

LangChain 的 `create_agent()` 也建立在 LangGraph Runtime 之上，并提供预构建 Agent Loop、Tool、Middleware 和状态扩展。

所以不能简单地说：

> LangGraph 什么都没提供，所以团队只能重复造轮子。

更准确的说法是：

> 框架提供了很多 Runtime Primitive，但每个独立 Agent Application 仍然要把这些原语装配成一套完整产品，并承担与 Channel、身份、业务 Tool、存储和部署的集成。

这种装配一开始是必要的，因为每个团队都要探索自己的边界。

当同一企业出现多个项目后，重复才会逐渐显现：

```text
项目 A：LangGraph + Redis + 飞书 + Tool Registry
项目 B：LangGraph + Redis + 飞书 + Tool Registry
项目 C：LangGraph + Redis + 飞书 + Tool Registry
```

它们可能使用同一个框架，却仍然各有一套 Session Mapping、Card Streaming、Model Configuration、Tool Lifecycle、Error Taxonomy、Deployment 和 Observability。

重复的不是 LangGraph 源码，而是围绕 LangGraph 建起来的 Agent Application Shell。

## 拿一个仓库，怎样判断哪些代码可以复用

可以对每个模块问四个问题。

| 问题 | 如果答案是“是” | 更可能属于 |
| --- | --- | --- |
| 换成采购 Agent 后仍然需要吗？ | 是 | Channel / Runtime / Platform |
| 飞书改成 Web 后还需要吗？ | 是 | Agent Definition / Runtime / Domain |
| 模型从 A 换成 B 后应该保持不变吗？ | 是 | Domain / Channel / Evaluation |
| 业务规则改变时必须一起修改吗？ | 是 | Domain / Agent Definition |

再按照主要变化原因分类：

| 分类 | 典型内容 | 主要变化来源 | 推荐所有者 |
| --- | --- | --- | --- |
| Domain | 数据口径、权限、事务、业务状态 | 业务规则 | 业务系统团队 |
| Agent Definition | Prompt、Graph、路由、输出和评测 | 业务目标 + 模型能力 | Agent 与业务团队 |
| Channel | 飞书事件、卡片、身份与回调 | 渠道协议和产品体验 | 接入层 / 平台团队 |
| Runtime | Loop、Session、Context、Tool Lifecycle、Event、Recovery | 模型与执行技术 | Runtime 团队 |
| Platform | Registry、Queue、调度、审计、发布与成本 | 企业治理 | 平台团队 |

如果一个模块同时回答多个问题，不要急着强制拆分。先明确哪个生命周期占主导，再通过 Port、Adapter、Hook 或协议降低耦合。

## 什么应该沉淀进通用 Runtime

当一项能力与销售、采购、法务等具体领域无关，又被多个 Agent 反复使用，就值得考虑从单个 Agent Application 中提取。尤其是那些生命周期稳定、需要统一错误语义、长期兼容 Session 数据，还要独立升级、测试和观测的能力。

典型候选包括：

```text
Agent Loop
Session Lifecycle
Context Projection / Compaction
Tool Dispatch 与事件
Streaming / Cancellation
Model / Provider Adapter
Retry / Recovery
Extension / Middleware Lifecycle
```

Pi 一类 Runtime 值得观察，模型—工具循环只是最里面的一部分。

Pi 的 `AgentSession` 还管理生命周期、消息历史、模型状态、Compaction 和 Event Streaming；ResourceLoader 可以加载 Skill、Extension、Prompt 与 Context 文件；SDK 和 RPC 又提供了可嵌入或无头运行的入口。

这些能力恰好对应多个 Agent Application 会反复遇到的问题。

## 什么不应该被 Runtime 吞掉

复用 Runtime 很容易走向另一个极端：把所有逻辑都塞进 Prompt、Skill 或通用 Tool。

用户是否有权访问数据，订单、客户和工单的权威状态，事务、幂等与业务状态机，都应该继续由业务系统拥有。不可逆操作的校验和审批、合规与领域不变量，以及最终成功标准，也不能跟着执行循环一起下沉。

一个 Runtime 可以决定下一步调用哪个 Tool，但不能因为模型说“可以”，就绕过业务系统的权限和状态约束。

合理的边界应该是：

> Runtime 接管通用执行语义，业务系统继续拥有事实、规则与副作用。

## 什么时候不值得抽象

并不是看到两段相似代码就应该建设平台。

下面这些情况继续维护独立 Agent Application 可能更合适：

- 企业当前只有一个主要 Agent；
- 产品交互和 State 高度定制；
- Graph 中包含大量确定性业务流程；
- 需要面向外部用户提供独立 SLA；
- 通用 Runtime 的抽象仍无法覆盖核心需求；
- 团队还没有验证真实重复点；
- 平台团队的治理成本会高于复用收益。

第一个 Agent 项目往往需要探索。过早抽象会把尚未理解的问题冻结成平台 API。

更合理的信号通常出现在第二个和第三个项目：

```text
当新 Agent 的第一周，
团队又开始复制 Session、飞书、Streaming、Tool、日志和部署代码，
就应该停下来重新画边界。
```

## 一份可执行的 Agent Service 盘点表

准备复盘现有代码时，可以按下面的顺序进行。

### 第一步：画真实调用链

不要只画：

```text
用户 → Agent → Tool
```

要把入口、身份、Session、State、Streaming、Tool、回写、异常和部署全部画出来。

### 第二步：给每个模块标记变化来源

```text
D：Domain
A：Agent Definition
C：Channel
R：Runtime
P：Platform
```

一个模块允许有两个标签，但要写清主标签。

### 第三步：寻找跨项目重复

不要只看函数名是否相同，要看它们是否承担相同生命周期。例如把用户映射到 Session、把 Graph Event 转成渠道消息、处理 Tool 超时和错误分类、恢复执行状态，或者管理模型与凭据。

### 第四步：决定下沉位置

```text
渠道相关 → Gateway / Channel Adapter
执行相关 → Agent Runtime
全局治理 → Control Plane
业务事实 → Domain Service
```

### 第五步：保留替换边界

即使当前不建设通用 Runtime，也可以先定义：

```text
Runtime Port
Capability Adapter
Session Contract
Event Contract
Identity Context
```

这样未来替换框架或复用 Pi 时，不必把业务代码一起推倒。

## 最后看一眼那条调用链

一个飞书 Agent Service 到底有多少代码不属于业务？

没有审计仓库之前，我不会给出一个漂亮但虚假的百分比。

用户最容易看到的是 Agent 的回答，开发者也容易先注意 Graph 和 Tool。可在实际仓库里，占据大量工程时间的往往是那层执行外壳，它要让 Agent 接得进来、跑得下去，出错后还能恢复和排查。

这层外壳很有价值，它是 Agent 从 Demo 变成软件的必要部分。问题在于是否要让每个项目都维护一份。

> 它应该继续复制在每一个 Agent Application 里，还是逐步成为可以被多个 Agent 复用的 Runtime 和平台能力？

当企业只有一个 Agent，这个问题并不紧迫。

等到第二个、第三个 Agent Service 开始复制相同代码，这个问题就不能再绕过去了。

---
## 参考资料

- [LangGraph Overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangChain Agents](https://docs.langchain.com/oss/python/langchain/agents)
- [LangChain Middleware](https://docs.langchain.com/oss/python/langchain/middleware/overview)
- [Pi SDK](https://pi.dev/docs/latest/sdk)
- [Pi Compaction](https://pi.dev/docs/latest/compaction)
