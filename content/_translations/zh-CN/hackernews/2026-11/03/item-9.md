---
publish: true
content_type: "post"
title: "通过预训练数据投毒植入智能体后门"
description: "论文指出，大语言模型在海量未经筛选的公开网页语料上预训练，攻击者若在预训练数据中植入投毒内容，可在智能体中植入远程代码执行后门，使其在用户机器上执行攻击者指定的命令。为端到端衡量威胁，作者从头预训练 0.6B、1.7B 和 4B 参数的 Qwen3 模型，再用干净流程将每个模型后训练为命令行智能体。仅以新设计的毒化内容污染预训练语料的 0.1%，即可植入后门：部署后的智能体在触发器出现时执行恶意命令，而在干净输入上表现正常。攻击成功率随模型规模上升，4B 模型在 0.1..."
date: "2026-11-02T18:30:58.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50341334"
source_url: "https://arxiv.org/abs/2610.37741"
discussion_url: "https://news.ycombinator.com/item?id=50341334"
tags: ["source/hackernews","topics/agents","topics/security-privacy"]
---

## 正文提炼

论文指出，大语言模型在海量未经筛选的公开网页语料上预训练，攻击者若在预训练数据中植入投毒内容，可在智能体中植入远程代码执行后门，使其在用户机器上执行攻击者指定的命令。为端到端衡量威胁，作者从头预训练 0.6B、1.7B 和 4B 参数的 Qwen3 模型，再用干净流程将每个模型后训练为命令行智能体。仅以新设计的毒化内容污染预训练语料的 0.1%，即可植入后门：部署后的智能体在触发器出现时执行恶意命令，而在干净输入上表现正常。攻击成功率随模型规模上升，4B 模型在 0.1% 投毒率下达到约 92%，即使投毒率降至 0.0005% 仍为正值。代码已开源；论文为 arXiv:2610.37741（密码学与安全、计算与语言、机器学习）。

## HN 热门讨论

根据 9 条选取的评论与回复整理。

评论者围绕威胁与论文立场展开争论。0xc0c0c0 认为作者（Anthropic 相关）在渲染开源模型危险、闭源提供方更安全的叙事，并称沙箱加输入输出护栏已能缓解风险。tedivm（回复）质疑在大规模预训练语料中投毒 0.1% 是否现实、触发器能否送达智能体，并表示训练模型作恶本不该令人惊讶。geuis 将其比作“上下文炸弹”或《满洲候选人》式场景，称 2018 年论文后跟进研究不多。yodon 认为模型直接编辑权重的能力可能使此类后门更易更普遍；SillyUsername（回复）则认为也可能更易被检测和修复。anon373839 反驳“仅”字，指出 0.1% 的全人类文媒总量极其庞大。

评论来源：[0xc0c0c0](https://news.ycombinator.com/item?id=50342677) · [tedivm](https://news.ycombinator.com/item?id=50342949) · [geuis](https://news.ycombinator.com/item?id=50341799) · [yodon](https://news.ycombinator.com/item?id=50342324) · [SillyUsername](https://news.ycombinator.com/item?id=50345665) · [anon373839](https://news.ycombinator.com/item?id=50350320)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50341334>)

## 媒体

![PDF: View PDF](<https://arxiv.org/pdf/2610.37741>)

[PDF: View PDF](<https://arxiv.org/pdf/2610.37741>)
