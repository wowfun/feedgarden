---
publish: true
content_type: "post"
title: "ARGUS：面向可靠用户模拟的议程驱动框架"
description: "高保真用户模拟器对于在交互环境中评估和训练智能体至关重要，但当前基于大模型的模拟器存在可靠性问题，例如遗漏目标和不遵守策略。ARGUS（Agenda-dRiven Goal-oriented User Simulator）是一个神经符号框架，它通过符号操作维护一个动态议程栈，以保存用户的目标状态。 通过将状态跟踪与自然语言生成严格解耦，ARGUS 能够实现严格的目标推进以及与约束一致的交互。为了便于低成本部署，作者用统一的流水线将其蒸馏为紧凑模型：先进行评测器引导的有监..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21346"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

高保真用户模拟器对于在交互环境中评估和训练智能体至关重要，但当前基于大模型的模拟器存在可靠性问题，例如遗漏目标和不遵守策略。ARGUS（Agenda-dRiven Goal-oriented User Simulator）是一个神经符号框架，它通过符号操作维护一个动态议程栈，以保存用户的目标状态。

通过将状态跟踪与自然语言生成严格解耦，ARGUS 能够实现严格的目标推进以及与约束一致的交互。为了便于低成本部署，作者用统一的流水线将其蒸馏为紧凑模型：先进行评测器引导的有监督微调，再进行带有密集步骤级奖励的在线强化学习。

为了更严格地评估行为保真度，作者提出了基于评分标准的指标 Composite Behavioral Score（CBS）。在 tau^3-Bench 和 MultiWOZ 上的评估表明，ARGUS 架构具有显著优势，训练流水线也行之有效。作者表示代码和数据将很快发布。
