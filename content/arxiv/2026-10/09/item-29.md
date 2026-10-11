---
publish: true
content_type: "post"
title: "Caught in the Act: Probes Effectively Detect Sabotage and Catch Unverbalized Deception"
description: "Recent incidents highlight both the difficulty of monitoring LLM agents and the danger of models deceiving people. The authors show that white-box deception detection via probes can scale to frontier monitoring settings, using what they des"
date: "2026-10-08T17:58:13.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12445v1"
tags: ["source/arxiv","topics/security-privacy","topics/evaluation","topics/agents"]
---

Recent incidents highlight both the difficulty of monitoring LLM agents and the danger of models deceiving people. The authors show that white-box deception detection via probes can scale to frontier monitoring settings, using what they describe as the largest deception dataset to date for training probes, plus a new probe architecture that aggregates information across many layers and tokens.

The probes reach 98.8% AUC on SHADE-Arena, surpassing a text-monitoring baseline &#40;Opus 5.5&#41;, and their efficacy improves as the underlying model is scaled up. To probe their limits, the authors test cases where deception cannot be determined from context alone, termed introspective deception, where ground truth requires careful elicitation or thorough knowledge of a model's training data. In one such evaluation, probes distinguish transcripts containing a model's true hidden goal from other goals with an AUC of up to 99.7%.

The probes also detect deception in prominent open-weight models that lie about politically sensitive topics or about their beliefs under pressure. The authors release their training dataset, FIBS, to support frontier deployment of effective probes and invite the community to extend it with further examples of deception and sabotage.
