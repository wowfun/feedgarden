---
publish: true
content_type: "post"
title: "LFM2.5-24-A2B holds up well in Pi Agent and runs fast on an AMD W7900"
description: "A user reported testing LiquidAI's LFM2.5-24B-A2B, saying the vendor claimed good performance and that they had positive experiences with previous releases. Normally the user runs Ornith 1.5-35B in several workflows, sometimes standalone..."
date: "2026-10-15T01:22:04.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x68qma/very_impressed_with_lfm2524a2b_in_pi_agent/"
tags: ["source/reddit","topics/models","topics/inference"]
---

A user reported testing LiquidAI's LFM2.5-24B-A2B, saying the vendor claimed good performance and that they had positive experiences with previous releases. Normally the user runs Ornith 1.5-35B in several workflows, sometimes standalone and sometimes as part of an AI-Council setup inside Pi Agent, describing it as reliable and as surfacing insight that larger models miss.

After swapping LFM 24B in for Ornith in a few workflows, the user said it held up well. Reported speed was about 95 tps sustained in llama.cpp using ROCm on an AMD W7900 with the latest llama.cpp build; the Q8 quant occupies 30GB of VRAM with a full 128K context. The user said it has not failed in mechanical tasks, keeps running through long recursive work, and suits running alongside a larger or smarter model on a second GPU. Longer testing is still needed before judging its "insight" in council-mode workflows, which the user plans to report on later.

This is a first-impression report: it is a single user's experience, with no benchmarks, task list, or comparison against the base model or Ornith beyond the speed figure.
