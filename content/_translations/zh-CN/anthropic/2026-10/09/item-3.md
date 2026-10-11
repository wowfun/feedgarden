---
publish: true
content_type: "post"
title: "推出面向开源软件的可选漏洞发现服务"
description: "Anthropic 的 Frontier Red Team 于 2026 年 10 月 8 日推出 OSS Scanner，这是一项面向开源项目、可选择加入的漏洞扫描服务。加入的项目可免费获得由 Anthropic 最强模型进行的定期安全扫描。团队表示，该服务借鉴了在 Project Glasswing 中使用 Claude 寻找漏洞的经验。 团队称语言模型的漏洞发现能力提升迅速：在学术性漏洞发现基准 CyberGym 上，LLM 的漏洞发现率从去年初的不足 20% 上升到今"
date: "2026-10-08T19:00:00.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:15.842Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/launching-opt-in-vuln-finding-service-for-open-source"
tags: ["source/anthropic","topics/security-privacy","topics/coding","topics/models"]
---

Anthropic 的 Frontier Red Team 于 2026 年 10 月 8 日推出 OSS Scanner，这是一项面向开源项目、可选择加入的漏洞扫描服务。加入的项目可免费获得由 Anthropic 最强模型进行的定期安全扫描。团队表示，该服务借鉴了在 Project Glasswing 中使用 Claude 寻找漏洞的经验。

团队称语言模型的漏洞发现能力提升迅速：在学术性漏洞发现基准 CyberGym 上，LLM 的漏洞发现率从去年初的不足 20% 上升到今年的 85% 以上。结果是，维护者收到的不再主要是噪声，而是高质量的缺陷报告。

过去六个月，Anthropic 用最新模型扫描了世界上一些最重要的软件项目，共发现超过 29,000 个候选漏洞，但人工仅审核并分诊了约 6,000 个，人力验证能力成为瓶颈。为此，不少维护者主动要求批量接收所有未验证报告及建议补丁；迄今为止，Anthropic 已应请求向维护者直接发送近 5,000 份报告，即使其中部分未经验证。团队指出，如今漏洞利用可在数分钟内开发完成，因此能更快发现并修复漏洞的项目，更容易在与争抢同一弱点的攻击者赛跑中占优。

OSS Scanner 的输出完全由模型生成，不经人工审核或分诊。这使扫描更快、更频繁，但也意味着报告可能有误或无效。报告来自 Anthropic 最强的模型，包括 Claude Mythos。每份报告包含自足的复现脚本、漏洞说明（在可能的情况下包含确定漏洞引入时间的二分定位），以及可用时的候选补丁。在与数十个开源项目进行数周流水线验证期间，首批披露包含数百份缺陷报告，其中若干漏洞可被串联成影响这些项目的未授权远程代码执行攻击。

人工验证报告的协调漏洞披露（CVD）流程仍在继续，尤其面向无力自行分诊的项目；同时新推出可选的快速通道，供希望一有报告就立即获取的项目使用。团队提到 Google 的 OSS-Fuzz 是灵感来源，并说明 OSS Scanner 与面向企业防御的通用代码扫描与修补产品 Claude Security 不同。文中引用的反馈包括 PostgreSQL 的 Noah Misch，他表示 OSS Scanner 的发现中揭示 PostgreSQL 缺陷的比例异常之高，其中几份报告附带的修复几乎可以直接使用，而快速通道让他们能在正式版发布前处理最新的问题。
