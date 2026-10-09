---
publish: true
content_type: "post"
title: "[2610.08927] AI 智能体能做出开放式科学发现吗？来自 Station 的证据"
description: "在给定明确指标时，AI 系统在科学发现方面进展迅速，但它们能否自主开展开放式科学发现仍不明确。该论文在 Station 这一开放世界环境中对此进行研究，其中多个智能体模拟一个科学生态系统。为应对开放式任务特有的挑战，作者为 Station 增加了两种机制：Supervisor 机制和周期性的 Meta Reflection，从而在缺乏中间指标时也能鼓励持续探索。 开放式任务由三篇近期 ICLR 口头报告论文构建。智能体被给予每篇论文所研究的主要研究问题，同时论文结果被隐匿且网"
date: "2026-10-09T13:26:15.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x1lbrm/261008927_can_ai_agents_make_openended_scientific/"
tags: ["source/reddit","topics/agents","topics/research"]
---

在给定明确指标时，AI 系统在科学发现方面进展迅速，但它们能否自主开展开放式科学发现仍不明确。该论文在 Station 这一开放世界环境中对此进行研究，其中多个智能体模拟一个科学生态系统。为应对开放式任务特有的挑战，作者为 Station 增加了两种机制：Supervisor 机制和周期性的 Meta Reflection，从而在缺乏中间指标时也能鼓励持续探索。

开放式任务由三篇近期 ICLR 口头报告论文构建。智能体被给予每篇论文所研究的主要研究问题，同时论文结果被隐匿且网络访问被禁用。作者随后测量智能体重新发现了多少原始发现——这些发现被拆分为一项项具体标准。Station 平均重新发现 62.7% 的标准，而 Codex Multiagent-v2 为 15.4%，AI Scientist-v2 为 14.4–20.6%。消融与行为分析表明，两种机制同时加入可提升研究的覆盖范围和连续性。

Station 还在两个没有对照论文的开放式任务上进行了评估；智能体做出的部分发现与研究人员在知识截止日期之后报告的发现高度吻合。作者得出结论：合适的环境可以让智能体在开放式科学发现中自主取得有意义的进展。

## 图片与视频

- [图片: &#91;2610.08927&#93; Can AI Agents Make Open-Ended Scientific Discovery? Evidence from Station](<https://external-preview.redd.it/q3evP6JeDpAC2MdSQHWYxnCYTqbJkElIQsLFqVSdkss.png?width=640&crop=smart&auto=webp&s=de730fbf7ecace6df0036b21470c16a2d4feacfb>)
