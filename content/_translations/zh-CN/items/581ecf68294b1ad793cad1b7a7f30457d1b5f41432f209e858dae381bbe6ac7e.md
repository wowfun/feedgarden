---
publish: true
content_type: "post"
title: "开发者称在 RTS 智能体测试框架中 Sonnet 5.5 的规划能力不如 Sonnet 5"
description: "Reddit 用户 /u/coding_is_tedious 搭建了一个让智能体玩即时战略（RTS）游戏的测试框架：最初是想做一款真正的 RTS，后来对“智能体来玩”更感兴趣。该设置采用“指挥官”模式：脚本负责点击等即时决策，智能体则被周期性地调用，通过少数几个杠杆调整计划。由于通过 API 运行，作者为成本和速度选择了 Sonnet 5。 观察结果之一是：Fable 会自行制定策略，而 Opus 及更低档模型更倾向于照剧本执行。Sonnet 5 在给定种子计划（例如“训练重"
date: "2026-10-09T14:19:49.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1mmuq/sonnet_55_worse_at_planning_than_sonnet_5_in_rts/"
tags: ["source/reddit","topics/evaluation","topics/agents","topics/models"]
---

Reddit 用户 /u/coding&#95;is&#95;tedious 搭建了一个让智能体玩即时战略（RTS）游戏的测试框架：最初是想做一款真正的 RTS，后来对“智能体来玩”更感兴趣。该设置采用“指挥官”模式：脚本负责点击等即时决策，智能体则被周期性地调用，通过少数几个杠杆调整计划。由于通过 API 运行，作者为成本和速度选择了 Sonnet 5。

观察结果之一是：Fable 会自行制定策略，而 Opus 及更低档模型更倾向于照剧本执行。Sonnet 5 在给定种子计划（例如“训练重装步兵”）时会坚持该计划，不会有太多改动，至少看起来明白自己有任务目标。作者很期待测试 Sonnet 5.5，预期推理能力至少有部分提升。

但作者描述的是“倒退”：给出同样的计划后，Sonnet 5.5 表现“到处乱跑”，似乎不认为自己有任务，甚至像是忘了计划正被持续注入提示词。作者也指出一个反差：在 Fable 5.1 编排下，Sonnet 5.5 作为编码模型非常出色，能很好遵循计划，之后几乎不需要返工；框架最初几项测试本身也是阅读理解检查，用来确认模型是否理解收到的数据。

作者强调，考虑到变量众多，这一结果本身可能说明不了什么，而且所有东西都是用 Claude Code 构建的，有点像“盲人带着盲人”。该测试框架发布在作者账号下的 GitHub 仓库中。帖中没有给出量化的基准分数。
