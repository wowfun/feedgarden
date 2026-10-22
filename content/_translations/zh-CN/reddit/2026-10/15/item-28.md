---
publish: true
content_type: "post"
title: "LFM2.5-24-A2B 在 Pi Agent 中表现稳健，AMD W7900 上速度很快"
description: "一位用户分享了对 LiquidAI 的 LFM2.5-24B-A2B 的测试体验，表示官方宣称性能不错，而自己此前几代模型的使用体验也很好。该用户平时在多个工作流中使用 Ornith 1.5-35B，有时单独使用，有时作为 Pi Agent 内 AI-Council 配置的一部分，并称其可靠、能提供更大模型忽略的洞见。 在几个工作流中用 LFM 24B 替换 Ornith 后，用户表示其表现相当稳。速度方面，在 AMD W7900 上以 ROCm 运行最新版 llama..."
date: "2026-10-15T01:22:04.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x68qma/very_impressed_with_lfm2524a2b_in_pi_agent/"
tags: ["source/reddit","topics/models","topics/inference"]
---

一位用户分享了对 LiquidAI 的 LFM2.5-24B-A2B 的测试体验，表示官方宣称性能不错，而自己此前几代模型的使用体验也很好。该用户平时在多个工作流中使用 Ornith 1.5-35B，有时单独使用，有时作为 Pi Agent 内 AI-Council 配置的一部分，并称其可靠、能提供更大模型忽略的洞见。

在几个工作流中用 LFM 24B 替换 Ornith 后，用户表示其表现相当稳。速度方面，在 AMD W7900 上以 ROCm 运行最新版 llama.cpp，可持续约 95 tps；Q8 量化占用 30GB 显存，支持完整的 128K 上下文。用户称它在机械性任务中从未出错，长时间递归任务也能持续推进，适合与第二个 GPU 上的更大或更聪明的模型搭配使用。不过在 council 模式下判断其「洞见」能力仍需更长时间测试，用户表示之后再汇报。

需要说明的是：这只是初步体验报告，仅代表单一用户的使用感受，除速度数字外没有基准测试、任务清单或与基础模型及 Ornith 的对比。
