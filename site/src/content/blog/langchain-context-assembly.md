---
title: "LangChain 的上下文装配链路"
description: "以工单 Agent 为例，沿着 State、ModelRequest、中间件和模型适配器，追踪一次模型 HTTP 请求的输入如何形成。"
pubDate: 2026-10-18
originalDate: 2026-10-18
reviewedDate: 2026-10-18
contentStatus: current
series: "Context Engineering"
seriesOrder: 1
category: "Context 工程"
tags:
  - Agent
  - LangChain
  - LangGraph
  - Context Engineering
featured: true
draft: false
---

工单 Agent 保存了一份完整工单，聊天记录里却只有工具返回的简短摘要。员工接着说「把处理时间改到明天」，模型从哪里拿到当前工单？

答案藏在每次模型调用前的上下文装配里。图状态提供数据，中间件选择和加工内容，模型适配器再把消息与工具定义转换成供应商请求体。沿着这条链路看，动态 Prompt、历史裁剪和工具绑定就能放在同一张图里理解。

下面以 WorkOrderAgent 的工单流程为例，追踪 LangChain 到 DeepSeek OpenAI 兼容 Chat Completions 接口的调用路径。源码版本为 LangChain `1.4.6`、LangGraph `1.2.15`、langchain-core `1.6.11` 和 langchain-deepseek `1.1.1`。

## 从图状态到模型输入

一次模型调用大致经过这些环节：

```text
新输入 + thread_id + 后端运行上下文
    ↓ 恢复 Checkpoint，合并输入
当前图状态
    ↓ 模型节点读取消息和注册配置
ModelRequest
    ↓ 中间件生成动态 Prompt、裁剪历史、筛选工具
加工后的请求
    ↓ 工具绑定，组合系统消息与历史
模型适配器输入
    ↓ 序列化消息、工具 Schema 和调用参数
供应商请求体
    ↓ SDK 发出 HTTP 请求
模型响应
    ↓ 回填消息，执行工具，更新状态
下一次模型调用，或结束、暂停
```

这里有三个各司其职的对象：

| 对象 | 保存或组织什么 | 谁使用它 |
| --- | --- | --- |
| 当前图状态 | 消息、当前工单、计数等执行数据 | 图节点、工具和中间件 |
| `ModelRequest` | 本次消息、系统消息、候选工具，以及可读取的状态和运行上下文 | 模型调用中间件 |
| 供应商请求体 | `model`、`messages`、`tools`、采样和输出配置等协议字段 | 模型 API |

Checkpoint 保存图的执行快照。框架恢复快照、合并新输入，再按节点更新当前状态；`ModelRequest` 则在每次进入模型节点时重新创建。同一轮 Agent 执行调用模型三次，就会经历三次请求装配。

## 创建阶段定义结构，运行阶段提供数据

先看 Agent 的创建配置：

```python
agent = create_agent(
    model=model,
    tools=TOOLS,
    state_schema=WorkOrderState,
    context_schema=AssistantContext,
    checkpointer=checkpointer,
    middleware=[...],
)
```

`state_schema` 描述图状态的形状，`context_schema` 描述运行上下文的形状。模型、工具、中间件和 Checkpointer 一起确定执行结构。

员工的新消息在调用时传入。下面保留核心参数，省略流事件消费：

```python
agent.astream(
    {"messages": [HumanMessage(content="创建一张检查草稿")]},
    config={"configurable": {"thread_id": "员工ID:会话ID"}},
    context=backend_context,
    stream_mode=["messages", "updates"],
    version="v2",
)
```

`thread_id` 把本次执行关联到已有会话，Checkpointer 与执行框架恢复历史，新消息再按状态合并规则进入 `messages`。后端通过 `context` 提供身份、会话标识和业务依赖等运行信息。

工具定义来自创建时的注册配置。后续装配每次模型请求时，框架再把本次可用工具交给适配器。

## ModelRequest 把数据交给中间件

LangChain 的异步模型节点 `amodel_node` 中，核心代码如下，已省略其他配置字段：

```python
messages = _patch_invalid_tool_calls(state["messages"])
request = ModelRequest(
    model=model,
    tools=default_tools,
    system_message=system_message,
    messages=messages,
    state=state,
    runtime=runtime,
)
```

