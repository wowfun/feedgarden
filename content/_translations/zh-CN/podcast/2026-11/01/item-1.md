---
publish: true
content_type: "post"
title: "使用智能体处理长期金融工作 — Aman Singh, Arca"
description: "Arca 是一家 AI 原生公司，而非 SaaS 产品，已筹集 6400 万美元，用于构建与模型无关的智能体运行框架。该系统并非要取代人类顾问，而是让 AI 承担顾问周边的工作，客户也不会直接与智能体交互。人类顾问由始终在线的智能体提供支持，能够处理建议、规划、税务、保险、遗产等多种服务，适用于不同类型的客户。 平台根据任务复杂度分级进行路由，但顾问不会感知该分级。在模型选择上，主要使用 Claude，并测试过 Gemini、OpenAI 和 Luna。对于长期任务（例..."
date: "2026-10-31T16:00:00.000Z"
updated: "2026-11-02T16:09:49.392Z"
first_seen: "2026-11-01T16:42:58.793Z"
date_basis: "published"
feed_source: "podcast"
feed_source_id: "latent-space:01a18ea6-94fa-7850-937b-c5c57b469b6a"
source_url: "https://latent.space/p/arca"
tags: ["source/podcast","topics/agents","topics/personal-finance"]
---

Arca 是一家 AI 原生公司，而非 SaaS 产品，已筹集 6400 万美元，用于构建与模型无关的智能体运行框架。该系统并非要取代人类顾问，而是让 AI 承担顾问周边的工作，客户也不会直接与智能体交互。人类顾问由始终在线的智能体提供支持，能够处理建议、规划、税务、保险、遗产等多种服务，适用于不同类型的客户。

平台根据任务复杂度分级进行路由，但顾问不会感知该分级。在模型选择上，主要使用 Claude，并测试过 Gemini、OpenAI 和 Luna。对于长期任务（例如长达 10 天的报税案例），任务可以中断后恢复：恢复时会通过信号附加到线程或新智能体上，结合每个客户的记忆以及 "梦境"（dreaming）反思机制。涉及资金转移、清算或直接与客户沟通的操作必须有人类介入，其余分析工作则可自动化。安全措施包括护栏、每次写入的 LLM 验证、提示注入检测、模型与小模型共识结合确定性 PII 检查、全量操作日志、计算沙盒、对金融 PDF 的确定性与模型双重检查。名为 Jev 的组件负责强制执行严谨性并禁止自主交易。反馈修改必须说明理由，会进入评估或由元智能体提出建议，再经人工审核。公司对完全托管的智能体持谨慎态度，目前也未重点关注自动交易恢复。

此外，Arca 的 Orka 系统维护由专家整理的文件知识库，设有一等公民的 "Knowledge" 标签，智能体在回答时会引用这些文件，从而形成可追溯的反馈闭环。举例来说，系统发现一位客户原本服务的顾问收费 1500 美元且长期未响应，进一步查出该顾问存在隐性费用且并非受托 fiduciary。系统还会主动提醒截止日期，如所需最低分配（RMD）。这些机制表明，在受监管的金融环境中，状态持久、长期运行的智能体可以在明确的自主性限制下发挥作用。

根据取得的完整转录整理。

## 媒体

![音频: Latent Space: Using Agents for Long-Horizon Financial Work — Aman Singh, Arca](<https://podcasts.beehiiv.com/3967c1f2-cb97-4eb0-a5c0-21a1d2579408/01a15fdf-0e93-7e1a-880d-d73752a1f915/01a18ea6-9508-712c-b5ff-54536059aced/01a18eb9-7b8e-7f04-b56a-8580cdb8c207.mp3>)

[音频: Latent Space: Using Agents for Long-Horizon Financial Work — Aman Singh, Arca](<https://podcasts.beehiiv.com/3967c1f2-cb97-4eb0-a5c0-21a1d2579408/01a15fdf-0e93-7e1a-880d-d73752a1f915/01a18ea6-9508-712c-b5ff-54536059aced/01a18eb9-7b8e-7f04-b56a-8580cdb8c207.mp3>)
