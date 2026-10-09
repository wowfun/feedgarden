---
publish: true
content_type: "post"
title: "系统提示词 vs. 第一条用户提示词"
description: "在阅读 Claude 文档中的智能体示例“build a strong prompt”时，一位用户对推荐的结构感到意外：文档没有把全部信息放进系统提示词以区隔于对话，而是说 Claude 在把大部分提示内容写在第一条用户消息里时表现最佳，唯一例外是角色设定。该示例保留一个很短的 IDENTITY 系统提示词，把一百多行任务相关内容——固定问候语、车险与电动车险材料、示例以及额外防护规则——作为第一条用户消息附加其后，再接一条合成的助手回复“Understood”，然后才是真正"
date: "2026-10-09T09:07:38.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1gil3/system_prompt_vs_1st_user_prompt/"
tags: ["source/reddit","topics/coding","topics/agents","topics/research"]
---

在阅读 Claude 文档中的智能体示例“build a strong prompt”时，一位用户对推荐的结构感到意外：文档没有把全部信息放进系统提示词以区隔于对话，而是说 Claude 在把大部分提示内容写在第一条用户消息里时表现最佳，唯一例外是角色设定。该示例保留一个很短的 IDENTITY 系统提示词，把一百多行任务相关内容——固定问候语、车险与电动车险材料、示例以及额外防护规则——作为第一条用户消息附加其后，再接一条合成的助手回复“Understood”，然后才是真正的对话。代码中只有 IDENTITY 作为 system 参数传入，任务说明则成为消息内容。

发帖者询问该文档是否已经过时，随后补充了社区坚持保留系统提示词的理由：系统提示词的优先级高于用户提示词，如果模型无法区分系统指令与用户输入，任何人都可以让它去做与原本用途完全不同的事，模型也没有依据判断是否应遵循冲突指令。对客服类智能体尤为如此，客户不应能改变智能体的行为——发帖者指出，这一理由随着模型演进才成为主要动因，而非最初的设计意图。