`messages` 来自当前图状态，`default_tools` 来自工具注册。中间件同时拿到 `state` 和 `runtime`，就能根据当前工单、员工身份或会话阶段调整本次请求。[LangChain 的上下文工程文档](https://docs.langchain.com/oss/python/langchain/context-engineering)也是围绕这些来源组织动态消息、工具和模型选择的。

| 字段 | 中间件可以做什么 | 交给适配器的内容 |
| --- | --- | --- |
| `system_message` | 生成或修改系统消息 | 系统消息内容 |
| `messages` | 选择、裁剪和编辑历史 | 本次消息序列 |
| `tools` | 选择本次可用工具 | 转换后的工具 Schema |
| `state` | 读取图状态，选择业务信息 | 显式写入消息等输入字段的部分 |
| `runtime` | 读取后端运行上下文 | 显式写入消息等输入字段的部分 |
| `model`、`model_settings` | 选择模型和调用配置 | 模型名称和适配后的调用参数 |

这也给出了判断模型可见内容的方法：沿着字段的使用路径往后追。员工身份存在 `runtime` 中时，先由程序使用；中间件把其中的姓名写进系统消息后，姓名才进入模型输入。

修改本次请求通常使用 `request.override(...)`。例如：

```python
return await handler(request.override(messages=trimmed_messages))
```

这会把裁剪后的历史交给后续处理。Checkpoint 中的历史由图状态更新路径维护，本次请求的裁剪可以和持久化历史分开处理。[自定义中间件](https://docs.langchain.com/oss/python/langchain/middleware/custom)提供了动态 Prompt、消息加工和工具选择等扩展点。

## 工单怎样从状态进入系统消息

WorkOrderAgent 的写入工具先调用业务 Service 保存工单，再回填图状态。下面是简化后的结构：

```python
return Command(
    update={
        "current_order": saved_order,
        "messages": [
            ToolMessage(
                content=json.dumps({"ok": True, "order": summary}),
                tool_call_id=runtime.tool_call_id,
            )
        ],
    }
)
```

这里同时保留两份用途不同的信息。`current_order` 保存完整工单快照；`ToolMessage` 保存本次调用结果的摘要，包括工单 ID、编号、状态和版本等字段。

下一次进入模型节点后，动态 Prompt 中间件读取完整快照：

```python
@dynamic_prompt
def work_order_prompt(request):
    now = datetime.now(ZoneInfo("Asia/Shanghai")).isoformat(timespec="minutes")
    saved = request.state.get("current_order")
    return (
        SYSTEM_PROMPT
        + f"\n当前北京时间：{now}"
        + f"\n当前工单：{json.dumps(saved, ensure_ascii=False)}"
    )
```

固定规则、当前时间和完整工单被组合成系统消息。随后消息窗口中间件处理 `request.messages`，裁剪本次需要的历史。于是，各类内容的去向就清楚了：

| 内容职责 | 工单 Agent 中的承载位置 |
| --- | --- |
| 固定业务指令 | `system_message` 的规则部分 |
| 当前工单与时间 | 同一条 `system_message` 的动态部分 |
| 历史对话与工具观察 | `messages` |
| 可调用能力及参数说明 | `tools`，随后转换成供应商工具定义 |

系统消息回答「当前业务对象是什么」，历史工具消息记录「刚才做了什么」。这样，每次更新工单都只向历史追加摘要，下一次调用再从状态中投影完整对象。即使较早的聊天被裁剪，当前工单仍然可以进入模型输入。

这份工单是最近一次可信读取或写入后的快照。外部系统修改工单后，后续业务操作仍需按版本检查并发冲突。

## 工具参数为什么能跟着 ainvoke 发出去

中间件加工完成后，`factory.py` 的 `_execute_model_async` 会执行：

```python
model_, effective_response_format = _get_bound_model(request)
messages = request.messages
if request.system_message:
    messages = [request.system_message, *messages]

output = await model_.ainvoke(messages)
```

最后一行只传了 `messages`，工具参数却已经在前面的 `_get_bound_model(request)` 中绑定好了。

普通工具路径会调用 `request.model.bind_tools(final_tools, ...)`。ChatDeepSeek 默认沿用父类实现，通过 `convert_to_openai_tool` 将工具转成协议定义，再绑定到模型调用参数。`RunnableBinding.ainvoke` 调用底层模型时会合并这些参数，所以工具 Schema 会和消息一起进入适配层。

`bind_tools` 返回的是带有调用参数的模型包装对象。工具名称、描述和参数 Schema 交给模型，函数实现留在应用侧，等模型返回 Tool Call 后再由工具执行层调用。

系统消息也在这里与历史组合：

```text
request.system_message + request.messages
    ↓
本次 ainvoke 的消息序列
```

在这条实现路径中，系统消息按次生成、按次拼接，持久化历史继续由 `state.messages` 管理。

## Provider 适配器生成 HTTP 请求体

沿着 ChatDeepSeek 的 OpenAI 兼容 Chat Completions 路径继续往下，消息对象最终会变成字典。ChatOpenAI 的 `_get_request_payload` 在这一分支的主要工作，可以缩成下面的逻辑：

```python
payload = {**self._default_params, **kwargs}
payload["messages"] = [
    _convert_message_to_dict(message)
    for message in messages
]
```

绑定的工具参数通过 `kwargs` 进入 `tools`。ChatDeepSeek 再对部分消息格式进行适配，SDK 根据载荷发送 HTTP 请求。非流式路径可以追踪到 `async_client.with_raw_response.create(**payload)`；流式路径同样先完成载荷装配，再按流式方式获取响应。

下面用占位工单展示请求体的形状，历史消息和工具列表已缩减：

```json
{
  "model": "deepseek-flash",
  "messages": [
    {
      "role": "system",
      "content": "固定业务规则；当前时间；当前工单 WO-DEMO，版本 4"
    },
    {
      "role": "user",
      "content": "把处理时间改到明天"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "find_equipment",
        "description": "查询设备",
        "parameters": {
          "type": "object",
          "properties": {"query": {"type": "string"}},
          "required": ["query"]
        }
      }
    }
  ],
  "temperature": 0
}
```

`messages` 和 `tools` 是请求体中的同级字段，共同组成模型完成任务所需的输入。系统提示词描述如何使用工具，`tools` 则提供可调用能力的名称、描述和参数结构。两部分各有用途。

Provider 适配器负责把 LangChain 对象转成对应接口的字段，SDK 负责将这些字段连同鉴权等传输信息组织成 HTTP 请求。追踪到这里，就能具体回答「本次模型输入里有哪些内容」。

## 用这条链路排查上下文问题

如果模型遗漏了当前工单，可以先看状态里有没有快照，再看动态 Prompt 是否读取了它，最后检查适配器输入中的系统消息。状态、请求加工和协议转换各有明确位置，定位起来比只看聊天记录更直接。

历史裁剪也可以分两处检查：`request.override(messages=...)` 控制本次输入；图节点或工具返回的状态更新控制后续保存的历史。排查「消息怎么没了」时，需要先明确丢的是哪一份。

长上下文还要核对预算范围。WorkOrderAgent 当前的窗口策略先扣除系统消息的估算 Token，再裁剪历史，工具 Schema 的开销需要另行计入完整输入预算。工单对象变大、工具数量增加时，这个差别会直接影响实际请求长度。

要复现一次旧请求，还需要保留当时的系统规则、工具定义、模型配置和相关外部数据。Checkpoint 能恢复执行状态，恢复后的模型请求会按当前代码、时间和配置重新装配。

最后还可以在中间件与 Provider 之间观察调用是否继续。中间件能够直接返回 `ModelResponse`，例如输入超过业务预算时提前结束本次处理；走到模型节点和实际发送 HTTP 请求之间，还隔着这条控制路径。

## 源码阅读入口

顺着下面的次序读，能把业务投影和框架装配连起来：

| 层次 | 文件或符号 | 重点看什么 |
| --- | --- | --- |
| 应用入口 | 项目的 `agent.py`、`service.py` | `create_agent` 配置、运行输入、`context` 与 `thread_id` |
| 工单回填 | 项目的 `tools.py` | `Command(update=...)` 中完整状态与结果摘要的分工 |
| 请求对象 | `langchain/agents/middleware/types.py` | `ModelRequest` 字段与 `override` |
| Agent 执行 | `langchain/agents/factory.py` | `amodel_node`、`_get_bound_model`、`_execute_model_async` |
| 参数绑定 | `langchain_core/runnables/base.py` | `RunnableBinding.ainvoke` 怎样合并参数 |
| 模型适配 | `langchain_deepseek/chat_models.py` | 工具绑定和消息格式处理 |
| 请求载荷 | `langchain_openai/chat_models/base.py` | 工具 Schema 转换、`_get_request_payload` 与 SDK 调用 |

## 参考资料

- [LangChain 上下文工程](https://docs.langchain.com/oss/python/langchain/context-engineering)
- [LangChain 自定义中间件](https://docs.langchain.com/oss/python/langchain/middleware/custom)
- [LangChain 工具](https://docs.langchain.com/oss/python/langchain/tools)
- [DeepSeek API 文档](https://api-docs.deepseek.com/)
