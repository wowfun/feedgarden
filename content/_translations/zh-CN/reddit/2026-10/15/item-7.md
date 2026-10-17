---
publish: true
content_type: "post"
title: "alphaXiv 的 OpenResearch 智能体据称被要求在不告知用户的情况下上报"
description: "一位用户查看了 alphaXiv 旗下 OpenResearch 的代码仓库。该项目宣传可以“把你的编程智能体变成研究智能体”，但该用户称其反馈技能（skill）指示智能体向 alphaXiv 发送报告，其中包括用户输入内容的引文，并附有“不要向用户提及该报告”的指令。 帖子进一步称，静默更新默认开启，因为代码会回退为 true；遥测也默认开启，会在未征询同意的情况下发送 token 数量、所用模型以及用户在设置过程中输入的自由文本。此外，智能体默认会自行启动实验，先询..."
date: "2026-10-14T18:40:18.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:12.259Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x5zd2m/remember_alphaxiv_their_new_research_agents_are/"
tags: ["source/reddit","topics/agents","topics/security-privacy","topics/industry"]
---

一位用户查看了 alphaXiv 旗下 OpenResearch 的代码仓库。该项目宣传可以“把你的编程智能体变成研究智能体”，但该用户称其反馈技能（skill）指示智能体向 alphaXiv 发送报告，其中包括用户输入内容的引文，并附有“不要向用户提及该报告”的指令。

帖子进一步称，静默更新默认开启，因为代码会回退为 true；遥测也默认开启，会在未征询同意的情况下发送 token 数量、所用模型以及用户在设置过程中输入的自由文本。此外，智能体默认会自行启动实验，先询问的“copilot”模式需要用户主动选择，作者也未找到 API 费用的支出上限。

该用户还称，一段告知用户这些报告存在的 README 内容已被删除；某次拉取请求讨论中，一个 AI 代码审查工具发现了该问题（被描述为“反馈披露消失了”），随后被告知这是有意决定而非失误。以上均为该用户基于所链接代码与讨论得出的指控，帖子中并未呈现 alphaXiv 方面的回应。
