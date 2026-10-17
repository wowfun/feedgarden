---
publish: true
content_type: "post"
title: "AdaRSI: On-Demand Recursive Self-Improvement for Embodied Agents"
description: "Pretrained vision-language-action models (VLAs) often fail midway through unseen long-horizon tasks. Recursive self-improvement (RSI) offers a remedy, but embodied RSI methods either refine the harness around a frozen executor - and so c..."
date: "2026-10-14T16:51:09.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:35.641Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20474v1"
tags: ["source/arxiv","topics/agents","topics/hardware","topics/models"]
---

Pretrained vision-language-action models &#40;VLAs&#41; often fail midway through unseen long-horizon tasks. Recursive self-improvement &#40;RSI&#41; offers a remedy, but embodied RSI methods either refine the harness around a frozen executor - and so cannot add a missing motion - or train the executor on persistent failures without asking whether a failure lies in how the executor is called or in what it can do.

The paper asks when a self-improving embodied system should change the weights of its executor, and proposes AdaRSI, an on-demand RSI framework. A coding agent first improves its skills and harness, then attributes persistent failures by retrying failing sub-steps from saved states, and fine-tunes only the sub-steps that remain unreliable, using demonstrations it collects itself and experience carried over from earlier tasks.

On all 50 target tasks of RoboCasa365, with GR00T N1.5 as the executor and no human demonstrations, AdaRSI improves the VLA on all three suites and raises success on unseen composite tasks from 4.6% to 13.8%. Compared with fine-tuning every sub-step, it reaches slightly higher success while using only 28% of the GPU time and 22% of the self-collected demonstrations. Fine-tuning without a harness trains more yet gains far less.
