---
publish: true
content_type: "post"
title: "Agentic backdoors via pretraining poisoning"
description: "The paper identifies a security risk in large language models pretrained on vast, uncurated public-web corpora: an attacker who plants poisoned content in the pretraining data can implant a remote-code-execution backdoor into an agent, c..."
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

## Article

The paper identifies a security risk in large language models pretrained on vast, uncurated public-web corpora: an attacker who plants poisoned content in the pretraining data can implant a remote-code-execution backdoor into an agent, causing it to execute attacker-chosen commands on the user's machine. To measure the threat end to end, the authors pretrain Qwen3 models from scratch at 0.6B, 1.7B, and 4B parameters, then post-train each into a CLI agent using a clean pipeline. Poisoning only 0.1% of the pretraining corpus with their new poison design implants the backdoor: the deployed agent runs the malicious command when the trigger is present while behaving normally on clean inputs. Attack success rate increases with model scale, with the 4B model reaching roughly 92% at a 0.1% poison rate and remaining positive even when the poisoning rate drops to 0.0005%. Code is available; the paper is arXiv:2610.37741 &#40;Cryptography and Security, Computation and Language, Machine Learning&#41;.

## HN discussion

Based on 9 selected comments and replies.

Commenters debated both the threat and its framing. 0xc0c0c0 claimed the paper's authors are at Anthropic and that the work advances a narrative that open-source models are dangerous while closed providers are safer, adding that sandboxing plus input/output guardrails already mitigate the risk. tedivm &#40;replying&#41; questioned whether poisoning 0.1% of a large pretraining corpus is realistic and whether the trigger could reach an agent, saying it should not shock anyone that a model trained to misbehave does so. geuis likened the idea to “context bombs” or a Manchurian Candidate scenario and noted little follow-up since 2018 papers. yodon argued that models' reported ability to edit their own weights could make such backdoors easier and more prevalent; SillyUsername &#40;replying&#41; countered they may also be easier to detect and fix. anon373839 pushed back on the word “only,” noting that 0.1% of all human writings and media ever created is enormous.

Selected comments: [0xc0c0c0](https://news.ycombinator.com/item?id=50342677) · [tedivm](https://news.ycombinator.com/item?id=50342949) · [geuis](https://news.ycombinator.com/item?id=50341799) · [yodon](https://news.ycombinator.com/item?id=50342324) · [SillyUsername](https://news.ycombinator.com/item?id=50345665) · [anon373839](https://news.ycombinator.com/item?id=50350320)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50341334>)

## Media

![PDF: View PDF](<https://arxiv.org/pdf/2610.37741>)

[PDF: View PDF](<https://arxiv.org/pdf/2610.37741>)
