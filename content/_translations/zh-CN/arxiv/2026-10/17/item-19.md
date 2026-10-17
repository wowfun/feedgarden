---
publish: true
content_type: "post"
title: "Diviner：面向大规模基础设施的智能体式根因分析，具备人工治理的自适应能力"
description: "在大规模分布式系统中，根因分析（RCA）十分困难：同一症状可能跨越服务、数据、配置、计算和组织边界，响应人员必须拼凑不完整的证据，并协调各自掌握部分因果链的专家。作者指出，通用语言模型智能体仅靠工具访问并不能解决这一问题：它们可能使用过时或时机不对的上下文，把失败的查询理解为没有症状，报告证据不支持的系统状态，并使面向人类节奏设计的可观测性服务过载。 Diviner（Domain-Informed Verifiable Incident Navigation throu..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21281"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

在大规模分布式系统中，根因分析（RCA）十分困难：同一症状可能跨越服务、数据、配置、计算和组织边界，响应人员必须拼凑不完整的证据，并协调各自掌握部分因果链的专家。作者指出，通用语言模型智能体仅靠工具访问并不能解决这一问题：它们可能使用过时或时机不对的上下文，把失败的查询理解为没有症状，报告证据不支持的系统状态，并使面向人类节奏设计的可观测性服务过载。

Diviner（Domain-Informed Verifiable Incident Navigation through Evidence and Review）是 Meta 运行的智能体式 RCA 系统，围绕四阶段可靠性生命周期组织。Encode 阶段结合大量经审阅的事件语料与服务负责人的专业知识，生成有范围、带版本的技能、工作流、类型化工具和事件知识图谱。Execute 阶段使用自适应 Lead 与上下文隔离的 worker，将相关知识应用于某一时点的证据，并维护与证据关联的假设。

Evaluate 阶段将保存的调查轨迹与响应人员审阅过的结果进行比较，衡量精确原因、有用方向和 Groundedness。Adapt 阶段把反复出现的缺口和值班反馈转化为有针对性的运维知识更新，只有在重放、质量检查和负责人批准后才被接纳。
