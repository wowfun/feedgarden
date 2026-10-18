---
publish: true
content_type: "post"
title: "Show HN：Stoke Money，以现金流预测为核心的个人理财应用"
description: "开发者 _wesley 发布了个人理财应用 Stoke Money。他此前用过 Personal Capital、Monarch 和 Copilot，但都觉得不够合适。他认为这些应用把每月“现金流”等同于当月交易的净额，而信用卡消费会立即记录，现金却通常要到下个月账单到期时才从支票账户扣除。这种时间差迫使他一直另用电子表格跟踪实际现金流。他也不喜欢以预算为中心的设计：自己的支出逐月差异很大，每月把自认为合理的支出与预算对比，再调整预算直到“过关”，这从来不适合他。 St..."
date: "2026-10-16T18:54:47.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://stoke.money/"
discussion_url: "https://news.ycombinator.com/item?id=50122776"
tags: ["source/hackernews","topics/personal-finance","topics/products","topics/security-privacy"]
---

## 正文提炼

开发者 &#95;wesley 发布了个人理财应用 Stoke Money。他此前用过 Personal Capital、Monarch 和 Copilot，但都觉得不够合适。他认为这些应用把每月“现金流”等同于当月交易的净额，而信用卡消费会立即记录，现金却通常要到下个月账单到期时才从支票账户扣除。这种时间差迫使他一直另用电子表格跟踪实际现金流。他也不喜欢以预算为中心的设计：自己的支出逐月差异很大，每月把自认为合理的支出与预算对比，再调整预算直到“过关”，这从来不适合他。

Stoke Money 保留账户、交易和分类等常规功能，核心却是现金流预测引擎，预算功能被取消。每个收入或支出类别根据历史活动向前推算，而不是套用固定的月度数字；预测结果会落到用户历史上使用的账户，例如工资、房租和账单走支票账户，日常消费走信用卡或借记卡。信用卡还款根据预测的卡内余额自动建模，用户还可以设置账户之间的周期性转账，例如为储蓄建模。

应用可以预测现金如何流动，让用户提前看到某个账户可能何时余额不足。作者写道，如果所有账户在未来 12 个月都看起来健康，也许就不存在预算问题。对他帮助最大的是 MCP 集成：他将其连接到 Claude，也可以连接其他 AI 智能体；他用它上传 PDF 对账单来导入历史交易、为度假期间的所有交易分类和打标签，并规划账户间转账以覆盖预期付款。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

在这批评论中，讨论主要围绕信任以及预测是否解决真实需求。一位评论者认为，钱花出去后就已经无法动用，支票账户晚些扣款并不改变他对现金流的看法。另一位表示，在安全实践得到外部验证前不会使用这款应用，并称加密访问令牌只是基本要求，而他用来比较的成熟产品拥有这类认证；开发者回应称目前没有 SOC 2，会把这一点说明清楚。还有人查询加州商业登记，未找到 “VoidHQ” 的记录，开发者解释这是单人项目，正在注册 LLC。

一位 GNUCash 用户描述了类似做法：提前 90 天设置周期性交易，并查看“未来最低余额”；但他表示，大约 30 个账户的月度对账仍非常耗时，其中许多账户没有 API。

评论来源：[chabska](https://news.ycombinator.com/item?id=50127938) · [freshnode](https://news.ycombinator.com/item?id=50123424) · [&#95;wesley](https://news.ycombinator.com/item?id=50123719) · [skinfaxi](https://news.ycombinator.com/item?id=50123720) · [&#95;wesley](https://news.ycombinator.com/item?id=50124864) · [jldugger](https://news.ycombinator.com/item?id=50125529)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50122776>)
