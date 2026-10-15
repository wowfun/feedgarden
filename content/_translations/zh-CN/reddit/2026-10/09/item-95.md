---
publish: true
content_type: "post"
title: "ThinkingBox：智能体任务做对一次 vs. 20/20 全对：507 个有状态工作流按终端数据库状态评分 [R]"
description: "ThinkingBox 是一个基准，用来衡量智能体单次成功率在重复执行后还能保留多少，以及“智能体完成了任务”是否真的意味着后端数据库达到了正确状态。论文、代码、数据集以及 Hugging Face OpenEnv 环境均已公开，但原始评测轨迹未发布。 ThinkingBox-Bench 包含 507 个带策略条件的业务工作流，覆盖五个领域：零售、旅行与酒店、汽车保险、数字银行内部 IT，以及咨询 IT/HR。每个任务从相同的干净后端出发独立执行 20 次，因此每个模型..."
date: "2026-10-09T00:50:36.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x17shf/thinkingbox_solving_an_agent_task_once_vs_solving/"
tags: ["source/reddit","topics/agents","topics/evaluation"]
---

ThinkingBox 是一个基准，用来衡量智能体单次成功率在重复执行后还能保留多少，以及“智能体完成了任务”是否真的意味着后端数据库达到了正确状态。论文、代码、数据集以及 Hugging Face OpenEnv 环境均已公开，但原始评测轨迹未发布。

ThinkingBox-Bench 包含 507 个带策略条件的业务工作流，覆盖五个领域：零售、旅行与酒店、汽车保险、数字银行内部 IT，以及咨询 IT/HR。每个任务从相同的干净后端出发独立执行 20 次，因此每个模型共有 10,140 次试验。一个模拟用户持有私有上下文，只有在被询问时才会透露。评分将终端后端状态和副作用与要求的终态进行比对：只要结果正确，任何轨迹都算通过；结果错误、缺少或产生多余副作用则失败。507 个任务中有 477 个仅按状态评分，另外 30 个还会检查最终回复的某一狭窄属性。共报告三个指标：pass@1、pass@20 和 all-20，其中 all-20 是在固定试验预算下的观测计数，而非估计量。

“能发现”与“能重复”对模型的排序差异很大。Kimi-K3 的覆盖范围最广，至少有 93.89% 的任务被解决过一次（476/507），但只有 13.41%（68/507）在 20 次中全部成功。Claude Opus 5 发现的任务更少（79.09%），重复成功率却高得多（47.53%，即 241 个任务）。Qwen3.8-27B 至少成功一次的比例为 89.35%，每次全对的比例为 7.50%。按 pass@20 排名与按 all-20 排名，得到的排行榜几乎完全相反。

失败往往看起来很“干净”。在一项覆盖 12 个模型、121,680 次有效试验的回顾性消融中，有 79,853 次未通过可执行检查，其中 67.24% 仍然干净终止、调用了会改变状态的工具，并且结束时没有工具报错，因此仅看“是否完成”的替代指标会把它们判为完成。在这些干净终止的失败中，各类别相互重叠：字段值错误占 77.61%，非预期额外副作用占 43.30%，缺少必需副作用占 25.36%。

作者提醒：任务是企业工作流模式的合成重建，而非生产流量；试验预算下的 20/20 并不保证未来可靠性；模拟用户是固定的 LLM，这是方差的来源之一，附录中有讨论。失败类别是确定性的诊断标签，而非因果解释。任何人都可以通过 HF OpenEnv 环境用自己模型运行这 507 个任务。附录同时报告观测到的 all-20 计数和插件式 pass^k 估计，两者回答不同问题：前者记录固定 20 次试验中实际发生的情况，后者在额外假设下估计重复成功率。作者提问：可靠性排行榜上应强调哪一个，或两者都展示？

## 媒体

![图片: ThinkingBox: Solving an agent task once vs. solving it 20/20: 507 stateful workflows graded on terminal database state &#91;R&#93;](<https://external-preview.redd.it/q3evP6JeDpAC2MdSQHWYxnCYTqbJkElIQsLFqVSdkss.png?width=140&height=81&auto=webp&s=d39c4c208d55b26179446aa55ac5f84224359090>)

[图片: ThinkingBox: Solving an agent task once vs. solving it 20/20: 507 stateful workflows graded on terminal database state &#91;R&#93;](<https://external-preview.redd.it/q3evP6JeDpAC2MdSQHWYxnCYTqbJkElIQsLFqVSdkss.png?width=140&height=81&auto=webp&s=d39c4c208d55b26179446aa55ac5f84224359090>)
